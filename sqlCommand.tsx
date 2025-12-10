
import React from 'react';
import { GlassCard } from './components/GlassUI';

const SQL_CONTENT = `-- ==============================================================================
-- 🚀 RESULTMATE - PRODUCTION DATABASE SCRIPT (v5.0 - CREDIT ECONOMY)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CORE TABLES & RLS

CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Config" ON app_config FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS schools (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    auth_id UUID UNIQUE, 
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    admin_email TEXT NOT NULL,
    phone TEXT,
    place TEXT,
    logo_url TEXT,
    cover_photo TEXT,
    theme_color TEXT DEFAULT 'blue',
    is_pro BOOLEAN DEFAULT FALSE,
    license_key TEXT DEFAULT 'FREE',
    payment_status TEXT DEFAULT 'FREE',
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    academic_year TEXT DEFAULT '2024-25',
    result_publish_date TIMESTAMP WITH TIME ZONE,
    scheduled_publish_date TIMESTAMP WITH TIME ZONE,
    allow_public_admission BOOLEAN DEFAULT TRUE,
    allow_teacher_edit BOOLEAN DEFAULT TRUE,
    admission_token TEXT,
    admission_config JSONB DEFAULT '{"askPhoto": false, "askBloodGroup": false}'::jsonb,
    enable_ai_remarks BOOLEAN DEFAULT FALSE,
    enable_ai_voice BOOLEAN DEFAULT FALSE,
    enable_ai_prediction BOOLEAN DEFAULT FALSE,
    recovery_code TEXT, 
    has_principal_login BOOLEAN DEFAULT FALSE,
    principal_email TEXT,
    principal_password TEXT,
    principal_invite_token TEXT,
    wallet_balance NUMERIC DEFAULT 50, -- WELCOME BONUS: 50 Credits Free
    referred_by_school_id TEXT, 
    referral_source TEXT, 
    referral_code TEXT,
    hijri_adjustment INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Admin Update Own School" ON schools FOR UPDATE USING (auth.uid() = auth_id);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, 
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School View Wallet" ON credit_transactions FOR SELECT USING (
    school_id IN (SELECT id FROM schools WHERE auth_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    teacher_name TEXT DEFAULT 'Class Teacher',
    teacher_password TEXT,
    teacher_photo TEXT,
    subjects JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'DRAFT',
    wallet_balance NUMERIC DEFAULT 0, -- Teacher's Personal Wallet
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, name)
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Classes" ON classes FOR SELECT USING (true);
CREATE POLICY "School Admin Manage Classes" ON classes FOR ALL USING (
    school_id IN (SELECT id FROM schools WHERE auth_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    reg_no TEXT NOT NULL,
    roll_no INTEGER,
    name TEXT NOT NULL,
    dob DATE,
    gender TEXT DEFAULT 'Male',
    father_name TEXT,
    mother_name TEXT,
    phone TEXT,
    address TEXT,
    blood_group TEXT,
    photo_url TEXT,
    password TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expiry TIMESTAMP WITH TIME ZONE,
    added_by TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, reg_no)
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Students" ON students FOR SELECT USING (true);
CREATE POLICY "School Admin Manage Students" ON students FOR ALL USING (
    school_id IN (SELECT id FROM schools WHERE auth_id = auth.uid())
);
CREATE POLICY "Public Insert Student" ON students FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS marks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    term TEXT NOT NULL,
    subjects JSONB NOT NULL,
    total NUMERIC DEFAULT 0,
    grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, term)
);
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Marks" ON marks FOR SELECT USING (true);
CREATE POLICY "Admin Write Marks" ON marks FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE school_id IN (SELECT id FROM schools WHERE auth_id = auth.uid()))
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    due_date DATE,
    target_class_ids JSONB DEFAULT '[]'::jsonb,
    collected_by TEXT DEFAULT 'ADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Manage Fees" ON fee_structures FOR ALL USING (
    school_id IN (SELECT id FROM schools WHERE auth_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    fee_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    amount_paid NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'PAID',
    paid_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    collected_by TEXT,
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fee_id, student_id)
);
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin Manage Payments" ON fee_payments FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE school_id IN (SELECT id FROM schools WHERE auth_id = auth.uid()))
);

-- 3. FUNCTIONS
CREATE OR REPLACE FUNCTION deduct_credits_safe(school_id_in UUID, amount_in NUMERIC, reason_in TEXT)
RETURNS JSONB AS $$
DECLARE
  current_bal NUMERIC;
BEGIN
  SELECT wallet_balance INTO current_bal FROM schools WHERE id = school_id_in FOR UPDATE;
  
  IF current_bal IS NULL OR current_bal < amount_in THEN
    RETURN '{"success": false, "message": "Insufficient Credits"}'::jsonb;
  END IF;

  UPDATE schools SET wallet_balance = wallet_balance - amount_in WHERE id = school_id_in;
  
  INSERT INTO credit_transactions (school_id, amount, type, description)
  VALUES (school_id_in, amount_in, 'DEBIT', reason_in);
  
  RETURN '{"success": true}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

const SqlCommand: React.FC = () => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(SQL_CONTENT);
        alert("SQL Copied to Clipboard!");
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 animate-fade-in-up">
            <GlassCard className="max-w-4xl mx-auto h-[85vh] flex flex-col border-t-4 border-emerald-500">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">Database Setup (v5.0)</h1>
                        <p className="text-sm text-slate-500">Includes Credit System & 50 Free Welcome Credits</p>
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Copy SQL
                    </button>
                </div>
                
                <div className="flex-1 bg-slate-950 rounded-xl p-6 overflow-auto border border-slate-800 shadow-inner custom-scrollbar relative group">
                    <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap leading-relaxed">
                        {SQL_CONTENT}
                    </pre>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>IMPORTANT:</strong> Running this will set up the new Credit Economy. New schools will automatically get 50 Credits.
                </div>
            </GlassCard>
        </div>
    );
};

export default SqlCommand;
