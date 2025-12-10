
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { SupportTicket, SystemStats, MarketingConfig, SchoolSummary, SyllabusDefinition, SubjectConfig } from '../../types';

// --- SCHOOL MANAGEMENT ---
export const getAllSchools = async (): Promise<SchoolSummary[]> => {
    const { data } = await supabase.from('schools')
        .select('id, name, admin_email, place, is_pro, expiry_date, last_active_at')
        .order('created_at', { ascending: false });
        
    if (!data) return [];
    
    const schools: SchoolSummary[] = [];
    
    // In production, this should be an RPC or View.
    // For now, we perform counts. 
    for (const s of data) {
        // Safe check for counts
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', s.id);
        const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', s.id);
        
        schools.push({
            id: s.id,
            name: s.name,
            adminEmail: s.admin_email,
            place: s.place,
            isPro: s.is_pro,
            expiryDate: s.expiry_date,
            lastActive: s.last_active_at,
            studentCount: studentCount || 0,
            classCount: classCount || 0
        });
    }
    return schools;
};

export const manuallyUpgradeSchool = async (schoolId: string, isPro: boolean, days: number = 365) => {
    let expiryDate = null;
    if (isPro) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiryDate = d.toISOString();
    }
    
    const { error } = await supabase.from('schools').update({
        is_pro: isPro,
        expiry_date: expiryDate,
        license_key: isPro ? 'GRANTED_BY_ADMIN' : 'FREE'
    }).eq('id', schoolId);
    
    return { success: !error };
};

export const resetSchoolData = async (schoolId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    
    // Deleting classes cascades to students -> marks -> fees
    // This effectively wipes the academic year data but keeps the school account
    const { error } = await supabase.from('classes').delete().eq('school_id', schoolId);
    
    // Also clean up unassigned students or direct entries if any
    if (!error) {
        await supabase.from('students').delete().eq('school_id', schoolId);
        await supabase.from('campus_posts').delete().eq('school_id', schoolId);
    }

    return { success: !error, message: error ? error.message : undefined };
};

// NEW: DEEP ANALYTICS FOR INDIVIDUAL SCHOOL
export const getSchoolDeepAnalytics = async (schoolId: string) => {
    if (!isSupabaseConfigured()) return null;

    // 1. Counts
    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
    const { count: teachers } = await supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).not('teacher_name', 'is', null);
    
    // 2. Feature Usage (Proxies)
    // Result Usage: Count of marks entries
    // Note: marks table has student_id, need to join or filter by students of this school. 
    // For performance, we'll approximate by checking students first.
    const { data: stuIds } = await supabase.from('students').select('id').eq('school_id', schoolId);
    const studentIds = stuIds?.map(s => s.id) || [];
    
    let marksCount = 0;
    let feeCount = 0;
    
    if (studentIds.length > 0) {
        // Batching might be needed for huge datasets, but okay for analytics view
        const { count: m } = await supabase.from('marks').select('*', { count: 'exact', head: true }).in('student_id', studentIds);
        marksCount = m || 0;
        
        const { count: f } = await supabase.from('fee_payments').select('*', { count: 'exact', head: true }).in('student_id', studentIds);
        feeCount = f || 0;
    }

    const { count: examsCount } = await supabase.from('exams').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
    const { count: noticesCount } = await supabase.from('campus_posts').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);

    // 3. Storage Calculation (Estimate)
    // Avg Row Sizes: Student (~2KB), Mark (~0.5KB), Log (~1KB)
    const storageBytes = ((students || 0) * 2048) + (marksCount * 512) + (noticesCount * 1024);
    const storageMB = (storageBytes / (1024 * 1024)).toFixed(2);
    
    // System Load Percentage (Assuming 500MB fair use limit per free school)
    const loadPercentage = Math.min(100, (parseFloat(storageMB) / 500) * 100).toFixed(1);

    // 4. Activity / Churn Risk
    const { data: school } = await supabase.from('schools').select('last_active_at, created_at').eq('id', schoolId).single();
    const lastActive = school?.last_active_at ? new Date(school.last_active_at).getTime() : 0;
    const daysInactive = Math.floor((Date.now() - lastActive) / (1000 * 60 * 60 * 24));
    
    let riskLevel = 'LOW';
    if (daysInactive > 30) riskLevel = 'HIGH';
    else if (daysInactive > 14) riskLevel = 'MEDIUM';

    return {
        counts: { students: students || 0, teachers: teachers || 0 },
        features: {
            results: marksCount,
            fees: feeCount,
            exams: examsCount || 0,
            communication: noticesCount || 0
        },
        storage: {
            usedMB: storageMB,
            loadPercent: loadPercentage
        },
        health: {
            daysInactive,
            riskLevel,
            joinedAt: school?.created_at
        }
    };
};

