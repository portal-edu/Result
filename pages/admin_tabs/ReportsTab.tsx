import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect, LoadingScreen } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Student, ClassData } from '../../types';
import { Download, Printer, Settings, FileSpreadsheet } from 'lucide-react';
import { formatDate } from '../../services/utils';

// Declare jsPDF global
// No need to declare here as we cast window to any

const ReportsTab: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('ALL');
    
    // Column Visibility State
    const [columns, setColumns] = useState({
        rollNo: true,
        regNo: true,
        name: true,
        gender: true,
        dob: true,
        fatherName: true,
        motherName: false,
        className: true,
        status: true
    });
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const clsList = await api.getClasses();
        setClasses(clsList);
        await fetchStudents('ALL');
        setLoading(false);
    };

    const fetchStudents = async (classId: string) => {
        let allStudents: Student[] = [];
        if (classId === 'ALL') {
            const cls = await api.getClasses(); 
            for (const c of cls) {
                const s = await api.getStudentsByClass(c.id);
                const sWithClass = s.map(stu => ({ ...stu, className: c.name }));
                allStudents = [...allStudents, ...sWithClass];
            }
        } else {
            const s = await api.getStudentsByClass(classId);
            const clsName = classes.find(c => c.id === classId)?.name || '';
            allStudents = s.map(stu => ({ ...stu, className: clsName }));
        }
        
        allStudents.sort((a, b) => {
            if (a.className !== b.className) return (a.className || '').localeCompare(b.className || '');
            return (a.rollNo || 0) - (b.rollNo || 0);
        });
        
        setStudents(allStudents);
    };

    const handleClassFilter = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clsId = e.target.value;
        setSelectedClass(clsId);
        setLoading(true);
        await fetchStudents(clsId);
        setLoading(false);
    };

    const toggleColumn = (key: keyof typeof columns) => {
        setColumns(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const exportPDF = async () => {
        const jsPDF = (window as any).jspdf?.jsPDF;
        if (!jsPDF) return alert("PDF Library not ready.");
        
        const doc = new jsPDF();
        const config = await api.getSchoolConfig();
        const schoolName = config?.schoolName || "Student Report";

        doc.setFontSize(16);
        doc.text(schoolName, 105, 15, { align: "center" });
        doc.setFontSize(12);
        doc.text(`Student List - ${selectedClass === 'ALL' ? 'All Classes' : classes.find(c=>c.id===selectedClass)?.name}`, 105, 22, { align: "center" });

        const headers = [];
        if (columns.rollNo) headers.push('Roll');
        if (columns.regNo) headers.push('Reg No');
        if (columns.name) headers.push('Name');
        if (columns.gender) headers.push('Gender');
        if (columns.dob) headers.push('DOB');
        if (columns.className) headers.push('Class');
        if (columns.fatherName) headers.push('Father');

        const rows = students.map(s => {
            const row = [];
            if (columns.rollNo) row.push(s.rollNo || '');
            if (columns.regNo) row.push(s.regNo);
            if (columns.name) row.push(s.name);
            if (columns.gender) row.push(s.gender);
            if (columns.dob) row.push(formatDate(s.dob));
            if (columns.className) row.push(s.className);
            if (columns.fatherName) row.push(s.fatherName);
            return row;
        });

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 30,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        doc.save(`Student_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white">Master Register</h2>
                    <GlassSelect value={selectedClass} onChange={handleClassFilter} className="w-40 py-1.5 text-sm">
                        <option value="ALL">All Classes</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </GlassSelect>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <button onClick={() => setShowColumnMenu(!showColumnMenu)} className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                            <Settings className="w-4 h-4"/> Columns
                        </button>
                        {showColumnMenu && (
                            <div className="absolute top-10 right-0 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 px-2">Toggle Fields</p>
                                {Object.keys(columns).map(key => (
                                    <label key={key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                        <input type="checkbox" checked={(columns as any)[key]} onChange={() => toggleColumn(key as any)} className="accent-blue-600"/>
                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors">
                        <Download className="w-4 h-4"/> PDF
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors">
                        <Printer className="w-4 h-4"/> Print
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <GlassCard className="p-0 overflow-hidden min-h-[500px]">
                {loading ? <div className="flex flex-col items-center justify-center h-64"><LoadingScreen /><div className="mt-4 text-slate-500 text-sm">Loading Register...</div></div> : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-3 w-10 text-center">#</th>
                                    {columns.rollNo && <th className="p-3">Roll</th>}
                                    {columns.regNo && <th className="p-3">Reg No</th>}
                                    {columns.name && <th className="p-3">Student Name</th>}
                                    {columns.gender && <th className="p-3">Gender</th>}
                                    {columns.dob && <th className="p-3">DOB</th>}
                                    {columns.className && <th className="p-3">Class</th>}
                                    {columns.fatherName && <th className="p-3">Father</th>}
                                    {columns.motherName && <th className="p-3">Mother</th>}
                                    {columns.status && <th className="p-3 text-center">Status</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {students.map((s, idx) => (
                                    <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                                        {columns.rollNo && <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{s.rollNo || '-'}</td>}
                                        {columns.regNo && <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.regNo}</td>}
                                        {columns.name && <td className="p-3 font-bold text-slate-800 dark:text-white uppercase">{s.name}</td>}
                                        {columns.gender && <td className="p-3 text-xs">{s.gender}</td>}
                                        {columns.dob && <td className="p-3 text-xs font-mono">{formatDate(s.dob)}</td>}
                                        {columns.className && <td className="p-3"><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{s.className}</span></td>}
                                        {columns.fatherName && <td className="p-3 text-xs text-slate-500">{s.fatherName}</td>}
                                        {columns.motherName && <td className="p-3 text-xs text-slate-500">{s.motherName}</td>}
                                        {columns.status && <td className="p-3 text-center">{s.isVerified ? <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Active</span> : <span className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full font-bold">Pending</span>}</td>}
                                    </tr>
                                ))}
                                {students.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-slate-400 italic">No records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
            <div className="text-center text-[10px] text-slate-400 print:hidden">Showing {students.length} Records • Generated on {new Date().toLocaleDateString()}</div>
        </div>
    );
};

export default ReportsTab;