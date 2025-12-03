
import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { Building2, CheckCircle, ArrowRight, Loader2, Copy, ShieldCheck, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { getSupabaseConfig } from '../services/supabaseClient';

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [successData, setSuccessData] = useState<{ schoolId: string, name: string } | null>(null);

  const [formData, setFormData] = useState({
      schoolName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      place: ''
  });

  useEffect(() => {
      setRecoveryCode(api.generateRecoveryCode());
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      
      if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match!");
          return;
      }

      if (!isCopied) {
          setError("Please copy the Recovery Code and check the box to proceed.");
          return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanEmail = formData.email.trim();
      
      if (!emailRegex.test(cleanEmail)) {
          setError("Please enter a valid email address (e.g., admin@school.com)");
          return;
      }

      setLoading(true);

      const res = await api.registerSchool(
          formData.schoolName.trim(), 
          cleanEmail, 
          formData.password,
          formData.phone.trim(),
          formData.place.trim(),
          recoveryCode
      );
      
      setLoading(false);
      if (res.success && res.schoolId) {
          setSuccessData({ schoolId: res.schoolId, name: formData.schoolName });
      } else {
          setError("Registration Failed: " + (res.message || "Unknown error"));
      }
  };

  const handleCopyCode = () => {
      navigator.clipboard.writeText(recoveryCode);
      alert("Code Copied! Save it somewhere safe.");
  };

  const handleEnterPortal = () => {
      if (!successData) return;
      
      const { url, key } = getSupabaseConfig();
      if (url && key) {
          // Fix for Preview Error:
          // Instead of forcing a window.location.href reload (which causes 404 in some SPA/Preview envs),
          // we directly set the credentials in localStorage and navigate internally.
          localStorage.setItem('sb_url', url);
          localStorage.setItem('sb_key', key);
          localStorage.setItem('school_id', successData.schoolId);
          
          // Navigate directly to login
          navigate('/login');
      } else {
          navigate('/login');
      }
  };

  if (successData) {
      return (
          <div className="flex items-center justify-center min-h-[80vh] p-4">
              <GlassCard className="max-w-lg w-full text-center py-12 px-6 border-green-200 dark:border-green-900 shadow-2xl animate-fade-in-up">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Registration Successful!</h2>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                      Welcome to <b>{successData.name}</b>
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 mb-8">
                      <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">What happens next?</h3>
                      <p className="text-sm text-blue-800/80 dark:text-blue-300/80">
                          Click below to enter your dedicated School Portal. 
                          Your unique link will be generated automatically.
                          <b>Bookmark it</b> when you land on the login page!
                      </p>
                  </div>

                  <GlassButton onClick={handleEnterPortal} className="w-full text-lg py-4 shadow-xl shadow-blue-200 dark:shadow-none">
                      Enter My School Portal <ArrowRight className="w-5 h-5 ml-2" />
                  </GlassButton>
              </GlassCard>
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center p-4 py-12">
      <GlassCard className="max-w-md w-full shadow-xl border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Register Your School</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
                Create your result portal in seconds.
            </p>
        </div>
        
        {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-100 dark:border-red-800 text-center flex items-center justify-center gap-2">
                <span className="font-bold">Error:</span> {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">School Name</label>
                <GlassInput 
                    placeholder="e.g. Govt HSS Trivandrum"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    required
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Place / City</label>
                    <GlassInput 
                        placeholder="e.g. Kochi"
                        value={formData.place}
                        onChange={(e) => setFormData({...formData, place: e.target.value})}
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                    <GlassInput 
                        placeholder="e.g. 9846..."
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Admin Email</label>
                <GlassInput 
                    type="email"
                    placeholder="admin@school.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value.trim()})}
                    required
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Password</label>
                    <GlassInput 
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Confirm</label>
                    <GlassInput 
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                        minLength={6}
                    />
                </div>
            </div>

            {/* Recovery Code Section */}
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-300 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" /> Save this Recovery Code
                </div>
                <div className="flex gap-2 mb-2">
                    <div className="flex-1 bg-white dark:bg-slate-800 border border-yellow-300 dark:border-yellow-700 p-2 rounded text-center font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 break-all text-xs md:text-sm">
                        {recoveryCode}
                    </div>
                    <button 
                        type="button" 
                        onClick={handleCopyCode}
                        className="p-2 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-300 dark:hover:bg-yellow-700 transition-colors flex-shrink-0"
                        title="Copy Code"
                    >
                        <Copy className="w-5 h-5"/>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="copiedCheck" 
                        className="w-4 h-4 accent-blue-600 rounded"
                        checked={isCopied}
                        onChange={e => setIsCopied(e.target.checked)}
                    />
                    <label htmlFor="copiedCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                        I have copied and saved this code securely.
                    </label>
                </div>
            </div>

            <GlassButton type="submit" className="w-full" disabled={loading}>
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Registering...</span> : 'Register School'}
            </GlassButton>
        </form>

        <div className="mt-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                Already have an account? <span onClick={() => navigate('/login')} className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">Login here</span>
            </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default SetupWizard;