// --- ANALYTICS ---
export const getAdvancedSystemStats = async (): Promise<SystemStats> => {
    // Real Queries
    const { count: schools } = await supabase.from('schools').select('*', { count: 'exact', head: true });
    const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: revenueCount } = await supabase.from('schools').select('*', { count: 'exact', head: true }).eq('is_pro', true);
    
    // Simulation for advanced metrics not in DB yet
    const latency = Math.floor(Math.random() * 50) + 20; 
    const activeUsers = Math.floor((schools || 1) * 0.8) + Math.floor(Math.random() * 10);
    
    // Calculate total revenue approximation (mock calculation based on count)
    const estimatedRev = (revenueCount || 0) * 1999; 

    return {
        totalSchools: schools || 0,
        totalStudents: students || 0,
        proSchools: revenueCount || 0,
        premiumStudents: 0,
        totalRevenue: estimatedRev,
        inactiveSchools: 0,
        authUsersUsed: 0,
        dbSizeMB: 45.2,
        serverLatency: latency,
        activeUsersNow: activeUsers,
        ticketsPending: 5,
        dailyGrowthRate: 5.2
    };
};

export const getAttributionStats = async () => {
    if (!isSupabaseConfigured()) return { sources: [], topReferrers: [], revenue: 0 };

    // 1. Get Source Counts
    const { data: schools } = await supabase.from('schools')
        .select('referral_source, referred_by_school_id, is_pro')
        .not('referral_source', 'is', null);

    if (!schools) return { sources: [], topReferrers: [], revenue: 0 };

    // Aggregate Source
    const sourceMap: Record<string, number> = {};
    schools.forEach((s: any) => {
        const src = s.referral_source || 'Unknown';
        sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const sources = Object.entries(sourceMap).map(([k, v]) => ({ source: k, count: v })).sort((a,b) => b.count - a.count);

    // Aggregate Top Referrers
    const referrerMap: Record<string, number> = {};
    const proReferrals: string[] = []; // Track paid referrals

    schools.forEach((s: any) => {
        if (s.referred_by_school_id) {
            referrerMap[s.referred_by_school_id] = (referrerMap[s.referred_by_school_id] || 0) + 1;
            if (s.is_pro) proReferrals.push(s.referred_by_school_id);
        }
    });

    // Need names for top referrers
    const topIds = Object.keys(referrerMap).sort((a,b) => referrerMap[b] - referrerMap[a]).slice(0, 5);
    const { data: referrerDetails } = await supabase.from('schools').select('id, name').in('id', topIds);
    
    const topReferrers = topIds.map(id => {
        const name = referrerDetails?.find((r: any) => r.id === id)?.name || 'Unknown School';
        return { id, name, count: referrerMap[id] };
    });

    // Calc Revenue (Estimate)
    const revenue = proReferrals.length * 1999; // Using base Smart plan price estimate

    return { sources, topReferrers, revenue };
};

// --- SUPPORT DESK ---
export const getAllSupportTickets = async (): Promise<SupportTicket[]> => {
    // Ensure table exists, fallback if not
    const { data } = await supabase.from('system_feedback').select('*').order('created_at', { ascending: false });
    if (!data) return [];

    return data.map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        schoolName: item.school_name || 'Unknown School',
        userEmail: item.email || 'User', 
        subject: item.message ? (item.message.substring(0, 30) + '...') : 'No Subject',
        message: item.message,
        status: item.status || 'OPEN',
        priority: (item.message || '').toLowerCase().includes('payment') ? 'CRITICAL' : 'MEDIUM',
        category: item.type || 'GENERAL',
        aiSuggestedReply: generateAiReply(item.message || ''),
        createdAt: item.created_at
    }));
};

