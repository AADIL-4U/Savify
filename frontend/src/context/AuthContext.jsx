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

    const fetchRates = async () => {
        setIsRatesLoading(true);
        setRatesError(null);
        try {
            const response = await api.get('/currency/rates');
            
            // Explicitly handle HTTP 200 with missing/invalid payloads
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

    // Fetch on mount or when token is available
    useEffect(() => {
        if (user && user.token && !exchangeRates && !isRatesLoading && !ratesError) {
            fetchRates();
        }
    }, [user?.token]);

    // Retry fetching if user switches to a foreign currency but rates previously failed
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

    // --- Currency Conversion Helpers ---
    const convertFromBase = (amountInINR) => {
        if (!amountInINR) return 0;
        const target = user?.currency || 'INR';
        
        if (target === 'INR') return amountInINR;
        
        // STRICT RULE: Never fail silently. If foreign currency is selected but rates are missing, return null.
        if (!exchangeRates || !exchangeRates[target]) return null; 
        
        return amountInINR * exchangeRates[target];
    };

    // Derived readiness states for UI protection
    const isCurrencyReady = user?.currency === 'INR' || (exchangeRates !== null && exchangeRates[user.currency] !== undefined);
    const isCurrencyLoading = user?.currency !== 'INR' && isRatesLoading;
    const currencyError = user?.currency !== 'INR' && ratesError ? ratesError : null;

    return (
        <AuthContext.Provider value={{ 
            user, loading, login, register, logout, updateUserProfile, 
            convertFromBase, isCurrencyReady, isCurrencyLoading, currencyError, fetchRates 
        }}>
            {children}
        </AuthContext.Provider>
    );
};