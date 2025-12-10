
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { SystemStats, InactiveSchool, Feedback, PricingPlan, AdCampaign, CampusPost, Affiliate, WalletTransaction, TimetableConfig, TimetableEntry, TeacherProfile, SubjectLoad, CalendarEvent } from '../../types';
import { getSchoolId, getErrorMsg } from '../utils';

// --- WALLET & CREDITS ---

export const getWalletHistory = async () => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    
    const { data } = await supabase.from('credit_transactions')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false });
        
    return (data || []).map((t: any) => ({
        id: t.id,
        schoolId: t.school_id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.created_at
    } as WalletTransaction));
};

export const rechargeWallet = async (amount: number, method: string) => {
    if (!isSupabaseConfigured()) return { success: true, newBalance: amount + 100 };
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false };

    const { data: school } = await supabase.from('schools').select('wallet_balance').eq('id', schoolId).single();
    const current = school?.wallet_balance || 0;
    const newBal = current + amount;

    const { error } = await supabase.from('schools').update({ wallet_balance: newBal }).eq('id', schoolId);
    if (error) return { success: false, message: error.message };

    await supabase.from('credit_transactions').insert([{
        school_id: schoolId,
        amount: amount,
        type: 'CREDIT',
        description: `Recharge via ${method}`
    }]);

    return { success: true, newBalance: newBal };
};

// SECURE DEDUCTION via RPC
export const deductCredits = async (amount: number, reason: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false };

    // Call Secure RPC
    const { data, error } = await supabase.rpc('deduct_credits_safe', {
        school_id_in: schoolId,
        amount_in: amount,
        reason_in: reason
    });

    if (error) return { success: false, message: error.message };
    
    // RPC returns JSONB
    if (data && !data.success) {
        return { success: false, message: data.message };
    }

    return { success: true };
};

export const createAffiliate = async (data: { name: string, email: string, phone: string, code: string }) => {
    const { error } = await supabase.from('affiliates').insert([{
        name: data.name, email: data.email, phone: data.phone, code: data.code.toUpperCase(), earnings: 0, schools_referred: 0
    }]);
    if (error) { if(error.code === '23505') return { success: false, message: "Code taken." }; return { success: false, message: getErrorMsg(error) }; }
    return { success: true, code: data.code.toUpperCase() };
};

export const getAffiliateStats = async (email: string, code: string) => {
    const { data, error } = await supabase.from('affiliates').select('*').eq('email', email).eq('code', code.toUpperCase()).maybeSingle();
    if (error || !data) return { success: false, message: "Invalid credentials" };
    return { success: true, affiliate: { ...data, schoolsReferred: data.schools_referred || 0, createdAt: data.created_at } };
};

// --- TIMETABLE GENERATION (ENHANCED CONFLICT DETECTION) ---
export const getTimetableConfig = async (): Promise<TimetableConfig | null> => {
    if (!isSupabaseConfigured()) return null;
    const schoolId = getSchoolId();
    const { data } = await supabase.from('timetable_config').select('*').eq('school_id', schoolId).maybeSingle();
    if (data) return { workingDays: typeof data.working_days === 'string' ? JSON.parse(data.working_days) : data.working_days, dayStartsAt: data.day_starts_at, dayEndsAt: data.day_ends_at, periodDuration: data.period_duration_mins, breaks: typeof data.breaks === 'string' ? JSON.parse(data.breaks) : data.breaks };
    return null;
};

export const saveTimetableConfig = async (config: TimetableConfig) => {
    if (!isSupabaseConfigured()) return { success: true };
    const schoolId = getSchoolId();
    const { error } = await supabase.from('timetable_config').upsert({
        school_id: schoolId, working_days: config.workingDays, day_starts_at: config.dayStartsAt, day_ends_at: config.dayEndsAt, period_duration_mins: config.periodDuration, breaks: config.breaks
    }, { onConflict: 'school_id' });
    return { success: !error };
};

export const getTimetableEntries = async () => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    const { data } = await supabase.from('timetable_entries').select('*').eq('school_id', schoolId);
    return (data || []).map((e: any) => ({
        id: e.id, classId: e.class_id, day: e.day, periodIndex: e.period_index, subjectName: e.subject_name, teacherId: e.teacher_id
    } as TimetableEntry));
};

