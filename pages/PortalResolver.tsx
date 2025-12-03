
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { GlassCard, GlassButton } from '../components/GlassUI';
import { Loader2, AlertCircle, Building2 } from 'lucide-react';

const PortalResolver: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [foundName, setFoundName] = useState('');

    useEffect(() => {
        if (slug) {
            resolveSlug(slug);
        }
    }, [slug]);

    const resolveSlug = async (code: string) => {
        const school = await api.getSchoolBySlug(code);
        if (school) {
            setFoundName(school.name);
            // Found! Save ID
            localStorage.setItem('school_id', school.id);
            // Wait brief moment for user to see visual feedback, then redirect
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 800);
        } else {
            setError(`School with code "${code}" not found.`);
        }
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
                <GlassCard className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Portal Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                    <GlassButton onClick={() => navigate('/login')} className="w-full">
                        Go to Main Login
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <div className="text-center animate-fade-in-up">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                {foundName ? (
                    <>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to {foundName}</h2>
                        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Redirecting to login...</span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-lg">Locating School Portal...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortalResolver;
