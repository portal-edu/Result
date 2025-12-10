
import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/GlassUI';
import { api } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserPlus, School, CheckCircle, AlertTriangle, Loader2, Lock, XCircle, Upload, Download, Home } from 'lucide-react';
import { formatDate, sanitizePhone } from '../services/utils';
import { CustomFieldDef } from '../types';

const PublicRegistration: React.FC = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const navigate = useNavigate();
    const schoolId = searchParams.get('schoolId');
    const token = searchParams.get('token');
    
    const [schoolName, setSchoolName] = useState('');
    const [resolvedSchoolId, setResolvedSchoolId] = useState('');
    const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [admissionsClosed, setAdmissionsClosed] = useState(false);
    
    // Config
    const [config, setConfig] = useState<any>({});
    const [customFields, setCustomFields] = useState<CustomFieldDef[]>([]);
    
    // Global Lock
    const [globalRegistrationDisabled, setGlobalRegistrationDisabled] = useState(false);

    const [formData, setFormData] = useState<any>({
        name: '',
        regNo: '', 
        rollNo: '', // Added roll number
        classId: '',
        dob: '',
        gender: '',
        fatherName: '',
        motherName: '',
        phone: '',
        address: '',
        password: '',
        confirmPassword: '',
        bloodGroup: '',
        photoUrl: '',
        customData: {} // Container for custom fields
    });
    
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        checkGlobalConfig();
    }, [schoolId, token]);

    const checkGlobalConfig = async () => {
        const settings = await api.getGlobalSettings();
        if (settings['ENABLE_PUBLIC_REGISTRATION'] === 'FALSE') {
            setGlobalRegistrationDisabled(true);
            setLoading(false);
        } else {
            if (schoolId || token) loadSchoolData(schoolId, token);
            else setLoading(false);
        }
    };

    const loadSchoolData = async (idOrSlug: string | null, inviteToken: string | null) => {
        let idToUse = idOrSlug;
        
        if (inviteToken) {
            const school = await api.getSchoolByAdmissionToken(inviteToken);
            if (school) {
                idToUse = school.id;
            } else {
                setLoading(false);
                return;
            }
        }

        if (!idToUse) {
            setLoading(false);
            return;
        }

        const school = await api.getSchoolDetailsPublic(idToUse);
        if (school) {
            if (school.allow_public_admission === false) {
                setAdmissionsClosed(true);
                setSchoolName(school.name);
            } else {
                setResolvedSchoolId(school.id); // Ensure we get the correct ID if slug was used
                setSchoolName(school.name);
                setConfig(school.admission_config || {});
                if (school.admission_config?.customFields) {
                    setCustomFields(school.admission_config.customFields);
                }
                const classList = await api.getClassesForPublic(school.id);
                setClasses(classList);
            }
        }
        setLoading(false);
    };
    
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        setPhotoFile(e.target.files[0]);
    };

    const handleCustomFieldChange = (fieldId: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            customData: {
                ...prev.customData,
                [fieldId]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resolvedSchoolId) return;
        
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        
        // Final sanitization check before submit
        const cleanPhone = sanitizePhone(formData.phone);
        if (cleanPhone.length < 10) {
            alert("Please enter a valid 10-digit phone number.");
            return;
        }

        setSubmitting(true);
        let finalPhotoUrl = formData.photoUrl;

        // Upload Photo if selected
        if (photoFile) {
            setUploading(true);
            const uploadRes = await api.uploadImage(photoFile, 'students');
            setUploading(false);
            if (uploadRes.success && uploadRes.publicUrl) {
                finalPhotoUrl = uploadRes.publicUrl;
            } else {
                setSubmitting(false);
                alert("Photo upload failed. Please try again.");
                return;
            }
        }

        const res = await api.publicRegisterStudent(resolvedSchoolId, formData.classId, { ...formData, phone: cleanPhone, photoUrl: finalPhotoUrl });
        setSubmitting(false);

        if (res.success) {
            setSuccess(true);
        } else {
            const msg = (res as any).message;
            alert("Registration failed: " + (typeof msg === 'string' ? msg : JSON.stringify(msg)));
        }
    };
    
    const handleDownloadSlip = () => {
        window.print();
    };

    if (globalRegistrationDisabled) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <XCircle className="w-16 h-16 text-red-500 mb-4"/>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Registration Unavailable</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    Public registration is currently disabled system-wide for maintenance. Please try again later.
                </p>
                <GlassButton onClick={() => navigate('/')} className="mt-8">Back Home</GlassButton>
            </div>
        );
    }

    if (admissionsClosed) {
        return (
             <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <Lock className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4"/>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{schoolName}</h2>
                <h3 className="text-lg font-semibold text-red-500 mt-2">Admissions Closed</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                    Public registration is currently disabled by the school administrator. Please contact the school office.
                </p>
                <GlassButton onClick={() => navigate('/login')} className="mt-8">Go to Login</GlassButton>
            </div>
        );
    }

    if (!loading && !resolvedSchoolId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
                <GlassCard className="max-w-md w-full animate-fade-in-up border-t-4 border-t-yellow-500 text-center">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400"/>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Link Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        This registration link is invalid or has expired.
                    </p>
                    <GlassButton onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2">
                        <Home className="w-4 h-4"/> Back to Home
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2"/>
                <p className="text-slate-500">Loading School Details...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-fade-in-up">
                
                {/* Printable Application Slip */}
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-left text-black">
                    <div className="border border-black p-8 h-full">
                        <h1 className="text-2xl font-bold text-center uppercase mb-2">{schoolName}</h1>
                        <h2 className="text-xl font-bold text-center uppercase border-b-2 border-black pb-4 mb-6">Admission Application</h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div><span className="font-bold">Student Name:</span> {formData.name}</div>
                            <div><span className="font-bold">Class Applied:</span> {classes.find(c => c.id === formData.classId)?.name}</div>
                            <div><span className="font-bold">Date of Birth:</span> {formatDate(formData.dob)}</div>
                            <div><span className="font-bold">Gender:</span> {formData.gender}</div>
                            <div><span className="font-bold">Admission No:</span> {formData.regNo || 'N/A'}</div>
                            <div><span className="font-bold">Phone:</span> {formData.phone}</div>
                        </div>
                        
                        <div className="mb-6">
                            <p className="font-bold">Address:</p>
                            <p>{formData.address}</p>
                        </div>
                        
                        {customFields.length > 0 && (
                            <div className="mb-6 border-t pt-4">
                                <p className="font-bold mb-2">Additional Info:</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {customFields.map(f => (
                                        <div key={f.id}><span className="font-bold">{f.label}:</span> {formData.customData[f.id] || '-'}</div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-12 pt-4 border-t border-black flex justify-between">
                            <span>Date: {new Date().toLocaleDateString()}</span>
                            <span>Signature of Applicant</span>
                        </div>
                        
                        <div className="mt-8 text-center text-xs">
                            <p>Note: This application is subject to verification by school authority.</p>
                            <p>Check status at <b>{window.location.origin}</b> using your Phone Number.</p>
                        </div>
                    </div>
                </div>

                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Application Submitted!</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
                    Your details have been sent to the school.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-8 max-w-sm mx-auto">
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">How to check status?</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        Go to Login Page &gt; <b>Track Admission Status</b>. 
                        <br/>Use Phone: <b>{formData.phone}</b> & DOB: <b>{formatDate(formData.dob)}</b>
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <GlassButton onClick={handleDownloadSlip} className="flex-1 flex justify-center items-center gap-2">
                        <Download className="w-4 h-4"/> Download Form
                    </GlassButton>
                    <GlassButton variant="secondary" onClick={() => navigate('/login')} className="flex-1">
                        Go to Login
                    </GlassButton>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center p-4 py-10">
            <GlassCard className="w-full max-w-2xl border-t-4 border-t-blue-600 dark:border-t-blue-500">
                {/* Premium Header */}
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center shrink-0">
                        <School className="w-8 h-8 text-blue-600 dark:text-blue-400"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-xl md:text-2xl text-slate-900 dark:text-white leading-tight mb-1">{schoolName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Online Admission Form</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Student Full Name <span className="text-red-500">*</span></label>
                            <GlassInput placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} required/>
                        </div>
                        
                        {config.askRegNo && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Admission No / Reg No <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <GlassInput placeholder="e.g. 1024" value={formData.regNo} onChange={e => setFormData({...formData, regNo: e.target.value})}/>
                            </div>
                        )}

                        {config.askRollNo && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Roll No <span className="text-slate-400 font-normal">(Optional)</span></label>
                                <GlassInput type="number" placeholder="e.g. 5" value={formData.rollNo} onChange={e => setFormData({...formData, rollNo: e.target.value})}/>
                            </div>
                        )}
                        
                        <div className={config.askRegNo && config.askRollNo ? "md:col-span-2" : ""}>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Select Class <span className="text-red-500">*</span></label>
                            <GlassSelect value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} required>
                                <option value="">-- Choose Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </GlassSelect>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Date of Birth <span className="text-red-500">*</span></label>
                            <GlassInput type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} required/>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Gender <span className="text-red-500">*</span></label>
                            <GlassSelect value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </GlassSelect>
                        </div>
                    </div>

                    {/* Parents & Contact */}
                    <div className="grid md:grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Father's Name <span className="text-red-500">*</span></label>
                            <GlassInput placeholder="Father/Guardian Name" value={formData.fatherName} onChange={e => setFormData({...formData, fatherName: e.target.value})} required/>
                        </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mother's Name <span className="text-red-500">*</span></label>
                            <GlassInput placeholder="Mother's Name" value={formData.motherName} onChange={e => setFormData({...formData, motherName: e.target.value})} required/>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Mobile Number <span className="text-red-500">*</span></label>
                            <GlassInput 
                                type="tel" 
                                placeholder="10-digit number" 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: sanitizePhone(e.target.value)})} 
                                maxLength={10}
                                required
                            />
                            <p className="text-[10px] text-slate-400 mt-1">This number will be used to track your application status.</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Address <span className="text-red-500">*</span></label>
                            <textarea 
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                rows={3}
                                placeholder="House Name, Street, Post Office..."
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* DYNAMIC CUSTOM FIELDS */}
                    {customFields.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                            {customFields.map(field => (
                                <div key={field.id} className={field.type === 'TEXT' || field.type === 'SELECT' ? '' : ''}>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.type === 'SELECT' ? (
                                        <GlassSelect 
                                            value={formData.customData[field.id] || ''}
                                            onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                            required={field.required}
                                        >
                                            <option value="">Select</option>
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </GlassSelect>
                                    ) : (
                                        <GlassInput 
                                            type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                                            placeholder={field.label}
                                            value={formData.customData[field.id] || ''}
                                            onChange={e => handleCustomFieldChange(field.id, e.target.value)}
                                            required={field.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Security - Password */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-bold">
                            <Lock className="w-4 h-4"/> Set Password
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Create Password <span className="text-red-500">*</span></label>
                                <GlassInput type="password" placeholder="Minimum 6 chars" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                <GlassInput type="password" placeholder="Re-enter password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} required minLength={6}/>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">You will need this password to login to the Student Dashboard later.</p>
                    </div>

                    {/* Optional Config-based Fields (Legacy) */}
                    {(config.askBloodGroup || config.askPhoto) && (
                        <div className="grid md:grid-cols-2 gap-4 border-t pt-4 border-slate-100 dark:border-slate-700">
                            {config.askBloodGroup && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Blood Group</label>
                                    <GlassSelect value={formData.bloodGroup} onChange={e => setFormData({...formData, bloodGroup: e.target.value})}>
                                        <option value="">Select</option>
                                        <option value="A+">A+</option><option value="A-">A-</option>
                                        <option value="B+">B+</option><option value="B-">B-</option>
                                        <option value="O+">O+</option><option value="O-">O-</option>
                                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                    </GlassSelect>
                                </div>
                            )}
                            
                            {config.askPhoto && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Student Photo</label>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                                            <Upload className="w-4 h-4"/> Choose File
                                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                                        </label>
                                        <span className="text-xs text-slate-500">{photoFile ? photoFile.name : 'No file chosen'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <GlassButton type="submit" disabled={submitting || uploading} className="w-full text-lg py-4 font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                        {submitting || uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><UserPlus className="w-5 h-5"/> Submit Application</>}
                    </GlassButton>
                </form>
            </GlassCard>
        </div>
    );
};

export default PublicRegistration;
