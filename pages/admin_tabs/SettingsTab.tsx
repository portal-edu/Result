
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { SchoolConfig, CustomFieldDef } from '../../types';
import { Settings, Loader2, Upload, Link as LinkIcon, Image as ImageIcon, Save, HardDrive, Trash2, UserX, UserCheck, Building2, GraduationCap, Shield, Database, Check, Share2, Copy, BookOpen, ToggleLeft, Zap, ClipboardList, PlusCircle, LayoutList, Palette, Layout } from 'lucide-react';

interface Props {
    schoolConfig: SchoolConfig;
    onUpdate: (config: SchoolConfig) => void;
}

const SettingsTab: React.FC<Props> = ({ schoolConfig, onUpdate }) => {
    const [activeSection, setActiveSection] = useState<'GENERAL' | 'ACADEMIC' | 'ACCESS' | 'DATA'>('GENERAL');
    const [localConfig, setLocalConfig] = useState<SchoolConfig>(schoolConfig);
    const [fetchingPincode, setFetchingPincode] = useState(false);
    
    // Custom Fields State
    const [customFields, setCustomFields] = useState<CustomFieldDef[]>(schoolConfig.admissionConfig?.customFields || []);
    const [newField, setNewField] = useState<Partial<CustomFieldDef>>({ label: '', type: 'TEXT', required: false });
    
    // Syllabus
    const [syllabi, setSyllabi] = useState<any[]>([]);
    const [masterSubjects, setMasterSubjects] = useState<string[]>(schoolConfig.masterSubjects || []);
    const [newMasterSubject, setNewMasterSubject] = useState('');
    
    // Upload States
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [showLogoUpload, setShowLogoUpload] = useState(false);
    const [showCoverUpload, setShowCoverUpload] = useState(false);
    
    // Principal Config
    const [inviteLink, setInviteLink] = useState('');
    const [loadingInvite, setLoadingInvite] = useState(false);
    
    // Data Management
    const [restoring, setRestoring] = useState(false);
    const [healthStats, setHealthStats] = useState({ ghosts: 0, oldPosts: 0, staleRequests: 0, oldLogs: 0 });
    const [cleaning, setCleaning] = useState<string | null>(null);

    useEffect(() => {
        loadHealth();
        setSyllabi(api.getGlobalSyllabi());
    }, []);

    // Update localConfig when custom fields change
    useEffect(() => {
        setLocalConfig(prev => ({
            ...prev,
            admissionConfig: { ...prev.admissionConfig!, customFields: customFields }
        }));
    }, [customFields]);

    const loadHealth = async () => {
        const stats = await api.getSchoolDetailedHealthStats();
        setHealthStats(stats);
    };

    const handleUpdateConfig = async () => {
        const payload = { ...localConfig, masterSubjects };
        const res = await api.updateSchoolSettings(payload);
        if (res.success) { onUpdate(payload); alert('Settings Saved Successfully!'); } 
        else alert("Failed to update settings.");
    };

    const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setLocalConfig({ ...localConfig, pincode: pin });
        if (pin.length === 6) {
            setFetchingPincode(true);
            try {
                const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                const data = await response.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const details = data[0].PostOffice[0];
                    setLocalConfig(prev => ({ ...prev, pincode: pin, district: details.District, state: details.State }));
                }
            } catch (err) { console.error(err); }
            setFetchingPincode(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        if (type === 'logo') setUploadingLogo(true);
        else setUploadingCover(true);

        const res = await api.uploadImage(file, 'logos');
        
        if (type === 'logo') setUploadingLogo(false);
        else setUploadingCover(false);

        if (res.success && res.publicUrl) {
            if (type === 'logo') {
                setLocalConfig(prev => ({ ...prev, logoUrl: res.publicUrl! }));
                setShowLogoUpload(false);
            } else {
                setLocalConfig(prev => ({ ...prev, coverPhoto: res.publicUrl! }));
                setShowCoverUpload(false);
            }
        } else alert("Upload failed: " + res.message);
    };

    const handleCleanItem = async (type: 'GHOSTS' | 'OLD_POSTS' | 'STALE_REQUESTS' | 'OLD_LOGS') => {
        if (!window.confirm("Are you sure? This action cannot be undone.")) return;
        setCleaning(type);
        const res = await api.cleanSpecificJunk(type);
        setCleaning(null);
        if (res.success) { loadHealth(); } 
        else { alert("Cleanup Failed: " + res.message); }
    };

    const handleBackup = () => { api.exportSchoolData(); };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!window.confirm("WARNING: This will OVERWRITE existing data. Continue?")) { e.target.value = ''; return; }

        setRestoring(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                const res = await api.restoreSchoolData(json);
                setRestoring(false);
                if (res.success) { alert("Restore Successful! Refreshing..."); window.location.reload(); } 
                else { alert("Restore Failed: " + res.message); }
            } catch (err) { setRestoring(false); alert("Invalid Backup File"); }
        };
        reader.readAsText(file);
    };

    const handleGenerateInvite = async () => {
        setLoadingInvite(true);
        const res = await api.generatePrincipalInvite();
        setLoadingInvite(false);
        if (res.success && res.token) {
            const link = `${window.location.origin}/#/principal-setup?token=${res.token}`;
            setInviteLink(link);
            // Optimistically clear password locally to reflect pending state
            setLocalConfig(prev => ({ ...prev, principalPassword: '' }));
        } else {
            alert("Failed to generate invite.");
        }
    };
    
    // Master Subject Logic
    const addMasterSubject = () => {
        if (!newMasterSubject) return;
        if (!masterSubjects.includes(newMasterSubject)) {
            setMasterSubjects([...masterSubjects, newMasterSubject]);
        }
        setNewMasterSubject('');
    };
    
    const removeMasterSubject = (sub: string) => {
        setMasterSubjects(prev => prev.filter(s => s !== sub));
    };
    
    const handleSyllabusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setLocalConfig({...localConfig, syllabusProviderId: id});
        
        // Auto-populate master subjects suggestion
        if (id) {
            const syllabus = syllabi.find(s => s.id === id);
            if (syllabus && confirm(`Import standard subjects from ${syllabus.name} to your library?`)) {
                const allSubjects = new Set(masterSubjects);
                Object.values(syllabus.subjects).forEach((subs: any) => {
                    subs.forEach((s: any) => allSubjects.add(s.name));
                });
                setMasterSubjects(Array.from(allSubjects));
            }
        }
    };

    // Custom Fields Logic
    const addCustomField = () => {
        if (!newField.label) return alert("Field label required");
        const id = newField.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (customFields.some(f => f.id === id)) return alert("Field already exists");
        
        const field: CustomFieldDef = {
            id,
            label: newField.label,
            type: newField.type as any || 'TEXT',
            required: newField.required || false,
            options: newField.type === 'SELECT' ? (newField.options as any)?.split(',').map((s:string) => s.trim()) : undefined
        };
        
        setCustomFields([...customFields, field]);
        setNewField({ label: '', type: 'TEXT', required: false });
    };

    const removeCustomField = (id: string) => {
        if (confirm("Remove this field? Existing data may be hidden from forms.")) {
            setCustomFields(prev => prev.filter(f => f.id !== id));
        }
    };

    const MenuButton = ({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveSection(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
            <Icon className="w-4 h-4"/> {label}
        </button>
    );

    // Template Option Component
    const TemplateOption = ({ id, name, color }: { id: string, name: string, color: string }) => {
        const isSelected = (localConfig.layoutTemplate || 'MODERN') === id;
        return (
            <button 
                onClick={() => setLocalConfig({...localConfig, layoutTemplate: id as any})}
                className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
            >
                <div className={`w-full h-16 rounded-lg ${color} shadow-inner`}></div>
                <span className={`text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>{name}</span>
                {isSelected && <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-0.5"><Check className="w-3 h-3"/></div>}
            </button>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 animate-fade-in-up h-full">
            
            {/* SIDEBAR NAVIGATION */}
            <div className="md:w-64 flex-shrink-0">
                <GlassCard className="p-2 space-y-1 bg-white dark:bg-slate-900">
                    <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Configuration</p>
                    <MenuButton id="GENERAL" label="General & Branding" icon={Building2} />
                    <MenuButton id="ACADEMIC" label="Academic Setup" icon={GraduationCap} />
                    <MenuButton id="ACCESS" label="Access & Admission" icon={Shield} />
                    <MenuButton id="DATA" label="Data Management" icon={Database} />
                </GlassCard>
                
                <div className="mt-4">
                    <GlassButton onClick={handleUpdateConfig} className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 py-3 shadow-lg shadow-green-500/20">
                        <Save className="w-4 h-4"/> Save All Changes
                    </GlassButton>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 space-y-6">
                
                {/* 1. GENERAL SETTINGS */}
                {activeSection === 'GENERAL' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <GlassCard>
                            <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                General Information
                            </h3>
                            <div className="space-y-5">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">School Name</label><GlassInput value={localConfig.schoolName} onChange={e => setLocalConfig({...localConfig, schoolName: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Phone Number</label><GlassInput value={localConfig.phone || ''} onChange={e => setLocalConfig({...localConfig, phone: e.target.value})} /></div>
                                </div>
                                
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Description</label><textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" rows={2} value={localConfig.description || ''} onChange={e => setLocalConfig({...localConfig, description: e.target.value})} /></div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Pincode</label><div className="relative"><GlassInput value={localConfig.pincode || ''} onChange={handlePincodeChange} maxLength={6}/>{fetchingPincode && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-blue-500"/>}</div></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">District</label><GlassInput value={localConfig.district || ''} readOnly className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"/></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">State</label><GlassInput value={localConfig.state || ''} readOnly className="bg-slate-100 dark:bg-slate-800 cursor-not-allowed"/></div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                Public Profile & Branding
                            </h3>
                            
                            <div className="space-y-6">
                                {/* Theme Selector */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-3 flex items-center gap-2"><Layout className="w-4 h-4"/> Public Page Theme</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <TemplateOption id="MODERN" name="Modern (Default)" color="bg-gradient-to-br from-blue-500 to-indigo-600" />
                                        <TemplateOption id="CLASSIC" name="Classic Academic" color="bg-slate-100 border-t-4 border-blue-900" />
                                        <TemplateOption id="VIBRANT" name="Vibrant Kids" color="bg-gradient-to-r from-pink-400 to-orange-400" />
                                        <TemplateOption id="DARK" name="Cyber Dark" color="bg-slate-900 border border-slate-700" />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Logo Upload */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">School Logo</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                {localConfig.logoUrl ? <img src={localConfig.logoUrl} className="w-full h-full object-contain"/> : <ImageIcon className="w-6 h-6 text-slate-400"/>}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                {!showLogoUpload ? (
                                                    <>
                                                        <GlassInput className="h-8 text-xs" placeholder="Image URL" value={localConfig.logoUrl || ''} onChange={e => setLocalConfig({...localConfig, logoUrl: e.target.value})} />
                                                        <button onClick={() => setShowLogoUpload(true)} className="text-[10px] text-blue-600 font-bold hover:underline">Upload File instead</button>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <label className="flex-1 bg-slate-200 dark:bg-slate-800 py-1.5 rounded text-[10px] font-bold text-center cursor-pointer">{uploadingLogo ? '...' : 'Select File'}<input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'logo')}/></label>
                                                        <button onClick={() => setShowLogoUpload(false)} className="text-[10px] text-red-500">Cancel</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover Upload */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Cover Photo</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                {localConfig.coverPhoto ? <img src={localConfig.coverPhoto} className="w-full h-full object-cover"/> : <ImageIcon className="w-6 h-6 text-slate-400"/>}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                {!showCoverUpload ? (
                                                    <>
                                                        <GlassInput className="h-8 text-xs" placeholder="Image URL" value={localConfig.coverPhoto || ''} onChange={e => setLocalConfig({...localConfig, coverPhoto: e.target.value})} />
                                                        <button onClick={() => setShowCoverUpload(true)} className="text-[10px] text-blue-600 font-bold hover:underline">Upload File instead</button>
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <label className="flex-1 bg-slate-200 dark:bg-slate-800 py-1.5 rounded text-[10px] font-bold text-center cursor-pointer">{uploadingCover ? '...' : 'Select File'}<input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'cover')}/></label>
                                                        <button onClick={() => setShowCoverUpload(false)} className="text-[10px] text-red-500">Cancel</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Slug & Socials */}
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Links & Socials</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Custom Page Link</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">resultmate.com/#/school/</span>
                                                <GlassInput 
                                                    className="h-9 text-sm" 
                                                    placeholder="my-school-name" 
                                                    value={localConfig.slug || ''} 
                                                    onChange={e => setLocalConfig({...localConfig, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Website URL</label>
                                            <GlassInput className="h-9 text-sm" placeholder="https://myschool.com" value={localConfig.socials?.website || ''} onChange={e => setLocalConfig({...localConfig, socials: {...localConfig.socials, website: e.target.value}})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Instagram Link</label>
                                            <GlassInput className="h-9 text-sm" placeholder="https://instagram.com/..." value={localConfig.socials?.instagram || ''} onChange={e => setLocalConfig({...localConfig, socials: {...localConfig.socials, instagram: e.target.value}})} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Facebook Link</label>
                                            <GlassInput className="h-9 text-sm" placeholder="https://facebook.com/..." value={localConfig.socials?.facebook || ''} onChange={e => setLocalConfig({...localConfig, socials: {...localConfig.socials, facebook: e.target.value}})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* 2. ACADEMIC SETTINGS */}
                {activeSection === 'ACADEMIC' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <GlassCard>
                            <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                Syllabus & Curriculum
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Syllabus Standard</label>
                                    <GlassSelect 
                                        value={localConfig.syllabusProviderId || ''} 
                                        onChange={handleSyllabusChange}
                                    >
                                        <option value="">-- Custom / Not Selected --</option>
                                        {syllabi.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </GlassSelect>
                                    <p className="text-[10px] text-slate-400 mt-1">Select a standard (e.g., Samastha, State) to auto-populate subjects during class creation.</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4"/> Master Subject Library
                                        </label>
                                        <span className="text-[10px] text-slate-400">{masterSubjects.length} Subjects</span>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-3">
                                        <GlassInput 
                                            placeholder="Add Subject (e.g. Maths)" 
                                            className="h-8 text-sm"
                                            value={newMasterSubject}
                                            onChange={e => setNewMasterSubject(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addMasterSubject()}
                                        />
                                        <button onClick={addMasterSubject} className="bg-blue-600 text-white px-3 rounded-lg text-xs font-bold hover:bg-blue-700">Add</button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {masterSubjects.map(sub => (
                                            <div key={sub} className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                {sub}
                                                <button onClick={() => removeMasterSubject(sub)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                        {masterSubjects.length === 0 && <p className="text-xs text-slate-400 italic">No subjects in library.</p>}
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                Result Configuration
                            </h3>
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Academic Year</label><GlassInput value={localConfig.academicYear || ''} onChange={e => setLocalConfig({...localConfig, academicYear: e.target.value})} placeholder="e.g. 2024-25" /></div>
                                    <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Current Exam Name</label><GlassInput value={localConfig.examName || ''} onChange={e => setLocalConfig({...localConfig, examName: e.target.value})} placeholder="e.g. Term 1 Examination" /></div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Result Display Style</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { id: 'PASS_FAIL', label: 'Pass / Fail' },
                                            { id: 'GRADE_ONLY', label: 'Grades Only' },
                                            { id: 'CLASS_DISTINCTION', label: 'Distinction' },
                                            { id: 'PERCENTAGE', label: 'Percentage' }
                                        ].map(style => (
                                            <button 
                                                key={style.id}
                                                onClick={() => setLocalConfig({...localConfig, resultDisplayType: style.id as any})}
                                                className={`p-3 rounded-xl border text-xs font-bold transition-all ${localConfig.resultDisplayType === style.id ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Ranks on Public Result</span>
                                        <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={localConfig.showRank} onChange={e => setLocalConfig({...localConfig, showRank: e.target.checked})}/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show Pass/Fail Status Badge</span>
                                        <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={localConfig.showPassFailStatus !== false} onChange={e => setLocalConfig({...localConfig, showPassFailStatus: e.target.checked})}/>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* 3. ACCESS CONTROL */}
                {activeSection === 'ACCESS' && (
                    <div className="space-y-6 animate-fade-in-up">
                        
                        {/* CUSTOM FIELDS MANAGER */}
                        <GlassCard className="border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/10">
                            <h3 className="font-bold text-sm mb-4 text-blue-700 dark:text-blue-400 uppercase flex items-center gap-2">
                                <LayoutList className="w-4 h-4"/> Custom Fields Manager
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Add new data columns to student profiles. These will appear in admission forms.</p>
                            
                            {/* Existing Custom Fields */}
                            <div className="space-y-2 mb-4">
                                {customFields.map((field) => (
                                    <div key={field.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white">{field.label}</span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">{field.type}</span>
                                            {field.required && <span className="text-[10px] text-red-500 font-bold">*Required</span>}
                                        </div>
                                        <button onClick={() => removeCustomField(field.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                                {customFields.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">No custom fields added.</p>}
                            </div>

                            {/* Add New Field */}
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-2 items-center flex-wrap">
                                <div className="flex-1 min-w-[120px]">
                                    <GlassInput 
                                        className="h-9 text-xs" 
                                        placeholder="Field Name (e.g. Aadhar)" 
                                        value={newField.label} 
                                        onChange={e => setNewField({...newField, label: e.target.value})}
                                    />
                                </div>
                                <div className="w-28">
                                    <GlassSelect 
                                        className="h-9 text-xs py-0" 
                                        value={newField.type} 
                                        onChange={e => setNewField({...newField, type: e.target.value as any})}
                                    >
                                        <option value="TEXT">Text</option>
                                        <option value="NUMBER">Number</option>
                                        <option value="DATE">Date</option>
                                        <option value="SELECT">Dropdown</option>
                                    </GlassSelect>
                                </div>
                                {newField.type === 'SELECT' && (
                                    <div className="flex-1 min-w-[120px]">
                                        <GlassInput 
                                            className="h-9 text-xs" 
                                            placeholder="Options (comma separated)" 
                                            value={newField.options as any} 
                                            onChange={e => setNewField({...newField, options: e.target.value as any})}
                                        />
                                    </div>
                                )}
                                <label className="flex items-center gap-1 cursor-pointer select-none">
                                    <input type="checkbox" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} className="w-4 h-4 accent-blue-600"/>
                                    <span className="text-xs font-bold text-slate-500">Req.</span>
                                </label>
                                <button onClick={addCustomField} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                                    <PlusCircle className="w-4 h-4"/>
                                </button>
                            </div>
                        </GlassCard>

                        {/* Standard Fields Visibility */}
                        <GlassCard>
                            <h3 className="font-bold text-sm mb-4 text-slate-700 dark:text-white uppercase flex items-center gap-2">
                                <ClipboardList className="w-4 h-4"/> Standard Fields Visibility
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ask Admission No (Reg No)</span>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={localConfig.admissionConfig?.askRegNo || false}
                                        onChange={e => setLocalConfig({
                                            ...localConfig, 
                                            admissionConfig: { ...localConfig.admissionConfig!, askRegNo: e.target.checked }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ask Roll Number</span>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={localConfig.admissionConfig?.askRollNo || false}
                                        onChange={e => setLocalConfig({
                                            ...localConfig, 
                                            admissionConfig: { ...localConfig.admissionConfig!, askRollNo: e.target.checked }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ask Photo Upload</span>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={localConfig.admissionConfig?.askPhoto || false}
                                        onChange={e => setLocalConfig({
                                            ...localConfig, 
                                            admissionConfig: { ...localConfig.admissionConfig!, askPhoto: e.target.checked }
                                        })}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Ask Blood Group</span>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-blue-600"
                                        checked={localConfig.admissionConfig?.askBloodGroup || false}
                                        onChange={e => setLocalConfig({
                                            ...localConfig, 
                                            admissionConfig: { ...localConfig.admissionConfig!, askBloodGroup: e.target.checked }
                                        })}
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">General Permissions</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Allow Public Admission</p>
                                        <p className="text-xs text-slate-500">Enable "Register Here" link for parents</p>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={localConfig.allowPublicAdmission} onChange={e => setLocalConfig({...localConfig, allowPublicAdmission: e.target.checked})}/>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">Teacher Subject Edit</p>
                                        <p className="text-xs text-slate-500">Allow class teachers to add/remove subjects</p>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={localConfig.allowTeacherSubjectEdit} onChange={e => setLocalConfig({...localConfig, allowTeacherSubjectEdit: e.target.checked})}/>
                                </div>
                                
                                {/* NEW: DIRECT PUBLISH TOGGLE */}
                                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                                            <Zap className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">Allow Teacher Direct Publish</p>
                                            <p className="text-xs text-slate-500">Teachers can publish Class Tests instantly without admin approval</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={localConfig.allowTeacherDirectPublish || false} onChange={e => setLocalConfig({...localConfig, allowTeacherDirectPublish: e.target.checked})}/>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="border border-purple-200 dark:border-purple-900/50 bg-purple-50 dark:bg-purple-900/10">
                            <h3 className="font-bold text-sm mb-4 text-purple-700 dark:text-purple-400 uppercase flex items-center gap-2">
                                <UserCheck className="w-4 h-4"/> Principal Access
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-800">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Principal Login?</span>
                                    <input 
                                        type="checkbox" 
                                        className="w-5 h-5 accent-purple-600"
                                        checked={localConfig.hasPrincipalLogin || false}
                                        onChange={e => setLocalConfig({...localConfig, hasPrincipalLogin: e.target.checked})}
                                    />
                                </div>
                                
                                {localConfig.hasPrincipalLogin && (
                                    <div className="space-y-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-100 dark:border-purple-800 animate-fade-in-up">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Principal Email</label>
                                            <GlassInput value={localConfig.principalEmail || ''} onChange={e => setLocalConfig({...localConfig, principalEmail: e.target.value})} placeholder="principal@school.com" />
                                        </div>
                                        
                                        <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

                                        {localConfig.principalPassword ? (
                                            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-100 dark:border-green-800/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                    <span className="text-xs font-bold text-green-700 dark:text-green-400">Account Active</span>
                                                </div>
                                                <button 
                                                    onClick={handleGenerateInvite} 
                                                    className="text-[10px] text-blue-600 hover:underline"
                                                >
                                                    Reset Access
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Access Setup</p>
                                                
                                                {inviteLink ? (
                                                    <div className="space-y-2">
                                                        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 break-all text-[10px] font-mono text-slate-600 dark:text-slate-400">
                                                            {inviteLink}
                                                        </div>
                                                        <button 
                                                            onClick={() => {navigator.clipboard.writeText(inviteLink); alert("Link Copied!");}}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                                                        >
                                                            <Copy className="w-3 h-3"/> Copy Link
                                                        </button>
                                                        <p className="text-[10px] text-slate-400 text-center">Share this link with the Principal to set their password.</p>
                                                    </div>
                                                ) : (
                                                    <GlassButton 
                                                        onClick={handleGenerateInvite} 
                                                        disabled={loadingInvite}
                                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-none py-2 text-xs"
                                                    >
                                                        {loadingInvite ? <Loader2 className="w-3 h-3 animate-spin"/> : <Share2 className="w-3 h-3"/>}
                                                        Generate Invite Link
                                                    </GlassButton>
                                                )}
                                                
                                                {!inviteLink && (
                                                    <p className="text-[10px] text-slate-400">
                                                        Generate a secure link for the Principal to set their own password.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* 4. DATA MANAGEMENT */}
                {activeSection === 'DATA' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <GlassCard className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-sm mb-4 text-slate-700 dark:text-white uppercase flex items-center gap-2">
                                <HardDrive className="w-4 h-4"/> Maintenance Console
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32 relative group">
                                    <div><div className="flex justify-between items-start mb-2"><div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-lg text-orange-600 dark:text-orange-400"><UserX className="w-4 h-4"/></div><span className="text-xl font-black text-slate-800 dark:text-white">{healthStats.ghosts}</span></div><p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-tight">Ghost Admissions</p></div><button onClick={() => handleCleanItem('GHOSTS')} disabled={healthStats.ghosts === 0 || cleaning === 'GHOSTS'} className="w-full py-1.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center gap-1">{cleaning === 'GHOSTS' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>} Clear</button>
                                </div>
                                {/* Other cards for logs, requests can be added similarly */}
                            </div>
                        </GlassCard>

                        <GlassCard className="border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10">
                            <h3 className="font-bold text-sm mb-4 text-green-700 dark:text-green-400 uppercase flex items-center gap-2">
                                <Database className="w-4 h-4"/> Backup & Restore
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Backup Data</p>
                                    <p className="text-xs text-slate-500 mb-3">Download a full JSON copy of your campus data.</p>
                                    <button onClick={handleBackup} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">Download Backup</button>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">Restore Data</p>
                                    <p className="text-xs text-slate-500 mb-3">Overwrite current data with a backup file.</p>
                                    <label className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer">
                                        {restoring ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>} {restoring ? 'Restoring...' : 'Select File'}
                                        <input type="file" className="hidden" accept=".json" onChange={handleRestore} disabled={restoring}/>
                                    </label>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsTab;
