import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencySymbol } from '../utils/currency';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const { user, convertFromBase, isCurrencyReady, isCurrencyLoading, currencyError } = useContext(AuthContext);
    const { theme } = useTheme();
    const currencySymbol = getCurrencySymbol(user?.currency);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await api.get('/transactions/summary');
                if (response.data.success) {
                    setSummary(response.data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    // Strict UI Protection
    if (loading || isCurrencyLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                {isCurrencyLoading && <span className="mt-3 text-emerald-600 dark:text-emerald-400 font-medium">Loading live exchange rates...</span>}
            </div>
        );
    }

    if (error || currencyError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-3 text-red-700 dark:text-red-400 max-w-2xl mx-auto mt-6 transition-colors">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error || currencyError}</p>
            </div>
        );
    }

    if (!isCurrencyReady) return null;

    // Apply currency conversion to read-only metrics
    const totalIncome = convertFromBase(summary?.totalIncome || 0);
    const totalExpense = convertFromBase(summary?.totalExpense || 0);
    const balance = convertFromBase(summary?.balance || 0);
    const expenseBreakdown = summary?.expenseBreakdown || [];

    const chartData = {
        labels: expenseBreakdown.map((item) => item.name),
        datasets: [
            {
                data: expenseBreakdown.map((item) => convertFromBase(item.amount)),
                backgroundColor: expenseBreakdown.map((item) => item.color || '#cbd5e1'),
                borderWidth: 2,
                // Match the chart border dynamically to the OLED card background or light theme card background
                borderColor: theme === 'dark' ? '#0A0A0A' : '#ffffff',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    // Update legend text color based on active theme
                    color: theme === 'dark' ? '#A3A3A3' : '#374151',
                    boxWidth: 12,
                    font: { size: 12, family: 'Inter, system-ui, sans-serif' },
                },
            },
            tooltip: {
                // Theme-aware tooltip styling
                backgroundColor: theme === 'dark' ? '#111111' : '#ffffff',
                titleColor: theme === 'dark' ? '#F5F5F5' : '#1f2937',
                bodyColor: theme === 'dark' ? '#A3A3A3' : '#4b5563',
                borderColor: theme === 'dark' ? '#242424' : '#e5e7eb',
                borderWidth: 1,
                padding: 10,
            }
        },
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    Welcome back, {user?.name}. Here is your financial overview for this month.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-oled-card p-6 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex items-center justify-between transition-colors">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Total Balance</p>
                        <p className={`mt-2 text-2xl sm:text-3xl font-bold transition-colors ${
                            balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                        }`}>
                            {currencySymbol}{balance.toFixed(2)}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-400/10 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors">
                        <Wallet className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-oled-card p-6 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex items-center justify-between transition-colors">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Monthly Income</p>
                        <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 transition-colors">
                            {currencySymbol}{totalIncome.toFixed(2)}
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-400/10 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                </div>

                <div className="bg-white dark:bg-oled-card p-6 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex items-center justify-between transition-colors">
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Monthly Expense</p>
                        <p className="mt-2 text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 transition-colors">
                            {currencySymbol}{totalExpense.toFixed(2)}
                        </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-400/10 rounded-lg text-red-600 dark:text-red-400 transition-colors">
                        <TrendingDown className="h-6 w-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-oled-card rounded-xl border border-gray-200 dark:border-oled-border shadow-sm p-6 transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2 transition-colors">
                        <PieIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Expense Breakdown by Category
                    </h2>
                </div>

                <div className="h-80 flex items-center justify-center">
                    {expenseBreakdown.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 space-y-2 transition-colors">
                            <PieIcon className="h-12 w-12 mx-auto opacity-40" />
                            <p className="text-sm">No expense data available for this period.</p>
                        </div>
                    ) : (
                        <div className="w-full h-full max-w-md relative">
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;