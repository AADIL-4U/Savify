const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../services/emailService');

const DUMMY_BCRYPT_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const escapeHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (match) => {
        const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escapeMap[match];
    });
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const issuePasswordResetToken = async (user) => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 
    await user.save();
    return rawToken;
};

const issueEmailVerificationToken = async (user) => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; 
    await user.save();
    return rawToken;
};

const sendVerificationEmailHelper = async (user, rawToken) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email/${rawToken}`;
    const safeName = escapeHTML(user.name);

    const messageHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Savify, ${safeName}!</h2>
            <p>Your account has been created successfully. Please verify your email address to activate your account and start tracking your finances.</p>
            <div style="margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
            </div>
            <p style="font-size: 14px; color: #666;">This link expires in 24 hours.</p>
            <p style="font-size: 12px; color: #999;">If you did not create this account, you can safely ignore this email.</p>
        </div>
    `;

    const messageText = `Welcome to Savify, ${user.name}!\n\nPlease verify your email address to activate your account by clicking the link below:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\nIf you did not create this account, please ignore this email.`;

    await sendEmail({
        to: user.email,
        subject: 'Verify your Savify Account',
        text: messageText,
        html: messageHTML
    });
};

const ALLOWED_COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const validateStrictCalendarDate = (dobString) => {
    if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) return false;
    
    const [y, m, d] = dobString.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    if (dateObj.getUTCFullYear() !== y || dateObj.getUTCMonth() + 1 !== m || dateObj.getUTCDate() !== d) {
        return false;
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    if (dobString >= todayStr) {
        return false;
    }

    return true;
};

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password, dateOfBirth, country, currency } = req.body;

        if (!name || !email || !password || !dateOfBirth || !country || !currency) {
            return res.status(400).json({ success: false, message: 'Please add all fields' });
        }

        if (!['INR', 'USD', 'EUR', 'GBP'].includes(currency)) {
            return res.status(400).json({ success: false, message: 'Invalid currency' });
        }

        if (!ALLOWED_COUNTRIES.includes(country)) {
            return res.status(400).json({ success: false, message: 'Invalid country' });
        }

        if (!validateStrictCalendarDate(dateOfBirth)) {
            return res.status(400).json({ success: false, message: 'Invalid date of birth. Must be a valid past date.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = new RegExp('^' + escapeRegex(normalizedEmail) + '$', 'i');
        const userExists = await User.findOne({ email: emailRegex });
        
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            dateOfBirth: new Date(`${dateOfBirth}T00:00:00.000Z`),
            country,
            currency,
            emailVerified: false
        });

        if (user) {
            const rawToken = await issueEmailVerificationToken(user);
            
            try {
                await sendVerificationEmailHelper(user, rawToken);
            } catch (error) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Account created, but we could not send the verification email. Please use the resend verification option from the login page.' 
                });
            }

            res.status(201).json({
                success: true,
                message: 'Registration successful. Please check your email to verify your account.'
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const emailRegex = new RegExp('^' + escapeRegex(email.trim()) + '$', 'i');
        const user = await User.findOne({ email: emailRegex }).select('+password');

        if (user && (await user.matchPassword(password))) {
            if (user.emailVerified === false) {
                return res.status(403).json({
                    success: false,
                    code: 'UNVERIFIED_EMAIL',
                    message: 'Please verify your email before logging in.'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    currency: user.currency,
                    dateOfBirth: user.dateOfBirth,
                    country: user.country,
                    hasSecurityQuestion: !!user.securityQuestion,
                    token: generateToken(user._id),
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Verification token is missing' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() }
        }).select('+emailVerificationToken +emailVerificationExpire');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now log in.'
        });
    } catch (error) {
        next(error);
    }
};

const resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email address' });
        }

        const emailRegex = new RegExp('^' + escapeRegex(email.trim()) + '$', 'i');
        const user = await User.findOne({ email: emailRegex });

        const genericSuccessMessage = 'If that email is registered and unverified, a new verification link has been sent.';

        if (!user || user.emailVerified !== false) {
            return res.status(200).json({ success: true, message: genericSuccessMessage });
        }

        const rawToken = await issueEmailVerificationToken(user);
        
        try {
            await sendVerificationEmailHelper(user, rawToken);
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to send verification email. Please try again later.' });
        }

        res.status(200).json({ success: true, message: genericSuccessMessage });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const userData = req.user.toObject ? req.user.toObject() : { ...req.user };
        userData.hasSecurityQuestion = !!req.user.securityQuestion;
        delete userData.securityAnswer;
        
        res.status(200).json({ success: true, data: userData });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, currency, dateOfBirth, country } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Name cannot be empty or whitespace-only' });
        }

        const updateData = { name: name.trim() };

        if (currency !== undefined && currency !== null) {
            const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
            if (!supportedCurrencies.includes(currency)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid currency. Supported currencies are INR, USD, EUR, and GBP.' 
                });
            }
            updateData.currency = currency;
        }

        if (dateOfBirth !== undefined && dateOfBirth !== '') {
            if (!validateStrictCalendarDate(dateOfBirth)) {
                return res.status(400).json({ success: false, message: 'Invalid date of birth.' });
            }
            updateData.dateOfBirth = new Date(`${dateOfBirth}T00:00:00.000Z`);
        }

        if (country !== undefined && country !== '') {
            if (!ALLOWED_COUNTRIES.includes(country)) {
                return res.status(400).json({ success: false, message: 'Invalid country.' });
            }
            updateData.country = country;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                currency: updatedUser.currency,
                dateOfBirth: updatedUser.dateOfBirth,
                country: updatedUser.country,
                hasSecurityQuestion: !!updatedUser.securityQuestion
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateSecurityQuestion = async (req, res, next) => {
    try {
        const { securityQuestion, securityAnswer } = req.body;

        if (!securityQuestion || typeof securityQuestion !== 'string' || securityQuestion.trim() === '') {
            return res.status(400).json({ success: false, message: 'Security question is required and cannot be blank' });
        }

        if (!securityAnswer || typeof securityAnswer !== 'string') {
            return res.status(400).json({ success: false, message: 'Security answer is required' });
        }

        const normalizedAnswer = securityAnswer.trim().toLowerCase();
        if (normalizedAnswer.length < 3) {
            return res.status(400).json({ success: false, message: 'Security answer must be at least 3 characters' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.securityQuestion = securityQuestion.trim();
        user.securityAnswer = normalizedAnswer; 
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                securityQuestion: user.securityQuestion,
                hasSecurityQuestion: true
            },
            message: 'Security question configured successfully'
        });
    } catch (error) {
        next(error);
    }
};

const initiateForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email' });
        }
        
        const emailRegex = new RegExp('^' + escapeRegex(email.trim()) + '$', 'i');
        const user = await User.findOne({ email: emailRegex });

        if (!user || !user.securityQuestion) {
            return res.status(200).json({
                success: true,
                data: {
                    securityQuestion: 'What is your security question?'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                securityQuestion: user.securityQuestion
            }
        });
    } catch (error) {
        next(error);
    }
};

const verifySecurityAnswer = async (req, res, next) => {
    try {
        const { email, answer } = req.body;
        if (!email || !answer) {
            return res.status(400).json({ success: false, message: 'Please provide email and answer' });
        }

        const emailRegex = new RegExp('^' + escapeRegex(email.trim()) + '$', 'i');
        const normalizedAnswer = answer.trim().toLowerCase();
        
        if (normalizedAnswer.length < 3) {
            return res.status(400).json({ success: false, message: 'Answer is too short' });
        }

        const user = await User.findOne({ email: emailRegex }).select('+securityAnswer');

        let isMatch = false;
        if (user && user.securityAnswer) {
            isMatch = await user.matchSecurityAnswer(normalizedAnswer);
        } else {
            await bcrypt.compare(normalizedAnswer, DUMMY_BCRYPT_HASH);
        }

        if (!user || !isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect security answer' });
        }

        const rawToken = await issuePasswordResetToken(user);

        res.status(200).json({
            success: true,
            data: {
                resetToken: rawToken
            }
        });
    } catch (error) {
        next(error);
    }
};

