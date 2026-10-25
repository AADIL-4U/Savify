export const CURRENCY_SYMBOLS = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£'
};

export const getCurrencySymbol = (currency = 'INR') => {
    return CURRENCY_SYMBOLS[currency] || '₹';
};