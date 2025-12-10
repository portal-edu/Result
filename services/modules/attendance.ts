
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { AttendanceRecord } from '../../types';
import { getSchoolId, getErrorMsg } from '../utils';

// --- HYBRID ATTENDANCE SYSTEM ---

export const markDailyAttendance = async (records: AttendanceRecord[]) => {
    if (!isSupabaseConfigured()) return { success: true };
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };

    const payload = records.map(r => ({
        school_id: schoolId,
        student_id: r.studentId,
        class_id: r.classId,
        date: r.date,
        status: r.status,
        type: 'DAILY'
    }));

    // Upsert based on student_id and date
    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'student_id, date' });
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const saveSummaryAttendance = async (records: AttendanceRecord[]) => {
    if (!isSupabaseConfigured()) return { success: true };
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };

    const payload = records.map(r => ({
        school_id: schoolId,
        student_id: r.studentId,
        class_id: r.classId,
        term: r.term,
        working_days: r.workingDays,
        present_days: r.presentDays,
        type: 'SUMMARY'
    }));

    // Upsert based on student_id and term
    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'student_id, term' });
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const getAttendanceByDate = async (classId: string, date: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase.from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('date', date)
        .eq('type', 'DAILY');
    
    return (data || []).map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        classId: r.class_id,
        date: r.date,
        status: r.status,
        type: 'DAILY'
    } as AttendanceRecord));
};

export const getAttendanceByTerm = async (classId: string, term: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase.from('attendance')
        .select('*')
        .eq('class_id', classId)
        .eq('term', term)
        .eq('type', 'SUMMARY');
    
    return (data || []).map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        classId: r.class_id,
        term: r.term,
        workingDays: r.working_days,
        presentDays: r.present_days,
        type: 'SUMMARY'
    } as AttendanceRecord));
};

export const getStudentAttendanceStats = async (studentId: string) => {
    if (!isSupabaseConfigured()) return { dailyStats: [], summaryStats: [] };
    
    const { data } = await supabase.from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

    const daily = (data || []).filter((r: any) => r.type === 'DAILY').map((r: any) => ({
        date: r.date,
        status: r.status
    }));

    const summary = (data || []).filter((r: any) => r.type === 'SUMMARY').map((r: any) => ({
        term: r.term,
        workingDays: r.working_days,
        presentDays: r.present_days,
        percentage: r.working_days > 0 ? Math.round((r.present_days / r.working_days) * 100) : 0
    }));

    return { dailyStats: daily, summaryStats: summary };
};
