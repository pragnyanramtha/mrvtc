"use server";

import { ApiResponse } from "@/types";

export async function getSemWiseData(rollNo: string) {
    const semester = "I SEMESTER"; // Hardcoded as per user request example? or maybe I should let it be dynamic? 
    // The user prompt example specifically shows "I SEMESTER".
    // The user requested: "(ask for the users roll number then capitalise it, then hit the api)"
    // The API endpoint provided is for "I SEMESTER".
    // I'll keep it hardcoded for now or fetch all semesters? 
    // No, the endpoint takes "semester" as query param. I will default to "I SEMESTER".

    const degreeType = "Major";
    // Bypass SSL certificate validation for this API call
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const url = `https://student.mrtc.edu.in:8443/examtool-backend-adhikrit/api/v1/getSemWiseDataWithRollNo?rollNo=${rollNo.toUpperCase()}&semester=${encodeURIComponent(semester)}&degreeType=${degreeType}`;

    try {
        console.log("Fetching URL:", url);

        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "*/*",
                "User-Agent": "curl/8.18.0"
            },
            cache: "no-store",
        });

        console.log("API Response Status:", res.status, res.statusText);
        console.log("API Response Headers:", Object.fromEntries(res.headers.entries()));

        if (!res.ok) {
            const text = await res.text();
            console.error("API Error Response Body:", text);
            throw new Error(`API Error: ${res.status} ${res.statusText} - ${text}`);
        }

        const text = await res.text();
        console.log("API RAW RESPONSE Length:", text.length);
        console.log("API RAW RESPONSE Preview:", text.substring(0, 500));

        if (!text.trim()) {
            console.warn("API returned empty body. This usually happens when the Roll Number is invalid or not found.");
            return {
                success: false,
                error: `API returned empty response. Please check if the Roll Number '${rollNo}' is correct. (Note: Try replacing letter 'O' with number '0' if uncertain)`
            };
        }

        let data: ApiResponse;
        const trimmedText = text.trim();

        if (trimmedText.startsWith("<HashMap>")) {
            data = parseHashMap(trimmedText);
        } else {
            try {
                data = JSON.parse(text);
            } catch (jsonError) {
                console.warn("Failed to parse as JSON, returning empty object or raw text if debugging needed.");
                throw new Error("Invalid JSON and not a known HashMap format.");
            }
        }

        return { success: true, data };
    } catch (error: unknown) {
        console.error("Fetch Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}

function parseHashMap(text: string): ApiResponse {
    const result: ApiResponse = {};

    // Remove wrapping HashMap tags if present
    let cleanText = text.trim();
    if (cleanText.startsWith("<HashMap>")) {
        cleanText = cleanText.substring(9);
    }
    if (cleanText.endsWith("</HashMap>")) {
        cleanText = cleanText.substring(0, cleanText.length - 10);
    }

    // Regex to match chunks: <KEY>CONTENT</KEY>
    // We use a regex that captures the tag name in group 1, and expects the closing tag to match \1 literally.
    const chunkRegex = /<([^>]+)>([\s\S]*?)<\/\1>/g;

    let match;
    while ((match = chunkRegex.exec(cleanText)) !== null) {
        const key = match[1];
        const content = match[2];

        const entry: any = {};

        // Regex for fields: <field>value</field> OR <field/>
        const fieldRegex = /<([^>]+)>([^<]*)<\/\1>|<([^>\/]+)\/>/g;

        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(content)) !== null) {
            if (fieldMatch[1]) {
                // <field>value</field> type
                entry[fieldMatch[1]] = fieldMatch[2];
            } else if (fieldMatch[3]) {
                // Self-closing tag <key/> means null
                entry[fieldMatch[3]] = null;
            }
        }

        if (!result[key]) {
            result[key] = [];
        }
        result[key].push(entry);
    }

    return result;
}
