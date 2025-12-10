
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { X, Megaphone, Rocket, UserPlus, Globe, Share2, Link as LinkIcon, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { parseCSVLine } from '../../services/utils';
import { api } from '../../services/api';
import { CustomFieldDef } from '../../types';

export const NoticeModal: React.FC<{
    onClose: () => void;
    data: any;
    setData: (d: any) => void;
    scheduleTime: string;
    setScheduleTime: (t: string) => void;
    onSubmit: () => void;
    loading: boolean;
}> = ({ onClose, data, setData, scheduleTime, setScheduleTime, onSubmit, loading }) => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
        <GlassCard className="w-full max-w-md border-t-4 border-t-slate-900 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center shrink-0">
                    <Megaphone className="w-6 h-6 text-slate-900 dark:text-white"/>
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Post Notice</h3>
                    <p className="text-xs text-zinc-500">Broadcast to campus</p>
                </div>
            </div>
            <div className="space-y-4">
                <GlassInput placeholder="Title (Optional)" value={data.title} onChange={(e:any) => setData({...data, title: e.target.value})} />
                <textarea className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 text-sm h-32 resize-none outline-none focus:ring-2 focus:ring-slate-900" placeholder="Message content..." value={data.message} onChange={(e:any) => setData({...data, message: e.target.value})}></textarea>
                <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Schedule (Optional)</label>
                    <GlassInput type="datetime-local" value={scheduleTime} onChange={(e:any) => setScheduleTime(e.target.value)} />
                </div>
                <GlassButton onClick={onSubmit} className="w-full bg-slate-900 text-white hover:bg-slate-800">{scheduleTime ? 'Schedule Post' : 'Post Now'}</GlassButton>
            </div>
        </GlassCard>
    </div>
);

export const PublishModal: React.FC<{
    onClose: () => void;
    date: string;
    setDate: (d: string) => void;
    onSubmit: () => void;
    loading: boolean;
}> = ({ onClose, date, setDate, onSubmit, loading }) => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
        <GlassCard className="max-w-md w-full relative border-t-4 border-emerald-600">
            <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
                    <Rocket className="w-8 h-8 text-emerald-600"/>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Publish Results</h2>
                <p className="text-zinc-500 text-sm">Make marks visible to public.</p>
            </div>
            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Schedule Date (Optional)</label>
                    <GlassInput type="datetime-local" value={date} onChange={(e:any) => setDate(e.target.value)} />
                    <p className="text-[10px] text-zinc-400 mt-1">Leave empty for immediate release.</p>
                </div>
            </div>
            <GlassButton onClick={onSubmit} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
                {loading ? 'Processing...' : (date ? 'Schedule Publish' : 'Publish Now')}
            </GlassButton>
        </GlassCard>
    </div>
);

