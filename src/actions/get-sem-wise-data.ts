"use server";

import Database from 'better-sqlite3';
import path from 'path';

interface Sem1MarksRow {
    id: number;
    rollNo: string;
    courseCode: string;
    courseName: string;
    credits: number;
    mid1_marks?: number;
    mid2_marks?: number;
    externalMarks?: number;
    mid_total?: number;
    gradePoints?: number;
    grade?: string;
    status?: string;
    total?: number;
}

export async function getSemWiseData(rollNo: string) {
    try {
        const dbPath = path.join(process.cwd(), 'public', 'marks.db');
        const db = new Database(dbPath, { readonly: true });
        
        const stmt = db.prepare(`SELECT * FROM sem1_marks WHERE rollNo = ?`);
        const rows = stmt.all(rollNo.toUpperCase()) as Sem1MarksRow[];
        
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No data found for this roll number.' };
        }

        let totalGradePoints = 0;
        let totalCredits = 0;
        
        for (const row of rows) {
            totalGradePoints += (row.gradePoints || 0) * (row.credits || 0);
            totalCredits += (row.credits || 0);
        }
        
        const calculatedCgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : "0.00";

        const mappedData = rows.map(row => ({
            batch: "2025",
            insertedDate: new Date().toISOString(),
            degree: "Major",
            branch: "Unknown",
            semester: "I SEMESTER",
            courseCode: row.courseCode,
            section: "A",
            rollNo: row.rollNo,
            examTitle: "SEM 1 EXAM",
            // internal = mid_total (mid1 + mid2 combined)
            internalMarks: (row.mid_total || 0).toString(),
            externalMarks: (row.externalMarks || 0).toString(),
            total: (row.total || 0).toString(),
            gradePoints: (row.gradePoints || 0).toString(),
            grade: row.grade || null,
            credits: (row.credits || 0).toString(),
            reg_credits: (row.credits || 0).toString(),
            sgpa: calculatedCgpa,
            cgpa: calculatedCgpa,
            course: row.courseName,
            status: row.status || "",
            moderationMarks: null,
            graftingMarks: null,
            totalMarks: (row.total || 0).toString(),
            reValuationMarks: null,
            reCountingMarks: null,
            publishingStatus: "Published",
            currentUserName: "",
            currentUserEmail: "",
            currentUploadDateTime: "",
            generakModerationMarks: null,
            // Sem1-specific granular mid marks
            mid1Marks: (row.mid1_marks || 0).toString(),
            mid2Marks: (row.mid2_marks || 0).toString(),
        }));

        const responseData = {
            "I SEMESTER": mappedData
        };

        return { success: true, data: responseData };
    } catch (error: unknown) {
        console.error("Database Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}
