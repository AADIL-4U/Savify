const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getMe, 
    updateProfile, 
    updatePassword,
    updateSecurityQuestion,
    initiateForgotPassword,
    verifySecurityAnswer,
    requestPasswordOtp,
    verifyPasswordOtp,
    resetPassword,
    requestDeleteOtp,
    deleteAccount,
    verifyEmail,
    resendVerificationEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

// Rate limiter instance for password recovery actions (SQ verify, OTP verify, Reset)
const passwordRecoveryLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 6,
    message: 'Too many password recovery attempts. Please try again later.'
});

// Phase 17: OTP Request Limiters (IP + Email Cooldown)
const otpRequestIpLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many OTP requests from this IP. Please try again later.',
    keyGenerator: (req) => `otp-ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`
});

const otpRequestEmailLimiter = rateLimiter({
    windowMs: 60 * 1000, // 60 second strict cooldown
    max: 1,
    message: 'Please wait 60 seconds before requesting another recovery code.',
    keyGenerator: (req) => `otp-email:${(req.body.email || '').toLowerCase().trim()}`
});

// Phase 15: Dual limiters for resend verification email
const verificationIpLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 6,
    message: 'Too many resend attempts from this IP. Please try again later.',
    keyGenerator: (req) => `verification-ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`
});

const verificationEmailLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: 'Too many resend attempts for this email. Please try again later.',
    keyGenerator: (req) => `verification-email:${(req.body.email || '').toLowerCase().trim() || req.ip || 'unknown'}`
});

// Phase 19 limiters for account deletion
const deleteOtpRequestIpLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many deletion code requests from this IP. Please try again later.',
    keyGenerator: (req) => `del-req-ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`
});

const deleteOtpRequestUserLimiter = rateLimiter({
    windowMs: 60 * 1000,
    max: 1,
    message: 'Please wait 60 seconds before requesting another deletion code.',
    keyGenerator: (req) => req.user ? `del-req-usr:${req.user.id}` : 'del-req-usr-unknown' 
});

const deleteOtpVerifyIpLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many deletion verification attempts from this IP. Please try again later.',
    keyGenerator: (req) => `del-ver-ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`
});

// Existing Public Auth Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Phase 15 Verification Routes
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', verificationIpLimiter, verificationEmailLimiter, resendVerificationEmail);

// Existing Protected Routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/security-question', protect, updateSecurityQuestion);

// Phase 19 Account Deletion Routes (Strict ordering)
router.post('/account/request-delete-otp', deleteOtpRequestIpLimiter, protect, deleteOtpRequestUserLimiter, requestDeleteOtp);
router.delete('/account', deleteOtpVerifyIpLimiter, protect, deleteAccount);

// Public Recovery & Reset Routes (Phase 12 + Phase 17)
router.post('/forgot-password/initiate', passwordRecoveryLimiter, initiateForgotPassword);
router.post('/forgot-password/verify', passwordRecoveryLimiter, verifySecurityAnswer);
router.post('/forgot-password/request-otp', otpRequestIpLimiter, otpRequestEmailLimiter, requestPasswordOtp);
router.post('/forgot-password/verify-otp', passwordRecoveryLimiter, verifyPasswordOtp);
router.post('/reset-password', passwordRecoveryLimiter, resetPassword);

module.exports = router;