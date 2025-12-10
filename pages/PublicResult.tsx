
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { Search, Download, Award, GraduationCap, ChevronLeft, MessageCircle, Volume2, Sparkles, TrendingUp, BrainCircuit, Lock, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../services/api';
import { Marks, Student, SchoolConfig } from '../types';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";

const PublicResult: React.FC = () => {
    const navigate = useNavigate();
    const [regNo, setRegNo] = useState('');
    const [dob, setDob] = useState('');
    const [result, setResult] = useState<{ student: Student, marks: Marks, schoolConfig: SchoolConfig } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasContext, setHasContext] = useState(true);
    const [currentSchoolId, setCurrentSchoolId] = useState('');
    
    // AI Feature State
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [aiRemark, setAiRemark] = useState('');
    const [prediction, setPrediction] = useState<{strength: string, weakness: string, projected: number, tip?: string} | null>(null);
    const [loadingAi, setLoadingAi] = useState(false);

    // Context Check on Mount
    useEffect(() => {
        const schoolId = localStorage.getItem('school_id');
        if (!schoolId) {
            setHasContext(false);
        } else {
            setCurrentSchoolId(schoolId);
        }
    }, []);

    // Dynamic Title for SEO
    useEffect(() => {
        if (result) {
            document.title = `Result: ${result.student.name} | ${result.schoolConfig.schoolName}`;
        } else {
            document.title = "Check Results | SchoolResult Pro";
        }
    }, [result]);

    // AI Generation Logic
    useEffect(() => {
        if (result) {
            generateInsights();
        }
    }, [result]);

    const generateInsights = async () => {
        // 1. Set Fallbacks (Algorithmic)
        const algoRemark = getAlgorithmicRemark();
        setAiRemark(algoRemark);
        setPrediction(getAlgorithmicPrediction());

        // 2. Try AI if enabled and key exists
        if (!process.env.API_KEY) return;
        const { enableAiRemarks, enableAiPrediction } = result?.schoolConfig || {};
        
        if (enableAiRemarks || enableAiPrediction) {
            setLoadingAi(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const model = 'gemini-2.5-flash';
                const marksStr = Object.entries(result?.marks.subjects || {}).map(([k,v]) => `${k}: ${v}`).join(', ');
                const total = result?.marks.total;
                
                if (enableAiRemarks) {
                    const resp = await ai.models.generateContent({
                        model,
                        contents: `Student: ${result?.student.name}. Marks: ${marksStr}. Total: ${total}. 
                        Write a short, specific, encouraging remark (max 15 words) for the result page. Address the student directly.`
                    });
                    if (resp.text) setAiRemark(resp.text.replace(/^"|"$/g, '').trim());
                }

                if (enableAiPrediction) {
                    const resp = await ai.models.generateContent({
                        model,
                        contents: `Analyze marks: ${marksStr}. Total: ${total}.
                        Identify strongest subject, weakest subject, predict next term total (assuming 5-10% improvement), and give one short study tip (max 10 words).`,
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    strength: { type: Type.STRING },
                                    weakness: { type: Type.STRING },
                                    projected: { type: Type.NUMBER },
                                    tip: { type: Type.STRING }
                                }
                            }
                        }
                    });
                    const json = JSON.parse(resp.text || '{}');
                    if (json.strength) setPrediction(json);
                }
            } catch (e) {
                console.error("AI Gen Failed", e);
            } finally {
                setLoadingAi(false);
            }
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        setAiRemark('');
        setPrediction(null);

        const schoolId = localStorage.getItem('school_id');
        if (!schoolId) {
            setError("Invalid School Link. Please use the official link provided by your school.");
            setLoading(false);
            return;
        }

        const data = await api.publicSearch(regNo, dob, schoolId);
        
        if (data) {
             // Fetch School Config for Result Type
             const config = await api.getSchoolConfig();
             setResult({ ...data, schoolConfig: config } as any);
        } else {
            setError('Result not found. Please check Register Number and DOB.');
        }
        setLoading(false);
    };

    const handleWhatsAppShare = () => {
        if (!result) return;
        
        const isPass = result.marks.resultStatus === 'PASS' || result.marks.grade !== 'F';
        const statusEmoji = isPass ? '🏆' : '📚';
        const statusText = isPass ? 'PASSED' : 'CHECKED';
        
        // VIRAL LOOP TEXT
        const viralFooter = `\n\n⚡ *Checked via ResultMate*`;
        const text = `*${result.schoolConfig.schoolName}*\n\n${statusEmoji} *RESULT DECLARED* ${statusEmoji}\n\n👤 Name: *${result.student.name}*\n🎓 Status: *${statusText}*\n📊 Total: *${result.marks.total}*\n\n👇 *View Full Marklist:*\n${window.location.href}${viralFooter}`;
        
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // --- ALGORITHMIC FALLBACKS ---
    const getAlgorithmicRemark = () => {
        if (!result) return '';
        const grade = result.marks.grade;
        if (grade === 'A+' || grade === 'O') return "Outstanding performance! You are a star.";
        if (grade === 'A') return "Excellent work! Keep aiming high.";
        if (grade === 'B+') return "Very Good! You have great potential.";
        if (grade === 'B') return "Good effort. A little more focus can take you to the top.";
        if (grade === 'C+' || grade === 'C') return "You passed! Try to focus more on core subjects next time.";
        if (grade === 'D') return "Just made it. Let's work harder for the next exam.";
        if (grade === 'F') return "Don't give up! This is just a stepping stone. Learn from this and bounce back stronger.";
        return "Result Published.";
    };

    const getAlgorithmicPrediction = () => {
        if (!result) return null;
        let maxSub = { name: '', val: -1 };
        let minSub = { name: '', val: 1000 };
        
        Object.entries(result.marks.subjects).forEach(([name, val]) => {
            const num = typeof val === 'number' ? val : 0;
            if (num > maxSub.val) maxSub = { name, val: num };
            if (num < minSub.val && num > 0) minSub = { name, val: num };
        });

        const projectedTotal = Math.floor(Number(result.marks.total) * 1.05);

        return {
            strength: maxSub.name,
            weakness: minSub.name,
            projected: projectedTotal,
            tip: 'Focus on weak subjects daily.'
        };
    };

    const handleVoiceResult = () => {
        if (!result) return;
        
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const isPass = result.marks.resultStatus === 'PASS' || result.marks.grade !== 'F';
        const text = `Hello ${result.student.name}. Here is your result from ${result.schoolConfig.schoolName}. You have ${isPass ? 'Passed' : 'Completed'} the exam with Total Marks ${result.marks.total}. ${aiRemark}`;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    // --- VIRAL LOOP NAVIGATION ---
    const handleCreateOwn = () => {
        // Appends current school ID as Referrer, and 'RESULT_PAGE' as source
        navigate(`/setup?ref=${currentSchoolId}&source=RESULT_PAGE`);
    };

    if (!hasContext) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] pt-16 px-4 text-center">
                 <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                     <Lock className="w-10 h-10 text-slate-400"/>
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Private Result Portal</h2>
                 <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                     This page is restricted to verified students of a specific school.
                     Please open the <b>official result link</b> provided by your Class Teacher or School Admin.
                 </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center pt-8 md:pt-16 pb-20 px-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
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
                <div className="w-full max-w-lg animate-fade-in-up relative">
                    
                    {/* CERTIFICATE STYLE CARD */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl print:shadow-none border-[10px] border-double border-slate-200 dark:border-slate-700 p-1">
                        
                        <div className="border-2 border-slate-300 dark:border-slate-600 rounded-lg p-6 md:p-8 relative">
                            
                            {/* Decorations */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-600 dark:border-blue-500 rounded-tl-lg print:border-black"></div>
                            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-600 dark:border-blue-500 rounded-tr-lg print:border-black"></div>
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-600 dark:border-blue-500 rounded-bl-lg print:border-black"></div>
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-600 dark:border-blue-500 rounded-br-lg print:border-black"></div>

                            {/* Header */}
                            <div className="text-center mb-8 relative z-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800">
                                    <Award className="w-8 h-8 text-white" />
                                </div>
                                
                                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400 mb-2">Statement of Marks</h3>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight leading-none">{result.schoolConfig.schoolName}</h2>
                                {result.schoolConfig?.examName && (
                                    <div className="inline-block bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 mt-2">
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{result.schoolConfig.examName}</p>
                                    </div>
                                )}
                            </div>

                            {/* Student Info */}
                            <div className="flex flex-col items-center mb-8">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b-2 border-slate-100 dark:border-slate-700 pb-1 mb-1">{result.student.name}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Reg No: <b>{result.student.regNo}</b></p>
                            </div>

                            {/* Status Badge */}
                            <div className="flex justify-center mb-8">
                                <div className={`px-8 py-3 rounded-xl border-2 shadow-sm flex flex-col items-center ${
                                    result.marks.grade === 'F' || result.marks.resultStatus === 'FAILED'
                                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' 
                                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                }`}>
                                    <span className="text-[10px] font-bold uppercase opacity-70 tracking-wider mb-1">Result Status</span>
                                    <span className="text-2xl font-black tracking-widest">
                                        {result.marks.grade === 'F' || result.marks.resultStatus === 'FAILED' ? 'FAILED' : 'PASSED'}
                                    </span>
                                </div>
                            </div>

                            {/* Marks Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-8">
                                <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800 p-2 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
                                    <div className="pl-2">Subject</div>
                                    <div className="text-right pr-2">Marks obtained</div>
                                </div>
                                {Object.entries(result.marks.subjects).map(([subject, mark], idx) => (
                                    <div key={subject} className={`flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                        <span className="text-slate-700 dark:text-slate-300 font-bold text-sm pl-2">{subject}</span>
                                        <span className="text-slate-900 dark:text-white font-bold font-mono pr-2">{mark}</span>
                                    </div>
                                ))}
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-800 dark:text-white font-black text-sm uppercase pl-2">Total</span>
                                    <span className="text-slate-900 dark:text-white font-black text-lg pr-2">{result.marks.total}</span>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="space-y-4 print:hidden">
                                
                                {(aiRemark || prediction) && (
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800 relative overflow-hidden">
                                        {loadingAi && <div className="absolute top-2 right-2"><Sparkles className="w-4 h-4 text-purple-400 animate-spin"/></div>}
                                        
                                        {aiRemark && (
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-1 text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase tracking-wider">
                                                    <Sparkles className="w-3 h-3" /> AI Remark
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300 text-sm italic font-medium leading-relaxed">"{aiRemark}"</p>
                                            </div>
                                        )}

                                        {prediction && (
                                            <div className="grid grid-cols-2 gap-3 border-t border-purple-200 dark:border-purple-800 pt-3">
                                                <div>
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Strongest</p>
                                                    <p className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3 text-green-500"/> {prediction.strength}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Focus On</p>
                                                    <p className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1"><BrainCircuit className="w-3 h-3 text-orange-500"/> {prediction.weakness}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <GlassButton onClick={() => window.print()} variant="secondary" className="flex-1 flex justify-center items-center gap-2 text-xs">
                                        <Download className="w-4 h-4"/> Download
                                    </GlassButton>
                                    <GlassButton onClick={handleWhatsAppShare} className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-none border-none text-xs">
                                        <MessageCircle className="w-4 h-4"/> Share
                                    </GlassButton>
                                </div>
                                
                                {result.schoolConfig?.enableAiVoice && (
                                    <button onClick={handleVoiceResult} className="w-full py-2 text-xs text-slate-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-1">
                                        <Volume2 className={`w-3 h-3 ${isSpeaking ? 'animate-pulse text-blue-500' : ''}`}/> {isSpeaking ? 'Stop Reading' : 'Listen to Result'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => { setResult(null); setRegNo(''); setDob(''); }} className="mt-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 mx-auto text-sm font-bold transition-colors print:hidden">
                        <ChevronLeft className="w-4 h-4"/> Check Another Result
                    </button>

                    {/* VIRAL LOOP FOOTER (ATTRIBUTION) */}
                    <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center print:hidden">
                        <p className="text-xs text-slate-500 mb-3">Want a Result Portal for your School?</p>
                        <button 
                            onClick={handleCreateOwn}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
                        >
                            <Zap className="w-3 h-3 fill-current"/> Powered by ResultMate - Create Yours
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicResult;
