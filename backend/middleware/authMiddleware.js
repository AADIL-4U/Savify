const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (excluding password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            // Check if user changed password after the token was issued
            if (req.user.passwordChangedAt) {
                // Normalize both timestamps to seconds to avoid precision edge cases
                const passwordChangedTimestamp = Math.floor(req.user.passwordChangedAt.getTime() / 1000);
                const tokenIssuedTimestamp = decoded.iat;

                // Reject if token was issued strictly BEFORE the password was changed
                if (tokenIssuedTimestamp < passwordChangedTimestamp) {
                    return res.status(401).json({ 
                        success: false, 
                        message: 'Password recently changed. Please log in again.' 
                    });
                }
            }

            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

module.exports = { protect };