export const autoGenerateTimetable = async (config: TimetableConfig, teachers: TeacherProfile[], workload: Record<string, SubjectLoad[]>) => {
    if (!isSupabaseConfigured()) return { success: true, entries: [] };
    const schoolId = getSchoolId();
    
    // Clear existing
    await supabase.from('timetable_entries').delete().eq('school_id', schoolId);

    const generatedEntries: TimetableEntry[] = [];
    const classIds = Object.keys(workload);
    // Usually 8 periods, can be derived from config but fixed for prototype simplicity
    const periods = Array.from({length: 8}, (_,i) => i+1);

    // Track state to prevent collisions
    // Key: "teacherId_day_period" -> boolean
    const teacherScheduleMap = new Set<string>();
    // Key: "classId_day_period" -> boolean
    const classScheduleMap = new Set<string>();

    const isSlotAvailable = (day: string, period: number, teacherId: string, classId: string) => {
        if (teacherScheduleMap.has(`${teacherId}_${day}_${period}`)) return false;
        if (classScheduleMap.has(`${classId}_${day}_${period}`)) return false;
        return true;
    };

    const bookSlot = (day: string, period: number, teacherId: string, classId: string, subject: string) => {
        generatedEntries.push({ classId, day, periodIndex: period, subjectName: subject, teacherId });
        teacherScheduleMap.add(`${teacherId}_${day}_${period}`);
        classScheduleMap.add(`${classId}_${day}_${period}`);
    };

    for (const classId of classIds) {
        const subjects = workload[classId];
        // Heuristic: Assign double periods first as they are harder to fit
        subjects.sort((a,b) => (b.isDouble ? 1 : 0) - (a.isDouble ? 1 : 0));

        for (const sub of subjects) {
            let assignedCount = 0;
            // Find teacher for this subject (direct override or match by subject capability)
            const teacherId = sub.teacherId || teachers.find(t => t.subjects.includes(sub.subject))?.name || 'Staff';

            for (let i = 0; i < sub.count; i++) {
                if (assignedCount >= sub.count) break;
                let placed = false;
                
                // Shuffle days to distribute load evenly
                const shuffledDays = [...config.workingDays].sort(() => Math.random() - 0.5);
                
                for (const day of shuffledDays) {
                    if (placed) break;
                    
                    // Simple max daily limit check per teacher (soft limit 6)
                    let dailyLoad = 0;
                    periods.forEach(p => {
                        if (teacherScheduleMap.has(`${teacherId}_${day}_${p}`)) dailyLoad++;
                    });
                    if (dailyLoad >= 6) continue;

                    for (const p of periods) {
                        if (sub.isDouble) {
                            // Need p and p+1 available, and not across break/lunch if we had break info logic
                            if (p < 8 && isSlotAvailable(day, p, teacherId, classId) && isSlotAvailable(day, p+1, teacherId, classId)) {
                                bookSlot(day, p, teacherId, classId, sub.subject);
                                bookSlot(day, p+1, teacherId, classId, sub.subject);
                                assignedCount += 2; 
                                i++; // Skip next iteration count
                                placed = true; 
                                break;
                            }
                        } else {
                            if (isSlotAvailable(day, p, teacherId, classId)) {
                                bookSlot(day, p, teacherId, classId, sub.subject);
                                assignedCount++; 
                                placed = true; 
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    const dbPayload = generatedEntries.map(e => ({ school_id: schoolId, class_id: e.classId, day: e.day, period_index: e.periodIndex, subject_name: e.subjectName, teacher_id: e.teacherId }));
    const { error } = await supabase.from('timetable_entries').insert(dbPayload);
    
    return { success: !error, message: error ? error.message : "Timetable Generated Successfully!" };
};

// ... (Other functions remain unchanged) ...
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    const { data } = await supabase.from('academic_calendar').select('*').eq('school_id', schoolId).order('date', { ascending: true });
    return (data || []).map((e: any) => ({ id: e.id, title: e.title, date: e.date, type: e.type, description: e.description }));
};

export const createCalendarEvent = async (event: Partial<CalendarEvent>) => {
    const schoolId = getSchoolId();
    const { error } = await supabase.from('academic_calendar').insert([{ school_id: schoolId, title: event.title, date: event.date, type: event.type, description: event.description }]);
    return { success: !error };
};

export const deleteCalendarEvent = async (id: string) => {
    const { error } = await supabase.from('academic_calendar').delete().eq('id', id);
    return { success: !error };
};

export const predictNextYearEvent = (event: CalendarEvent): string => {
    const current = new Date(event.date);
    let nextDate = new Date(current);
    if (event.type === 'RELIGIOUS') nextDate.setDate(nextDate.getDate() + 354);
    else {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        if (nextDate.getDay() === 0) nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate.toISOString().split('T')[0];
};

export const createSystemFeedback = async (message: string, type: 'BUG'|'FEATURE'|'SUPPORT' = 'SUPPORT', email?: string, meta?: any) => {
    if (!isSupabaseConfigured()) return { success: true };
    const schoolId = getSchoolId();
    let userIdentifier = email || 'Anonymous';
    const { error } = await supabase.from('system_feedback').insert([{
        school_id: schoolId,
        message: message,
        type: type,
        email: userIdentifier,
        status: 'OPEN'
    }]);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const createCampusPost = async (schoolId: string, authorName: string, message: string, type: string, category: string = 'NOTICE', title?: string, scheduledAt?: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('campus_posts').insert([{
        school_id: schoolId,
        author_name: authorName,
        message: message,
        type: type,
        category: category,
        title: title,
        scheduled_at: scheduledAt,
        likes: 0
    }]);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const getCampusPosts = async (schoolId: string, category?: string) => {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('campus_posts').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data } = await query;
    return (data || []).map((p: any) => ({
        id: p.id,
        schoolId: p.school_id,
        authorName: p.author_name,
        title: p.title,
        message: p.message,
        type: p.type,
        category: p.category,
        likes: p.likes,
        createdAt: p.created_at,
        scheduledAt: p.scheduled_at
    } as CampusPost));
};

export const createSelfServiceAd = async (imageUrl: string, targetUrl: string, contactInfo: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('ad_campaigns').insert([{
        image_url: imageUrl,
        target_url: targetUrl,
        contact_info: contactInfo,
        status: 'ACTIVE',
        is_active: true,
        views: 0,
        clicks: 0
    }]);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const getRandomActiveAd = async (): Promise<AdCampaign | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
        const { data } = await supabase.from('ad_campaigns').select('*').eq('is_active', true).eq('status', 'ACTIVE').limit(20); 
        if (data && data.length > 0) {
            const random = data[Math.floor(Math.random() * data.length)];
            supabase.from('ad_campaigns').update({ views: (random.views || 0) + 1 }).eq('id', random.id).then(() => {});
            return {
                id: random.id,
                imageUrl: random.image_url,
                targetUrl: random.target_url,
                isActive: random.is_active,
                views: random.views,
                clicks: random.clicks,
                createdAt: random.created_at,
                contactInfo: random.contact_info,
                status: random.status
            };
        }
    } catch (e) { console.error("Ad fetch error", e); }
    return null;
};
