import { supabase } from './supabaseClient';

// CONFIGURATION
// To use EmailJS (Professional background emails), sign up at emailjs.com and fill these:
const EMAILJS_SERVICE_ID = ''; 
const EMAILJS_TEMPLATE_ID = '';
const EMAILJS_PUBLIC_KEY = '';

/**
 * Handles sending emails for critical actions like Password Reset, 
 * Ownership Transfer, and Support Tickets.
 * 
 * STRATEGY:
 * 1. Try Supabase Auth for standard Auth emails (Password Reset).
 * 2. Try EmailJS for custom alerts (if configured).
 * 3. Fallback to `mailto:` (Opens user's email app) - 100% Free & Unlimited.
 */

export const sendOwnershipRequest = (currentOwnerEmail: string, schoolName: string, newOwnerDetails: string) => {
    const subject = `Ownership Transfer Request: ${schoolName}`;
    const body = `Hello Super Admin,\n\nI am the current admin of ${schoolName} (${currentOwnerEmail}).\n\nI would like to transfer the ownership of this portal to:\n${newOwnerDetails}\n\nPlease verify and process this request.\n\nRegards,\n${currentOwnerEmail}`;

    if (EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY) {
        // Implementation for EmailJS would go here
        // import emailjs from '@emailjs/browser';
        // emailjs.send(...)
        console.log("Sending via EmailJS...");
    }

    // Fallback: Open User's Email Client
    window.open(`mailto:niyasedavachal@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    return { success: true, message: "Email client opened. Please hit Send." };
};

export const sendCriticalAlert = (type: 'BUG' | 'SECURITY' | 'BILLING', message: string, userEmail: string) => {
    const subject = `[${type}] Critical Alert from ${userEmail}`;
    const body = `User: ${userEmail}\n\nMessage:\n${message}`;
    
    // Attempt background send if possible, else fallback
    window.open(`mailto:support@schoolresultpro.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
};

export const triggerPasswordReset = async (email: string) => {
    // 1. Try Supabase Native Reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/#/login?reset=true',
    });

    if (error) {
        console.error("Supabase Reset Error:", error.message);
        return { 
            success: false, 
            message: "Automated reset failed. Please contact support.", 
            manualAction: true 
        };
    }

    return { success: true, message: "Password reset link sent to your email." };
};

export const requestManualReset = (email: string) => {
    const subject = "Manual Password Reset Request";
    const body = `Hello Support,\n\nI am unable to reset my password via the automated link.\n\nEmail: ${email}\n\nPlease assist me.`;
    window.open(`mailto:support@schoolresultpro.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
};