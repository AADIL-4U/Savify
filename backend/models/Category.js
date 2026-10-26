const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Category name is required']
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    color: {
        type: String,
        required: [true, 'Color hex code is required']
    },
    budgetLimit: {
        type: Number,
        default: 0 // Stored in integer paise. Fallback default.
    },
    monthlyBudgets: {
        type: Map,
        of: Number, // key: "YYYY-MM" (e.g., "2026-09"), value: paise in integer
        default: {}
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Category', categorySchema);