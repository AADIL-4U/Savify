const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const exchangeRateService = require('../services/exchangeRateService');

// Helper to convert foreign amount to canonical INR paise
const convertToPaise = async (amount, currency) => {
    if (currency && currency !== 'INR') {
        const rateData = await exchangeRateService.getRates();
        const rate = rateData.rates[currency];
        if (!rate) throw new Error(`Invalid currency code: ${currency}`);
        
        const inrAmount = amount / rate;
        return Math.round(inrAmount * 100);
    }
    return Math.round(amount * 100);
};

const getTransactions = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { user: req.user.id };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date values provided.' });
            }
            if (start > end) {
                return res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
            }

            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

            query.date = { $gte: start, $lt: exclusiveEnd };
        }

        const transactions = await Transaction.find(query)
            .populate('category', 'name color type')
            .sort({ date: -1 });

        const formattedTransactions = transactions.map(t => {
            const tx = t.toObject(); 
            tx.amount = Number((tx.amount / 100).toFixed(2));
            return tx;
        });

        res.status(200).json({ success: true, count: formattedTransactions.length, data: formattedTransactions });
    } catch (error) { next(error); }
};

const createTransaction = async (req, res, next) => {
    try {
        // Use 'let' for categoryId so we can dynamically assign it if missing
        let { categoryId, type, amount, description, date, currency } = req.body;

        // REMOVED !categoryId from the strict validation check
        if (!type || amount === undefined || !description || !date) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type must be either income or expense' });
        }

        const numAmount = Number(amount);
        if (!Number.isFinite(numAmount) || numAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Amount must be a valid number greater than 0' });
        }

        let category;

        // NEW: Dynamic Uncategorized Fallback
        if (!categoryId) {
            category = await Category.findOne({ user: req.user.id, name: 'Uncategorized', type });
            
            if (!category) {
                category = await Category.create({
                    user: req.user.id,
                    name: 'Uncategorized',
                    color: '#9CA3AF', // Neutral gray
                    type
                });
            }
            categoryId = category._id;
        } else {
            // Existing strict validation if a category IS provided
            if (!mongoose.Types.ObjectId.isValid(categoryId)) {
                return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
            }

            category = await Category.findOne({ _id: categoryId, user: req.user.id });
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found or access denied' });
            }

            if (category.type !== type) {
                return res.status(400).json({ success: false, message: `Type mismatch: Cannot assign an '${type}' transaction to an '${category.type}' category` });
            }
        }

        // Authoritative backend conversion
        let amountInPaise;
        try {
            amountInPaise = await convertToPaise(numAmount, currency);
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        const transaction = await Transaction.create({
            user: req.user.id,
            category: categoryId,
            type,
            amount: amountInPaise,
            description,
            date
        });

        const formattedTransaction = transaction.toObject();
        formattedTransaction.amount = Number((formattedTransaction.amount / 100).toFixed(2));
        formattedTransaction.category = { _id: category._id, name: category.name, color: category.color, type: category.type };

        res.status(201).json({ success: true, data: formattedTransaction });
    } catch (error) { next(error); }
};

const updateTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Transaction ID format' });
        }

        let transaction = await Transaction.findById(id);
        
        if (!transaction || transaction.user.toString() !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
        }

        let { categoryId, type, amount, description, date, currency } = req.body;
        let updateData = { description, date };

        if (amount !== undefined) {
            const numAmount = Number(amount);
            if (!Number.isFinite(numAmount) || numAmount <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid amount' });
            }
            
            try {
                updateData.amount = await convertToPaise(numAmount, currency);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
        }

        const finalType = type || transaction.type;

        // NEW: If the frontend sends an empty string for categoryId, it means the user cleared it out
        if (categoryId === "" || categoryId === null) {
            let uncategorized = await Category.findOne({ user: req.user.id, name: 'Uncategorized', type: finalType });
            if (!uncategorized) {
                uncategorized = await Category.create({
                    user: req.user.id,
                    name: 'Uncategorized',
                    color: '#9CA3AF',
                    type: finalType
                });
            }
            categoryId = uncategorized._id.toString();
        }

        if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
        }

        const finalCategoryId = categoryId || transaction.category;

        if (categoryId || type) {
            if (type && !['income', 'expense'].includes(type)) {
                return res.status(400).json({ success: false, message: 'Invalid type' });
            }

            const category = await Category.findOne({ _id: finalCategoryId, user: req.user.id });
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found or access denied' });
            }
            
            if (category.type !== finalType) {
                return res.status(400).json({ success: false, message: 'Type mismatch between transaction and category' });
            }

            updateData.category = finalCategoryId;
            updateData.type = finalType;
        }

        transaction = await Transaction.findByIdAndUpdate(id, updateData, { new: true }).populate('category', 'name color type');

        const formattedTransaction = transaction.toObject();
        formattedTransaction.amount = Number((formattedTransaction.amount / 100).toFixed(2));

        res.status(200).json({ success: true, data: formattedTransaction });
    } catch (error) { next(error); }
};

const deleteTransaction = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid Transaction ID format' });

        const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.user.id });
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Transaction deleted successfully', data: { id } });
    } catch (error) { next(error); }
};

const getTransactionSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        let start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);

        let end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        const summary = await Transaction.aggregate([
            { $match: { user: userObjectId, date: { $gte: start, $lt: end } } },
            { $group: { _id: "$type", totalAmount: { $sum: "$amount" } } }
        ]);

        let totalIncome = 0;
        let totalExpense = 0;

        summary.forEach(item => {
            if (item._id === 'income') totalIncome = item.totalAmount;
            if (item._id === 'expense') totalExpense = item.totalAmount;
        });

        const categoryBreakdown = await Transaction.aggregate([
            { $match: { user: userObjectId, date: { $gte: start, $lt: end }, type: 'expense' } },
            { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "categoryInfo" } },
            { $unwind: "$categoryInfo" },
            { $project: { _id: 1, amount: "$totalAmount", name: "$categoryInfo.name", color: "$categoryInfo.color" } }
        ]);

        const formattedBreakdown = categoryBreakdown.map(item => ({
            _id: item._id,
            name: item.name,
            color: item.color,
            amount: Number((item.amount / 100).toFixed(2))
        }));

        res.status(200).json({
            success: true,
            data: {
                period: { start, end },
                totalIncome: Number((totalIncome / 100).toFixed(2)),
                totalExpense: Number((totalExpense / 100).toFixed(2)),
                balance: Number(((totalIncome - totalExpense) / 100).toFixed(2)),
                expenseBreakdown: formattedBreakdown
            }
        });
    } catch (error) { next(error); }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary };