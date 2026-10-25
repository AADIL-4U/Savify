const exchangeRateService = require('../services/exchangeRateService');

// @desc    Get current exchange rates (Base: INR)
// @route   GET /api/currency/rates
// @access  Private
const getCurrencyRates = async (req, res, next) => {
    try {
        const data = await exchangeRateService.getRates();
        
        res.status(200).json({
            success: true,
            data: {
                base: 'INR',
                rates: data.rates,
                lastUpdated: new Date(data.timestamp).toISOString(),
                source: data.source
            }
        });
    } catch (error) {
        // Return a controlled 503 Service Unavailable state
        res.status(503).json({
            success: false,
            message: error.message || 'Exchange rate service currently unavailable.'
        });
    }
};

module.exports = { getCurrencyRates };