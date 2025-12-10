
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton } from '../../components/GlassUI';
import { api } from '../../services/api';
import { QuestionBankItem } from '../../types';
import { CheckCircle2, XCircle, FileText, School, RefreshCw } from 'lucide-react';

const ContentTab: React.FC = () => {
    const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await api.getPendingQuestions();
        setQuestions(data);
        setLoading(false);
    };

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        await api.moderateQuestion(id, action);
        loadData();
    };

    if (loading) return <div>Loading Moderation Queue...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-purple-400"/> Content Moderation
                </h2>
                <button onClick={loadData} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><RefreshCw className="w-4 h-4 text-white"/></button>
            </div>

            <GlassCard className="bg-slate-900 border-slate-800 p-0 overflow-hidden">
                <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between">
                    <span className="text-sm font-bold text-white">Pending Questions ({questions.length})</span>
                </div>
                <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
                    {questions.length === 0 && <p className="text-center text-slate-500 py-10">No pending contributions.</p>}
                    {questions.map(q => (
                        <div key={q.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex gap-2 mb-1">
                                        <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50">{q.subject}</span>
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{q.topic}</span>
                                    </div>
                                    <p className="font-bold text-white text-sm mb-2">{q.text}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-2">
                                        {q.options.map((o, i) => (
                                            <span key={i} className={i === q.correctOptionIndex ? 'text-green-400 font-bold' : ''}>
                                                {i+1}. {o}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-600 flex items-center gap-1">
                                        <School className="w-3 h-3"/> Contributed by: {q.contributedBy}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAction(q.id, 'APPROVE')} className="p-2 bg-green-900/20 text-green-500 hover:bg-green-900/40 rounded-lg transition-colors">
                                        <CheckCircle2 className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => handleAction(q.id, 'REJECT')} className="p-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-lg transition-colors">
                                        <XCircle className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};

export default ContentTab;
