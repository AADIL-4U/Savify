/**
 * Custom in-memory rate limiter using Map (Zero external dependencies)
 */
const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000; 
    const max = options.max || 6; 
    const message = options.message || 'Too many attempts. Please try again later.';
    const keyGenerator = options.keyGenerator || ((req) => req.ip || req.socket?.remoteAddress || 'unknown');

    const hits = new Map();

    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, data] of hits.entries()) {
            if (now > data.resetTime) {
                hits.delete(key);
            }
        }
    }, 5 * 60 * 1000); 

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

    return (req, res, next) => {
        const requestKey = keyGenerator(req);
        const now = Date.now();

        let record = hits.get(requestKey);

        if (!record || now > record.resetTime) {
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            hits.set(requestKey, record);
        } else {
            record.count++;
        }

        const remainingTimeSeconds = Math.ceil((record.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

        if (record.count > max) {
            res.setHeader('Retry-After', remainingTimeSeconds);
            return res.status(429).json({
                success: false,
                message
            });
        }

        next();
    };
};

module.exports = rateLimiter;