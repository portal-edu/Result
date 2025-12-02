
import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { Search, Share2, Download, Award, GraduationCap, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';
import { Marks, Student } from '../types';
import { useNavigate } from 'react-router-dom';

const PublicResult: React.FC = () => {
    const navigate = useNavigate();
    const [regNo, setRegNo] = useState('');
    const [dob, setDob] = useState('');
    const [result, setResult] = useState<{ student: Student, marks: Marks } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        const data = await api.publicSearch(regNo, dob);
        setLoading(false);
        
        if (data) {
            setResult(data as any);
        } else {
            setError('Result not found. Please check Register Number and DOB.');
        }
    };

    return (
        <div className="flex flex-col items-center pt-8 md:pt-16 pb-20 px-4">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-center tracking-tight print:hidden">Result Portal</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-center text-sm print:hidden">Enter your details to view your academic performance</p>

            {!result ? (
                <GlassCard className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700 animate-fade-in-up">
                    <form onSubmit={handleSearch} className="space-y-5">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                                <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Student Search</h2>
                        </div>
                        <div>
                            <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Register Number</label>
                            <GlassInput 
                                placeholder="e.g. 1001" 
                                value={regNo} 
                                onChange={(e) => setRegNo(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Date of Birth</label>
                            <GlassInput 
                                type="date" 
                                value={dob} 
                                onChange={(e) => setDob(e.target.value)}
                                required
                            />
                        </div>
                        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center border border-red-100 dark:border-red-800 flex items-center justify-center gap-2">
                             <span className="font-bold">Error:</span> {error}
                        </div>}
                        <GlassButton type="submit" className="w-full flex justify-center items-center gap-2" disabled={loading}>
                             {loading ? 'Searching...' : 'Get Result'}
                        </GlassButton>
                    </form>
                </GlassCard>
            ) : (
                <div className="w-full max-w-lg animate-fade-in-up">
                    <GlassCard className="relative overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl print:shadow-none print:border-none">
                        {/* Header Border */}
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-purple-600 print:hidden"></div>

                        <div className="text-center mb-8 mt-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-inner">
                                <Award className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{result.student.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full">Reg No: {result.student.regNo}</p>
                            
                            <div className="mt-4 flex justify-center">
                                <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-bold border shadow-sm ${
                                    result.marks.grade === 'F' 
                                    ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' 
                                    : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                                }`}>
                                    Overall Grade: {result.marks.grade}
                                </span>
                            </div>
                        </div>

                        <div className="mb-8 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                             <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                 <div className="pl-2">Subject</div>
                                 <div className="text-right pr-2">Marks Secured</div>
                             </div>
                            {Object.entries(result.marks.subjects).map(([subject, mark], idx) => (
                                <div key={subject} className={`flex justify-between items-center p-3.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{subject}</span>
                                    <span className="text-slate-900 dark:text-white font-bold font-mono">{mark}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700 font-bold border-t border-slate-200 dark:border-slate-600">
                                <span className="text-slate-700 dark:text-slate-300">Grand Total</span>
                                <span className="text-slate-900 dark:text-white text-lg">{result.marks.total}</span>
                            </div>
                        </div>

                        <div className="flex gap-4 print:hidden">
                            <GlassButton variant="secondary" className="flex-1 flex justify-center items-center gap-2" onClick={() => setResult(null)}>
                                <ChevronLeft className="w-4 h-4" /> Back
                            </GlassButton>
                            {/* <GlassButton variant="secondary" className="flex-1 flex justify-center items-center gap-2">
                                <Share2 className="w-4 h-4" /> Share
                            </GlassButton> */}
                             <GlassButton className="flex-1 flex justify-center items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none" onClick={() => window.print()}>
                                <Download className="w-4 h-4" /> Print
                            </GlassButton>
                        </div>
                        
                        {/* Viral Loop / Branding */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center print:block hidden">
                            <p className="text-xs text-slate-400 mb-1">Generated by SchoolResult Pro</p>
                        </div>
                         <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 text-center print:hidden bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Powered by</p>
                            <button onClick={() => navigate('/')} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center gap-2 mx-auto transition-colors">
                                <GraduationCap className="w-4 h-4" /> SchoolResult Pro
                            </button>
                            <p className="text-[10px] text-slate-400 mt-1">Create your own school result portal for free</p>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default PublicResult;