// Phase 17: Request Password OTP
const requestPasswordOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = new RegExp('^' + escapeRegex(normalizedEmail) + '$', 'i');
        const user = await User.findOne({ email: emailRegex });

        const genericResponse = 'If an account exists with that email, a recovery code has been sent.';

        if (!user) {
            return res.status(200).json({ success: true, message: genericResponse });
        }

        // Generate 6-digit cryptographically secure OTP
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        user.passwordRecoveryOtpHash = otpHash;
        user.passwordRecoveryOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.passwordRecoveryOtpAttempts = 0;
        await user.save();

        const safeName = escapeHTML(user.name);
        const messageHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Recovery for Savify</h2>
                <p>Hello ${safeName},</p>
                <p>We received a request to reset the password for your Savify account. Please use the following 6-digit recovery code to proceed:</p>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="background-color: #f3f4f6; color: #059669; padding: 16px 32px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #666;">This code expires in 10 minutes and can only be used once.</p>
                <p style="font-size: 12px; color: #999;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
        `;
        const messageText = `Password Recovery for Savify\n\nHello ${user.name},\n\nYour 6-digit recovery code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Your Savify Password Recovery Code',
                text: messageText,
                html: messageHTML
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Failed to send recovery email. Please try again later.' });
        }

        res.status(200).json({ success: true, message: genericResponse });
    } catch (error) {
        next(error);
    }
};

// Phase 17: Verify Password OTP
const verifyPasswordOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide email and recovery code' });
        }

        const emailRegex = new RegExp('^' + escapeRegex(email.trim()) + '$', 'i');
        const user = await User.findOne({ email: emailRegex }).select('+passwordRecoveryOtpHash +passwordRecoveryOtpExpire +passwordRecoveryOtpAttempts');

        if (!user || !user.passwordRecoveryOtpHash || !user.passwordRecoveryOtpExpire) {
            return res.status(400).json({ success: false, message: 'Invalid or expired recovery code.' });
        }

        if (Date.now() > user.passwordRecoveryOtpExpire) {
            return res.status(400).json({ success: false, message: 'Recovery code has expired. Please request a new one.' });
        }

        if (user.passwordRecoveryOtpAttempts >= 5) {
            user.passwordRecoveryOtpHash = undefined;
            user.passwordRecoveryOtpExpire = undefined;
            user.passwordRecoveryOtpAttempts = undefined;
            await user.save();
            return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new recovery code.' });
        }

        const hashedInput = crypto.createHash('sha256').update(otp.trim()).digest('hex');

        if (hashedInput !== user.passwordRecoveryOtpHash) {
            // FULLY ATOMIC: Increment attempts and, if it reaches 5, clear/unset OTP fields in a single operation
            const updatedUser = await User.findOneAndUpdate(
                { 
                    _id: user._id, 
                    passwordRecoveryOtpHash: user.passwordRecoveryOtpHash,
                    passwordRecoveryOtpExpire: { $gt: new Date() }
                },
                [
                    {
                        $set: {
                            passwordRecoveryOtpAttempts: { $add: [{ $ifNull: ["$passwordRecoveryOtpAttempts", 0] }, 1] }
                        }
                    },
                    {
                        $set: {
                            passwordRecoveryOtpHash: {
                                $cond: {
                                    if: { $gte: ["$passwordRecoveryOtpAttempts", 5] },
                                    then: "$$REMOVE",
                                    else: "$passwordRecoveryOtpHash"
                                }
                            },
                            passwordRecoveryOtpExpire: {
                                $cond: {
                                    if: { $gte: ["$passwordRecoveryOtpAttempts", 5] },
                                    then: "$$REMOVE",
                                    else: "$passwordRecoveryOtpExpire"
                                }
                            },
                            passwordRecoveryOtpAttempts: {
                                $cond: {
                                    if: { $gte: ["$passwordRecoveryOtpAttempts", 5] },
                                    then: "$$REMOVE",
                                    else: "$passwordRecoveryOtpAttempts"
                                }
                            }
                        }
                    }
                ],
                { new: true, select: '+passwordRecoveryOtpAttempts', updatePipeline: true }
            );

            if (!updatedUser) {
                return res.status(400).json({ success: false, message: 'Invalid or expired recovery code.' });
            }

            if (updatedUser.passwordRecoveryOtpAttempts === undefined) {
                return res.status(429).json({ success: false, message: 'Too many failed attempts. Recovery code invalidated.' });
            }

            return res.status(401).json({ success: false, message: 'Incorrect recovery code.' });
        }

        // Success: Clear OTP fields to prevent reuse
        user.passwordRecoveryOtpHash = undefined;
        user.passwordRecoveryOtpExpire = undefined;
        user.passwordRecoveryOtpAttempts = undefined;
        
        // Issue standard reset authorization
        const rawToken = await issuePasswordResetToken(user);

        res.status(200).json({
            success: true,
            data: {
                resetToken: rawToken
            }
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, resetToken, newPassword } = req.body;

        if (!email || !resetToken || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const emailRegex = new RegExp('^' + escapeRegex(email.trim()) + '$', 'i');
        const user = await User.findOne({ email: emailRegex }).select('+resetPasswordToken +resetPasswordExpire');

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpire) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        if (user.resetPasswordToken !== hashedToken || user.resetPasswordExpire < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        user.password = newPassword;
        user.passwordChangedAt = new Date();
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        next(error);
    }
};

