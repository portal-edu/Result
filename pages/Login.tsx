
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, GlassInput, GlassButton } from '../components/GlassUI';
import { Role } from '../types';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building, AlertCircle, Shield, Construction, MapPin, Globe, Search } from 'lucide-react';
import { RoleSelector, LoginFormBody } from './login/LoginForms';
import { ForgotPasswordModal, TrackApplicationModal } from './login/LoginModals';
import { getSavedStudentProfiles, saveStudentProfile, SavedProfile, removeStudentProfile } from '../services/utils';

interface Props {
  onLogin: (role: Role, userData: any) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  // --- CORE STATE ---
  const [role, setRole] = useState<Role>(Role.ADMIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canReport, setCanReport] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [reportSent, setReportSent] = useState(false);
  
  const [formData, setFormData] = useState({ id: '', password: '', classId: '' });
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // --- CONFIG & CONTEXT ---
  const [flags, setFlags] = useState({ studentLogin: true, teacherLogin: true, maintenance: false });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [hasSchoolContext, setHasSchoolContext] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  
  // --- MODAL STATES ---
  const [showForgot, setShowForgot] = useState(false);
  
  // Forgot Password Modal State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotKey, setForgotKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  const [showTrack, setShowTrack] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [trackCredential, setTrackCredential] = useState('');
  const [trackMethod, setTrackMethod] = useState<'PASSWORD' | 'DOB'>('PASSWORD');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [tracking, setTracking] = useState(false);

  const [isUpdatePasswordFlow, setIsUpdatePasswordFlow] = useState(false);
  const [updatePass, setUpdatePass] = useState('');
  const [isInviteFlow, setIsInviteFlow] = useState(false);
  const [inviteClassInfo, setInviteClassInfo] = useState<any>(null);
  const [setupPassword, setSetupPassword] = useState('');

  // --- DATA LOADING & STUDENT SEARCH ---
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  
  // Student Smart Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  
  // Saved Profiles State
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const fromSetup = (location.state as any)?.fromSetup;

  // --- EFFECTS ---
  useEffect(() => {
      const loadSettings = async () => {
          const settings = await api.getGlobalSettings();
          setFlags({
              studentLogin: settings['ENABLE_STUDENT_LOGIN'] !== 'FALSE',
              teacherLogin: settings['ENABLE_TEACHER_LOGIN'] !== 'FALSE',
              maintenance: settings['MAINTENANCE_MODE'] === 'TRUE'
          });
          setSettingsLoaded(true);
      };
      loadSettings();
      
      // Load saved profiles
      setSavedProfiles(getSavedStudentProfiles());
  }, []);

  useEffect(() => {
      const state = location.state as any;
      if (state?.email) {
          setRole(Role.ADMIN);
          setFormData(prev => ({ ...prev, id: state.email }));
          if (state.fromSetup) setTimeout(() => passwordInputRef.current?.focus(), 300);
      }
      if (state?.role === 'ADMIN') setRole(Role.ADMIN);

      const params = new URLSearchParams(location.search);
      if (location.hash.includes('type=recovery') || params.get('reset') === 'true') setIsUpdatePasswordFlow(true);
      
      const inviteId = params.get('invite');
      if (inviteId) { setIsInviteFlow(true); resolveInvite(inviteId); return; }

      const slugOrId = params.get('s');
      if (slugOrId) resolveSchool(slugOrId);
      else {
          const sid = localStorage.getItem('school_id');
          if (sid) { setHasSchoolContext(true); setRole(Role.STUDENT); fetchSchoolDetails(sid); }
          else { setHasSchoolContext(false); setRole(Role.ADMIN); }
      }
  }, [location]);

  useEffect(() => {
      if (settingsLoaded) {
          if (role === Role.STUDENT && !flags.studentLogin) setRole(Role.ADMIN);
          if (role === Role.TEACHER && !flags.teacherLogin) setRole(Role.ADMIN);
      }
  }, [flags, settingsLoaded]);

  useEffect(() => {
      if (role === Role.TEACHER && hasSchoolContext && availableClasses.length === 0 && !flags.maintenance) {
          loadClassesForLogin();
      }
  }, [role, hasSchoolContext, flags]);

