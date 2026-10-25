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
        default: 0 // Stored in integer paise. 0 means unset.
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Category', categorySchema);