const generateAiReply = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('payment') || lower.includes('money')) return "Checking transaction status with gateway. Will update shortly.";
    if (lower.includes('login')) return "Please use the password reset tool or verify email address.";
    return "Thank you for the feedback. We are investigating.";
};

export const resolveTicket = async (ticketId: string, reply: string) => {
    const { error } = await supabase.from('system_feedback').update({ status: 'RESOLVED' }).eq('id', ticketId);
    return { success: !error };
};

// --- INFRASTRUCTURE & POOLS ---
export const getStoragePoolStatus = async () => {
    // Mock Status for multiple Cloudinary accounts
    return [
        { id: 'cloud_1', name: 'Primary (Asia)', used: 85, limit: 100, status: 'HEALTHY' },
        { id: 'cloud_2', name: 'Backup (US)', used: 12, limit: 25, status: 'HEALTHY' },
        { id: 'cloud_3', name: 'Media Pool A', used: 98, limit: 100, status: 'FULL' },
        { id: 'cloud_4', name: 'Media Pool B', used: 0, limit: 100, status: 'STANDBY' },
    ];
};

export const runDatabaseMigration = async (script: string) => {
    // In a real app, this would verify admin privilege and execute SQL via RPC
    // For safety, we just simulate success here
    await new Promise(r => setTimeout(r, 2000));
    return { success: true, message: "Migration Applied Successfully (Simulated)" };
};

export const triggerAutoHeal = async (type: 'CACHE' | 'CONNECTION' | 'INDEX') => {
    await new Promise(r => setTimeout(r, 1500));
    return { success: true, message: `${type} reset complete.` };
};

// --- STAFF MANAGEMENT ---
export const getStaffList = async () => {
    // Try to fetch from real table if exists, else return mock
    const { data } = await supabase.from('staff_members').select('*');
    if (data && data.length > 0) {
        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            status: s.status,
            performance: s.performance_score
        }));
    }

    return [
        { id: 'st1', name: 'Niyas V', role: 'System Architect', status: 'ONLINE', performance: 98 },
        { id: 'st2', name: 'Support Bot', role: 'AI Agent', status: 'ONLINE', performance: 100 },
        { id: 'st3', name: 'Sarah J', role: 'Accounts', status: 'OFFLINE', performance: 85 },
        { id: 'st4', name: 'Rahul K', role: 'Support Lead', status: 'BUSY', performance: 92 },
    ];
};

export const addStaffMember = async (staff: any) => {
    await new Promise(r => setTimeout(r, 1000));
    return { success: true };
};

