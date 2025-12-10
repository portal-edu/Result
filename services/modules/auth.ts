
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Role } from '../../types';
import { getSchoolId, getErrorMsg, parseSubjects, transformStudent } from '../utils';

export const generateRecoveryCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomValues = new Uint32Array(16);
    window.crypto.getRandomValues(randomValues);
    let result = 'REC';
    for (let i = 0; i < 16; i++) {
        if (i % 4 === 0) result += '-';
        result += chars[randomValues[i] % chars.length];
    }
    return result;
};

export const registerSchool = async (
    name: string, 
    email: string, 
    password: string, 
    phone: string, 
    place: string, 
    recoveryCode: string, 
    referralCode?: string,
    attribution?: { refId?: string, source?: string }
) => {
    // Requires DB connection
    if (!isSupabaseConfigured()) {
        return { success: false, message: "Database not connected. Please check configuration." };
    }

    try {
        const cleanEmail = email.trim().toLowerCase(); 
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
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

        if (authData.user && !authData.session) {
            return { success: false, message: "Registration successful. Please check email to confirm." };
        }

        if (authData.user) {
            const { data: existing } = await supabase.from('schools').select('id').eq('auth_id', authData.user.id).maybeSingle();
            
            if (existing) {
                return { success: true, schoolId: existing.id };
            }

            const { data: newSchool, error: insertError } = await supabase.from('schools').insert([{
                auth_id: authData.user.id,
                name: name,
                admin_email: cleanEmail,
                phone: phone,
                place: place,
                referral_code: referralCode || null,
                allow_teacher_edit: true,
                recovery_code: recoveryCode,
                referred_by_school_id: attribution?.refId || null,
                referral_source: attribution?.source || null
            }]).select().single();

            if (insertError) {
                const { data: retry } = await supabase.from('schools').select('id').eq('auth_id', authData.user.id).maybeSingle();
                if (retry) return { success: true, schoolId: retry.id };
                return { success: false, message: "School profile creation failed: " + insertError.message };
            }

            return { success: true, schoolId: newSchool.id };
        }
        return { success: false, message: "User creation failed" };
    } catch (e: any) {
        return { success: false, message: getErrorMsg(e) };
    }
};

export const login = async (role: Role, credentials: any) => {
    if (!isSupabaseConfigured()) {
        return { success: false, message: "Database not connected." };
    }

    try {
        if (role === Role.ADMIN) {
            const cleanEmail = credentials.email.trim(); 
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password: credentials.password
            });
            if (error) return { success: false, message: getErrorMsg(error) };

            const { data } = await supabase.from('schools').select('*').eq('auth_id', authData.user?.id).maybeSingle();
            
            if (data) {
                await supabase.from('schools').update({ last_active_at: new Date().toISOString() }).eq('id', data.id);
                localStorage.setItem('school_id', data.id); 
                return { 
                    success: true, 
                    user: { ...data, logoUrl: data.logo_url, themeColor: data.theme_color || 'blue' } 
                };
            } else {
                return { success: false, message: "School Profile Not Found" };
            }
        }
        
        if (role === Role.PRINCIPAL) {
            const cleanEmail = credentials.email.trim().toLowerCase();
            const { data } = await supabase.from('schools')
                .select('*')
                .eq('principal_email', cleanEmail)
                .eq('principal_password', credentials.password) 
                .eq('has_principal_login', true)
                .maybeSingle();

            if (data) {
                localStorage.setItem('school_id', data.id);
                return {
                    success: true,
                    user: {
                        id: data.id, 
                        name: data.name,
                        schoolName: data.name,
                        place: data.place,
                        logoUrl: data.logo_url,
                        role: 'PRINCIPAL',
                        isPro: data.is_pro
                    }
                };
            } else {
                return { success: false, message: "Invalid Principal Credentials or Access Disabled" };
            }
        }
        
        if (role === Role.TEACHER) {
            const { data: cls } = await supabase.from('classes').select('name').eq('id', credentials.classId).single();
            if (!cls) return { success: false, message: "Class not found" };

            const { data, error } = await supabase.rpc('teacher_login', {
                cls_name: cls.name, 
                pass: credentials.password.toLowerCase(),
                schl_id: getSchoolId()
            });
            
            if (error) return { success: false, message: getErrorMsg(error) };

            if (data) {
                const clsData = data as any;
                localStorage.setItem('school_id', clsData.school_id);
                const {data: s} = await supabase.from('schools').select('name, place, logo_url, theme_color, is_pro').eq('id', clsData.school_id).single();

                return { 
                    success: true, 
                    user: { 
                        ...clsData, 
                        name: clsData.name, 
                        teacherName: clsData.teacher_name, 
                        teacherPhoto: clsData.teacher_photo,
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
            }
        }

        if (role === Role.STUDENT) {
            const { data, error } = await supabase.rpc('student_login', {
                reg_no_in: credentials.id,
                pass_in: credentials.password.toLowerCase(),
                schl_id: getSchoolId()
            });

            if (error) return { success: false, message: getErrorMsg(error) };

            if (data) {
                const stuData = data as any;
                localStorage.setItem('school_id', stuData.school_id);
                const {data: s} = await supabase.from('schools').select('logo_url, theme_color').eq('id', stuData.school_id).single();
                return { 
                    success: true, 
                    user: { ...transformStudent(stuData), schoolLogoUrl: s?.logo_url, schoolThemeColor: s?.theme_color }
                };
            }
        }
        
        return { success: false, message: "Invalid Credentials" };

    } catch (e) { 
        console.error("Login error", e); 
        return { success: false, message: getErrorMsg(e) };
    }
};

export const resetPasswordWithRecoveryCode = async (email: string, code: string, newPassword: string) => {
    if (!isSupabaseConfigured()) return { success: false, message: "DB Required" };

    try {
        const { data: school } = await supabase.from('schools')
            .select('auth_id, recovery_code')
            .eq('admin_email', email.trim().toLowerCase())
            .maybeSingle();

        if (!school) return { success: false, message: "Email not found." };
        if (school.recovery_code !== code.trim()) return { success: false, message: "Invalid Recovery Key." };

        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) return { success: false, message: "Password reset failed (Auth provider error)" };

        return { success: true, message: "Password reset successfully!" };

    } catch (e: any) {
        return { success: false, message: getErrorMsg(e) };
    }
};

export const recoverPassword = async (email: string) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin + '/#/login?reset=true'
        });
        if (error) throw error;
        return { success: true, message: "Password reset link sent." };
    } catch (e: any) {
        return { success: false, message: getErrorMsg(e) };
    }
};

export const updateUserPassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};
