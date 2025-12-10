
import React from 'react';
import { GlassCard, GlassButton } from '../../components/GlassUI';
import { ClassData } from '../../types';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
    classes: ClassData[];
    onRefresh: () => void;
}

const PrincipalApproval: React.FC<Props> = ({ classes, onRefresh }) => {
    const pendingClasses = classes.filter(c => c.submissionStatus === 'SUBMITTED');

    const handleAction = async (classId: string, action: 'APPROVE' | 'REJECT') => {
        if (action === 'REJECT' && !confirm("Reject these results? Teacher will have to resubmit.")) return;
        
        // Use custom update function or update status directly
        // For simplicity, we are reusing 'toggleClassSubmission' but logically we need an 'approveClassResult' API
        // Assuming we map 'APPROVED' status in the backend or update logic.
        // Since we don't have a specific 'approveClass' in api.ts yet, let's simulate or add it.
        // We will add `updateClassStatus` to api in next step or reuse update logic.
        
        // Temporary: Using raw update via supabase client logic abstraction if available, or just generic update.
        // We'll assume a generic update function exists or we add it. 
        // Let's assume we added `updateClassStatus` in `services/modules/classes.ts`.
        
        const status = action === 'APPROVE' ? 'APPROVED' : 'DRAFT';
        // Mocking API call for now, ensure to implement in backend
        const res = await api.updateClassStatus(classId, status); 
        
        if (res.success) {
            alert(action === 'APPROVE' ? "Results Approved & Published!" : "Results Returned to Teacher.");
            onRefresh();
        } else {
            alert("Action failed.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h3 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-orange-500"/> Pending Approval ({pendingClasses.length})
            </h3>

            {pendingClasses.length === 0 && (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-slate-400 font-bold">No results waiting for approval.</p>
                    <p className="text-xs text-slate-500 mt-1">When teachers submit marks, they will appear here.</p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {pendingClasses.map(cls => (
                    <GlassCard key={cls.id} className="border-l-4 border-l-orange-500">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-lg text-slate-800 dark:text-white">{cls.name}</h4>
                                <p className="text-xs text-slate-500">{cls.teacherName}</p>
                            </div>
                            <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-[10px] font-bold">
                                WAITING
                            </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300 mb-4">
                            <div className="flex justify-between mb-1">
                                <span>Total Students:</span>
                                <span className="font-bold">{cls.studentCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Subjects:</span>
                                <span className="font-bold">{cls.subjects.length}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <GlassButton onClick={() => handleAction(cls.id, 'APPROVE')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs">
                                Approve
                            </GlassButton>
                            <GlassButton onClick={() => handleAction(cls.id, 'REJECT')} variant="secondary" className="flex-1 text-red-500 hover:bg-red-50 text-xs">
                                Reject
                            </GlassButton>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};

export default PrincipalApproval;
