
import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassUI';
import { api } from '../../services/api';
import { Student, FeeStructure, FeePayment } from '../../types';
import { Wallet, CheckCircle2, Clock, AlertCircle, Receipt } from 'lucide-react';

interface Props {
    user: Student;
}

const StudentFees: React.FC<Props> = ({ user }) => {
    const [fees, setFees] = useState<FeeStructure[]>([]);
    const [payments, setPayments] = useState<FeePayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        // Fetch fees assigned to this class
        const classFees = await api.getFeeStructures(user.classId);
        // Fetch student's payment history
        const myPayments = await api.getStudentPayments(user.id);
        
        setFees(classFees);
        setPayments(myPayments);
        setLoading(false);
    };

    const getStatus = (fee: FeeStructure) => {
        const payment = payments.find(p => p.feeId === fee.id);
        if (payment && payment.status === 'PAID') return { label: 'PAID', color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2, paidAmount: payment.amountPaid };
        if (payment && payment.status === 'PARTIAL') return { label: 'PARTIAL', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: Clock, paidAmount: payment.amountPaid };
        
        // Check Due Date
        const isOverdue = fee.dueDate && new Date(fee.dueDate) < new Date();
        if (isOverdue) return { label: 'OVERDUE', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle, paidAmount: 0 };
        
        return { label: 'PENDING', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: Clock, paidAmount: 0 };
    };

    if (loading) return <div className="text-center py-10 text-slate-400">Loading Fees...</div>;

    const totalDue = fees.reduce((acc, f) => acc + f.amount, 0);
    const totalPaid = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* SUMMARY CARD */}
            <GlassCard className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-none">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg"><Wallet className="w-6 h-6 text-white"/></div>
                    <div>
                        <h3 className="font-bold text-lg">Fee Summary</h3>
                        <p className="text-xs text-emerald-100">Academic Year 2024-25</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-bold text-emerald-200 uppercase mb-1">Total Payable</p>
                        <p className="text-2xl font-black">₹{totalDue}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-emerald-200 uppercase mb-1">Paid So Far</p>
                        <p className="text-2xl font-black">₹{totalPaid}</p>
                    </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-sm font-bold">
                    <span>Balance Due</span>
                    <span className={totalDue - totalPaid > 0 ? "text-yellow-300" : "text-white"}>₹{totalDue - totalPaid}</span>
                </div>
            </GlassCard>

            {/* FEE LIST */}
            <div className="space-y-3">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm ml-1">Payment History</h3>
                {fees.length === 0 && <p className="text-center text-slate-400 text-xs py-8">No fees assigned to your class.</p>}
                
                {fees.map(fee => {
                    const status = getStatus(fee);
                    const Icon = status.icon;
                    const balance = fee.amount - (status.paidAmount || 0);

                    return (
                        <div key={fee.id} className={`p-4 rounded-xl border flex justify-between items-center bg-white dark:bg-slate-800 ${status.label === 'OVERDUE' ? 'border-red-200 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-700'}`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${status.color.split(' ')[1]} ${status.color.split(' ')[0]}`}>
                                    <Icon className="w-5 h-5"/>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{fee.name}</h4>
                                    <p className="text-xs text-slate-500">Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</p>
                                    {status.label === 'PARTIAL' && <p className="text-[10px] text-orange-600 font-bold mt-1">Paid: ₹{status.paidAmount}</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-slate-800 dark:text-white">₹{fee.amount}</p>
                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase ${status.color}`}>
                                    {status.label}
                                </div>
                                {status.label === 'PAID' && (
                                    <button className="flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-1 ml-auto hover:underline">
                                        <Receipt className="w-3 h-3"/> Receipt
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudentFees;
