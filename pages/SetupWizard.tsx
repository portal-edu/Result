
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassUI';
import { ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSupabaseConfig } from '../services/supabaseClient';

// Import Steps
import StepIdentity from './setup_wizard/StepIdentity';
import StepLocation from './setup_wizard/StepLocation';
import StepSecurity from './setup_wizard/StepSecurity';
import StepSuccess from './setup_wizard/StepSuccess';

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Load initial state from localStorage if available
  const savedState = JSON.parse(localStorage.getItem('setup_wizard_data') || '{}');

  const [step, setStep] = useState(savedState.step || 1); // 1: Type & Name, 2: Location, 3: Credentials, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [hasPrinted, setHasPrinted] = useState(false);
  
  // Attribution Tracking
  const [attribution, setAttribution] = useState({ refId: '', source: '' });
  
  // Form State
  const [orgType, setOrgType] = useState<'SCHOOL' | 'MADRASSA' | 'TUITION'>(savedState.orgType || 'SCHOOL');
  const [formData, setFormData] = useState(savedState.formData || {
      schoolName: '',
      place: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralCode: ''
  });

  // ATTRIBUTION CAPTURE
  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const ref = params.get('ref') || '';
      const src = params.get('source') || '';
      if (ref || src) {
          setAttribution({ refId: ref, source: src });
      }
  }, [location]);

  // AUTO SAVE EFFECT (SECURED)
  useEffect(() => {
      // Create a safe version of formData without sensitive info
      const safeFormData = { ...formData };
      delete safeFormData.password;
      delete safeFormData.confirmPassword;

      const dataToSave = {
          step: step === 4 ? 1 : step, // Don't save success state permanently
          orgType,
          formData: safeFormData
      };
      localStorage.setItem('setup_wizard_data', JSON.stringify(dataToSave));
  }, [step, orgType, formData]);

  useEffect(() => {
      if (!recoveryCode) setRecoveryCode(api.generateRecoveryCode());
  }, []);

  const handleNext = () => {
      if (step === 1 && !formData.schoolName) return setError("Please name your campus!");
      if (step === 2 && (!formData.place || !formData.phone)) return setError("Please fill location details.");
      setError('');
      setStep(prev => prev + 1);
  };

  const handleBack = () => {
      setError('');
      setStep(prev => prev - 1);
  };

  const handleRegister = async () => {
      setLoading(true);
      
      const res = await api.registerSchool(
          formData.schoolName, 
          formData.email, 
          formData.password,
          formData.phone,
          formData.place,
          recoveryCode,
          formData.referralCode,
          attribution // Pass attribution data
      );
      
      setLoading(false);
      if (res.success && res.schoolId) {
          // Clear draft on success
          localStorage.removeItem('setup_wizard_data');
          setStep(4); // Move to Success Screen
      } else {
          setError("Setup Failed: " + (res.message || "Unknown error"));
      }
  };

  const handleEnterPortal = () => {
      // Auto-save context
      const { url, key } = getSupabaseConfig();
      // Navigate with state to auto-fill login
      navigate('/login', { 
          state: { 
              email: formData.email, 
              role: 'ADMIN', 
              fromSetup: true 
          } 
      });
  };

  // --- RENDER ---
  
  // Success Step is full screen
  if (step === 4) {
      return (
          <StepSuccess 
              schoolName={formData.schoolName}
              place={formData.place}
              recoveryCode={recoveryCode}
              hasPrinted={hasPrinted}
              setHasPrinted={setHasPrinted}
              onEnterPortal={handleEnterPortal}
          />
      );
  }

  // Steps 1-3 inside the Card
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <GlassCard className="max-w-md w-full shadow-2xl border-slate-200 dark:border-slate-700 relative overflow-hidden">
          
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 h-1.5 bg-slate-100 dark:bg-slate-800 w-full">
              <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${step * 33}%` }}></div>
          </div>

          <div className="pt-6">
              {error && (
                  <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm border border-red-100 dark:border-red-800 text-center font-bold flex items-center justify-center gap-2 animate-shake">
                      <ShieldAlert className="w-4 h-4"/> {error}
                  </div>
              )}

              {step === 1 && (
                  <StepIdentity 
                      orgType={orgType} 
                      setOrgType={setOrgType} 
                      schoolName={formData.schoolName}
                      setSchoolName={(val) => setFormData({...formData, schoolName: val})}
                      onNext={handleNext}
                  />
              )}

              {step === 2 && (
                  <StepLocation
                      place={formData.place}
                      setPlace={(val) => setFormData({...formData, place: val})}
                      phone={formData.phone}
                      setPhone={(val) => setFormData({...formData, phone: val})}
                      onNext={handleNext}
                      onBack={handleBack}
                  />
              )}

              {step === 3 && (
                  <StepSecurity 
                      formData={formData}
                      setFormData={setFormData}
                      onBack={handleBack}
                      onRegister={handleRegister}
                      loading={loading}
                  />
              )}
          </div>
          
          <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-slate-400 text-xs">
                  Already have a campus? <span onClick={() => navigate('/login')} className="text-blue-500 font-bold cursor-pointer hover:underline">Login Here</span>
              </p>
          </div>
      </GlassCard>
    </div>
  );
};

export default SetupWizard;
