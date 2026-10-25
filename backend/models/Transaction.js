const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },

        type: {
            type: String,
            enum: ['income', 'expense'],
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        date: {
            type: Date,
            required: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Transaction', transactionSchema);