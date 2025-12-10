
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { TimetableConfig, TimetableEntry, ClassData, TeacherProfile, SubjectLoad } from '../../types';
import { CalendarClock, Plus, Trash2, Printer, CheckCircle2, AlertTriangle, Save, Grid, Zap, LayoutTemplate, Settings, User, BookOpen, BrainCircuit, ArrowRight, ArrowLeft, Users, Library, Sparkles, School, X } from 'lucide-react';

interface Props {
    classes: ClassData[];
    schoolName: string;
    onRefresh: () => void;
}

const TimetableTab: React.FC<Props> = ({ classes, schoolName, onRefresh }) => {
    // --- WIZARD STATE ---
    const [step, setStep] = useState(1); 
    // 1: Structure (Time/Days)
    // 2: Staff Room (Teachers)
    // 3: Curriculum (Subjects)
    // 4: Allocation (Mapping)
    // 5: Generation & Result
    
    // STEP 1: CONFIG
    const [config, setConfig] = useState<TimetableConfig>({
        workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        dayStartsAt: '09:30',
        dayEndsAt: '15:30',
        periodDuration: 45,
        breaks: [{ name: 'Lunch', start: '12:45', end: '13:30' }]
    });
    const [instituteType, setInstituteType] = useState<'SCHOOL' | 'MADRASSA' | 'TUITION'>('SCHOOL');

    // STEP 2: TEACHERS POOL
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [newTeacherName, setNewTeacherName] = useState('');

    // STEP 3: SUBJECT LIBRARY
    const [globalSubjects, setGlobalSubjects] = useState<string[]>([]);
    const [newSubjectName, setNewSubjectName] = useState('');

    // STEP 4: WORKLOAD MAPPING
    const [workload, setWorkload] = useState<Record<string, SubjectLoad[]>>({});
    const [activeClassId, setActiveClassId] = useState(classes[0]?.id || '');

    // GEN STATE
    const [generating, setGenerating] = useState(false);
    const [entries, setEntries] = useState<TimetableEntry[]>([]);
    const [viewClassId, setViewClassId] = useState(classes[0]?.id || '');
    
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        const conf = await api.getTimetableConfig();
        if (conf) setConfig(conf);
        
        // 1. AUTO-IMPORT TEACHERS from Class Data
        const existingEntries = await api.getTimetableEntries();
        setEntries(existingEntries);

        const uniqueTeachers = new Set<string>();
        classes.forEach(c => {
            // Filter out generic placeholder names for safety
            if (c.teacherName && !['class teacher', 'admin', 'staff', 'teacher'].includes(c.teacherName.toLowerCase().trim())) {
                uniqueTeachers.add(c.teacherName);
            }
        });

        const initialTeachers: TeacherProfile[] = Array.from(uniqueTeachers).map((name, i) => ({
            id: `t_${name.replace(/\s+/g, '_')}`,
            name: name,
            subjects: [],
            maxLoad: 28
        }));
        setTeachers(initialTeachers);

        // 2. AUTO-IMPORT SUBJECTS
        const uniqueSubjects = new Set<string>();
        classes.forEach(c => {
            c.subjects.forEach(s => uniqueSubjects.add(s.name));
        });
        // Add Common defaults
        ['Library', 'PET', 'Arts', 'Moral Science', 'Arabic', 'IT Lab'].forEach(s => uniqueSubjects.add(s));
        setGlobalSubjects(Array.from(uniqueSubjects));

        // 3. INIT WORKLOAD SKELETON
        const initialWorkload: Record<string, SubjectLoad[]> = {};
        classes.forEach(c => {
            initialWorkload[c.id] = c.subjects.map(s => ({
                subject: s.name,
                count: 5, 
                isDouble: false,
                teacherId: '' // Explicitly empty to force assignment
            }));
        });
        setWorkload(initialWorkload);
    };

    // --- STEP 1: PRESETS ---
    const applyPreset = (type: 'SCHOOL' | 'MADRASSA' | 'TUITION') => {
        setInstituteType(type);
        if (type === 'MADRASSA') {
            setConfig({
                workingDays: ['SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'], 
                dayStartsAt: '06:30',
                dayEndsAt: '08:30',
                periodDuration: 40,
                breaks: []
            });
        } else if (type === 'SCHOOL') {
            setConfig({
                workingDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
                dayStartsAt: '09:30',
                dayEndsAt: '15:30',
                periodDuration: 45,
                breaks: [{name: 'Lunch', start: '12:45', end: '13:30'}]
            });
        } else {
            setConfig({
                workingDays: ['SAT', 'SUN'],
                dayStartsAt: '09:00',
                dayEndsAt: '13:00',
                periodDuration: 60,
                breaks: [{name: 'Break', start: '11:00', end: '11:15'}]
            });
        }
    };

    // --- STEP 2: TEACHER MANIPULATION ---
    const addManualTeacher = () => {
        if (!newTeacherName.trim()) return;
        if (teachers.some(t => t.name.toLowerCase() === newTeacherName.toLowerCase())) {
            alert("Teacher already exists!");
            return;
        }
        setTeachers([...teachers, {
            id: `t_${Date.now()}`,
            name: newTeacherName,
            subjects: [],
            maxLoad: 30
        }]);
        setNewTeacherName('');
    };

    const removeTeacher = (id: string) => {
        if (confirm("Remove this teacher? Allocations will be cleared.")) {
            setTeachers(prev => prev.filter(t => t.id !== id));
        }
    };

    // --- STEP 3: SUBJECT MANIPULATION ---
    const addSubject = (name: string) => {
        if (!name.trim()) return;
        if (globalSubjects.includes(name)) return;
        setGlobalSubjects([...globalSubjects, name]);
        setNewSubjectName('');
    };

    // --- STEP 4: ALLOCATION LOGIC ---
    const updateAllocation = (classId: string, idx: number, field: string, value: any) => {
        setWorkload(prev => {
            const clsLoad = [...(prev[classId] || [])];
            clsLoad[idx] = { ...clsLoad[idx], [field]: value };
            return { ...prev, [classId]: clsLoad };
        });
    };

    const addNewAllocationRow = (classId: string) => {
        setWorkload(prev => {
            const clsLoad = [...(prev[classId] || [])];
            clsLoad.push({ subject: '', count: 3, isDouble: false, teacherId: '' });
            return { ...prev, [classId]: clsLoad };
        });
    };

    const removeAllocationRow = (classId: string, idx: number) => {
        setWorkload(prev => {
            const clsLoad = [...(prev[classId] || [])];
            clsLoad.splice(idx, 1);
            return { ...prev, [classId]: clsLoad };
        });
    };

    // --- GENERATION ---
    const handleGenerate = async () => {
        setGenerating(true);
        await api.saveTimetableConfig(config);
        
        // Smart Mapping: Map teacher Names to IDs before sending if needed
        // For now, we use names as IDs in the algorithm for simplicity if IDs aren't persistent
        
        const res = await api.autoGenerateTimetable(config, teachers, workload);
        
        setTimeout(() => {
            setGenerating(false);
            if (res.success) {
                loadInitialData(); // Reload entries
                setStep(5);
            } else {
                alert("Generation failed: " + res.message);
            }
        }, 1500);
    };

    // --- VIEW HELPERS ---
    const getPeriods = () => Array.from({length: 8}, (_, i) => i + 1);
    const getCellContent = (day: string, period: number) => {
        return entries.find(e => e.classId === viewClassId && e.day === day && e.periodIndex === period);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* WIZARD HEADER */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 sticky top-0 z-30">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarClock className="w-6 h-6 text-blue-600"/> 
                        <span className="hidden md:inline">Scheduler AI</span>
                    </h2>
                    
                    <div className="flex items-center gap-1 md:gap-2">
                        {[
                            {s:1, l:'Setup'}, {s:2, l:'Staff'}, {s:3, l:'Subjects'}, {s:4, l:'Map'}, {s:5, l:'Result'}
                        ].map((item, idx) => (
                            <React.Fragment key={item.s}>
                                <div className={`flex flex-col items-center cursor-pointer`} onClick={() => setStep(item.s)}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step === item.s ? 'bg-blue-600 text-white shadow-lg scale-110' : step > item.s ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                        {step > item.s ? <CheckCircle2 className="w-4 h-4"/> : item.s}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1 hidden md:block">{item.l}</span>
                                </div>
                                {idx < 4 && <div className={`h-0.5 w-4 md:w-8 ${step > item.s ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* STEP 1: CONFIGURATION */}
            {step === 1 && (
                <GlassCard className="max-w-2xl mx-auto">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><LayoutTemplate className="w-5 h-5 text-blue-500"/> Institution Structure</h3>
                    
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        {['SCHOOL', 'MADRASSA', 'TUITION'].map((t) => (
                            <button 
                                key={t}
                                onClick={() => applyPreset(t as any)}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${instituteType === t ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                                {t === 'SCHOOL' && <School className="w-6 h-6"/>}
                                {t === 'MADRASSA' && <BookOpen className="w-6 h-6"/>}
                                {t === 'TUITION' && <User className="w-6 h-6"/>}
                                <span className="font-bold text-xs">{t}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start Time</label>
                            <GlassInput type="time" value={config.dayStartsAt} onChange={e => setConfig({...config, dayStartsAt: e.target.value})}/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">End Time</label>
                            <GlassInput type="time" value={config.dayEndsAt} onChange={e => setConfig({...config, dayEndsAt: e.target.value})}/>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Working Days</label>
                        <div className="flex flex-wrap gap-2">
                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                <button 
                                    key={day}
                                    onClick={() => {
                                        const newDays = config.workingDays.includes(day) ? config.workingDays.filter(d => d !== day) : [...config.workingDays, day];
                                        setConfig({...config, workingDays: newDays});
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold border ${config.workingDays.includes(day) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <GlassButton onClick={() => setStep(2)} className="bg-blue-600 hover:bg-blue-700 px-8">Next Step <ArrowRight className="w-4 h-4 ml-2"/></GlassButton>
                    </div>
                </GlassCard>
            )}

            {/* STEP 2: STAFF ROOM (Teachers) */}
            {step === 2 && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <GlassCard>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5 text-blue-500"/> Staff Room</h3>
                            <div className="flex gap-2">
                                <GlassInput 
                                    placeholder="Add New Teacher..." 
                                    value={newTeacherName} 
                                    onChange={e => setNewTeacherName(e.target.value)}
                                    className="h-9 text-sm w-48"
                                    onKeyDown={e => e.key === 'Enter' && addManualTeacher()}
                                />
                                <button onClick={addManualTeacher} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"><Plus className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                            {teachers.map(t => (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                            {t.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[100px]">{t.name}</p>
                                    </div>
                                    <button onClick={() => removeTeacher(t.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                            {teachers.length === 0 && <div className="col-span-full text-center py-10 text-slate-400 text-sm">No teachers found. Add manually or create classes first.</div>}
                        </div>
                    </GlassCard>
                    <div className="flex justify-between">
                        <GlassButton variant="secondary" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</GlassButton>
                        <GlassButton onClick={() => setStep(3)} className="bg-blue-600 hover:bg-blue-700 px-8">Next Step <ArrowRight className="w-4 h-4 ml-2"/></GlassButton>
                    </div>
                </div>
            )}

            {/* STEP 3: SUBJECT LIBRARY */}
            {step === 3 && (
                <div className="max-w-3xl mx-auto space-y-6">
                    <GlassCard>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2"><Library className="w-5 h-5 text-purple-500"/> Subject Library</h3>
                            <div className="flex gap-2">
                                <GlassInput 
                                    placeholder="Add Subject..." 
                                    value={newSubjectName} 
                                    onChange={e => setNewSubjectName(e.target.value)}
                                    className="h-9 text-sm w-48"
                                    onKeyDown={e => e.key === 'Enter' && addSubject(newSubjectName)}
                                />
                                <button onClick={() => addSubject(newSubjectName)} className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700"><Plus className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {globalSubjects.map(sub => (
                                <span key={sub} className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    {sub}
                                    <button onClick={() => setGlobalSubjects(prev => prev.filter(s => s !== sub))} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                </span>
                            ))}
                            {globalSubjects.length === 0 && <p className="text-slate-400 text-sm w-full text-center py-4">No subjects. Add common subjects like Maths, English, Arabic etc.</p>}
                        </div>
                    </GlassCard>
                    <div className="flex justify-between">
                        <GlassButton variant="secondary" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</GlassButton>
                        <GlassButton onClick={() => setStep(4)} className="bg-blue-600 hover:bg-blue-700 px-8">Next Step <ArrowRight className="w-4 h-4 ml-2"/></GlassButton>
                    </div>
                </div>
            )}

            {/* STEP 4: WORKLOAD MAPPING (THE ALLOCATOR) */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        
                        {/* CLASS SELECTOR SIDEBAR */}
                        <div className="md:w-64 space-y-2">
                            <GlassCard className="p-3 bg-white dark:bg-slate-900 sticky top-24">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Select Class</h4>
                                <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {classes.map(c => {
                                        const load = workload[c.id] || [];
                                        const isComplete = load.every(l => l.teacherId);
                                        return (
                                            <button 
                                                key={c.id}
                                                onClick={() => setActiveClassId(c.id)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex justify-between items-center transition-all ${activeClassId === c.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                {c.name}
                                                {isComplete && <CheckCircle2 className={`w-3 h-3 ${activeClassId === c.id ? 'text-blue-200' : 'text-green-500'}`}/>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </GlassCard>
                        </div>

                        {/* ALLOCATION AREA */}
                        <div className="flex-1">
                            <GlassCard>
                                <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800 dark:text-white">{classes.find(c => c.id === activeClassId)?.name}</h3>
                                        <p className="text-xs text-slate-500">Assign teachers to subjects. No typing required.</p>
                                    </div>
                                    <button onClick={() => addNewAllocationRow(activeClassId)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1">
                                        <Plus className="w-3 h-3"/> Add Row
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(workload[activeClassId] || []).map((load, idx) => (
                                        <div key={idx} className="flex flex-col md:flex-row gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                            
                                            {/* SUBJECT DROPDOWN */}
                                            <div className="flex-1 w-full">
                                                <select 
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={load.subject}
                                                    onChange={e => updateAllocation(activeClassId, idx, 'subject', e.target.value)}
                                                >
                                                    <option value="">Select Subject</option>
                                                    {globalSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>

                                            {/* COUNT & DOUBLE */}
                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2">
                                                    <span className="text-[10px] font-bold text-slate-400 mr-2">Periods</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-10 py-2 text-center text-sm font-bold bg-transparent outline-none"
                                                        value={load.count}
                                                        onChange={e => updateAllocation(activeClassId, idx, 'count', parseInt(e.target.value))}
                                                    />
                                                </div>
                                                <label className={`cursor-pointer px-3 py-2 rounded-lg border text-xs font-bold transition-all select-none ${load.isDouble ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                                                    <input type="checkbox" className="hidden" checked={load.isDouble} onChange={e => updateAllocation(activeClassId, idx, 'isDouble', e.target.checked)}/>
                                                    2x
                                                </label>
                                            </div>

                                            {/* TEACHER DROPDOWN */}
                                            <div className="flex-1 w-full">
                                                <select 
                                                    className={`w-full border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 ${load.teacherId ? 'bg-green-50 dark:bg-green-900/20 border-green-200 text-green-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                                                    value={load.teacherId || ''}
                                                    onChange={e => updateAllocation(activeClassId, idx, 'teacherId', e.target.value)}
                                                >
                                                    <option value="">-- Assign Teacher --</option>
                                                    {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                                </select>
                                            </div>

                                            <button onClick={() => removeAllocationRow(activeClassId, idx)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ))}
                                    {(workload[activeClassId] || []).length === 0 && <p className="text-center text-sm text-slate-400 py-8">No subjects assigned. Click "Add Row".</p>}
                                </div>
                            </GlassCard>
                        </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                        <GlassButton variant="secondary" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-2"/> Back</GlassButton>
                        <GlassButton onClick={handleGenerate} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:to-indigo-700 px-8 py-3 shadow-xl">
                            {generating ? 'AI Building Schedule...' : <><Zap className="w-4 h-4 mr-2 fill-white"/> Generate Timetable</>}
                        </GlassButton>
                    </div>
                </div>
            )}

            {/* STEP 5: RESULT */}
            {step === 5 && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600"><CheckCircle2 className="w-6 h-6"/></div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Timetable Ready</h3>
                                <p className="text-xs text-slate-500">Generated successfully.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <GlassSelect value={viewClassId} onChange={e => setViewClassId(e.target.value)} className="w-full md:w-48 py-2 text-sm font-bold">
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </GlassSelect>
                            <GlassButton onClick={() => window.print()} className="bg-slate-900 text-white flex items-center gap-2 text-xs whitespace-nowrap">
                                <Printer className="w-4 h-4"/> Print All
                            </GlassButton>
                        </div>
                    </div>

                    {/* PREVIEW GRID */}
                    <GlassCard className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-center border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 w-20 text-xs font-bold text-slate-500 uppercase">Day</th>
                                    {getPeriods().map(p => (
                                        <th key={p} className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 min-w-[100px] text-xs font-bold text-slate-500 uppercase">Period {p}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {config.workingDays.map(day => (
                                    <tr key={day}>
                                        <td className="p-3 font-bold bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 text-slate-700 dark:text-slate-300">{day}</td>
                                        {getPeriods().map(p => {
                                            const entry = getCellContent(day, p);
                                            return (
                                                <td key={p} className="p-2 border dark:border-slate-700 h-20 align-middle hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    {entry ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold text-slate-800 dark:text-white text-xs mb-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{entry.subjectName}</span>
                                                            <span className="text-[10px] text-slate-500 font-medium">{entry.teacherId}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">-</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </GlassCard>
                    
                    <div className="flex justify-start">
                        <button onClick={() => setStep(4)} className="text-slate-500 hover:text-blue-600 text-xs font-bold flex items-center gap-1 underline">
                            <Settings className="w-3 h-3"/> Modify Allocations
                        </button>
                    </div>

                    {/* HIDDEN PRINT LAYOUT (ATM CARDS) */}
                    <div className="hidden print:block space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {teachers.map(teacher => {
                                const teacherSchedule = entries.filter(e => e.teacherId === teacher.name);
                                if(teacherSchedule.length === 0) return null;
                                return (
                                    <div key={teacher.id} className="border-2 border-black rounded-xl p-4 break-inside-avoid bg-white text-black w-[85mm] h-[55mm] flex flex-col justify-between relative overflow-hidden page-break-inside-avoid">
                                        <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-1">
                                            <div><h3 className="font-black text-xs uppercase tracking-tighter">{schoolName}</h3></div>
                                            <div className="text-right"><h2 className="font-black text-sm">{teacher.name}</h2></div>
                                        </div>
                                        <div className="flex-1 text-[6px] leading-none mt-1">
                                            {config.workingDays.map(day => (
                                                <div key={day} className="flex gap-0.5 mb-0.5 items-center">
                                                    <div className="font-bold w-4 text-[5px]">{day.substring(0,2)}</div>
                                                    {getPeriods().map(p => {
                                                        const clsId = teacherSchedule.find(e => e.day === day && e.periodIndex === p)?.classId;
                                                        const clsName = classes.find(c => c.id === clsId)?.name;
                                                        return <div key={p} className="flex-1 text-center border border-black h-3 flex items-center justify-center font-bold bg-slate-50">{clsName ? clsName.replace('Class ','').replace('Standard ','') : '-'}</div>
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-[5px] text-center mt-1 font-bold">Powered by ResultMate</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimetableTab;
