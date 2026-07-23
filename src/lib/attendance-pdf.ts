// Pure-JS decoder that turns an attendance-report PDF (the only payload the ERP
// API returns) back into structured rows. Uses pdfjs-dist's legacy Node build so
// it runs on serverless (no native deps, no worker, no `pdftotext` binary).

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { resolve } from "node:path";
import type { AttendanceRow } from "@/types";

// Force pdfjs to use the vendored worker copy so the dynamic import() inside
// pdfjs-dist resolves against a real file on Vercel's serverless filesystem
// instead of chasing pnpm symlinks.
GlobalWorkerOptions.workerSrc = resolve(
    process.cwd(),
    "src/vendor/pdf.worker.mjs",
);

// Roll number may appear as its own cell OR glued to the name in a single cell
// (e.g. "25MVCSDR0271 A MANISH YADAV"), depending on the PDF's layout that day.
// So we match it anywhere in a cell, not anchored to the whole string.
const ROLL_RE = /\d{2}MV[A-Z]{3}R\d{3,4}/;
const MARK_RE = /^[A-Za-z]$/;
const ATT_HELD_RE = /^(\d+)\s*\/\s*(\d+)$/;
const PERCENT_RE = /^\d{1,3}(\.\d+)?$/;

interface Cell {
    x: number;
    s: string;
}

// Minimal shape we need from pdfjs text items (TextItem has more fields, and
// getTextContent can also return TextMarkedContent which we skip).
interface RawItem {
    str?: unknown;
    transform?: unknown;
}

/**
 * Group a page's text items into visual rows by their y-coordinate, then sort
 * each row left-to-right by x. pdfjs returns items in stream order (roughly
 * column-major), so this reconstructs the on-screen table layout.
 */
function itemsToRows(items: RawItem[]): Cell[][] {
    const buckets: { y: number; items: Cell[] }[] = [];
    for (const it of items) {
        if (typeof it.str !== "string" || !it.str.trim()) continue;
        if (!Array.isArray(it.transform)) continue;
        const x = it.transform[4] as number;
        const y = it.transform[5] as number;
        // Same visual line if within a few points vertically.
        const bucket = buckets.find(b => Math.abs(b.y - y) <= 3);
        if (bucket) {
            bucket.items.push({ x, s: it.str });
        } else {
            buckets.push({ y, items: [{ x, s: it.str }] });
        }
    }
    return buckets
        .sort((a, b) => b.y - a.y) // top of page first
        .map(b => b.items.sort((a, b) => a.x - b.x));
}

/**
 * Decode an attendance-report PDF buffer into rows.
 * Each data row is: [rollNo, ...nameParts, "attended/held", percent].
 */
export async function decodeAttendancePdf(pdf: Buffer | Uint8Array): Promise<AttendanceRow[]> {
    // pdfjs rejects Node's Buffer (a Uint8Array subclass), so copy into a plain
    // Uint8Array over the exact byte range.
    const data = new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength);
    const doc = await getDocument({
        data,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
    }).promise;

    const rows: AttendanceRow[] = [];
    try {
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();

            for (const row of itemsToRows(content.items as RawItem[])) {
                const cells = row.map(c => c.s.trim()).filter(Boolean);
                if (cells.length < 3) continue;
                const rollMatch = ROLL_RE.exec(cells[0]);
                if (!rollMatch) continue;

                const rollNo = rollMatch[0];
                const percentRaw = cells[cells.length - 1];
                const attHeldRaw = cells[cells.length - 2];

                const attMatch = ATT_HELD_RE.exec(attHeldRaw);
                if (!attMatch || !PERCENT_RE.test(percentRaw)) continue;

                const attended = parseInt(attMatch[1], 10);
                const held = parseInt(attMatch[2], 10);
                // Name may be trailing text glued into the roll cell plus the
                // middle cells between roll and attended/held.
                const rollRest = cells[0].slice(rollMatch.index + rollNo.length).trim();
                const name = [rollRest, ...cells.slice(1, cells.length - 2)]
                    .filter(Boolean)
                    .join(" ")
                    .trim();

                rows.push({
                    rollNo,
                    name,
                    attended,
                    held,
                    percent: parseFloat(percentRaw),
                });
            }
        }
    } finally {
        await doc.destroy();
    }

    return rows;
}

/** Per-student marks for a single day: one P/A letter per class period. */
export interface DayMarksRow {
    rollNo: string;
    marks: string[]; // e.g. ["P","P","A"] — one per period column
}

/**
 * Decode a day-wise attendance report. The table has N period columns (varies
 * per day) whose x-positions come from the header row after "Student Name".
 * Each student row carries one single-letter mark under each period column. We
 * align marks to columns by x-coordinate so name initials (e.g. "A SHIVA") are
 * not mistaken for an Absent mark — those sit in the name column, left of the
 * first period column.
 */
export async function decodeDaywisePdf(pdf: Buffer | Uint8Array): Promise<DayMarksRow[]> {
    const data = new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength);
    const doc = await getDocument({
        data,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
    }).promise;

    const out: DayMarksRow[] = [];
    try {
        // Collect every text cell with coordinates across all pages.
        const allRows: Cell[][] = [];
        for (let p = 1; p <= doc.numPages; p++) {
            const page = await doc.getPage(p);
            const content = await page.getTextContent();
            allRows.push(...itemsToRows(content.items as RawItem[]));
        }

        // Header row anchors the period columns: it contains "Student Name".
        const header = allRows.find(
            r => r.some(c => /Student/i.test(c.s)) && r.some(c => /Roll/i.test(c.s)),
        );
        if (!header) return out;
        const nameCell = header.find(c => /Name/i.test(c.s));
        const nameX = nameCell ? nameCell.x : 0;
        // Period columns = header cells to the right of the name column.
        const periodXs = header.filter(c => c.x > nameX + 5).map(c => c.x).sort((a, b) => a - b);
        if (periodXs.length === 0) return out;
        const firstPeriodX = periodXs[0];

        for (const row of allRows) {
            let rollNo: string | null = null;
            for (const c of row) {
                const m = ROLL_RE.exec(c.s);
                if (m) {
                    rollNo = m[0];
                    break;
                }
            }
            if (!rollNo) continue;
            // Candidate marks: single letters sitting in the period-column band.
            // (A merged "roll + name" cell is multi-char, so it won't match MARK_RE.)
            const markCells = row.filter(c => MARK_RE.test(c.s) && c.x > firstPeriodX - 20);
            const marks = periodXs.map(px => {
                let best: Cell | null = null;
                let bestDist = Infinity;
                for (const mc of markCells) {
                    const d = Math.abs(mc.x - px);
                    if (d < bestDist) {
                        bestDist = d;
                        best = mc;
                    }
                }
                // Only accept a mark reasonably close to the column center.
                return best && bestDist <= 24 ? best.s.toUpperCase() : "";
            });
            out.push({ rollNo, marks: marks.filter(Boolean) });
        }
    } finally {
        await doc.destroy();
    }

    return out;
}
