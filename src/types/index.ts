export interface StudentResult {
    batch: string;
    insertedDate: string;
    degree: string;
    branch: string;
    semester: string;
    courseCode: string;
    section: string;
    rollNo: string;
    examTitle: string;
    internalMarks: string;
    externalMarks: string;
    total: string;
    gradePoints: string;
    grade: string | null;
    credits: string;
    reg_credits: string;
    sgpa: string;
    cgpa: string;
    course: string;
    status: string;
    moderationMarks: string | null;
    graftingMarks: string | null;
    totalMarks: string;
    reValuationMarks: string | null;
    reCountingMarks: string | null;
    publishingStatus: string;
    currentUserName: string;
    currentUserEmail: string;
    currentUploadDateTime: string;
    generakModerationMarks: string | null;
    // Sem1-specific
    mid1Marks?: string;
    mid2Marks?: string;
}

export interface Sem2Result {
    rollNo: string;
    courseCode: string;
    courseName: string;
    credits: string;
    mid1Total: string;
    mid2Total: string;
    mid1Presentation?: string;
    mid1Assignment?: string;
    mid1Objective?: string;
    mid1Subject?: string;
    mid2Presentation?: string;
    mid2Assignment?: string;
    mid2Objective?: string;
    mid2Subject?: string;
    midTotal: string;
    externalMarks: string;
    gradePoints: string | null;
    grade: string | null;
    status: string | null;
    total: string;
}

export type SemesterData = Record<string, StudentResult[]>;

export interface ApiResponse {
    [key: string]: StudentResult[];
}
