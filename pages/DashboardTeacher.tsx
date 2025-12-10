
import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { Student, Marks, ClassData, SubjectConfig, SchoolConfig, AssessmentProgram, FeeStructure } from '../types';
import { UserCog, Edit2, Camera, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExamsTab from './teacher_tabs/ExamsTab';
import StudentsTab from './teacher_tabs/StudentsTab';
import MarksTab from './teacher_tabs/MarksTab';
import ReportsTab from './teacher_tabs/ReportsTab';
import SubjectsTab from './teacher_tabs/SubjectsTab';
import AttendanceTab from './teacher_tabs/AttendanceTab';
import { calculateGrade } from '../services/utils';

interface Props {
  user: ClassData & { isPro?: boolean };
}

const DashboardTeacher: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'students' | 'subjects' | 'marks' | 'exams' | 'attendance' | 'assessments' | 'reports' | 'fees'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingAdmissions, setPendingAdmissions] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Marks>>({});
  const [loading, setLoading] = useState(false);
  const [currentSubjects, setCurrentSubjects] = useState<SubjectConfig[]>(user.subjects);
  
  const [isSubmitted, setIsSubmitted] = useState(user.submissionStatus === 'SUBMITTED');
  const [canEditSubjects, setCanEditSubjects] = useState(false);
  const [profileData, setProfileData] = useState({ name: user.teacherName || '', photo: user.teacherPhoto || '' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState<SchoolConfig | null>(null);
  
  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Assessment & Fees State
  const [assessments, setAssessments] = useState<AssessmentProgram[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [canManageFees, setCanManageFees] = useState(false);

  useEffect(() => {
    loadData();
    loadAssessments();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const cfg = await api.getSchoolConfig();
    setSchoolConfig(cfg);
    setCanEditSubjects(cfg?.allowTeacherSubjectEdit ?? false);
    
    const feeRole = cfg?.feeManagerRole || 'ADMIN';
    const fees = await api.getFeeStructures(user.id);
    const allowedFees = fees.filter(f => f.collectedBy === 'TEACHER' || f.collectedBy === 'BOTH' || (feeRole === 'TEACHER' || feeRole === 'HYBRID'));
    setFeeStructures(allowedFees);
    setCanManageFees(allowedFees.length > 0);

    const stuList = await api.getStudentsByClass(user.id);
    setStudents(stuList);
    
    const marksMap: Record<string, Marks> = {};
    for (const stu of stuList) {
        const m = await api.getMarks(stu.id, 'Term 1');
        if (m) marksMap[stu.id] = m;
        else {
            marksMap[stu.id] = {
                studentId: stu.id,
                subjects: currentSubjects.reduce((acc, sub) => ({...acc, [sub.name]: 0}), {}),
                total: 0,
                grade: 'F',
                term: 'Term 1'
            }
        }
    }
    setMarks(marksMap);
    
    const admissions = await api.getPendingAdmissions(user.id);
    setPendingAdmissions(admissions);
    
    if (admissions.length > 0 && (cfg?.admissionApprover === 'TEACHER' || cfg?.admissionApprover === 'BOTH' || !cfg?.admissionApprover)) {
        setActiveTab('students');
    }

    setLoading(false);
  };
  
  const loadAssessments = async () => {
      const progs = await api.getAssessmentPrograms('TEACHER', user.id);
      setAssessments(progs);
  };

  const handleMarkChange = (studentId: string, subject: string, value: string) => {
      if (isSubmitted) return;
      let finalVal: string | number = '';
      if (value !== '') {
          const upperVal = value.toUpperCase();
          const numVal = parseInt(value);
          if (isNaN(numVal) && upperVal !== 'A' && upperVal !== 'AB') return;
          if (upperVal === 'A' || upperVal === 'AB') {
              finalVal = upperVal;
          } else {
              finalVal = numVal;
          }
      }
      setMarks(prev => {
          const studentMarks = { ...prev[studentId] };
          studentMarks.subjects = { ...studentMarks.subjects, [subject]: finalVal };
          
          // Calculate Total
          const total = (Object.values(studentMarks.subjects) as (number | string)[]).reduce((a, b) => {
              const val = typeof b === 'number' ? b : 0;
              return (a as number) + val;
          }, 0) as number;
          studentMarks.total = total;
          
          // Logic for Max Total and Fail Check
          let maxTotal = 0;
          let isFail = false;
          Object.keys(studentMarks.subjects).forEach(subName => {
              const subConfig = currentSubjects.find(s => s.name === subName);
              if (subConfig) {
                  maxTotal += subConfig.maxMarks;
                  const currentMark = studentMarks.subjects[subName];
                  const numericMark = typeof currentMark === 'number' ? currentMark : 0;
                  if (numericMark < subConfig.passMarks) isFail = true;
              }
          });

          // Use Centralized Utility
          const { grade, resultStatus } = calculateGrade(total, maxTotal, isFail);
          
          studentMarks.grade = grade;
          studentMarks.resultStatus = resultStatus;

          return { ...prev, [studentId]: studentMarks };
      });
  };

  const handleSaveAll = async () => {
      setLoading(true);
      for (const m of Object.values(marks) as Marks[]) {
          await api.saveMarks(m);
      }
      setLoading(false);
      alert("All marks saved successfully!");
  };

  const handleSubmitResults = async () => {
      if (isSubmitted) { 
          const reason = prompt("Request Admin to unlock this class? (Optional: Enter reason)");
          if (reason !== null) {
              const res = await api.createSystemFeedback(`Unlock Request for Class ${user.name}. Reason: ${reason}`, 'SUPPORT', user.teacherName || 'Teacher');
              if (res.success) alert("Unlock Request Sent to Admin!");
              else alert("Failed to send request.");
          }
          return; 
      }
      
      if(!window.confirm("Verify & Submit to Admin?")) return;
      const res = await api.toggleClassSubmission(user.id, true);
      if (res.success) { setIsSubmitted(true); alert("Submitted Successfully!"); }
  };

  const handleAdmissionAction = async (studentId: string, action: 'APPROVE' | 'REJECT') => {
      if (action === 'APPROVE') {
          const res = await api.verifyStudent(studentId, user.teacherName || 'Teacher');
          if (res.success) {
             loadData(); 
             setPendingAdmissions(prev => prev.filter(p => p.id !== studentId));
          } else alert(res.message);
      } else {
          if(!window.confirm("Reject this admission?")) return;
          const res = await api.rejectAdmission(studentId);
          if (res.success) setPendingAdmissions(prev => prev.filter(p => p.id !== studentId));
      }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
      if (!window.confirm(`Delete ${name}?`)) return;
      const res = await api.deleteStudent(studentId);
      if (res.success) loadData();
      else alert("Failed: " + res.message);
  };

  const handleCleanJunk = async () => {
      if (!window.confirm("Warning: This will delete all Unverified (Ghost) students in your class. Continue?")) return;
      const res = await api.deleteUnverifiedStudents(user.id);
      if (res.success) { alert("Cleaned successfully!"); loadData(); } 
      else alert("Failed to clean.");
  };

  const handleAddSubject = async (name: string, max: number, pass: number) => {
      const updated = [...currentSubjects, { name, maxMarks: max, passMarks: pass }];
      const res = await api.updateClassSubjects(user.id, updated);
      if (res.success) {
          setCurrentSubjects(updated);
          loadData();
          return true;
      } else {
          alert("Failed to add subject");
          return false;
      }
  };

  const handleDeleteSubject = async (idx: number) => {
      if (!window.confirm("Delete this subject? Existing marks will be hidden.")) return;
      const updated = [...currentSubjects];
      updated.splice(idx, 1);
      const res = await api.updateClassSubjects(user.id, updated);
      if (res.success) {
          setCurrentSubjects(updated);
          loadData();
      }
  };

  const handlePostNotice = async (title: string, msg: string, scheduledAt?: string) => {
      const authorName = user.teacherName || user.name || 'Teacher';
      const scheduledIso = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
      const res = await api.createCampusPost(user.schoolId || '', authorName, msg, 'TEACHER', 'NOTICE', title, scheduledIso);
      if (res.success) return true;
      alert("Failed: " + res.message);
      return false;
  };

  const handleUpdateProfile = async () => {
      const res = await api.updateClassDetails(user.id, { teacherName: profileData.name, teacherPhoto: profileData.photo });
      if (res.success) setEditingProfile(false);
      else alert("Failed update");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      if (!user.isPro) { alert("Photo upload is an Elite/Pro feature."); return; }
      const file = e.target.files[0];
      const res = await api.uploadImage(file, 'teachers');
      if (res.success && res.publicUrl) {
          setProfileData(prev => ({ ...prev, photo: res.publicUrl! }));
      } else alert("Upload failed: " + res.message);
  };

  const getStats = () => ({ total: students.length, male: students.filter(s => s.gender === 'Male').length, female: students.filter(s => s.gender === 'Female').length });
  const stats = getStats();

  const renderContextStats = () => {
      if (activeTab === 'students') return (<div className="flex items-center gap-2"><div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/40 px-2 py-1 rounded"><span className="text-xs font-bold text-blue-700 dark:text-blue-300">{stats.male} B</span></div><div className="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/40 px-2 py-1 rounded"><span className="text-xs font-bold text-pink-700 dark:text-pink-300">{stats.female} G</span></div></div>);
      if (activeTab === 'marks') {
          const graded = (Object.values(marks) as Marks[]).filter(m => m.total > 0).length;
          return (<div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded text-xs"><span className="text-slate-500 font-bold uppercase">Progress:</span><span className={`font-bold ${graded === stats.total ? 'text-green-600' : 'text-slate-800'}`}>{graded} / {stats.total}</span></div>);
      }
      return null;
  };

  return (
    <div className="pb-20 relative animate-fade-in-up">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full">
              <div className="relative group shrink-0">
                  {profileData.photo ? <img src={profileData.photo} className="w-12 h-12 rounded-lg object-cover"/> : <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300"><UserCog className="w-6 h-6"/></div>}
                  {editingProfile && <label className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center cursor-pointer"><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} /><Camera className="w-4 h-4 text-white"/></label>}
              </div>
              <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-black text-blue-600 dark:text-blue-400">{user.name}</h1>
                  {editingProfile ? <div className="space-y-1"><input className="bg-slate-50 border rounded px-1 text-xs" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}/><div className="flex gap-1"><button onClick={handleUpdateProfile} className="text-[10px] bg-green-100 text-green-700 px-2 rounded">Save</button><button onClick={() => setShowPasswordModal(true)} className="text-[10px] bg-yellow-100 text-yellow-700 px-2 rounded">Pass</button></div></div> : <div className="flex items-center gap-2"><p className="text-xs font-bold text-slate-500">{profileData.name || 'Class Teacher'}</p><button onClick={() => setEditingProfile(true)} className="text-slate-400"><Edit2 className="w-3 h-3"/></button></div>}
              </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
              <button onClick={() => navigate(`/school/${user.schoolId}`)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600" title="Visit School Home"><Home className="w-4 h-4"/></button>
              {renderContextStats()}
          </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center mb-6 overflow-x-auto pb-2">
          <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg max-w-full">
              {['students', 'subjects', 'marks', 'attendance', 'exams', 'assessments', 'reports', 'fees'].filter(t => t !== 'fees' || canManageFees).map(t => (
                  <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-md text-sm font-bold capitalize whitespace-nowrap ${activeTab === t ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>{t}</button>
              ))}
          </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'students' && (
          <StudentsTab 
              user={user} 
              students={students} 
              pendingAdmissions={pendingAdmissions} 
              stats={stats}
              sortingMethod={schoolConfig?.sortingMethod}
              onRefresh={loadData}
              onDeleteStudent={handleDeleteStudent}
              onAdmissionAction={handleAdmissionAction}
              onCleanJunk={handleCleanJunk}
          />
      )}

      {activeTab === 'marks' && (
          <MarksTab 
              students={students} 
              marks={marks} 
              subjects={currentSubjects} 
              isSubmitted={isSubmitted} 
              loading={loading}
              onMarkChange={handleMarkChange} 
              onSaveAll={handleSaveAll} 
              onSubmitResults={handleSubmitResults} 
          />
      )}
      
      {activeTab === 'reports' && (
          <ReportsTab onPostNotice={handlePostNotice} />
      )}
      
      {activeTab === 'subjects' && (
          <SubjectsTab 
              subjects={currentSubjects} 
              onAddSubject={handleAddSubject} 
              onDeleteSubject={handleDeleteSubject} 
              canEdit={canEditSubjects} 
          />
      )}
      
      {activeTab === 'exams' && <ExamsTab classId={user.id} />}
      {activeTab === 'attendance' && <AttendanceTab students={students} classId={user.id} />}
      {activeTab === 'assessments' && <div className="p-4 text-center">Assessments Module</div>}
      {activeTab === 'fees' && <div className="p-4 text-center">Fees Module</div>}

    </div>
  );
};

export default DashboardTeacher;
