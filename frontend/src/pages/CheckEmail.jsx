import { Link, useLocation } from 'react-router-dom';

const CheckEmail = () => {
    const location = useLocation();
    const email = location.state?.email;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-oled-card py-10 px-6 shadow-sm border border-gray-200 dark:border-oled-border sm:rounded-xl text-center transition-colors">
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 transition-colors">
                        Check your email
                    </h2>
                    
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-4 transition-colors">
                        <p>
                            We've sent an account verification link to <br/>
                            {email ? <strong className="text-gray-900 dark:text-white text-base">{email}</strong> : <strong className="text-gray-900 dark:text-white">your email address</strong>}.
                        </p>
                        <p>
                            Please click the link in that email to activate your account. The link will expire in 24 hours.
                        </p>
                        <p className="italic text-gray-500 dark:text-gray-400 text-xs mt-2 transition-colors">
                            Don't see it? Check your spam or junk folder.
                        </p>
                    </div>

                    <div className="mt-8">
                        <Link
                            to="/login"
                            className="w-full flex justify-center py-2.5 px-4 border border-emerald-600 dark:border-emerald-500 rounded-md shadow-sm text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-white dark:bg-oled-popover hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckEmail;