
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/GlassUI';
import { api } from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { UserPlus, School, CheckCircle, AlertTriangle } from 'lucide-react';

const PublicRegistration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const schoolId = searchParams.get('schoolId');
    
    const [schoolName, setSchoolName] = useState('');
    const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        regNo: '',
        classId: '',
        dob: '',
        fatherName: '',
        motherName: ''
    });

    useEffect(() => {
        if (!schoolId) {
            setLoading(false);
            return;
        }
        loadSchoolData();
    }, [schoolId]);

    const loadSchoolData = async () => {
        if (!schoolId) return;
        const school = await api.getSchoolDetailsPublic(schoolId);
        if (school) {
            setSchoolName(school.name);
            const classList = await api.getClassesForPublic(schoolId);
            setClasses(classList);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        
        setSubmitting(true);
        const res = await api.publicRegisterStudent(schoolId, formData.classId, formData);
        setSubmitting(false);

        if (res.success) {
            setSuccess(true);
        } else {
            alert("Registration failed: " + res.message);
        }
    };

    if (!schoolId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4"/>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Invalid Link</h2>
                <p className="text-slate-500 dark:text-slate-400">Please use the registration link provided by your school admin.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-10 text-center">Loading School Details...</div>;
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Registration Submitted!</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                    Your details have been sent to the Class Teacher. Once verified, you will be able to login using your Register Number.
                </p>
                <GlassButton onClick={() => navigate('/login')}>Go to Login</GlassButton>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-4 py-10">
            <GlassCard className="w-full max-w-2xl border-t-4 border-t-blue-600 dark:border-t-blue-500">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 text-blue-600 dark:text-blue-400">
                        <School className="w-8 h-8"/>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{schoolName}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Student Admission Form</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Student Name</label>
                            <GlassInput 
                                placeholder="Full Name" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Register No / Admission No</label>
                            <GlassInput 
                                placeholder="e.g. 1024" 
                                value={formData.regNo}
                                onChange={e => setFormData({...formData, regNo: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Date of Birth</label>
                            <GlassInput 
                                type="date"
                                value={formData.dob}
                                onChange={e => setFormData({...formData, dob: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Select Class</label>
                            <GlassSelect 
                                value={formData.classId} 
                                onChange={e => setFormData({...formData, classId: e.target.value})}
                                required
                            >
                                <option value="">-- Choose Class --</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </GlassSelect>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Father's Name</label>
                            <GlassInput 
                                placeholder="Father/Guardian Name" 
                                value={formData.fatherName}
                                onChange={e => setFormData({...formData, fatherName: e.target.value})}
                                required
                            />
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mother's Name</label>
                            <GlassInput 
                                placeholder="Mother's Name" 
                                value={formData.motherName}
                                onChange={e => setFormData({...formData, motherName: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                         <div className="mt-0.5 text-blue-600 dark:text-blue-400">
                             <UserPlus className="w-5 h-5" />
                         </div>
                         <p className="text-sm text-blue-800 dark:text-blue-300">
                             By submitting this form, you request admission to the class. Your teacher will verify these details before you can access the result portal.
                         </p>
                    </div>

                    <GlassButton type="submit" disabled={submitting} className="w-full text-lg py-3">
                        {submitting ? 'Submitting...' : 'Submit Registration'}
                    </GlassButton>
                </form>
            </GlassCard>
        </div>
    );
};

export default PublicRegistration;
