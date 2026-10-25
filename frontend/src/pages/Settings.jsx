import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, ShieldQuestion, Loader2, AlertCircle, CheckCircle2, AlertTriangle, Trash2, X } from 'lucide-react';

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const Settings = () => {
    const { user, updateUserProfile, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Profile Form State
    const [name, setName] = useState(user?.name || '');
    const [currency, setCurrency] = useState(user?.currency || 'INR');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [country, setCountry] = useState('');
    
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setCurrency(user.currency || 'INR');
            setCountry(user.country || '');
            setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '');
        }
    }, [user]);

    const today = new Date();
    const yesterdayUtc = new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate() - 1
        )
    );
    const maxDobStr = yesterdayUtc.toISOString().split('T')[0];

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Security Question Form State
    const [securityQuestion, setSecurityQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    const [sqLoading, setSqLoading] = useState(false);
    const [sqError, setSqError] = useState('');
    const [sqSuccess, setSqSuccess] = useState('');

   // Delete Account State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteOtp, setDeleteOtp] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (!name || name.trim() === '') {
            return setProfileError('Name cannot be empty or whitespace-only.');
        }

        const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
        if (!supportedCurrencies.includes(currency)) {
            return setProfileError('Please select a valid currency.');
        }

        setProfileLoading(true);
        try {
            const payload = { name: name.trim(), currency };
            if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
            if (country) payload.country = country;

            const response = await api.put('/auth/profile', payload);
            if (response.data.success) {
                updateUserProfile(response.data.data);
                setProfileSuccess('Profile updated successfully.');
            }
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            return setPasswordError('Please fill in all password fields.');
        }

        if (newPassword.length < 6) {
            return setPasswordError('New password must be at least 6 characters.');
        }

        if (newPassword === currentPassword) {
            return setPasswordError('New password cannot be the same as current password.');
        }

        if (newPassword !== confirmPassword) {
            return setPasswordError('New password and confirmation do not match.');
        }

        setPasswordLoading(true);
        try {
            const response = await api.put('/auth/password', { currentPassword, newPassword });
            if (response.data.success) {
                setPasswordSuccess('Password updated successfully.');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSecurityQuestionSubmit = async (e) => {
        e.preventDefault();
        setSqError('');
        setSqSuccess('');

        if (!securityQuestion.trim()) {
            return setSqError('Security question is required.');
        }
        if (!securityAnswer || securityAnswer.trim().length < 3) {
            return setSqError('Security answer must be at least 3 characters.');
        }

        setSqLoading(true);
        try {
            const response = await api.put('/auth/security-question', {
                securityQuestion: securityQuestion.trim(),
                securityAnswer: securityAnswer.trim()
            });
            if (response.data.success) {
                updateUserProfile(response.data.data);
                setSqSuccess('Security question configured successfully.');
                setSecurityAnswer('');
            }
        } catch (err) {
            setSqError(err.response?.data?.message || 'Failed to configure security question.');
        } finally {
            setSqLoading(false);
        }
    };

    const handleRequestDeleteOtp = async (e) => {
        e.preventDefault();
        setDeleteError('');

        if (deleteConfirmationText !== 'DELETE') {
            return setDeleteError('Please type DELETE exactly as shown.');
        }
        if (!deletePassword) {
            return setDeleteError('Please enter your current password.');
        }

        setDeleteLoading(true);
        try {
            const response = await api.post('/auth/account/request-delete-otp', {
                currentPassword: deletePassword,
                confirmationText: deleteConfirmationText
            });

            if (response.data.success) {
                setDeleteStep(2);
            }
        } catch (err) {
            if (err.response?.status === 429) {
                setDeleteError(err.response?.data?.message || 'Too many attempts. Please try again later.');
            } else {
                setDeleteError(err.response?.data?.message || 'Failed to request deletion code.');
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleteError('');

        if (!/^\d{6}$/.test(deleteOtp.trim())) {
            return setDeleteError('Please enter the 6-digit code.');
        }

        setDeleteLoading(true);
        try {
            const response = await api.delete('/auth/account', {
                data: { otp: deleteOtp.trim() }
            });

            if (response.data.success) {
                closeDeleteModal();
                logout();
                navigate('/login');
            }
        } catch (err) {
            if (err.response?.status === 429) {
                setDeleteError(err.response?.data?.message || 'Too many attempts. Please try again later.');
            } else {
                setDeleteError(err.response?.data?.message || 'Failed to delete account.');
            }
        } finally {
            setDeleteLoading(false);
        }
    };
    
    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDeleteStep(1);
        setDeleteError('');
        setDeletePassword('');
        setDeleteConfirmationText('');
        setDeleteOtp('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Account Settings</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    Manage your profile details, currency preference, and account security.
                </p>
            </div>

            {/* Profile Information Card */}
            <div className="bg-white dark:bg-oled-card rounded-xl border border-gray-200 dark:border-oled-border shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-oled-border bg-gray-50 dark:bg-oled-card flex items-center gap-2 transition-colors">
                    <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors">Profile Information</h2>
                </div>

                <div className="p-6">
                    {profileError && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {profileError}
                        </div>
                    )}

                    {profileSuccess && (
                        <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/50 transition-colors">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {profileSuccess}
                        </div>
                    )}

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    disabled={profileLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Email Address (Read-only)</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="mt-1 block w-full rounded-md border border-gray-200 dark:border-oled-border bg-gray-50 dark:bg-oled-card px-3 py-2 text-sm text-gray-500 dark:text-gray-400 shadow-sm cursor-not-allowed transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Date of Birth</label>
                                <input
                                    type="date"
                                    max={maxDobStr}
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:[color-scheme:dark] transition-colors"
                                    disabled={profileLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Residence Country</label>
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:[color-scheme:dark] transition-colors"
                                    disabled={profileLoading}
                                >
                                    <option value="" disabled>Select Country</option>
                                    {COUNTRIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Currency Preference</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:[color-scheme:dark] transition-colors"
                                disabled={profileLoading}
                            >
                                <option value="INR">INR (₹)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={profileLoading}
                                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-card disabled:opacity-70 transition-colors"
                            >
                                {profileLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Password Recovery Settings Card */}
            <div className="bg-white dark:bg-oled-card rounded-xl border border-gray-200 dark:border-oled-border shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-oled-border bg-gray-50 dark:bg-oled-card flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-2">
                        <ShieldQuestion className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors">Password Recovery</h2>
                    </div>
                    {user?.hasSecurityQuestion && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 transition-colors">
                            Configured
                        </span>
                    )}
                </div>

                <div className="p-6">
                    {sqError && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {sqError}
                        </div>
                    )}

                    {sqSuccess && (
                        <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/50 transition-colors">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {sqSuccess}
                        </div>
                    )}

                    <form onSubmit={handleSecurityQuestionSubmit} className="space-y-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            {user?.hasSecurityQuestion 
                                ? 'Update your security question and answer below.' 
                                : 'Set up a security question and answer to enable account recovery if you forget your password.'}
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Security Question</label>
                            <input
                                type="text"
                                value={securityQuestion}
                                onChange={(e) => setSecurityQuestion(e.target.value)}
                                placeholder="e.g. What was your first pet's name?"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                disabled={sqLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Security Answer</label>
                            <input
                                type="password"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                placeholder="At least 3 characters"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                disabled={sqLoading}
                            />
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 transition-colors">Answers are case-insensitive and stored securely.</p>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={sqLoading}
                                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-card disabled:opacity-70 transition-colors"
                            >
                                {sqLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Security Question
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Security Card */}
            <div className="bg-white dark:bg-oled-card rounded-xl border border-gray-200 dark:border-oled-border shadow-sm overflow-hidden transition-colors">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-oled-border bg-gray-50 dark:bg-oled-card flex items-center gap-2 transition-colors">
                    <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors">Security & Password</h2>
                </div>

                <div className="p-6">
                    {passwordError && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {passwordError}
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400 border border-transparent dark:border-emerald-800/50 transition-colors">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {passwordSuccess}
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                disabled={passwordLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                disabled={passwordLoading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                disabled={passwordLoading}
                            />
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-card disabled:opacity-70 transition-colors"
                            >
                                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Danger Zone Card */}
            <div className="bg-white dark:bg-oled-card rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm overflow-hidden mt-8 transition-colors">
                <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 flex items-center gap-2 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 transition-colors">Danger Zone</h2>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors">
                        Permanently delete your account and all associated data. This action is irreversible.
                    </p>
                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 rounded-md shadow-sm text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-oled-card transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Account Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm transition-colors">
                    <div className="bg-white dark:bg-oled-card border border-transparent dark:border-oled-border rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-colors">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-oled-border bg-white dark:bg-oled-card transition-colors">
                            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Account
                            </h3>
                            <button onClick={closeDeleteModal} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {deleteError && (
                                <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            {deleteStep === 1 && (
                                <>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 transition-colors">
                                        You are about to permanently delete your account. All your <strong className="text-gray-900 dark:text-gray-100">transactions</strong>, <strong className="text-gray-900 dark:text-gray-100">categories</strong>, and <strong className="text-gray-900 dark:text-gray-100">profile settings</strong> will be permanently erased.
                                    </p>
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-6 transition-colors">
                                        This action CANNOT be undone.
                                    </p>
                                    <form onSubmit={handleRequestDeleteOtp} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">
                                                Type <strong className="text-gray-900 dark:text-white">DELETE</strong> to confirm
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={deleteConfirmationText}
                                                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                                placeholder="DELETE"
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                                disabled={deleteLoading}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Current Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={deletePassword}
                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                placeholder="Enter your current password"
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                                disabled={deleteLoading}
                                            />
                                        </div>
                                        <div className="pt-4 flex justify-end gap-3">
                                            <button type="button" onClick={closeDeleteModal} disabled={deleteLoading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover border border-gray-300 dark:border-oled-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                                            <button type="submit" disabled={deleteLoading || deleteConfirmationText !== 'DELETE' || !deletePassword} className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-oled-card disabled:opacity-50 transition-colors">
                                                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Continue
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}

                            {deleteStep === 2 && (
                                <>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 transition-colors">
                                        We sent a 6-digit confirmation code to your email.
                                    </p>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6 transition-colors">
                                        This code expires in 10 minutes.
                                    </p>
                                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Deletion Code</label>
                                            <input
                                                type="text"
                                                required
                                                maxLength="6"
                                                value={deleteOtp}
                                                onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Enter 6-digit code"
                                                className="block w-full text-center tracking-widest text-lg font-medium rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                                                disabled={deleteLoading}
                                                autoComplete="off"
                                            />
                                        </div>
                                        <div className="pt-4 flex justify-end gap-3">
                                            <button type="button" onClick={closeDeleteModal} disabled={deleteLoading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover border border-gray-300 dark:border-oled-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                                            <button type="submit" disabled={deleteLoading || deleteOtp.length < 6} className="flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-oled-card disabled:opacity-50 transition-colors">
                                                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                Verify & Delete Account
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;