
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Student, Marks, ProfileRequest, SchoolConfig, AssessmentProgram } from '../types';
import { Award, BarChart3, User, Bell, Crown, Clock, Wallet, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import HomeTab from './student_tabs/HomeTab';
import AnalyticsTab from './student_tabs/AnalyticsTab';
import ProfileTab from './student_tabs/ProfileTab';
import ExamsTab from './student_tabs/ExamsTab';
import StudentFees from './student_tabs/StudentFees';
import StudentAssessments from './student_tabs/StudentAssessments';
import StudentAttendance from './student_tabs/StudentAttendance';

interface Props {
  user: Student;
}

const DashboardStudent: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'profile' | 'exams' | 'fees' | 'behavior' | 'attendance'>('home');
  const [marks, setMarks] = useState<Marks | null>(null);
  const [assessments, setAssessments] = useState<AssessmentProgram[]>([]);
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [currentUser, setCurrentUser] = useState(user);
  const [greeting, setGreeting] = useState('Welcome');

  // Check if modules are enabled
  const [modules, setModules] = useState({ fees: true, assessments: true });

  // THEME STATE
  const [themeClass, setThemeClass] = useState('bg-blue-600 shadow-blue-600/20');

  useEffect(() => {
    setCurrentUser(user);
    loadData();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [user]);

  // Apply Theme
  useEffect(() => {
      // Handle preferences stored in socialLinks hack
      const prefs = currentUser.socialLinks as any || {}; 
      const theme = prefs._preferences?.theme || 'DEFAULT';
      
      switch(theme) {
          case 'NEON': setThemeClass('bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/30'); break;
          case 'GOLD': setThemeClass('bg-gradient-to-r from-yellow-600 to-amber-700 shadow-amber-500/30'); break;
          case 'DARK_ROYAL': setThemeClass('bg-slate-900 shadow-slate-900/50'); break;
          case 'MINIMAL': setThemeClass('bg-white border-b border-slate-200 !text-slate-900 shadow-sm'); break;
          default: setThemeClass(currentUser.isPremium ? 'bg-slate-900 shadow-2xl shadow-yellow-900/20' : 'bg-blue-600 shadow-xl shadow-blue-600/20');
      }
  }, [currentUser]);

  const loadData = async () => {
    const m = await api.getMarks(user.id, 'Term 1');
    setMarks(m);
    
    const reqs = await api.getStudentRequests(user.id);
    setRequests(reqs);
    const cfg = await api.getSchoolConfig();
    setSchoolConfig(cfg);
    
    const settings = await api.getGlobalSettings();
    setModules({ 
        fees: settings['MODULE_FEES'] !== 'FALSE', 
        assessments: settings['MODULE_ASSESSMENTS'] !== 'FALSE' 
    });
    
    // Load Assessments targeted for this class
    const allAssessments = await api.getAssessmentPrograms(undefined, user.classId);
    setAssessments(allAssessments);

    loadNotices();
  };
  
  const loadNotices = async () => {
      const schoolId = localStorage.getItem('school_id');
      if (!schoolId) return;
      const posts = await api.getCampusPosts(schoolId, 'NOTICE');
      setNotifications(posts.map(p => ({ 
          id: p.id, type: 'NOTICE', title: p.title || 'Official Notice', desc: p.message, date: p.createdAt, author: p.authorName
      })));
      
      const lastView = localStorage.getItem('notif_last_view');
      const hasNew = posts.some(n => !lastView || new Date(n.createdAt).getTime() > parseInt(lastView));
      setUnreadCount(hasNew ? posts.length : 0);
  }
  
  const handleOpenNotifications = () => {
      setShowNotifModal(true);
      setUnreadCount(0);
      localStorage.setItem('notif_last_view', Date.now().toString());
  };

  const isMinimal = themeClass.includes('bg-white');

  return (
    <div className={`pb-24 min-h-screen transition-all duration-500 font-sans ${currentUser.isPremium && !isMinimal ? 'bg-slate-950 text-white' : 'bg-slate-50 dark:bg-slate-900'}`}>
      
      {/* --- HEADER SECTION --- */}
      <div className={`pt-10 pb-20 px-6 rounded-b-[40px] relative overflow-hidden transition-all duration-500 shadow-xl ${themeClass}`}>
          {/* Background Pattern */}
          {!isMinimal && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>}
          
          <div className="relative z-10 flex justify-between items-start">
              <div>
                  <p className={`${isMinimal ? 'text-slate-500' : 'text-white/80'} text-xs font-bold mb-1 uppercase tracking-wide opacity-80`}>{greeting}</p>
                  <h1 className={`text-3xl font-black tracking-tight flex items-center gap-2 ${isMinimal ? 'text-slate-900' : 'text-white'}`}>
                      {(currentUser.name || 'Student').split(' ')[0]} 
                      {currentUser.isPremium && <Crown className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />}
                  </h1>
                  <p className={`${isMinimal ? 'text-slate-500 bg-slate-100' : 'text-white/60 bg-black/10'} text-xs font-mono mt-1 font-medium inline-block px-2 py-0.5 rounded`}>
                      Reg: {currentUser.regNo}
                  </p>
              </div>
              
              <div className="flex items-center gap-3">
                  <button onClick={handleOpenNotifications} className={`relative p-2.5 rounded-full transition-colors backdrop-blur-sm ${isMinimal ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                      <Bell className="w-5 h-5"/>
                      {unreadCount > 0 && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-transparent rounded-full animate-pulse"></div>}
                  </button>
                  <div className="relative">
                      <div className={`w-14 h-14 rounded-full border-4 ${currentUser.isPremium ? 'border-yellow-400' : (isMinimal ? 'border-slate-200' : 'border-white/30')} overflow-hidden bg-white shadow-lg`}>
                          {currentUser.photoUrl ? (
                              <img src={currentUser.photoUrl} className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><User className="w-6 h-6"/></div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- FLOATING NAVIGATION --- */}
      <div className="px-6 -mt-8 relative z-20 mb-6">
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-lg flex justify-between gap-1 border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
              {[
                  { id: 'home', label: 'Home', icon: <Award className="w-4 h-4"/> }, 
                  { id: 'exams', label: 'Exams', icon: <Clock className="w-4 h-4"/> }, 
                  { id: 'analytics', label: 'Marks', icon: <BarChart3 className="w-4 h-4"/> },
                  { id: 'attendance', label: 'Presence', icon: <Calendar className="w-4 h-4"/> },
                  ...(modules.fees ? [{ id: 'fees', label: 'Fees', icon: <Wallet className="w-4 h-4"/> }] : []),
                  ...(modules.assessments ? [{ id: 'behavior', label: 'Stars', icon: <Star className="w-4 h-4"/> }] : []),
                  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4"/> }
              ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full text-xs font-bold transition-all min-w-[80px] ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400'}`}
                  >
                      {tab.icon}
                      <span>{tab.label}</span>
                  </button>
              ))}
          </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="px-4">
          {activeTab === 'home' && (
              <HomeTab 
                  user={currentUser} 
                  marks={marks} 
                  assessments={assessments} 
                  schoolConfig={schoolConfig}
              />
          )}
          {activeTab === 'exams' && <ExamsTab user={currentUser} />}
          {activeTab === 'analytics' && <AnalyticsTab marks={marks} user={currentUser} />}
          {activeTab === 'attendance' && <StudentAttendance user={currentUser} />}
          {activeTab === 'fees' && <StudentFees user={currentUser} />}
          {activeTab === 'behavior' && <StudentAssessments user={currentUser} />}
          {activeTab === 'profile' && (
              <ProfileTab 
                  user={currentUser} 
                  schoolConfig={schoolConfig}
                  onUpdateUser={(u) => setCurrentUser(prev => ({...prev, ...u}))}
              />
          )}
      </div>

      {/* --- NOTIFICATION MODAL --- */}
      {showNotifModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 h-[70vh] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Bell className="w-5 h-5"/> Notifications</h3>
                      <button onClick={() => setShowNotifModal(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">{n.type}</span>
                                  <span className="text-[10px] text-slate-400">{new Date(n.date).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{n.title}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{n.desc}</p>
                              <p className="text-[10px] text-slate-400 mt-2 text-right">- {n.author}</p>
                          </div>
                      )) : (
                          <div className="text-center py-20 text-slate-400">
                              <Bell className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                              <p className="text-sm">No new notifications</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default DashboardStudent;
