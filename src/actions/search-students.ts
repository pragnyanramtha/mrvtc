"use server";

import Database from 'better-sqlite3';
import path from 'path';

export interface StudentSuggestion {
    rollNumber: string;
    fullName: string;
}

export async function searchStudents(query: string): Promise<StudentSuggestion[]> {
    if (!query || query.trim().length < 2) return [];

    try {
        const dbPath = path.join(process.cwd(), 'public', 'marks.db');
        const db = new Database(dbPath, { readonly: true });

        const q = query.trim().toUpperCase();

        // Match by name (LIKE) or roll number prefix/exact
        const stmt = db.prepare(`
            SELECT rollNumber, fullName
            FROM students
            WHERE UPPER(fullName) LIKE ?
               OR UPPER(rollNumber) LIKE ?
            ORDER BY fullName ASC
            LIMIT 10
        `);

        const rows = stmt.all(`%${q}%`, `%${q}%`) as StudentSuggestion[];
        db.close();
        return rows;
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}
