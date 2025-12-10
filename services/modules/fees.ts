
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { FeeStructure } from '../../types';
import { getSchoolId, getErrorMsg } from '../utils';
import { getStudentsByClass } from './students';

export const createFeeStructure = async (
    name: string, 
    amount: number | string, 
    dueDate: string, 
    targetClassIds: string[] = [], 
    collectedBy: 'ADMIN'|'TEACHER'|'BOTH' = 'ADMIN',
    recurrence?: { frequency: string, count: number }
) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };
    if (!isSupabaseConfigured()) return { success: true };
    
    // Validate Amount - Handle string input safely
    const finalAmount = parseFloat(amount.toString());
    if (isNaN(finalAmount) || finalAmount <= 0) {
        return { success: false, message: "Invalid Amount" };
    }

    const feesToCreate = [];
    let currentDueDate = new Date(dueDate || new Date());

    if (recurrence && recurrence.count > 1) {
        for (let i = 0; i < recurrence.count; i++) {
            let feeName = `${name} (${i+1}/${recurrence.count})`;
            
            let nextDate = new Date(currentDueDate);
            if (recurrence.frequency === 'WEEKLY') nextDate.setDate(nextDate.getDate() + (i * 7));
            else if (recurrence.frequency === 'BIWEEKLY') nextDate.setDate(nextDate.getDate() + (i * 14));
            else if (recurrence.frequency === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + i);
            else if (recurrence.frequency === 'BIMONTHLY') nextDate.setMonth(nextDate.getMonth() + (i * 2));
            else if (recurrence.frequency === 'QUARTERLY') nextDate.setMonth(nextDate.getMonth() + (i * 3));
            else if (recurrence.frequency === 'HALFYEARLY') nextDate.setMonth(nextDate.getMonth() + (i * 6));
            else if (recurrence.frequency === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + i);

            feesToCreate.push({
                school_id: schoolId,
                name: feeName,
                amount: finalAmount,
                due_date: nextDate.toISOString().split('T')[0],
                target_class_ids: targetClassIds && targetClassIds.length > 0 ? targetClassIds : [], // Ensure array
                collected_by: collectedBy
            });
        }
    } else {
        feesToCreate.push({
            school_id: schoolId,
            name,
            amount: finalAmount,
            due_date: dueDate,
            target_class_ids: targetClassIds && targetClassIds.length > 0 ? targetClassIds : [], // Ensure array
            collected_by: collectedBy
        });
    }
    
    const { error } = await supabase.from('fee_structures').insert(feesToCreate);
    
    return { success: !error, message: error ? getErrorMsg(error) : undefined };
};

export const getFeeStructures = async (classId?: string) => {
    if (!isSupabaseConfigured()) return [];
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    
    const { data } = await supabase.from('fee_structures').select('*').eq('school_id', schoolId).order('created_at', { ascending: false });
    if (!data) return [];

    return data.filter((fee: any) => {
        if (classId && fee.target_class_ids && fee.target_class_ids.length > 0) {
            // If targetClassIds is a JSON string, parse it, otherwise use as array
            const targets = typeof fee.target_class_ids === 'string' ? JSON.parse(fee.target_class_ids) : fee.target_class_ids;
            return targets.includes(classId);
        }
        return true; 
    }).map((fee: any) => ({
        id: fee.id,
        name: fee.name,
        amount: fee.amount,
        dueDate: fee.due_date,
        targetClassIds: typeof fee.target_class_ids === 'string' ? JSON.parse(fee.target_class_ids) : fee.target_class_ids,
        collectedBy: fee.collected_by || 'ADMIN',
        createdAt: fee.created_at
    } as FeeStructure));
};

// IMPROVED: Logic for Partial Payments
export const recordFeePayment = async (feeId: string, studentId: string, amountPayingNow: number, totalFeeAmount: number, collectedBy: string) => {
    if (!isSupabaseConfigured()) return { success: true, transactionId: 'DEMO-TXN' };
    const tid = 'TXN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    try {
        // 1. Check existing payment to handle partial accumulation
        const { data: existing } = await supabase.from('fee_payments')
            .select('amount_paid')
            .eq('fee_id', feeId)
            .eq('student_id', studentId)
            .maybeSingle();

        // 2. Calculate new total
        const previousPaid = existing?.amount_paid || 0;
        const newTotalPaid = previousPaid + amountPayingNow;
        
        // 3. Determine Status
        // Allow a small margin of error for float comparison, or just strict check
        const status = newTotalPaid >= totalFeeAmount ? 'PAID' : 'PARTIAL';

        // 4. Upsert (Create or Update)
        const { error } = await supabase.from('fee_payments').upsert({
            fee_id: feeId,
            student_id: studentId,
            amount_paid: newTotalPaid,
            status: status,
            paid_date: new Date().toISOString(),
            collected_by: collectedBy,
            transaction_id: tid // Updates transaction ID to the latest receipt
        }, { onConflict: 'fee_id, student_id' });

        if (error) throw error;

        return { success: true, transactionId: tid };

    } catch (e: any) {
        return { success: false, message: getErrorMsg(e) };
    }
};

export const getStudentPayments = async (studentId: string) => {
    if (!isSupabaseConfigured()) return [];
    const { data } = await supabase.from('fee_payments').select('*').eq('student_id', studentId);
    return data || [];
};

export const getFeeCollectionStats = async (feeId: string, classId: string) => {
    if (!isSupabaseConfigured()) return [];
    const students = await getStudentsByClass(classId);
    const { data: payments } = await supabase.from('fee_payments').select('*').eq('fee_id', feeId);
    
    const paymentMap = new Map();
    if (payments && Array.isArray(payments)) {
        payments.forEach((p: any) => paymentMap.set(p.student_id, p));
    }

    return students.map(s => ({
        student: s,
        status: paymentMap.has(s.id) ? paymentMap.get(s.id).status : 'PENDING',
        paymentDetails: paymentMap.get(s.id) || null
    }));
};

export const deleteFeeStructure = async (id: string) => {
    if (!isSupabaseConfigured()) return { success: true };
    const { error } = await supabase.from('fee_structures').delete().eq('id', id);
    return { success: !error };
};