export const StudentEntryModal: React.FC<{
    onClose: () => void;
    mode: string;
    setMode: (m: any) => void;
    classId: string;
    setClassId: (id: string) => void;
    classes: any[];
    newStudent: any;
    setNewStudent: (s: any) => void;
    onSubmit: (e: any) => void;
    onCsv: () => void;
    setCsv: (f: File | null) => void;
    loading: boolean;
    saved: boolean;
    schoolId: string;
}> = ({ onClose, mode, setMode, classId, setClassId, classes, newStudent, setNewStudent, onSubmit, onCsv, setCsv, loading, saved, schoolId }) => {
    
    // Custom Fields Logic
    const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
    const [customData, setCustomData] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchConfig = async () => {
            const config = await api.getSchoolConfig();
            if (config && config.admissionConfig?.customFields) {
                setCustomFields(config.admissionConfig.customFields);
            }
        };
        fetchConfig();
    }, []);

    // Sync custom data to main state
    useEffect(() => {
        setNewStudent((prev: any) => ({ ...prev, customData: customData }));
    }, [customData]);

    const handleCustomChange = (id: string, val: any) => {
        setCustomData(prev => ({ ...prev, [id]: val }));
    };

    return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
        <GlassCard className="max-w-md w-full relative h-[85vh] flex flex-col p-0 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
            <div className="p-6 pb-2 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                        <UserPlus className="w-6 h-6 text-slate-900 dark:text-white"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Add Students</h3>
                        <p className="text-xs text-zinc-500">Manage admission</p>
                    </div>
                </div>
                <div className="mb-4">
                    <GlassSelect value={classId} onChange={(e:any) => setClassId(e.target.value)}>
                        <option value="">-- Choose Class --</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </GlassSelect>
                </div>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    {['PUBLIC', 'DELEGATE', 'BULK', 'SINGLE'].map(m => (
                        <button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 px-1 rounded text-[10px] font-bold whitespace-nowrap transition-all ${mode === m ? 'bg-white dark:bg-zinc-800 shadow text-slate-900 dark:text-white' : 'text-zinc-500'}`}>{m === 'DELEGATE' ? 'Invite' : m}</button>
                    ))}
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pt-4">
                {mode === 'PUBLIC' && (
                    <div className="text-center pt-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/50 mb-4">
                            <Globe className="w-10 h-10 text-blue-600 mx-auto mb-2"/>
                            <h4 className="font-bold text-slate-900 dark:text-white">Self Registration</h4>
                            <p className="text-xs text-zinc-500 mb-4">Share link for parents to apply.</p>
                            <div className="p-2 bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 font-mono mb-4 break-all">
                                {classId ? `${window.location.origin}#/register?schoolId=${schoolId}&classId=${classId}` : 'Select Class First'}
                            </div>
                            <GlassButton onClick={() => {if(classId) navigator.clipboard.writeText(`${window.location.origin}#/register?schoolId=${schoolId}&classId=${classId}`)}} className="w-full bg-blue-600 text-white hover:bg-blue-700">Copy Link</GlassButton>
                        </div>
                    </div>
                )}
                {mode === 'DELEGATE' && (
                    <div className="text-center pt-4">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <Share2 className="w-10 h-10 text-zinc-500 mx-auto mb-2"/>
                            <h4 className="font-bold text-slate-900 dark:text-white">Invite Teacher</h4>
                            <p className="text-xs text-zinc-500 mb-4">Let the teacher manage admissions.</p>
                            <GlassButton onClick={() => {if(classId) navigator.clipboard.writeText(`${window.location.origin}#/login?invite=${classId}`)}} variant="secondary" className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700">Copy Invite</GlassButton>
                        </div>
                    </div>
                )}
                {mode === 'BULK' && (
                    <div className="space-y-4 pt-4 text-center">
                        <a href="data:text/csv;charset=utf-8,Name,RegNo,Gender,DOB\nStudent Name,1001,Male,2008-05-20" download="template.csv" className="text-xs font-bold text-blue-600 underline flex items-center justify-center gap-1"><Download className="w-3 h-3"/> Download Template</a>
                        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 bg-zinc-50 dark:bg-zinc-900">
                            <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-2"/>
                            <p className="text-xs text-zinc-500 mb-4">Upload CSV (Name, RegNo, Gender, DOB)</p>
                            <input type="file" accept=".csv" onChange={(e) => setCsv(e.target.files?.[0] || null)} className="text-xs w-full"/>
                        </div>
                        <GlassButton onClick={onCsv} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">{loading?'Uploading...':'Upload CSV'}</GlassButton>
                    </div>
                )}
                {mode === 'SINGLE' && (
                    <form onSubmit={onSubmit} className="space-y-4 pt-2 relative">
                        {saved && <div className="absolute -top-4 right-0 text-[10px] text-green-600 font-bold flex gap-1"><CheckCircle2 className="w-3 h-3"/> Saved Draft</div>}
                        <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Name</label><GlassInput value={newStudent.name} onChange={(e:any) => setNewStudent({...newStudent, name: e.target.value.toUpperCase()})} required/></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Reg No</label><GlassInput value={newStudent.regNo} onChange={(e:any) => setNewStudent({...newStudent, regNo: e.target.value})} required/></div>
                            <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Roll No</label><GlassInput value={newStudent.rollNo} onChange={(e:any) => setNewStudent({...newStudent, rollNo: e.target.value})}/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Gender</label><GlassSelect value={newStudent.gender} onChange={(e:any) => setNewStudent({...newStudent, gender: e.target.value})}><option value="Male">Male</option><option value="Female">Female</option></GlassSelect></div>
                            <div><label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">DOB</label><GlassInput type="date" value={newStudent.dob} onChange={(e:any) => setNewStudent({...newStudent, dob: e.target.value})}/></div>
                        </div>
                        
                        {/* Dynamic Custom Fields */}
                        {customFields.length > 0 && (
                            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-2">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Additional Info</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {customFields.map(f => (
                                        <div key={f.id}>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">{f.label}</label>
                                            {f.type === 'SELECT' ? (
                                                <GlassSelect value={customData[f.id] || ''} onChange={(e:any) => handleCustomChange(f.id, e.target.value)}>
                                                    <option value="">Select</option>
                                                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                                </GlassSelect>
                                            ) : (
                                                <GlassInput 
                                                    type={f.type === 'NUMBER' ? 'number' : f.type === 'DATE' ? 'date' : 'text'}
                                                    value={customData[f.id] || ''} 
                                                    onChange={(e:any) => handleCustomChange(f.id, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <GlassButton type="submit" disabled={loading} className="w-full mt-4 bg-slate-900 text-white hover:bg-slate-800">{loading?'Saving...':'Save Student'}</GlassButton>
                    </form>
                )}
            </div>
        </GlassCard>
    </div>
)};
