
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/GlassUI';
import { Role } from '../types';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Shield, GraduationCap, Building, KeyRound, ArrowLeft, Mail, FileKey } from 'lucide-react';

interface Props {
  onLogin: (role: Role, userData: any) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
      id: '', // RegNo or Email or Student ID (for dropdown)
      password: '',
      classId: '',
  });
  
  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotMethod, setForgotMethod] = useState<'EMAIL' | 'CODE'>('EMAIL');
  const [resetEmail, setResetEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  // Update Password State (For email link flow)
  const [isUpdatePasswordFlow, setIsUpdatePasswordFlow] = useState(false);
  const [updatePass, setUpdatePass] = useState('');

  // State for Student Dropdown Login
  const [availableClasses, setAvailableClasses] = useState<{id: string, name: string}[]>([]);
  const [availableStudents, setAvailableStudents] = useState<{id: string, name: string, reg_no: string}[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Check for auto-fill data from Registration or Recovery Link
  useEffect(() => {
      const state = location.state as any;
      if (state?.email) {
          setRole(Role.ADMIN);
          setFormData(prev => ({ ...prev, id: state.email }));
      }
      if (state?.role === 'ADMIN') {
          setRole(Role.ADMIN);
      }

      // Check for recovery link (token hash in URL or 'reset=true' param)
      const params = new URLSearchParams(location.search);
      if (location.hash.includes('type=recovery') || params.get('reset') === 'true') {
          setIsUpdatePasswordFlow(true);
      }
  }, [location]);

  // Load Classes when Student Role is active
  useEffect(() => {
      if (role === Role.STUDENT) {
          loadClassesForLogin();
      }
  }, [role]);

  const loadClassesForLogin = async () => {
      setLoadingResources(true);
      const classes = await api.getClassesForLogin();
      setAvailableClasses(classes);
      setLoadingResources(false);
  };

  const handleClassChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const clsId = e.target.value;
      setFormData({...formData, classId: clsId, id: ''});
      setAvailableStudents([]);
      
      if (clsId) {
          setLoadingResources(true);
          const students = await api.getStudentNamesForLogin(clsId);
          setAvailableStudents(students);
          setLoadingResources(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // BACKDOOR FOR OWNER
    if (role === Role.ADMIN && formData.id.trim() === 'owner@admin.com' && formData.password === 'master123') {
        setLoading(false);
        onLogin(Role.SUPER_ADMIN, { name: 'Super Admin', id: 'owner' });
        navigate('/dashboard/superadmin');
        return;
    }
    
    let credentials: any = {};
    
    // Admin Login now uses Email & Password
    if (role === Role.ADMIN) {
        credentials = { email: formData.id.trim(), password: formData.password };
    } 
    // Teacher Login (Simplified: ClassName + Password)
    else if (role === Role.TEACHER) {
        credentials = { classId: formData.classId, password: formData.password };
    } 
    // Student Login
    else if (role === Role.STUDENT) {
        // Find the student RegNo based on the selected UUID from dropdown
        const selectedStudent = availableStudents.find(s => s.id === formData.id);
        
        // If selected via dropdown, use the RegNo found. If typed (fallback), use input.
        const loginId = selectedStudent ? selectedStudent.reg_no : formData.id;
        
        credentials = { id: loginId, password: formData.password }; 
    }

    const response = await api.login(role, credentials);
    setLoading(false);

    if (response.success) {
        onLogin(role, response.user);
        if (role === Role.TEACHER) navigate('/dashboard/teacher');
        else if (role === Role.STUDENT) navigate('/dashboard/student'); 
        else navigate('/dashboard/admin');
    } else {
        setError(response.message || "Invalid Login Credentials.");
    }
  };
  
  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetMessage({ type: '', text: '' });
      setResetLoading(true);
      
      let res;
      if (forgotMethod === 'EMAIL') {
        if (!resetEmail) { setResetLoading(false); return; }
        res = await api.recoverPassword(resetEmail);
      } else {
        if (!resetEmail || !recoveryCode || !newPassword) {
            setResetMessage({ type: 'error', text: 'All fields are required' });
            setResetLoading(false);
            return;
        }
        res = await api.resetPasswordWithRecoveryCode(resetEmail, recoveryCode, newPassword);
      }

      setResetLoading(false);
      
      if (res.success) {
          setResetMessage({ type: 'success', text: res.message || "Success!" });
          if (forgotMethod === 'CODE') {
              setTimeout(() => {
                  setShowForgot(false);
                  setFormData({ ...formData, id: resetEmail, password: newPassword });
              }, 2000);
          }
      } else {
          setResetMessage({ type: 'error', text: "Error: " + res.message });
      }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetLoading(true);
      const res = await api.updateUserPassword(updatePass);
      setResetLoading(false);
      if (res.success) {
          alert("Password updated! Please login with your new password.");
          setIsUpdatePasswordFlow(false);
          navigate('/login');
      } else {
          alert("Failed: " + res.message);
      }
  };

  const getRoleButtonClass = (isActive: boolean) => 
    `flex-1 py-2 rounded-md text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
        isActive 
        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' 
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`;
  
  // FLOW: Update Password after Email Link Click
  if (isUpdatePasswordFlow) {
      return (
          <div className="flex items-center justify-center py-12 px-4">
              <GlassCard className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700">
                  <h2 className="text-xl font-bold text-center mb-4 text-slate-900 dark:text-white">Set New Password</h2>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <GlassInput 
                        type="password" 
                        placeholder="New Password" 
                        value={updatePass} 
                        onChange={e => setUpdatePass(e.target.value)}
                        required
                        minLength={6}
                      />
                      <GlassButton type="submit" className="w-full" disabled={resetLoading}>
                          {resetLoading ? 'Updating...' : 'Update Password'}
                      </GlassButton>
                  </form>
              </GlassCard>
          </div>
      );
  }

  // FLOW: Forgot Password Modal
  if (showForgot) {
      return (
        <div className="flex items-center justify-center py-12 px-4">
          <GlassCard className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
                 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                 </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
                <div className="flex justify-center gap-4 mt-4 text-sm font-medium border-b border-slate-200 dark:border-slate-700 pb-2">
                    <button 
                        onClick={() => { setForgotMethod('EMAIL'); setResetMessage({type:'',text:''}); }}
                        className={`pb-2 px-2 transition-colors ${forgotMethod === 'EMAIL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                    >
                        Via Email Link
                    </button>
                    <button 
                        onClick={() => { setForgotMethod('CODE'); setResetMessage({type:'',text:''}); }}
                        className={`pb-2 px-2 transition-colors ${forgotMethod === 'CODE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                    >
                        Via Recovery Code
                    </button>
                </div>
            </div>
            
            <form onSubmit={handleForgotPassword} className="space-y-4">
                {forgotMethod === 'EMAIL' ? (
                    <>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">We will send a reset link to your registered email.</p>
                        <GlassInput 
                            type="email" 
                            placeholder="admin@school.com" 
                            value={resetEmail} 
                            onChange={e => setResetEmail(e.target.value)}
                            required
                        />
                    </>
                ) : (
                    <>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Enter your email and the recovery code you saved during registration.</p>
                        <GlassInput 
                            type="email" 
                            placeholder="admin@school.com" 
                            value={resetEmail} 
                            onChange={e => setResetEmail(e.target.value)}
                            required
                        />
                         <GlassInput 
                            placeholder="Recovery Code (e.g. REC-XXXX-XXXX)" 
                            value={recoveryCode} 
                            onChange={e => setRecoveryCode(e.target.value)}
                            required
                        />
                         <GlassInput 
                            type="password"
                            placeholder="New Password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </>
                )}

                {resetMessage.text && (
                    <div className={`p-3 rounded text-sm text-center ${resetMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {resetMessage.text}
                    </div>
                )}

                <GlassButton type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading ? 'Processing...' : (forgotMethod === 'EMAIL' ? 'Send Recovery Link' : 'Reset Password')}
                </GlassButton>
                
                <button 
                    type="button" 
                    onClick={() => setShowForgot(false)}
                    className="w-full text-center text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-4 flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
            </form>
          </GlassCard>
        </div>
      );
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <GlassCard className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Portal Login</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Access your school dashboard</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setRole(Role.STUDENT)}
                className={getRoleButtonClass(role === Role.STUDENT)}
            >
                <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button 
                onClick={() => setRole(Role.TEACHER)}
                className={getRoleButtonClass(role === Role.TEACHER)}
            >
                <User className="w-4 h-4" /> Teacher
            </button>
            <button 
                onClick={() => setRole(Role.ADMIN)}
                className={getRoleButtonClass(role === Role.ADMIN)}
            >
                <Building className="w-4 h-4" /> Admin
            </button>
        </div>
        
        {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {role === Role.TEACHER && (
                 <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Class Name (e.g., 10 A)</label>
                    <GlassInput 
                        placeholder="10 A"
                        value={formData.classId}
                        onChange={(e) => setFormData({...formData, classId: e.target.value})}
                        required
                    />
                </div>
            )}

            {role === Role.STUDENT && (
                <div className="space-y-4">
                     {/* Class Selection */}
                     <div>
                        <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">1. Select Class</label>
                        {loadingResources && availableClasses.length === 0 ? (
                            <div className="text-xs text-slate-500">Loading classes...</div>
                        ) : availableClasses.length === 0 ? (
                            <div className="text-xs text-red-500">No classes found. Please use valid School Link.</div>
                        ) : (
                            <GlassSelect 
                                value={formData.classId} 
                                onChange={handleClassChange}
                                required
                            >
                                <option value="">-- Choose --</option>
                                {availableClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </GlassSelect>
                        )}
                    </div>

                    {/* Student Selection */}
                    {formData.classId && (
                        <div className="animate-fade-in-up">
                            <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">2. Select Your Name</label>
                            {loadingResources ? (
                                <div className="text-xs text-slate-500">Loading names...</div>
                            ) : (
                                <GlassSelect 
                                    value={formData.id} 
                                    onChange={(e) => setFormData({...formData, id: e.target.value})}
                                    required
                                >
                                    <option value="">-- Choose Name --</option>
                                    {availableStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.reg_no})</option>
                                    ))}
                                </GlassSelect>
                            )}
                        </div>
                    )}
                </div>
            )}

            {role === Role.ADMIN && (
                <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Admin Email</label>
                     <GlassInput 
                        type="email"
                        placeholder="admin@school.com"
                        value={formData.id}
                        onChange={(e) => setFormData({...formData, id: e.target.value})}
                    />
                </div>
            )}

            <div>
                <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">
                    {role === Role.STUDENT ? '3. Date of Birth' : 'Password'}
                </label>
                <GlassInput 
                    type={role === Role.STUDENT ? "date" : "password"}
                    placeholder={role === Role.STUDENT ? "YYYY-MM-DD" : "••••••"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                 {role === Role.ADMIN && (
                    <div className="text-right mt-1">
                        <button 
                            type="button" 
                            onClick={() => setShowForgot(true)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 justify-end ml-auto"
                        >
                            <Shield className="w-3 h-3" /> Forgot Password?
                        </button>
                    </div>
                )}
            </div>

            <GlassButton type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Authenticating...' : 'Login'}
            </GlassButton>
        </form>
        
        {role === Role.ADMIN && (
            <div className="mt-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    New School? <span onClick={() => navigate('/setup')} className="text-blue-600 dark:text-blue-400 cursor-pointer font-bold hover:underline">Register Here</span>
                </p>
            </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Login;
