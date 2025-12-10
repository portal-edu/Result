
import React from 'react';
import { GlassCard } from '../../components/GlassUI';
import { Megaphone } from 'lucide-react';

const PrincipalNotices: React.FC = () => {
    return (
        <div className="animate-fade-in-up">
            <GlassCard className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 text-purple-600">
                    <Megaphone className="w-8 h-8"/>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Official Announcements</h3>
                <p className="text-slate-500 mt-2 max-w-sm">
                    Publish circulars, holiday announcements, and exam schedules to the entire campus.
                </p>
                <div className="mt-6 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-500">
                    Module: OFFICIAL_NOTICES
                </div>
            </GlassCard>
        </div>
    );
};

export default PrincipalNotices;
