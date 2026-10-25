import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import { X, Loader2, AlertCircle } from 'lucide-react';

const TransactionModal = ({ isOpen, onClose, onSubmit, initialData, categories, isLoading }) => {
    const { user } = useContext(AuthContext);

    const userCurrency = user?.currency || 'INR';
    const currencySymbol = getCurrencySymbol(userCurrency);
    const dynamicStep = userCurrency === 'INR' ? '1000' : '10';

    const [type, setType] = useState('expense');
    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    // Pre-fill form when editing, or reset when creating
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setType(initialData.type);
                // If it's uncategorized or missing, it will safely fallback
                setCategoryId(initialData.category?._id || '');
                setAmount(initialData.amount);
                // Convert ISO date to YYYY-MM-DD for the date input
                setDate(new Date(initialData.date).toISOString().split('T')[0]);
                setDescription(initialData.description);
            } else {
                setType('expense');
                setCategoryId('');
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
                setDescription('');
            }
            setError('');
        }
    }, [isOpen, initialData]);

    const filteredCategories = categories.filter(cat => cat.type === type);

    const handleTypeChange = (newType) => {
        setType(newType);
        setCategoryId(''); // Reset category selection when type changes
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation (categoryId is no longer required)
        if (!description.trim() || !amount || !date) {
            return setError('Please fill in all required fields.');
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            return setError('Amount must be a valid number greater than 0.');
        }

        onSubmit({
            type,
            categoryId, // Will be '' if left on the default option
            amount: numAmount,
            date,
            description
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 dark:bg-gray-900/80 backdrop-blur-sm transition-colors">
            <div className="bg-white dark:bg-oled-card border border-transparent dark:border-oled-border rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full transition-colors">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-oled-border flex justify-between items-center bg-gray-50 dark:bg-oled-card transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                        {initialData ? 'Edit Transaction' : 'Add Transaction'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        aria-label="Close modal"
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form id="transaction-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Transaction Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Type</label>
                            <div className="mt-2 flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={type === 'expense'}
                                        onChange={() => handleTypeChange('expense')}
                                        className="text-emerald-600 dark:checked:bg-emerald-500 dark:bg-oled-popover dark:border-oled-border focus:ring-emerald-500 transition-colors disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Expense</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={type === 'income'}
                                        onChange={() => handleTypeChange('income')}
                                        className="text-emerald-600 dark:checked:bg-emerald-500 dark:bg-oled-popover dark:border-oled-border focus:ring-emerald-500 transition-colors disabled:opacity-50"
                                        disabled={isLoading}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Income</span>
                                </label>
                            </div>
                        </div>

                        {/* Category Dropdown */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Category</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] transition-colors disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {/* Removed the 'disabled' attribute here so users can select it to revert to Uncategorized */}
                                <option value="" className="bg-white text-gray-900 dark:bg-oled-popover dark:text-gray-100">Select a {type} category</option>
                                {filteredCategories.map(cat => (
                                    <option key={cat._id} value={cat._id} className="bg-white text-gray-900 dark:bg-oled-popover dark:text-gray-100">{cat.name}</option>
                                ))}
                            </select>
                        </div>

                       {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">
                                Amount ({currencySymbol})
                            </label>
                            <input
                                type="number"
                                step={dynamicStep}
                                min="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 dark:[color-scheme:dark] transition-colors disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] transition-colors disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Description</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Grocery shopping"
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 dark:[color-scheme:dark] transition-colors disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 dark:border-oled-border bg-gray-50 dark:bg-[#050505] flex justify-end gap-3 transition-colors">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-oled-popover border border-gray-300 dark:border-oled-border rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-card transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="transaction-form"
                        // Removed the filteredCategories.length === 0 check here
                        disabled={isLoading}
                        className="flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 border border-transparent rounded-md shadow-sm hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-card transition-colors disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {initialData ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionModal;