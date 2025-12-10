
import React, { useState, useEffect, useRef } from 'react';
import { GlassButton } from '../../components/GlassUI';
import { Building2, Home, Megaphone, CheckCircle, Search, X } from 'lucide-react';
import { SchoolConfig } from '../../types';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface Props {
    config: SchoolConfig;
    onNoticeClick: () => void;
}

export const AdminHeader: React.FC<Props> = ({ config, onNoticeClick }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Debounce Search Logic
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                const results = await api.searchAllStudents(searchQuery);
                setSearchResults(results);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // Click Outside to Close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (studentId: string) => {
        // Future: Navigate to student profile modal
        // For now, clear search
        setSearchResults([]);
        setSearchQuery('');
        // You could trigger an event here to open a student modal in DashboardAdmin
        alert(`Found Student ID: ${studentId}. (View Profile coming soon)`);
    };

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-30">
            <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
                    {config.logoUrl ? (
                        <img src={config.logoUrl} className="w-8 h-8 object-contain" alt="Logo"/>
                    ) : (
                        <Building2 className="w-8 h-8"/>
                    )}
                </div>
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                        {config.schoolName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                        <span>{config.place}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className={config.isPro ? "text-emerald-600 flex items-center gap-1" : "text-slate-400"}>
                            {config.isPro ? <><CheckCircle className="w-3 h-3"/> PRO CAMPUS</> : "FREE PLAN"}
                        </span>
                    </div>
                </div>
            </div>

            {/* GLOBAL SEARCH BAR */}
            <div className="relative w-full md:w-64" ref={searchRef}>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 dark:text-slate-200"
                        placeholder="Search Student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                            <X className="w-3 h-3"/>
                        </button>
                    )}
                </div>
                
                {/* Search Dropdown */}
                {searchResults.length > 0 && (
                    <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-64 overflow-y-auto custom-scrollbar animate-fade-in-up">
                        {searchResults.map(s => (
                            <div 
                                key={s.id} 
                                onClick={() => handleResultClick(s.id)}
                                className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                            >
                                <p className="font-bold text-sm text-slate-800 dark:text-white">{s.name}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">{s.className}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{s.regNo}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                    <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-500 z-50">
                        No students found.
                    </div>
                )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
                 <GlassButton onClick={() => navigate(`/school/${config.slug || config.id}`)} variant="secondary" className="flex-1 md:flex-none flex justify-center items-center gap-2 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:text-blue-600">
                    <Home className="w-4 h-4"/> Public Page
                </GlassButton>
                 <GlassButton onClick={onNoticeClick} className="flex-1 md:flex-none flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                    <Megaphone className="w-4 h-4"/> Post Notice
                </GlassButton>
            </div>
        </div>
    );
};
