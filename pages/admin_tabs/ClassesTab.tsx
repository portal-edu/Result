import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../../components/GlassUI';
import { api } from '../../services/api';
import { ClassData, SubjectConfig, SyllabusDefinition } from '../../types';
import { CheckCircle2, User, Users, Lock, Link as LinkIcon, Trash2, Sparkles, School, PlusCircle, MessageCircle, Copy, X, ThumbsUp, BookOpen, LayoutGrid, Check, Share2 } from 'lucide-react';

interface Props {
    classes: ClassData[];
    onRefresh: () => void;
    onShowShare: (data: any) => void;
}

const ClassesTab: React.FC<Props> = ({ classes, onRefresh, onShowShare }) => {
    const [viewMode, setViewMode] = useState<'SINGLE' | 'BATCH'>('BATCH');
    
    // Single Create State
    const [classGrade, setClassGrade] = useState('');
    const [classDivision, setClassDivision] = useState('');
    const [classTeacherName, setClassTeacherName] = useState('');
    const [classPassword, setClassPassword] = useState('');
    const [creatingClass, setCreatingClass] = useState(false);
    const [subjects, setSubjects] = useState<SubjectConfig[]>([]);
    
    // Batch Create State
    const [syllabi, setSyllabi] = useState<SyllabusDefinition[]>([]);
    const [activeSyllabus, setActiveSyllabus] = useState<SyllabusDefinition | null>(null);
    const [batchSelection, setBatchSelection] = useState<Record<string, string[]>>({}); // "1": ["A", "B"]
    const [creatingBatch, setCreatingBatch] = useState(false);
    const [bulkResults, setBulkResults] = useState<{name: string, id: string, link: string}[] | null>(null);

    const [schoolConfig, setSchoolConfig] = useState<any>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdClassData, setCreatedClassData] = useState<any>(null);

    useEffect(() => {
        loadConfig();
        const globalSyllabi = api.getGlobalSyllabi();
        setSyllabi(globalSyllabi);
    }, []);

    const loadConfig = async () => {
        const config = await api.getSchoolConfig();
        setSchoolConfig(config);
        
        // Auto-select syllabus for batch if configured
        if (config?.syllabusProviderId) {
            const match = api.getGlobalSyllabi().find(s => s.id === config.syllabusProviderId);
            if (match) setActiveSyllabus(match);
        }
        
        // Set initial subjects default for manual
        setSubjects([
            { name: 'Subject 1', maxMarks: 50, passMarks: 18 },
            { name: 'Subject 2', maxMarks: 50, passMarks: 18 }
        ]);
    };

    // SMART AUTO-FILL FOR SINGLE
    useEffect(() => {
        if (!classGrade || !schoolConfig) return;
        if (schoolConfig.syllabusProviderId) {
            const syllabusSubjects = api.getSubjectsFromSyllabus(schoolConfig.syllabusProviderId, classGrade);
            if (syllabusSubjects.length > 0) {
                setSubjects(syllabusSubjects);
            }
        }
    }, [classGrade, schoolConfig]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!classGrade) {
            alert("Please enter Class/Course Name.");
            return;
        }
        
        const div = classDivision ? classDivision.trim() : '';
        const generatedName = div ? `${classGrade} ${div}` : classGrade;
        
        if (classes.some(c => c.name === generatedName)) {
            alert(`Class "${generatedName}" already exists!`);
            return;
        }
        
        let finalPassword = classPassword;
        if (!finalPassword) {
            finalPassword = Math.random().toString(36).slice(-6); 
        }

        setCreatingClass(true);
        const res = await api.createClass(generatedName, finalPassword, classTeacherName, subjects);
        setCreatingClass(false);
        
        if (res.success) {
            const link = `${window.location.origin}${window.location.pathname}#/login?invite=${res.id}`;
            const successPayload = {
                className: generatedName,
                teacher: classTeacherName || 'Class Teacher',
                password: finalPassword,
                link: link
            };
            setCreatedClassData(successPayload);
            setShowSuccessModal(true);
            setClassGrade('');
            setClassDivision('');
            setClassTeacherName('');
            setClassPassword('');
            setSubjects([{ name: 'Subject 1', maxMarks: 50, passMarks: 18 }]);
            onRefresh();
        } else {
            const msg = (res as any).message;
            alert("Failed: " + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
        }
    };

    // --- BATCH LOGIC ---
    const toggleDivision = (cls: string, div: string) => {
        setBatchSelection(prev => {
            const current = prev[cls] || [];
            if (current.includes(div)) {
                const updated = current.filter(d => d !== div);
                if (updated.length === 0) {
                    const copy = { ...prev };
                    delete copy[cls];
                    return copy;
                }
                return { ...prev, [cls]: updated };
            } else {
                return { ...prev, [cls]: [...current, div].sort() };
            }
        });
    };

    const handleBulkCreate = async () => {
        if (!activeSyllabus) return;
        const classesToCreate: { className: string, subjects: SubjectConfig[] }[] = [];
        
        Object.entries(batchSelection).forEach(([cls, divs]) => {
            // Get standard subjects for this class level
            const stdSubjects = api.getSubjectsFromSyllabus(activeSyllabus.id, cls);
            
            (divs as string[]).forEach(div => {
                const fullName = `${cls} ${div}`;
                if (!classes.some(c => c.name === fullName)) {
                    classesToCreate.push({ className: fullName, subjects: stdSubjects });
                }
            });
        });

        if (classesToCreate.length === 0) return alert("No new classes selected or all selected classes already exist.");

        setCreatingBatch(true);
        const res = await api.createBulkClasses(classesToCreate);
        setCreatingBatch(false);

        if (res.success && res.created) {
            setBulkResults(res.created.map((c: any) => ({
                name: c.name,
                id: c.id,
                link: `${window.location.origin}${window.location.pathname}#/login?invite=${c.id}`
            })));
            setBatchSelection({}); // Reset selection
            onRefresh();
        } else {
            alert("Batch creation failed: " + res.message);
        }
    };

    // --- COMMON ACTIONS ---
    const handleDeleteClass = async (id: string) => {
        if (!window.confirm("Delete this class? All students and marks will be lost.")) return;
        const res = await api.deleteClass(id);
        if (res.success) onRefresh();
        else alert("Could not delete class.");
    };

    const handleApproveClass = async (id: string) => {
        if (!confirm("Approve results for this class? They will be published.")) return;
        const res = await api.updateClassStatus(id, 'APPROVED');
        if (res.success) { alert("Class Approved!"); onRefresh(); }
        else alert("Failed");
    };

    const copyInviteLink = (classId: string) => {
        const link = `${window.location.origin}${window.location.pathname}#/login?invite=${classId}`;
        navigator.clipboard.writeText(link);
        alert("Invite Link Copied!");
    };
    
    const shareViaWhatsApp = (data: any) => {
        const text = `*Class Setup Invitation*\n\nHello Teacher,\n\nYou have been invited to manage *${data.className}* on SchoolResult Pro.\n\n👇 *Click to Setup & Claim Class:*\n${data.link}\n\n(You can set your own password)`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    // Helper to update subject in list (Manual)
    const updateSubject = (idx: number, field: string, value: any) => {
        const updated = [...subjects];
        updated[idx] = { ...updated[idx], [field]: value };
        setSubjects(updated);
    };

    const addSubject = () => {
        setSubjects([...subjects, { name: '', maxMarks: 50, passMarks: 18 }]);
    };

    const removeSubject = (idx: number) => {
        const updated = [...subjects];
        updated.splice(idx, 1);
        setSubjects(updated);
    };

    return (
        <div className="animate-fade-in-up">
            
            {/* VIEW TOGGLE */}
            <div className="flex justify-center mb-6">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setViewMode('BATCH')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'BATCH' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}
                    >
                        <LayoutGrid className="w-4 h-4"/> Smart Batch Generator
                    </button>
                    <button 
                        onClick={() => setViewMode('SINGLE')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'SINGLE' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-slate-500'}`}
                    >
                        <PlusCircle className="w-4 h-4"/> Manual Create
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                
                {/* --- LEFT PANEL: CREATION FORM --- */}
                <div className="md:col-span-1">
                    {viewMode === 'BATCH' ? (
                        <GlassCard className="border-t-4 border-t-purple-500 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center shrink-0">
                                    <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">Batch Wizard</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Generate multiple classes</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Syllabus Standard</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500"
                                        value={activeSyllabus?.id || ''}
                                        onChange={e => setActiveSyllabus(syllabi.find(s => s.id === e.target.value) || null)}
                                    >
                                        <option value="">Select Syllabus</option>
                                        {syllabi.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>

                                {activeSyllabus && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Select Classes & Divisions</p>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {activeSyllabus.classRanges.map(cls => (
                                                <div key={cls} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300 w-12">Cls {cls}</span>
                                                    <div className="flex gap-1">
                                                        {['A', 'B', 'C', 'D'].map(div => {
                                                            const isSelected = batchSelection[cls]?.includes(div);
                                                            return (
                                                                <button 
                                                                    key={div}
                                                                    onClick={() => toggleDivision(cls, div)}
                                                                    className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${isSelected ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                                                                >
                                                                    {div}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <GlassButton 
                                    onClick={handleBulkCreate} 
                                    disabled={creatingBatch || !activeSyllabus || Object.keys(batchSelection).length === 0} 
                                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                                >
                                    {creatingBatch ? 'Generating...' : `Create ${Object.values(batchSelection).flat().length} Classes`}
                                </GlassButton>
                            </div>
                        </GlassCard>
                    ) : (
                        <GlassCard className="border-t-4 border-t-blue-500 sticky top-24 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {/* MANUAL CREATE FORM (Existing Logic) */}
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center shrink-0">
                                    <School className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">New Class</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Add a single batch</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateClass} className="space-y-5">
                                <div className="grid grid-cols-5 gap-2">
                                    <div className="col-span-3">
                                        <label className="text-xs font-bold text-slate-500 block mb-1 uppercase">Class / Course</label>
                                        <GlassInput 
                                            placeholder="e.g. 10 / BCA"
                                            value={classGrade}
                                            onChange={e => setClassGrade(e.target.value)}
                                            required
                                            list="grade-suggestions"
                                            className="font-bold"
                                        />
                                        <datalist id="grade-suggestions">
                                            {['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '+1', '+2'].map(g => <option key={g} value={g}/>)}
                                        </datalist>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 block mb-1 uppercase">Batch</label>
                                        <GlassInput 
                                            placeholder="A"
                                            value={classDivision}
                                            className="text-center font-bold"
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val.length === 1) setClassDivision(val.toUpperCase());
                                                else setClassDivision(val);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Subjects List */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                            <BookOpen className="w-3 h-3"/> Subjects ({subjects.length})
                                        </label>
                                        <button type="button" onClick={addSubject} className="text-[10px] font-bold text-blue-600 hover:underline">+ Add</button>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {subjects.map((sub, idx) => (
                                            <div key={idx} className="flex gap-1 items-center">
                                                <GlassInput 
                                                    className="h-7 text-xs px-2" 
                                                    placeholder="Subject" 
                                                    value={sub.name} 
                                                    onChange={e => updateSubject(idx, 'name', e.target.value)}
                                                    list="master-subjects"
                                                />
                                                <GlassInput 
                                                    type="number" 
                                                    className="h-7 text-xs px-1 w-12 text-center" 
                                                    placeholder="Max" 
                                                    value={sub.maxMarks} 
                                                    onChange={e => updateSubject(idx, 'maxMarks', e.target.value)}
                                                />
                                                <button type="button" onClick={() => removeSubject(idx)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                        <datalist id="master-subjects">
                                            {(schoolConfig?.masterSubjects || []).map((s: string) => <option key={s} value={s} />)}
                                        </datalist>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Teacher Name (Optional)</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                        <GlassInput className="pl-9" placeholder="e.g. Mrs. Smith" value={classTeacherName} onChange={e => setClassTeacherName(e.target.value)}/>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 block mb-1">Access Password</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                            <GlassInput className="pl-9" placeholder="Set Password" value={classPassword} onChange={e => setClassPassword(e.target.value)}/>
                                        </div>
                                        <button type="button" onClick={() => setClassPassword(Math.random().toString(36).slice(-6))} className="bg-purple-50 dark:bg-purple-900/20 px-3 rounded-lg text-xs font-bold hover:bg-purple-100 text-purple-600 border border-purple-200"><Sparkles className="w-4 h-4"/></button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500"/> Leave blank to auto-generate link.
                                    </p>
                                </div>

                                <GlassButton type="submit" disabled={creatingClass} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                                    {creatingClass ? 'Creating...' : <><PlusCircle className="w-4 h-4"/> Create Class</>}
                                </GlassButton>
                            </form>
                        </GlassCard>
                    )}
                </div>
                
                {/* --- RIGHT PANEL: LIST --- */}
                <div className="md:col-span-2 space-y-4">
                    {classes.map(cls => (
                        <div key={cls.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center font-black text-slate-500 dark:text-slate-400 text-sm">
                                    {cls.name.substring(0,2)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        {cls.name}
                                        {cls.submissionStatus === 'SUBMITTED' && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">Waiting Approval</span>}
                                        {cls.submissionStatus === 'APPROVED' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">Published</span>}
                                    </h4>
                                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2 items-center">
                                        <span className="flex items-center gap-1 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded"><Users className="w-3 h-3"/> {cls.studentCount || 0} Total</span>
                                        <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded"><User className="w-3 h-3"/> {cls.boysCount || 0} Boys</span>
                                        <span className="flex items-center gap-1 text-pink-600 bg-pink-50 px-2 py-0.5 rounded"><User className="w-3 h-3"/> {cls.girlsCount || 0} Girls</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-2">
                                        <span>Teacher: {cls.teacherName || 'Not Assigned'}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="font-mono">Pass: {cls.password ? cls.password : <span className="text-orange-500 italic">Not Set (Link Only)</span>}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {cls.submissionStatus === 'SUBMITTED' && (
                                    <button onClick={() => handleApproveClass(cls.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md flex items-center gap-1">
                                        <ThumbsUp className="w-3 h-3"/> Approve
                                    </button>
                                )}
                                <button onClick={() => copyInviteLink(cls.id)} className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                                    <LinkIcon className="w-3 h-3"/> Share
                                </button>
                                <button onClick={() => handleDeleteClass(cls.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                    {classes.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                                <School className="w-8 h-8 text-blue-500"/>
                            </div>
                            <h3 className="font-bold text-slate-700 dark:text-slate-300">No classes yet</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Create classes using the manual form or batch wizard.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SUCCESS MODAL - BATCH RESULTS */}
            {bulkResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <GlassCard className="w-full max-w-2xl bg-white dark:bg-slate-900 border-t-4 border-t-green-500 max-h-[90vh] flex flex-col p-0">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-green-600"/>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Batch Created!</h3>
                                    <p className="text-sm text-slate-500">{bulkResults.length} classes generated successfully.</p>
                                </div>
                            </div>
                            <button onClick={() => setBulkResults(null)} className="text-slate-400 hover:text-slate-600"><X className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Share2 className="w-3 h-3"/> Invite Links</p>
                            <div className="grid md:grid-cols-2 gap-3">
                                {bulkResults.map((res, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{res.name}</h4>
                                            <p className="text-[10px] text-slate-400">Invite teacher to claim</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(res.link)} 
                                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600" 
                                                title="Copy Link"
                                            >
                                                <Copy className="w-4 h-4"/>
                                            </button>
                                            <button 
                                                onClick={() => shareViaWhatsApp({className: res.name, link: res.link})} 
                                                className="p-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg"
                                                title="WhatsApp"
                                            >
                                                <MessageCircle className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 text-center">
                            <button onClick={() => setBulkResults(null)} className="text-sm text-blue-600 font-bold hover:underline">Done</button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* SUCCESS MODAL - SINGLE RESULT (Existing) */}
            {showSuccessModal && createdClassData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <GlassCard className="w-full max-w-md bg-white dark:bg-slate-900 text-center relative border-t-4 border-t-green-500">
                        <button onClick={() => setShowSuccessModal(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 animate-bounce"/>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Class Created!</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            <span className="font-bold text-slate-800 dark:text-white">{createdClassData.className}</span> is ready. Share details with the teacher.
                        </p>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 text-left">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Class Password</span>
                                <span className="font-mono font-black text-lg text-blue-600 dark:text-blue-400">{createdClassData.password}</span>
                            </div>
                            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                            <p className="text-xs text-slate-400 mb-1">Invite Link:</p>
                            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 font-mono break-all">
                                {createdClassData.link}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => shareViaWhatsApp(createdClassData)} className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                                <MessageCircle className="w-5 h-5"/> WhatsApp
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(`Class: ${createdClassData.className}\nLink: ${createdClassData.link}\nPassword: ${createdClassData.password}`); alert("Copied details!"); }} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200">
                                <Copy className="w-5 h-5"/> Copy All
                            </button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default ClassesTab;