
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { api } from '../services/api';
import { Student, Marks, ProfileRequest } from '../types';
import { User, Edit2, Clock, CheckCircle, XCircle, Lock } from 'lucide-react';

interface Props {
  user: Student;
}

const DashboardStudent: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'result' | 'security'>('result');
  const [marks, setMarks] = useState<Marks | null>(null);
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [editMode, setEditMode] = useState<{ field: string, value: string } | null>(null);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    // Load Marks
    const m = await api.getMarks(user.id, 'Term 1'); // Defaulting to Term 1 for now
    setMarks(m);

    // Load Pending Requests
    const reqs = await api.getStudentRequests(user.id);
    setRequests(reqs);
  };

  const handleEditRequest = async () => {
      if (!editMode) return;
      const res = await api.createProfileRequest(user.id, editMode.field, editMode.value);
      if (res.success) {
          alert("Request sent to class teacher for approval.");
          setEditMode(null);
          loadData();
      } else {
          alert("Failed: " + res.message);
      }
  };

  const handleChangePassword = async () => {
      if (!newPassword || newPassword.length < 4) {
          alert("Password too short");
          return;
      }
      const res = await api.changePassword(user.id, newPassword);
      if (res.success) {
          alert("Password updated successfully!");
          setNewPassword('');
      } else {
          alert("Failed: " + res.message);
      }
  };

  const openEdit = (field: string, currentValue: string) => {
      setEditMode({ field, value: currentValue });
  };

  const getFieldLabel = (f: string) => {
      if (f === 'fatherName') return "Father's Name";
      if (f === 'motherName') return "Mother's Name";
      if (f === 'dob') return "Date of Birth";
      return f.charAt(0).toUpperCase() + f.slice(1);
  };

  return (
    <div className="pb-20 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Hello, {user.name}</h2>
             <p className="text-slate-500 dark:text-slate-400">Reg No: {user.regNo}</p>
        </div>
        <div className="flex gap-2">
            <GlassButton variant={activeTab === 'result' ? 'primary' : 'secondary'} onClick={() => setActiveTab('result')}>My Result</GlassButton>
            <GlassButton variant={activeTab === 'profile' ? 'primary' : 'secondary'} onClick={() => setActiveTab('profile')}>My Profile</GlassButton>
            <GlassButton variant={activeTab === 'security' ? 'primary' : 'secondary'} onClick={() => setActiveTab('security')}>Security</GlassButton>
        </div>
      </div>

      {activeTab === 'result' && (
          <div className="animate-fade-in-up">
              {marks ? (
                  <GlassCard className="max-w-3xl mx-auto border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                          <h3 className="font-bold text-xl text-slate-800 dark:text-white">Term 1 Report</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                marks.grade === 'F' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            }`}>
                                Grade: {marks.grade}
                           </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                          {Object.entries(marks.subjects).map(([sub, score]) => (
                              <div key={sub} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg flex justify-between items-center">
                                  <span className="font-medium text-slate-600 dark:text-slate-300">{sub}</span>
                                  <span className="font-bold text-lg text-slate-900 dark:text-white">{score}</span>
                              </div>
                          ))}
                      </div>
                      <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Total Marks</p>
                          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{marks.total}</p>
                      </div>
                  </GlassCard>
              ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                      <p>Result not published yet.</p>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'profile' && (
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up">
              <GlassCard>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400"/> Personal Details
                  </h3>
                  <div className="space-y-4">
                      {[
                          { key: 'name', label: 'Student Name', val: user.name },
                          { key: 'dob', label: 'Date of Birth', val: user.dob },
                          { key: 'fatherName', label: "Father's Name", val: user.fatherName },
                          { key: 'motherName', label: "Mother's Name", val: user.motherName },
                      ].map((item) => (
                          <div key={item.key} className="flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors group">
                              <div>
                                  <p className="text-xs text-slate-400 uppercase tracking-wide">{item.label}</p>
                                  <p className="font-medium text-slate-800 dark:text-slate-200">{item.val || '-'}</p>
                              </div>
                              <button 
                                onClick={() => openEdit(item.key, item.val)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all"
                                title="Request Change"
                              >
                                  <Edit2 className="w-4 h-4"/>
                              </button>
                          </div>
                      ))}
                  </div>
              </GlassCard>

              <div className="space-y-6">
                 {/* Edit Modal / Form Area */}
                 {editMode && (
                     <GlassCard className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                         <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Request Change</h4>
                         <p className="text-sm text-blue-700 dark:text-blue-400 mb-4">
                             Changing <b>{getFieldLabel(editMode.field)}</b>. This will be sent to your teacher for approval.
                         </p>
                         <div className="space-y-3">
                             <GlassInput 
                                value={editMode.value} 
                                onChange={(e) => setEditMode({...editMode, value: e.target.value})}
                                autoFocus
                             />
                             <div className="flex gap-2">
                                 <GlassButton onClick={handleEditRequest} className="w-full">Send Request</GlassButton>
                                 <GlassButton variant="secondary" onClick={() => setEditMode(null)}>Cancel</GlassButton>
                             </div>
                         </div>
                     </GlassCard>
                 )}

                 <GlassCard>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Request History</h3>
                      <div className="space-y-3">
                          {requests.length === 0 ? <p className="text-sm text-slate-400">No active requests.</p> : requests.map(req => (
                              <div key={req.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm flex justify-between items-center">
                                  <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Change {getFieldLabel(req.field)}</p>
                                      <p className="font-medium text-slate-800 dark:text-slate-200">To: {req.newValue}</p>
                                  </div>
                                  <div>
                                      {req.status === 'PENDING' && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>}
                                      {req.status === 'APPROVED' && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Approved</span>}
                                      {req.status === 'REJECTED' && <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>}
                                  </div>
                              </div>
                          ))}
                      </div>
                 </GlassCard>
              </div>
          </div>
      )}

      {activeTab === 'security' && (
          <div className="animate-fade-in-up">
              <GlassCard className="max-w-md mx-auto border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                          <Lock className="w-6 h-6"/>
                      </div>
                      <h3 className="font-bold text-xl text-slate-800 dark:text-white">Change Password</h3>
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                      Set a custom password for your account to enhance security. 
                      If you forget it, please contact your Class Teacher to reset it back to your DOB.
                  </p>

                  <div className="space-y-4">
                      <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
                          <GlassInput 
                              type="password"
                              placeholder="Min 4 characters"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                          />
                      </div>
                      <GlassButton onClick={handleChangePassword} className="w-full">
                          Update Password
                      </GlassButton>
                  </div>
              </GlassCard>
          </div>
      )}
    </div>
  );
};

export default DashboardStudent;
