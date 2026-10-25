import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loginFailed, setLoginFailed] = useState(false);
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

    // Preserve the existing unverified-email and resend-verification flow.
    const [isUnverified, setIsUnverified] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const { login, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoginFailed(false);
        setIsUnverified(false);
        setResendMessage('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        const result = await login(email, password);

        if (result.success) {
            navigate('/');
        } else if (result.code === 'UNVERIFIED_EMAIL') {
            setIsUnverified(true);
            setError(result.message);
        } else {
            setError(result.message);
            if (result.message.toLowerCase().includes('invalid')) {
                setLoginFailed(true);
            }
        }
    };

    const handleResendVerification = async () => {
        setResendLoading(true);
        setResendMessage('');
        setError('');

        try {
            const response = await api.post('/auth/resend-verification', { email });
            if (response.data.success) {
                setResendMessage(response.data.message);
                setIsUnverified(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend verification email');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <AuthLayout
            variant="login"
            title="Sign in to your account"
            subtitle="Welcome back. Your financial overview is waiting."
        >
            <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 shadow-sm transition-colors dark:border-oled-border dark:bg-oled-card sm:px-7 sm:py-8">
                {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-transparent bg-red-50 p-3 text-sm text-red-700 transition-colors dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div className="flex-1">
                            <span>{error}</span>
                            {isUnverified && (
                                <button
                                    type="button"
                                    onClick={handleResendVerification}
                                    disabled={resendLoading}
                                    className="mt-2 block rounded-sm text-sm font-bold text-red-700 underline transition-colors hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {resendMessage && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-transparent bg-emerald-50 p-3 text-sm text-emerald-700 transition-colors dark:border-emerald-800/50 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>{resendMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 transition-colors dark:text-gray-300">Email address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-oled-border dark:bg-oled-popover dark:text-gray-100 dark:placeholder:text-gray-500"
                            disabled={loading || resendLoading}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 transition-colors dark:text-gray-300">Password</label>
                            {loginFailed && !isUnverified && (
                                <button
                                    type="button"
                                    onClick={() => setIsForgotPasswordOpen(true)}
                                    className="rounded-sm text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 sm:text-sm"
                                >
                                    Forgot password?
                                </button>
                            )}
                        </div>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-oled-border dark:bg-oled-popover dark:text-gray-100 dark:placeholder:text-gray-500"
                            disabled={loading || resendLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || resendLoading}
                        className="flex w-full justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus:ring-offset-oled-card"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in to Savify'}
                    </button>
                </form>

                <div className="mt-6 border-t border-gray-100 pt-5 text-center transition-colors dark:border-oled-border">
                    <p className="text-sm text-gray-600 transition-colors dark:text-gray-400">
                        New to Savify?{' '}
                        <Link to="/register" className="font-semibold text-emerald-600 transition-colors hover:text-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>

            <ForgotPasswordModal
                isOpen={isForgotPasswordOpen}
                onClose={() => setIsForgotPasswordOpen(false)}
            />
        </AuthLayout>
    );
};

export default Login;
