
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Student } from '../../types';
import { Star, TrendingUp, Calendar, Target, Medal } from 'lucide-react';

interface Props {
    user: Student;
}

const StudentAssessments: React.FC<Props> = ({ user }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await api.getStudentAssessmentStats(user.id);
            setStats(data);
            setLoading(false);
        };
        load();
    }, [user]);

    if (loading) return <div className="text-center py-10 text-slate-400">Loading Reports...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* OVERVIEW STATS */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white border-none">
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                        <Star className="w-4 h-4 text-yellow-300 fill-yellow-300"/>
                        <span className="text-xs font-bold uppercase">Total Stars</span>
                    </div>
                    <h3 className="text-3xl font-black">
                        {stats.history.reduce((acc: number, h: any) => acc + (h.type === 'STAR' ? h.score : 0), 0)}
                    </h3>
                </GlassCard>
                <GlassCard className="bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-2 mb-1 text-slate-500">
                        <Target className="w-4 h-4"/>
                        <span className="text-xs font-bold uppercase">Activities</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {stats.history.length}
                    </h3>
                </GlassCard>
            </div>

            {/* PROGRAM BREAKDOWN */}
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-orange-500"/> Performance by Category
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                    {stats.programs.map((prog: any, idx: number) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{prog.name}</h4>
                                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">{prog.type}</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-blue-600">{prog.totalScore}</span>
                                <span className="text-xs text-slate-400 mb-1">points in {prog.entries} sessions</span>
                            </div>
                        </div>
                    ))}
                    {stats.programs.length === 0 && <p className="col-span-full text-center text-xs text-slate-400">No active assessments.</p>}
                </div>
            </div>

            {/* RECENT HISTORY */}
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500"/> Recent Logs
                </h3>
                <div className="space-y-2">
                    {stats.history.slice(0, 10).map((log: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-50 dark:border-slate-700">
                            <div>
                                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">{log.program}</p>
                                <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {log.type === 'STAR' && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400"/>}
                                <span className="font-black text-sm text-slate-800 dark:text-white">{log.score}</span>
                                <span className="text-[10px] text-slate-400">/ {log.max}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentAssessments;