  // --- HELPERS ---
  const resolveSchool = async (identifier: string) => {
      setLoading(true);
      const school = await api.getSchoolByIdOrSlug(identifier);
      setLoading(false);
      if (school) {
          localStorage.setItem('school_id', school.id);
          setHasSchoolContext(true);
          setRole(Role.STUDENT);
          setSchoolInfo(school);
      } else { localStorage.removeItem('school_id'); setHasSchoolContext(false); }
  };

  const resolveInvite = async (inviteId: string) => {
      setLoading(true);
      const info = await api.getClassBasicInfo(inviteId);
      setLoading(false);
      if (info) {
          if (info.hasPassword) {
              setIsInviteFlow(false); setHasSchoolContext(true); setRole(Role.TEACHER); 
              setAvailableClasses([{ id: info.id, name: info.name }]);
              setFormData(prev => ({ ...prev, classId: info.id }));
              if (info.schoolId) { localStorage.setItem('school_id', info.schoolId); fetchSchoolDetails(info.schoolId); }
              setError("Account active. Login directly.");
          } else setInviteClassInfo(info);
      } else setError("Invalid Invite Link.");
  };

  const fetchSchoolDetails = async (id: string) => { const data = await api.getSchoolByIdOrSlug(id); if (data) setSchoolInfo(data); };
  const loadClassesForLogin = async () => { setLoadingResources(true); const classes = await api.getClassesForLogin(); setAvailableClasses(classes); setLoadingResources(false); };
  
  const handleClassChange = async (e: any) => {
      const clsId = e.target.value;
      setFormData({...formData, classId: clsId, id: ''});
  };

  const handleStudentSearch = async (query: string) => {
      setStudentSearchQuery(query);
      if (query.length >= 3 && schoolInfo?.id) {
          setLoadingResources(true);
          const results = await api.findStudentsForLogin(schoolInfo.id, query);
          setStudentSearchResults(results);
          setLoadingResources(false);
      } else {
          setStudentSearchResults([]);
      }
  };

  const onSelectStudent = (student: any) => {
      setFormData({ ...formData, id: student.regNo }); 
      setSelectedStudentName(`${student.name} (${student.regNo})`);
      setStudentSearchResults([]); 
  };
  
  const onSelectSavedProfile = async (profile: SavedProfile) => {
      // 1. Switch context to the school of this profile
      if (profile.schoolId !== schoolInfo?.id) {
          localStorage.setItem('school_id', profile.schoolId);
          await fetchSchoolDetails(profile.schoolId);
      }
      // 2. Pre-fill login
      setFormData({ ...formData, id: profile.regNo });
      setSelectedStudentName(profile.name);
  };
  
  const onRemoveSavedProfile = (profile: SavedProfile) => {
      const updated = removeStudentProfile(profile.regNo, profile.schoolId);
      setSavedProfiles(updated);
  };

  const clearSelectedStudent = () => {
      setFormData({ ...formData, id: '', password: '' });
      setSelectedStudentName('');
      setStudentSearchQuery('');
  };

  // --- SUBMIT HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setCanReport(false); setReportSent(false);
    
    let creds: any = {};
    if (role === Role.ADMIN) creds = { email: formData.id.trim(), password: formData.password };
    else if (role === Role.TEACHER) creds = { classId: formData.classId, password: formData.password };
    else if (role === Role.STUDENT) {
        creds = { id: formData.id, password: formData.password }; 
    }

    const res = await api.login(role, creds);
    setLoading(false);

