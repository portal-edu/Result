
import React, { useMemo, useState } from 'react';
import { GlassCard } from '../../components/GlassUI';
import { Student, Marks, AssessmentProgram, SchoolConfig } from '../../types';
import { Sparkles, Calendar, TrendingUp, BrainCircuit, ClipboardList, Clock, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface Props {
    user: Student;
    marks: Marks | null;
    assessments: AssessmentProgram[];
    schoolConfig: SchoolConfig | null;
}

const HomeTab: React.FC<Props> = ({ user, marks, assessments, schoolConfig }) => {
    
    // --- AI LOGIC ---
    const aiAnalysis = useMemo(() => {
        if (!marks || !marks.subjects) return null;
        
        let maxScore = -1;
        let minScore = 101;
        let strongSub = '';
        let weakSub = '';
        let totalMarks = 0;
        let subjectCount = 0;
        
        Object.entries(marks.subjects).forEach(([sub, score]) => {
            const val = typeof score === 'number' ? score : 0;
            if (val > maxScore) { maxScore = val; strongSub = sub; }
            if (val < minScore && val > 0) { minScore = val; weakSub = sub; }
            totalMarks += val;
            subjectCount++;
        });

        const avg = subjectCount > 0 ? totalMarks / subjectCount : 0;
        let tip = "Consistency is key! Keep practicing daily.";
        let mood = 'NEUTRAL';

        if (minScore < 35) {
            tip = `You're struggling with ${weakSub}. Try spending 30 mins extra daily on it!`;
            mood = 'URGENT';
        } else if (avg > 90) {
            tip = `You are a champion in ${strongSub}! 🌟 Maintain this momentum.`;
            mood = 'EXCELLENT';
        } else if (avg > 75) {
            tip = `Great job! To reach the top, focus on converting your ${weakSub} marks to A grade.`;
            mood = 'GOOD';
        } else {
            tip = `You have potential. A little more focus on ${weakSub} can boost your total rank.`;
        }

        return { strong: strongSub || 'None', weak: weakSub || 'None', tip, mood };
    }, [marks]);

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* 1. AI INSIGHT WIDGET (LOCKED FOR FREE USERS) */}
            {aiAnalysis && (
                <div className={`rounded-3xl p-6 relative overflow-hidden shadow-lg border border-white/10 ${user.isPremium ? (aiAnalysis.mood === 'EXCELLENT' ? 'bg-gradient-to-br from-green-500 to-emerald-700' : aiAnalysis.mood === 'URGENT' ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-indigo-500 to-purple-700') : 'bg-slate-900'}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-white"><BrainCircuit className="w-32 h-32 rotate-12"/></div>
                    
                    {user.isPremium ? (
                        <div className="relative z-10 text-white animate-fade-in-up">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
                                    <Sparkles className="w-3 h-3"/> AI Smart Analyst
                                </span>
                            </div>
                            <p className="text-lg md:text-xl font-bold leading-relaxed mb-6">
                                "{aiAnalysis.tip}"
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Strongest</p>
                                    <p className="font-black text-lg truncate">{aiAnalysis.strong}</p>
                                </div>
                                <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/10">
                                    <p className="text-[10px] uppercase font-bold opacity-70 mb-1">Improve</p>
                                    <p className="font-black text-lg truncate">{aiAnalysis.weak}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 text-white text-center py-6">
                            <div className="blur-sm select-none opacity-50 mb-4">
                                <p className="text-xl font-bold">Your performance requires attention in specific areas.</p>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="bg-white/10 h-16 rounded-xl"></div>
                                    <div className="bg-white/10 h-16 rounded-xl"></div>
                                </div>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2 backdrop-blur-sm border border-white/20">
                                    <Lock className="w-6 h-6 text-white"/>
                                </div>
                                <h3 className="font-bold text-lg mb-1">Unlock AI Insights</h3>
                                <p className="text-xs text-slate-300 max-w-xs mx-auto">Get personalized study tips and strength analysis.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 2. UPCOMING TASKS (Assessments) */}
            <div>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5 text-blue-500"/> Upcoming Tasks
                    </h3>
                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{assessments.length}</span>
                </div>

                {assessments.length > 0 ? (
                    <div className="space-y-3">
                        {assessments.map(task => {
                            // Logic to determine active status
                            const hasSchedule = task.schedules && task.schedules.length > 0;
                            const status = hasSchedule ? 'Scheduled' : 'Ongoing';
                            
                            return (
                                <GlassCard key={task.id} className="flex items-center gap-4 p-4 hover:border-blue-300 transition-colors cursor-pointer group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform ${task.type === 'STAR' ? 'bg-yellow-100 text-yellow-600' : 'bg-purple-100 text-purple-600'}`}>
                                        <ClipboardList className="w-6 h-6"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1 truncate">{task.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {task.frequency}</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {task.questions.length} Items</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${status === 'Ongoing' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {status}
                                        </span>
                                    </div>
                                </GlassCard>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2"/>
                        <p className="text-sm text-slate-400 font-medium">No tasks scheduled yet.</p>
                        <p className="text-xs text-slate-300 mt-1">Enjoy your free time!</p>
                    </div>
                )}
            </div>

            {/* 3. QUICK LINKS */}
            {schoolConfig && (
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => window.open(`https://wa.me/?text=I%20study%20at%20${schoolConfig.schoolName}`, '_blank')} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><TrendingUp className="w-5 h-5"/></div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Share School</span>
                    </button>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><Calendar className="w-5 h-5"/></div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Timetable (Soon)</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeTab;
