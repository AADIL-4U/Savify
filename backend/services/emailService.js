const nodemailer = require('nodemailer');

/**
 * Helper to parse EMAIL_FROM into { name, email } for Brevo's REST API
 * Supports both "Savify <user@example.com>" and "user@example.com"
 */
const parseSender = (emailFrom) => {
    const match = emailFrom.match(/^(?:"?([^"]*)"?\s)?<?([^<>]+@[^<>]+)>?$/);
    if (match) {
        return {
            name: (match[1] || 'Savify').trim(),
            email: match[2].trim()
        };
    }
    return { name: 'Savify', email: emailFrom.trim() };
};

/**
 * Centralized Generic Email Service
 * Supports "console" (dev), "brevo" (HTTPS API for Render), and "smtp" (local/VPS)
 */
const sendEmail = async ({ to, subject, text, html }) => {
    // 1. Validate required payload
    if (!to || !subject || (!text && !html)) {
        throw new Error('Email service requires "to", "subject", and at least one of "text" or "html".');
    }

    const mode = process.env.EMAIL_MODE;
    const env = process.env.NODE_ENV || 'development';

    // 2. Production Safety Check
    if (env === 'production' && !['smtp', 'brevo'].includes(mode)) {
        throw new Error('CRITICAL: EMAIL_MODE must be "brevo" or "smtp" in a production environment.');
    }

    // 3. Enforce explicit modes (No silent fallbacks)
    if (!mode) {
        throw new Error('EMAIL_MODE environment variable is not defined.');
    }

    // ==========================================
    // CONSOLE MODE (Development Simulation)
    // ==========================================
    if (mode === 'console') {
        console.log(`[Email Service - Console Mode] Simulated sending email to: ${to}`);
        console.log(`[Email Service - Console Mode] Subject: ${subject}`);
        return { success: true, message: 'Email simulated safely in console mode' };
    }

    // ==========================================
    // BREVO HTTPS API MODE (Production on Render)
    // ==========================================
    if (mode === 'brevo') {
        const { BREVO_API_KEY, EMAIL_FROM } = process.env;

        if (!BREVO_API_KEY || !EMAIL_FROM) {
            throw new Error('Brevo Mode active but BREVO_API_KEY or EMAIL_FROM is missing from environment.');
        }

        const payload = {
            sender: parseSender(EMAIL_FROM),
            to: [{ email: to }],
            subject
        };

        if (html) payload.htmlContent = html;
        if (text) payload.textContent = text;

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY.trim(),
                'content-type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Brevo API failed (${response.status}): ${errorDetails}`);
        }

        return { success: true, message: 'Email sent successfully via Brevo API' };
    }

    // ==========================================
    // SMTP MODE (Local / Non-Blocked Hosts)
    // ==========================================
    if (mode === 'smtp') {
        const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

        if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
            throw new Error('SMTP Mode active but required SMTP configuration is missing from environment.');
        }

        const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: parseInt(EMAIL_PORT, 10),
            secure: parseInt(EMAIL_PORT, 10) === 465,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: EMAIL_FROM,
            to,
            subject,
            text,
            html
        });

        return { success: true, message: 'Email sent successfully via SMTP' };
    }

    throw new Error(`Invalid EMAIL_MODE: "${mode}". Supported modes are "console", "brevo", and "smtp".`);
};

module.exports = { sendEmail };