import Database from "better-sqlite3";

const baseUrl = process.env.MRTC_API_URL ?? "https://student.mrtc.edu.in:8443/examtool-backend-adhikrit/api/v1";
const token = process.env.MRTC_TOKEN;
const dbPath = process.env.MRTC_DB ?? "public/marks.db";
const concurrency = Number(process.env.MRTC_CONCURRENCY ?? 12);

if (!token) {
    throw new Error("Set MRTC_TOKEN to an authenticated student portal token.");
}

const db = new Database(dbPath);
db.exec(`
    CREATE TABLE IF NOT EXISTS sem3_splitups (
        rollNo TEXT NOT NULL,
        courseCode TEXT NOT NULL,
        splitupJson TEXT NOT NULL,
        sourceUpdatedAt TEXT,
        PRIMARY KEY (rollNo, courseCode)
    )
`);

const rolls = db.prepare(`
    SELECT DISTINCT rollNo
    FROM sem3_marks
    WHERE semester = 'III SEMESTER'
      AND NOT EXISTS (SELECT 1 FROM sem3_splitups WHERE sem3_splitups.rollNo = sem3_marks.rollNo)
    ORDER BY rollNo
`).all().map(({ rollNo }) => rollNo);

const save = db.prepare(`
    INSERT INTO sem3_splitups (rollNo, courseCode, splitupJson, sourceUpdatedAt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(rollNo, courseCode) DO UPDATE SET
        splitupJson = excluded.splitupJson,
        sourceUpdatedAt = excluded.sourceUpdatedAt
`);
const writeBatch = db.transaction(rows => rows.forEach(row => save.run(...row)));

async function fetchStudent(rollNo) {
    const url = `${baseUrl}/midMarksDataBySemAndRollnumber?rollNumber=${encodeURIComponent(rollNo)}&semester=III%20SEMESTER`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const body = await response.text();
    if (!body.trim()) return [];
    const payload = JSON.parse(body);
    const rows = Object.values(payload).flat();
    return rows.flatMap(subject => {
        const parts = String(subject.subjectNameChild ?? "").split(",");
        const courseCode = parts.pop()?.trim();
        if (!courseCode || !Array.isArray(subject.splitupSubChilds)) return [];

        const splitup = Object.fromEntries(subject.splitupSubChilds.map(component => {
            const numericMark = Number(component.splitupMarks);
            return [component.splitupType, Number.isFinite(numericMark) ? numericMark : component.splitupMarks];
        }));
        const sourceUpdatedAt = subject.splitupSubChilds
            .map(component => component.currentUploadDateTime)
            .filter(Boolean)
            .sort()
            .at(-1) ?? subject.currentUploadDateTime ?? null;
        return [[rollNo, courseCode.toUpperCase(), JSON.stringify(splitup), sourceUpdatedAt]];
    });
}

let next = 0;
let completed = 0;
let failed = 0;
const failures = [];

async function worker() {
    while (true) {
        const index = next++;
        if (index >= rolls.length) return;
        const rollNo = rolls[index];
        try {
            let rows = [];
            let lastError;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    rows = await fetchStudent(rollNo);
                    lastError = null;
                    break;
                } catch (error) {
                    lastError = error;
                    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
                }
            }
            if (lastError) throw lastError;
            if (rows.length > 0) writeBatch(rows);
            completed++;
        } catch (error) {
            failed++;
            failures.push(`${rollNo}: ${error.message}`);
        }
        if ((completed + failed) % 100 === 0) {
            console.log(`Processed ${completed + failed}/${rolls.length}; saved ${completed}; failed ${failed}`);
        }
    }
}

await Promise.all(Array.from({ length: Math.min(concurrency, rolls.length) }, worker));
console.log(`Done. Processed ${completed + failed}; saved ${completed}; failed ${failed}.`);
if (failures.length > 0) console.log(failures.slice(0, 20).join("\n"));
db.close();
