

import { supabase } from './supabaseClient';
import { ClassData, Marks, ProfileRequest, Role, Student, SchoolConfig, SubjectConfig } from '../types';

const getSchoolId = () => localStorage.getItem('school_id');

const parseSubjects = (json: any): SubjectConfig[] => {
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

export const api = {
  // --- Auth & Registration ---
  
  generateRecoveryCode: () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      // Use crypto for cryptographically strong random values
      const randomValues = new Uint32Array(16);
      window.crypto.getRandomValues(randomValues);
      
      let result = 'REC';
      for (let i = 0; i < 16; i++) {
          // Add a dash every 4 characters
          if (i % 4 === 0) result += '-';
          result += chars[randomValues[i] % chars.length];
      }
      return result; // Format: REC-XXXX-XXXX-XXXX-XXXX
  },

  registerSchool: async (name: string, email: string, password: string, phone: string, place: string, recoveryCode: string) => {
      try {
          const cleanEmail = email.trim().toLowerCase(); 
          
          // 1. Create Auth User with Metadata (Trigger will create the School row automatically)
          const { data: authData, error: authError } = await supabase.auth.signUp({
              email: cleanEmail,
              password,
              options: {
                  data: {
                      school_name: name,
                      phone: phone,
                      place: place,
                      recovery_code: recoveryCode
                  }
              }
          });
          
          if (authError) throw authError;

          // CRITICAL CHECK: If Confirm Email is ON in Supabase, session will be null.
          if (authData.user && !authData.session) {
              return { 
                  success: false, 
                  message: "Registration blocked. Please go to Supabase -> Auth -> Providers -> Email and DISABLE 'Confirm Email' setting." 
              };
          }

          if (authData.user) {
              // 2. Wait for Trigger to create school and fetch it
              let schoolData = null;
              for(let i=0; i<5; i++) {
                  const { data } = await supabase
                      .from('schools')
                      .select('id')
                      .eq('auth_id', authData.user.id)
                      .single();
                  
                  if(data) {
                      schoolData = data;
                      break;
                  }
                  await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
              }

              if (schoolData) {
                  return { success: true, schoolId: schoolData.id };
              } else {
                  return { success: false, message: "School creation failed (Database Trigger Issue). Please check if SQL was run correctly." };
              }
          }
          return { success: false, message: "User creation failed" };
      } catch (e: any) {
          console.error(e);
          return { success: false, message: e.message };
      }
  },

  recoverPassword: async (email: string) => {
      try {
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
              redirectTo: window.location.origin + '/#/login?reset=true'
          });
          if (error) throw error;
          return { success: true, message: "Password reset link sent to your email." };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  resetPasswordWithRecoveryCode: async (email: string, code: string, newPassword: string) => {
      try {
          const { data, error } = await supabase.rpc('reset_password_with_code', {
              email_input: email.trim(),
              code_input: code.trim(),
              new_password_input: newPassword
          });

          if (error) throw error;
          if (data === true) {
              return { success: true, message: "Password reset successfully! You can login now." };
          } else {
              return { success: false, message: "Invalid Email or Recovery Code." };
          }
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  updateUserPassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return { success: !error, message: error?.message };
  },

  // --- SCHOOL LOOKUP LOGIC ---

  getSchoolBySlug: async (slug: string) => {
      try {
          const { data, error } = await supabase
              .from('schools')
              .select('id, name')
              .eq('slug', slug.trim().toLowerCase())
              .maybeSingle();
          
          if (error) return null;
          return data;
      } catch (e) {
          return null;
      }
  },
  
  // Try to find school by Slug first, if that looks like a UUID or fails, try by ID.
  getSchoolByIdOrSlug: async (identifier: string) => {
      // 1. If it looks like a valid UUID (length 36, typical UUID chars), try ID first
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      if (isUUID) {
           const { data } = await supabase.from('schools').select('id, name').eq('id', identifier).maybeSingle();
           if (data) return data;
      }

      // 2. Try as Slug
      const bySlug = await api.getSchoolBySlug(identifier);
      if (bySlug) return bySlug;
      
      return null;
  },

  getSchoolByAdmissionToken: async (token: string) => {
      try {
          const { data, error } = await supabase
              .from('schools')
              .select('id, name')
              .eq('admission_token', token.trim())
              .maybeSingle();
          
          if (error) return null;
          return data;
      } catch (e) {
          return null;
      }
  },

  regenerateAdmissionToken: async () => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };
      
      // Generate a random secure token
      const array = new Uint32Array(4);
      window.crypto.getRandomValues(array);
      const token = Array.from(array, dec => dec.toString(36)).join('');

      const { error } = await supabase
        .from('schools')
        .update({ admission_token: token })
        .eq('id', schoolId);
        
      if (error) return { success: false, message: error.message };
      return { success: true, token };
  },

  checkSlugAvailability: async (slug: string) => {
      const schoolId = getSchoolId();
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      
      if (cleanSlug.length < 3) return { available: false, message: "Too short (min 3 chars)" };

      const { data: existing } = await supabase.from('schools').select('id').eq('slug', cleanSlug).maybeSingle();
      
      // If it exists AND it's not the current school's ID -> Taken
      if (existing && existing.id !== schoolId) {
          return { available: false, message: "Not available" };
      }
      return { available: true, message: "Available", cleanSlug };
  },

  updateSchoolSlug: async (slug: string) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };
      
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''); 
      
      if (cleanSlug.length < 3) return { success: false, message: "Code must be at least 3 characters" };

      // Check uniqueness
      const { data: existing } = await supabase.from('schools').select('id').eq('slug', cleanSlug).maybeSingle();
      if (existing && existing.id !== schoolId) {
          return { success: false, message: "This code is already taken. Try another." };
      }

      const { error } = await supabase.from('schools').update({ slug: cleanSlug }).eq('id', schoolId);
      return { success: !error, message: error?.message };
  },

  findSchoolByEmailOrName: async (query: string) => {
    // Try by slug first (exact match)
    const { data: slugMatch } = await supabase
        .from('schools')
        .select('id, name, slug')
        .eq('slug', query.toLowerCase())
        .maybeSingle();
    
    if (slugMatch) return [slugMatch];

    // Try by email
    const { data: emailMatch } = await supabase
        .from('schools')
        .select('id, name, slug')
        .eq('admin_email', query.toLowerCase())
        .maybeSingle();

    if (emailMatch) return [emailMatch];

    // Try by Name (Partial)
    const { data: nameMatch } = await supabase
        .from('schools')
        .select('id, name, slug')
        .ilike('name', `%${query}%`)
        .limit(5);

    return nameMatch || [];
  },

  login: async (role: Role, credentials: any) => {
    try {
        if (role === Role.ADMIN) {
            // Secure Admin Login
            const cleanEmail = credentials.email.trim(); 
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: credentials.password
            });
            
            if (error) return { success: false, message: error.message };

            // Fetch School Details associated with this user
            const { data } = await supabase
                .from('schools')
                .select('*')
                .eq('auth_id', authData.user?.id)
                .single();
            
            if (data) {
                localStorage.setItem('school_id', data.id); 
                return { success: true, user: data };
            }
        }
        
        if (role === Role.TEACHER) {
            // Secure Teacher Login via RPC
            const { data, error } = await supabase.rpc('teacher_login', {
                cls_name: credentials.classId.toUpperCase(),
                pass: credentials.password.toLowerCase(),
                schl_id: getSchoolId()
            });
            
            if (data && !error) {
                const clsData = data as any;
                localStorage.setItem('school_id', clsData.school_id);
                return { 
                    success: true, 
                    user: { 
                        ...clsData, 
                        name: clsData.name, 
                        teacherName: clsData.teacher_name,
                        subjects: parseSubjects(clsData.subjects) 
                    } 
                };
            }
        }

        if (role === Role.STUDENT) {
            // Secure Student Login via RPC
            const { data, error } = await supabase.rpc('student_login', {
                reg_no_in: credentials.id,
                pass_in: credentials.password,
                schl_id: getSchoolId()
            });
            
            if (data && !error) {
                const stuData = data as any;
                localStorage.setItem('school_id', stuData.school_id);
                return { success: true, user: transformStudent(stuData) };
            } else {
                 return { success: false, message: "Invalid Credentials or Account Not Verified." };
            }
        }
    } catch (e) {
        console.error("Login error", e);
    }
    return { success: false, message: "Invalid Credentials" };
  },

  changePassword: async (studentId: string, newPass: string) => {
      const { error } = await supabase.from('students').update({ password: newPass }).eq('id', studentId);
      return { success: !error, message: error?.message };
  },

  resetStudentPassword: async (studentId: string) => {
      const { error } = await supabase.from('students').update({ password: null }).eq('id', studentId);
      return { success: !error, message: error?.message };
  },

  // --- Classes Management ---
  createClass: async (name: string, teacherPassword: string, teacherName: string, subjects: SubjectConfig[]) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };

    try {
        const finalClassName = name.trim().toUpperCase();

        // Check if class name exists for this school
        const { data: existingClass } = await supabase
            .from('classes')
            .select('id')
            .eq('school_id', schoolId)
            .ilike('name', finalClassName) 
            .maybeSingle();

        if (existingClass) {
            return { success: false, message: "A class with this name already exists. Please choose a unique name (e.g. 10 B)." };
        }

        const { error } = await supabase.from('classes').insert([{
            school_id: schoolId,
            name: finalClassName,
            teacher_password: teacherPassword.toLowerCase(), // Store as lowercase for case-insensitive check
            teacher_name: teacherName,
            subjects: JSON.stringify(subjects)
        }]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  },

  getClasses: async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    
    // Admin can select because of RLS policy
    const { data } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('name', { ascending: true });
    
    return data?.map(c => ({
        ...c,
        teacherName: c.teacher_name,
        subjects: parseSubjects(c.subjects)
    })) || [];
  },

  getClassesForPublic: async (schoolId: string) => {
    // Policy allows public read of classes
    const { data } = await supabase.from('classes').select('id, name').eq('school_id', schoolId).order('name', { ascending: true });
    return data || [];
  },

  getClassesForLogin: async () => {
      const schoolId = getSchoolId();
      if (!schoolId) return [];
      return await api.getClassesForPublic(schoolId);
  },

  updateClassSubjects: async (classId: string, subjects: SubjectConfig[]) => {
      const { error } = await supabase.from('classes').update({ 
          subjects: JSON.stringify(subjects) 
      }).eq('id', classId);
      return { success: !error, message: error?.message };
  },

  deleteClass: async (classId: string) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session missing" };

      try {
          // Manual Cascade Delete Strategy
          // 1. Get Student IDs
          const { data: students } = await supabase.from('students').select('id').eq('class_id', classId);
          const studentIds = students?.map(s => s.id) || [];

          if (studentIds.length > 0) {
              // 2. Delete Marks (Must be first due to FK)
              const { error: mErr } = await supabase.from('marks').delete().in('student_id', studentIds);
              if (mErr) throw mErr;

              // 3. Delete Profile Requests
              const { error: pErr } = await supabase.from('profile_requests').delete().in('student_id', studentIds);
              if (pErr) throw pErr;

              // 4. Delete Students
              const { error: sErr } = await supabase.from('students').delete().eq('class_id', classId);
              if (sErr) throw sErr;
          }
          
          // 5. Delete Class
          const { error } = await supabase.from('classes').delete().eq('id', classId);
          
          if (error) throw error;
          return { success: true, message: "Class deleted successfully" };
      } catch (e: any) {
          console.error("Delete Class Error:", e);
          return { success: false, message: e.message || "Delete failed" };
      }
  },

  // --- Students Management ---
  addStudents: async (classId: string, students: { regNo: string, name: string, dob: string }[]) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };

      try {
          const payload = students.map(s => ({
              school_id: schoolId,
              class_id: classId,
              reg_no: s.regNo,
              name: s.name,
              dob: s.dob,
              is_verified: true
          }));

          const { error } = await supabase.from('students').insert(payload);
          if (error) throw error;
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  publicRegisterStudent: async (schoolId: string, classId: string, studentData: any) => {
      try {
          const payload = {
              school_id: schoolId,
              class_id: classId,
              reg_no: studentData.regNo,
              name: studentData.name,
              dob: studentData.dob,
              father_name: studentData.fatherName,
              mother_name: studentData.motherName,
              is_verified: false
          };

          const { error } = await supabase.from('students').insert([payload]);
          if (error) {
              if (error.code === '23505') return { success: false, message: "Register Number already exists in this school." };
              throw error;
          }
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  publicSearch: async (regNo: string, dob: string) => {
      try {
          // Find student
          const { data: students, error } = await supabase
            .from('students')
            .select('*')
            .eq('reg_no', regNo)
            .eq('dob', dob)
            .eq('is_verified', true)
            .limit(1);

          if (error || !students || students.length === 0) return null;
          
          const student = transformStudent(students[0]);
          
          // Get marks (prefer Term 1 or latest)
          const { data: marksData } = await supabase
            .from('marks')
            .select('*')
            .eq('student_id', student.id)
            .limit(1);
            
          let marks: Marks;
          if (marksData && marksData.length > 0) {
              marks = transformMarks(marksData[0]);
          } else {
              marks = { 
                  studentId: student.id, 
                  subjects: {}, 
                  total: 0, 
                  grade: 'N/A', 
                  term: 'N/A' 
              };
          }

          return { student, marks };
      } catch (e) {
          return null;
      }
  },

  getStudentsByClass: async (classId: string) => {
    // Try RPC first (for Teachers)
    const { data: rpcData, error } = await supabase.rpc('get_class_students', { cls_id: classId });
    
    if (!error && rpcData) {
        return rpcData.map(transformStudent);
    }
    
    // Fallback for Admin (RLS allows select)
    const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .eq('is_verified', true)
        .order('reg_no', { ascending: true });
    return data?.map(transformStudent) || [];
  },

  getStudentNamesForLogin: async (classId: string) => {
    // Use Safe RPC to avoid exposing passwords
    const { data, error } = await supabase.rpc('get_class_student_names', { cls_id: classId });
    if (!error && data) return data;
    return [];
  },

  getPendingAdmissions: async (classId: string) => {
    // RPC for teachers
    const { data: rpcData, error } = await supabase.rpc('get_pending_admissions', { cls_id: classId });
    
    if (!error && rpcData) {
        return rpcData.map(transformStudent);
    }
    
    // Fallback for Admin
    const { data } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });
    return data?.map(transformStudent) || [];
  },

  verifyStudent: async (studentId: string) => {
      const { error } = await supabase.from('students').update({ is_verified: true }).eq('id', studentId);
      return { success: !error, message: error?.message };
  },

  rejectAdmission: async (studentId: string) => {
      const { error } = await supabase.from('students').delete().eq('id', studentId);
      return { success: !error, message: error?.message };
  },

  // --- Marks ---
  getMarks: async (studentId: string, term: string) => {
    // Try RPC first
    const { data: rpcData, error } = await supabase.rpc('get_student_marks', { stu_id: studentId, term_in: term });
    
    if (!error && rpcData && rpcData.length > 0) {
        return transformMarks(rpcData[0]);
    }

    // Fallback for Admin
    const { data } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .single();
    
    if (data) return transformMarks(data);
    return null;
  },

  getClassMarks: async (studentIds: string[], term: string) => {
    if (studentIds.length === 0) return [];
    
    // Admin RLS
    const { data } = await supabase
        .from('marks')
        .select('*')
        .in('student_id', studentIds)
        .eq('term', term);
        
    return data?.map(transformMarks) || [];
  },

  saveMarks: async (marks: Marks) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false };
    
    // Use RPC to bypass RLS for teachers
    const { error } = await supabase.rpc('save_marks', {
        stu_id: marks.studentId,
        term_in: marks.term,
        sub_json: marks.subjects,
        tot: marks.total,
        grd: marks.grade
    });

    if (error) {
        console.error("Save Marks Error", error);
        return { success: false, message: error.message };
    }
    return { success: true };
  },

  // --- Profile Requests ---
  createProfileRequest: async (studentId: string, field: string, newValue: string) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };

      try {
          const { error } = await supabase.from('profile_requests').insert([{
              school_id: schoolId,
              student_id: studentId,
              field,
              new_value: newValue,
              status: 'PENDING'
          }]);
          if (error) throw error;
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  getStudentRequests: async (studentId: string) => {
      const { data } = await supabase.from('profile_requests').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
      return (data || []).map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          field: r.field,
          newValue: r.new_value,
          status: r.status,
          createdAt: r.created_at
      }));
  },

  getPendingRequestsForClass: async (classId: string) => {
      const { data: students } = await api.getStudentsByClass(classId); 
      if (!students || students.length === 0) return [];
      
      const studentIds = students.map(s => s.id);

      const { data } = await supabase
          .from('profile_requests')
          .select('*')
          .in('student_id', studentIds)
          .eq('status', 'PENDING');
          
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
  },

  resolveProfileRequest: async (request: ProfileRequest, action: 'APPROVED' | 'REJECTED') => {
      try {
          const { error: reqError } = await supabase
            .from('profile_requests')
            .update({ status: action })
            .eq('id', request.id);
            
          if (reqError) throw reqError;

          if (action === 'APPROVED') {
              const dbField = request.field === 'fatherName' ? 'father_name' : 
                              request.field === 'motherName' ? 'mother_name' : 
                              request.field === 'dob' ? 'dob' : 'name';
              
              const { error: stuError } = await supabase
                .from('students')
                .update({ [dbField]: request.newValue })
                .eq('id', request.studentId);
                
              if (stuError) throw stuError;
          }
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  // --- Config & License ---
  getSchoolConfig: async () => {
      const schoolId = getSchoolId();
      if (!schoolId) return null;

      const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single();
      if (!data) return null;
      
      return {
          id: data.id,
          schoolName: data.name,
          slug: data.slug,
          sheetUrl: '',
          licenseKey: data.license_key || 'FREE',
          isPro: data.is_pro || false,
          themeColor: 'indigo',
          expiryDate: data.expiry_date,
          adminEmail: data.admin_email,
          phone: data.phone,
          place: data.place,
          paymentStatus: data.payment_status || 'FREE',
          transactionRef: data.transaction_ref,
          allowTeacherSubjectEdit: data.allow_teacher_edit || false, // Read from DB
          admissionToken: data.admission_token
      };
  },

  updateSchoolSettings: async (settings: Partial<SchoolConfig>) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };
      
      const payload: any = {};
      if (settings.allowTeacherSubjectEdit !== undefined) {
          payload.allow_teacher_edit = settings.allowTeacherSubjectEdit;
      }
      
      const { error } = await supabase.from('schools').update(payload).eq('id', schoolId);
      return { success: !error, message: error?.message };
  },
  
  getSchoolDetailsPublic: async (schoolId: string) => {
      const { data } = await supabase.from('schools').select('name').eq('id', schoolId).single();
      return data;
  },

  requestProUpgrade: async (schoolId: string, transactionRef: string) => {
      const { error } = await supabase.rpc('request_pro_upgrade', { 
          school_id_in: schoolId, 
          trans_ref_in: transactionRef 
      });
      return { success: !error, message: error?.message };
  },

  approveUpgradeRequest: async (schoolId: string) => {
      const { error } = await supabase.rpc('sa_approve_upgrade', { school_id_in: schoolId });
      return { success: !error, message: error?.message };
  },

  rejectUpgradeRequest: async (schoolId: string) => {
      const { error } = await supabase.rpc('sa_reject_upgrade', { school_id_in: schoolId });
      return { success: !error, message: error?.message };
  },

  activateLicense: async (key: string) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false };

      if (key.startsWith('PRO-')) {
          const expiry = new Date();
          expiry.setFullYear(expiry.getFullYear() + 1);
          
          await supabase.from('schools').update({
              is_pro: true,
              license_key: key,
              expiry_date: expiry.toISOString()
          }).eq('id', schoolId);
          return { success: true, message: `Pro License Activated. Valid until ${expiry.toLocaleDateString()}` };
      }
      return { success: false, message: "Invalid Key" };
  },
  
  // Helpers
  toggleSchoolStatus: async (schoolId: string, currentStatus: boolean) => {
      const { error } = await supabase.from('schools').update({ is_pro: !currentStatus }).eq('id', schoolId);
      return { success: !error };
  },

  getAllSchools: async () => {
      const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      return (data || []).map((s: any) => ({
          id: s.id,
          schoolName: s.name,
          adminEmail: s.admin_email,
          isPro: s.is_pro,
          paymentStatus: s.payment_status || 'FREE',
          transactionRef: s.transaction_ref,
          phone: s.phone,
          place: s.place,
          createdAt: s.created_at
      }));
  },

  deleteSchool: async (schoolId: string) => {
      // Very dangerous - manual cascade
      // Deleting School will likely fail if tables are not cascading.
      // Assuming Admin has cascade privileges or we do it manually.
      // For now, simpler implementation:
      const { error } = await supabase.from('schools').delete().eq('id', schoolId);
      return { success: !error, message: error?.message };
  }
};

// Transformers
const transformStudent = (s: any): Student => ({
    id: s.id,
    regNo: s.reg_no,
    name: s.name,
    classId: s.class_id,
    dob: s.dob,
    fatherName: s.father_name,
    motherName: s.mother_name,
    isVerified: s.is_verified
});

const transformMarks = (m: any): Marks => {
    return {
        studentId: m.student_id,
        term: m.term,
        subjects: typeof m.subjects === 'string' ? JSON.parse(m.subjects) : m.subjects,
        total: m.total,
        grade: m.grade
    };
};
