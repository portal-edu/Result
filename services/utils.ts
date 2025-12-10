
import { Student, Marks, SubjectConfig } from '../types';

export const getSchoolId = () => localStorage.getItem('school_id');

export const getErrorMsg = (e: any): string => {
    // 1. Handle specific Supabase Auth Errors (Suppress console log for these known issues)
    if (e?.name === 'AuthInvalidTokenResponseError' || (e?.status === 500 && e?.__isAuthError)) {
        return "Authentication Service Error: The system could not verify your credentials. Please check your API Keys or internet connection.";
    }
    
    if (e === 'Auth session or user missing' || e?.message === 'Auth session or user missing') {
        return "Session invalid. Please login again.";
    }

    // 2. Log unknown errors for debugging
    try {
        console.error("API Error Details:", e);
        if (typeof e === 'object' && e !== null) {
             console.error(JSON.stringify(e, null, 2));
        }
    } catch (err) {
        console.error("API Error (Unloggable)");
    }

    if (!e) return "An unknown error occurred.";
    if (typeof e === 'string') return e;
    
    // Check if it's a standard Error object
    if (e instanceof Error) return e.message;

    if (e.message) {
        return typeof e.message === 'object' ? JSON.stringify(e.message) : String(e.message);
    }
    if (e.error_description) return String(e.error_description);
    if (e.details) return String(e.details);
    if (e.hint) return String(e.hint);
    
    try {
        const json = JSON.stringify(e);
        if (json !== '{}') return json;
    } catch {}
    
    return "An unexpected error occurred.";
};

// UPDATED: Aggressive Compression for Storage Saving
// Reduces images to passport size (~300px width) and lower quality (0.6)
// This ensures 1000s of student photos don't fill up storage.
export const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300; // Reduced from 500 to 300 for Passport Size optimization
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Lower quality to 0.6 for maximum space saving
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas is empty'));
                }, 'image/jpeg', 0.6);
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

// NEW: Date Formatter (YYYY-MM-DD -> DD-MM-YYYY)
export const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    // Check if already in DD-MM-YYYY to prevent double formatting
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) return dateString;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Fallback
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
};

// NEW: Robust Date Parser for CSV Imports (DD/MM/YYYY -> YYYY-MM-DD)
export const parseDateToISO = (dateStr: string): string => {
    if (!dateStr) return '2000-01-01'; // Default fallback
    
    const cleanStr = dateStr.trim();
    
    // Check if already ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) return cleanStr;
    
    // Handle DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    // Regex matches 1-2 digits, separator, 1-2 digits, separator, 4 digits
    const match = cleanStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    
    if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }
    
    // Try standard date parse as last resort
    const timestamp = Date.parse(cleanStr);
    if (!isNaN(timestamp)) {
        try {
            return new Date(timestamp).toISOString().split('T')[0];
        } catch (e) {
            return '2000-01-01';
        }
    }

    return '2000-01-01';
};

export const parseSubjects = (json: any): SubjectConfig[] => {
    if (!json) return [];
    let parsed = typeof json === 'string' ? JSON.parse(json) : json;
    
    if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        if (typeof parsed[0] === 'string') {
            return parsed.map((s: string) => ({ name: s, maxMarks: 50, passMarks: 18 }));
        }
        return parsed.map((s: any) => ({
            name: s.name,
            maxMarks: s.maxMarks || 50,
            passMarks: s.passMarks || (s.maxMarks ? Math.floor(s.maxMarks * 0.3) : 18)
        }));
    }
    return [];
}

export const transformStudent = (s: any): Student => ({
    id: s.id,
    regNo: s.reg_no,
    rollNo: s.roll_no, 
    name: s.name,
    classId: s.class_id,
    dob: s.dob,
    gender: s.gender, 
    fatherName: s.father_name,
    motherName: s.mother_name,
    isVerified: s.is_verified,
    photoUrl: s.photo_url,
    isPremium: s.is_premium || false, 
    premiumExpiry: s.premium_expiry,
    addedBy: s.added_by,
    verifiedBy: s.verified_by,
    socialLinks: s.social_links // JSONB column mapping
});

export const transformMarks = (m: any): Marks => {
    return {
        studentId: m.student_id,
        term: m.term,
        subjects: typeof m.subjects === 'string' ? JSON.parse(m.subjects) : m.subjects,
        total: m.total,
        grade: m.grade,
        resultStatus: m.grade === 'F' ? 'FAILED' : 'PASS' 
    };
};

// --- NEW CENTRALIZED UTILS ---

export const calculateGrade = (totalMarks: number, maxMarks: number, hasSubjectFailure: boolean = false) => {
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';
    else grade = 'D';

    let resultStatus: 'PASS' | 'FAILED' = 'PASS';
    
    // Explicit failure override
    if (hasSubjectFailure || grade === 'F' || grade === 'D') {
        resultStatus = 'FAILED';
    }

    return { grade, resultStatus, percentage };
};

export const sanitizePhone = (phone: string) => {
    // Removes spaces, dashes, parentheses, +91 etc. Returns last 10 digits.
    return phone.replace(/\D/g, '').slice(-10);
};

export const parseCSVLine = (line: string) => {
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            let field = line.substring(start, i).trim();
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.substring(1, field.length - 1);
            }
            result.push(field);
            start = i + 1;
        }
    }
    let lastField = line.substring(start).trim();
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
        lastField = lastField.substring(1, lastField.length - 1);
    }
    result.push(lastField);
    return result;
};

// Helper to safely merge custom data into social_links JSONB without overwriting existing data
export const mergeCustomData = (existingJson: any, newCustomData: any) => {
    const safeExisting = existingJson || {};
    return {
        ...safeExisting,
        custom_data: {
            ...(safeExisting.custom_data || {}),
            ...newCustomData
        }
    };
};

// --- SAVED ACCOUNTS UTILS ---
const STORAGE_KEY_PROFILES = 'saved_student_profiles';

export interface SavedProfile {
    regNo: string;
    name: string;
    fatherName: string;
    schoolId: string;
    schoolName?: string;
    photoUrl?: string;
    className?: string;
    lastLogin: number;
}

export const getSavedStudentProfiles = (): SavedProfile[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY_PROFILES);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
};

export const saveStudentProfile = (student: Student, schoolId: string, schoolName?: string) => {
    try {
        let profiles = getSavedStudentProfiles();
        
        // Remove if existing (to update/move to top)
        profiles = profiles.filter(p => !(p.regNo === student.regNo && p.schoolId === schoolId));
        
        // Add to top
        profiles.unshift({
            regNo: student.regNo,
            name: student.name,
            fatherName: student.fatherName,
            schoolId: schoolId,
            schoolName: schoolName,
            photoUrl: student.photoUrl,
            className: student.className,
            lastLogin: Date.now()
        });
        
        // Limit to 5
        if (profiles.length > 5) profiles.pop();
        
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch (e) { console.error("Failed to save profile", e); }
};

export const removeStudentProfile = (regNo: string, schoolId: string) => {
    try {
        let profiles = getSavedStudentProfiles();
        profiles = profiles.filter(p => !(p.regNo === regNo && p.schoolId === schoolId));
        localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
        return profiles;
    } catch (e) { return []; }
};
