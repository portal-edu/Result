

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PUBLIC = 'PUBLIC',
  GUEST = 'GUEST'
}

export interface Student {
  id: string;
  regNo: string;
  name: string;
  classId: string;
  dob: string; // YYYY-MM-DD
  fatherName: string;
  motherName: string;
  photoUrl?: string;
  password?: string; // In real app, hashed
  isVerified?: boolean;
}

export interface SubjectConfig {
  name: string;
  maxMarks: number;
  passMarks: number;
}

export interface ClassData {
  id: string;
  name: string;
  teacherId: string; // Internal ID or Login ID
  teacherName?: string; // Display Name
  password?: string;
  subjects: SubjectConfig[];
}

export interface Marks {
  studentId: string;
  subjects: Record<string, number | string>; // Support numbers or 'AB'
  total: number;
  grade: string;
  term: string;
}

export interface ProfileRequest {
  id: string;
  studentId: string;
  studentName?: string; // UI helper
  regNo?: string;       // UI helper
  field: string;
  oldValue?: string;
  newValue: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export type PaymentStatus = 'FREE' | 'PENDING' | 'PAID';

export interface SchoolConfig {
  id?: string;
  schoolName: string;
  slug?: string; // Unique short code for the school
  sheetUrl: string;
  licenseKey: string;
  isPro: boolean;
  themeColor: string;
  adminEmail?: string;
  phone?: string;
  place?: string;
  createdAt?: string;
  expiryDate?: string;
  paymentStatus?: PaymentStatus;
  transactionRef?: string;
  allowTeacherSubjectEdit?: boolean;
  admissionToken?: string; // Secure token for public registration links
}