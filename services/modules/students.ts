
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ProfileRequest } from '../../types';
import { getSchoolId, getErrorMsg, transformStudent, transformMarks, mergeCustomData } from '../utils';

export const createStudent = async (classId: string, student: { regNo: string, rollNo?: string, name: string, dob: string, gender?: string, fatherName: string, motherName: string, photoUrl?: string, addedBy?: string, customData?: any }) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };
    if (!isSupabaseConfigured()) return { success: true };

    try {
        const payload: any = {
            school_id: schoolId,
            class_id: classId,
            reg_no: student.regNo,
            name: student.name.toUpperCase(),
            dob: student.dob || null, // FIX: Convert empty string to null
            gender: student.gender || 'Male', // FIX: Default gender
            father_name: student.fatherName,
            mother_name: student.motherName,
            photo_url: student.photoUrl,
            is_verified: true,
            added_by: student.addedBy
        };
        
        // FIX: Parse Int safely
        if (student.rollNo) {
            const r = parseInt(student.rollNo);
            if (!isNaN(r)) payload.roll_no = r;
        }
        
        // Merge Custom Data into social_links if present
        if (student.customData && Object.keys(student.customData).length > 0) {
            payload.social_links = mergeCustomData({}, student.customData);
        }

        const { error } = await supabase.from('students').insert([payload]);
        if (error) {
            if (error.code === '23505') return { success: false, message: "Register Number exists." };
            throw error;
        }
        return { success: true };
    } catch (e: any) { return { success: false, message: getErrorMsg(e) }; }
};

