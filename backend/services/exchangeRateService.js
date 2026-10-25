// In-memory cache variables
let cachedRates = null;
let lastFetchTime = null;

// Cache Time-To-Live (12 hours in milliseconds)
const CACHE_TTL = 12 * 60 * 60 * 1000; 

/**
 * Fetches and returns exchange rates against INR.
 * Fallback strategy: Live API -> Cached Rates -> Throw Error
 * Can be imported and used by any controller (e.g., transaction creation) later.
 */
const getRates = async () => {
    const now = Date.now();

    // 1. Return fresh cache if within TTL
    if (cachedRates && lastFetchTime && (now - lastFetchTime < CACHE_TTL)) {
        return { rates: cachedRates, timestamp: lastFetchTime, source: 'cache' };
    }

    try {
        // 2. Attempt live fetch with a strict 5-second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Using reputable open.er-api.com (No API Key required, reliable uptime)
        const response = await fetch('https://open.er-api.com/v6/latest/INR', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API returned HTTP status ${response.status}`);
        }

        const data = await response.json();

        // 3. Strict validation of external response
        if (data.result !== 'success' || !data.rates || !data.rates.USD || !data.rates.EUR || !data.rates.GBP) {
            throw new Error('Invalid rate payload received from external API');
        }

        // 4. Cache only the supported currencies to strictly control scope
        cachedRates = {
            INR: 1, // Base
            USD: data.rates.USD,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP
        };
        lastFetchTime = now;

        return { rates: cachedRates, timestamp: lastFetchTime, source: 'live' };

    } catch (error) {
        console.error('Exchange Rate Service Warning:', error.message);

        // 5. Fallback to stale cache if live fetch fails (e.g. network timeout)
        if (cachedRates) {
            console.warn('Falling back to last successfully cached exchange rates.');
            return { rates: cachedRates, timestamp: lastFetchTime, source: 'fallback_cache' };
        }

        // 6. Controlled error state (No arbitrary hardcoded rates)
        throw new Error('Exchange rates unavailable and no cached data exists.');
    }
};

module.exports = { getRates };