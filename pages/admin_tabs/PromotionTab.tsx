
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { ClassData, Student } from '../../types';
import { ArrowRight, CheckCircle2, AlertTriangle, Users, GraduationCap, XCircle, ArrowLeftRight } from 'lucide-react';

interface Props {
    classes: ClassData[];
    onRefresh: () => void;
}

const PromotionTab: React.FC<Props> = ({ classes, onRefresh }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Step 1: Mapping
    const [mapping, setMapping] = useState<Record<string, string>>({}); // currentClassId -> targetClassId
    
    // Step 2: Student Selection
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    
    // Step 3: Summary
    const [promotionStats, setPromotionStats] = useState({ promoted: 0, retained: 0, alumni: 0 });

    useEffect(() => {
        // Auto-map logic (Try to find next class by number)
        const initialMap: Record<string, string> = {};
        classes.forEach(cls => {
            // Logic: If class is "5 A", try to find "6 A"
            const numPart = cls.name.match(/\d+/)?.[0];
            if (numPart) {
                const nextNum = parseInt(numPart) + 1;
                const divPart = cls.name.replace(numPart, '').trim();
                const targetName = `${nextNum} ${divPart}`.trim();
                const targetClass = classes.find(c => c.name === targetName);
                
                if (targetClass) {
                    initialMap[cls.id] = targetClass.id;
                } else {
                    initialMap[cls.id] = 'ALUMNI'; // Default for highest class
                }
            } else {
                initialMap[cls.id] = 'RETAIN'; // Fallback
            }
        });
        setMapping(initialMap);
    }, [classes]);

    const loadCandidates = async () => {
        setLoading(true);
        // In real app, fetch students with Fee & Result Status
        // Mocking enrichment here
        const allStudents: any[] = [];
        for (const cls of classes) {
            const studs = await api.getStudentsByClass(cls.id);
            const targetAction = mapping[cls.id];
            
            // Mock Fee Status check
            const feeStatus = Math.random() > 0.8 ? 'DUE' : 'PAID'; 
            const resultStatus = Math.random() > 0.9 ? 'FAILED' : 'PASSED';

            const enriched = studs.map(s => ({
                ...s,
                currentClassName: cls.name,
                targetAction: targetAction, // ID or ALUMNI or RETAIN
                feeStatus,
                resultStatus,
                isEligible: feeStatus === 'PAID' && resultStatus === 'PASSED'
            }));
            allStudents.push(...enriched);
        }
        setStudents(allStudents);
        
        // Auto-select eligible
        setSelectedStudents(allStudents.filter(s => s.isEligible).map(s => s.id));
        setStep(2);
        setLoading(false);
    };

    const executePromotion = async () => {
        if (!confirm("Are you sure? This will move students to new classes and archive old data.")) return;
        setLoading(true);
        
        const payload = students
            .filter(s => selectedStudents.includes(s.id))
            .map(s => ({
                studentId: s.id,
                targetClassId: s.targetAction, // Can be UUID, 'ALUMNI', 'RETAIN'
                currentClassId: s.classId
            }));

        const res = await api.promoteStudentsBatch(payload);
        setLoading(false);
        
        if (res.success) {
            setPromotionStats(res.stats);
            setStep(3);
            onRefresh();
        } else {
            alert("Promotion Failed: " + res.message);
        }
    };

    const toggleStudent = (id: string) => {
        if (selectedStudents.includes(id)) setSelectedStudents(prev => prev.filter(s => s !== id));
        else setSelectedStudents(prev => [...prev, id]);
    };

    return (
        <div className="max-w-5xl mx-auto animate-fade-in-up">
            
            {/* WIZARD HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Year-End Promotion</h2>
                    <p className="text-slate-500 text-sm">Move students to the next academic year.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <div className="w-8 h-1 bg-slate-200"><div className={`h-full bg-blue-600 transition-all ${step > 1 ? 'w-full' : 'w-0'}`}></div></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    <div className="w-8 h-1 bg-slate-200"><div className={`h-full bg-blue-600 transition-all ${step > 2 ? 'w-full' : 'w-0'}`}></div></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                </div>
            </div>

            {/* STEP 1: CLASS MAPPING */}
            {step === 1 && (
                <div className="space-y-6">
                    <GlassCard>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <ArrowLeftRight className="w-5 h-5 text-blue-500"/> Class Progression Mapping
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {classes.map(cls => (
                                <div key={cls.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                            {cls.name.substring(0,3)}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400"/>
                                    </div>
                                    <div className="flex-1 ml-4">
                                        <GlassSelect 
                                            value={mapping[cls.id]} 
                                            onChange={e => setMapping({...mapping, [cls.id]: e.target.value})}
                                            className="text-sm py-2"
                                        >
                                            <option value="RETAIN">Retain in {cls.name} (Fail)</option>
                                            <option value="ALUMNI">🎓 Promote to Alumni (TC)</option>
                                            {classes.filter(c => c.id !== cls.id).map(target => (
                                                <option key={target.id} value={target.id}>Promote to {target.name}</option>
                                            ))}
                                        </GlassSelect>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                    <div className="flex justify-end">
                        <GlassButton onClick={loadCandidates} disabled={loading} className="px-8 bg-blue-600 hover:bg-blue-700">
                            {loading ? 'Analyzing...' : 'Next: Verify Candidates'}
                        </GlassButton>
                    </div>
                </div>
            )}

            {/* STEP 2: CANDIDATE FILTER */}
            {step === 2 && (
                <div className="space-y-6">
                    <GlassCard className="flex flex-col h-[600px] p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg">Student Eligibility</h3>
                                <p className="text-xs text-slate-500">{selectedStudents.length} selected for promotion.</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3"/> Fee Dues</div>
                                <div className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> Eligible</div>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 w-10 text-center"><input type="checkbox" className="accent-blue-600" checked={selectedStudents.length === students.length} onChange={() => setSelectedStudents(selectedStudents.length === students.length ? [] : students.map(s => s.id))} /></th>
                                        <th className="p-3">Student</th>
                                        <th className="p-3">Current Class</th>
                                        <th className="p-3">Action</th>
                                        <th className="p-3 text-center">Fee Status</th>
                                        <th className="p-3 text-center">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {students.map(s => (
                                        <tr key={s.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!s.isEligible ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                            <td className="p-3 text-center">
                                                <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={selectedStudents.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                                            </td>
                                            <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{s.name}</td>
                                            <td className="p-3 text-xs text-slate-500">{s.currentClassName}</td>
                                            <td className="p-3 text-xs font-bold text-blue-600">
                                                {s.targetAction === 'ALUMNI' ? '🎓 Alumni' : s.targetAction === 'RETAIN' ? '🚫 Retain' : classes.find(c => c.id === s.targetAction)?.name}
                                            </td>
                                            <td className="p-3 text-center">
                                                {s.feeStatus === 'PAID' ? <span className="text-green-600 font-bold text-[10px]">No Dues</span> : <span className="text-red-500 font-bold text-[10px]">Due Pending</span>}
                                            </td>
                                            <td className="p-3 text-center">
                                                {s.resultStatus === 'PASSED' ? <span className="text-green-600 font-bold text-[10px]">Passed</span> : <span className="text-orange-500 font-bold text-[10px]">Failed</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>

                    <div className="flex justify-between">
                        <GlassButton variant="secondary" onClick={() => setStep(1)}>Back</GlassButton>
                        <GlassButton onClick={executePromotion} disabled={loading || selectedStudents.length === 0} className="px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
                            {loading ? 'Processing...' : `Promote ${selectedStudents.length} Students`}
                        </GlassButton>
                    </div>
                </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400"/>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Promotion Complete!</h2>
                    <p className="text-slate-500 mb-8 max-w-md">
                        The academic year has been updated. Old records are archived.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-6 mb-8 w-full max-w-lg">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 uppercase">Promoted</p>
                            <h3 className="text-3xl font-black text-blue-600">{promotionStats.promoted}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 uppercase">Retained</p>
                            <h3 className="text-3xl font-black text-orange-500">{promotionStats.retained}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 uppercase">Alumni (TC)</p>
                            <h3 className="text-3xl font-black text-purple-600">{promotionStats.alumni}</h3>
                        </div>
                    </div>

                    <GlassButton onClick={() => { setStep(1); onRefresh(); }} className="px-8">
                        Return to Dashboard
                    </GlassButton>
                </div>
            )}
        </div>
    );
};

export default PromotionTab;
