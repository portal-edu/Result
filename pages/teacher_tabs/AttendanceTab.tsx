
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Student, AttendanceRecord } from '../../types';
import { Calendar, Save, CheckCircle2, XCircle, Clock, AlertTriangle, List, ToggleLeft } from 'lucide-react';

interface Props {
    students: Student[];
    classId: string;
}

const AttendanceTab: React.FC<Props> = ({ students, classId }) => {
    const [mode, setMode] = useState<'DAILY' | 'SUMMARY'>('DAILY');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTerm, setSelectedTerm] = useState('Term 1');
    const [attendanceData, setAttendanceData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Summary Mode Inputs
    const [totalWorkingDays, setTotalWorkingDays] = useState(50);

    useEffect(() => {
        loadAttendance();
    }, [mode, selectedDate, selectedTerm]);

    const loadAttendance = async () => {
        setLoading(true);
        const newData: Record<string, any> = {};
        
        if (mode === 'DAILY') {
            const records = await api.getAttendanceByDate(classId, selectedDate);
            records.forEach(r => { newData[r.studentId] = r.status; });
            // Default everyone to PRESENT if no record
            students.forEach(s => { if (!newData[s.id]) newData[s.id] = 'PRESENT'; });
        } else {
            const records = await api.getAttendanceByTerm(classId, selectedTerm);
            records.forEach(r => { 
                newData[r.studentId] = { present: r.presentDays, total: r.workingDays };
                if (r.workingDays) setTotalWorkingDays(r.workingDays); // Sync total days
            });
            // Default 0 if no record
            students.forEach(s => { if (!newData[s.id]) newData[s.id] = { present: 0, total: totalWorkingDays }; });
        }
        
        setAttendanceData(newData);
        setLoading(false);
    };

    const handleStatusToggle = (studentId: string) => {
        setAttendanceData(prev => {
            const current = prev[studentId];
            const next = current === 'PRESENT' ? 'ABSENT' : current === 'ABSENT' ? 'LATE' : 'PRESENT';
            return { ...prev, [studentId]: next };
        });
    };

    const handleSummaryChange = (studentId: string, val: string) => {
        const num = parseInt(val) || 0;
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { present: num, total: totalWorkingDays }
        }));
    };

    const saveDaily = async () => {
        setSaving(true);
        const records: AttendanceRecord[] = students.map(s => ({
            studentId: s.id,
            classId,
            date: selectedDate,
            status: attendanceData[s.id],
            type: 'DAILY'
        }));
        const res = await api.markDailyAttendance(records);
        setSaving(false);
        if (res.success) alert("Daily Attendance Saved!");
        else alert("Failed to save.");
    };

    const saveSummary = async () => {
        setSaving(true);
        const records: AttendanceRecord[] = students.map(s => ({
            studentId: s.id,
            classId,
            term: selectedTerm,
            workingDays: totalWorkingDays,
            presentDays: attendanceData[s.id]?.present || 0,
            status: 'PRESENT', // Placeholder
            type: 'SUMMARY'
        }));
        const res = await api.saveSummaryAttendance(records);
        setSaving(false);
        if (res.success) alert("Term Attendance Saved!");
        else alert("Failed to save.");
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 gap-4">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setMode('DAILY')}
                        className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${mode === 'DAILY' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
                    >
                        <Calendar className="w-4 h-4"/> Daily Tracker
                    </button>
                    <button 
                        onClick={() => setMode('SUMMARY')}
                        className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${mode === 'SUMMARY' ? 'bg-white dark:bg-slate-800 shadow text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}
                    >
                        <List className="w-4 h-4"/> Term Summary
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {mode === 'DAILY' ? (
                        <GlassInput type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="font-bold text-sm"/>
                    ) : (
                        <>
                            <GlassSelect value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="w-32 text-sm py-2">
                                <option>Term 1</option>
                                <option>Term 2</option>
                                <option>Finals</option>
                            </GlassSelect>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Total Days:</span>
                                <input type="number" className="w-12 bg-transparent text-sm font-bold text-center outline-none" value={totalWorkingDays} onChange={e => setTotalWorkingDays(parseInt(e.target.value) || 0)} />
                            </div>
                        </>
                    )}
                    <GlassButton onClick={mode === 'DAILY' ? saveDaily : saveSummary} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
                        {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save</>}
                    </GlassButton>
                </div>
            </div>

            {/* List Area */}
            <GlassCard className="p-0 overflow-hidden min-h-[400px]">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4 w-16 text-center">Roll</th>
                            <th className="p-4">Student Name</th>
                            <th className="p-4 text-center">Status / Days Present</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {students.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 text-center text-slate-500 font-mono">{s.rollNo || '-'}</td>
                                <td className="p-4 font-bold text-slate-700 dark:text-slate-200">{s.name}</td>
                                <td className="p-4 text-center">
                                    {loading ? (
                                        <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse mx-auto"></div>
                                    ) : mode === 'DAILY' ? (
                                        <button 
                                            onClick={() => handleStatusToggle(s.id)}
                                            className={`w-32 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                                attendanceData[s.id] === 'PRESENT' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                attendanceData[s.id] === 'ABSENT' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                'bg-yellow-100 text-yellow-700 border border-yellow-200'
                                            }`}
                                        >
                                            {attendanceData[s.id] === 'PRESENT' && <CheckCircle2 className="w-4 h-4"/>}
                                            {attendanceData[s.id] === 'ABSENT' && <XCircle className="w-4 h-4"/>}
                                            {attendanceData[s.id] === 'LATE' && <Clock className="w-4 h-4"/>}
                                            {attendanceData[s.id] || 'PRESENT'}
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    className="w-16 p-2 text-center font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    value={attendanceData[s.id]?.present || 0}
                                                    onChange={e => handleSummaryChange(s.id, e.target.value)}
                                                />
                                            </div>
                                            <span className="text-slate-400 text-xs">/ {totalWorkingDays}</span>
                                            <span className={`text-xs font-bold ml-2 ${(attendanceData[s.id]?.present / totalWorkingDays) < 0.75 ? 'text-red-500' : 'text-green-500'}`}>
                                                {totalWorkingDays > 0 ? Math.round((attendanceData[s.id]?.present / totalWorkingDays) * 100) : 0}%
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </div>
    );
};

export default AttendanceTab;
