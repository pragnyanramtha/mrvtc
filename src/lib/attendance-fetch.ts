// Server-only: fetches attendance-report PDFs from the college ERP and resolves
// which section a roll number belongs to.
//
// TLS note: the ERP server (exambranch.mrtc.edu.in:8443) presents a valid leaf
// cert but omits its intermediate CA, so the chain can't be built by Node. The
// WHATWG `fetch` can't accept a custom TLS agent, so we use `node:https`
// directly with verification disabled for this single known host. The cert is
// legitimate (Sectigo DV) — only the chain delivery is broken.

import https from "node:https";
import { decodeAttendancePdf, decodeDaywisePdf, type DayMarksRow } from "@/lib/attendance-pdf";
import { todayISO } from "@/lib/attendance-meta";
import type { AttendanceRow } from "@/types";

const API_HOST = "exambranch.mrtc.edu.in";
const API_PORT = 8443;
const API_BASE = `https://${API_HOST}:${API_PORT}/erp-backend-adhikrit/api/v1`;
const CONSOLIDATED_PATH = "/dnrGeneralAttendanceReport";
const DAYWISE_PATH = "/daywiseAttendanceReport";

// Scoped to this one host whose cert chain is incomplete. Not applied globally.
// keepAlive reuses connections, which the ERP server handles better under bursts.
const insecureAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

interface ReportParams {
    branch: string;
    section: string;
    semesterApi: string;
    from: string;
    to: string;
}

function buildConsolidatedUrl({ branch, section, semesterApi, from, to }: ReportParams): string {
    const params = new URLSearchParams({
        program: "B.TECH",
        branch,
        batch: "2025-2029",
        semester: semesterApi,
        section,
        fromDate: from,
        toDate: to,
    });
    return `${API_BASE}${CONSOLIDATED_PATH}?${params.toString()}`;
}

interface DaywiseParams {
    branch: string;
    section: string;
    semesterApi: string;
    date: string;
}

function buildDaywiseUrl({ branch, section, semesterApi, date }: DaywiseParams): string {
    const params = new URLSearchParams({
        branch,
        course: "B.TECH",
        semester: semesterApi,
        batch: "2025-2029",
        date,
        section,
    });
    return `${API_BASE}${DAYWISE_PATH}?${params.toString()}`;
}

interface ApiEnvelope {
    success?: string;
    b64?: string | null;
}

function httpGetJsonOnce(url: string): Promise<ApiEnvelope> {
    return new Promise((resolve, reject) => {
        const req = https.get(
            url,
            {
                agent: insecureAgent,
                headers: {
                    accept: "application/json, text/plain, */*",
                    origin: `https://${API_HOST}`,
                    referer: `https://${API_HOST}/`,
                    "user-agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
                },
            },
            res => {
                const chunks: Buffer[] = [];
                res.on("data", c => chunks.push(c as Buffer));
                res.on("end", () => {
                    const status = res.statusCode ?? 0;
                    // The ERP server intermittently returns 5xx under burst load;
                    // treat non-2xx as retryable rather than as "no data".
                    if (status < 200 || status >= 300) {
                        reject(new Error(`attendance API HTTP ${status}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
                    } catch (e) {
                        reject(e);
                    }
                });
            },
        );
        req.on("error", reject);
        req.setTimeout(30_000, () => req.destroy(new Error("attendance API timeout")));
    });
}

/**
 * GET with retry. The ERP server flakes (5xx / dropped connections) especially
 * when several requests fire at once, so we retry with a small backoff. A
 * genuinely empty section still returns 200 with a valid PDF, so retries only
 * kick in on real transport/server errors — never masking real "no data".
 */
async function httpGetJson(url: string, tries = 4): Promise<ApiEnvelope> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < tries; attempt++) {
        try {
            return await httpGetJsonOnce(url);
        } catch (e) {
            lastErr = e;
            // Backoff: 200ms, 400ms, 600ms …
            await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error("attendance API failed");
}

/** Fetch and decode one consolidated attendance report into rows. Empty section → []. */
export async function fetchAttendanceRows(params: ReportParams): Promise<AttendanceRow[]> {
    const env = await httpGetJson(buildConsolidatedUrl(params));
    if (!env.b64) return [];
    const buf = Buffer.from(env.b64, "base64");
    return decodeAttendancePdf(buf);
}

/** Fetch and decode one day's day-wise report into per-student mark rows. */
export async function fetchDaywiseMarks(params: DaywiseParams): Promise<DayMarksRow[]> {
    const env = await httpGetJson(buildDaywiseUrl(params));
    if (!env.b64) return [];
    const buf = Buffer.from(env.b64, "base64");
    return decodeDaywisePdf(buf);
}

// Cache section → [minSeq, maxSeq] per branch, so we probe each branch's
// sections at most once per server instance.
const sectionCache = new Map<string, { section: string; min: number; max: number }[]>();
const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function seqOf(rollNo: string): number {
    const m = /(\d{3,4})$/.exec(rollNo);
    return m ? parseInt(m[1], 10) : NaN;
}

/**
 * Find which section a roll-number sequence belongs to. Section membership is
 * stable across semesters (it's keyed on the roll), so we probe using the
 * current-semester window. Probes A..H, stopping at the first empty section
 * (sections are contiguous and ascending). Result cached per branch.
 */
export async function resolveSection(branch: string, seq: number): Promise<string | null> {
    let ranges = sectionCache.get(branch);
    if (!ranges) {
        ranges = [];
        for (const section of SECTIONS) {
            const rows = await fetchAttendanceRows({
                branch,
                section,
                semesterApi: "III SEMESTER",
                from: "2026-05-22",
                to: todayISO(),
            });
            if (rows.length === 0) break; // no more populated sections
            const seqs = rows.map(r => seqOf(r.rollNo)).filter(Number.isFinite);
            ranges.push({ section, min: Math.min(...seqs), max: Math.max(...seqs) });
        }
        sectionCache.set(branch, ranges);
    }
    const hit = ranges.find(r => seq >= r.min && seq <= r.max);
    return hit ? hit.section : null;
}
