
import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Student, SchoolConfig } from '../../types';
import { User, QrCode, Lock, CreditCard, Upload, Loader2, Crown, CheckCircle, ShieldCheck, LogOut, Palette, Layout, Star } from 'lucide-react';

interface Props {
    user: Student;
    schoolConfig: SchoolConfig | null;
    onUpdateUser: (updated: Partial<Student>) => void;
}

const ProfileTab: React.FC<Props> = ({ user, schoolConfig, onUpdateUser }) => {
    const [editingPhoto, setEditingPhoto] = useState(false);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    
    // Premium Modal Logic
    const [showPayment, setShowPayment] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setUploadingPhoto(true);
        const res = await api.uploadImage(e.target.files[0], 'students');
        setUploadingPhoto(false);
        if (res.success && res.publicUrl) setNewPhotoUrl(res.publicUrl);
        else alert("Upload failed.");
    };

    const handlePhotoUpdate = async () => {
        if (!newPhotoUrl) return;
        const res = await api.createProfileRequest(user.id, 'photoUrl', newPhotoUrl);
        if (res.success) { 
            alert("Photo update requested. Teacher will approve."); 
            setEditingPhoto(false); 
            setNewPhotoUrl(''); 
        } else alert("Failed: " + res.message);
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 4) { alert("Password too short"); return; }
        const res = await api.changePassword(user.id, newPassword);
        if (res.success) { alert("Password updated!"); setNewPassword(''); }
        else alert("Failed: " + res.message);
    };

    const handleUpgrade = async () => {
        setProcessing(true);
        // Simulate Payment Gateway
        setTimeout(async () => {
            const fakeTxn = "UPI" + Date.now();
            const res = await api.activateStudentPremium(user.id, fakeTxn);
            setProcessing(false);
            setShowPayment(false);
            if (res.success) {
                onUpdateUser({ isPremium: true });
                alert("🎉 Premium Activated!");
            } else alert("Failed");
        }, 1500);
    };

    const handleThemeChange = async (theme: 'DEFAULT' | 'NEON' | 'GOLD' | 'DARK_ROYAL' | 'MINIMAL') => {
        // Optimistic UI Update
        const currentPrefs = (user.socialLinks as any)?._preferences || {};
        onUpdateUser({ socialLinks: { ...(user.socialLinks || {}), _preferences: { ...currentPrefs, theme } } });
        
        await api.updateStudentPreferences(user.id, { ...currentPrefs, theme });
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* ID CARD */}
            <div className="relative group">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className={`p-6 rounded-[20px] text-white relative overflow-hidden ${user.isPremium ? 'bg-gradient-to-br from-slate-900 to-black' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                        {/* Watermark */}
                        <div className="absolute top-0 right-0 p-4 opacity-20"><QrCode className="w-24 h-24"/></div>
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="font-bold text-lg opacity-90">Digital Identity</h3>
                                <p className="text-xs opacity-70">Official Student ID</p>
                            </div>
                            {schoolConfig?.logoUrl && <img src={schoolConfig.logoUrl} className="w-10 h-10 object-contain bg-white rounded-lg p-1"/>}
                        </div>

                        {/* Content */}
                        <div className="flex gap-4 items-center relative z-10">
                            <img src={user.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-20 h-20 rounded-xl object-cover border-2 border-white/30 bg-white"/>
                            <div>
                                <h2 className="text-2xl font-black leading-tight mb-1">{user.name}</h2>
                                <p className="text-sm font-mono opacity-80">{user.regNo}</p>
                                <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.isPremium ? 'bg-yellow-500 text-black' : 'bg-white/20'}`}>
                                    {user.isPremium ? <Crown className="w-3 h-3"/> : <ShieldCheck className="w-3 h-3"/>}
                                    {user.isPremium ? 'Elite Student' : 'Verified'}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[9px] uppercase opacity-60">School</p>
                                <p className="text-xs font-bold">{schoolConfig?.schoolName}</p>
                            </div>
                            <div className="h-8 w-8 bg-white rounded flex items-center justify-center">
                                <QrCode className="w-6 h-6 text-black"/>
                            </div>
                        </div>
                        
                        {/* Lock Overlay for Free Users */}
                        {!user.isPremium && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-20">
                                <Lock className="w-10 h-10 text-white/50 mb-2"/>
                                <h4 className="font-bold text-white text-lg">Unlock ID Card</h4>
                                <button onClick={() => setShowPayment(true)} className="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-6 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105">
                                    Get Verified (₹20)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CUSTOMIZATION SECTION */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-purple-500"/> Personalize
                    </h3>
                    {!user.isPremium && <Lock className="w-4 h-4 text-slate-400"/>}
                </div>

                {!user.isPremium && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                        <button onClick={() => setShowPayment(true)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-lg flex items-center gap-2">
                            <Star className="w-3 h-3 fill-white"/> Unlock Themes
                        </button>
                    </div>
                )}

                <p className="text-xs text-slate-500 mb-4">Choose your dashboard style:</p>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleThemeChange('DEFAULT')} className="h-16 rounded-xl bg-blue-600 shadow-lg flex items-center justify-center text-white text-[10px] font-bold">Standard</button>
                    <button onClick={() => handleThemeChange('NEON')} className="h-16 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg flex items-center justify-center text-white text-[10px] font-bold">Neon</button>
                    <button onClick={() => handleThemeChange('GOLD')} className="h-16 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-700 shadow-lg flex items-center justify-center text-white text-[10px] font-bold">Gold</button>
                    <button onClick={() => handleThemeChange('DARK_ROYAL')} className="h-16 rounded-xl bg-slate-900 shadow-lg flex items-center justify-center text-white text-[10px] font-bold">Dark Royal</button>
                    <button onClick={() => handleThemeChange('MINIMAL')} className="h-16 rounded-xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-slate-800 text-[10px] font-bold">Minimal</button>
                </div>
            </div>

            {/* SETTINGS */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><User className="w-5 h-5 text-blue-500"/> Profile Photo</h3>
                    {user.isPremium ? (
                        !editingPhoto && <button onClick={() => setEditingPhoto(true)} className="text-xs font-bold text-blue-600 underline">Change</button>
                    ) : (
                        <Lock className="w-4 h-4 text-slate-400"/>
                    )}
                </div>

                {editingPhoto ? (
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                        <GlassInput className="h-9 text-xs" placeholder="Paste Image URL..." value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)}/>
                        <p className="text-center text-[10px] text-slate-400 font-bold">OR</p>
                        <label className="cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 p-2 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2">
                            {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>} Upload Photo
                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto}/>
                        </label>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handlePhotoUpdate} className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">Update</button>
                            <button onClick={() => setEditingPhoto(false)} className="flex-1 bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full rounded-full object-cover"/> : <User className="w-5 h-5"/>}
                        </div>
                        <p className="text-xs text-slate-500">Update photo to personalize ID Card.</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">Security</h3>
                <div className="flex gap-2">
                    <GlassInput type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)}/>
                    <GlassButton onClick={handleChangePassword} className="whitespace-nowrap">Update</GlassButton>
                </div>
            </div>

            <button onClick={() => { localStorage.removeItem('school_id'); window.location.reload(); }} className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/10 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4"/> Sign Out
            </button>

            {/* PAYMENT MODAL */}
            {showPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
                        <button onClick={() => setShowPayment(false)} className="absolute top-4 right-4 text-slate-400 font-bold">✕</button>
                        <div className="text-center mb-6 mt-2">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <Crown className="w-8 h-8 text-yellow-600 dark:text-yellow-400"/>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Unlock Premium</h3>
                            <p className="text-slate-500 text-sm mt-1">One-time payment for full access</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Annual Fee</span>
                                <span className="text-lg font-black text-slate-900 dark:text-white">₹20</span>
                            </div>
                            <div className="h-px bg-slate-200 dark:border-slate-700 my-2"></div>
                            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400 mt-3">
                                <li className="flex items-center gap-3">
                                    <div className="bg-green-100 p-1 rounded-full text-green-600"><CheckCircle className="w-3 h-3"/></div> 
                                    <span><b>Verified Badge</b> on Profile</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-green-100 p-1 rounded-full text-green-600"><CheckCircle className="w-3 h-3"/></div>
                                    <span><b>Download</b> Digital ID Card</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-green-100 p-1 rounded-full text-green-600"><CheckCircle className="w-3 h-3"/></div>
                                    <span><b>AI Analytics</b> & Study Tips</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="bg-green-100 p-1 rounded-full text-green-600"><CheckCircle className="w-3 h-3"/></div>
                                    <span><b>Customize</b> Dashboard Themes</span>
                                </li>
                            </ul>
                        </div>
                        <button onClick={handleUpgrade} disabled={processing} className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95">
                            {processing ? <Loader2 className="w-5 h-5 animate-spin"/> : <><CreditCard className="w-5 h-5"/> Pay ₹20 Now</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileTab;
