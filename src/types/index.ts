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
}

export type SemesterData = Record<string, StudentResult[]>;

export interface ApiResponse {
    [key: string]: StudentResult[];
}
