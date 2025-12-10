
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Exam, Question, ExamSubmission, QuestionBankItem, ExamType } from '../../types';
import { Plus, Trash2, Calendar, Clock, CheckCircle2, List, Play, Settings, Award, Users, FileText, ChevronRight, X, Sparkles, Loader2, Image as ImageIcon, UploadCloud, AlertTriangle, Camera, Timer, Crop, Check, ScanLine, Type as TypeIcon, ScanSearch, Globe, Search, BookOpen, Zap } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    classId: string;
}

const ImageCropper: React.FC<{ imageSrc: string; onCrop: (blob: Blob) => void; onCancel: () => void }> = ({ imageSrc, onCrop, onCancel }) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [cropRect, setCropRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [startPos, setStartPos] = useState({x: 0, y: 0});
    const [isScanning, setIsScanning] = useState(true); 

    const getMousePos = (e: any) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if(!rect) return {x:0, y:0};
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleMouseDown = (e: any) => {
        const pos = getMousePos(e);
        setStartPos(pos);
        setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        setIsDrawing(true);
    };

    const handleMouseMove = (e: any) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        setCropRect({
            x: Math.min(startPos.x, pos.x),
            y: Math.min(startPos.y, pos.y),
            w: Math.abs(pos.x - startPos.x),
            h: Math.abs(pos.y - startPos.y)
        });
    };

    const handleMouseUp = () => setIsDrawing(false);

    useEffect(() => {
        if (imageSrc) {
            setIsScanning(true);
        }
    }, [imageSrc]);

    const handleImageLoad = () => {
        if(canvasRef.current && imgRef.current) {
            const aspect = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
            let w = Math.min(window.innerWidth * 0.9, 600);
            let h = w / aspect;
            canvasRef.current.width = w;
            canvasRef.current.height = h;
            setCropRect(null);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.drawImage(imgRef.current, 0, 0, w, h);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(0, 0, w, h);
            }
            setTimeout(() => setIsScanning(false), 600);
        }
    };

    useEffect(() => {
        if (!canvasRef.current || !imgRef.current || isScanning) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(imgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (cropRect && cropRect.w > 0) {
            ctx.clearRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
            ctx.drawImage(
                imgRef.current, 
                0, 0, imgRef.current.width, imgRef.current.height,
                0, 0, canvasRef.current.width, canvasRef.current.height
            );
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvasRef.current.width, cropRect.y);
            ctx.fillRect(0, cropRect.y + cropRect.h, canvasRef.current.width, canvasRef.current.height - (cropRect.y + cropRect.h));
            ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.h);
            ctx.fillRect(cropRect.x + cropRect.w, cropRect.y, canvasRef.current.width - (cropRect.x + cropRect.w), cropRect.h);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.setLineDash([6]);
            ctx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
        } else {
             ctx.font = "bold 14px sans-serif";
             ctx.fillStyle = "white";
             ctx.textAlign = "center";
             ctx.fillText("Drag to select text", canvasRef.current.width/2, canvasRef.current.height/2);
        }
    }, [cropRect, isScanning]);

    const performCrop = () => {
        if (!cropRect || !imgRef.current || cropRect.w < 10) {
            if(imgRef.current && canvasRef.current) {
                 const scaleX = imgRef.current.naturalWidth / canvasRef.current.width;
                 const scaleY = imgRef.current.naturalHeight / canvasRef.current.height;
                 setCropRect({x:0, y:0, w: canvasRef.current.width, h: canvasRef.current.height});
                 setTimeout(() => performCrop(), 100); 
                 return;
            }
            return;
        }
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas) return;
        const scaleX = img.naturalWidth / canvas.width;
        const scaleY = img.naturalHeight / canvas.height;
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropRect.w * scaleX;
        cropCanvas.height = cropRect.h * scaleY;
        const ctx = cropCanvas.getContext('2d');
        ctx?.drawImage(img, cropRect.x * scaleX, cropRect.y * scaleY, cropRect.w * scaleX, cropRect.h * scaleY, 0, 0, cropCanvas.width, cropCanvas.height);
        cropCanvas.toBlob(blob => { if(blob) onCrop(blob); }, 'image/jpeg');
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            {isScanning ? (
                <div className="flex flex-col items-center animate-fade-in-up">
                    <div className="relative mb-4"><ScanSearch className="w-16 h-16 text-green-500 animate-pulse"/><div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-ping"></div></div>
                    <h3 className="text-white font-bold text-lg tracking-widest">SCANNING PAGE...</h3>
                    <p className="text-slate-400 text-xs">Analyzing text structure</p>
                </div>
            ) : (
                <>
                    <div className="bg-slate-800 px-6 py-2 rounded-full mb-4 flex items-center gap-2 shadow-lg border border-slate-700 animate-fade-in-up">
                        <Crop className="w-4 h-4 text-green-400"/>
                        <span className="text-white text-sm font-bold">Select the area to read</span>
                    </div>
                    <div className="relative max-h-[70vh] overflow-hidden border-2 border-slate-700 rounded-lg bg-black shadow-2xl">
                        <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp} className="cursor-crosshair block touch-none"/>
                    </div>
                    <div className="flex gap-4 mt-6 w-full max-w-sm">
                        <GlassButton variant="secondary" onClick={onCancel} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">Discard</GlassButton>
                        <GlassButton onClick={performCrop} className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"><Check className="w-4 h-4 mr-2"/> {cropRect && cropRect.w > 10 ? 'Crop Selection' : 'Use Full Page'}</GlassButton>
                    </div>
                </>
            )}
            <img ref={imgRef} src={imageSrc} className="hidden" onLoad={handleImageLoad}/>
        </div>
    );
};

