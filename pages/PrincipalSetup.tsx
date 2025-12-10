
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

const PrincipalSetup: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);
    const token = query.get('token');

    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(true);
    const [schoolName, setSchoolName] = useState('');
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Invalid Invite Link");
            setVerifying(false);
            return;
        }
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        const data = await api.verifyPrincipalToken(token!);
        setVerifying(false);
        if (data) {
            setSchoolName(data.name);
        } else {
            setError("This invite link is invalid or has expired.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) return alert("Password must be at least 6 characters");
        if (password !== confirmPass) return alert("Passwords do not match");

        setSubmitting(true);
        const res = await api.setupPrincipalPassword(token!, password);
        setSubmitting(false);

        if (res.success) {
            alert("Setup Complete! Please login.");
            navigate('/login');
        } else {
            setError(res.message || "Setup Failed");
        }
    };

    if (verifying) {
        return <div className="min-h-screen flex items-center justify-center text-slate-500">Verifying Invite...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <GlassCard className="max-w-md w-full text-center border-t-4 border-red-500">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Access Denied</h3>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <GlassButton onClick={() => navigate('/')}>Back Home</GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
            <GlassCard className="max-w-md w-full border-t-4 border-blue-600 shadow-2xl animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="w-8 h-8"/>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Welcome, Principal</h2>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{schoolName}</p>
                    <p className="text-xs text-slate-400 mt-2">Set your secure access password below.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Create Password</label>
                        <GlassInput 
                            type="password" 
                            placeholder="Min 6 Characters" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Confirm Password</label>
                        <GlassInput 
                            type="password" 
                            placeholder="Re-enter Password" 
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="pt-4">
                        <GlassButton type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                            {submitting ? 'Setting up...' : 'Set Password & Login'}
                        </GlassButton>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};

export default PrincipalSetup;
