require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize database connection
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Route Definitions
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
// ... existing route imports
const currencyRoutes = require('./routes/currencyRoutes'); // Add this line

// ... existing app.use middleware
app.use('/api/currency', currencyRoutes); // Add this line

// Phase 1 Health Check Endpoint
app.get('/api/status', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Savify Backend is running successfully.',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// Basic 404 handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});