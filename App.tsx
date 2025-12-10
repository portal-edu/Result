
import React, { useState, useEffect, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import SetupWizard from './pages/SetupWizard';
import Login from './pages/Login';
import PublicResult from './pages/PublicResult';
import PublicRegistration from './pages/PublicRegistration';
import PortalResolver from './pages/PortalResolver';
import SchoolProfilePage from './pages/SchoolProfile'; 
import AdvertisePage from './pages/Advertise'; 
import AffiliateProgram from './pages/AffiliateProgram';
import Legal from './pages/Legal';
import SqlCommand from './sqlCommand'; 
import { LoadingScreen } from './components/GlassUI';
import SupportChat from './components/SupportChat';
import Footer from './components/Footer'; 
import InstallPWA from './components/InstallPWA';
import { Role } from './types';
import { GraduationCap, LogOut, Sun, Moon } from 'lucide-react';
import { saveSupabaseConfig } from './services/supabaseClient';
import { api } from './services/api';

// --- LAZY LOADED DASHBOARDS (Code Splitting) ---
const DashboardTeacher = React.lazy(() => import('./pages/DashboardTeacher'));
const DashboardAdmin = React.lazy(() => import('./pages/DashboardAdmin'));
const DashboardStudent = React.lazy(() => import('./pages/DashboardStudent'));
const DashboardSuperAdmin = React.lazy(() => import('./pages/DashboardSuperAdmin'));
const DashboardPrincipal = React.lazy(() => import('./pages/DashboardPrincipal')); 
const PrincipalSetup = React.lazy(() => import('./pages/PrincipalSetup')); 

const Layout: React.FC<{ children: React.ReactNode; user: any; role: Role | null; onLogout: () => void; theme: string; toggleTheme: () => void }> = ({ children, user, role, onLogout, theme, toggleTheme }) => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [themeColor, setThemeColor] = useState('blue');
    
    const location = useLocation();
    
    const hideNavbarRoutes = ['/', '/setup', '/login', '/register', '/principal-setup'];
    const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
    const hideFooter = location.pathname.startsWith('/dashboard') || hideNavbarRoutes.includes(location.pathname);

    useEffect(() => {
        const updateManifest = (name: string, iconUrl: string, schoolId: string) => {
            const manifestLink = document.getElementById('app-manifest') as HTMLLinkElement;
            const appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement;
            const favicon = document.getElementById('app-favicon') as HTMLLinkElement;

            if (iconUrl) {
                if (appleIcon) appleIcon.href = iconUrl;
                if (favicon) favicon.href = iconUrl;
            }

            const dynamicManifest = {
                name: name,
                short_name: name.length > 12 ? name.substring(0, 12) + '...' : name,
                start_url: window.location.origin + window.location.pathname + `#/login?s=${schoolId}`, 
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#2563eb",
                icons: [
                    {
                        src: iconUrl || "https://cdn-icons-png.flaticon.com/512/2997/2997235.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: iconUrl || "https://cdn-icons-png.flaticon.com/512/2997/2997235.png",
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            };

            const stringManifest = JSON.stringify(dynamicManifest);
            const blob = new Blob([stringManifest], { type: 'application/json' });
            const manifestURL = URL.createObjectURL(blob);
            
            if (manifestLink) {
                manifestLink.setAttribute('href', manifestURL);
            }
        };

        const storedLogo = localStorage.getItem('school_logo');
        const storedName = localStorage.getItem('school_name'); 
        const storedId = localStorage.getItem('school_id');

        if (user && user.schoolName && (user.logoUrl || user.schoolLogoUrl)) {
             const logo = user.logoUrl || user.schoolLogoUrl;
             updateManifest(user.schoolName, logo, user.schoolId || user.id);
             setLogoUrl(logo);
        } 
        else if (storedLogo && storedName && storedId) {
             setLogoUrl(storedLogo);
             updateManifest(storedName, storedLogo, storedId);
        }
        
    }, [user]);

    useEffect(() => {
        const storedLogo = localStorage.getItem('school_logo');
        const storedTheme = localStorage.getItem('school_theme');
        if (storedLogo) setLogoUrl(storedLogo);
        if (storedTheme) setThemeColor(storedTheme);
        
        if (user && user.logoUrl) setLogoUrl(user.logoUrl);
        if (user && user.schoolLogoUrl) setLogoUrl(user.schoolLogoUrl); 
    }, [user]);

    useEffect(() => {
        const handleStorageChange = () => {
             const storedLogo = localStorage.getItem('school_logo');
             const storedTheme = localStorage.getItem('school_theme');
             if (storedLogo) setLogoUrl(storedLogo);
             if (storedTheme) setThemeColor(storedTheme);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const getThemeColorClass = () => {
        switch(themeColor) {
            case 'purple': return 'bg-purple-600';
            case 'green': return 'bg-green-600';
            case 'orange': return 'bg-orange-600';
            case 'red': return 'bg-red-600';
            default: return 'bg-blue-600';
        }
    };

    const schoolHomeLink = (user && (user.schoolId || user.id)) 
        ? `/school/${user.schoolId || user.id}` 
        : localStorage.getItem('school_id') 
            ? `/school/${localStorage.getItem('school_id')}` 
            : "/";

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col">
          
          {!shouldHideNavbar && (
              <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex justify-between h-16">
                          <div className="flex items-center">
                              <Link to={schoolHomeLink} className="flex-shrink-0 flex items-center gap-2">
                                  {logoUrl ? (
                                      <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 p-0.5" />
                                  ) : (
                                      <div className={`${getThemeColorClass()} text-white p-1.5 rounded-lg`}>
                                         <GraduationCap className="w-6 h-6" />
                                      </div>
                                  )}
                                  <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight hidden md:block">
                                      {user?.schoolName || 'ResultMate'}
                                  </span>
                                   <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight md:hidden">
                                      {user?.schoolName ? (user.schoolName.length > 15 ? user.schoolName.substring(0,12)+'...' : user.schoolName) : 'ResultMate'}
                                  </span>
                              </Link>
                          </div>
                          <div className="flex items-center gap-4">
                              <button 
                                onClick={toggleTheme} 
                                className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Toggle Theme"
                              >
                                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                              </button>
        
                              {user ? (
                                   <div className="flex items-center gap-4">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                                            {role === Role.SUPER_ADMIN ? 'Platform Owner' : role === Role.ADMIN ? 'Admin' : role === Role.PRINCIPAL ? 'Principal' : role === Role.TEACHER ? `Teacher (${user.name})` : user.name}
                                        </span>
                                        <button onClick={onLogout} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
                                            <LogOut className="w-5 h-5" />
                                        </button>
                                   </div>
                              ) : (
                                  <div className="flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                                      <Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400 font-bold whitespace-nowrap">Admin Login</Link>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </nav>
          )}
    
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            <Suspense fallback={<LoadingScreen />}>
                {children}
            </Suspense>
          </div>
          
          {!hideFooter && <Footer />}
          
          <InstallPWA />
          <SupportChat />
      </div>
    );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
      const url = window.location.href;
      
      let configPayload = null;
      if (url.includes('cfg=')) {
          const match = url.match(/[?&]cfg=([^&#]*)/);
          if (match) {
              configPayload = match[1];
          }
      }

      if (configPayload) {
          try {
              const decoded = atob(decodeURIComponent(configPayload));
              const { u, k, s } = JSON.parse(decoded);
              
              if (u && k) {
                  localStorage.setItem('sb_url', u);
                  localStorage.setItem('sb_key', k);
                  if (s) localStorage.setItem('school_id', s);
                  
                  const cleanUrl = window.location.href.replace(/[?&]cfg=[^&#]*/, '');
                  window.history.replaceState({}, document.title, cleanUrl);
                  
                  window.location.reload();
                  return;
              }
          } catch (e) {
              console.error("Invalid Magic Link", e);
          }
      }

      setTimeout(() => setLoadingApp(false), 1000);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = (role: Role, user: any) => {
      setCurrentRole(role);
      const schoolName = user.schoolName || user.name; 
      const userWithSchoolName = { ...user, schoolName };
      
      setCurrentUser(userWithSchoolName);
      
      if (user.logoUrl || user.schoolLogoUrl) {
          localStorage.setItem('school_logo', user.logoUrl || user.schoolLogoUrl);
      }
      if (schoolName) {
          localStorage.setItem('school_name', schoolName);
      }
      if (user.themeColor || user.schoolThemeColor) {
          localStorage.setItem('school_theme', user.themeColor || user.schoolThemeColor);
      }
  };

  const handleLogout = () => {
      setCurrentRole(null);
      setCurrentUser(null);
      window.location.hash = '#/login';
  };

  if (loadingApp) {
      return <LoadingScreen />;
  }

  return (
    <HashRouter>
      <Layout user={currentUser} role={currentRole} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/result" element={<PublicResult />} />
          <Route path="/register" element={<PublicRegistration />} />
          <Route path="/advertise" element={<AdvertisePage />} /> 
          <Route path="/partner" element={<AffiliateProgram />} />
          <Route path="/portal/:slug" element={<PortalResolver />} />
          <Route path="/school/:slug" element={<SchoolProfilePage />} />
          
          <Route path="/principal-setup" element={
              <Suspense fallback={<LoadingScreen />}>
                  <PrincipalSetup />
              </Suspense>
          } /> 
          
          <Route path="/sql" element={<SqlCommand />} />
          <Route path="/privacy" element={<Legal section="privacy" />} />
          <Route path="/terms" element={<Legal section="terms" />} />
          
          <Route path="/dashboard/teacher" element={
              (currentRole === Role.TEACHER && currentUser) 
              ? <DashboardTeacher user={currentUser} /> 
              : <Navigate to="/login" replace />
          } />
          
          <Route path="/dashboard/admin" element={
              (currentRole === Role.ADMIN) 
              ? <DashboardAdmin /> 
              : <Navigate to="/login" replace />
          } />

          <Route path="/dashboard/principal" element={
              (currentRole === Role.PRINCIPAL) 
              ? <DashboardPrincipal /> 
              : <Navigate to="/login" replace />
          } />

          <Route path="/dashboard/superadmin" element={
              (currentRole === Role.SUPER_ADMIN) 
              ? <DashboardSuperAdmin /> 
              : <Navigate to="/login" replace />
          } />

           <Route path="/dashboard/student" element={
              (currentRole === Role.STUDENT && currentUser) 
              ? <DashboardStudent user={currentUser} /> 
              : <Navigate to="/login" replace />
          } />

        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
