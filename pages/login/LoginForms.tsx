
import React from 'react';
import { GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { Shield, UserCheck, Search, X, Check, User, School, Trash2 } from 'lucide-react';
import { Role } from '../../types';
import { SavedProfile } from '../../services/utils';

export const RoleSelector: React.FC<{
    role: Role;
    setRole: (r: Role) => void;
    flags: any;
}> = ({ role, setRole, flags }) => (
    <div className="flex flex-wrap bg-blue-50 dark:bg-slate-900 p-1 rounded-lg mb-6 border border-blue-100 dark:border-slate-800">
        {flags.studentLogin && (
            <button onClick={() => setRole(Role.STUDENT)} className={`flex-1 py-2 px-2 text-xs font-bold rounded-md transition-all ${role === Role.STUDENT ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Student</button>
        )}
        {flags.teacherLogin && (
            <button onClick={() => setRole(Role.TEACHER)} className={`flex-1 py-2 px-2 text-xs font-bold rounded-md transition-all ${role === Role.TEACHER ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Teacher</button>
        )}
        {/* Principal Role */}
        <button onClick={() => setRole(Role.PRINCIPAL)} className={`flex-1 py-2 px-2 text-xs font-bold rounded-md transition-all ${role === Role.PRINCIPAL ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Principal</button>
        
        <button onClick={() => setRole(Role.ADMIN)} className={`flex-1 py-2 px-2 text-xs font-bold rounded-md transition-all ${role === Role.ADMIN ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
    </div>
);

export const LoginFormBody: React.FC<{
    role: Role;
    formData: any;
    setFormData: (d: any) => void;
    availableClasses: any[];
    availableStudents: any[];
    loadingResources: boolean;
    handleClassChange: (e: any) => void;
    passwordRef: any;
    handleSubmit: (e: any) => void;
    loading: boolean;
    setShowForgot: (v: boolean) => void;
    flags: any;
    fromSetup: boolean;
    studentSearchQuery?: string;
    handleStudentSearch?: (query: string) => void;
    studentSearchResults?: any[];
    onSelectStudent?: (s: any) => void;
    clearSelectedStudent?: () => void;
    selectedStudentName?: string;
    savedProfiles?: SavedProfile[];
    onSelectSavedProfile?: (p: SavedProfile) => void;
    onRemoveSavedProfile?: (p: SavedProfile) => void;
}> = ({ 
    role, formData, setFormData, availableClasses, availableStudents, loadingResources, handleClassChange, 
    passwordRef, handleSubmit, loading, setShowForgot, flags, fromSetup,
    studentSearchQuery, handleStudentSearch, studentSearchResults, onSelectStudent, clearSelectedStudent, selectedStudentName,
    savedProfiles, onSelectSavedProfile, onRemoveSavedProfile
}) => {
    
    // Show Saved Profiles if: Student Role, No Profile Selected yet, and Profiles Exist
    const showProfiles = role === Role.STUDENT && !formData.id && savedProfiles && savedProfiles.length > 0;

    return (
    <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* TEACHER LOGIN */}
        {role === Role.TEACHER && flags.teacherLogin && (
            <div>
                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-2">Classroom</label>
                {loadingResources && availableClasses.length === 0 ? <div className="text-xs text-slate-400">Loading classes...</div> : (
                    <GlassSelect value={formData.classId} onChange={handleClassChange} required>
                        <option value="">Select Class</option>
                        {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </GlassSelect>
                )}
            </div>
        )}

        {/* STUDENT LOGIN - SAVED PROFILES OR SEARCH */}
        {role === Role.STUDENT && flags.studentLogin && (
            <div className="space-y-4">
                
                {/* 1. SAVED ACCOUNTS GRID */}
                {showProfiles && (
                    <div className="animate-fade-in-up">
                        <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-2">Recent Accounts</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {savedProfiles?.map((p, idx) => (
                                <div key={`${p.regNo}-${idx}`} className="relative group">
                                    <div 
                                        onClick={() => onSelectSavedProfile && onSelectSavedProfile(p)}
                                        className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all h-full"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 mb-2 overflow-hidden border">
                                            {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-slate-400"/>}
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate w-full text-center">{p.name}</p>
                                        <p className="text-[9px] text-slate-500 truncate w-full text-center">{p.schoolName || 'School'}</p>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onRemoveSavedProfile && onRemoveSavedProfile(p); }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="relative flex items-center justify-center mb-4">
                            <div className="h-px bg-slate-200 dark:bg-slate-700 w-full absolute"></div>
                            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 relative z-10 font-bold uppercase">Or Login New</span>
                        </div>
                    </div>
                )}

                {/* 2. SEARCH / SELECTED STATE */}
                {!formData.id ? (
                    <div className="relative">
                        {!showProfiles && <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-2">Find Your Account</label>}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                            <GlassInput 
                                className="pl-9"
                                placeholder="Search Name (e.g. Fathima)" 
                                value={studentSearchQuery} 
                                onChange={(e) => handleStudentSearch && handleStudentSearch(e.target.value)}
                            />
                            {loadingResources && <div className="absolute right-3 top-3"><div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div></div>}
                        </div>
                        
                        {/* SEARCH RESULTS DROPDOWN */}
                        {studentSearchResults && studentSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl mt-1 z-20 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-up">
                                {studentSearchResults.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => onSelectStudent && onSelectStudent(s)}
                                        className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-sm text-slate-800 dark:text-white flex-1">{s.name}</div>
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{s.className}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-slate-500 font-mono">Reg: {s.regNo}</span>
                                            <span className="text-[10px] text-slate-500 italic">F: {s.fatherName}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {studentSearchQuery && studentSearchQuery.length > 2 && studentSearchResults?.length === 0 && !loadingResources && (
                            <div className="text-center p-4 text-xs text-slate-400">No student found. Try full name.</div>
                        )}
                    </div>
                ) : (
                    <div className="bg-blue-50 dark:bg-slate-800 p-3 rounded-xl border border-blue-100 dark:border-slate-700 flex items-center justify-between animate-fade-in-up">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Selected Account</p>
                            <p className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-green-500"/> 
                                {selectedStudentName}
                            </p>
                        </div>
                        <button 
                            type="button" 
                            onClick={clearSelectedStudent} 
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4"/>
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* ADMIN / PRINCIPAL LOGIN */}
        {(role === Role.ADMIN || role === Role.PRINCIPAL) && (
            <div>
                <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-2">{role === Role.ADMIN ? 'Admin Email' : 'Principal Email'}</label>
                <GlassInput type="email" placeholder={role === Role.ADMIN ? "admin@school.com" : "principal@school.com"} value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} />
            </div>
        )}

        {/* PASSWORD / DOB INPUT - Conditional for Student */}
        {((role !== Role.STUDENT) || (role === Role.STUDENT && formData.id)) && (
            <div className="animate-fade-in-up">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{role === Role.STUDENT ? 'Date of Birth (Password)' : 'Password'}</label>
                    {role === Role.ADMIN && !fromSetup && (
                        <button type="button" onClick={() => setShowForgot(true)} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"><Shield className="w-3 h-3" /> Recover</button>
                    )}
                </div>
                <GlassInput 
                    ref={role === Role.ADMIN ? passwordRef : null}
                    type={role === Role.STUDENT ? "date" : "password"} 
                    placeholder={role === Role.STUDENT ? "YYYY-MM-DD" : "••••••"} 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    autoFocus={role === Role.STUDENT} // Auto focus when this appears
                />
            </div>
        )}

        <GlassButton type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Authenticating...' : (role === Role.PRINCIPAL ? 'Enter Principal Desk' : 'Access Portal')}
        </GlassButton>
    </form>
)};
