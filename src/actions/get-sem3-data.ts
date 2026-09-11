"use server";

import Database from 'better-sqlite3';
import path from 'path';
import { Sem3Result } from '@/types';
import splitups from '@/data/sem3-mid1-splitups.json';

const splitupByStudent = splitups as Record<string, Record<string, Record<string, number>>>;

type DbValue = number | string | null | undefined;

interface Sem3MarksRow {
    id: number;
    rollNo: string;
    courseCode: string;
    courseName: string;
    subjectType?: DbValue;
    mid1Marks?: DbValue;
    status?: string;
}

function toText(value: DbValue, fallback = '') {
    if (value == null) return fallback;
    const text = String(value).trim();
    return text || fallback;
}

export async function getSem3Data(rollNo: string) {
    try {
        const dbPath = path.join(process.cwd(), 'public', 'marks.db');
        const db = new Database(dbPath, { readonly: true });
        
        const stmt = db.prepare(`SELECT * FROM sem3_marks WHERE rollNo = ?`);
        const rows = stmt.all(rollNo.toUpperCase()) as Sem3MarksRow[];
        
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No Sem 3 data found for this roll number.' };
        }

        const mappedData: Sem3Result[] = rows.map(row => {
            const studentSplitups = splitupByStudent[row.rollNo.trim().toUpperCase()];
            const courseCode = row.courseCode?.trim().toUpperCase();

            return {
            rollNo: row.rollNo,
            courseCode: row.courseCode,
            courseName: row.courseName,
            subjectType: toText(row.subjectType),
            mid1Marks: toText(row.mid1Marks, '0'),
            status: row.status || null,
                splitup: courseCode ? studentSplitups?.[courseCode] : undefined,
            };
        });

        return { success: true, data: mappedData };
    } catch (error: unknown) {
        console.error("Database Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
