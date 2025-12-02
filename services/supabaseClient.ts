import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// YOUR SUPABASE KEYS
// ------------------------------------------------------------------
// Supabase Dashboard -> Project Settings -> API ൽ നിന്ന് ലഭിക്കുന്നത് ഇവിടെ നൽകുക.

const DEFAULT_URL = 'https://eannpgaknjctmcrhhnqw.supabase.co'; 
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbm5wZ2FrbmpjdG1jcmhobnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTk4MjYsImV4cCI6MjA4MDIzNTgyNn0.zPI39Lr7vAgfs9J6FEC8SiQ1fyWdE9bvnVb674dpbeE'; 

// ------------------------------------------------------------------

const getUrl = () => localStorage.getItem('sb_url') || DEFAULT_URL;
const getKey = () => localStorage.getItem('sb_key') || DEFAULT_KEY;

export const supabase = createClient(getUrl(), getKey());

export const getSupabaseConfig = () => ({
    url: getUrl(),
    key: getKey()
});

// Helper to check if we are connected
export const isSupabaseConfigured = () => true;

// No longer needed, but kept for compatibility
export const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('sb_url');
    localStorage.removeItem('sb_key');
};