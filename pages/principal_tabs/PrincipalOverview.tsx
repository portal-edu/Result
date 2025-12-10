
import React from 'react';
import { GlassCard } from '../../components/GlassUI';
import { Users, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { ClassData, SystemStats } from '../../types';

interface Props {
    classes: ClassData[];
    stats: any;
}

const PrincipalOverview: React.FC<Props> = ({ classes, stats }) => {
    const totalStudents = classes.reduce((acc, c) => acc + (c.studentCount || 0), 0);
    const submittedClasses = classes.filter(c => c.submissionStatus === 'SUBMITTED').length;
    const publishedClasses = classes.filter(c => c.submissionStatus === 'APPROVED').length; // Assuming APPROVED = PUBLISHED contextually

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Students</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{totalStudents}</h3>
                        </div>
                        <Users className="w-6 h-6 text-blue-200"/>
                    </div>
                </GlassCard>
                <GlassCard className="bg-white dark:bg-slate-800 border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Classes</p>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{classes.length}</h3>
                        </div>
                        <BookOpen className="w-6 h-6 text-purple-200"/>
                    </div>
                </GlassCard>
                <GlassCard className="bg-white dark:bg-slate-800 border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Pending Approval</p>
                            <h3 className="text-2xl font-black text-orange-600">{submittedClasses}</h3>
                        </div>
                        <Clock className="w-6 h-6 text-orange-200"/>
                    </div>
                </GlassCard>
                <GlassCard className="bg-white dark:bg-slate-800 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Published</p>
                            <h3 className="text-2xl font-black text-green-600">{publishedClasses}</h3>
                        </div>
                        <CheckCircle className="w-6 h-6 text-green-200"/>
                    </div>
                </GlassCard>
            </div>

            <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Class Performance Overview</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => (
                        <div key={cls.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg text-slate-800 dark:text-white">{cls.name}</h4>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                    cls.submissionStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                                    cls.submissionStatus === 'SUBMITTED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {cls.submissionStatus || 'DRAFT'}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500">
                                <p>Teacher: {cls.teacherName || 'N/A'}</p>
                                <p>{cls.studentCount || 0} Students</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PrincipalOverview;
