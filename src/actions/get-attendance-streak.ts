"use server";

import { parseRoll, SEM3_START } from "@/lib/attendance-meta";
import { fetchDaywiseMarks, resolveSection } from "@/lib/attendance-fetch";
import type { AttendanceDay, AttendanceStreak, DayStatus } from "@/types";

// Note: "use server" modules may only export async functions, so runtime config
// (maxDuration) lives in vercel.json, not here.

const STREAK_DAYS = 15;

interface Ok {
    success: true;
    data: AttendanceStreak;
}
interface Err {
    success: false;
    error: string;
}

/** Local YYYY-MM-DD for `daysAgo` days before today. */
function isoDaysAgo(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
}

function statusFromMarks(marks: string[]): DayStatus {
    if (marks.length === 0) return "holiday";
    const present = marks.filter(m => m === "P").length;
    const absent = marks.filter(m => m === "A").length;
    if (present > 0 && absent === 0) return "present";
    if (absent > 0 && present === 0) return "absent";
    return "partial";
}

export async function getAttendanceStreak(rollNo: string): Promise<Ok | Err> {
    try {
        const parsed = parseRoll(rollNo);
        if (!parsed) {
            return { success: false, error: `Unrecognized roll number: ${rollNo}` };
        }

        const section = await resolveSection(parsed.branch, parsed.seq);
        if (!section) {
            return { success: false, error: "Could not locate this roll number in any section." };
        }

        const roll = rollNo.trim().toUpperCase();
        // Build the last STREAK_DAYS calendar dates (oldest → newest), but don't
        // reach before the current semester started.
        const dates: string[] = [];
        for (let i = STREAK_DAYS - 1; i >= 0; i--) {
            const date = isoDaysAgo(i);
            if (date >= SEM3_START) dates.push(date);
        }

        const days = await Promise.all(
            dates.map(async date => {
                try {
                    const rows = await fetchDaywiseMarks({
                        branch: parsed.branch,
                        section,
                        semesterApi: "III SEMESTER",
                        date,
                    });
                    const row = rows.find(r => r.rollNo.toUpperCase() === roll);
                    const marks = row?.marks ?? [];
                    const present = marks.filter(m => m === "P").length;
                    const absent = marks.filter(m => m === "A").length;
                    const day: AttendanceDay = {
                        date,
                        status: statusFromMarks(marks),
                        present,
                        absent,
                        total: marks.length,
                    };
                    return day;
                } catch {
                    // Fetch failed even after retries — report honestly as
                    // "unknown" rather than silently claiming a holiday.
                    const day: AttendanceDay = {
                        date,
                        status: "unknown",
                        present: 0,
                        absent: 0,
                        total: 0,
                    };
                    return day;
                }
            }),
        );

        return { success: true, data: { rollNo: roll, days } };
    } catch (error: unknown) {
        console.error("Attendance streak error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
        };
    }
}
