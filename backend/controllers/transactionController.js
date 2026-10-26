const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const exchangeRateService = require('../services/exchangeRateService');

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
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ success: false, message: 'Invalid dates' });
            if (start > end) return res.status(400).json({ success: false, message: 'Start date cannot be after end date.' });
            
            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
            query.date = { $gte: start, $lt: exclusiveEnd };
        }

        const transactions = await Transaction.find(query).populate('category', 'name color type').sort({ date: -1 });
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
        let { categoryId, type, amount, description, date, currency } = req.body;

        if (!type || amount === undefined || !description || !date) return res.status(400).json({ success: false, message: 'Missing fields' });
        if (!['income', 'expense'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid type' });

        const numAmount = Number(amount);
        if (!Number.isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });

        let category;
        if (!categoryId) {
            category = await Category.findOne({ user: req.user.id, name: 'Uncategorized', type });
            if (!category) category = await Category.create({ user: req.user.id, name: 'Uncategorized', color: '#9CA3AF', type });
            categoryId = category._id;
        } else {
            if (!mongoose.Types.ObjectId.isValid(categoryId)) return res.status(400).json({ success: false, message: 'Invalid Category ID' });
            category = await Category.findOne({ _id: categoryId, user: req.user.id });
            if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
            if (category.type !== type) return res.status(400).json({ success: false, message: `Type mismatch` });
        }

        let amountInPaise;
        try { amountInPaise = await convertToPaise(numAmount, currency); } 
        catch (err) { return res.status(400).json({ success: false, message: err.message }); }

        const transaction = await Transaction.create({
            user: req.user.id, category: categoryId, type, amount: amountInPaise, description, date
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
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

        let transaction = await Transaction.findById(id);
        if (!transaction || transaction.user.toString() !== req.user.id) return res.status(404).json({ success: false, message: 'Transaction not found' });

        let { categoryId, type, amount, description, date, currency } = req.body;
        let updateData = { description, date };

        if (amount !== undefined) {
            const numAmount = Number(amount);
            if (!Number.isFinite(numAmount) || numAmount <= 0) return res.status(400).json({ success: false, message: 'Invalid amount' });
            try { updateData.amount = await convertToPaise(numAmount, currency); } 
            catch (err) { return res.status(400).json({ success: false, message: err.message }); }
        }

        const finalType = type || transaction.type;

        if (categoryId === "" || categoryId === null) {
            let uncategorized = await Category.findOne({ user: req.user.id, name: 'Uncategorized', type: finalType });
            if (!uncategorized) uncategorized = await Category.create({ user: req.user.id, name: 'Uncategorized', color: '#9CA3AF', type: finalType });
            categoryId = uncategorized._id.toString();
        }

        if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) return res.status(400).json({ success: false, message: 'Invalid Category ID' });
        const finalCategoryId = categoryId || transaction.category;

        if (categoryId || type) {
            if (type && !['income', 'expense'].includes(type)) return res.status(400).json({ success: false, message: 'Invalid type' });
            const category = await Category.findOne({ _id: finalCategoryId, user: req.user.id });
            if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
            if (category.type !== finalType) return res.status(400).json({ success: false, message: 'Type mismatch' });

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
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });

        const transaction = await Transaction.findOneAndDelete({ _id: id, user: req.user.id });
        if (!transaction) return res.status(404).json({ success: false, message: 'Not found' });

        res.status(200).json({ success: true, message: 'Deleted successfully', data: { id } });
    } catch (error) { next(error); }
};

const getTransactionSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        // 1. ALL-TIME BALANCE (For "Current Balance" card on "This Month" view)
        const allTimeStats = await Transaction.aggregate([
            { $match: { user: userObjectId } },
            { $group: { _id: "$type", total: { $sum: "$amount" } } }
        ]);
        let allTimeIncome = 0; let allTimeExpense = 0;
        allTimeStats.forEach(stat => {
            if (stat._id === 'income') allTimeIncome = stat.total;
            if (stat._id === 'expense') allTimeExpense = stat.total;
        });
        const currentBalance = allTimeIncome - allTimeExpense;

        // 2. PERIOD BOUNDARIES
        let start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
        let end = new Date(start); end.setMonth(end.getMonth() + 1);

        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        }

        // 3. PERIOD STATS (Income & Expense)
        const periodStats = await Transaction.aggregate([
            { $match: { user: userObjectId, date: { $gte: start, $lt: end } } },
            { $group: { _id: "$type", total: { $sum: "$amount" } } }
        ]);

        let periodIncome = 0; let periodExpense = 0;
        periodStats.forEach(stat => {
            if (stat._id === 'income') periodIncome = stat.total;
            if (stat._id === 'expense') periodExpense = stat.total;
        });

        // 4. CATEGORY BREAKDOWN (Expense Only)
        const categoryBreakdown = await Transaction.aggregate([
            { $match: { user: userObjectId, date: { $gte: start, $lt: end }, type: 'expense' } },
            { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "categoryInfo" } },
            { $unwind: "$categoryInfo" },
            { $project: { _id: 1, amount: "$totalAmount", name: "$categoryInfo.name", color: "$categoryInfo.color" } }
        ]);

        const formattedBreakdown = categoryBreakdown.map(item => ({
            _id: item._id, name: item.name, color: item.color, amount: Number((item.amount / 100).toFixed(2))
        }));

        res.status(200).json({
            success: true,
            data: {
                period: { start, end },
                currentBalance: Number((currentBalance / 100).toFixed(2)),
                totalIncome: Number((periodIncome / 100).toFixed(2)),
                totalExpense: Number((periodExpense / 100).toFixed(2)),
                periodSavings: Number(((periodIncome - periodExpense) / 100).toFixed(2)),
                expenseBreakdown: formattedBreakdown
            }
        });
    } catch (error) { next(error); }
};

module.exports = { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary };