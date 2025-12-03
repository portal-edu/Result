

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Landing from './pages/Landing';
import SetupWizard from './pages/SetupWizard';
import Login from './pages/Login';
import DashboardTeacher from './pages/DashboardTeacher';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardStudent from './pages/DashboardStudent';
import DashboardSuperAdmin from './pages/DashboardSuperAdmin';
import PublicResult from './pages/PublicResult';
import PublicRegistration from './pages/PublicRegistration';
import PortalResolver from './pages/PortalResolver';
import { LoadingScreen } from './components/GlassUI';
import { Role } from './types';
import { GraduationCap, LogOut, Sun, Moon } from 'lucide-react';
import { saveSupabaseConfig } from './services/supabaseClient';

const Layout: React.FC<{ children: React.ReactNode; user: any; role: Role | null; onLogout: () => void; theme: string; toggleTheme: () => void }> = ({ children, user, role, onLogout, theme, toggleTheme }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                  <div className="flex items-center">
                      <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                             <GraduationCap className="w-6 h-6" />
                          </div>
                          <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">SchoolResult Pro</span>
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
                                    {role === Role.SUPER_ADMIN ? 'Platform Owner' : role === Role.ADMIN ? 'Administrator' : role === Role.TEACHER ? `Teacher (${user.name})` : user.name}
                                </span>
                                <button onClick={onLogout} className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors">
                                    <LogOut className="w-5 h-5" />
                                </button>
                           </div>
                      ) : (
                          <div className="hidden md:flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                              <Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400">Login</Link>
                              <Link to="/result" className="hover:text-blue-600 dark:hover:text-blue-400">Results</Link>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
      // Improved URL parsing to handle both standard query params and hash-based params
      const url = window.location.href;
      
      // 1. Handle Config (cfg=) - Setup Logic
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
                  
                  // Clean up URL
                  const cleanUrl = window.location.href.replace(/[?&]cfg=[^&#]*/, '');
                  window.history.replaceState({}, document.title, cleanUrl);
                  
                  window.location.reload();
                  return;
              }
          } catch (e) {
              console.error("Invalid Magic Link", e);
          }
      }

      // 2. Handle Slug (s=) - Quick Login Logic
      // Note: We don't need to reload page for this, it's handled in Login.tsx
      // But we just check if we are ready
      
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
      setCurrentUser(user);
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
          <Route path="/portal/:slug" element={<PortalResolver />} />
          
          <Route path="/dashboard/teacher" element={
              (currentRole === Role.TEACHER && currentUser) 
              ? <DashboardTeacher user={currentUser} /> 
              : <Navigate to="/login" />
          } />
          
          <Route path="/dashboard/admin" element={
              (currentRole === Role.ADMIN) 
              ? <DashboardAdmin /> 
              : <Navigate to="/login" />
          } />

          <Route path="/dashboard/superadmin" element={
              (currentRole === Role.SUPER_ADMIN) 
              ? <DashboardSuperAdmin /> 
              : <Navigate to="/login" />
          } />

           <Route path="/dashboard/student" element={
              (currentRole === Role.STUDENT && currentUser) 
              ? <DashboardStudent user={currentUser} /> 
              : <Navigate to="/login" />
          } />

        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;