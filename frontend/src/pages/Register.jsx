import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import AuthLayout from '../components/AuthLayout';

const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Côte d'Ivoire", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const EUROZONE = [
    'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Estonia', 'Finland', 'France', 
    'Germany', 'Greece', 'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 
    'Malta', 'Netherlands', 'Portugal', 'Slovakia', 'Slovenia', 'Spain'
];

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [country, setCountry] = useState('');
    const [currency, setCurrency] = useState('INR');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const today = new Date();
    const yesterdayUtc = new Date(
        Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate() - 1
        )
    );
    const maxDobStr = yesterdayUtc.toISOString().split('T')[0];

    const handleCountryChange = (e) => {
        const selected = e.target.value;
        setCountry(selected);
        
        if (selected === 'India') setCurrency('INR');
        else if (selected === 'United Kingdom') setCurrency('GBP');
        else if (selected === 'United States') setCurrency('USD');
        else if (EUROZONE.includes(selected)) setCurrency('EUR');
        else setCurrency('INR'); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!name || !email || !password || !confirmPassword || !dateOfBirth || !country || !currency) {
            return setError('Please fill in all fields');
        }
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setIsLoading(true);
        try {
            await api.post('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
                dateOfBirth,
                country,
                currency
            });
            navigate('/check-email', { state: { email: email.trim() } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            variant="register"
            title="Create your account"
            subtitle="Set up your profile and make Savify yours."
        >
            {/* Onboarding-style card: distinct from the compact login form. */}
            <div className="rounded-2xl border border-emerald-100 border-t-4 border-t-emerald-500 bg-white px-4 py-5 shadow-lg shadow-emerald-950/5 transition-colors dark:border-oled-border dark:border-t-emerald-400 dark:bg-oled-card sm:px-7 sm:py-7">
                {error && (
                    <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
                {/* Reduced mobile field spacing (space-y-5) */}
                <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border dark:bg-oled-popover px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm transition-colors"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Email address</label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border dark:bg-oled-popover px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm transition-colors"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Password</label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border dark:bg-oled-popover px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm transition-colors"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border dark:bg-oled-popover px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm transition-colors"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Stacks vertically on exceptionally narrow screens (<360px), remains side-by-side everywhere else */}
                    <div className="grid grid-cols-2 max-[360px]:grid-cols-1 gap-3 sm:gap-4">
                        <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Date of Birth</label>
                            <input
                                id="dateOfBirth"
                                type="date"
                                autoComplete="bday"
                                max={maxDobStr}
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border dark:bg-oled-popover px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm dark:[color-scheme:dark] transition-colors"
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Residence Country</label>
                            <select
                                id="country"
                                autoComplete="country"
                                value={country}
                                onChange={handleCountryChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm dark:[color-scheme:dark] transition-colors"
                                disabled={isLoading}
                            >
                                <option value="" disabled>Select Country</option>
                                {COUNTRIES.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">Currency (Overrideable)</label>
                        <select
                            id="currency"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm dark:[color-scheme:dark] transition-colors"
                            disabled={isLoading}
                        >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="mt-1 flex w-full justify-center rounded-xl border border-transparent bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus:ring-offset-oled-card"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400 transition-colors">Already have an account? </span>
                    <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-sm">
                        Sign in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
};
export default Register;