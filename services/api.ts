
import * as Auth from './modules/auth';
import * as School from './modules/school';
import * as Classes from './modules/classes';
import * as Students from './modules/students';
import * as Marks from './modules/marks';
import * as Fees from './modules/fees';
import * as Assessments from './modules/assessments';
import * as Exams from './modules/exams';
import * as Admin from './modules/admin';
import * as SuperAdmin from './modules/superadmin';
import * as Support from './modules/support';
import * as EmailService from './emailService'; 
import * as Crowd from './modules/crowd'; 
import * as Attendance from './modules/attendance'; 
import * as Payment from './paymentService'; 
import { generateRecoveryCode } from './modules/auth';

export const api = {
    generateRecoveryCode, 
    ...Auth,
    ...School,
    ...Classes,
    ...Students,
    ...Marks,
    ...Fees,
    ...Assessments,
    ...Exams,
    ...Admin,
    ...SuperAdmin,
    ...Support,
    ...Crowd, 
    ...Attendance,
    ...Payment,
    ...EmailService
};
