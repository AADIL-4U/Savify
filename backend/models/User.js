const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    currency: {
        type: String,
        enum: ['INR', 'USD', 'EUR', 'GBP'],
        default: 'INR'
    },
    securityQuestion: {
        type: String
    },
    securityAnswer: {
        type: String,
        select: false
    },
    resetPasswordToken: {
        type: String,
        select: false
    },
    resetPasswordExpire: {
        type: Date,
        select: false
    },
    passwordChangedAt: {
        type: Date
    },
    emailVerified: {
        type: Boolean
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpire: {
        type: Date,
        select: false
    },
    dateOfBirth: {
        type: Date
    },
    country: {
        type: String
    },
    passwordRecoveryOtpHash: {
        type: String,
        select: false
    },
    passwordRecoveryOtpExpire: {
        type: Date,
        select: false
    },
    passwordRecoveryOtpAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    // Phase 19: Account Deletion OTP Fields
    deleteAccountOtpHash: {
        type: String,
        select: false
    },
    deleteAccountOtpExpire: {
        type: Date,
        select: false
    },
    deleteAccountOtpAttempts: {
        type: Number,
        default: 0,
        select: false
    }
}, {
    timestamps: true
});

userSchema.pre('save', async function() {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified('securityAnswer') && this.securityAnswer) {
        if (!this.securityAnswer.startsWith('$2a$') && !this.securityAnswer.startsWith('$2b$')) {
            const salt = await bcrypt.genSalt(10);
            this.securityAnswer = await bcrypt.hash(this.securityAnswer, salt);
        }
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchSecurityAnswer = async function(enteredAnswer) {
    if (!this.securityAnswer) return false;
    return await bcrypt.compare(enteredAnswer, this.securityAnswer);
};

module.exports = mongoose.model('User', userSchema);