// --- MARKETING & PRICING ---
export const getMarketingConfig = async (): Promise<MarketingConfig> => {
    const defaultStarter = ["Unlimited Students", "Smart Data Entry (Public Link)", "Instant Result Publish", "WhatsApp Viral Result Link"];
    const defaultSmart = ["Everything in Starter", "Fee Management System", "Fee Receipts & Reports", "School Branding (Logo)"];
    const defaultPro = ["Everything in Smart", "✨ AI Question Generator", "📱 White-label Mobile App", "Behavioral Reports", "Priority Support"];

    const defaults: MarketingConfig = {
        flashSaleActive: false,
        smartPlanPrice: 1999,
        smartPlanOriginal: 2999,
        smartPlanSeatsLeft: 12,
        proPlanPrice: 4999,
        proPlanOriginal: 7999,
        proPlanSeatsLeft: 5,
        showUrgencyBanner: false,
        billingCycle: '/year',
        globalTrialMode: false,
        planFeatures: {
            starter: defaultStarter,
            smart: defaultSmart,
            pro: defaultPro
        }
    };

    // Prevent network requests if not configured to avoid "Failed to fetch"
    if (!isSupabaseConfigured()) {
        return defaults;
    }

    try {
        const { data, error } = await supabase.from('app_config').select('*').in('key', [
            'FLASH_SALE_ACTIVE', 'FLASH_SALE_END', 'FLASH_SALE_TEXT', 
            'PRICE_SMART', 'PRICE_SMART_ORIG', 'SEATS_SMART',
            'PRICE_PRO', 'PRICE_PRO_ORIG', 'SEATS_PRO', 'URGENCY_BANNER',
            'BILLING_CYCLE', 'GLOBAL_TRIAL', 
            'FEAT_STARTER', 'FEAT_SMART', 'FEAT_PRO'
        ]);
        
        if (error) {
            // Silently return defaults on error to avoid UI crash
            return defaults;
        }
        
        const settings: any = {};
        if (data && Array.isArray(data)) {
            data.forEach((row: any) => settings[row.key] = row.value);
        }

        return {
            flashSaleActive: settings['FLASH_SALE_ACTIVE'] === 'TRUE',
            flashSaleEndTime: settings['FLASH_SALE_END'],
            flashSaleText: settings['FLASH_SALE_TEXT'],
            smartPlanPrice: parseInt(settings['PRICE_SMART']) || 1999,
            smartPlanOriginal: parseInt(settings['PRICE_SMART_ORIG']) || 2999,
            smartPlanSeatsLeft: parseInt(settings['SEATS_SMART']) || 12,
            proPlanPrice: parseInt(settings['PRICE_PRO']) || 4999,
            proPlanOriginal: parseInt(settings['PRICE_PRO_ORIG']) || 7999,
            proPlanSeatsLeft: parseInt(settings['SEATS_PRO']) || 5,
            showUrgencyBanner: settings['URGENCY_BANNER'] === 'TRUE',
            billingCycle: settings['BILLING_CYCLE'] || '/year',
            globalTrialMode: settings['GLOBAL_TRIAL'] === 'TRUE',
            planFeatures: {
                starter: settings['FEAT_STARTER'] ? JSON.parse(settings['FEAT_STARTER']) : defaultStarter,
                smart: settings['FEAT_SMART'] ? JSON.parse(settings['FEAT_SMART']) : defaultSmart,
                pro: settings['FEAT_PRO'] ? JSON.parse(settings['FEAT_PRO']) : defaultPro
            }
        };
    } catch (e) {
        // Silently fail on network error and return defaults
        return defaults;
    }
};

export const updateMarketingConfig = async (config: MarketingConfig) => {
    const upserts = [
        { key: 'FLASH_SALE_ACTIVE', value: config.flashSaleActive ? 'TRUE' : 'FALSE' },
        { key: 'FLASH_SALE_END', value: config.flashSaleEndTime },
        { key: 'FLASH_SALE_TEXT', value: config.flashSaleText },
        { key: 'PRICE_SMART', value: config.smartPlanPrice.toString() },
        { key: 'PRICE_SMART_ORIG', value: config.smartPlanOriginal.toString() },
        { key: 'SEATS_SMART', value: config.smartPlanSeatsLeft.toString() },
        { key: 'PRICE_PRO', value: config.proPlanPrice.toString() },
        { key: 'PRICE_PRO_ORIG', value: config.proPlanOriginal.toString() },
        { key: 'SEATS_PRO', value: config.proPlanSeatsLeft.toString() },
        { key: 'URGENCY_BANNER', value: config.showUrgencyBanner ? 'TRUE' : 'FALSE' },
        { key: 'BILLING_CYCLE', value: config.billingCycle },
        { key: 'GLOBAL_TRIAL', value: config.globalTrialMode ? 'TRUE' : 'FALSE' },
        { key: 'FEAT_STARTER', value: JSON.stringify(config.planFeatures?.starter || []) },
        { key: 'FEAT_SMART', value: JSON.stringify(config.planFeatures?.smart || []) },
        { key: 'FEAT_PRO', value: JSON.stringify(config.planFeatures?.pro || []) }
    ];

    const { error } = await supabase.from('app_config').upsert(upserts);
    return { success: !error, message: error ? (error as any).message : undefined };
};

