const nodemailer = require('nodemailer');

/**
 * Centralized Generic Email Service
 * Exposed for future verification and recovery features.
 * 
 * @param {Object} options 
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} [options.text] - Plain text email body
 * @param {string} [options.html] - HTML email body
 */
const sendEmail = async ({ to, subject, text, html }) => {
    // 1. Validate required payload
    if (!to || !subject || (!text && !html)) {
        throw new Error('Email service requires "to", "subject", and at least one of "text" or "html".');
    }

    const mode = process.env.EMAIL_MODE;
    const env = process.env.NODE_ENV || 'development';

    // 2. Production Safety Check
    if (env === 'production' && mode !== 'smtp') {
        throw new Error('CRITICAL: EMAIL_MODE must be "smtp" in a production environment.');
    }

    // 3. Enforce explicit modes (No silent fallbacks)
    if (!mode) {
        throw new Error('EMAIL_MODE environment variable is not defined.');
    }

    // ==========================================
    // CONSOLE MODE (Development Simulation)
    // ==========================================
    if (mode === 'console') {
        // SECURITY: Log ONLY safe metadata. Do NOT log text or html payload to prevent secret leaks (OTPs, tokens).
        console.log(`[Email Service - Console Mode] Simulated sending email to: ${to}`);
        console.log(`[Email Service - Console Mode] Subject: ${subject}`);
        
        return { success: true, message: 'Email simulated safely in console mode' };
    }

    // ==========================================
    // SMTP MODE (Actual Delivery)
    // ==========================================
    if (mode === 'smtp') {
        const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

        // Strict configuration validation - do not expose which credential failed specifically to avoid leaks
        if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
            throw new Error('SMTP Mode active but required SMTP configuration is missing from environment.');
        }

        const transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: parseInt(EMAIL_PORT, 10),
            secure: parseInt(EMAIL_PORT, 10) === 465, // True only for strict SSL on port 465
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS
            }
        });

        const mailOptions = {
            from: EMAIL_FROM,
            to,
            subject,
            text,
            html
        };

        await transporter.sendMail(mailOptions);
        
        return { success: true, message: 'Email sent successfully via SMTP' };
    }

    // Catch-all for unrecognized modes
    throw new Error(`Invalid EMAIL_MODE: "${mode}". Supported modes are "console" and "smtp".`);
};

module.exports = { sendEmail };