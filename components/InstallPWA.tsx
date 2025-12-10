
import React, { useEffect, useState } from 'react';
import { Download, X, Share, Smartphone, PlusSquare, ArrowDown } from 'lucide-react';

const InstallPWA: React.FC = () => {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSInstruction, setShowIOSInstruction] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    
    // Custom Branding State
    const [schoolName, setSchoolName] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        // Check local storage for branding context
        const name = localStorage.getItem('school_name');
        const logo = localStorage.getItem('school_logo');
        if (name) setSchoolName(name);
        if (logo) setLogoUrl(logo);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setIsAppInstalled(true);
            return;
        }

        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

        if (isIosDevice) {
            setIsIOS(true);
            setSupportsPWA(true);
        } else {
            // Android / Desktop
            const handler = (e: any) => {
                e.preventDefault();
                setSupportsPWA(true);
                setPromptInstall(e);
            };
            window.addEventListener('beforeinstallprompt', handler);
            return () => window.removeEventListener('beforeinstallprompt', handler);
        }
    }, []);

    const handleInstallClick = (evt: React.MouseEvent) => {
        evt.preventDefault();
        if (isIOS) {
            setShowIOSInstruction(true);
        } else if (promptInstall) {
            promptInstall.prompt();
        }
    };

    if (isAppInstalled || !isVisible || !supportsPWA) return null;

    return (
        <>
            {/* FLOATING INSTALL BANNER */}
            <div className="fixed bottom-4 left-4 right-4 z-[100] animate-fade-in-up md:max-w-sm md:left-auto">
                <div className="bg-slate-900/95 dark:bg-white/95 backdrop-blur text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} className="w-12 h-12 rounded-xl bg-white p-0.5 object-contain" alt="Logo"/>
                        ) : (
                            <div className="bg-blue-600 p-3 rounded-xl shrink-0">
                                <Smartphone className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-sm leading-tight">{schoolName ? `${schoolName} App` : 'ResultMate App'}</p>
                            <p className="text-[10px] opacity-80">{isIOS ? 'Tap to Install on iPhone' : 'Add to Home Screen'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleInstallClick}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-lg"
                        >
                            Get App
                        </button>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 opacity-60"/>
                        </button>
                    </div>
                </div>
            </div>

            {/* iOS INSTRUCTION OVERLAY */}
            {showIOSInstruction && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4" onClick={() => setShowIOSInstruction(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center animate-fade-in-up relative mb-8" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowIOSInstruction(false)} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
                        
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                            <PlusSquare className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Install on iPhone</h3>
                        <p className="text-sm text-slate-500 mb-6">Apple doesn't support direct download buttons. Please follow these 2 steps:</p>
                        
                        <div className="flex flex-col gap-4 text-left bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">1</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">Tap the <Share className="w-4 h-4 inline mx-1"/> <b>Share</b> button below.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-200 dark:bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">2</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">Select <PlusSquare className="w-4 h-4 inline mx-1"/> <b>Add to Home Screen</b>.</span>
                            </div>
                        </div>

                        <div className="animate-bounce text-slate-400 flex flex-col items-center gap-1">
                            <span className="text-xs">Tap here</span>
                            <ArrowDown className="w-5 h-5"/>
                        </div>
                        
                        {/* Pointing arrow specifically positioned for Safari bottom bar */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white dark:border-t-slate-900"></div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstallPWA;
