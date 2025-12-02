
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/GlassUI';
import { api } from '../services/api';
import { SchoolConfig, ClassData, SubjectConfig } from '../types';
import { Shield, Crown, Check, AlertCircle, Zap, Link as LinkIcon, Copy, LayoutGrid, Users, ArrowLeft, Trash2, Plus, X, UserPlus, CreditCard, Clock, QrCode } from 'lucide-react';
import { getSupabaseConfig } from '../services/supabaseClient';

type Tab = 'dashboard' | 'classes' | 'upload';

// ---------------------------------------------------------
// QR CODE CONFIGURATION (Replace with your own QR image URL)
// ---------------------------------------------------------
const PAYMENT_QR_URL = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=YOUR_UPI_ID@okicici&pn=SchoolResultPro&am=499"; 
const PLAN_PRICE = "₹499 / Year";
// ---------------------------------------------------------

const DashboardAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [magicLinkCopied, setMagicLinkCopied] = useState(false);
  const [regLinkCopied, setRegLinkCopied] = useState(false);

  const [classList, setClassList] = useState<ClassData[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassPassword, setNewClassPassword] = useState('');
  const [newSubjects, setNewSubjects] = useState<SubjectConfig[]>([
      { name: 'Maths', maxMarks: 100, passMarks: 30 },
      { name: 'English', maxMarks: 100, passMarks: 30 },
      { name: 'Malayalam', maxMarks: 100, passMarks: 30 }
  ]);
  const [loadingClasses, setLoadingClasses] = useState(false);

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

  const loadConfig = async () => {
    const data = await api.getSchoolConfig();
    setConfig(data);
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
          alert(res.message);
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
          alert("Payment details submitted successfully! Your account will be upgraded after verification.");
          loadConfig();
          setTransactionId('');
      } else {
          alert("Failed to submit: " + res.message);
      }
  };

  const handleCopyMagicLink = () => {
      const { url, key } = getSupabaseConfig();
      if (!url || !key || !config?.id) {
          alert("Database configuration or School ID missing.");
          return;
      }
      // Include School ID (s) in the payload so Teachers connect to the correct tenant
      const payload = JSON.stringify({ u: url, k: key, s: config.id });
      const encoded = btoa(payload);
      const link = `${window.location.origin}${window.location.pathname}?cfg=${encoded}#/login`;
      
      navigator.clipboard.writeText(link);
      setMagicLinkCopied(true);
      setTimeout(() => setMagicLinkCopied(false), 2000);
  };

  const handleCopyRegLink = () => {
      if (!config?.id) return;
      const link = `${window.location.origin}${window.location.pathname}#/register?schoolId=${config.id}`;
      navigator.clipboard.writeText(link);
      setRegLinkCopied(true);
      setTimeout(() => setRegLinkCopied(false), 2000);
  };

  const handleAddSubjectRow = () => {
      setNewSubjects([...newSubjects, { name: '', maxMarks: 100, passMarks: 30 }]);
  };

  const handleRemoveSubjectRow = (index: number) => {
      const updated = [...newSubjects];
      updated.splice(index, 1);
      setNewSubjects(updated);
  };

  const handleSubjectChange = (index: number, field: keyof SubjectConfig, value: string | number) => {
      const updated = [...newSubjects];
      updated[index] = { ...updated[index], [field]: value };
      setNewSubjects(updated);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const validSubjects = newSubjects.filter(s => s.name.trim() !== '');
      if (validSubjects.length === 0) {
          alert("Please add at least one subject.");
          return;
      }

      const res = await api.createClass(newClassName, newClassPassword, validSubjects);
      if (res.success) {
          alert("Class Created Successfully!");
          setNewClassName('');
          setNewClassPassword('');
          setNewSubjects([
            { name: 'Maths', maxMarks: 100, passMarks: 30 },
            { name: 'English', maxMarks: 100, passMarks: 30 },
            { name: 'Malayalam', maxMarks: 100, passMarks: 30 }
          ]);
          loadClasses();
      } else {
          alert("Failed: " + res.message);
      }
  };

  const handleDeleteClass = async (id: string) => {
      if (!window.confirm("Are you sure? This will delete the class.")) return;
      
      const res = await api.deleteClass(id);
      if (res.success) {
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
          alert(`Successfully uploaded ${students.length} students!`);
          setCsvData('');
      } else {
          alert("Upload failed: " + res.message);
      }
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
                                        onChange={e => setNewClassName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Teacher Password</label>
                                    <GlassInput 
                                        placeholder="Set a password for teacher" 
                                        value={newClassPassword}
                                        onChange={e => setNewClassPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Subjects Setup</label>
                                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                                        {newSubjects.map((sub, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <input 
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                                                    placeholder="Subject Name"
                                                    value={sub.name}
                                                    onChange={e => handleSubjectChange(idx, 'name', e.target.value)}
                                                    required
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
                                                    className="w-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-1 text-sm text-center focus:outline-none focus:border-blue-500"
                                                    placeholder="Max"
                                                    value={sub.maxMarks}
                                                    onChange={e => handleSubjectChange(idx, 'maxMarks', parseInt(e.target.value) || 0)}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveSubjectRow(idx)}
                                                    className="text-red-400 hover:text-red-600 p-1"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleAddSubjectRow}
                                        className="mt-2 text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        <Plus className="w-3 h-3"/> Add Subject
                                    </button>
                                </div>

                                <GlassButton type="submit" className="w-full">Create Class</GlassButton>
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
                                                <p className="font-bold text-slate-800 dark:text-slate-100">{cls.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {cls.subjects.map((s, i) => (
                                                        <span key={i} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-xs bg-white dark:bg-slate-800 px-2 py-1 border dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 font-mono">
                                                    Pass: {cls.password}
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
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">License & Plan</h3>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Current Status</span>
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

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
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
                                            {/* Use a placeholder or real QR code generator */}
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
                </div>
            </GlassCard>

            <div className="space-y-6">
                <GlassCard>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Quick Actions
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Your School Portal Link
                            </h4>
                            <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mb-3 leading-relaxed">
                                This is the <b>Main Link</b> for your school. Share this with your Staff and Students. It connects them directly to your school's database.
                            </p>
                            <GlassButton 
                                onClick={handleCopyMagicLink} 
                                className="w-full bg-blue-600 hover:bg-blue-700 flex justify-center items-center gap-2"
                            >
                                {magicLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {magicLinkCopied ? 'Link Copied!' : 'Copy Portal Link'}
                            </GlassButton>
                        </div>

                         <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <UserPlus className="w-4 h-4" /> Public Admission Link
                            </h4>
                            <p className="text-sm text-purple-800/80 dark:text-purple-300/80 mb-3">
                                Want students to register themselves? Share this link with parents.
                            </p>
                            <GlassButton 
                                onClick={handleCopyRegLink} 
                                className="w-full bg-purple-600 hover:bg-purple-700 flex justify-center items-center gap-2"
                            >
                                {regLinkCopied ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                                {regLinkCopied ? 'Link Copied!' : 'Copy Admission Link'}
                            </GlassButton>
                        </div>

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
                </GlassCard>
            </div>
        </div>
      );
  };

  const ExternalLink = ({className}: {className: string}) => (
     <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
     </svg>
  );

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Administrator Console</h2>
             <p className="text-slate-500 dark:text-slate-400">{config.schoolName}</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default DashboardAdmin;
