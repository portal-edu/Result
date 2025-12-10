
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Menu, X, ArrowRight, CheckCircle2, Wallet, Sparkles, Star, Crown, Diamond, Flame, MessageCircle } from 'lucide-react';
import { MarketingConfig } from '../../types';

// --- NAVBAR ---
export const LandingNavbar: React.FC<{
    mktConfig: MarketingConfig | null;
    timeLeft: string;
    spotsLeft: number;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (v: boolean) => void;
}> = ({ mktConfig, timeLeft, spotsLeft, mobileMenuOpen, setMobileMenuOpen }) => {
    const navigate = useNavigate();

    return (
        <>
            {/* URGENCY BAR */}
            {mktConfig?.showUrgencyBanner && (
                <div className="bg-slate-900 text-white py-2 px-4 sticky top-0 z-[60] border-b border-slate-800">
                    <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 animate-pulse">
                            <Flame className="w-3 h-3 fill-amber-400"/>
                            <span>HIGH DEMAND!</span>
                        </div>
                        <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
                            <span className="text-xs font-medium whitespace-nowrap">{mktConfig.flashSaleText || "Limited Offer Price:"}</span>
                            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden w-full max-w-[200px] border border-slate-700">
                                <div 
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (spotsLeft / 50) * 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-xs font-bold text-amber-400 whitespace-nowrap">{spotsLeft} Spots Left</span>
                        </div>
                        {timeLeft && <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs text-slate-300">{timeLeft}</span>}
                    </div>
                </div>
            )}

            {/* NAV */}
            <nav className={`fixed w-full z-50 top-0 transition-all duration-300 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 ${mktConfig?.showUrgencyBanner ? 'mt-[40px] md:mt-[36px]' : 'mt-0'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Zap className="w-5 h-5 fill-current"/>
                            </div>
                            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">Result<span className="text-blue-600">Mate</span></span>
                        </div>
                        
                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors">Features</a>
                            <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white transition-colors">Pricing</a>
                            <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600">Login</button>
                            <button onClick={() => navigate('/setup')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                                Create Free Portal
                            </button>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
                                {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Mobile Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 absolute w-full shadow-xl">
                        <div className="flex flex-col gap-4">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-600">Features</a>
                            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-600">Pricing</a>
                            <button onClick={() => navigate('/login')} className="text-sm font-bold text-left text-slate-900">Login</button>
                            <button onClick={() => navigate('/setup')} className="bg-blue-600 text-white py-3 rounded-lg text-sm font-bold w-full">Create Free Portal</button>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

// --- HERO SECTION ---
export const HeroSection: React.FC<{
    mktConfig: MarketingConfig | null;
    Typewriter: React.FC;
}> = ({ mktConfig, Typewriter }) => {
    const navigate = useNavigate();
    return (
        <section className={`pt-32 pb-20 px-4 md:pt-48 md:pb-32 relative overflow-hidden ${mktConfig?.showUrgencyBanner ? 'mt-8' : ''}`}>
            {/* Subtle Background Mesh */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 translate-x-1/3 -translate-y-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/3"></div>
            
            <div className="max-w-7xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Trusted by 500+ Institutes
                </div>
                
                <h1 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight mb-6 animate-fade-in-up tracking-tight">
                    Manage Your <br/>
                    <Typewriter />
                </h1>
                
                <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed px-4">
                    The unified operating system for Schools, Madrassas & Tuitions. 
                    Publish results, collect fees, and manage campus life.
                    <span className="block mt-2 font-bold text-slate-900 dark:text-white">Simple. Secure. Professional.</span>
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                    <button onClick={() => navigate('/setup')} className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform hover:scale-105">
                        Get Started <ArrowRight className="w-5 h-5"/>
                    </button>
                    <button onClick={() => navigate('/login')} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-lg font-bold px-8 py-4 rounded-xl transition-colors">
                        Admin Login
                    </button>
                </div>

                {/* HERO VISUAL (Clean Phone) */}
                <div className="mt-16 relative max-w-xs mx-auto animate-fade-in-up delay-200">
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full"></div>
                    <div className="relative bg-slate-900 rounded-[2.5rem] border-8 border-slate-900 shadow-2xl overflow-hidden">
                        <div className="bg-white dark:bg-slate-800 h-[550px] flex flex-col">
                            {/* Fake App Header */}
                            <div className="bg-blue-600 p-6 pt-10 text-white rounded-b-3xl shadow-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                                    <div className="w-16 h-2 bg-white/20 rounded-full"></div>
                                </div>
                                <h3 className="text-xl font-bold">Result Published</h3>
                                <p className="opacity-80 text-xs">Term 1 Assessment</p>
                            </div>
                            
                            {/* Result Card */}
                            <div className="p-4 space-y-3">
                                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Student</p>
                                        <p className="font-bold text-sm">Fathima R</p>
                                    </div>
                                    <div className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">PASSED</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Maths</span><span className="font-bold">95</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">English</span><span className="font-bold">88</span></div>
                                    <div className="flex justify-between text-sm"><span className="text-slate-500">Science</span><span className="font-bold">92</span></div>
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black text-base">
                                        <span>Total</span><span>94%</span>
                                    </div>
                                </div>
                                <button className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm text-sm">
                                    <MessageCircle className="w-4 h-4"/> Share Result
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- FEATURES SECTION ---
export const FeaturesSection: React.FC = () => {
    return (
        <section id="features" className="py-24 px-4 bg-white dark:bg-slate-950">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Enterprise Features</h2>
                    <p className="text-slate-500 dark:text-slate-400">Professional tools for modern education management.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Feature 1: Results */}
                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 transition-colors group relative overflow-hidden">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm border border-slate-100 dark:border-slate-700">
                            <Zap className="w-6 h-6"/>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Instant Results</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">Publish exam results in one click. Parents check marks using Register Number & DOB. No complex logins.</p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> PDF Report Cards</li>
                            <li className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> WhatsApp Integration</li>
                        </ul>
                    </div>

                    {/* Feature 2: Fees */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 transition-colors">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm border border-slate-100 dark:border-slate-700">
                            <Wallet className="w-6 h-6"/>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Fee Manager</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Track payments, dues, and generate digital receipts instantly. Professional financial tracking.</p>
                    </div>

                    {/* Feature 3: AI */}
                    <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden text-white group">
                        <div className="absolute -right-4 -top-4 bg-blue-600 w-24 h-24 rounded-full blur-[50px] opacity-30"></div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Sparkles className="w-6 h-6 text-blue-300"/>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">AI Paper Generator</h3>
                        <p className="text-slate-400 mb-6 text-sm">Scan a textbook page. Our AI generates questions and options automatically. Save hours of work.</p>
                    </div>

                    {/* Feature 4: Behavior */}
                    <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-100 dark:hover:border-blue-900 transition-colors">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 text-blue-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                    <Star className="w-6 h-6"/>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Behavior Tracking</h3>
                                <p className="text-slate-500 dark:text-slate-400">Track discipline, hygiene, and soft skills. Give parents a complete picture of student development.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- PRICING SECTION ---
export const PricingSection: React.FC<{ mktConfig: MarketingConfig | null }> = ({ mktConfig }) => {
    const navigate = useNavigate();
    const plans = [
        { 
            id: 'FREE', 
            name: 'Starter', 
            price: 'Free', 
            period: 'for first 50 students',
            target: 'Small Centers',
            features: [
                "Up to 50 Students", 
                "Result Publishing", 
                "WhatsApp Links",
                "Basic Reports"
            ],
            cta: "Start Free",
            style: "standard"
        },
        { 
            id: 'SMART', 
            name: 'Growth', 
            price: '₹1', 
            orig: '',
            period: 'per student / term',
            target: 'Schools & Madrassas',
            features: [
                "Unlimited Students", 
                "Pay As You Go", 
                "Fee Management",
                "ID Card Generation",
                "SMS / WhatsApp Alerts"
            ],
            cta: "Create Campus",
            popular: true,
            style: "popular"
        },
        { 
            id: 'PRO', 
            name: 'Institute Pro', 
            price: `₹${mktConfig?.proPlanPrice || '999'}`, 
            orig: '',
            period: '/year + credits',
            target: 'Large Institutes',
            features: [
                "White-label (Your App)", 
                "Custom Domain", 
                "Priority Support",
                "AI Question Generator",
                "Advanced Analytics"
            ],
            cta: "Contact Sales",
            style: "premium"
        }
    ];

    return (
        <section id="pricing" className="py-24 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Transparent Pricing</h2>
                    <p className="text-slate-500 dark:text-slate-400">Start free. Pay only as you grow.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-center">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id} 
                            className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 ${
                                plan.style === 'premium' 
                                ? 'bg-slate-900 text-white shadow-2xl border-slate-700 scale-105 z-20' 
                                : plan.style === 'popular'
                                ? 'bg-white dark:bg-slate-800 shadow-xl border-blue-500 z-10 scale-100 ring-4 ring-blue-500/10'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 scale-95 opacity-90 hover:opacity-100 hover:scale-100'
                            }`}
                        >
                            {/* Premium Shine Effect */}
                            {plan.style === 'premium' && (
                                <div className="absolute top-0 right-0 p-4">
                                    <Crown className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse"/>
                                </div>
                            )}

                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                                    Most Popular
                                </div>
                            )}
                            
                            <div className="mb-6 relative z-10">
                                <h3 className={`font-bold text-lg ${plan.style === 'premium' ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{plan.name}</h3>
                                <p className={`text-xs ${plan.style === 'premium' ? 'text-slate-400' : 'text-slate-500'} mb-4`}>{plan.target}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-4xl font-black ${plan.style === 'premium' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{plan.price}</span>
                                    <span className={`text-sm ${plan.style === 'premium' ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                                </div>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-1 relative z-10">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className={`flex items-start gap-3 text-sm ${plan.style === 'premium' ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.style === 'premium' ? 'text-amber-400' : 'text-blue-600'}`}/>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => navigate('/setup')} 
                                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105 relative z-10 ${
                                    plan.style === 'premium'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-orange-500/20'
                                    : plan.style === 'popular'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                                }`}
                            >
                                {plan.style === 'premium' && <Diamond className="w-4 h-4 inline mr-2 fill-black"/>}
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
