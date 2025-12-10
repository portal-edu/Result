
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassUI';
import { api } from '../../services/api';
import { TrendingUp, Share2, Globe, FileText, ArrowRight, Zap } from 'lucide-react';

const GrowthTab: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGrowthStats();
    }, []);

    const loadGrowthStats = async () => {
        // In a real implementation, this would be a dedicated RPC call
        // For now, we mock it or fetch basic data if we added the 'getAttributionStats'
        const data = await api.getAttributionStats();
        setStats(data);
        setLoading(false);
    };

    if (loading) return <div>Loading Growth Metrics...</div>;

    const sources = stats?.sources || [];
    const totalReferred = sources.reduce((acc: number, curr: any) => acc + curr.count, 0);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400"/> Viral Loop Analytics
            </h2>

            {/* Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                <GlassCard className="bg-slate-900 border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Total Referrals</p>
                    <h3 className="text-4xl font-black text-white mt-1">{totalReferred}</h3>
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% this week</p>
                </GlassCard>
                <GlassCard className="bg-slate-900 border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Top Source</p>
                    <h3 className="text-2xl font-black text-white mt-1">{sources[0]?.source || 'None'}</h3>
                    <p className="text-xs text-slate-400 mt-2">{sources[0]?.count || 0} Signups</p>
                </GlassCard>
                <GlassCard className="bg-slate-900 border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase">Attributed Revenue</p>
                    <h3 className="text-4xl font-black text-white mt-1">₹{stats?.revenue.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-2">From viral channels</p>
                </GlassCard>
            </div>

            {/* Source Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="bg-slate-900 border-slate-800">
                    <h3 className="font-bold text-white mb-6">Acquisition Channels</h3>
                    <div className="space-y-4">
                        {sources.map((src: any, idx: number) => {
                            const percent = (src.count / totalReferred) * 100;
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1 text-slate-300">
                                        <span className="font-bold">{src.source.replace('_', ' ')}</span>
                                        <span>{src.count} ({percent.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : 'bg-slate-600'}`} 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                        {sources.length === 0 && <p className="text-slate-500 text-sm text-center">No referral data yet.</p>}
                    </div>
                </GlassCard>

                <GlassCard className="bg-slate-900 border-slate-800">
                    <h3 className="font-bold text-white mb-6">Top Viral Schools</h3>
                    <div className="space-y-4">
                        {stats?.topReferrers?.map((ref: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-400 text-xs">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{ref.name}</p>
                                        <p className="text-[10px] text-slate-500">ID: {ref.id.substring(0,8)}...</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-400">{ref.count}</p>
                                    <p className="text-[10px] text-slate-500">Refers</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topReferrers || stats.topReferrers.length === 0) && <p className="text-slate-500 text-sm text-center">No top referrers.</p>}
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default GrowthTab;
