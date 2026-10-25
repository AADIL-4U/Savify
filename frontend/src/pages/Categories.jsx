import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getCurrencySymbol } from '../utils/currency';
import { PlusCircle, Loader2, AlertCircle, Tag, Wallet, Trash2 } from 'lucide-react';

const Categories = () => {
    const { user, convertFromBase, isCurrencyReady, isCurrencyLoading, currencyError } = useContext(AuthContext);
    const currencySymbol = getCurrencySymbol(user?.currency);
    const dynamicStep = user?.currency === 'INR' ? "1000" : "10";

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [name, setName] = useState('');
    const [type, setType] = useState('expense');
    const [color, setColor] = useState('#ef4444');
    const [budgetLimit, setBudgetLimit] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const [editingBudgetId, setEditingBudgetId] = useState(null);
    const [budgetInputValues, setBudgetInputValues] = useState({});
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const handleTypeChange = (newType) => {
        setType(newType);
        if (newType === 'income') {
            setColor('#10b981');
            setBudgetLimit('');
        } else {
            setColor('#ef4444');
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            if (response.data.success) setCategories(response.data.data);
        } catch (error) {
            setFetchError(error.response?.data?.message || 'Failed to load categories.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!name.trim()) return setFormError('Category name is required.');

        let parsedBudget = 0;
        if (type === 'expense' && budgetLimit !== '') {
            parsedBudget = parseFloat(budgetLimit);
            if (isNaN(parsedBudget) || parsedBudget < 0) {
                return setFormError('Budget limit must be a valid non-negative number.');
            }
        }

        setFormLoading(true);
        try {
            const payload = { 
                name, 
                type, 
                color, 
                budgetLimit: type === 'expense' ? parsedBudget : 0,
                currency: user?.currency || 'INR'
            };
            const response = await api.post('/categories', payload);
            if (response.data.success) {
                setCategories([response.data.data, ...categories]);
                setName('');
                setBudgetLimit('');
                setFormError('');
            }
        } catch (error) {
            setFormError(error.response?.data?.message || 'Failed to create category.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleStartEditBudget = (cat) => {
        setEditingBudgetId(cat._id);
        const displayBudget = cat.budgetLimit > 0 ? convertFromBase(cat.budgetLimit).toFixed(2) : '';
        setBudgetInputValues(prev => ({ ...prev, [cat._id]: displayBudget }));
    };

    const handleSaveBudget = async (catId) => {
        const val = budgetInputValues[catId];
        const numVal = val === '' || val === undefined ? 0 : parseFloat(val);

        if (isNaN(numVal) || numVal < 0) {
            alert('Please enter a valid non-negative budget limit.');
            return;
        }

        setActionLoadingId(catId);
        try {
            const payload = { 
                budgetLimit: numVal, 
                currency: user?.currency || 'INR' 
            };
            const response = await api.put(`/categories/${catId}`, payload);
            if (response.data.success) {
                setCategories(prev => prev.map(c => c._id === catId ? response.data.data : c));
                setEditingBudgetId(null);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update budget limit.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteCategory = async (catId, catName) => {
        if (catName === 'Uncategorized') {
            alert('The default Uncategorized category cannot be deleted.');
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the "${catName}" category?\n\nAny existing transactions in this category will be preserved and reassigned to "Uncategorized".`
        );
        
        if (!confirmDelete) return;

        try {
            const response = await api.delete(`/categories/${catId}`);
            if (response.data.success) {
                setCategories(prev => prev.filter(c => c._id !== catId));
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete category.');
        }
    };

    // Separate categories by type
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    const incomeCategories = categories.filter(cat => cat.type === 'income');

    // Reusable UI card for rendering a single category
    const renderCategoryCard = (cat) => {
        const isExpense = cat.type === 'expense';
        const hasBudget = isExpense && cat.budgetLimit > 0;
        
        const spent = convertFromBase(cat.spentThisMonth || 0);
        const budget = convertFromBase(cat.budgetLimit || 0);
        
        const percentage = hasBudget ? Math.round((spent / budget) * 100) : 0;
        const visualWidth = Math.min(percentage, 100);

        let barColor = 'bg-emerald-500 dark:bg-emerald-400'; 
        let textColor = 'text-emerald-600 dark:text-emerald-400';
        if (percentage >= 100) { 
            barColor = 'bg-rose-500 dark:bg-rose-400'; 
            textColor = 'text-rose-600 dark:text-rose-400'; 
        } 
        else if (percentage >= 75) { 
            barColor = 'bg-amber-500 dark:bg-amber-400'; 
            textColor = 'text-amber-600 dark:text-amber-400'; 
        }

        const isUncategorized = cat.name === 'Uncategorized';
        let dotColor = cat.color;
        let nameTextColor = "text-gray-900 dark:text-gray-100";

        if (isUncategorized) {
            dotColor = cat.type === 'income' ? '#10b981' : '#ef4444';
            nameTextColor = cat.type === 'income' 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-red-600 dark:text-red-400';
        }

        return (
            <div key={cat._id} className="p-4 border border-gray-100 dark:border-oled-border rounded-lg shadow-sm bg-white dark:bg-oled-popover space-y-3 transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: dotColor }} />
                        <div>
                            <p className={`text-sm font-semibold transition-colors ${nameTextColor}`}>{cat.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize transition-colors">{cat.type}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {isExpense && (
                            <div className="text-right">
                                {editingBudgetId === cat._id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step={dynamicStep}
                                            min="0"
                                            value={budgetInputValues[cat._id] !== undefined ? budgetInputValues[cat._id] : ''}
                                            onChange={(e) => setBudgetInputValues({ ...budgetInputValues, [cat._id]: e.target.value })}
                                            className="w-28 rounded border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-card text-gray-900 dark:text-gray-100 dark:[color-scheme:dark] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                        />
                                        <button 
                                            onClick={() => handleSaveBudget(cat._id)} 
                                            disabled={actionLoadingId === cat._id} 
                                            className="px-2.5 py-1 bg-emerald-600 dark:bg-emerald-500 text-white rounded text-xs font-medium hover:bg-emerald-700 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-popover transition-colors"
                                        >
                                            {actionLoadingId === cat._id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                                        </button>
                                        <button 
                                            onClick={() => setEditingBudgetId(null)} 
                                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-1 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleStartEditBudget(cat)} 
                                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-400/10 px-2.5 py-1 rounded-md transition-colors"
                                    >
                                        <Wallet className="h-3.5 w-3.5" />
                                        {hasBudget ? `Budget: ${currencySymbol}${budget.toFixed(2)}` : 'Set Budget'}
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {cat.name !== 'Uncategorized' && (
                            <button 
                                onClick={() => handleDeleteCategory(cat._id, cat.name)} 
                                aria-label={`Delete category: ${cat.name}`}
                                className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {hasBudget && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-oled-border transition-colors">
                        <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-600 dark:text-gray-400 transition-colors">
                                Spent: <span className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{currencySymbol}{spent.toFixed(2)}</span> of {currencySymbol}{budget.toFixed(2)}
                            </span>
                            <span className={`${textColor} transition-colors`}>{percentage}% {percentage >= 100 && '— Over Budget!'}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-oled-border rounded-full h-2 overflow-hidden transition-colors">
                            <div className={`h-2 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${visualWidth}%` }} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Strict UI Protection
    if (loading || isCurrencyLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                {isCurrencyLoading && <span className="mt-3 text-emerald-600 dark:text-emerald-400 font-medium">Loading live exchange rates...</span>}
            </div>
        );
    }

    if (fetchError || currencyError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-3 text-red-700 dark:text-red-400 max-w-2xl mx-auto mt-6 transition-colors">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{fetchError || currencyError}</p>
            </div>
        );
    }

    if (!isCurrencyReady) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 transition-colors">Categories & Budgets</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">Manage your custom categories and set monthly expense budgets.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-oled-card p-6 rounded-xl border border-gray-200 dark:border-oled-border shadow-sm transition-colors">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2 transition-colors">
                            <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            Add Category
                        </h2>

                        {formError && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-sm text-red-700 dark:text-red-400 border border-transparent dark:border-red-800/50 transition-colors">
                                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {formError}
                            </div>
                        )}
                        <form onSubmit={handleCreateCategory} className="space-y-4" noValidate>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Category Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Groceries"
                                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    disabled={formLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Type</label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="expense" 
                                            checked={type === 'expense'} 
                                            onChange={() => handleTypeChange('expense')} 
                                            className="accent-emerald-600 dark:accent-emerald-400 focus:ring-emerald-500 disabled:opacity-50" 
                                            disabled={formLoading} 
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Expense</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input 
                                            type="radio" 
                                            name="type" 
                                            value="income" 
                                            checked={type === 'income'} 
                                            onChange={() => handleTypeChange('income')} 
                                            className="accent-emerald-600 dark:accent-emerald-400 focus:ring-emerald-500 disabled:opacity-50" 
                                            disabled={formLoading} 
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Income</span>
                                    </label>
                                </div>
                            </div>

                            {type === 'expense' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Monthly Budget Limit ({currencySymbol})</label>
                                    <input
                                        type="number"
                                        step={dynamicStep}
                                        min="0"
                                        value={budgetLimit}
                                        onChange={(e) => setBudgetLimit(e.target.value)}
                                        placeholder="0 (Optional)"
                                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 dark:[color-scheme:dark] px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                        disabled={formLoading}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 transition-colors">Color Tag</label>
                                <div className="mt-1 flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        value={color} 
                                        onChange={(e) => setColor(e.target.value)} 
                                        className="h-9 w-14 p-1 rounded border border-gray-300 dark:border-oled-border bg-white dark:bg-oled-popover cursor-pointer transition-colors" 
                                        disabled={formLoading} 
                                    />
                                    <span className="text-sm text-gray-500 dark:text-gray-400 uppercase transition-colors">{color}</span>
                                </div>
                            </div>

                            <button type="submit" disabled={formLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-oled-card disabled:opacity-70 mt-4 transition-colors">
                                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Category'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Panel: Lists */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-oled-card rounded-xl border border-gray-200 dark:border-oled-border shadow-sm overflow-hidden flex flex-col h-full min-h-[400px] transition-colors">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-oled-border bg-gray-50 dark:bg-oled-card transition-colors">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 transition-colors">Your Categories & Budgets</h2>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            {categories.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-3 transition-colors">
                                    <Tag className="h-12 w-12 opacity-50" />
                                    <p>No categories found.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    
                                    {/* Expense Categories Section */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-oled-border pb-2 transition-colors">
                                            Expense Categories
                                        </h3>
                                        {expenseCategories.length === 0 ? (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No expense categories created yet.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {expenseCategories.map(renderCategoryCard)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Income Categories Section */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-oled-border pb-2 transition-colors">
                                            Income Categories
                                        </h3>
                                        {incomeCategories.length === 0 ? (
                                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No income categories created yet.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {incomeCategories.map(renderCategoryCard)}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;