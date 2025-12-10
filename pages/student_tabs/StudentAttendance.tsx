
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Student } from '../../types';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
    user: Student;
}

const StudentAttendance: React.FC<Props> = ({ user }) => {
    const [daily, setDaily] = useState<any[]>([]);
    const [summary, setSummary] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        const stats = await api.getStudentAttendanceStats(user.id);
        setDaily(stats.dailyStats);
        setSummary(stats.summaryStats);
        setLoading(false);
    };

    if (loading) return <div className="text-center py-10 text-slate-400">Loading Attendance...</div>;

    const overallPresent = daily.filter(d => d.status === 'PRESENT').length;
    const overallTotal = daily.length;
    const dailyPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Overall Stats (Prioritize Term Summary if available, else Daily) */}
            <div className="grid grid-cols-2 gap-4">
                <GlassCard className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-none">
                    <p className="text-xs font-bold opacity-80 uppercase mb-1">Attendance</p>
                    <h3 className="text-4xl font-black">
                        {summary.length > 0 ? summary[0].percentage : dailyPercentage}%
                    </h3>
                    <p className="text-[10px] mt-2 bg-white/20 inline-block px-2 py-0.5 rounded">
                        {summary.length > 0 ? summary[0].term : 'Overall'}
                    </p>
                </GlassCard>
                <GlassCard className="bg-white dark:bg-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Days Present</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white">
                        {summary.length > 0 ? summary[0].presentDays : overallPresent}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Out of {summary.length > 0 ? summary[0].workingDays : overallTotal} working days
                    </p>
                </GlassCard>
            </div>

            {/* Daily Log */}
            {daily.length > 0 && (
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500"/> Recent Activity
                    </h3>
                    <div className="space-y-2">
                        {daily.slice(0, 10).map((log: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(log.date).toLocaleDateString()}</span>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${log.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {log.status === 'PRESENT' ? <CheckCircle2 className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Term Summary List */}
            {summary.length > 0 && (
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-3 mt-6">Term History</h3>
                    <div className="space-y-2">
                        {summary.map((term: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{term.term}</span>
                                <div className="text-right">
                                    <span className="block text-sm font-black text-purple-600">{term.percentage}%</span>
                                    <span className="text-[10px] text-slate-400">{term.presentDays}/{term.workingDays} Days</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {daily.length === 0 && summary.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                    <p className="text-slate-400 text-sm">No attendance records found.</p>
                </div>
            )}
        </div>
    );
};

export default StudentAttendance;