    if (res.success) {
        // Save profile on success if student
        if (role === Role.STUDENT && res.user) {
            saveStudentProfile(res.user, res.user.schoolId, res.user.schoolName);
        }
        
        onLogin(role, res.user);
        navigate(role === Role.TEACHER ? '/dashboard/teacher' : role === Role.STUDENT ? '/dashboard/student' : '/dashboard/admin');
    } else {
        setError(res.message || "Invalid Credentials.");
        const errorRes = res as any;
        if (errorRes.canReport) { setCanReport(true); setErrorDetails(errorRes.errorDetails); }
    }
  };

  const handleReportIssue = async () => {
      const res = await api.createSystemFeedback(`Login Failed: ${error}`, 'BUG', errorDetails?.email || 'User', errorDetails);
      if (res.success) setReportSent(true); else alert("Report Failed");
  };

  const handleSendResetLink = async () => {
      if (!forgotEmail) {
          setResetMessage({ type: 'error', text: "Please enter Admin Email above." });
          return;
      }
      setResetMessage({ type: '', text: '' });
      setResetLoading(true);
      const res = await api.recoverPassword(forgotEmail);
      setResetLoading(false);
      
      if (res.success) {
          setResetMessage({ type: 'success', text: "Reset link sent to your email!" });
      } else {
          setResetMessage({ type: 'error', text: res.message || "Failed to send link." });
      }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault(); 
      setResetMessage({type:'', text:''}); 
      setResetLoading(true); 
      
      const res = await api.resetPasswordWithRecoveryCode(forgotEmail, forgotKey, newPassword);
      setResetLoading(false);
      
      if (res.success) { 
          setResetMessage({type:'success', text:res.message||"Reset Successful! Login now."}); 
          setFormData(prev => ({...prev, id: forgotEmail, password: newPassword}));
          setTimeout(() => {
              setShowForgot(false);
              setForgotKey('');
              setNewPassword('');
          }, 2000); 
      } else { 
          setResetMessage({type:'error', text:res.message}); 
      }
  };

  const handleTrackStatus = async (e: React.FormEvent) => {
      e.preventDefault(); setTracking(true); setTrackResult(null);
      const res = await api.checkAdmissionStatus(trackPhone, trackCredential);
      setTracking(false); setTrackResult(res);
  };

  const handleInviteSetup = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!inviteClassInfo || setupPassword.length < 4) return;
      setLoading(true);
      const res = await api.setupTeacherLogin(inviteClassInfo.id, setupPassword);
      setLoading(false);
      if (res.success) { onLogin(Role.TEACHER, res.user); navigate('/dashboard/teacher'); } else setError(res.message||"Setup Failed");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
      e.preventDefault(); setResetLoading(true);
      const res = await api.updateUserPassword(updatePass);
      setResetLoading(false);
      if (res.success) { alert("Updated! Please Login."); setIsUpdatePasswordFlow(false); navigate('/login'); } else alert(res.message);
  };

  // --- SPECIAL VIEWS ---
  if (flags.maintenance && role !== Role.ADMIN) return <div className="flex items-center justify-center h-screen"><GlassCard className="text-center border-t-4 border-red-500"><Construction className="w-10 h-10 mx-auto text-red-500 mb-4 animate-pulse"/><h2 className="text-xl font-bold">Maintenance Mode</h2><p className="text-zinc-500">We are upgrading. Back shortly.</p><button onClick={()=>setRole(Role.ADMIN)} className="text-xs text-blue-600 mt-4 underline">Admin Login</button></GlassCard></div>;
  if (isInviteFlow) return <div className="flex items-center justify-center py-12 px-4"><GlassCard className="w-full max-w-md border-t-4 border-indigo-600"><h2 className="text-xl font-bold mb-4">Claim {inviteClassInfo?.name}</h2><p className="text-sm text-slate-500 mb-6">You are the first to access this class. Please set a secure password to claim ownership.</p><form onSubmit={handleInviteSetup} className="space-y-4"><GlassInput type="password" placeholder="Create Class Password" value={setupPassword} onChange={e=>setSetupPassword(e.target.value)} required minLength={4}/><GlassButton type="submit" disabled={loading} className="w-full">{loading?'Claiming...':'Set Password & Login'}</GlassButton></form></GlassCard></div>;
  if (isUpdatePasswordFlow) return <div className="flex items-center justify-center py-12 px-4"><GlassCard className="w-full max-w-md border-t-4 border-green-600"><h2 className="text-xl font-bold mb-4">New Password</h2><form onSubmit={handleUpdatePassword} className="space-y-4"><GlassInput type="password" placeholder="New Password" value={updatePass} onChange={e=>setUpdatePass(e.target.value)} required minLength={6}/><GlassButton type="submit" disabled={resetLoading} className="w-full">{resetLoading?'Updating...':'Update'}</GlassButton></form></GlassCard></div>;

  // --- MAIN RENDER ---
  return (
    <div className="flex items-center justify-center py-12 px-4 min-h-[80vh]">
      <GlassCard className="w-full max-w-md shadow-xl border-blue-100 dark:border-slate-800">
        <div className="text-center mb-8 relative">
            {hasSchoolContext && <button onClick={() => { localStorage.removeItem('school_id'); setHasSchoolContext(false); setSchoolInfo(null); setRole(Role.ADMIN); }} className="absolute right-0 top-0 text-[10px] font-bold text-red-500 hover:underline">EXIT</button>}
            
            {schoolInfo ? (
                <div className="flex flex-col items-center animate-fade-in-up">
                    {schoolInfo.is_pro && schoolInfo.logo_url ? <img src={schoolInfo.logo_url} className="w-16 h-16 object-contain mb-4 rounded-lg bg-zinc-50 p-1 border border-zinc-200" /> : <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-blue-600 text-white"><Building className="w-6 h-6"/></div>}
                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{schoolInfo.name}</h2>
                    <div className="flex flex-col items-center gap-1 mt-1">
                        {schoolInfo.place && <p className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> {schoolInfo.place}</p>}
                        <button onClick={() => navigate(`/school/${schoolInfo.id}`)} className="text-[10px] bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-300 px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-blue-100"><Globe className="w-3 h-3"/> View Profile</button>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Portal Access</h2>
                    <p className="text-zinc-500 text-sm">{hasSchoolContext ? 'Sign in to dashboard' : (fromSetup ? '' : 'Admin Login')}</p>
                </>
            )}
        </div>
        
        {hasSchoolContext && !flags.maintenance && <RoleSelector role={role} setRole={setRole} flags={flags} />}
        
        {hasSchoolContext && !flags.studentLogin && !flags.teacherLogin && role !== Role.ADMIN && <div className="mb-6 bg-orange-50 p-3 rounded text-center text-xs text-orange-700 font-bold border border-orange-200">Public login disabled by admin.</div>}

        {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs border border-red-100 dark:border-red-900 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>
                {canReport && !reportSent && <button onClick={handleReportIssue} className="self-end underline">Report Issue</button>}
                {reportSent && <span className="text-green-600 self-end font-bold flex items-center gap-1"><Shield className="w-3 h-3"/> Reported</span>}
            </div>
        )}

        <LoginFormBody 
            role={role} formData={formData} setFormData={setFormData} availableClasses={availableClasses} availableStudents={[]} 
            loadingResources={loadingResources} handleClassChange={handleClassChange} passwordRef={passwordInputRef} handleSubmit={handleSubmit}
            loading={loading} setShowForgot={setShowForgot} flags={flags} fromSetup={fromSetup}
            // SMART SEARCH & PROFILES
            studentSearchQuery={studentSearchQuery}
            handleStudentSearch={handleStudentSearch}
            studentSearchResults={studentSearchResults}
            onSelectStudent={onSelectStudent}
            clearSelectedStudent={clearSelectedStudent}
            selectedStudentName={selectedStudentName}
            savedProfiles={savedProfiles}
            onSelectSavedProfile={onSelectSavedProfile}
            onRemoveSavedProfile={onRemoveSavedProfile}
        />
        
        {!fromSetup && (
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                {role !== Role.ADMIN ? (
                    <button onClick={() => setShowTrack(true)} className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1"><Search className="w-3 h-3"/> Track Admission</button>
                ) : <div></div>}
                
                {role === Role.ADMIN && <button onClick={() => navigate('/setup')} className="text-xs font-bold text-blue-600 hover:underline">New School?</button>}
            </div>
        )}
      </GlassCard>

      {/* MODALS */}
      {showForgot && <ForgotPasswordModal 
          onClose={()=>setShowForgot(false)} 
          onSubmit={handleForgotPassword} 
          email={forgotEmail} setEmail={setForgotEmail}
          recoveryKey={forgotKey} setRecoveryKey={setForgotKey}
          newPassword={newPassword} setNewPassword={setNewPassword}
          loading={resetLoading} 
          message={resetMessage}
          onSendLink={handleSendResetLink}
      />}
      
      {showTrack && <TrackApplicationModal onClose={()=>{setShowTrack(false); setTrackResult(null);}} onSubmit={handleTrackStatus} phone={trackPhone} setPhone={setTrackPhone} method={trackMethod} setMethod={setTrackMethod} credential={trackCredential} setCredential={setTrackCredential} loading={tracking} result={trackResult} onReset={()=>setTrackResult(null)} onLogin={(m)=>{onLogin(Role.STUDENT, {...m.student, schoolLogoUrl:null}); navigate('/dashboard/student');}} />}
    </div>
  );
};

export default Login;
