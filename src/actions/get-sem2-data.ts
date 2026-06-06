"use server";

import Database from 'better-sqlite3';
import path from 'path';
import { Sem2Result } from '@/types';

type DbValue = number | string | null | undefined;

interface Sem2MarksRow {
    id: number;
    rollNo: string;
    courseCode: string;
    courseName: string;
    credits: DbValue;
    mid1_presentation?: DbValue;
    mid1_assignment?: DbValue;
    mid1_objective?: DbValue;
    mid1_subject?: DbValue;
    mid1_total?: DbValue;
    mid2_presentation?: DbValue;
    mid2_assignment?: DbValue;
    mid2_objective?: DbValue;
    mid2_subject?: DbValue;
    mid2_total?: DbValue;
    externalMarks?: DbValue;
    mid_total?: DbValue;
    gradePoints?: DbValue;
    grade?: string;
    status?: string;
    total?: DbValue;
}

function toText(value: DbValue, fallback = '') {
    if (value == null) return fallback;
    const text = String(value).trim();
    return text || fallback;
}

function toNullableText(value: DbValue) {
    const text = toText(value);
    return text || null;
}

export async function getSem2Data(rollNo: string) {
    try {
        const dbPath = path.join(process.cwd(), 'public', 'marks.db');
        const db = new Database(dbPath, { readonly: true });
        
        const stmt = db.prepare(`SELECT * FROM sem2_marks WHERE rollNo = ?`);
        const rows = stmt.all(rollNo.toUpperCase()) as Sem2MarksRow[];
        
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No Sem 2 data found for this roll number.' };
        }

        const mappedData: Sem2Result[] = rows.map(row => ({
            rollNo: row.rollNo,
            courseCode: row.courseCode,
            courseName: row.courseName,
            credits: toText(row.credits, '0'),
            mid1Total: toText(row.mid1_total, '0'),
            mid2Total: toText(row.mid2_total, '0'),
            mid1Presentation: toText(row.mid1_presentation),
            mid1Assignment: toText(row.mid1_assignment),
            mid1Objective: toText(row.mid1_objective),
            mid1Subject: toText(row.mid1_subject),
            mid2Presentation: toText(row.mid2_presentation),
            mid2Assignment: toText(row.mid2_assignment),
            mid2Objective: toText(row.mid2_objective),
            mid2Subject: toText(row.mid2_subject),
            midTotal: toText(row.mid_total, '0'),
            externalMarks: toText(row.externalMarks),
            gradePoints: toNullableText(row.gradePoints),
            grade: row.grade || null,
            status: row.status || null,
            total: toText(row.total),
        }));

        return { success: true, data: mappedData };
    } catch (error: unknown) {
        console.error("Database Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
