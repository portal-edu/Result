

import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/GlassUI';
import { api } from '../services/api';
import { SchoolConfig, ClassData, SubjectConfig } from '../types';
import { Shield, Crown, Check, ExternalLink as ExternalLinkIcon, Zap, Link as LinkIcon, Copy, LayoutGrid, Users, ArrowLeft, Trash2, Plus, X, UserPlus, CreditCard, Clock, ToggleLeft, ToggleRight, Settings, CheckCircle, Loader2, Globe, Search, Edit3, RefreshCw, AlertTriangle, Share2, Lock } from 'lucide-react';
import { getSupabaseConfig } from '../services/supabaseClient';

type Tab = 'dashboard' | 'classes' | 'upload';

// ---------------------------------------------------------
// QR CODE CONFIGURATION
// ---------------------------------------------------------
const PAYMENT_QR_URL = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=YOUR_UPI_ID@okicici&pn=SchoolResultPro&am=499"; 
const PLAN_PRICE = "₹499 / Year";
// ---------------------------------------------------------

const DashboardAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);
  
  // Short Code State
  const [newSlug, setNewSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<{available: boolean, message: string} | null>(null);
  const [slugLoading, setSlugLoading] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);

  // Admission Token State
  const [admissionToken, setAdmissionToken] = useState('');
  const [regeneratingToken, setRegeneratingToken] = useState(false);

  // UI State
  const [successMsg, setSuccessMsg] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  const [classList, setClassList] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // New Class State
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newClassPassword, setNewClassPassword] = useState('');
  // Default Marks changed to 50 (Max) and 18 (Pass)
  const [newSubjects, setNewSubjects] = useState<SubjectConfig[]>([
      { name: '', maxMarks: 50, passMarks: 18 } 
  ]);

  const [uploadClassId, setUploadClassId] = useState('');
  const [csvData, setCsvData] = useState('');
  const [uploading, setUploading] = useState(false);

  // Payment State
  const [transactionId, setTransactionId] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'classes' || activeTab === 'upload') {
        loadClasses();
    }
  }, [activeTab]);

  useEffect(() => {
      if (successMsg) {
          const timer = setTimeout(() => setSuccessMsg(''), 4000);
          return () => clearTimeout(timer);
      }
  }, [successMsg]);

  const loadConfig = async () => {
    const data = await api.getSchoolConfig();
    setConfig(data);
    if(data?.slug) setNewSlug(data.slug);
    if(data?.admissionToken) setAdmissionToken(data.admissionToken);
  };

  const loadClasses = async () => {
      setLoadingClasses(true);
      const classes = await api.getClasses();
      setClassList(classes);
      setLoadingClasses(false);
  };

  const handleActivate = async () => {
      if (!licenseKey) return;
      setActivating(true);
      const res = await api.activateLicense(licenseKey);
      setActivating(false);
      if (res.success) {
          setSuccessMsg(res.message || "License Activated!");
          loadConfig();
          setLicenseKey('');
      } else {
          alert(res.message);
      }
  };

  const handleSubmitPayment = async () => {
      if (!transactionId || transactionId.length < 5) {
          alert("Please enter a valid Transaction ID / UTR Number");
          return;
      }
      if (!config?.id) return;

      setSubmittingPayment(true);
      const res = await api.requestProUpgrade(config.id, transactionId);
      setSubmittingPayment(false);

      if (res.success) {
          setSuccessMsg("Payment details submitted successfully!");
          loadConfig();
          setTransactionId('');
      } else {
          alert("Failed to submit: " + res.message);
      }
  };

  const toggleTeacherEdit = async () => {
      if (!config) return;
      const newVal = !config.allowTeacherSubjectEdit;
      // Optimistic update
      setConfig({ ...config, allowTeacherSubjectEdit: newVal });
      
      const res = await api.updateSchoolSettings({ allowTeacherSubjectEdit: newVal });
      if (res.success) {
          setSuccessMsg(newVal ? "Teachers allowed to edit subjects" : "Teacher editing disabled");
      } else {
          // Revert on failure
          setConfig({ ...config, allowTeacherSubjectEdit: !newVal });
          alert("Failed to update settings");
      }
  };

  const handleCheckSlug = async () => {
      if (!newSlug.trim()) return;
      setSlugLoading(true);
      const res = await api.checkSlugAvailability(newSlug);
      setSlugLoading(false);
      setSlugStatus(res);
      if (res.cleanSlug) setNewSlug(res.cleanSlug);
  };

  const handleSaveSlug = async () => {
      if (!newSlug.trim()) return;
      if (!slugStatus?.available) return;

      setSlugLoading(true);
      const res = await api.updateSchoolSlug(newSlug);
      setSlugLoading(false);
      if (res.success) {
          setSuccessMsg("Custom URL Claimed Successfully!");
          loadConfig();
          setSlugStatus(null);
          setIsEditingSlug(false);
      } else {
          alert("Failed: " + res.message);
      }
  };

  const handleRegenerateToken = async () => {
      if (!window.confirm("Are you sure? This will revoke the existing Public Admission Link. Anyone using the old link will encounter an error.")) return;
      
      setRegeneratingToken(true);
      const res = await api.regenerateAdmissionToken();
      setRegeneratingToken(false);
      
      if (res.success && res.token) {
          setAdmissionToken(res.token);
          setSuccessMsg("Admission Link Regenerated!");
      } else {
          alert("Failed to regenerate token");
      }
  };

  const getBaseUrl = () => {
      // Robust URL cleaner to prevent "Double URL" issues in all environments
      let url = window.location.href;

      // 1. Remove 'blob:' prefix (Common in StackBlitz previews)
      if (url.startsWith('blob:')) {
          url = url.replace('blob:', '');
      }

      // 2. Remove the Hash (#) and everything after it
      // This is crucial. If we are at .../#/dashboard, we want just the base .../
      const hashIndex = url.indexOf('#');
      if (hashIndex !== -1) {
          url = url.substring(0, hashIndex);
      }

      // 3. Remove any Query parameters (?) that might exist BEFORE the hash
      const queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
          url = url.substring(0, queryIndex);
      }

      // 4. Remove trailing slash to ensure clean append later
      if (url.endsWith('/')) {
          url = url.slice(0, -1);
      }

      return url;
  };

  const handleCopyLink = (link: string, type: 'portal' | 'reg') => {
      navigator.clipboard.writeText(link);
      setLinkCopied(type);
      setTimeout(() => setLinkCopied(null), 2000);
  };

  const handleShareLink = async (title: string, text: string, url: string) => {
      if (navigator.share) {
          try {
              await navigator.share({ title, text, url });
          } catch (error) {
              console.log('Error sharing:', error);
          }
      } else {
          handleCopyLink(url, 'portal'); // Fallback to copy
          alert("Link copied to clipboard (Sharing not supported on this device)");
      }
  };

  const handleRemoveSubjectRow = (index: number) => {
      const updated = [...newSubjects];
      updated.splice(index, 1);
      if (updated.length === 0) {
          setNewSubjects([{ name: '', maxMarks: 50, passMarks: 18 }]);
      } else {
          setNewSubjects(updated);
      }
  };

  const handleSubjectChange = (index: number, field: keyof SubjectConfig, value: string | number) => {
      const updated = [...newSubjects];
      if (field === 'name' && typeof value === 'string') {
          updated[index] = { ...updated[index], [field]: value.charAt(0).toUpperCase() + value.slice(1) };
      } else {
          updated[index] = { ...updated[index], [field]: value };
      }
      
      // Auto-add new row logic with Smart Inheritance
      if (index === newSubjects.length - 1 && field === 'name' && value !== '') {
          const inheritedMax = updated[index].maxMarks;
          const inheritedPass = updated[index].passMarks;
          updated.push({ name: '', maxMarks: inheritedMax, passMarks: inheritedPass });
      }
      setNewSubjects(updated);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const validSubjects = newSubjects.filter(s => s.name.trim() !== '');
      if (validSubjects.length === 0) {
          alert("Please add at least one subject.");
          return;
      }

      if (!newTeacherName.trim()) {
          alert("Please enter a Teacher Name.");
          return;
      }

      setCreatingClass(true);
      const res = await api.createClass(newClassName, newClassPassword, newTeacherName, validSubjects);
      setCreatingClass(false);

      if (res.success) {
          setSuccessMsg(`Class ${newClassName} Created Successfully! 🎉`);
          setNewClassName('');
          setNewTeacherName('');
          setNewClassPassword('');
          setNewSubjects([{ name: '', maxMarks: 50, passMarks: 18 }]);
          loadClasses();
      } else {
          alert("Failed to create class: " + res.message);
      }
  };

  const handleDeleteClass = async (id: string) => {
      if (!window.confirm("Are you sure? This will permanently delete all students and marks in this class. This action cannot be undone.")) return;
      
      const res = await api.deleteClass(id);
      if (res.success) {
          setSuccessMsg("Class deleted successfully.");
          loadClasses();
      } else {
          alert("Delete failed: " + res.message);
      }
  };

  const handleBulkUpload = async () => {
      if (!uploadClassId) { alert("Please select a class"); return; }
      if (!csvData) { alert("Please enter data"); return; }
      
      setUploading(true);
      const lines = csvData.trim().split('\n');
      const students = [];
      
      for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 3) {
              students.push({
                  regNo: parts[0].trim(),
                  name: parts[1].trim(),
                  dob: parts[2].trim()
              });
          }
      }

      if (students.length === 0) {
          alert("Invalid data format. Use: RegNo, Name, DOB");
          setUploading(false);
          return;
      }

      const res = await api.addStudents(uploadClassId, students);
      setUploading(false);
      
      if (res.success) {
          setSuccessMsg(`Successfully uploaded ${students.length} students!`);
          setCsvData('');
      } else {
          alert("Upload failed: " + res.message);
      }
  };

  // ----------------------------------------------------------------------
  // LINK GENERATION
  // ----------------------------------------------------------------------
  const getDefaultPortalLink = () => {
      return `${getBaseUrl()}/#/login?s=${config?.id}`;
  };

  const getCustomPortalLink = () => {
      if (!config?.slug) return '';
      return `${getBaseUrl()}/#/portal/${config.slug}`;
  };

  const getAdmissionLink = () => {
      if (admissionToken) {
          return `${getBaseUrl()}/#/register?token=${admissionToken}`;
      }
      return `${getBaseUrl()}/#/register?schoolId=${config?.id}`;
  };

  if (!config) return <div className="p-10 text-center text-slate-500">Loading settings...</div>;

  const renderContent = () => {
      if (activeTab === 'classes') {
          return (
              <div className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center gap-4">
                      <GlassButton variant="secondary" onClick={() => setActiveTab('dashboard')}><ArrowLeft className="w-4 h-4"/></GlassButton>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Class Management</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-5 gap-6">
                      <div className="md:col-span-2">
                        <GlassCard>
                            <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-200">Add New Class</h4>
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <div>
                                    <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Class Name</label>
                                    <GlassInput 
                                        placeholder="e.g. 10 A" 
                                        value={newClassName}
                                        onChange={e => setNewClassName(e.target.value.toUpperCase())}
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Class names will be UPPERCASE unique (e.g. 10 A).</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Teacher Name</label>
                                        <GlassInput 
                                            placeholder="e.g. Sarika" 
                                            value={newTeacherName}
                                            onChange={e => setNewTeacherName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Password</label>
                                        <GlassInput 
                                            placeholder="Login Pass" 
                                            value={newClassPassword}
                                            onChange={e => setNewClassPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Subjects Setup</label>
                                    
                                    <div className="flex gap-2 px-2 mb-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        <div className="flex-1">Subject Name</div>
                                        <div className="w-14 text-center">Pass</div>
                                        <div className="w-16 text-center">Maximum</div>
                                        <div className="w-6"></div>
                                    </div>

                                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                                        {newSubjects.map((sub, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input 
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="Subject..."
                                                    value={sub.name}
                                                    onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                                                />
                                                <input 
                                                    type="number"
                                                    className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
                                                    placeholder="Pass"
                                                    value={sub.passMarks}
                                                    onChange={e => handleSubjectChange(idx, 'passMarks', parseInt(e.target.value) || 0)}
                                                />
                                                <input 
                                                    type="number"
                                                    className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
                                                    placeholder="Max"
                                                    value={sub.maxMarks}
                                                    onChange={e => handleSubjectChange(idx, 'maxMarks', parseInt(e.target.value) || 0)}
                                                />
                                                {(newSubjects.length > 1) && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveSubjectRow(idx)}
                                                        className="text-slate-400 hover:text-red-500 p-1"
                                                        tabIndex={-1}
                                                    >
                                                        <X className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-400 italic">
                                        * Marks from previous row are copied automatically.
                                    </div>
                                </div>

                                <GlassButton type="submit" className="w-full" disabled={creatingClass}>
                                    {creatingClass ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Creating...</span> : 'Create Class'}
                                </GlassButton>
                            </form>
                        </GlassCard>
                      </div>

                      <div className="md:col-span-3">
                        <GlassCard className="h-full">
                            <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-200">Existing Classes</h4>
                            {loadingClasses ? <p className="text-sm text-slate-500">Loading...</p> : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {classList.length === 0 ? <p className="text-sm text-slate-400">No classes found.</p> : classList.map(cls => (
                                        <div key={cls.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg flex justify-between items-start group">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-slate-800 dark:text-slate-100">{cls.name}</p>
                                                    {cls.teacherName && (
                                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 rounded">
                                                            {cls.teacherName}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {cls.subjects.map((s, i) => (
                                                        <span key={i} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-xs bg-white dark:bg-slate-800 px-2 py-1 border dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 font-mono" title="Teacher Login Password">
                                                    Login Pass: {cls.password}
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                    title="Delete Class"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                      </div>
                  </div>
              </div>
          );
      }

      if (activeTab === 'upload') {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <GlassButton variant="secondary" onClick={() => setActiveTab('dashboard')}><ArrowLeft className="w-4 h-4"/></GlassButton>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Bulk Student Upload</h3>
                </div>

                <GlassCard className="max-w-2xl mx-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Select Class</label>
                            <GlassSelect value={uploadClassId} onChange={e => setUploadClassId(e.target.value)}>
                                <option value="">-- Choose Class --</option>
                                {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </GlassSelect>
                        </div>
                        
                        <div>
                            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Paste Student Data (CSV format)</label>
                            <p className="text-xs text-slate-400 mb-2">Format: RegNo, Name, DOB(YYYY-MM-DD)</p>
                            <textarea 
                                className="w-full h-40 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                placeholder={`1001, Arjun Das, 2008-05-12\n1002, Fathima R, 2008-08-20`}
                                value={csvData}
                                onChange={e => setCsvData(e.target.value)}
                            ></textarea>
                        </div>

                        <GlassButton onClick={handleBulkUpload} disabled={uploading} className="w-full">
                            {uploading ? 'Uploading...' : 'Upload Students'}
                        </GlassButton>
                    </div>
                </GlassCard>
            </div>
        );
      }

      return (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up">
            
            {/* LEFT COLUMN: CONFIGURATION */}
            <div className="space-y-6">
                <GlassCard className="h-full relative overflow-hidden border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`}>
                            <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Portal & Admission</h3>
                    </div>

                    {/* SECTION 1: DEFAULT PORTAL LINK */}
                    <div className="mb-6">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                <LinkIcon className="w-4 h-4 text-blue-500"/> School Portal Link
                            </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="flex-1 overflow-hidden">
                                 <p className="font-bold text-slate-800 dark:text-white truncate text-xs font-mono">
                                     {getDefaultPortalLink()}
                                 </p>
                             </div>
                             <div className="flex gap-1">
                                <GlassButton 
                                    onClick={() => handleCopyLink(getDefaultPortalLink(), 'portal')} 
                                    className="px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 h-auto"
                                    title="Copy Link"
                                >
                                    {linkCopied === 'portal' ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                </GlassButton>
                                <GlassButton 
                                    onClick={() => handleShareLink('School Portal', `Login to ${config.schoolName} Portal`, getDefaultPortalLink())} 
                                    className="px-2 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 h-auto"
                                    title="Share Link"
                                >
                                    <Share2 className="w-4 h-4"/>
                                </GlassButton>
                             </div>
                        </div>
                    </div>

                    {/* SECTION 2: CUSTOM URL (PRO ONLY) */}
                    <div className="mb-8 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 relative bg-slate-50/50 dark:bg-slate-800/20">
                         {!config.isPro && (
                             <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4 rounded-xl">
                                 <Lock className="w-6 h-6 text-slate-400 mb-1"/>
                                 <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Elite Feature</p>
                                 <p className="text-[10px] text-slate-500">Upgrade to Pro to claim a custom URL</p>
                             </div>
                         )}

                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                <Crown className="w-3 h-3 text-yellow-500"/> Custom Domain URL
                            </h4>
                            {config.slug && config.isPro && !isEditingSlug && (
                                <button onClick={() => setIsEditingSlug(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <Edit3 className="w-3 h-3"/> Edit
                                </button>
                            )}
                        </div>
                        
                        {(!config.slug || isEditingSlug) ? (
                            <>
                                <div className="flex items-center">
                                    <span className="bg-slate-200 dark:bg-slate-700 border border-r-0 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-2 py-1.5 text-xs rounded-l-lg select-none">
                                        .../portal/
                                    </span>
                                    <div className="flex-1 relative">
                                        <input 
                                            className={`w-full bg-white dark:bg-slate-900 border rounded-r-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500 ${slugStatus?.available === false ? 'border-red-500' : slugStatus?.available ? 'border-green-500' : 'border-slate-300 dark:border-slate-600'}`}
                                            placeholder="school-name"
                                            value={newSlug}
                                            onChange={e => { setNewSlug(e.target.value); setSlugStatus(null); }}
                                            disabled={!config.isPro}
                                        />
                                        {slugStatus?.available && (
                                            <Check className="w-3 h-3 text-green-500 absolute right-2 top-2" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                     {!slugStatus?.available ? (
                                        <GlassButton onClick={handleCheckSlug} disabled={slugLoading || !newSlug || !config.isPro} variant="secondary" className="px-2 py-1 text-[10px] h-auto">
                                            {slugLoading ? <Loader2 className="animate-spin w-3 h-3"/> : 'Check Availability'}
                                        </GlassButton>
                                    ) : (
                                        <GlassButton onClick={handleSaveSlug} disabled={slugLoading || !config.isPro} className="px-2 py-1 text-[10px] bg-green-600 hover:bg-green-700 h-auto">
                                            {slugLoading ? <Loader2 className="animate-spin w-3 h-3"/> : 'Claim This URL'}
                                        </GlassButton>
                                    )}
                                </div>
                                <p className={`text-[10px] h-3 mt-1 ${slugStatus?.available ? 'text-green-600' : 'text-red-500'}`}>
                                        {slugStatus?.message}
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <a href={getCustomPortalLink()} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline truncate flex-1">
                                    {getCustomPortalLink()}
                                </a>
                                <div className="flex gap-1">
                                    <GlassButton onClick={() => handleCopyLink(getCustomPortalLink(), 'portal')} className="px-2 py-1 text-[10px] h-auto" title="Copy">
                                        <Copy className="w-3 h-3"/>
                                    </GlassButton>
                                    <GlassButton onClick={() => handleShareLink(config.schoolName, 'Login Portal', getCustomPortalLink())} className="px-2 py-1 text-[10px] bg-indigo-600 h-auto" title="Share">
                                        <Share2 className="w-3 h-3"/>
                                    </GlassButton>
                                </div>
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100 dark:border-slate-700 mb-6"/>

                    {/* SECTION 3: PUBLIC ADMISSION LINK */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-purple-500"/> Public Admission Link
                            </h4>
                            <button 
                                onClick={handleRegenerateToken} 
                                disabled={regeneratingToken}
                                className="text-xs text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
                                title="Invalidate old link and create a new one"
                            >
                                {regeneratingToken ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>} Regenerate
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="flex-1 overflow-hidden">
                                 <p className="font-mono text-slate-600 dark:text-slate-300 truncate text-xs">
                                     {getAdmissionLink()}
                                 </p>
                             </div>
                             <div className="flex gap-1">
                                <GlassButton 
                                    onClick={() => handleCopyLink(getAdmissionLink(), 'reg')} 
                                    className="px-2 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 h-auto"
                                    disabled={!config.id}
                                    title="Copy"
                                >
                                    {linkCopied === 'reg' ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                </GlassButton>
                                <GlassButton 
                                    onClick={() => handleShareLink('Admission Open', `Register for admission at ${config.schoolName}`, getAdmissionLink())} 
                                    className="px-2 py-1.5 text-xs bg-pink-600 hover:bg-pink-700 h-auto"
                                    disabled={!config.id}
                                    title="Share"
                                >
                                    <Share2 className="w-4 h-4"/>
                                </GlassButton>
                             </div>
                         </div>
                         <div className="mt-2 flex items-start gap-2">
                             <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0"/>
                             <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Use "Regenerate" to revoke the old link if it was shared with the wrong people.
                                {!admissionToken && <span className="text-blue-500 cursor-pointer ml-1" onClick={handleRegenerateToken}>Click here to generate your first secure token.</span>}
                             </p>
                         </div>
                    </div>
                </GlassCard>

                {/* Quick Class Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <GlassButton variant="secondary" onClick={() => setActiveTab('classes')} className="text-sm py-4 justify-center flex flex-col gap-2 h-auto">
                        <LayoutGrid className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                        Manage Classes
                    </GlassButton>
                    <GlassButton variant="secondary" onClick={() => setActiveTab('upload')} className="text-sm py-4 justify-center flex flex-col gap-2 h-auto">
                        <Users className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                        Bulk Upload
                    </GlassButton>
                </div>
            </div>

            {/* RIGHT COLUMN: LICENSE */}
            <div className="space-y-6">
                <GlassCard className="h-full relative overflow-hidden border-slate-200 dark:border-slate-700">
                     {config.isPro && (
                        <div className="absolute top-0 right-0 p-4">
                            <Crown className="w-24 h-24 text-yellow-100 dark:text-yellow-900/20 rotate-12" />
                        </div>
                    )}
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-2 rounded-lg ${config.isPro ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">License & Settings</h3>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-blue-500"/> Teacher Permissions
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Allow teachers to add/edit subjects in their class.</p>
                            </div>
                            <button 
                                onClick={toggleTeacherEdit}
                                className={`p-2 rounded-full transition-colors ${config.allowTeacherSubjectEdit ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >
                                {config.allowTeacherSubjectEdit ? <ToggleRight className="w-8 h-8"/> : <ToggleLeft className="w-8 h-8"/>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Current Plan</span>
                            {config.isPro ? (
                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-full text-xs font-bold flex items-center gap-2">
                                    <Crown className="w-3 h-3" /> PRO ACTIVE
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-full text-xs font-bold">
                                    FREE TIER
                                </span>
                            )}
                        </div>
                        {config.expiryDate && (
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Expires On</span>
                                <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                                    {new Date(config.expiryDate).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>

                     {!config.isPro ? (
                        <>
                            {config.paymentStatus === 'PENDING' ? (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800 mb-4 text-center">
                                    <Clock className="w-8 h-8 mx-auto text-yellow-500 mb-2 animate-pulse"/>
                                    <h4 className="font-bold text-yellow-700 dark:text-yellow-400">Upgrade Requested</h4>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                                        Ref: <span className="font-mono">{config.transactionRef}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                        Waiting for admin approval.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                                    <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold mb-2 flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Upgrade to PRO - {PLAN_PRICE}
                                    </p>
                                    
                                    <div className="flex gap-4 items-center mb-4">
                                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                                            <img src={PAYMENT_QR_URL} alt="Payment QR" className="w-20 h-20" />
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            <p>1. Scan QR to Pay</p>
                                            <p>2. Enter Transaction ID / UTR</p>
                                            <p>3. Submit Request</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <GlassInput 
                                            placeholder="Enter UPI Transaction ID" 
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="text-sm"
                                        />
                                        <button 
                                            onClick={handleSubmitPayment}
                                            disabled={submittingPayment}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            <CreditCard className="w-3 h-3" /> {submittingPayment ? 'Submitting...' : 'Submit Payment Details'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div>
                             <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 mb-4">
                                <Check className="w-4 h-4" /> You are on the Pro Plan.
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                Have a manual License Key? Enter it below:
                            </p>
                            <div className="flex gap-2">
                                <GlassInput 
                                    placeholder="PRO-XXXX-XXXX" 
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                />
                                <GlassButton onClick={handleActivate} disabled={activating}>
                                    {activating ? '...' : 'Extend'}
                                </GlassButton>
                            </div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
      );
  };
  
  return (
    <div className="pb-20">
        {renderContent()}
    </div>
  );
};

export default DashboardAdmin;
