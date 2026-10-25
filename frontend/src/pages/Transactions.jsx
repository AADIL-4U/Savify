import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import TransactionModal from '../components/TransactionModal';
import { PlusCircle, Loader2, AlertCircle, Edit2, Trash2, ReceiptText, Filter } from 'lucide-react';

const formatLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const Transactions = () => {
    const { user, convertFromBase, isCurrencyReady, isCurrencyLoading, currencyError } = useContext(AuthContext);
    const currencySymbol = getCurrencySymbol(user?.currency);
    
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    const [filterType, setFilterType] = useState('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [filterError, setFilterError] = useState('');
    const [isFetching, setIsFetching] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [txRes, catRes] = await Promise.all([
                    api.get('/transactions'),
                    api.get('/categories')
                ]);
                
                if (txRes.data.success) setTransactions(txRes.data.data);
                if (catRes.data.success) setCategories(catRes.data.data);
            } catch (error) {
                setPageError('Failed to load transaction data. Please refresh.');
            } finally {
                setPageLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchFilteredTransactions = async (startString, endString) => {
        setIsFetching(true);
        setFilterError('');
        try {
            let url = '/transactions';
            if (startString && endString) url += `?startDate=${startString}&endDate=${endString}`;
            const res = await api.get(url);
            if (res.data.success) setTransactions(res.data.data);
        } catch (error) {
            setFilterError(error.response?.data?.message || 'Failed to apply filter. Please try again.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleFilterChange = (e) => {
        const type = e.target.value;
        setFilterType(type);
        setFilterError('');

        if (type === 'all') {
            fetchFilteredTransactions(null, null);
        } else if (type === 'thisMonth') {
            const now = new Date();
            fetchFilteredTransactions(formatLocal(new Date(now.getFullYear(), now.getMonth(), 1)), formatLocal(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
        } else if (type === 'lastMonth') {
            const now = new Date();
            fetchFilteredTransactions(formatLocal(new Date(now.getFullYear(), now.getMonth() - 1, 1)), formatLocal(new Date(now.getFullYear(), now.getMonth(), 0)));
        }
    };

    const handleCustomApply = () => {
        setFilterError('');
        if (!customStart || !customEnd) return setFilterError('Please select both start and end dates.');
        if (customStart > customEnd) return setFilterError('Start date cannot be after end date.');
        fetchFilteredTransactions(customStart, customEnd);
    };

    const handleOpenModal = (transaction = null) => {
        if (transaction) {
            const displayTx = { ...transaction, amount: convertFromBase(transaction.amount) };
            setSelectedTransaction(displayTx);
        } else {
            setSelectedTransaction(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTransaction(null);
    };

    const handleSaveTransaction = async (formData) => {
        setModalLoading(true);
        try {
            const payload = { 
                ...formData, 
                amount: Number(formData.amount),
                currency: user?.currency || 'INR'
            };
            
            if (selectedTransaction) {
                const res = await api.put(`/transactions/${selectedTransaction._id}`, payload);
                if (res.data.success) {
                    setTransactions(prev => prev.map(tx => tx._id === selectedTransaction._id ? res.data.data : tx));
                    handleCloseModal();
                }
            } else {
                const res = await api.post('/transactions', payload);
                if (res.data.success) {
                    setTransactions(prev => [res.data.data, ...prev]);
                    handleCloseModal();
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save transaction.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this transaction?')) return;
        try {
            const res = await api.delete(`/transactions/${id}`);
            if (res.data.success) setTransactions(prev => prev.filter(tx => tx._id !== id));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete transaction.');
        }
    };

    // Strict UI Protection
    if (pageLoading || isCurrencyLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                {isCurrencyLoading && <span className="mt-3 text-emerald-600 dark:text-emerald-400 font-medium">Loading live exchange rates...</span>}
            </div>
        );
    }

    if (pageError || currencyError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-3 text-red-700 dark:text-red-400 max-w-2xl mx-auto mt-6 transition-colors">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{pageError || currencyError}</p>
            </div>
        );
    }

    if (!isCurrencyReady) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Transactions</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">View and manage your transaction history.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white dark:text-gray-900 rounded-lg shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-400 font-medium text-sm transition-colors">
                    <PlusCircle className="h-4 w-4" /> Add Transaction
                </button>
            </div>

            <div className="bg-white dark:bg-oled-card p-4 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-colors">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 shrink-0 transition-colors">
                    <Filter className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-sm">Filter by Date:</span>
                </div>
                <select 
                    value={filterType} 
                    onChange={handleFilterChange} 
                    className="rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" 
                    disabled={isFetching}
                >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="custom">Custom Range</option>
                </select>
                {filterType === 'custom' && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <input 
                            type="date" 
                            value={customStart} 
                            onChange={(e) => setCustomStart(e.target.value)} 
                            className="rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" 
                            disabled={isFetching} 
                        />
                        <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:inline transition-colors">to</span>
                        <input 
                            type="date" 
                            value={customEnd} 
                            onChange={(e) => setCustomEnd(e.target.value)} 
                            className="rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" 
                            disabled={isFetching} 
                        />
                        <button 
                            onClick={handleCustomApply} 
                            disabled={isFetching} 
                            className="px-4 py-2 w-full sm:w-auto bg-gray-100 dark:bg-oled-popover hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md text-sm font-medium border border-gray-200 dark:border-oled-border transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>

            {filterError && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 transition-colors">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {filterError}
                </div>
            )}

            <div className="bg-white dark:bg-oled-card rounded-xl border border-gray-200 dark:border-oled-border shadow-sm overflow-hidden relative min-h-[300px] transition-colors">
                {isFetching && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-oled-card/80 backdrop-blur-sm z-10 flex items-center justify-center transition-colors">
                        <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                    </div>
                )}

                {transactions.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-3 transition-colors">
                        <ReceiptText className="h-12 w-12 opacity-50" />
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-oled-popover border-b border-gray-200 dark:border-oled-border text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold transition-colors">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-oled-border">
                                {transactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-oled-popover/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{tx.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: tx.category.color }} />
                                                <span className="text-sm text-gray-600 dark:text-gray-300">{tx.category.name}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {tx.type === 'income' ? '+' : '-'}{currencySymbol}{convertFromBase(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => handleOpenModal(tx)} 
                                                    aria-label={`Edit transaction: ${tx.description}`}
                                                    className="text-gray-400 hover:text-emerald-600 dark:text-gray-500 dark:hover:text-emerald-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(tx._id)} 
                                                    aria-label={`Delete transaction: ${tx.description}`}
                                                    className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <TransactionModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSaveTransaction}
                initialData={selectedTransaction}
                categories={categories}
                isLoading={modalLoading}
            />
        </div>
    );
};

export default Transactions;