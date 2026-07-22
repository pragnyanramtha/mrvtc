"use server";

import { parseRoll, SEMESTERS, todayISO } from "@/lib/attendance-meta";
import { fetchAttendanceRows, resolveSection } from "@/lib/attendance-fetch";
import type { AttendanceResult, AttendanceSemester } from "@/types";

// Note: a "use server" module may only export async functions, so per-action
// runtime config (e.g. maxDuration) cannot live here. The first lookup for a
// branch may probe up to 8 sections; if Vercel's default function timeout is
// too short, raise it via vercel.json for this route.

interface Ok {
    success: true;
    data: AttendanceResult;
}
interface Err {
    success: false;
    error: string;
}

export async function getAttendance(rollNo: string): Promise<Ok | Err> {
    try {
        const parsed = parseRoll(rollNo);
        if (!parsed) {
            return { success: false, error: `Unrecognized roll number: ${rollNo}` };
        }

        const section = await resolveSection(parsed.branch, parsed.seq);
        if (!section) {
            return { success: false, error: "Could not locate this roll number in any section." };
        }

        const today = todayISO();
        const roll = rollNo.trim().toUpperCase();

        // Fetch all three semesters in parallel; each is an independent report.
        const perSem = await Promise.all(
            SEMESTERS.map(async sem => {
                const to = sem.to ?? today;
                const rows = await fetchAttendanceRows({
                    branch: parsed.branch,
                    section,
                    semesterApi: sem.apiValue,
                    from: sem.from,
                    to,
                });
                const row = rows.find(r => r.rollNo.toUpperCase() === roll);
                if (!row || row.held === 0) return null;
                const entry: AttendanceSemester = {
                    id: sem.id,
                    label: sem.label,
                    from: sem.from,
                    to,
                    attended: row.attended,
                    held: row.held,
                    percent: row.percent,
                };
                return { entry, name: row.name };
            }),
        );

        const semesters = perSem.filter((x): x is NonNullable<typeof x> => x !== null);
        if (semesters.length === 0) {
            return { success: false, error: "No attendance records found for this student." };
        }

        return {
            success: true,
            data: {
                rollNo: roll,
                name: semesters[0].name,
                branch: parsed.branch,
                section,
                semesters: semesters.map(s => s.entry),
            },
        };
    } catch (error: unknown) {
        console.error("Attendance error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
