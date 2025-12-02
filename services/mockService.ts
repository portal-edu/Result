import { ClassData, Marks, ProfileRequest, Role, Student, SchoolConfig } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data
const MOCK_CLASSES: ClassData[] = [
  { 
    id: 'c1', 
    name: '10 A', 
    teacherId: 't1', 
    password: '123', 
    subjects: [
      { name: 'Maths', maxMarks: 100, passMarks: 35 }, 
      { name: 'Physics', maxMarks: 100, passMarks: 35 }, 
      { name: 'Chemistry', maxMarks: 100, passMarks: 35 }, 
      { name: 'English', maxMarks: 100, passMarks: 35 }, 
      { name: 'Malayalam', maxMarks: 100, passMarks: 35 }
    ] 
  },
  { 
    id: 'c2', 
    name: '10 B', 
    teacherId: 't2', 
    password: '123', 
    subjects: [
      { name: 'Commerce', maxMarks: 100, passMarks: 35 }, 
      { name: 'Accountancy', maxMarks: 100, passMarks: 35 }, 
      { name: 'English', maxMarks: 100, passMarks: 35 }, 
      { name: 'Economics', maxMarks: 100, passMarks: 35 }
    ] 
  }
];

const MOCK_STUDENTS: Student[] = [
  { id: 's1', regNo: '1001', name: 'Arjun Das', classId: 'c1', dob: '2008-05-12', fatherName: 'Das K', motherName: 'Sreeja' },
  { id: 's2', regNo: '1002', name: 'Fathima R', classId: 'c1', dob: '2008-08-20', fatherName: 'Raheem', motherName: 'Amina' },
  { id: 's3', regNo: '2001', name: 'John Doe', classId: 'c2', dob: '2008-01-15', fatherName: 'Mark Doe', motherName: 'Jane' }
];

const MOCK_MARKS: Marks[] = [
  { studentId: 's1', term: 'Term 1', subjects: { 'Maths': 95, 'Physics': 88, 'Chemistry': 90, 'English': 85, 'Malayalam': 92 }, total: 450, grade: 'A+' }
];

const MOCK_REQUESTS: ProfileRequest[] = [
  { id: 'r1', studentId: 's1', field: 'name', oldValue: 'Arjun Das', newValue: 'Arjun K Das', status: 'PENDING' }
];

let MOCK_SCHOOL_CONFIG: SchoolConfig = {
  schoolName: 'Govt Model HSS',
  sheetUrl: 'https://docs.google.com/spreadsheets/u/0/',
  licenseKey: 'FREE-TIER',
  isPro: false,
  themeColor: 'indigo'
};

export const mockApi = {
  login: async (role: Role, credentials: any) => {
    await delay(1000);
    if (role === Role.ADMIN && credentials.password === 'admin123') return { success: true };
    if (role === Role.TEACHER) {
        const cls = MOCK_CLASSES.find(c => c.id === credentials.classId && c.password === credentials.password);
        return cls ? { success: true, user: cls } : { success: false };
    }
    if (role === Role.STUDENT) {
        const stu = MOCK_STUDENTS.find(s => s.id === credentials.studentId);
        // Simplified password check
        return stu ? { success: true, user: stu } : { success: false };
    }
    return { success: false };
  },

  getClasses: async () => {
    await delay(500);
    return MOCK_CLASSES;
  },

  getStudentsByClass: async (classId: string) => {
    await delay(500);
    return MOCK_STUDENTS.filter(s => s.classId === classId);
  },

  getMarks: async (studentId: string, term: string) => {
    await delay(600);
    return MOCK_MARKS.find(m => m.studentId === studentId && m.term === term) || null;
  },

  saveMarks: async (marks: Marks) => {
    await delay(800);
    const existingIndex = MOCK_MARKS.findIndex(m => m.studentId === marks.studentId && m.term === marks.term);
    if (existingIndex >= 0) {
      MOCK_MARKS[existingIndex] = marks;
    } else {
      MOCK_MARKS.push(marks);
    }
    return { success: true };
  },

  getProfileRequests: async (classId: string) => {
      await delay(500);
      // In real app, filter by students in this class
      return MOCK_REQUESTS;
  },

  publicSearch: async (regNo: string, dob: string) => {
      await delay(1500);
      const student = MOCK_STUDENTS.find(s => s.regNo === regNo && s.dob === dob);
      if (!student) return null;
      const marks = MOCK_MARKS.find(m => m.studentId === student.id && m.term === 'Term 1'); // Default to Term 1
      return { student, marks };
  },

  getSchoolConfig: async () => {
      await delay(400);
      return { ...MOCK_SCHOOL_CONFIG };
  },

  activateLicense: async (key: string) => {
      await delay(1000);
      if (key === 'PRO-2024' || key === 'TERM-1-PRO') {
          MOCK_SCHOOL_CONFIG = {
              ...MOCK_SCHOOL_CONFIG,
              isPro: true,
              licenseKey: key
          };
          return { success: true, message: 'Premium License Activated!' };
      }
      return { success: false, message: 'Invalid License Key' };
  }
};