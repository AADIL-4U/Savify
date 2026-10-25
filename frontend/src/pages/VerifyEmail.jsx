import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Loader2 } from 'lucide-react';

// Module-level promise cache to deduplicate React StrictMode double executions
// while allowing retries if the network request fails.
const verificationCache = new Map();

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); 
    const [message, setMessage] = useState('Verifying your email address...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Verification token is missing.');
            return;
        }

        // Check if a request for this token is already active or cached
        let verificationPromise = verificationCache.get(token);

        if (!verificationPromise) {
            verificationPromise = api.post('/auth/verify-email', { token })
                .then((response) => {
                    return { success: true, data: response.data };
                })
                .catch((err) => {
                    // On failure, remove from cache so the user can retry
                    verificationCache.delete(token);
                    throw err;
                });

            verificationCache.set(token, verificationPromise);
        }

        verificationPromise
            .then((result) => {
                setStatus('success');
                setMessage(result.data.message || 'Email verified successfully. You can now log in.');
            })
            .catch((err) => {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Invalid or expired verification link.');
            });

    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-oled-card py-10 px-6 shadow-sm border border-gray-200 dark:border-oled-border sm:rounded-xl text-center transition-colors">
                    
                    {status === 'loading' && (
                        <div className="space-y-6">
                            <Loader2 className="h-12 w-12 text-emerald-500 dark:text-emerald-400 animate-spin mx-auto transition-colors" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Verifying...</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors">Verified!</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{message}</p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 transition-colors"
                                >
                                    Continue to Login
                                </Link>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 transition-colors">Verification Failed</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{message}</p>
                            <div className="pt-4">
                                <Link
                                    to="/login"
                                    className="w-full flex justify-center py-2.5 px-4 border border-emerald-600 dark:border-emerald-500 rounded-md shadow-sm text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-white dark:bg-oled-popover hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                >
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;