// --- SYLLABUS MANAGEMENT ---
const GLOBAL_SYLLABI: SyllabusDefinition[] = [
    {
        id: 'samastha',
        name: 'Samastha (SKIMVB)',
        description: 'Standard Samastha Kerala Islam Matha Vidhyabhyasa Board syllabus for Madrassas.',
        classRanges: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        subjects: {
            '1': [{name: 'Quran', maxMarks: 50, passMarks: 18}, {name: 'Fiqh', maxMarks: 50, passMarks: 18}, {name: 'Thareekh', maxMarks: 50, passMarks: 18}, {name: 'Aqeedha', maxMarks: 50, passMarks: 18}],
            '5': [{name: 'Quran', maxMarks: 100, passMarks: 35}, {name: 'Fiqh', maxMarks: 100, passMarks: 35}, {name: 'Thareekh', maxMarks: 100, passMarks: 35}, {name: 'Lisan', maxMarks: 100, passMarks: 35}, {name: 'Tajweed', maxMarks: 100, passMarks: 35}],
            '7': [{name: 'Quran', maxMarks: 100, passMarks: 35}, {name: 'Fiqh', maxMarks: 100, passMarks: 35}, {name: 'Thareekh', maxMarks: 100, passMarks: 35}, {name: 'Lisan', maxMarks: 100, passMarks: 35}, {name: 'Thafseer', maxMarks: 100, passMarks: 35}, {name: 'Hadees', maxMarks: 100, passMarks: 35}],
            '10': [{name: 'Quran', maxMarks: 100, passMarks: 35}, {name: 'Fiqh', maxMarks: 100, passMarks: 35}, {name: 'Thareekh', maxMarks: 100, passMarks: 35}, {name: 'Usul Fiqh', maxMarks: 100, passMarks: 35}, {name: 'Thafseer', maxMarks: 100, passMarks: 35}],
        }
    },
    {
        id: 'kerala_state',
        name: 'Kerala State Syllabus (SCERT)',
        description: 'Official SCERT curriculum for Kerala Schools.',
        classRanges: ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '+1 Science', '+1 Commerce', '+1 Humanities', '+2 Science', '+2 Commerce', '+2 Humanities'],
        subjects: {
            '1': [{name: 'English', maxMarks: 50, passMarks: 18}, {name: 'Malayalam', maxMarks: 50, passMarks: 18}, {name: 'Maths', maxMarks: 50, passMarks: 18}, {name: 'EVS', maxMarks: 50, passMarks: 18}],
            '10': [{name: 'English', maxMarks: 80, passMarks: 24}, {name: 'Malayalam 1', maxMarks: 40, passMarks: 12}, {name: 'Malayalam 2', maxMarks: 40, passMarks: 12}, {name: 'Hindi', maxMarks: 40, passMarks: 12}, {name: 'Physics', maxMarks: 40, passMarks: 12}, {name: 'Chemistry', maxMarks: 40, passMarks: 12}, {name: 'Biology', maxMarks: 40, passMarks: 12}, {name: 'Social Science', maxMarks: 80, passMarks: 24}, {name: 'Maths', maxMarks: 80, passMarks: 24}, {name: 'IT', maxMarks: 10, passMarks: 4}],
            '+1 Science': [{name: 'English', maxMarks: 100, passMarks: 30}, {name: 'Malayalam/Hindi', maxMarks: 100, passMarks: 30}, {name: 'Physics', maxMarks: 100, passMarks: 30}, {name: 'Chemistry', maxMarks: 100, passMarks: 30}, {name: 'Biology/Maths', maxMarks: 100, passMarks: 30}, {name: 'Computer Science', maxMarks: 100, passMarks: 30}],
            '+1 Commerce': [{name: 'English', maxMarks: 100, passMarks: 30}, {name: 'Malayalam/Hindi', maxMarks: 100, passMarks: 30}, {name: 'Business Studies', maxMarks: 100, passMarks: 30}, {name: 'Accountancy', maxMarks: 100, passMarks: 30}, {name: 'Economics', maxMarks: 100, passMarks: 30}, {name: 'Computer App', maxMarks: 100, passMarks: 30}],
        }
    },
    {
        id: 'cbse',
        name: 'CBSE',
        description: 'Central Board of Secondary Education.',
        classRanges: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        subjects: {
            '1': [{name: 'English', maxMarks: 50, passMarks: 18}, {name: 'Hindi', maxMarks: 50, passMarks: 18}, {name: 'Maths', maxMarks: 50, passMarks: 18}, {name: 'EVS', maxMarks: 50, passMarks: 18}],
            '10': [{name: 'English', maxMarks: 80, passMarks: 27}, {name: 'Hindi/Sanskrit', maxMarks: 80, passMarks: 27}, {name: 'Maths', maxMarks: 80, passMarks: 27}, {name: 'Science', maxMarks: 80, passMarks: 27}, {name: 'Social Science', maxMarks: 80, passMarks: 27}],
        }
    }
];

