
import React, { useEffect, useState, Suspense } from 'react';
import { api } from '../services/api';
import { SchoolConfig, ClassData } from '../types';
import { LayoutDashboard, CheckCircle2, Megaphone, LogOut, UserCheck, ShieldAlert, Wallet, Menu, X, GraduationCap } from 'lucide-react';
import { LoadingScreen } from '../components/GlassUI';
import { useNavigate } from 'react-router-dom';

// Import Tabs
const PrincipalOverview = React.lazy(() => import('./principal_tabs/PrincipalOverview'));
const PrincipalApproval = React.lazy(() => import('./principal_tabs/PrincipalApproval'));
const PrincipalTeachers = React.lazy(() => import('./principal_tabs/PrincipalTeachers'));
const PrincipalNotices = React.lazy(() => import('./principal_tabs/PrincipalNotices'));
const PrincipalDiscipline = React.lazy(() => import('./principal_tabs/PrincipalDiscipline'));
const PrincipalFees = React.lazy(() => import('./principal_tabs/PrincipalFees'));

const DashboardPrincipal: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'approval' | 'teachers' | 'notices' | 'discipline' | 'fees'>('overview');
    const [config, setConfig] = useState<SchoolConfig | null>(null);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile responsiveness

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [conf, clsList] = await Promise.all([
            api.getSchoolConfig(),
            api.getClasses()
        ]);
        setConfig(conf);
        setClasses(clsList);
        setLoading(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const menuItems = [
        { id: 'overview', label: 'Dashboard & Analytics', icon: LayoutDashboard },
        { id: 'approval', label: 'Result Approval', icon: CheckCircle2 },
        { id: 'teachers', label: 'Teacher Monitoring', icon: UserCheck },
        { id: 'notices', label: 'Official Notices', icon: Megaphone },
        { id: 'discipline', label: 'Student Discipline', icon: ShieldAlert },
        { id: 'fees', label: 'Fee Oversight', icon: Wallet },
    ];

    if (loading) return <LoadingScreen />;
    if (!config) return null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans">
            
            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static shrink-0`}>
                <div className="h-full flex flex-col">
                    {/* Brand */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-white"/>
                            </div>
                            <div>
                                <h1 className="font-black text-lg tracking-tight leading-none">PRINCIPAL</h1>
                                <p className="text-[10px] text-slate-400 font-medium">Console</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400"><X className="w-5 h-5"/></button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id as any); if(window.innerWidth < 768) setSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                            >
                                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`}/>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-slate-800">
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl text-sm font-bold transition-colors">
                            <LogOut className="w-5 h-5"/> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4 md:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
                        <Menu className="w-6 h-6"/>
                    </button>
                    <h2 className="font-bold text-slate-800 dark:text-white truncate">{config.schoolName}</h2>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{menuItems.find(i => i.id === activeTab)?.label}</h2>
                            <p className="text-slate-500 text-sm">Overview for {config.schoolName}</p>
                        </div>

                        <Suspense fallback={<div className="flex justify-center py-20"><LoadingScreen/></div>}>
                            {activeTab === 'overview' && <PrincipalOverview classes={classes} stats={{}} />}
                            {activeTab === 'approval' && <PrincipalApproval classes={classes} onRefresh={loadData} />}
                            {activeTab === 'teachers' && <PrincipalTeachers />}
                            {activeTab === 'notices' && <PrincipalNotices />}
                            {activeTab === 'discipline' && <PrincipalDiscipline />}
                            {activeTab === 'fees' && <PrincipalFees />}
                        </Suspense>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPrincipal;
