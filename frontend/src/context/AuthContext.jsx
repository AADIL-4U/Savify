import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('savify_user');
        if (!savedUser) return null;

        try {
            const parsed = JSON.parse(savedUser);
            return {
                ...parsed,
                currency: parsed.currency || 'INR'
            };
        } catch {
            localStorage.removeItem('savify_user');
            return null;
        }
    });
    
    const [loading, setLoading] = useState(false);
    
    // Currency States
    const [exchangeRates, setExchangeRates] = useState(null);
    const [isRatesLoading, setIsRatesLoading] = useState(false);
    const [ratesError, setRatesError] = useState(null);

    // Dashboard Period Persistence State (Resets on refresh/logout)
    const [dashboardPeriod, setDashboardPeriod] = useState('thisMonth');
    const [dashboardCustomStart, setDashboardCustomStart] = useState('');
    const [dashboardCustomEnd, setDashboardCustomEnd] = useState('');

    // Transactions Filter Persistence State (Resets on refresh/logout)
    const [transactionsFilterType, setTransactionsFilterType] = useState('thisMonth');
    const [transactionsCustomStart, setTransactionsCustomStart] = useState('');
    const [transactionsCustomEnd, setTransactionsCustomEnd] = useState('');

    // Categories Filter Persistence State (Resets on refresh/logout)
    const [categoriesFilterType, setCategoriesFilterType] = useState('thisMonth');
    const [categoriesCustomStart, setCategoriesCustomStart] = useState('');
    const [categoriesCustomEnd, setCategoriesCustomEnd] = useState('');

    const fetchRates = async () => {
        setIsRatesLoading(true);
        setRatesError(null);
        try {
            const response = await api.get('/currency/rates');
            
            if (response.data && response.data.success && response.data.data && response.data.data.rates) {
                setExchangeRates(response.data.data.rates);
            } else {
                setExchangeRates(null);
                setRatesError(response.data?.message || 'Invalid or missing exchange rate data from server.');
            }
        } catch (error) {
            console.error('Failed to fetch exchange rates:', error);
            setExchangeRates(null);
            setRatesError('Live exchange rates are currently unavailable.');
        } finally {
            setIsRatesLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.token && !exchangeRates && !isRatesLoading && !ratesError) {
            fetchRates();
        }
    }, [user?.token]);

    useEffect(() => {
        if (user && user.token && user.currency !== 'INR' && !exchangeRates && !isRatesLoading) {
            fetchRates();
        }
    }, [user?.currency]);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success) {
                setUser(response.data.data);
                localStorage.setItem('savify_user', JSON.stringify(response.data.data));
                return { success: true };
            }
        } catch (error) {
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed',
                code: error.response?.data?.code 
            };
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/register', { name, email, password });
            if (response.data.success) {
                setUser(response.data.data);
                localStorage.setItem('savify_user', JSON.stringify(response.data.data));
                return { success: true };
            }
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setExchangeRates(null);
        setDashboardPeriod('thisMonth');
        setDashboardCustomStart('');
        setDashboardCustomEnd('');
        setTransactionsFilterType('thisMonth');
        setTransactionsCustomStart('');
        setTransactionsCustomEnd('');
        setCategoriesFilterType('thisMonth');
        setCategoriesCustomStart('');
        setCategoriesCustomEnd('');
        localStorage.removeItem('savify_user');
        window.location.href = '/login';
    };

    const updateUserProfile = (updatedFields) => {
        setUser(prevUser => {
            const updatedUser = { ...prevUser, ...updatedFields };
            localStorage.setItem('savify_user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };

    const convertFromBase = (amountInINR) => {
        if (!amountInINR) return 0;
        const target = user?.currency || 'INR';
        
        if (target === 'INR') return amountInINR;
        if (!exchangeRates || !exchangeRates[target]) return null; 
        
        return amountInINR * exchangeRates[target];
    };

    const isCurrencyReady = user?.currency === 'INR' || (exchangeRates !== null && exchangeRates[user.currency] !== undefined);
    const isCurrencyLoading = user?.currency !== 'INR' && isRatesLoading;
    const currencyError = user?.currency !== 'INR' && ratesError ? ratesError : null;

    return (
        <AuthContext.Provider value={{ 
            user, loading, login, register, logout, updateUserProfile, 
            convertFromBase, isCurrencyReady, isCurrencyLoading, currencyError, fetchRates,
            dashboardPeriod, setDashboardPeriod,
            dashboardCustomStart, setDashboardCustomStart,
            dashboardCustomEnd, setDashboardCustomEnd,
            transactionsFilterType, setTransactionsFilterType,
            transactionsCustomStart, setTransactionsCustomStart,
            transactionsCustomEnd, setTransactionsCustomEnd,
            categoriesFilterType, setCategoriesFilterType,
            categoriesCustomStart, setCategoriesCustomStart,
            categoriesCustomEnd, setCategoriesCustomEnd
        }}>
            {children}
        </AuthContext.Provider>
    );
};