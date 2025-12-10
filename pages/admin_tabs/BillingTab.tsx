
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../../components/GlassUI';
import { SchoolConfig, WalletTransaction } from '../../types';
import { CreditCard, History, Plus, Wallet, RefreshCw, Loader2, CheckCircle2, ShieldCheck, XCircle, Zap, Star, Crown, Gift } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
    schoolConfig: SchoolConfig;
}

const BillingTab: React.FC<Props> = ({ schoolConfig }) => {
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [balance, setBalance] = useState(schoolConfig.walletBalance || 0);
    const [loading, setLoading] = useState(false);
    
    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState('');
    const [paymentStep, setPaymentStep] = useState<'INIT' | 'PROCESSING' | 'SUCCESS' | 'FAILED'>('INIT');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const hist = await api.getWalletHistory();
        setTransactions(hist);
        
        // Refresh School Config to get updated balance
        const config = await api.getSchoolConfig();
        if (config) setBalance(config.walletBalance || 0);
        
        setLoading(false);
    };

    const handlePayment = async () => {
        if (!rechargeAmount) return;
        const credits = parseInt(rechargeAmount);
        const cost = credits; // 1 Credit = 1 Rupee for simplicity
        
        if (cost < 50) {
            setErrorMsg("Minimum purchase is 50 Credits");
            return;
        }
        
        setPaymentStep('PROCESSING');
        setErrorMsg('');
        
        try {
            // Call Cashfree Integration
            const result = await api.initializePayment(cost, schoolConfig.phone || '9999999999', schoolConfig.schoolName);
            
            if (result.success) {
                const updateRes = await api.rechargeWallet(credits, "Credit Pack Purchase");
                if (updateRes.success) {
                    setBalance(updateRes.newBalance!);
                    setPaymentStep('SUCCESS');
                    loadData();
                } else {
                    setErrorMsg("Payment Successful but Credit Update Failed. Contact Support.");
                    setPaymentStep('FAILED');
                }
            } else {
                setErrorMsg(result.message || "Transaction Failed");
                setPaymentStep('FAILED');
            }
        } catch (e: any) {
            setErrorMsg(e.message || "Unknown error occurred");
            setPaymentStep('FAILED');
        }
    };

    const CreditPack = ({ amount, bonus, popular, label }: { amount: number, bonus?: number, popular?: boolean, label: string }) => (
        <button 
            onClick={() => setRechargeAmount(amount.toString())}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${rechargeAmount === amount.toString() ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'}`}
        >
            {popular && <div className="absolute -top-3 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Most Popular</div>}
            <div className={`p-2 rounded-full mb-2 ${rechargeAmount === amount.toString() ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                <Zap className="w-5 h-5 fill-current"/>
            </div>
            <div className="text-lg font-black text-slate-800 dark:text-white">{amount}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Credits</div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">₹{amount}</div>
            {bonus && <div className="text-[9px] text-green-600 font-bold mt-1">+{bonus} Free</div>}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            
            {/* 1. CREDIT BALANCE CARD */}
            <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><Zap className="w-40 h-40 fill-white"/></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Feature Credits</p>
                                <h2 className="text-5xl font-black tracking-tight flex items-baseline gap-1">
                                    {balance} <span className="text-lg font-bold text-slate-400">CR</span>
                                </h2>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/10">
                                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400"/>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Use these credits for AI Generation & SMS Alerts.</p>
                    </div>

                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10 flex gap-3">
                        <button 
                            onClick={() => { setShowPaymentModal(true); setPaymentStep('INIT'); setRechargeAmount(''); setErrorMsg(''); }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all"
                        >
                            <Plus className="w-4 h-4"/> Buy Credits
                        </button>
                        <button 
                            onClick={loadData}
                            className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}/>
                        </button>
                    </div>
                </GlassCard>

                {/* 2. COST SHEET & BENEFITS */}
                <GlassCard className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500"/> Current Plan
                        </h3>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Starter Free</span>
                    </div>
                    
                    <div className="space-y-3 relative z-10 text-sm flex-1">
                        <div className="flex justify-between items-center p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                            <span className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2"><Gift className="w-4 h-4 text-green-600"/> 50 Students Free</span>
                            <span className="font-bold text-green-600 text-xs">FOREVER</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="text-slate-600 dark:text-slate-300">Publish Result (51+)</span>
                            <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">1 Credit / student</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="text-slate-600 dark:text-slate-300">AI Question Gen</span>
                            <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">5 Credits / request</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span className="text-slate-600 dark:text-slate-300">Class Tests / Unit Tests</span>
                            <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs">FREE</span>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* 3. TRANSACTION HISTORY */}
            <div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500"/> Credit History
                </h3>
                <GlassCard className="p-0 overflow-hidden min-h-[200px]">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Activity</th>
                                    <th className="p-4 text-right">Credits</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {transactions.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 text-slate-500 text-xs">{new Date(t.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 font-medium text-slate-700 dark:text-slate-300">{t.description}</td>
                                        <td className={`p-4 text-right font-bold ${t.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                                            {t.type === 'CREDIT' ? '+' : '-'} {t.amount}
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-slate-400 text-sm">No credit history found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </div>

            {/* PAYMENT MODAL (CREDIT STORE) */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <GlassCard className="w-full max-w-md relative overflow-hidden bg-white dark:bg-slate-900">
                        <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        
                        {paymentStep === 'INIT' && (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800">
                                        <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400 fill-current"/>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Credit Store</h3>
                                    <p className="text-sm text-slate-500">Choose a pack to top up.</p>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <CreditPack amount={100} label="Starter" />
                                    <CreditPack amount={500} label="Standard" popular />
                                    <CreditPack amount={1000} label="Pro" bonus={100} />
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 mb-6">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Or Enter Custom Amount</label>
                                    <div className="relative">
                                        <Zap className="absolute left-3 top-3 w-4 h-4 text-slate-400 fill-slate-400"/>
                                        <input 
                                            type="number" 
                                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="50+" 
                                            value={rechargeAmount} 
                                            onChange={e => setRechargeAmount(e.target.value)}
                                        />
                                        <div className="absolute right-3 top-3 text-xs font-bold text-slate-400">Credits</div>
                                    </div>
                                    {errorMsg && <p className="text-xs text-red-500 font-bold mt-2">{errorMsg}</p>}
                                </div>

                                <GlassButton onClick={handlePayment} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl font-bold text-lg flex items-center justify-center gap-2">
                                    Buy {rechargeAmount || '0'} Credits
                                </GlassButton>
                                
                                <p className="text-[10px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-3 h-3"/> Secured Payment Gateway
                                </p>
                            </>
                        )}

                        {paymentStep === 'PROCESSING' && (
                            <div className="text-center py-12">
                                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6"/>
                                <h3 className="font-bold text-xl text-slate-800 dark:text-white">Processing Payment...</h3>
                                <p className="text-sm text-slate-500 mt-2">Please complete the transaction in the secure window.</p>
                            </div>
                        )}

                        {paymentStep === 'SUCCESS' && (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                    <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400"/>
                                </div>
                                <h3 className="font-bold text-2xl text-slate-800 dark:text-white">Success!</h3>
                                <p className="text-slate-500 mt-2">Credits have been added to your wallet.</p>
                                <GlassButton onClick={() => setShowPaymentModal(false)} className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white">Continue to Dashboard</GlassButton>
                            </div>
                        )}

                        {paymentStep === 'FAILED' && (
                            <div className="text-center py-12">
                                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6"/>
                                <h3 className="font-bold text-xl text-slate-800 dark:text-white">Payment Failed</h3>
                                <p className="text-sm text-red-500 mt-2 font-bold">{errorMsg || "Transaction was cancelled."}</p>
                                <div className="flex gap-3 mt-8">
                                    <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 text-slate-500 font-bold text-sm bg-slate-100 dark:bg-slate-800 rounded-xl">Close</button>
                                    <button onClick={() => setPaymentStep('INIT')} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">Retry</button>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default BillingTab;
