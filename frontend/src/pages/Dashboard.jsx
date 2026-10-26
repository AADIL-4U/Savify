import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCurrencySymbol } from '../utils/currency';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, Wallet, PieChart as PieIcon, Calendar } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const { 
        user, convertFromBase, isCurrencyReady, isCurrencyLoading, currencyError,
        dashboardPeriod: periodType, setDashboardPeriod: setPeriodType,
        dashboardCustomStart: customStart, setDashboardCustomStart: setCustomStart,
        dashboardCustomEnd: customEnd, setDashboardCustomEnd: setCustomEnd
    } = useContext(AuthContext);
    
    const { theme } = useTheme();
    const currencySymbol = getCurrencySymbol(user?.currency);
    
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSummary = async (startISO, endISO) => {
        setLoading(true);
        try {
            let url = '/transactions/summary';
            if (startISO && endISO) url += `?startDate=${startISO}&endDate=${endISO}`;
            const response = await api.get(url);
            if (response.data.success) {
                setSummary(response.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
        } finally {
            setLoading(false);
        }
    };

    const applyPeriod = (type) => {
        setPeriodType(type);
        setError('');
        const now = new Date();
        let start, end;

        if (type === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (type === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else if (type === 'last3Months') {
            start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (type === 'thisYear') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (type === 'lastYear') {
            start = new Date(now.getFullYear() - 1, 0, 1);
            end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        } else if (type === 'custom') {
            return; 
        }

        if (start && end) fetchSummary(start.toISOString(), end.toISOString());
    };

    // Load data on initial mount based on the context state
    useEffect(() => {
        if (periodType === 'custom' && customStart && customEnd) {
            const s = new Date(customStart); s.setHours(0, 0, 0, 0);
            const e = new Date(customEnd); e.setHours(23, 59, 59, 999);
            fetchSummary(s.toISOString(), e.toISOString());
        } else if (periodType !== 'custom') {
            applyPeriod(periodType);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCustomApply = () => {
        if (!customStart || !customEnd) return setError('Please select both start and end dates.');
        if (customStart > customEnd) return setError('Start date cannot be after end date.');
        
        const s = new Date(customStart); s.setHours(0, 0, 0, 0);
        const e = new Date(customEnd); e.setHours(23, 59, 59, 999);
        fetchSummary(s.toISOString(), e.toISOString());
    };

    // Strict UI Protection
    if (loading && !summary || isCurrencyLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            </div>
        );
    }

    if (error && !summary || currencyError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border flex gap-3 text-red-700 max-w-2xl mx-auto mt-6">
                <AlertCircle className="h-5 w-5" /> <p>{error || currencyError}</p>
            </div>
        );
    }

    if (!isCurrencyReady) return null;

    // Derived Metrics
    const isThisMonth = periodType === 'thisMonth';
    const balance = convertFromBase(summary?.currentBalance || 0);
    const totalIncome = convertFromBase(summary?.totalIncome || 0);
    const totalExpense = convertFromBase(summary?.totalExpense || 0);
    const periodSavings = convertFromBase(summary?.periodSavings || 0);
    const savingsRate = totalIncome > 0 ? ((periodSavings / totalIncome) * 100).toFixed(1) : '0.0';

    // Prepare Doughnut Chart Data
    const expenseBreakdown = summary?.expenseBreakdown || [];
    const doughnutData = {
        labels: expenseBreakdown.map((item) => item.name),
        datasets: [{
            data: expenseBreakdown.map((item) => convertFromBase(item.amount)),
            backgroundColor: expenseBreakdown.map((item) => item.color || '#cbd5e1'),
            borderWidth: 2,
            borderColor: theme === 'dark' ? '#0A0A0A' : '#ffffff',
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'bottom', 
                labels: { 
                    color: theme === 'dark' ? '#A3A3A3' : '#374151',
                    boxWidth: 12,
                    font: { size: 12, family: 'Inter, system-ui, sans-serif' }
                } 
            },
            tooltip: { 
                backgroundColor: theme === 'dark' ? '#111111' : '#ffffff', 
                titleColor: theme === 'dark' ? '#F5F5F5' : '#1f2937', 
                bodyColor: theme === 'dark' ? '#A3A3A3' : '#4b5563', 
                borderColor: theme === 'dark' ? '#242424' : '#e5e7eb', 
                borderWidth: 1,
                padding: 10
            }
        },
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        Welcome back, {user?.name}. Here is your financial overview.
                    </p>
                </div>

                <div className="bg-white dark:bg-oled-card p-3 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center transition-colors">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-medium">Period:</span>
                    </div>
                    <select value={periodType} onChange={(e) => applyPeriod(e.target.value)} className="rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors">
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="last3Months">Last 3 Months</option>
                        <option value="thisYear">This Year</option>
                        <option value="lastYear">Previous Year</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    {periodType === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] px-2 py-1 text-sm" />
                            <span className="text-gray-500 text-sm">to</span>
                            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] px-2 py-1 text-sm" />
                            <button onClick={handleCustomApply} className="px-3 py-1 bg-gray-100 dark:bg-oled-popover hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium border border-gray-200 dark:border-oled-border">Apply</button>
                        </div>
                    )}
                </div>
            </div>

            {loading && <div className="text-sm text-emerald-600 dark:text-emerald-400 animate-pulse">Refreshing analytics...</div>}
            {error && <div className="text-sm text-red-500">{error}</div>}

            {/* Dynamic Card Layout based on Period Type */}
            {isThisMonth ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Current Balance (All Time) */}
                    <div className="bg-white dark:bg-oled-card p-6 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex items-center justify-between transition-colors">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Current Balance</p>
                            <p className={`mt-2 text-2xl sm:text-3xl font-bold transition-colors ${balance >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'}`}>
                                {currencySymbol}{balance.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-400/10 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors">
                            <Wallet className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-oled-card p-6 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex items-center justify-between transition-colors">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Income</p>
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
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">Expense</p>
                            <p className="mt-2 text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 transition-colors">
                                {currencySymbol}{totalExpense.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-400/10 rounded-lg text-red-600 dark:text-red-400 transition-colors">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Net Savings for the selected period */}
                    <div className="bg-white dark:bg-oled-card p-5 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex flex-col justify-center transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Savings</p>
                            <Wallet className="h-4 w-4 text-blue-500" />
                        </div>
                        <p className={`mt-2 text-2xl font-bold ${periodSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {currencySymbol}{periodSavings.toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-oled-card p-5 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex flex-col justify-center transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Income</p>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol}{totalIncome.toFixed(2)}</p>
                    </div>

                    <div className="bg-white dark:bg-oled-card p-5 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex flex-col justify-center transition-colors">
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense</p>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{currencySymbol}{totalExpense.toFixed(2)}</p>
                    </div>

                    <div className="bg-white dark:bg-oled-card p-5 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex flex-col justify-center transition-colors">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Savings Rate</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{savingsRate}%</p>
                        <div className="w-full bg-gray-100 dark:bg-oled-border rounded-full h-1.5 mt-3">
                            <div className={`h-1.5 rounded-full ${periodSavings >= 0 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }} />
                        </div>
                    </div>
                </div>
            )}

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
                            <Doughnut data={doughnutData} options={chartOptions} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;