
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { SubjectConfig } from '../../types';
import { getSchoolId, getErrorMsg, parseSubjects } from '../utils';

export const createClass = async (name: string, teacherPassword: string, teacherName: string, subjects: SubjectConfig[]) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };
    if (!isSupabaseConfigured()) return { success: true, id: `demo-class-${Date.now()}` };

    try {
        const { data, error } = await supabase.from('classes').insert([{
            school_id: schoolId,
            name: name.trim().toUpperCase(),
            teacher_password: teacherPassword.toLowerCase(),
            teacher_name: teacherName || "Class Teacher",
            subjects: subjects,
            status: 'DRAFT'
        }]).select().single();
        if (error) {
            if (error.code === '23505') return { success: false, message: "Class name exists." };
            throw error;
        }
        return { success: true, id: data.id };
    } catch (e: any) { return { success: false, message: getErrorMsg(e) }; }
};

// NEW: Bulk Create for Smart Batch Generator
export const createBulkClasses = async (batchData: { className: string, subjects: SubjectConfig[] }[]) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };
    if (!isSupabaseConfigured()) return { success: true, created: [] };

    try {
        const payload = batchData.map(cls => ({
            school_id: schoolId,
            name: cls.className.trim().toUpperCase(),
            teacher_name: "Class Teacher",
            teacher_password: null, // Left empty for invite claim flow
            subjects: cls.subjects || [],
            status: 'DRAFT'
        }));

        const { data, error } = await supabase.from('classes').insert(payload).select('id, name');
        
        if (error) throw error;
        
        return { success: true, created: data };
    } catch (e: any) {
        return { success: false, message: getErrorMsg(e) };
    }
};

export const getClasses = async () => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    
    // Fetch classes with students (fetching gender to calculate split)
    const { data } = await supabase.from('classes')
        .select('*, students(gender, is_verified)')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });
        
    return data?.map((c: any) => {
        const verifiedStudents = (c.students || []).filter((s: any) => s.is_verified);
        const boys = verifiedStudents.filter((s: any) => s.gender === 'Male').length;
        const girls = verifiedStudents.filter((s: any) => s.gender === 'Female').length;
        
        return {
            ...c,
            teacherName: c.teacher_name,
            teacherPhoto: c.teacher_photo,
            submissionStatus: c.status || 'DRAFT',
            subjects: parseSubjects(c.subjects),
            studentCount: verifiedStudents.length,
            boysCount: boys,
            girlsCount: girls
        };
    }) || [];
};

export const getClassBasicInfo = async (classId: string) => {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.from('classes')
      .select('id, name, school_id, teacher_password, schools(name)')
      .eq('id', classId)
      .maybeSingle();
    
    if (!data) return null;
    
    const schoolsData: any = data.schools;
    let schoolName = '';
    if (Array.isArray(schoolsData) && schoolsData.length > 0) {
        schoolName = schoolsData[0]?.name;
    } else if (schoolsData && typeof schoolsData === 'object') {
        schoolName = schoolsData?.name;
    }

    return {
        id: data.id,
        name: data.name,
        schoolId: data.school_id,
        schoolName: schoolName,
        hasPassword: !!data.teacher_password // Check if password exists
    };
};

export const updateClassDetails = async (classId: string, details: { teacherName?: string, teacherPhoto?: string }) => {
    if (!isSupabaseConfigured()) return { success: true };
    const payload: any = {};
    if (details.teacherName !== undefined) payload.teacher_name = details.teacherName;
    if (details.teacherPhoto !== undefined) payload.teacher_photo = details.teacherPhoto;
    
    const { error } = await supabase.from('classes').update(payload).eq('id', classId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const setupTeacherLogin = async (classId: string, password: string) => {
    if (!isSupabaseConfigured()) return { success: false, message: "DB Required" };
    
    // Check if already has password (safety check for claim)
    const { data: current } = await supabase.from('classes').select('teacher_password').eq('id', classId).single();
    if (current?.teacher_password) {
        // If password exists, this function shouldn't be used to reset it. Use changeClassPassword
        return { success: false, message: "Class already claimed. Please login." };
    }

    const { error } = await supabase.from('classes')
      .update({ teacher_password: password.toLowerCase() })
      .eq('id', classId);
    
    if (error) return { success: false, message: getErrorMsg(error) };

    const { data: clsData } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (!clsData) return { success: false };

    localStorage.setItem('school_id', clsData.school_id);
    const {data: s} = await supabase.from('schools').select('name, place, logo_url, theme_color, is_pro').eq('id', clsData.school_id).single();

    return { 
        success: true, 
        user: { 
            ...clsData, 
            name: clsData.name, 
            teacherName: clsData.teacher_name, 
            submissionStatus: clsData.status || 'DRAFT', 
            subjects: parseSubjects(clsData.subjects),
            schoolName: s?.name, 
            schoolPlace: s?.place,
            schoolLogoUrl: s?.logo_url,
            schoolThemeColor: s?.theme_color,
            isPro: s?.is_pro,
            schoolId: clsData.school_id
        } 
    };
};

export const changeClassPassword = async (classId: string, newPassword: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('classes').update({ teacher_password: newPassword.toLowerCase() }).eq('id', classId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const getClassesForLogin = async () => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    const { data } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name', { ascending: true });
    return data || [];
};

export const getClassesForPublic = async (schoolId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name', { ascending: true });
    return data || [];
};

export const getSchoolProgress = async () => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    const { data: classes } = await supabase.from('classes').select('id, name, status, students(count)').eq('school_id', schoolId).order('name', { ascending: true });
    if (!classes) return [];
    
    return await Promise.all(classes.map(async (cls: any) => {
        const totalStudents = cls.students?.[0]?.count || 0;
        let gradedCount = 0;
        if (totalStudents > 0) {
          const { data: stuIds } = await supabase.from('students').select('id').eq('class_id', cls.id);
          if (stuIds && stuIds.length > 0) {
              const { count } = await supabase.from('marks').select('student_id', { count: 'exact', head: true }).in('student_id', stuIds.map(s => s.id)).neq('total', 0);
              gradedCount = count || 0;
          }
        }
        return { id: cls.id, name: cls.name, status: cls.status || 'DRAFT', totalStudents, gradedCount };
    }));
};

export const updateClassSubjects = async (classId: string, subjects: SubjectConfig[]) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('classes').update({ subjects }).eq('id', classId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const toggleClassSubmission = async (classId: string, isSubmitted: boolean) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('classes').update({ status: isSubmitted ? 'SUBMITTED' : 'DRAFT' }).eq('id', classId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const updateClassStatus = async (classId: string, status: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('classes').update({ status }).eq('id', classId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const unlockClass = async (classId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('classes').update({ status: 'DRAFT' }).eq('id', classId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const deleteClass = async (classId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    try {
        const { data: students } = await supabase.from('students').select('id').eq('class_id', classId);
        const studentIds = students?.map(s => s.id) || [];
        if (studentIds.length > 0) {
            await supabase.from('marks').delete().in('student_id', studentIds);
            await supabase.from('profile_requests').delete().in('student_id', studentIds);
            await supabase.from('students').delete().eq('class_id', classId);
        }
        const { error } = await supabase.from('classes').delete().eq('id', classId);
        if (error) throw error;
        return { success: true };
    } catch (e: any) { return { success: false, message: getErrorMsg(e) }; }
};

export const deleteUnverifiedStudents = async (classId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').delete().eq('class_id', classId).eq('is_verified', false);
    return { success: !error };
};