export const updateStudentDetails = async (studentId: string, updates: any) => {
    if (!isSupabaseConfigured()) return { success: true };
    
    // Map camelCase to snake_case for DB
    const payload: any = {};
    if (updates.name) payload.name = updates.name.toUpperCase();
    if (updates.regNo) payload.reg_no = updates.regNo;
    if (updates.rollNo) payload.roll_no = parseInt(updates.rollNo) || null;
    if (updates.dob) payload.dob = updates.dob;
    if (updates.gender) payload.gender = updates.gender;
    if (updates.fatherName) payload.father_name = updates.fatherName;
    if (updates.motherName) payload.mother_name = updates.motherName;
    if (updates.phone) payload.phone = updates.phone;
    
    const { error } = await supabase.from('students').update(payload).eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

// NEW: For Premium Customization
export const updateStudentPreferences = async (studentId: string, preferences: any) => {
    if (!isSupabaseConfigured()) return { success: true };
    
    // Retrieving current social links first to merge
    const { data } = await supabase.from('students').select('social_links').eq('id', studentId).single();
    const current = data?.social_links || {};
    const updated = { ...current, _preferences: preferences };

    const { error } = await supabase.from('students').update({ social_links: updated }).eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const transferStudentAdmission = async (studentId: string, targetClassId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').update({ class_id: targetClassId }).eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const deleteStudent = async (studentId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const publicRegisterStudent = async (schoolId: string, classId: string, studentData: any) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { data: school } = await supabase.from('schools').select('allow_public_admission').eq('id', schoolId).single();
    if (school && school.allow_public_admission === false) return { success: false, message: "Admissions closed." };

    // Basic payload
    const payload: any = {
        school_id: schoolId,
        class_id: classId,
        reg_no: studentData.regNo,
        name: studentData.name.toUpperCase(),
        dob: studentData.dob,
        gender: studentData.gender || 'Male',
        father_name: studentData.fatherName,
        mother_name: studentData.motherName,
        is_verified: false,
        added_by: 'Public Registration',
        // New Fields
        phone: studentData.phone,
        address: studentData.address,
        password: studentData.password,
        blood_group: studentData.bloodGroup,
        photo_url: studentData.photoUrl
    };
    
    // Roll No is optional in new flow, but if passed
    if (studentData.rollNo) {
         const r = parseInt(studentData.rollNo);
         if(!isNaN(r)) payload.roll_no = r;
    }
    
    // Merge Custom Data into social_links
    if (studentData.customData && Object.keys(studentData.customData).length > 0) {
        payload.social_links = mergeCustomData({}, studentData.customData);
    }

    const { error } = await supabase.from('students').insert([payload]);
    if (error) {
        if (error.code === '23505') return { success: false, message: "Register Number/Admission No already exists." };
        return { success: false, message: getErrorMsg(error) };
    }
    return { success: true };
};

export const checkAdmissionStatus = async (phone: string, credential: string) => {
    if (!isSupabaseConfigured()) return { found: false, message: "DB Disconnected" };
    try {
        // Fetch users with this phone number
        const { data: applications } = await supabase.from('students')
            .select('*, classes(name), schools(name)')
            .eq('phone', phone)
            .order('created_at', { ascending: false });

        if (!applications || applications.length === 0) {
            return { found: false, message: "No application found with this phone number." };
        }

        // SMART CHECK: Match either Password OR Date of Birth
        // Filter ALL matches (handling twins or siblings with same password)
        const matches = applications.filter(app => 
            app.password === credential || 
            app.dob === credential
        );

        if (matches.length === 0) {
            return { found: false, message: "Invalid Password or Date of Birth." };
        }

        const matchData = matches.map(match => ({
            status: match.is_verified ? 'APPROVED' : 'PENDING',
            student: { ...transformStudent(match), className: match.classes?.name, schoolName: match.schools?.name }
        }));

        return {
            found: true,
            matches: matchData,
            message: undefined
        };

    } catch (e: any) {
        return { found: false, message: getErrorMsg(e) };
    }
};

// NEW: Global Search for Login (Smart Search)
export const findStudentsForLogin = async (schoolId: string, query: string) => {
    if (!isSupabaseConfigured()) return [];
    if (query.length < 3) return [];

    try {
        const { data } = await supabase.from('students')
            .select('id, reg_no, name, father_name, class_id, classes(name)')
            .eq('school_id', schoolId)
            .eq('is_verified', true)
            .ilike('name', `%${query}%`)
            .limit(10);

        return (data || []).map((s: any) => ({
            id: s.id,
            regNo: s.reg_no,
            name: s.name,
            fatherName: s.father_name,
            className: s.classes?.name
        }));
    } catch (e) {
        console.error("Search error", e);
        return [];
    }
};

export const publicSearch = async (regNo: string, dob: string, schoolId?: string) => {
    if (!isSupabaseConfigured()) return null;
    try {
        let query = supabase.from('students').select('*').eq('reg_no', regNo).eq('dob', dob).eq('is_verified', true).limit(1);
        
        if (schoolId) {
           query = query.eq('school_id', schoolId);
        }
        
        const { data: students, error } = await query;

        if (error || !students || students.length === 0) return null;
        const student = transformStudent(students[0]);
        const { data: marksData } = await supabase.from('marks').select('*').eq('student_id', student.id).limit(1);
        return { student, marks: marksData && marksData.length > 0 ? transformMarks(marksData[0]) : { studentId: student.id, subjects: {}, total: 0, grade: 'N/A', term: 'N/A' } };
    } catch (e) { return null; }
};

export const getStudentsByClass = async (classId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data: rpcData, error } = await supabase.rpc('get_class_students', { cls_id: classId });
    if (!error && rpcData) return rpcData.map(transformStudent);
    
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).eq('is_verified', true).order('roll_no', { ascending: true, nullsFirst: false });
    return data?.map(transformStudent) || [];
};

export const getStudentNamesForLogin = async (classId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase.rpc('get_class_student_names', { cls_id: classId });
    if (!error && data) return data;
    return [];
};

