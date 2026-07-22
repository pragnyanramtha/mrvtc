// Pure mapping/config for the attendance feature. No I/O here.

/**
 * Roll numbers look like `25MV<CODE>R####`. The 3-letter <CODE> identifies the
 * branch. These full branch names are the exact strings the ERP API expects —
 * all confirmed by probing the live endpoint.
 */
export const BRANCH_BY_CODE: Record<string, string> = {
    CSE: "Computer Science and Engineering",
    ADS: "Computer Science and Engineering (Artificial Intelligence and Data Science)",
    CSM: "Computer Science and Engineering (Artificial Intelligence and Machine Learning)",
    CSD: "Computer Science and Engineering (Data Science)",
    CAI: "Computer Science and Engineering (Artificial Intelligence)",
    CSC: "Computer Science and Engineering (Cyber Security)",
    ICB: "Computer Science and Engineering (Internet of Things and Cyber Security including Block Chain Technology)",
    CST: "Computer Science and Information Technology",
    ECE: "Electronics and Communication Engineering",
    RAI: "Robotics and Artificial Intelligence",
};

export interface ParsedRoll {
    code: string;
    seq: number;
    branch: string;
}

/**
 * Parse `25MVCSER0001` → { code: "CSE", seq: 1, branch: "Computer Science..." }.
 * Returns null if the roll doesn't match the expected shape or the branch code
 * is unknown.
 */
export function parseRoll(roll: string): ParsedRoll | null {
    const m = /^(\d{2})MV([A-Z]{3})R(\d{3,4})$/.exec(roll.trim().toUpperCase());
    if (!m) return null;
    const code = m[2];
    const branch = BRANCH_BY_CODE[code];
    if (!branch) return null;
    return { code, seq: parseInt(m[3], 10), branch };
}

export interface SemesterConfig {
    id: "I" | "II" | "III";
    apiValue: string;
    label: string;
    from: string;
    /** to === null means "up to today" (current live semester). */
    to: string | null;
}

// Current live semester (batch 2025-2029, Year 2 Sem 1) started on this date.
export const SEM3_START = "2026-05-22";

/**
 * The three semesters this batch has data for. Past semesters use fixed
 * windows; the current semester runs from its start to today (resolved at
 * request time via `todayISO`).
 */
export const SEMESTERS: SemesterConfig[] = [
    { id: "I", apiValue: "I SEMESTER", label: "Year 1 · Sem I", from: "2025-06-01", to: "2025-12-01" },
    { id: "II", apiValue: "II SEMESTER", label: "Year 1 · Sem II", from: "2025-12-01", to: "2026-05-01" },
    { id: "III", apiValue: "III SEMESTER", label: "Year 2 · Sem I", from: SEM3_START, to: null },
];

/** Today's date as YYYY-MM-DD (server local time). */
export function todayISO(): string {
    return new Date().toISOString().slice(0, 10);
}