const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide both current and new passwords' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as current password' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        user.password = newPassword;
        user.passwordChangedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const requestDeleteOtp = async (req, res, next) => {
    try {
        const { currentPassword, confirmationText } = req.body;

        if (confirmationText !== 'DELETE') {
            return res.status(400).json({ success: false, message: 'Please type DELETE exactly as shown' });
        }

        if (!currentPassword || typeof currentPassword !== 'string') {
            return res.status(400).json({ success: false, message: 'Please provide your current password' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
        const expireTime = new Date(Date.now() + 10 * 60 * 1000);

        user.deleteAccountOtpHash = otpHash;
        user.deleteAccountOtpExpire = expireTime;
        user.deleteAccountOtpAttempts = 0;
        await user.save();

        const safeName = escapeHTML(user.name);
        const messageHTML = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Account Deletion Request</h2>
                <p>Hello ${safeName},</p>
                <p>We received a request to permanently delete your Savify account. Please use the following 6-digit code to confirm the deletion:</p>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="background-color: #fee2e2; color: #dc2626; padding: 16px 32px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</span>
                </div>
                <p style="font-size: 14px; color: #666;">This code expires in 10 minutes and can only be used once.</p>
                <p style="font-size: 12px; color: #dc2626; font-weight: bold;">If you did not request this deletion, please log in and change your password immediately.</p>
            </div>
        `;
        const messageText = `Account Deletion Request\n\nHello ${user.name},\n\nYour 6-digit deletion code is: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, please change your password immediately.`;

        try {
            await sendEmail({
                to: user.email,
                subject: 'Savify Account Deletion Code',
                text: messageText,
                html: messageHTML
            });
        } catch (error) {
            try {
                await User.updateOne(
                    { _id: user._id, deleteAccountOtpHash: otpHash, deleteAccountOtpExpire: expireTime },
                    { $unset: { deleteAccountOtpHash: "", deleteAccountOtpExpire: "", deleteAccountOtpAttempts: "" } }
                );
            } catch (cleanupError) {
                console.error('OTP cleanup failed after email delivery error:', cleanupError);
            }
            return res.status(500).json({ success: false, message: 'Failed to send deletion email. Please try again later.' });
        }

        res.status(200).json({ success: true, message: 'Deletion code sent to your email.' });
    } catch (error) {
        next(error);
    }
};

const deleteAccount = async (req, res, next) => {
    try {
        const { otp } = req.body;

        if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit deletion code' });
        }

        const user = await User.findById(req.user.id).select('+deleteAccountOtpHash +deleteAccountOtpExpire +deleteAccountOtpAttempts');

        if (!user || !user.deleteAccountOtpHash || !user.deleteAccountOtpExpire) {
            return res.status(400).json({ success: false, message: 'Invalid or expired deletion code.' });
        }

        if (Date.now() > user.deleteAccountOtpExpire) {
            return res.status(400).json({ success: false, message: 'Deletion code has expired. Please request a new one.' });
        }

        if (user.deleteAccountOtpAttempts >= 5) {
            await User.updateOne(
                { 
                    _id: user._id, 
                    deleteAccountOtpHash: user.deleteAccountOtpHash,
                    deleteAccountOtpExpire: user.deleteAccountOtpExpire
                },
                { $unset: { deleteAccountOtpHash: "", deleteAccountOtpExpire: "", deleteAccountOtpAttempts: "" } }
            );
            return res.status(429).json({ success: false, message: 'Too many failed attempts. Please request a new deletion code.' });
        }

        const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
        let isMatch = false;
        
        if (hashedInput.length === user.deleteAccountOtpHash.length) {
            isMatch = crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(user.deleteAccountOtpHash));
        }

        if (!isMatch) {
            const updatedUser = await User.findOneAndUpdate(
                { 
                    _id: user._id, 
                    deleteAccountOtpHash: user.deleteAccountOtpHash,
                    $and: [
                        { deleteAccountOtpExpire: user.deleteAccountOtpExpire },
                        { deleteAccountOtpExpire: { $gt: new Date() } }
                    ]
                },
                [
                    {
                        $set: { deleteAccountOtpAttempts: { $add: [{ $ifNull: ["$deleteAccountOtpAttempts", 0] }, 1] } }
                    },
                    {
                        $set: {
                            deleteAccountOtpHash: {
                                $cond: { if: { $gte: ["$deleteAccountOtpAttempts", 5] }, then: "$$REMOVE", else: "$deleteAccountOtpHash" }
                            },
                            deleteAccountOtpExpire: {
                                $cond: { if: { $gte: ["$deleteAccountOtpAttempts", 5] }, then: "$$REMOVE", else: "$deleteAccountOtpExpire" }
                            },
                            deleteAccountOtpAttempts: {
                                $cond: { if: { $gte: ["$deleteAccountOtpAttempts", 5] }, then: "$$REMOVE", else: "$deleteAccountOtpAttempts" }
                            }
                        }
                    }
                ],
                { new: true, select: '+deleteAccountOtpAttempts', updatePipeline: true }
            );

            if (!updatedUser) {
                return res.status(400).json({ success: false, message: 'Invalid or expired deletion code.' });
            }

            if (updatedUser.deleteAccountOtpAttempts === undefined) {
                return res.status(429).json({ success: false, message: 'Too many failed attempts. Deletion code invalidated.' });
            }

            return res.status(401).json({ success: false, message: 'Incorrect deletion code.' });
        }

        // Fully atomic consumption enforces strict expiry bounds and verifies structural modification
        const invalidationResult = await User.updateOne(
            { 
                _id: user._id, 
                deleteAccountOtpHash: user.deleteAccountOtpHash,
                $and: [
                    { deleteAccountOtpExpire: user.deleteAccountOtpExpire },
                    { deleteAccountOtpExpire: { $gt: new Date() } }
                ]
            },
            { $unset: { deleteAccountOtpHash: "", deleteAccountOtpExpire: "", deleteAccountOtpAttempts: "" } }
        );

        if (invalidationResult.matchedCount === 0 || invalidationResult.modifiedCount === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired deletion code.' });
        }

        const session = await mongoose.startSession();
        let commitSuccess = false;

        try {
            session.startTransaction();

            await Transaction.deleteMany({ user: req.user.id }, { session });
            await Category.deleteMany({ user: req.user.id }, { session });
            
            const deletedUser = await User.findByIdAndDelete(req.user.id, { session });
            if (!deletedUser) {
                throw new Error('User document not found during deletion transaction');
            }

            await session.commitTransaction();
            commitSuccess = true;
        } catch (transactionError) {
            try {
                if (session.inTransaction()) {
                    await session.abortTransaction();
                }
            } catch (abortError) {
                console.error('Transaction abort failed:', abortError);
            }
            return res.status(500).json({ success: false, message: 'Database error occurred during deletion. Please request a new code.' });
        } finally {
            try {
                await session.endSession();
            } catch (cleanupError) {
                console.error('Session cleanup failed:', cleanupError);
            }
        }

        if (commitSuccess) {
            return res.status(200).json({
                success: true,
                message: 'Account and all associated data permanently deleted.'
            });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateProfile,
    updateSecurityQuestion,
    initiateForgotPassword,
    verifySecurityAnswer,
    requestPasswordOtp,
    verifyPasswordOtp,
    resetPassword,
    updatePassword,
    requestDeleteOtp,
    deleteAccount,
    verifyEmail,
    resendVerificationEmail
};