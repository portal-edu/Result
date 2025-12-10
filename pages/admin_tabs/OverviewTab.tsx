
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { Plus, Users, FileText, Rocket, CheckCircle2, ArrowRight, UserPlus, Radar, BellRing, Moon, CalendarDays, ClipboardCheck, Zap, Info } from 'lucide-react';
import { api } from '../../services/api';
import { Student, ClassData, SystemStats, CrowdInsight, ExamType } from '../../types';
import { formatDate } from '../../services/utils';

interface Props {
    setActiveTab: (tab: any) => void;
    stats: SystemStats | null;
    classes: ClassData[];
    pendingAdmissions: Student[];
    onRefresh: () => void;
    setShowPublishModal: (show: boolean) => void;
    setShowStudentEntryModal: (show: boolean) => void;
}

const OverviewTab: React.FC<Props> = ({ setActiveTab, classes, pendingAdmissions, onRefresh, setShowPublishModal, setShowStudentEntryModal }) => {
    const [crowdInsight, setCrowdInsight] = useState<CrowdInsight | null>(null);
    
    // Publish Modal Internal State
    const [localPublishModal, setLocalPublishModal] = useState(false);
    const [publishType, setPublishType] = useState<ExamType>('TERM');
    const [publishDate, setPublishDate] = useState('');
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        loadCrowdRadar();
    }, []);

    const loadCrowdRadar = async () => {
        const insight = await api.getHolidayRadar();
        setCrowdInsight(insight);
    };
    
    const handleAdmissionAction = async (studentId: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'APPROVE') {
            const res = await api.verifyStudent(studentId, 'Admin');
            if (res.success) {
                onRefresh();
            } else alert(res.message);
        } else {
            if(!window.confirm("Reject this admission?")) return;
            const res = await api.rejectAdmission(studentId);
            if (res.success) onRefresh();
        }
    };

    const handlePublishClick = () => {
        setLocalPublishModal(true);
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setPublishDate(now.toISOString().slice(0, 16));
    };

    const confirmPublish = async () => {
        setPublishing(true);
        
        // 1. DETERMINE COST IN CREDITS
        const isFreeExam = ['CLASS_TEST', 'REVISION'].includes(publishType);
        
        if (!isFreeExam) {
            const totalStudents = classes.reduce((acc, cls) => acc + (cls.studentCount || 0), 0);
            const freeLimit = 50;
            const chargeable = Math.max(0, totalStudents - freeLimit);
            const cost = chargeable * 1; // 1 Credit per student

            const config = await api.getSchoolConfig();
            const balance = config?.walletBalance || 0;

            if (cost > 0) {
                if (balance < cost) {
                    alert(`Insufficient Credits!\n\nStudents: ${totalStudents}\nFree Quota: -${freeLimit}\nBillable: ${chargeable}\n\nTotal Cost: ${cost} Credits\nYour Balance: ${balance} Credits\n\nPlease Buy Credits from the Wallet tab.`);
                    setPublishing(false);
                    return;
                }
                
                const confirmed = confirm(`Publishing for ${totalStudents} Students.\n\n🎁 First 50 Students: FREE\n💰 Chargeable: ${chargeable}\n💎 Total Cost: ${cost} Credits\n\nYour Balance: ${balance} -> ${balance - cost}\n\nProceed?`);
                if (!confirmed) {
                    setPublishing(false);
                    return;
                }

                const deductRes = await api.deductCredits(cost, config?.examName || 'Result Publish');
                if (!deductRes.success) {
                    alert("Credit Deduction Failed: " + deductRes.message);
                    setPublishing(false);
                    return;
                }
            } else {
                // Totally Free
                const confirmed = confirm(`Publishing for ${totalStudents} Students.\n\n🎁 Cost: 0 Credits (Covered by Free Tier)\n\nYour ${balance} credits will be saved for AI features.\n\nProceed?`);
                if (!confirmed) {
                    setPublishing(false);
                    return;
                }
            }
        }

        // 2. UPDATE SETTINGS
        const res = await api.updateSchoolSettings({ 
            scheduledPublishDate: publishDate,
            lastPublishType: publishType
        });
        
        setPublishing(false);
        if(res.success) { 
            setLocalPublishModal(false); 
            alert(isFreeExam ? "✅ Results Published (Class Test - Free)!" : "🚀 Results Published Successfully!");
            onRefresh();
        } else {
            alert("Publish Failed");
        }
    };

    const hasClasses = classes.length > 0;
    const hasStudents = classes.reduce((acc, curr) => acc + (curr.studentCount || 0), 0) > 0;
    const isSubmitted = classes.some(c => c.submissionStatus === 'SUBMITTED');

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* CROWD RADAR */}
            {crowdInsight && (
                <div className={`p-4 rounded-xl border-l-4 shadow-lg flex items-center justify-between ${crowdInsight.type === 'HOLIDAY' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${crowdInsight.type === 'HOLIDAY' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            {crowdInsight.type === 'HOLIDAY' ? <BellRing className="w-5 h-5 animate-bounce"/> : <Moon className="w-5 h-5"/>}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${crowdInsight.type === 'HOLIDAY' ? 'text-red-800 dark:text-red-200' : 'text-indigo-800 dark:text-indigo-200'}`}>
                                {crowdInsight.message}
                            </h4>
                            <p className="text-[10px] opacity-70 flex items-center gap-1">
                                <Radar className="w-3 h-3"/> Radar Confidence: {crowdInsight.confidence}% • Region: {crowdInsight.region}
                            </p>
                        </div>
                    </div>
                    {crowdInsight.type === 'HOLIDAY' && (
                        <button onClick={() => setActiveTab('calendar')} className="text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg font-bold text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                            Update Calendar
                        </button>
                    )}
                </div>
            )}

            {/* Quick Launchpad */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setActiveTab('classes')} className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-5 rounded-2xl shadow-lg shadow-blue-500/20 text-left transition-transform hover:-translate-y-1">
                    <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6 text-white"/>
                    </div>
                    <h3 className="font-bold text-lg leading-none mb-1">Add Class</h3>
                    <p className="text-blue-100 text-xs opacity-80">Step 1: Create</p>
                </button>

                <button onClick={() => setShowStudentEntryModal(true)} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-left transition-transform hover:-translate-y-1">
                    <div className="bg-orange-100 dark:bg-orange-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                        <Users className="w-6 h-6 text-orange-600 dark:text-orange-400"/>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-none mb-1">Add Students</h3>
                    <p className="text-slate-500 text-xs">Step 2: Quick Entry</p>
                </button>

                <button onClick={() => setActiveTab('settings')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-left transition-transform hover:-translate-y-1">
                    <div className="bg-purple-100 dark:bg-purple-900/30 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400"/>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-none mb-1">Exam Name</h3>
                    <p className="text-slate-500 text-xs">Step 3: Configure</p>
                </button>

                <button onClick={handlePublishClick} className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-5 rounded-2xl shadow-lg shadow-green-500/20 text-left transition-transform hover:-translate-y-1">
                    <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                        <Rocket className="w-6 h-6 text-white"/>
                    </div>
                    <h3 className="font-bold text-lg leading-none mb-1">Publish Result</h3>
                    <p className="text-green-100 text-xs opacity-80">Final Step: Go Live</p>
                </button>
            </div>

            {/* Pending Admissions */}
            {pendingAdmissions.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 animate-pulse">
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2 mb-2">
                        <UserPlus className="w-5 h-5"/> Pending Admissions ({pendingAdmissions.length})
                    </h4>
                    <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {pendingAdmissions.map(p => (
                            <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg flex justify-between items-center shadow-sm border border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">{p.name}</span>
                                        <span className="text-[10px] bg-slate-100 px-1 rounded">{p.className}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">{p.gender}, {formatDate(p.dob)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAdmissionAction(p.id, 'APPROVE')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200">Approve</button>
                                    <button onClick={() => handleAdmissionAction(p.id, 'REJECT')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold hover:bg-red-200">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PUBLISH MODAL */}
            {localPublishModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <GlassCard className="max-w-md w-full relative border-t-4 border-emerald-600 bg-white dark:bg-slate-900">
                        <button onClick={() => setLocalPublishModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
                                <Rocket className="w-8 h-8 text-emerald-600"/>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Publish Results</h2>
                            <p className="text-slate-500 text-sm">Make marks visible to parents & students.</p>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Select Exam Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => setPublishType('TERM')}
                                        className={`p-3 rounded-lg border-2 text-sm font-bold flex flex-col items-center gap-1 transition-all ${publishType === 'TERM' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <CalendarDays className="w-5 h-5"/>
                                        Term / Final
                                        <span className="text-[9px] font-normal text-orange-600 bg-orange-100 px-1 rounded flex items-center gap-1 mt-1"><Zap className="w-3 h-3 fill-orange-600"/> Paid</span>
                                    </button>
                                    <button 
                                        onClick={() => setPublishType('CLASS_TEST')}
                                        className={`p-3 rounded-lg border-2 text-sm font-bold flex flex-col items-center gap-1 transition-all ${publishType === 'CLASS_TEST' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <ClipboardCheck className="w-5 h-5"/>
                                        Class Test
                                        <span className="text-[9px] font-normal text-green-600 bg-green-100 px-1 rounded mt-1">FREE</span>
                                    </button>
                                </div>
                            </div>

                            {publishType === 'TERM' && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2 border border-blue-100 dark:border-blue-800">
                                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5"/>
                                    <div>
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Free Tier Active</p>
                                        <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight mt-1">
                                            First 50 students are always FREE. You only pay for additional students. Your wallet credits are saved for AI features.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Publish Time</label>
                                <GlassInput type="datetime-local" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
                            </div>
                        </div>
                        
                        <GlassButton onClick={confirmPublish} disabled={publishing} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                            {publishing ? 'Processing...' : 'Confirm & Publish'}
                        </GlassButton>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default OverviewTab;
