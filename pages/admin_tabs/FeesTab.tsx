import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../../components/GlassUI';
import { api } from '../../services/api';
import { FeeStructure, ClassData, SchoolConfig } from '../../types';
import { Plus, X, Receipt, Wallet, CheckCircle2, IndianRupee, AlertCircle, Printer, MessageCircle } from 'lucide-react';

// Use jsPDF from global window object (loaded via CDN)
// No need to declare here as we cast window to any

interface Props {
    feeStructures: FeeStructure[];
    classes: ClassData[];
    schoolConfig: SchoolConfig;
    onRefresh: () => void;
    onShowReceipt: (data: any) => void;
}

const FeesTab: React.FC<Props> = ({ feeStructures, classes, schoolConfig, onRefresh, onShowReceipt }) => {
    const [selectedFeeId, setSelectedFeeId] = useState<string>('');
    const [feeCollectionData, setFeeCollectionData] = useState<any[]>([]);
    const [newFee, setNewFee] = useState({ 
        name: '', 
        amount: '', 
        dueDate: '', 
        targetClassIds: [] as string[],
        collectedBy: 'ADMIN' as 'ADMIN'|'TEACHER'|'BOTH',
        isRecurring: false,
        recurrenceFrequency: 'MONTHLY',
        recurrenceCount: 1
    });
    const [creatingFee, setCreatingFee] = useState(false);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payingStudent, setPayingStudent] = useState<any>(null);
    const [amountPaying, setAmountPaying] = useState('');
    const [processingPayment, setProcessingPayment] = useState(false);

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingFee(true);
        const amount = parseFloat(newFee.amount);
        if(!newFee.name || isNaN(amount)) {
            setCreatingFee(false);
            return alert("Invalid Input. Please check Name and Amount.");
        }

        const res = await api.createFeeStructure(
            newFee.name, 
            amount, 
            newFee.dueDate, 
            newFee.targetClassIds, 
            newFee.collectedBy,
            newFee.isRecurring ? { frequency: newFee.recurrenceFrequency, count: newFee.recurrenceCount } : undefined
        );
        
        setCreatingFee(false);
        if (res.success) {
            setSuccessMsg('Fee Category Created!');
            setNewFee({ name: '', amount: '', dueDate: '', targetClassIds: [], collectedBy: 'ADMIN', isRecurring: false, recurrenceFrequency: 'MONTHLY', recurrenceCount: 1 });
            onRefresh();
            setTimeout(() => setSuccessMsg(''), 2000);
        } else {
            alert("Error: " + res.message);
        }
    };

    const loadFeeCollection = async (feeId: string) => {
        setSelectedFeeId(feeId);
        setFeeCollectionData([]);
        const fee = feeStructures.find(f => f.id === feeId);
        if(!fee) return;
        
        const classesToFetch = (!fee.targetClassIds || fee.targetClassIds.length === 0) ? classes.map(c => c.id) : fee.targetClassIds;
        let allData: any[] = [];
        setLoading(true);
        for(const clsId of classesToFetch) {
            const cls = classes.find(c => c.id === clsId);
            if(!cls) continue;
            const stats = await api.getFeeCollectionStats(feeId, clsId);
            const enriched = stats.map(s => ({...s, className: cls.name}));
            allData = [...allData, ...enriched];
        }
        setFeeCollectionData(allData);
        setLoading(false);
    };

    const openPaymentModal = (record: any) => {
        setPayingStudent(record);
        const fee = feeStructures.find(f => f.id === selectedFeeId);
        const total = fee?.amount || 0;
        const paid = record.paymentDetails?.amount_paid || 0;
        setAmountPaying((total - paid).toString());
        setShowPaymentModal(true);
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFeeId || !payingStudent) return;
        const amount = parseFloat(amountPaying);
        if (isNaN(amount) || amount <= 0) return alert("Please enter valid amount");

        setProcessingPayment(true);
        const fee = feeStructures.find(f => f.id === selectedFeeId);
        const res = await api.recordFeePayment(selectedFeeId, payingStudent.student.id, amount, fee?.amount || 0, 'Admin');
        setProcessingPayment(false);
        setShowPaymentModal(false);

        if(!res.success) alert("Failed to record payment: " + res.message);
        else loadFeeCollection(selectedFeeId);
    };

    // GENERATE PDF RECEIPT
    const generatePDFReceipt = (record: any) => {
        const fee = feeStructures.find(f => f.id === selectedFeeId);
        const jsPDF = (window as any).jspdf?.jsPDF;
        if (!fee || !jsPDF) {
            alert("PDF Library not loaded");
            return;
        }

        const doc = new jsPDF();
        const paid = record.paymentDetails?.amount_paid || 0;
        const total = fee.amount || 0;
        const balance = Math.max(0, total - paid);
        const date = new Date(record.paymentDetails?.paid_date).toLocaleDateString();
        const txnId = record.paymentDetails?.transaction_id || 'N/A';

        // Styling
        doc.setFontSize(18);
        doc.text(schoolConfig.schoolName, 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(schoolConfig.place || '', 105, 26, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.line(20, 32, 190, 32);

        doc.setFontSize(14);
        doc.text("FEE RECEIPT", 105, 42, { align: 'center' });

        doc.setFontSize(12);
        let y = 60;
        doc.text(`Receipt No: ${txnId}`, 20, y);
        doc.text(`Date: ${date}`, 140, y);
        y += 10;
        doc.text(`Student Name: ${record.student.name}`, 20, y);
        y += 10;
        doc.text(`Class: ${record.className}`, 20, y);
        doc.text(`Reg No: ${record.student.regNo}`, 140, y);
        
        y += 20;
        // Table Header
        doc.setFillColor(230, 230, 230);
        doc.rect(20, y, 170, 10, 'F');
        doc.setFont("helvetica", "bold");
        doc.text("Description", 25, y + 7);
        doc.text("Amount (Rs)", 160, y + 7);
        
        y += 10;
        doc.setFont("helvetica", "normal");
        doc.text(fee.name, 25, y + 7);
        doc.text(paid.toFixed(2), 160, y + 7);
        doc.rect(20, y, 170, 10); // Border

        y += 20;
        doc.setFont("helvetica", "bold");
        doc.text(`Total Paid: Rs. ${paid.toFixed(2)}`, 140, y);
        if(balance > 0) {
            y += 7;
            doc.text(`Balance Due: Rs. ${balance.toFixed(2)}`, 140, y);
        }

        y += 30;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("This is a computer generated receipt.", 105, y, { align: 'center' });

        doc.save(`Receipt_${record.student.name}_${fee.name}.pdf`);
    };

    const handleDeleteFee = async (id: string) => {
        if(!window.confirm("Delete this fee structure? Payments will be unlinked.")) return;
        const res = await api.deleteFeeStructure(id);
        if(res.success) {
            onRefresh();
            if(selectedFeeId === id) { setSelectedFeeId(''); setFeeCollectionData([]); }
        }
    };

    const getCurrentFee = () => feeStructures.find(f => f.id === selectedFeeId);

    return (
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="md:col-span-1 space-y-6">
                <GlassCard className="border-t-4 border-t-green-500 relative overflow-hidden">
                    {successMsg && (
                        <div className="absolute inset-0 z-10 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center text-center animate-fade-in-up">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400"/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{successMsg}</h3>
                        </div>
                    )}
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center shrink-0">
                            <Wallet className="w-6 h-6 text-green-600 dark:text-green-400"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">New Fee</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Define amount & due date</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreateFee} className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Fee Name</label><GlassInput placeholder="e.g. Bus Fee / Term 1" value={newFee.name} onChange={e => setNewFee({...newFee, name: e.target.value})} required /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Amount (₹)</label><GlassInput type="number" placeholder="0.00" value={newFee.amount} onChange={e => setNewFee({...newFee, amount: e.target.value})} required /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Due Date</label><GlassInput type="date" value={newFee.dueDate} onChange={e => setNewFee({...newFee, dueDate: e.target.value})} /></div>
                        <GlassButton type="submit" disabled={creatingFee} className="w-full flex items-center justify-center gap-2">{creatingFee ? 'Creating...' : <><Plus className="w-4 h-4"/> Create Fee</>}</GlassButton>
                    </form>
                </GlassCard>
            </div>

            <div className="md:col-span-2 space-y-6">
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {feeStructures.map(fee => (
                        <div key={fee.id} className="relative group">
                            <button onClick={() => loadFeeCollection(fee.id)} className={`px-4 py-2 rounded-lg border text-sm font-bold whitespace-nowrap transition-all ${selectedFeeId === fee.id ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{fee.name} (₹{fee.amount})</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFee(fee.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3 h-3"/></button>
                        </div>
                    ))}
                    {feeStructures.length === 0 && <p className="text-sm text-slate-400 italic">No fees created yet.</p>}
                </div>

                {selectedFeeId ? (
                    <GlassCard className="p-0 overflow-hidden">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 dark:text-white">Collection Status</h4>
                            <div className="flex gap-4 text-xs">
                                <span className="text-green-600 font-bold">Paid: {feeCollectionData.filter(s => s.status === 'PAID').length}</span>
                                <span className="text-red-500 font-bold">Pending: {feeCollectionData.filter(s => s.status === 'PENDING').length}</span>
                            </div>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase sticky top-0">
                                    <tr><th className="p-3">Student</th><th className="p-3">Class</th><th className="p-3 text-right">Paid / Total</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {feeCollectionData.map((record: any) => {
                                        const paidAmount = record.paymentDetails?.amount_paid || 0;
                                        const totalAmount = getCurrentFee()?.amount || 0;
                                        return (
                                            <tr key={record.student.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-3 font-bold text-slate-800 dark:text-white">{record.student.name}</td>
                                                <td className="p-3 text-slate-500">{record.className}</td>
                                                <td className="p-3 text-right font-mono"><span className={paidAmount > 0 ? "text-green-600 font-bold" : "text-slate-400"}>₹{paidAmount}</span> <span className="text-slate-400"> / ₹{totalAmount}</span></td>
                                                <td className="p-3 text-center">
                                                    {record.status === 'PAID' ? <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">PAID</span> : record.status === 'PARTIAL' ? <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">PARTIAL</span> : <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold">PENDING</span>}
                                                </td>
                                                <td className="p-3 text-center flex justify-center gap-2">
                                                    {record.status !== 'PAID' && <button onClick={() => openPaymentModal(record)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-bold shadow-sm">Pay</button>}
                                                    {(record.status === 'PAID' || record.status === 'PARTIAL') && <button onClick={() => generatePDFReceipt(record)} className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1.5 rounded font-bold flex items-center gap-1" title="Download PDF"><Printer className="w-3 h-3"/></button>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {feeCollectionData.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No students found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                ) : <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700"><Wallet className="w-12 h-12 text-slate-300 mx-auto mb-2"/><p className="text-slate-500 dark:text-slate-400">Select a fee category above.</p></div>}
            </div>

            {/* PAYMENT MODAL */}
            {showPaymentModal && payingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up">
                    <GlassCard className="w-full max-w-sm relative border-t-4 border-t-blue-500 bg-white dark:bg-slate-900">
                        <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
                        <div className="text-center mb-6"><h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Payment</h3><p className="text-sm text-slate-500">{payingStudent.student.name} - {getCurrentFee()?.name}</p></div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-6 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Total Fee:</span><span className="font-bold">₹{getCurrentFee()?.amount}</span></div><div className="flex justify-between"><span className="text-slate-500">Already Paid:</span><span className="font-bold text-green-600">₹{payingStudent.paymentDetails?.amount_paid || 0}</span></div><div className="border-t border-slate-200 dark:border-slate-700 my-2"></div><div className="flex justify-between font-black text-slate-800 dark:text-white"><span>Balance Due:</span><span>₹{(getCurrentFee()?.amount || 0) - (payingStudent.paymentDetails?.amount_paid || 0)}</span></div></div>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Amount Paying Now</label><div className="relative"><IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400"/><GlassInput type="number" className="pl-9 font-bold text-lg" placeholder="0.00" value={amountPaying} onChange={e => setAmountPaying(e.target.value)} autoFocus required /></div></div>
                            <GlassButton type="submit" disabled={processingPayment} className="w-full bg-blue-600 hover:bg-blue-700">{processingPayment ? 'Processing...' : 'Confirm Payment'}</GlassButton>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default FeesTab;