export const getPendingAdmissions = async (classId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data: rpcData, error } = await supabase.rpc('get_pending_admissions', { cls_id: classId });
    if (!error && rpcData) return rpcData.map(transformStudent);
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).eq('is_verified', false).order('created_at', { ascending: false });
    return data?.map(transformStudent) || [];
};

export const getSchoolPendingAdmissions = async () => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    if(!schoolId) return [];
    const { data } = await supabase.from('students').select('*, classes(name)').eq('school_id', schoolId).eq('is_verified', false).order('created_at', { ascending: false });
    return (data || []).map(s => ({
        ...transformStudent(s),
        className: s.classes?.name || 'Unknown Class'
    }));
};

export const verifyStudent = async (studentId: string, verifiedBy?: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').update({ 
        is_verified: true,
        verified_by: verifiedBy
    }).eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const rejectAdmission = async (studentId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const changePassword = async (studentId: string, newPass: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').update({ password: newPass.toLowerCase() }).eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const resetStudentPassword = async (studentId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('students').update({ password: null }).eq('id', studentId);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const activateStudentPremium = async (studentId: string, txnId: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const { error } = await supabase.from('students').update({ 
        is_premium: true, 
        premium_expiry: expiry.toISOString()
    }).eq('id', studentId);

    return { success: !error, message: error ? getErrorMsg(error) : "Student Premium Unlocked!" };
};

// --- GLOBAL SEARCH FOR ADMIN ---
export const searchAllStudents = async (query: string) => {
    if (!isSupabaseConfigured()) return [];
    if (!query || query.length < 2) return [];
    
    const schoolId = getSchoolId();
    if (!schoolId) return [];

    const { data } = await supabase.from('students')
        .select('id, name, reg_no, class_id, classes(name), is_verified')
        .eq('school_id', schoolId)
        .or(`name.ilike.%${query}%,reg_no.ilike.%${query}%`)
        .limit(10);
        
    return (data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        regNo: s.reg_no,
        className: s.classes?.name || 'Unknown',
        isVerified: s.is_verified
    }));
};

// Profile Requests
export const createProfileRequest = async (studentId: string, field: string, newValue: string) => {
    const schoolId = getSchoolId();
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('profile_requests').insert([{
        school_id: schoolId,
        student_id: studentId,
        field,
        new_value: newValue,
        status: 'PENDING'
    }]);
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const getStudentRequests = async (studentId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase.from('profile_requests').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    return (data || []).map((r: any) => ({
        id: r.id,
        studentId: r.student_id,
        field: r.field,
        newValue: r.new_value,
        status: r.status,
        createdAt: r.created_at
    }));
};

export const getPendingRequestsForClass = async (classId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data: students } = await getStudentsByClass(classId); 
    if (!students || students.length === 0) return [];
    const { data } = await supabase.from('profile_requests').select('*').in('student_id', students.map(s => s.id)).eq('status', 'PENDING');
    if (!data) return [];
    return data.map((r: any) => {
        const stu = students.find(s => s.id === r.student_id);
        return {
            id: r.id,
            studentId: r.student_id,
            studentName: stu?.name,
            regNo: stu?.regNo,
            field: r.field,
            newValue: r.new_value,
            status: r.status,
            createdAt: r.created_at
        } as ProfileRequest;
    });
};

export const resolveProfileRequest = async (request: ProfileRequest, action: 'APPROVED' | 'REJECTED') => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error: reqError } = await supabase.from('profile_requests').update({ status: action }).eq('id', request.id);
    if (reqError) return { success: false, message: reqError.message };

    if (action === 'APPROVED') {
        const dbField = request.field === 'fatherName' ? 'father_name' : request.field === 'motherName' ? 'mother_name' : request.field === 'dob' ? 'dob' : request.field === 'photoUrl' ? 'photo_url' : 'name';
        const { error: stuError } = await supabase.from('students').update({ [dbField]: request.newValue }).eq('id', request.studentId);
        if (stuError) return { success: false, message: stuError.message };
    }
    return { success: true };
};
