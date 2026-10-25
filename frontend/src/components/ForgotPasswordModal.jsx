import { useState } from 'react';
import api from '../services/api';
import { X, Loader2, AlertCircle, CheckCircle2, ShieldQuestion, Lock, Mail, KeyRound } from 'lucide-react';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: Verification (OTP or SQ), 3: New Password
    const [recoveryMethod, setRecoveryMethod] = useState(null); // 'otp' or 'sq'
    
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    
    const [resetToken, setResetToken] = useState(''); // Stored ONLY in component memory
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!isOpen) return null;

    const handleResetState = () => {
        setStep(1);
        setRecoveryMethod(null);
        setEmail('');
        setOtp('');
        setSecurityQuestion('');
        setAnswer('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMessage('');
        onClose();
    };

    const goBackToStep1 = () => {
        setStep(1);
        setRecoveryMethod(null);
        setOtp('');
        setAnswer('');
        setError('');
    };

    // Step 1: Request Email OTP
    const handleRequestOtp = async () => {
        setError('');
        if (!email.trim()) return setError('Please enter your email address.');

        setRecoveryMethod('otp');
        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password/request-otp', { email: email.trim() });
            if (response.data.success) {
                setError('');
                setStep(2);
            }
        } catch (err) {
            if (err.response?.status === 429) {
                setError(err.response?.data?.message || 'Too many attempts. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Failed to send recovery code.');
            }
            setRecoveryMethod(null);
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Initiate Security Question
    const handleInitiateSQ = async () => {
        setError('');
        if (!email.trim()) return setError('Please enter your email address.');

        setRecoveryMethod('sq');
        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password/initiate', { email: email.trim() });
            if (response.data.success) {
                setError('');
                setSecurityQuestion(response.data.data.securityQuestion);
                setStep(2);
            }
        } catch (err) {
            if (err.response?.status === 429) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Failed to initiate recovery.');
            }
            setRecoveryMethod(null);
        } finally {
            setLoading(false);
        }
    };

    // Step 2A: Verify Email OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp.trim()) return setError('Please enter the 6-digit recovery code.');

        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password/verify-otp', { 
                email: email.trim(), 
                otp: otp.trim() 
            });
            if (response.data.success) {
                setError('');
                setResetToken(response.data.data.resetToken);
                setStep(3);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Incorrect recovery code.');
            } else if (err.response?.status === 429) {
                setError(err.response?.data?.message || 'Too many attempts. Please request a new code.');
            } else {
                setError(err.response?.data?.message || 'Verification failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2B: Verify Security Answer
    const handleVerifyAnswer = async (e) => {
        e.preventDefault();
        setError('');
        if (!answer.trim()) return setError('Please enter your security answer.');

        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password/verify', { 
                email: email.trim(), 
                answer: answer.trim() 
            });
            if (response.data.success) {
                setError(''); 
                setResetToken(response.data.data.resetToken);
                setStep(3);
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Incorrect security answer.');
            } else if (err.response?.status === 429) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Verification failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword || !confirmPassword) {
            return setError('Please fill in both password fields.');
        }
        if (newPassword.length < 6) {
            return setError('New password must be at least 6 characters.');
        }
        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/reset-password', {
                email: email.trim(),
                resetToken,
                newPassword
            });
            if (response.data.success) {
                setError(''); 
                setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
                setResetToken(''); 
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            if (err.response?.status === 429) {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Recovery session expired or invalid. Please restart recovery.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm transition-colors">
            <div className="bg-white dark:bg-oled-card rounded-xl shadow-xl border border-transparent dark:border-oled-border w-full max-w-md overflow-hidden transition-colors">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-oled-border bg-white dark:bg-oled-card transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 transition-colors">
                        <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Account Recovery
                    </h3>
                    <button onClick={handleResetState} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage ? (
                        <div className="space-y-6 text-center py-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors">{successMessage}</p>
                            <button
                                onClick={handleResetState}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Email Identification & Method Selection */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                        Enter your account email address to begin the recovery process.
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Email Address</label>
                                        <div className="mt-1 relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 transition-colors">
                                                <Mail className="h-4 w-4" />
                                            </span>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                className="block w-full pl-10 rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex flex-col gap-3">
                                        <button 
                                            type="button" 
                                            onClick={handleRequestOtp} 
                                            disabled={loading || !email.trim()} 
                                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-70 transition-colors"
                                        >
                                            {loading && recoveryMethod === 'otp' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                                            Send Recovery Code to Email
                                        </button>
                                        
                                        <button 
                                            type="button" 
                                            onClick={handleInitiateSQ} 
                                            disabled={loading || !email.trim()} 
                                            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-oled-border rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-70 transition-colors"
                                        >
                                            {loading && recoveryMethod === 'sq' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldQuestion className="h-4 w-4 mr-2" />}
                                            Answer Security Question
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2A: OTP Verification */}
                            {step === 2 && recoveryMethod === 'otp' && (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                        We sent a 6-digit recovery code to <strong className="text-gray-900 dark:text-gray-100">{email}</strong>. It expires in 10 minutes.
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Recovery Code</label>
                                        <div className="mt-1 relative">
                                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 transition-colors">
                                                <KeyRound className="h-4 w-4" />
                                            </span>
                                            <input
                                                type="text"
                                                required
                                                maxLength="6"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Enter 6-digit code"
                                                className="block w-full pl-10 rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center tracking-widest text-lg font-medium transition-colors"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-between gap-3">
                                        <button type="button" onClick={goBackToStep1} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover border border-gray-300 dark:border-oled-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Back</button>
                                        <button type="submit" disabled={loading || otp.length < 6} className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-70 transition-colors">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Verify Code'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 2B: Security Question Verification */}
                            {step === 2 && recoveryMethod === 'sq' && (
                                <form onSubmit={handleVerifyAnswer} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                        Please answer your security question to verify your identity.
                                    </p>
                                    <div className="bg-gray-50 dark:bg-oled-popover p-3 rounded-md border border-gray-200 dark:border-oled-border flex items-start gap-2 transition-colors">
                                        <ShieldQuestion className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 transition-colors">{securityQuestion}</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Your Answer</label>
                                        <input
                                            type="text"
                                            required
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="Enter your security answer"
                                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="pt-2 flex justify-between gap-3">
                                        <button type="button" onClick={goBackToStep1} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover border border-gray-300 dark:border-oled-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Back</button>
                                        <button type="submit" disabled={loading} className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-70 transition-colors">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Verify Answer'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step 3: New Password */}
                            {step === 3 && (
                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                                        Identity verified successfully. Enter your new password below.
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="pt-2 flex justify-end gap-3">
                                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 disabled:opacity-70 transition-colors">
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Reset Password'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;