
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton } from '../../components/GlassUI';
import { api } from '../../services/api';
import { SchoolSummary } from '../../types';
import { School, Search, MoreVertical, ShieldCheck, ShieldAlert, Calendar, Users, Briefcase, Database, Activity, BarChart2, AlertTriangle, X, Trash2, Eraser, Clock } from 'lucide-react';

const SchoolManagerTab: React.FC = () => {
    const [schools, setSchools] = useState<SchoolSummary[]>([]);
    const [filtered, setFiltered] = useState<SchoolSummary[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionSchool, setActionSchool] = useState<SchoolSummary | null>(null);
    const [upgradeDays, setUpgradeDays] = useState(365);
    
    // Inactive Filter State
    const [showInactiveOnly, setShowInactiveOnly] = useState(false);
    
    // Deep Insights State
    const [showInsights, setShowInsights] = useState(false);
    const [insights, setInsights] = useState<any>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    useEffect(() => {
        loadSchools();
    }, []);

    useEffect(() => {
        let result = schools;

        // 1. Filter by Inactivity (Example: 30 Days)
        if (showInactiveOnly) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            result = result.filter(s => {
                if (!s.lastActive) return true; // Never active is considered inactive
                return new Date(s.lastActive) < thirtyDaysAgo;
            });
        }

        // 2. Filter by Search Query
        if (search) {
            const lower = search.toLowerCase();
            result = result.filter(s => 
                s.name.toLowerCase().includes(lower) || 
                s.adminEmail.toLowerCase().includes(lower) ||
                s.place?.toLowerCase().includes(lower)
            );
        }
        
        setFiltered(result);
    }, [search, schools, showInactiveOnly]);

    const loadSchools = async () => {
        setLoading(true);
        const data = await api.getAllSchools();
        setSchools(data);
        setFiltered(data);
        setLoading(false);
    };

    const handleGrantUpgrade = async () => {
        if (!actionSchool) return;
        if (!confirm(`Upgrade ${actionSchool.name} to PRO for ${upgradeDays} days?`)) return;
        
        const res = await api.manuallyUpgradeSchool(actionSchool.id, true, upgradeDays);
        if (res.success) {
            alert("Upgrade Successful! School now has Pro access.");
            setActionSchool(null);
            loadSchools();
        } else {
            alert("Upgrade Failed");
        }
    };

    const handleRevoke = async () => {
        if (!actionSchool) return;
        if (!confirm(`Revoke PRO access from ${actionSchool.name}?`)) return;
        
        const res = await api.manuallyUpgradeSchool(actionSchool.id, false, 0);
        if (res.success) {
            alert("Access Revoked.");
            setActionSchool(null);
            loadSchools();
        } else {
            alert("Failed");
        }
    };

    const loadInsights = async () => {
        if (!actionSchool) return;
        setInsightsLoading(true);
        const data = await api.getSchoolDeepAnalytics(actionSchool.id);
        setInsights(data);
        setInsightsLoading(false);
        setShowInsights(true);
    };

    const handleDeleteSchool = async () => {
        if (!actionSchool) return;
        const confirmMsg = `CRITICAL WARNING: This will permanently DELETE ${actionSchool.name} and ALL its data.\n\nType 'DELETE' to confirm.`;
        const input = prompt(confirmMsg);
        if (input !== 'DELETE') return;

        const res = await api.deleteSchool(actionSchool.id);
        if (res.success) {
            alert("School Deleted Successfully.");
            setActionSchool(null);
            loadSchools();
        } else {
            alert("Delete Failed: " + res.message);
        }
    };

    const handleResetData = async () => {
        if (!actionSchool) return;
        if (!confirm(`This will wipe all STUDENTS, CLASSES, and MARKS for ${actionSchool.name}.\nThe school account itself will remain.\n\nContinue?`)) return;

        const res = await api.resetSchoolData(actionSchool.id);
        if (res.success) {
            alert("Academic data wiped successfully.");
            loadSchools(); // Refresh counts
        } else {
            alert("Reset Failed: " + res.message);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
            
            {/* Header / Search / Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800 gap-4">
                <div className="flex items-center gap-2">
                    <School className="w-6 h-6 text-blue-500"/>
                    <h2 className="text-xl font-bold text-white">School Manager</h2>
                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-xs">{filtered.length} / {schools.length}</span>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* INACTIVE FILTER BUTTON */}
                    <button 
                        onClick={() => setShowInactiveOnly(!showInactiveOnly)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2 whitespace-nowrap ${showInactiveOnly ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                    >
                        <Clock className="w-3 h-3"/> Inactive {showInactiveOnly && '(>30d)'}
                    </button>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"/>
                        <input 
                            type="text" 
                            placeholder="Search schools..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <GlassCard className="flex-1 p-0 bg-slate-900 border-slate-800 overflow-hidden">
                <div className="overflow-y-auto h-[600px] custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800 text-slate-400 text-xs uppercase sticky top-0 z-10">
                            <tr>
                                <th className="p-4">School Name</th>
                                <th className="p-4">Admin Email</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Students</th>
                                <th className="p-4 text-center">Expiry</th>
                                <th className="p-4 text-center">Last Active</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                            {filtered.map(school => {
                                const isInactive = !school.lastActive || (new Date().getTime() - new Date(school.lastActive).getTime()) > (30 * 24 * 60 * 60 * 1000);
                                return (
                                    <tr key={school.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 font-bold text-white">
                                            {school.name}
                                            <p className="text-[10px] text-slate-500 font-normal">{school.place}</p>
                                        </td>
                                        <td className="p-4">{school.adminEmail}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${school.isPro ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                                {school.isPro ? 'PRO' : 'FREE'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">{school.studentCount}</td>
                                        <td className="p-4 text-center font-mono text-xs">
                                            {school.expiryDate ? new Date(school.expiryDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className={`p-4 text-center font-mono text-xs ${isInactive ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                                            {school.lastActive ? new Date(school.lastActive).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => setActionSchool(school)}
                                                className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                                            >
                                                <MoreVertical className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">No schools found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* ACTION MODAL */}
            {actionSchool && !showInsights && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <GlassCard className="w-full max-w-md border-t-4 border-t-blue-500 bg-slate-900">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">{actionSchool.name}</h3>
                                <p className="text-sm text-slate-400">{actionSchool.isPro ? 'Currently Pro Plan' : 'Currently Free Plan'}</p>
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3"/> Last Active: {actionSchool.lastActive ? new Date(actionSchool.lastActive).toDateString() : 'Never'}
                                </p>
                            </div>
                            <button onClick={() => setActionSchool(null)} className="text-slate-500 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={loadInsights}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-700"
                            >
                                {insightsLoading ? 'Scanning...' : <><Activity className="w-4 h-4 text-blue-400"/> View Deep Intelligence</>}
                            </button>

                            <div className="h-px bg-slate-800 my-2"></div>

                            {!actionSchool.isPro ? (
                                <div className="bg-green-900/20 p-4 rounded-xl border border-green-900/50">
                                    <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Grant Special Upgrade</h4>
                                    <p className="text-xs text-green-200 mb-3">Give this school free PRO access.</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            value={upgradeDays} 
                                            onChange={e => setUpgradeDays(parseInt(e.target.value))}
                                            className="w-20 bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm"
                                        />
                                        <button onClick={handleGrantUpgrade} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold rounded py-2 text-xs">
                                            Grant {upgradeDays} Days
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-900/20 p-4 rounded-xl border border-red-900/50">
                                    <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Revoke Access</h4>
                                    <p className="text-xs text-red-200 mb-3">Downgrade this school back to Free Plan.</p>
                                    <button onClick={handleRevoke} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded py-2 text-xs">
                                        Revoke Pro Status
                                    </button>
                                </div>
                            )}

                            {/* DANGER ZONE */}
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <p className="text-[10px] font-bold text-red-500 uppercase mb-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3"/> Danger Zone
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleResetData}
                                        className="flex-1 py-2 bg-slate-800 border border-red-900/30 text-red-400 hover:bg-red-900/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <Eraser className="w-3 h-3"/> Wipe Data
                                    </button>
                                    <button 
                                        onClick={handleDeleteSchool}
                                        className="flex-1 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3"/> Delete School
                                    </button>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* DEEP INSIGHTS MODAL */}
            {showInsights && insights && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in-up">
                    <GlassCard className="w-full max-w-4xl h-[90vh] bg-slate-950 border border-slate-800 flex flex-col p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                    <BarChart2 className="w-5 h-5 text-blue-500"/>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">{actionSchool?.name}</h3>
                                    <p className="text-xs text-slate-400">Data Intelligence Report</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInsights(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* 1. HEALTH SCORE */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className={`p-4 rounded-xl border ${insights.health.riskLevel === 'HIGH' ? 'bg-red-900/20 border-red-900/50' : insights.health.riskLevel === 'MEDIUM' ? 'bg-orange-900/20 border-orange-900/50' : 'bg-green-900/20 border-green-900/50'}`}>
                                    <p className="text-xs font-bold uppercase opacity-70 mb-1 text-white">Churn Risk</p>
                                    <h3 className={`text-2xl font-black ${insights.health.riskLevel === 'HIGH' ? 'text-red-500' : insights.health.riskLevel === 'MEDIUM' ? 'text-orange-500' : 'text-green-500'}`}>{insights.health.riskLevel}</h3>
                                    <p className="text-[10px] text-slate-400 mt-2">Inactive for {insights.health.daysInactive} days</p>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Database Footprint</p>
                                    <h3 className="text-2xl font-black text-white">{insights.storage.usedMB} MB</h3>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                        <div className="bg-blue-500 h-full rounded-full" style={{width: `${insights.storage.loadPercent}%`}}></div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">{insights.storage.loadPercent}% of Free Tier Limit</p>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">User Base</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <h3 className="text-2xl font-black text-white">{insights.counts.students}</h3>
                                            <p className="text-[10px] text-slate-400">Students</p>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="text-xl font-bold text-slate-300">{insights.counts.teachers}</h3>
                                            <p className="text-[10px] text-slate-400">Teachers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. FEATURE HEATMAP */}
                            <div>
                                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-500"/> Feature Usage Heatmap</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Results</p>
                                        <p className="text-xl font-bold text-white mt-1">{insights.features.results}</p>
                                        <p className="text-[10px] text-slate-600">Marks Entries</p>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Fees</p>
                                        <p className="text-xl font-bold text-white mt-1">{insights.features.fees}</p>
                                        <p className="text-[10px] text-slate-600">Transactions</p>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Exams</p>
                                        <p className="text-xl font-bold text-white mt-1">{insights.features.exams}</p>
                                        <p className="text-[10px] text-slate-600">Created</p>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                        <p className="text-xs text-slate-500 font-bold uppercase">Notices</p>
                                        <p className="text-xl font-bold text-white mt-1">{insights.features.communication}</p>
                                        <p className="text-[10px] text-slate-600">Sent</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. TECHNICAL DETAILS */}
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-slate-500"/> Technical Metadata</h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500">School ID</span>
                                        <span className="font-mono text-slate-300">{actionSchool?.id}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500">Joined On</span>
                                        <span className="font-mono text-slate-300">{new Date(insights.health.joinedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500">Admin Email</span>
                                        <span className="font-mono text-slate-300">{actionSchool?.adminEmail}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                                        <span className="text-slate-500">Plan Type</span>
                                        <span className={`font-bold ${actionSchool?.isPro ? 'text-green-400' : 'text-slate-400'}`}>{actionSchool?.isPro ? 'PRO' : 'FREE'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default SchoolManagerTab;
