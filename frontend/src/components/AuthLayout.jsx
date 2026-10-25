import { useTheme } from '../context/ThemeContext';
import {
    Sun,
    Moon,
    Wallet,
    TrendingUp,
    PieChart,
    Shield,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

const Feature = ({ icon, text, compact = false }) => (
    <div
        className={`flex items-center ${
            compact ? 'gap-2 rounded-xl border p-3' : 'gap-3'
        } border-gray-200 dark:border-oled-border bg-white dark:bg-oled-card text-gray-700 dark:text-gray-300 transition-colors`}
    >
        <div
            className={`flex shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 ${
                compact ? 'h-8 w-8' : 'p-2'
            }`}
        >
            {icon}
        </div>

        <span
            className={`font-medium ${
                compact ? 'text-xs leading-tight sm:text-sm' : 'text-sm'
            }`}
        >
            {text}
        </span>
    </div>
);

const DashboardPreview = ({ compact = false }) => (
    <div
        aria-label="Illustrative dashboard preview with sample financial figures"
        className={`select-none overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-oled-border dark:bg-oled-base transition-colors ${
            compact
                ? 'w-full'
                : 'relative translate-x-4 translate-y-4 rounded-xl shadow-2xl'
        }`}
    >
        {/* Preview label */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white/80 px-3 py-2 dark:border-oled-border dark:bg-oled-card sm:px-4">
            <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400/80" />
                <span className="h-2 w-2 rounded-full bg-yellow-400/80" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            </div>

            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                Illustrative preview
            </span>
        </div>

        <div className={compact ? 'space-y-3 p-3' : 'space-y-4 p-5'}>
            {/* Sample financial cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 dark:border-oled-border dark:bg-oled-card sm:p-4">
                    <div className="text-[9px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-[11px]">
                        Total Balance
                    </div>

                    <div className="mt-1 truncate text-sm font-bold text-gray-900 dark:text-white sm:text-lg">
                        $12,450.00
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Sample data</span>
                    </div>
                </div>

                <div className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10 sm:p-4">
                    <div className="text-[9px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 sm:text-[11px]">
                        Monthly Income
                    </div>

                    <div className="mt-1 truncate text-sm font-bold text-emerald-700 dark:text-emerald-300 sm:text-lg">
                        $4,200.00
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                        <ArrowDownRight className="h-3 w-3" />
                        <span>Sample data</span>
                    </div>
                </div>
            </div>

            {/* Decorative spending breakdown */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-oled-border dark:bg-oled-card sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Spending breakdown
                    </span>

                    <PieChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div
                    aria-hidden="true"
                    className="flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-oled-border"
                >
                    <div className="h-full w-[55%] bg-emerald-500" />
                    <div className="h-full w-[25%] bg-yellow-400" />
                    <div className="h-full w-[20%] bg-blue-500" />
                </div>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Needs
                    </span>

                    <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                        Wants
                    </span>

                    <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Savings
                    </span>
                </div>
            </div>
        </div>
    </div>
);

const AuthLayout = ({ children, title, subtitle, variant = 'login' }) => {
    const { theme, toggleTheme } = useTheme();
    const isRegister = variant === 'register';

    const headline = isRegister
        ? 'Start Your Financial Journey.'
        : 'Welcome Back to Savify.';
    const description = isRegister
        ? 'Build better money habits, understand your spending, and take control of your financial future.'
        : 'Your finances, all in one place. Sign in and pick up where you left off.';

    return (
        <div className={`relative flex min-h-screen flex-col overflow-x-clip bg-gray-50 transition-colors dark:bg-black lg:flex-row ${isRegister ? 'auth-register' : 'auth-login'}`}>
            {/* Shared Theme Toggle */}
            <div className="absolute right-3 top-3 z-50 sm:right-6 sm:top-6">
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                    className="rounded-full bg-white/80 p-2 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-200 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:bg-transparent dark:text-gray-400 dark:hover:bg-oled-card dark:hover:text-emerald-400 dark:focus:ring-offset-black"
                >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
            </div>

            {/* Shared branding panel with distinct login/register presentation */}
            <div className={`relative flex flex-col border-b border-gray-200 bg-white px-5 transition-colors dark:border-oled-border dark:bg-oled-card sm:px-8 lg:w-5/12 lg:justify-center lg:border-b-0 lg:border-r lg:p-16 ${isRegister ? 'pb-3 pt-12 sm:pb-5 sm:pt-14 lg:py-16' : 'pb-4 pt-12 sm:pb-6 sm:pt-14 lg:py-16'}`}>
                <div className={`relative z-10 mx-auto w-full max-w-md lg:mx-0 lg:max-w-none ${isRegister ? 'lg:max-w-xl' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRegister ? 'mb-3 sm:mb-5 lg:mb-8' : 'mb-3 sm:mb-4 lg:mb-8'}`}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400 lg:h-11 lg:w-11">
                            <Wallet className="h-6 w-6 lg:h-7 lg:w-7" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-gray-900 transition-colors dark:text-white lg:text-3xl">Savify</span>
                        <span className="ml-auto mr-10 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 sm:text-xs">
                            {isRegister ? 'Get started' : 'Your money, in focus'}
                        </span>
                    </div>

                    <h1 className={`font-bold leading-tight text-gray-900 transition-colors dark:text-white ${isRegister ? 'mb-2 text-2xl sm:text-3xl lg:mb-4 lg:text-4xl' : 'mb-1 text-2xl sm:text-3xl lg:mb-4 lg:text-4xl'}`}>
                        {headline}
                    </h1>
                    <p className={`max-w-md text-sm leading-relaxed text-gray-600 transition-colors dark:text-gray-400 sm:text-base ${isRegister ? 'mb-4 sm:mb-5 lg:mb-8' : 'mb-4 sm:mb-5 lg:mb-8'}`}>
                        {description}
                    </p>

                    {isRegister ? (
                        <>
                            <div className="mb-3 grid grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:mb-4 sm:gap-3">
                                <Feature compact icon={<TrendingUp className="h-4 w-4" />} text="Track spending" />
                                <Feature compact icon={<PieChart className="h-4 w-4" />} text="Know your habits" />
                                <Feature compact icon={<Shield className="h-4 w-4" />} text="Stay secure" />
                            </div>
                            <div className="hidden lg:block">
                                <DashboardPreview />
                            </div>
                            <div className="lg:hidden">
                                <DashboardPreview compact />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 grid grid-cols-3 gap-2 lg:mb-8 lg:grid-cols-1 lg:gap-4">
                                <Feature compact icon={<TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />} text="Expense tracking" />
                                <Feature compact icon={<PieChart className="h-4 w-4 lg:h-5 lg:w-5" />} text="Smart categories" />
                                <Feature compact icon={<Shield className="h-4 w-4 lg:h-5 lg:w-5" />} text="Private & secure" />
                            </div>
                            <div className="hidden lg:block">
                                <DashboardPreview />
                            </div>
                            <div className="mb-1 lg:hidden">
                                <DashboardPreview compact />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Authentication form panel */}
            <div className={`relative z-10 flex w-full flex-1 flex-col justify-center transition-colors sm:px-6 lg:px-20 lg:py-12 ${isRegister ? 'px-3 py-5 sm:py-7' : 'px-4 py-6 sm:py-8'}`}>
                <div className={`mx-auto w-full ${isRegister ? 'max-w-xl' : 'max-w-md'}`}>
                    <div className={`mb-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${isRegister ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300' : 'border-gray-200 bg-white text-gray-600 dark:border-oled-border dark:bg-oled-card dark:text-gray-300'}`}>
                        {isRegister ? 'A few details to get started' : 'Secure sign in'}
                    </div>
                    {title && (
                        <h2 className={`font-bold tracking-tight text-gray-900 transition-colors dark:text-gray-100 ${isRegister ? 'text-2xl sm:text-3xl' : 'text-2xl'}`}>
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p className="mt-1 text-sm leading-relaxed text-gray-600 transition-colors dark:text-gray-400 sm:mt-2 sm:text-base">
                            {subtitle}
                        </p>
                    )}
                    <div className={isRegister ? 'mt-4 sm:mt-6' : 'mt-5 sm:mt-8'}>{children}</div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
