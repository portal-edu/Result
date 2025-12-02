
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton } from '../components/GlassUI';
import { api } from '../services/api';
import { SchoolConfig } from '../types';
import { LayoutDashboard, Users, Shield, Trash2, Crown, Search, Building2, CheckCircle, XCircle, CreditCard, RefreshCw } from 'lucide-react';

const DashboardSuperAdmin: React.FC = () => {
    const [schools, setSchools] = useState<SchoolConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>('requests');

    useEffect(() => {
        loadSchools();
    }, []);

    const loadSchools = async () => {
        setLoading(true);
        const data = await api.getAllSchools();
        setSchools(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to PERMANENTLY DELETE "${name}" and all its data?`)) return;
        const res = await api.deleteSchool(id);
        if (res.success) {
            loadSchools();
        } else {
            alert("Failed to delete: " + res.message);
        }
    };

    const handleTogglePro = async (id: string, currentStatus: boolean) => {
        const res = await api.toggleSchoolStatus(id, currentStatus);
        if (res.success) {
            loadSchools();
        } else {
            alert("Failed to update status");
        }
    };

    const handleApproveUpgrade = async (id: string) => {
        if (!window.confirm("Approve this upgrade request?")) return;
        const res = await api.approveUpgradeRequest(id);
        if (res.success) {
            alert("Approved successfully! License generated.");
            loadSchools();
        } else {
            alert("Failed: " + res.message);
        }
    };

    const handleRejectUpgrade = async (id: string) => {
        if (!window.confirm("Reject this request?")) return;
        const res = await api.rejectUpgradeRequest(id);
        if (res.success) {
            loadSchools();
        } else {
            alert("Failed: " + res.message);
        }
    };

    const filteredSchools = schools.filter(s => 
        s.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const pendingRequests = schools.filter(s => s.paymentStatus === 'PENDING');

    const stats = {
        total: schools.length,
        pro: schools.filter(s => s.isPro).length,
        free: schools.filter(s => !s.isPro).length,
        pending: pendingRequests.length
    };

    return (
        <div className="pb-20 animate-fade-in-up">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Master Control Panel</h2>
                    <p className="text-slate-500 dark:text-slate-400">Welcome, Owner. Manage all registered schools.</p>
                </div>
                 <GlassButton onClick={loadSchools} variant="secondary" className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4"/> Refresh
                 </GlassButton>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                 <GlassCard className="flex items-center gap-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('requests')}>
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-full text-yellow-600 dark:text-yellow-200 relative">
                        <CreditCard className="w-6 h-6"/>
                        {stats.pending > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Requests</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</h3>
                    </div>
                </GlassCard>
                <GlassCard className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 cursor-pointer hover:shadow-md" onClick={() => setActiveTab('all')}>
                    <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-200">
                        <Building2 className="w-6 h-6"/>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Schools</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
                    </div>
                </GlassCard>
                <GlassCard className="flex items-center gap-4 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                    <div className="p-3 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-200">
                        <Crown className="w-6 h-6"/>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pro Licenses</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pro}</h3>
                    </div>
                </GlassCard>
                <GlassCard className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <div className="p-3 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-200">
                        <Users className="w-6 h-6"/>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Free Tier</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.free}</h3>
                    </div>
                </GlassCard>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    License Requests {stats.pending > 0 && `(${stats.pending})`}
                </button>
                <button 
                    onClick={() => setActiveTab('all')}
                    className={`pb-3 px-2 font-medium transition-colors ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                >
                    All Schools
                </button>
            </div>

            {/* CONTENT */}
            {activeTab === 'requests' ? (
                <div className="space-y-4">
                     {pendingRequests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-500"/>
                            <p>No pending license requests.</p>
                        </div>
                     ) : (
                         <div className="grid md:grid-cols-2 gap-4">
                             {pendingRequests.map(school => (
                                 <GlassCard key={school.id} className="border-l-4 border-l-yellow-500">
                                     <div className="flex justify-between items-start mb-4">
                                         <div>
                                             <h3 className="font-bold text-lg text-slate-900 dark:text-white">{school.schoolName}</h3>
                                             <p className="text-sm text-slate-500 dark:text-slate-400">{school.adminEmail}</p>
                                             {school.phone && <p className="text-xs text-slate-400">{school.phone} | {school.place}</p>}
                                         </div>
                                         <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded text-xs font-bold">PENDING</span>
                                     </div>
                                     <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded mb-4 border border-slate-200 dark:border-slate-700">
                                         <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Transaction Ref / UTR</p>
                                         <p className="font-mono font-bold text-slate-800 dark:text-slate-200 text-lg">{school.transactionRef}</p>
                                     </div>
                                     <div className="flex gap-2">
                                         <GlassButton onClick={() => handleApproveUpgrade(school.id!)} className="flex-1 bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                                             <CheckCircle className="w-4 h-4"/> Approve
                                         </GlassButton>
                                         <GlassButton onClick={() => handleRejectUpgrade(school.id!)} variant="secondary" className="flex-1 text-red-500 hover:text-red-600 flex items-center justify-center gap-2">
                                             <XCircle className="w-4 h-4"/> Reject
                                         </GlassButton>
                                     </div>
                                 </GlassCard>
                             ))}
                         </div>
                     )}
                </div>
            ) : (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div className="relative w-full md:w-96">
                            <input 
                                type="text" 
                                placeholder="Search school name or email..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
                        </div>
                    </div>

                    <GlassCard className="p-0 overflow-hidden border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                        <th className="p-4">School Name</th>
                                        <th className="p-4">Admin Email</th>
                                        <th className="p-4 text-center">Plan</th>
                                        <th className="p-4">Joined Date</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading data...</td></tr>
                                    ) : filteredSchools.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500">No schools found matching search.</td></tr>
                                    ) : (
                                        filteredSchools.map(school => (
                                            <tr key={school.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-white dark:bg-slate-900">
                                                <td className="p-4 font-medium text-slate-900 dark:text-white">{school.schoolName}</td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">{school.adminEmail}</td>
                                                <td className="p-4 text-center">
                                                    {school.isPro ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                                                            <Crown className="w-3 h-3"/> PRO
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                            FREE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                                                    {new Date(school.createdAt || '').toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleTogglePro(school.id!, school.isPro)}
                                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title={school.isPro ? "Downgrade to Free" : "Upgrade to Pro"}
                                                        >
                                                            <Shield className="w-4 h-4"/>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(school.id!, school.schoolName)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Delete School"
                                                        >
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </>
            )}
        </div>
    );
};

export default DashboardSuperAdmin;
