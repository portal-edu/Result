
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassUI';
import { Activity, Users, LifeBuoy, Settings, Power, BarChart3, LayoutGrid, Database, HardDrive, Shield, Megaphone, School, Zap, FileText } from 'lucide-react';
import OverviewTab from './superadmin_tabs/OverviewTab';
import SupportDeskTab from './superadmin_tabs/SupportDeskTab';
import SystemControlTab from './superadmin_tabs/SystemControlTab';
import InfrastructureTab from './superadmin_tabs/InfrastructureTab';
import StaffTab from './superadmin_tabs/StaffTab';
import MarketingTab from './superadmin_tabs/MarketingTab';
import SchoolManagerTab from './superadmin_tabs/SchoolManagerTab';
import GrowthTab from './superadmin_tabs/GrowthTab';
import ContentTab from './superadmin_tabs/ContentTab';
import { useNavigate } from 'react-router-dom';

const DashboardSuperAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'support' | 'control' | 'infra' | 'staff' | 'marketing' | 'schools' | 'growth' | 'content'>('overview');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const NavItem = ({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`p-3 rounded-xl flex items-center gap-3 text-sm font-bold transition-all w-full text-left ${activeTab === id ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50 shadow-[0_0_10px_rgba(37,99,235,0.2)]' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}
        >
            <Icon className="w-5 h-5"/> {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-20 overflow-hidden">
            {/* Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                        <Activity className="w-6 h-6 text-white animate-pulse"/>
                    </div>
                    <div>
                        <h1 className="font-black text-xl text-white tracking-widest uppercase">Result<span className="text-blue-500">Mate</span></h1>
                        <p className="text-xs font-mono text-slate-500">SUPER ADMIN CONSOLE</p>
                    </div>
                </div>
                
                <button onClick={handleLogout} className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-2 border border-red-900/50 px-3 py-1.5 rounded-full hover:bg-red-900/20 transition-all">
                    <Power className="w-3 h-3"/> DISCONNECT
                </button>
            </div>

            <div className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-slate-900/80 backdrop-blur border-r border-slate-800 p-4 flex flex-col gap-2 overflow-y-auto">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 mt-2 pl-2">Operations</p>
                    <NavItem id="overview" label="Mission Control" icon={LayoutGrid} />
                    <NavItem id="growth" label="Growth & Viral" icon={Zap} />
                    <NavItem id="schools" label="School Manager" icon={School} />
                    <NavItem id="content" label="Content Moderation" icon={FileText} />
                    <NavItem id="marketing" label="Marketing" icon={Megaphone} />
                    <NavItem id="staff" label="Staff & Roles" icon={Users} />
                    
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 mt-4 pl-2">Technical</p>
                    <NavItem id="infra" label="Infrastructure" icon={HardDrive} />
                    <NavItem id="control" label="System Control" icon={Settings} />
                    
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 mt-4 pl-2">Support</p>
                    <NavItem id="support" label="Support Desk" icon={LifeBuoy} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative bg-slate-950">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none fixed"></div>
                    
                    {activeTab === 'overview' && <OverviewTab />}
                    {activeTab === 'growth' && <GrowthTab />}
                    {activeTab === 'schools' && <SchoolManagerTab />}
                    {activeTab === 'content' && <ContentTab />}
                    {activeTab === 'marketing' && <MarketingTab />}
                    {activeTab === 'support' && <SupportDeskTab />}
                    {activeTab === 'control' && <SystemControlTab />}
                    {activeTab === 'infra' && <InfrastructureTab />}
                    {activeTab === 'staff' && <StaffTab />}
                </div>
            </div>
        </div>
    );
};

export default DashboardSuperAdmin;