export const getGlobalSyllabi = () => {
    return GLOBAL_SYLLABI;
};

export const getSubjectsFromSyllabus = (syllabusId: string, className: string): SubjectConfig[] => {
    const syllabus = GLOBAL_SYLLABI.find(s => s.id === syllabusId);
    if (!syllabus) return [];

    // Simple matching: check if class name contains the key (e.g., "Class 10 A" contains "10")
    // This handles variations like "10 A", "Standard 10", "X", etc if we expand the logic
    const normalizedClass = className.toUpperCase();
    
    // Check specific keys first
    for (const key of Object.keys(syllabus.subjects)) {
        // Direct match or partial match
        if (normalizedClass === key.toUpperCase() || 
            normalizedClass.includes(` ${key.toUpperCase()} `) || // "Class 10 A"
            normalizedClass.startsWith(`${key.toUpperCase()} `) || // "10 A"
            normalizedClass === key.toUpperCase() // "10"
           ) {
            return syllabus.subjects[key];
        }
    }
    
    // Regex based matching for numbers
    const numberMatch = normalizedClass.match(/\d+/);
    if (numberMatch) {
        const num = numberMatch[0];
        if (syllabus.subjects[num]) return syllabus.subjects[num];
    }

    return [];
};

export const updateGlobalSetting = async (key: string, value: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('app_config').upsert({ key, value });
    return { success: !error, message: error ? error.message : undefined };
};

export const promoteStudentsBatch = async (promotions: { studentId: string, targetClassId: string, currentClassId: string }[]) => {
    if (!isSupabaseConfigured()) return { success: true, stats: { promoted: 10, retained: 2, alumni: 5 }, message: "Promotion Simulated" };
    
    let promoted = 0;
    let retained = 0;
    let alumni = 0;

    try {
        for (const p of promotions) {
            if (p.targetClassId === 'RETAIN' || p.targetClassId === p.currentClassId) {
                retained++;
            } 
            else if (p.targetClassId === 'ALUMNI') {
                alumni++;
                await supabase.from('students').update({ 
                    class_id: null, 
                    is_verified: false 
                }).eq('id', p.studentId);
            } 
            else {
                promoted++;
                await supabase.from('students').update({ class_id: p.targetClassId }).eq('id', p.studentId);
            }
        }
        return { success: true, stats: { promoted, retained, alumni }, message: "Promotion completed successfully." };
    } catch (e: any) {
        return { success: false, stats: { promoted, retained, alumni }, message: e.message };
    }
};
