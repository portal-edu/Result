
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Question, QuestionBankItem, CrowdInsight } from '../../types';
import { getSchoolId, getErrorMsg } from '../utils';

// --- GLOBAL QUESTION BANK ---

export const getGlobalQuestions = async (searchTopic: string, subject?: string): Promise<QuestionBankItem[]> => {
    if (!isSupabaseConfigured()) return [];
    
    let query = supabase.from('question_bank')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(50);

    if (subject) query = query.ilike('subject', `%${subject}%`);
    if (searchTopic) query = query.ilike('topic', `%${searchTopic}%`);

    const { data } = await query;
    return (data || []).map((q: any) => ({
        id: q.id,
        text: q.text,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctOptionIndex: q.correct_option_index,
        marks: q.marks,
        subject: q.subject,
        topic: q.topic,
        classLevel: q.class_level,
        status: q.status,
        contributedBy: q.contributed_by,
        createdAt: q.created_at
    }));
};

export const contributeQuestions = async (questions: Question[], subject: string, topic: string, classLevel: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };

    const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();
    const contributor = school?.name || 'Anonymous School';

    const payload = questions.map(q => ({
        text: q.text,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
        marks: q.marks,
        subject,
        topic,
        class_level: classLevel,
        status: 'PENDING',
        contributed_by: contributor
    }));

    const { error } = await supabase.from('question_bank').insert(payload);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

// --- CROWD RADAR (PRIVACY PRESERVING) ---

export const getHolidayRadar = async (): Promise<CrowdInsight | null> => {
    if (!isSupabaseConfigured()) return null;
    const schoolId = getSchoolId();
    if (!schoolId) return null;

    // 1. Get School Region
    const { data: mySchool } = await supabase.from('schools').select('district').eq('id', schoolId).single();
    if (!mySchool || !mySchool.district) return null;

    // 2. Look for trending holidays tomorrow in same district
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // SECURE CALL: Uses RPC to return only count, not rows
    const { data: holidayCount, error } = await supabase.rpc('get_holiday_radar_safe', { 
        user_district: mySchool.district, 
        check_date: dateStr 
    });

    if (error) {
        console.error("Radar error:", error);
        return null;
    }

    // Threshold logic remains client-side for flexibility
    // But specific school data is never fetched
    if (holidayCount >= 5) {
        return {
            type: 'HOLIDAY',
            message: `Holiday Radar: ${holidayCount} schools in ${mySchool.district} declared a holiday for tomorrow (${dateStr}).`,
            confidence: 85,
            affectedCount: holidayCount,
            targetDate: dateStr,
            region: mySchool.district
        };
    }

    return null;
};

// --- CONTENT MODERATION ---

export const getPendingQuestions = async () => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase.from('question_bank')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true })
        .limit(50);
        
    return (data || []).map((q: any) => ({
        id: q.id,
        text: q.text,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        correctOptionIndex: q.correct_option_index,
        marks: q.marks,
        subject: q.subject,
        topic: q.topic,
        classLevel: q.class_level,
        status: q.status,
        contributedBy: q.contributed_by,
        createdAt: q.created_at
    } as QuestionBankItem));
};

export const moderateQuestion = async (id: string, action: 'APPROVE' | 'REJECT') => {
    if (!isSupabaseConfigured()) return { success: true };
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const { error } = await supabase.from('question_bank').update({ status }).eq('id', id);
    return { success: !error };
};