const ExamsTab: React.FC<Props> = ({ classId }) => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [creating, setCreating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [viewingResultId, setViewingResultId] = useState<string | null>(null);
    const [rankList, setRankList] = useState<ExamSubmission[]>([]);
    const [resultLoading, setResultLoading] = useState(false);

    // AI & Library State
    const [showAiModal, setShowAiModal] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    
    const [aiMode, setAiMode] = useState<'SCAN' | 'TOPIC'>('SCAN'); 
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiLevel, setAiLevel] = useState('From Book Only'); 
    const [aiLang, setAiLang] = useState('Malayalam');
    const [aiImages, setAiImages] = useState<string[]>([]);
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [processingImage, setProcessingImage] = useState(false);
    const [imgToCrop, setImgToCrop] = useState<string | null>(null);
    const [cooldownTime, setCooldownTime] = useState(0);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [selectedQIndices, setSelectedQIndices] = useState<number[]>([]);
    const [reviewingAi, setReviewingAi] = useState(false);

    const [title, setTitle] = useState('');
    const [examType, setExamType] = useState<ExamType>('CLASS_TEST');
    const [desc, setDesc] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState(30);
    const [settings, setSettings] = useState({ shuffleQuestions: false, showResultImmediately: true });
    const [questions, setQuestions] = useState<Question[]>([
        { id: '1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }
    ]);

    useEffect(() => { loadExams(); }, []);
    
    const handleCropSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setImgToCrop(ev.target.result as string);
                    setShowAiModal(false);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const generateAiQuestions = async () => {
        if (aiMode === 'TOPIC' && !aiTopic) return alert("Please enter a topic.");
        if (aiMode === 'SCAN' && aiImages.length === 0) return alert("Please upload at least one page.");
        
        if (!confirm("Generate Questions using AI? This will cost 5 Credits.")) return;
        
        setIsGeneratingAi(true);
        
        const deductRes = await api.deductCredits(5, "AI Question Generation");
        if (!deductRes.success) {
            setIsGeneratingAi(false);
            alert("Wallet Low! Please ask Admin to Recharge Credits.\n\n" + deductRes.message);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const model = 'gemini-2.5-flash';
            const requestCount = aiCount + 3;
            const parts: any[] = [];
            let promptText = `Generate ${requestCount} multiple choice questions. Language: ${aiLang}. Provide JSON output with 'text', 'options' (array of 4 strings), 'correctOptionIndex' (0-3 number), and 'marks' (default 1).`;
            if (aiLevel === 'From Book Only') promptText += ` STRICT INSTRUCTION: Generate questions ONLY using the text content found in the provided images.`;
            else promptText += ` The questions should be appropriate for ${aiLevel} level students.`;
            if (aiMode === 'SCAN') {
                aiImages.forEach(imgData => { parts.push({ inlineData: { mimeType: 'image/jpeg', data: imgData.split(',')[1] } }); });
                promptText += ` Analyze the images thoroughly. Focus on key facts.`;
            } else { promptText += ` The topic is: "${aiTopic}".`; }
            parts.push({ text: promptText });
            
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: parts },
                config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, correctOptionIndex: { type: Type.INTEGER }, marks: { type: Type.INTEGER } } } } }
            });
            const generatedData = JSON.parse(response.text || '[]');
            if (Array.isArray(generatedData) && generatedData.length > 0) {
                const formattedQuestions: Question[] = generatedData.map((q: any) => ({ 
                    id: Math.random().toString(36).substr(2, 9), 
                    text: q.text, 
                    options: q.options, 
                    correctOptionIndex: q.correctOptionIndex, 
                    marks: q.marks || 1 
                }));
                // Auto-append questions
                setQuestions(prev => [...prev, ...formattedQuestions]);
                setShowAiModal(false);
                setAiImages([]);
                setAiTopic('');
                alert(`${formattedQuestions.length} AI Questions Added!`);
            } else { alert("AI could not generate valid questions."); }
        } catch (error: any) {
            if (error.message && error.message.includes('429')) setCooldownTime(60);
            else alert("AI Generation failed. Please report.");
        } finally { setIsGeneratingAi(false); }
    };

    const loadExams = async () => {
        const data = await api.getExamsForClass(classId);
        setExams(data);
    };
    
    const handleCreateExam = async () => {
        if (!title || !startTime || !endTime) return alert("Please fill all details");
        setLoading(true);
        const res = await api.createExam({
            classId, title, examType, description: desc, startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(), durationMinutes: duration, questions, settings
        });
        setLoading(false);
        if (res.success) {
            setCreating(false); loadExams(); setTitle(''); setQuestions([{ id: '1', text: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }]);
        } else {
            alert(res.message);
        }
    };

    if (creating) {
        return (
            <div className="max-w-3xl mx-auto animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl dark:text-white">Create Exam</h3>
                    <GlassButton variant="secondary" onClick={() => setCreating(false)}>Cancel</GlassButton>
                </div>
                
                <GlassCard className="mb-6 border-t-4 border-t-blue-600">
                     <GlassInput placeholder="Exam Title" value={title} onChange={e => setTitle(e.target.value)} />
                     <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Start Time</label>
                            <GlassInput type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                        </div>
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">End Time</label>
                            <GlassInput type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
                        </div>
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">Duration (Mins)</label>
                            <GlassInput type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} />
                        </div>
                     </div>
                </GlassCard>

                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Questions ({questions.length})</h4>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAiModal(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                            <Sparkles className="w-4 h-4 text-yellow-300"/> AI Generator <span className="bg-white/20 px-1 rounded text-[9px]">5 Credits</span>
                        </button>
                    </div>
                </div>
                
                <div className="space-y-4 mb-6">
                    {questions.map((q, qIdx) => (
                        <GlassCard key={q.id} className="relative">
                            <button onClick={() => {const up = [...questions]; up.splice(qIdx,1); setQuestions(up);}} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                            <label className="text-xs font-bold text-slate-400 mb-1 block">Question {qIdx+1}</label>
                            <GlassInput className="mb-3 font-bold" value={q.text} onChange={e => {
                                const up = [...questions]; up[qIdx].text = e.target.value; setQuestions(up);
                            }} placeholder="Question Text"/>
                            <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="flex gap-2 items-center">
                                        <input 
                                            type="radio" 
                                            name={`q-${q.id}`} 
                                            checked={q.correctOptionIndex === oIdx} 
                                            onChange={() => {
                                                const up = [...questions]; up[qIdx].correctOptionIndex = oIdx; setQuestions(up);
                                            }}
                                            className="w-4 h-4 accent-green-600 cursor-pointer"
                                        />
                                        <GlassInput className="text-sm h-9" value={opt} onChange={e => {
                                            const up = [...questions]; up[qIdx].options[oIdx] = e.target.value; setQuestions(up);
                                        }} placeholder={`Option ${oIdx+1}`}/>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    ))}
                </div>

                <div className="flex gap-4 sticky bottom-4 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur p-2 rounded-2xl border shadow-xl">
                    <button onClick={() => setQuestions([...questions, {id: Date.now().toString(), text:'', options:['','','',''], correctOptionIndex:0, marks:1}])} className="flex-1 py-3 border-2 border-dashed rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Add Question</button>
                    <GlassButton onClick={handleCreateExam} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30">{loading ? 'Saving...' : 'Save Exam'}</GlassButton>
                </div>

                {/* AI MODAL with Credit Warning */}
                {showAiModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                        <GlassCard className="max-w-md w-full">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500"/> AI Question Generator</h3>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4 flex items-center gap-3">
                                <Zap className="w-5 h-5 text-yellow-600 fill-yellow-600"/>
                                <div>
                                    <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200">Costs 5 Credits</p>
                                    <p className="text-[10px] text-yellow-700 dark:text-yellow-300">Wallet balance is separate from student results.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                    <button onClick={() => setAiMode('SCAN')} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${aiMode === 'SCAN' ? 'bg-white dark:bg-slate-800 shadow text-blue-600' : 'text-slate-500'}`}>Scan Page</button>
                                    <button onClick={() => setAiMode('TOPIC')} className={`flex-1 py-2 text-xs font-bold rounded transition-all ${aiMode === 'TOPIC' ? 'bg-white dark:bg-slate-800 shadow text-blue-600' : 'text-slate-500'}`}>Topic</button>
                                </div>
                                
                                {aiMode === 'TOPIC' && <GlassInput placeholder="Enter Topic (e.g. Photosynthesis)" value={aiTopic} onChange={e => setAiTopic(e.target.value)} />}
                                
                                {aiMode === 'SCAN' && (
                                    <div className="space-y-2">
                                        <label className="block p-4 border-2 border-dashed rounded-xl text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                            <Camera className="mx-auto h-8 w-8 text-slate-400 mb-2"/>
                                            <span className="text-xs text-slate-500 font-bold block">Take Photo / Upload</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleCropSelect}/>
                                        </label>
                                        {aiImages.length > 0 && <p className="text-center text-xs text-green-500 font-bold">{aiImages.length} images scanned</p>}
                                    </div>
                                )}
                                
                                <GlassButton onClick={generateAiQuestions} disabled={isGeneratingAi} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl">
                                    {isGeneratingAi ? 'Analyzing & Generating...' : `Generate (5 Credits)`}
                                </GlassButton>
                                <button onClick={() => setShowAiModal(false)} className="w-full text-xs text-slate-500 mt-2 hover:text-slate-700">Cancel</button>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* Image Cropper Overlay */}
                {imgToCrop && (
                    <ImageCropper 
                        imageSrc={imgToCrop} 
                        onCancel={() => { setImgToCrop(null); setShowAiModal(true); }}
                        onCrop={(blob) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(blob);
                            reader.onloadend = () => {
                                if (reader.result) {
                                    setAiImages(prev => [...prev, reader.result as string]);
                                    setImgToCrop(null);
                                    setShowAiModal(true);
                                }
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-xl dark:text-white">Exams</h3>
                <GlassButton onClick={() => setCreating(true)} className="flex items-center gap-2"><Plus className="w-4 h-4"/> New Exam</GlassButton>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                {exams.map(e => (
                    <GlassCard key={e.id} className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><FileText className="w-16 h-16"/></div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white">{e.title}</h4>
                        <p className="text-xs text-slate-500 mb-3">{e.questions.length} Questions • {e.durationMinutes} Mins</p>
                        <div className="flex gap-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500`}>
                                {new Date(e.startTime) > new Date() ? 'Scheduled' : new Date(e.endTime) < new Date() ? 'Ended' : 'Live'}
                            </span>
                        </div>
                    </GlassCard>
                ))}
                {exams.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">No exams created yet.</div>}
            </div>
        </div>
    );
};

export default ExamsTab;
