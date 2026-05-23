"use server";

import Database from 'better-sqlite3';
import path from 'path';
import { Sem2Result } from '@/types';

interface Sem2MarksRow {
    id: number;
    rollNo: string;
    courseCode: string;
    courseName: string;
    credits: number;
    mid1_presentation?: number;
    mid1_assignment?: number;
    mid1_objective?: number;
    mid1_subject?: number;
    mid1_total?: number;
    mid2_presentation?: number;
    mid2_assignment?: number;
    mid2_objective?: number;
    mid2_subject?: number;
    mid2_total?: number;
    externalMarks?: number;
    mid_total?: number;
    gradePoints?: number;
    grade?: string;
    status?: string;
    total?: number;
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
            credits: (row.credits || 0).toString(),
            mid1Total: (row.mid1_total || 0).toString(),
            mid2Total: (row.mid2_total || 0).toString(),
            mid1Presentation: (row.mid1_presentation ?? '').toString(),
            mid1Assignment: (row.mid1_assignment ?? '').toString(),
            mid1Objective: (row.mid1_objective ?? '').toString(),
            mid1Subject: (row.mid1_subject ?? '').toString(),
            mid2Presentation: (row.mid2_presentation ?? '').toString(),
            mid2Assignment: (row.mid2_assignment ?? '').toString(),
            mid2Objective: (row.mid2_objective ?? '').toString(),
            mid2Subject: (row.mid2_subject ?? '').toString(),
            midTotal: (row.mid_total || 0).toString(),
            externalMarks: row.externalMarks != null ? row.externalMarks.toString() : '',
            gradePoints: row.gradePoints != null ? row.gradePoints.toString() : null,
            grade: row.grade || null,
            status: row.status || null,
            total: row.total != null ? row.total.toString() : '',
        }));

        return { success: true, data: mappedData };
    } catch (error: unknown) {
        console.error("Database Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
