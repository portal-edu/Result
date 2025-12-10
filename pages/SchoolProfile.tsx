
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { SchoolProfile, AdCampaign, CampusPost } from '../types';
import { Loader2, MapPin, Users, GraduationCap, Building2, CheckCircle, Search, ShieldCheck, Crown, ExternalLink, Megaphone, MessageCircle, Heart, Lock, Share2, Copy, Instagram, Linkedin, User, QrCode, ArrowRight, Info, X, Quote, Sparkles, LayoutDashboard, ArrowLeft, Globe, Facebook, Youtube, BookOpen, Star } from 'lucide-react';
import { GlassButton, GlassCard } from '../components/GlassUI';

// --- TEMPLATE COMPONENTS ---

// 1. MODERN (Original Bento Grid)
const TemplateModern: React.FC<TemplateProps> = ({ profile, ad, posts, liveCount, handlers }) => (
    <div className="max-w-7xl mx-auto p-4 pt-6 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-min">
            
            {/* HERO */}
            <div className="md:col-span-3 row-span-2 relative h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden group">
                {profile.coverPhoto ? (
                    <img src={profile.coverPhoto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                    <div className={`w-full h-full bg-gradient-to-br from-${profile.themeColor || 'blue'}-900 to-slate-900`}></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 w-full">
                    <div className="flex items-end gap-6">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl flex-shrink-0">
                            {profile.logoUrl ? <img src={profile.logoUrl} className="w-full h-full object-contain rounded-xl"/> : <Building2 className="w-full h-full text-white/50"/>}
                        </div>
                        <div className="mb-2">
                            <h1 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tight mb-2 shadow-lg">{profile.name}</h1>
                            <p className="text-white/80 flex items-center gap-2 text-sm md:text-base font-medium">
                                <MapPin className="w-4 h-4 text-red-400"/> {profile.place || 'Kerala, India'}
                                {profile.isPro && <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/50 flex items-center gap-1"><Crown className="w-3 h-3"/> VERIFIED</span>}
                            </p>
                            {/* Socials */}
                            {profile.socials && (
                                <div className="flex gap-3 mt-3">
                                    {profile.socials.website && <a href={profile.socials.website} target="_blank" className="text-white/70 hover:text-white"><Globe className="w-5 h-5"/></a>}
                                    {profile.socials.instagram && <a href={profile.socials.instagram} target="_blank" className="text-white/70 hover:text-pink-400"><Instagram className="w-5 h-5"/></a>}
                                    {profile.socials.facebook && <a href={profile.socials.facebook} target="_blank" className="text-white/70 hover:text-blue-400"><Facebook className="w-5 h-5"/></a>}
                                    {profile.socials.youtube && <a href={profile.socials.youtube} target="_blank" className="text-white/70 hover:text-red-500"><Youtube className="w-5 h-5"/></a>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                    {liveCount} viewing
                </div>
                <button onClick={handlers.share} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full text-white transition-all">
                    <Share2 className="w-5 h-5"/>
                </button>
            </div>

            {/* STATS */}
            <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-6 shadow-sm">
                <div className="text-center"><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Students</p><h3 className="text-4xl font-black text-slate-800 dark:text-white">{profile.stats.students}</h3></div>
                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
                <div className="text-center"><p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Faculty</p><h3 className="text-4xl font-black text-slate-800 dark:text-white">{profile.stats.teachers}</h3></div>
                <button onClick={handlers.register} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"><GraduationCap className="w-5 h-5"/> Admission</button>
            </div>

            {/* ABOUT */}
            <div className="md:col-span-1 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] p-6 border border-blue-100 dark:border-blue-900/30">
                <Quote className="w-8 h-8 text-blue-300 mb-2 fill-current opacity-50"/>
                <p className="text-sm text-slate-600 dark:text-blue-100 leading-relaxed font-medium">{profile.description || "A premier educational institution."}</p>
            </div>

            {/* RESULT */}
            <div onClick={handlers.checkResult} className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-500/20 transition-transform hover:-translate-y-1">
                <div className="absolute top-0 right-0 p-8 opacity-20 transition-transform group-hover:scale-110 duration-700"><Search className="w-32 h-32 text-white"/></div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div><div className="bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 backdrop-blur-md">STUDENT PORTAL</div><h2 className="text-3xl font-black mb-2">Check Results</h2><p className="opacity-80 max-w-sm text-sm">View performance & download marklists.</p></div>
                    <div className="flex items-center gap-2 font-bold mt-6"><span>Open Portal</span> <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/></div>
                </div>
            </div>

            {/* NOTICE BOARD */}
            <div className="md:col-span-2 row-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-red-500"/> Campus Buzz</h3><span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{posts.length} Posts</span></div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-[300px]">
                    {posts.length > 0 ? posts.map(post => (
                        <div key={post.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300">{post.authorName[0]}</div><span className="text-xs font-bold text-slate-700 dark:text-slate-300">{post.authorName}</span></div><span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span></div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{post.title}</h4><p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{post.message}</p>
                        </div>
                    )) : <div className="text-center py-10 text-slate-400 text-xs">No updates yet.</div>}
                </div>
            </div>

            {/* AD SPACE */}
            {ad && (
                <div className="md:col-span-1 row-span-2 relative group cursor-pointer" onClick={() => window.open(ad.targetUrl, '_blank')}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 rounded-[2rem]"></div>
                    <img src={ad.imageUrl} className="w-full h-full object-cover rounded-[2rem] transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute bottom-4 left-4 z-20"><span className="bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded mb-2 inline-block">SPONSORED</span><p className="text-white text-xs font-medium leading-tight">Check out this offer</p></div>
                </div>
            )}
        </div>
    </div>
);

// 2. CLASSIC (Academic/Formal)
const TemplateClassic: React.FC<TemplateProps> = ({ profile, ad, posts, handlers }) => (
    <div className="bg-slate-50 min-h-screen font-serif text-slate-800">
        {/* Classic Header */}
        <header className="bg-white border-b-4 border-blue-800 p-6 shadow-sm">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    {profile.logoUrl && <img src={profile.logoUrl} className="w-20 h-20 object-contain" />}
                    <div>
                        <h1 className="text-3xl font-bold uppercase text-blue-900 tracking-wide">{profile.name}</h1>
                        <p className="text-sm italic text-slate-600 flex items-center gap-1"><MapPin className="w-3 h-3"/> {profile.place}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handlers.checkResult} className="px-6 py-3 bg-blue-900 text-white font-sans text-sm font-bold uppercase tracking-wider hover:bg-blue-800">Student Portal</button>
                    <button onClick={handlers.register} className="px-6 py-3 border-2 border-blue-900 text-blue-900 font-sans text-sm font-bold uppercase tracking-wider hover:bg-blue-50">Admissions</button>
                </div>
            </div>
        </header>

        <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
                {/* Welcome Message */}
                <section className="bg-white p-8 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-blue-100 pb-2">About Our Institution</h2>
                    <p className="text-lg leading-relaxed text-slate-700">{profile.description}</p>
                    {profile.socials && (
                        <div className="flex gap-4 mt-6">
                            {profile.socials.website && <a href={profile.socials.website} className="text-blue-900 hover:underline flex items-center gap-1"><Globe className="w-4 h-4"/> Website</a>}
                            {profile.socials.facebook && <a href={profile.socials.facebook} className="text-blue-800 hover:underline flex items-center gap-1"><Facebook className="w-4 h-4"/> Facebook</a>}
                        </div>
                    )}
                </section>

                {/* News & Updates (List View) */}
                <section>
                    <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2"><Megaphone className="w-5 h-5"/> News & Circulars</h2>
                    <div className="space-y-3">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white p-4 border-l-4 border-blue-600 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between text-sans text-xs text-slate-500 mb-1">
                                    <span className="font-bold uppercase">{post.category}</span>
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-800 mb-1">{post.title}</h3>
                                <p className="text-sm text-slate-600">{post.message}</p>
                            </div>
                        ))}
                        {posts.length === 0 && <p className="italic text-slate-500">No recent updates.</p>}
                    </div>
                </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <div className="bg-blue-900 text-white p-6 text-center">
                    <h3 className="font-sans font-bold text-lg mb-4">Quick Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><div className="text-3xl font-bold">{profile.stats.students}</div><div className="text-xs uppercase opacity-70">Students</div></div>
                        <div><div className="text-3xl font-bold">{profile.stats.teachers}</div><div className="text-xs uppercase opacity-70">Faculty</div></div>
                    </div>
                </div>

                {ad && (
                    <div className="border p-2 bg-white" onClick={() => window.open(ad.targetUrl, '_blank')}>
                        <p className="text-[10px] text-slate-400 text-center mb-1 uppercase">Advertisement</p>
                        <img src={ad.imageUrl} className="w-full h-auto" />
                    </div>
                )}

                <div className="bg-white p-6 border border-slate-200">
                    <h3 className="font-bold text-blue-900 mb-4">Faculty Directory</h3>
                    <ul className="space-y-3">
                        {profile.teachers.map(t => (
                            <li key={t.id} className="flex items-center gap-3 text-sm">
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-sans font-bold text-slate-600">{t.name[0]}</div>
                                <div><p className="font-bold text-slate-800">{t.name}</p><p className="text-xs text-slate-500">{t.className}</p></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

// 3. VIBRANT (Playful/Modern)
const TemplateVibrant: React.FC<TemplateProps> = ({ profile, ad, posts, handlers }) => (
    <div className="min-h-screen bg-[#FFF0F5] font-sans selection:bg-pink-200">
        {/* Floating Header */}
        <div className="max-w-5xl mx-auto pt-6 px-4">
            <header className="bg-white/80 backdrop-blur-xl rounded-full p-3 pl-6 shadow-xl flex justify-between items-center sticky top-4 z-50">
                <div className="flex items-center gap-3">
                    {profile.logoUrl ? <img src={profile.logoUrl} className="w-10 h-10 rounded-full bg-white shadow-sm object-contain"/> : <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full"></div>}
                    <h1 className="font-black text-slate-800 tracking-tight">{profile.name}</h1>
                </div>
                <button onClick={handlers.share} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-pink-100 text-slate-600 hover:text-pink-600 transition-colors"><Share2 className="w-5 h-5"/></button>
            </header>

            {/* Hero Blob */}
            <div className="mt-8 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-[3rem] p-8 md:p-16 text-white text-center relative overflow-hidden shadow-2xl shadow-pink-500/30">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
                
                <h2 className="text-4xl md:text-6xl font-black mb-6 relative z-10">Welcome to Our World</h2>
                <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8 relative z-10">{profile.description}</p>
                
                <div className="flex justify-center gap-4 relative z-10">
                    <button onClick={handlers.checkResult} className="bg-white text-pink-600 px-8 py-4 rounded-full font-black shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                        <Star className="w-5 h-5 fill-current"/> Check Results
                    </button>
                    <button onClick={handlers.register} className="bg-black/20 text-white px-8 py-4 rounded-full font-bold hover:bg-black/30 transition-colors backdrop-blur-md">
                        Join Us
                    </button>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-8 pb-20">
                {/* Stats */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl border-b-8 border-yellow-400 flex justify-around items-center">
                    <div className="text-center">
                        <div className="text-5xl font-black text-slate-800">{profile.stats.students}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Happy Students</div>
                    </div>
                    <div className="w-px h-16 bg-slate-100"></div>
                    <div className="text-center">
                        <div className="text-5xl font-black text-slate-800">{profile.stats.teachers}</div>
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mentors</div>
                    </div>
                </div>

                {/* Socials */}
                <div className="bg-indigo-600 rounded-[2rem] p-8 shadow-xl text-white flex flex-col justify-center items-center text-center">
                    <h3 className="font-bold text-xl mb-4">Connect With Us</h3>
                    <div className="flex gap-4">
                        {profile.socials?.instagram && <a href={profile.socials.instagram} className="p-3 bg-white/20 rounded-full hover:bg-white hover:text-indigo-600 transition-all"><Instagram className="w-6 h-6"/></a>}
                        {profile.socials?.facebook && <a href={profile.socials.facebook} className="p-3 bg-white/20 rounded-full hover:bg-white hover:text-indigo-600 transition-all"><Facebook className="w-6 h-6"/></a>}
                        {profile.socials?.youtube && <a href={profile.socials.youtube} className="p-3 bg-white/20 rounded-full hover:bg-white hover:text-indigo-600 transition-all"><Youtube className="w-6 h-6"/></a>}
                        {!profile.socials && <p className="text-sm opacity-50">Social links coming soon!</p>}
                    </div>
                </div>

                {/* Feed */}
                <div className="md:col-span-2 bg-white rounded-[2rem] p-8 shadow-xl">
                    <h3 className="font-black text-2xl text-slate-800 mb-6 flex items-center gap-3">
                        <span className="bg-pink-100 text-pink-600 p-2 rounded-xl"><Megaphone className="w-6 h-6"/></span> Latest Buzz
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        {posts.slice(0,3).map(post => (
                            <div key={post.id} className="bg-slate-50 p-6 rounded-3xl hover:bg-pink-50 transition-colors cursor-pointer group">
                                <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-full text-slate-400 mb-2 inline-block shadow-sm">{new Date(post.createdAt).toLocaleDateString()}</span>
                                <h4 className="font-bold text-lg text-slate-800 group-hover:text-pink-600 transition-colors mb-2">{post.title}</h4>
                                <p className="text-sm text-slate-500 line-clamp-3">{post.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// 4. DARK (Cyber/Tech)
const TemplateDark: React.FC<TemplateProps> = ({ profile, ad, posts, handlers }) => (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-mono selection:bg-cyan-500/30">
        <div className="max-w-6xl mx-auto p-6">
            <nav className="flex justify-between items-center border-b border-slate-800 pb-6 mb-12">
                <div className="flex items-center gap-4">
                    {profile.logoUrl ? <img src={profile.logoUrl} className="w-12 h-12 bg-slate-900 rounded-lg border border-slate-800"/> : <div className="w-12 h-12 bg-cyan-900/20 border border-cyan-500/50 rounded-lg"></div>}
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-widest uppercase">{profile.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-cyan-500">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span> SYSTEM ONLINE
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handlers.checkResult} className="px-6 py-2 border border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black transition-all font-bold text-sm uppercase tracking-wider">Access Portal</button>
                </div>
            </nav>

            <div className="grid md:grid-cols-12 gap-8">
                {/* Main Col */}
                <div className="md:col-span-8 space-y-8">
                    <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-1 bg-gradient-to-r from-transparent to-cyan-500"></div>
                        <h2 className="text-2xl font-bold text-white mb-4">Transmission</h2>
                        <p className="text-slate-400 leading-relaxed">{profile.description}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 border-l-2 border-cyan-500 pl-3">Live Feed</h3>
                        <div className="space-y-4">
                            {posts.map(post => (
                                <div key={post.id} className="p-4 bg-slate-900 border-l-2 border-slate-800 hover:border-cyan-500 transition-all">
                                    <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono">
                                        <span>User: {post.authorName}</span>
                                        <span>{new Date(post.createdAt).toISOString().split('T')[0]}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-1">{post.title}</h4>
                                    <p className="text-sm text-slate-400">{post.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="md:col-span-4 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 text-center">
                            <div className="text-3xl font-bold text-white">{profile.stats.students}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Users</div>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 text-center">
                            <div className="text-3xl font-bold text-white">{profile.stats.teachers}</div>
                            <div className="text-[10px] text-slate-500 uppercase">Admins</div>
                        </div>
                    </div>

                    <button onClick={handlers.register} className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold uppercase tracking-widest transition-all">
                        Initiate Admission
                    </button>

                    {ad && (
                        <div className="border border-slate-800 p-2 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => window.open(ad.targetUrl, '_blank')}>
                            <img src={ad.imageUrl} className="w-full grayscale hover:grayscale-0 transition-all"/>
                            <div className="bg-slate-900 p-2 text-center text-[10px] text-slate-500">SPONSORED_CONTENT</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

// --- MAIN PAGE COMPONENT ---

interface TemplateProps {
    profile: SchoolProfile;
    ad: AdCampaign | null;
    posts: CampusPost[];
    liveCount?: number;
    handlers: {
        share: () => void;
        register: () => void;
        checkResult: () => void;
    }
}

const SchoolProfilePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<SchoolProfile | null>(null);
    const [ad, setAd] = useState<AdCampaign | null>(null);
    const [posts, setPosts] = useState<CampusPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveCount, setLiveCount] = useState(0);
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        if (slug) {
            loadData(slug);
        }
    }, [slug]);

    const loadData = async (s: string) => {
        setLoading(true);
        const data = await api.getSchoolPublicProfile(s);
        if (data) {
            setProfile(data);
            const [campaign, feed] = await Promise.all([
                api.getRandomActiveAd(),
                api.getCampusPosts(data.id, 'NOTICE')
            ]);
            setAd(campaign);
            setPosts(feed);
            
            // Check auth
            const storedId = localStorage.getItem('school_id');
            if (storedId === data.id) setCanEdit(true);
        }
        setLoading(false);
    };

    // Live Simulator
    useEffect(() => {
        if (!profile) return;
        const base = Math.max(1, Math.floor(profile.stats.students * 0.05));
        setLiveCount(base);
        const interval = setInterval(() => {
            setLiveCount(prev => Math.max(1, prev + Math.floor(Math.random() * 5) - 2));
        }, 5000);
        return () => clearInterval(interval);
    }, [profile]);

    const handlers = {
        share: async () => {
            const shareData = { title: profile?.name, text: `Check out ${profile?.name}`, url: window.location.href };
            if (navigator.share) try { await navigator.share(shareData); } catch {} else { navigator.clipboard.writeText(window.location.href); alert("Link Copied!"); }
        },
        register: () => navigate(`/register?schoolId=${profile?.id}`),
        checkResult: () => navigate('/result')
    };

    const handleDashboardReturn = () => navigate('/login');

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-10 h-10 animate-spin text-blue-500"/></div>;
    if (!profile) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">School Not Found</div>;

    return (
        <>
            {/* Template Switcher Logic */}
            {profile.layoutTemplate === 'CLASSIC' && <TemplateClassic profile={profile} ad={ad} posts={posts} handlers={handlers} />}
            {profile.layoutTemplate === 'VIBRANT' && <TemplateVibrant profile={profile} ad={ad} posts={posts} handlers={handlers} />}
            {profile.layoutTemplate === 'DARK' && <TemplateDark profile={profile} ad={ad} posts={posts} handlers={handlers} />}
            {(!profile.layoutTemplate || profile.layoutTemplate === 'MODERN' || profile.layoutTemplate === 'STANDARD') && <TemplateModern profile={profile} ad={ad} posts={posts} liveCount={liveCount} handlers={handlers} />}

            {/* Floating Return Button */}
            {canEdit && (
                <div className="fixed top-4 left-4 z-[100] animate-fade-in-up">
                    <button onClick={handleDashboardReturn} className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 hover:bg-black transition-all border border-white/20 font-bold text-sm">
                        <ArrowLeft className="w-4 h-4"/> Dashboard
                    </button>
                </div>
            )}
        </>
    );
};

export default SchoolProfilePage;
