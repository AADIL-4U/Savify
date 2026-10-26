const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const exchangeRateService = require('../services/exchangeRateService');

// Helper to check if date range covers a single full calendar month and return "YYYY-MM"
const getSingleMonthKey = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return null;
    const startParts = startDateStr.split('-').map(Number);
    const endParts = endDateStr.split('-').map(Number);
    if (startParts.length !== 3 || endParts.length !== 3) return null;

    const [sYear, sMonth, sDay] = startParts;
    const [eYear, eMonth, eDay] = endParts;

    if (sYear !== eYear || sMonth !== eMonth) return null;
    if (sDay !== 1) return null;

    const lastDayOfMonth = new Date(sYear, sMonth, 0).getDate();
    if (eDay !== lastDayOfMonth) return null;

    return `${sYear}-${String(sMonth).padStart(2, '0')}`;
};

const getThisMonthKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

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

const getCategories = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);

        let transactionQuery = { user: userObjectId };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid dates' });
            }

            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

            transactionQuery.date = { $gte: start, $lt: exclusiveEnd };
        }

        const activeTransactionCategories = await Transaction.distinct('category', transactionQuery);

        let categoryQuery = { user: req.user.id };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);

            categoryQuery.$or = [
                { _id: { $in: activeTransactionCategories } },
                { createdAt: { $gte: start, $lt: exclusiveEnd } },
                { name: 'Uncategorized' }
            ];
        }

        const spendingAggregation = await Transaction.aggregate([
            { $match: transactionQuery },
            { $group: { _id: "$category", totalSpent: { $sum: "$amount" } } }
        ]);

        const spendingMap = {};
        spendingAggregation.forEach(item => {
            if (item._id) {
                spendingMap[item._id.toString()] = item.totalSpent || 0;
            }
        });

        const categories = await Category.find(categoryQuery).sort({ createdAt: -1 });
        const monthKey = getSingleMonthKey(startDate, endDate);
        const thisMonthKey = getThisMonthKey();

        const enrichedCategories = categories.map(cat => {
            const catObj = cat.toObject();
            const spentInPaise = spendingMap[cat._id.toString()] || 0;

            let budgetInPaise = 0;
            if (cat.type === 'expense' && monthKey) {
                if (cat.monthlyBudgets && cat.monthlyBudgets.has && cat.monthlyBudgets.has(monthKey)) {
                    budgetInPaise = cat.monthlyBudgets.get(monthKey);
                } else if (cat.monthlyBudgets && typeof cat.monthlyBudgets.get === 'function' && cat.monthlyBudgets.get(monthKey) !== undefined) {
                    budgetInPaise = cat.monthlyBudgets.get(monthKey);
                } else if (monthKey === thisMonthKey && (!cat.monthlyBudgets || cat.monthlyBudgets.size === 0)) {
                    budgetInPaise = cat.budgetLimit || 0;
                }
            }

            catObj.budgetLimit = Number((budgetInPaise / 100).toFixed(2));
            catObj.spent = Number((spentInPaise / 100).toFixed(2));
            catObj.spentThisMonth = catObj.spent;
            return catObj;
        });

        res.status(200).json({ success: true, data: enrichedCategories });
    } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
    try {
        const { name, type, color, budgetLimit, currency } = req.body;

        if (!name || !type || !color) {
            return res.status(400).json({ success: false, message: 'Please provide name, type, and color' });
        }

        if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Type must be either income or expense' });
        }

        let paiseLimit = 0;
        if (budgetLimit !== undefined && budgetLimit !== null && budgetLimit !== '') {
            const numBudget = Number(budgetLimit);
            if (!Number.isFinite(numBudget) || numBudget < 0) {
                return res.status(400).json({ success: false, message: 'Budget limit must be a valid non-negative number' });
            }

            try {
                paiseLimit = await convertToPaise(numBudget, currency);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!Number.isSafeInteger(paiseLimit)) {
                return res.status(400).json({ success: false, message: 'Budget limit is out of valid bounds' });
            }
        }

        const thisMonthKey = getThisMonthKey();
        const category = await Category.create({
            user: req.user.id,
            name,
            type,
            color,
            budgetLimit: type === 'expense' ? paiseLimit : 0,
            monthlyBudgets: type === 'expense' && paiseLimit > 0 ? { [thisMonthKey]: paiseLimit } : {}
        });

        const formatted = category.toObject();
        formatted.budgetLimit = Number((paiseLimit / 100).toFixed(2));
        formatted.spentThisMonth = 0;

        res.status(201).json({ success: true, data: formatted });
    } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, color, budgetLimit, currency, startDate, endDate } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid Category ID format' });

        const category = await Category.findById(id);
        if (!category || category.user.toString() !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
        }

        if (name) category.name = name;
        if (color) category.color = color;

        if (budgetLimit !== undefined) {
            if (category.type === 'income') return res.status(400).json({ success: false, message: 'Income categories cannot have budget limits' });

            const numBudget = Number(budgetLimit);
            if (!Number.isFinite(numBudget) || numBudget < 0) return res.status(400).json({ success: false, message: 'Budget limit must be a valid non-negative number' });

            let paiseLimit;
            try {
                paiseLimit = await convertToPaise(numBudget, currency);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!Number.isSafeInteger(paiseLimit)) return res.status(400).json({ success: false, message: 'Budget limit is out of valid bounds' });

            const monthKey = getSingleMonthKey(startDate, endDate) || getThisMonthKey();
            if (!category.monthlyBudgets) {
                category.monthlyBudgets = new Map();
            }
            category.monthlyBudgets.set(monthKey, paiseLimit);
            category.budgetLimit = paiseLimit;
        }

        await category.save();

        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        let transactionQuery = { 
            user: userObjectId, 
            category: category._id, 
            type: 'expense' 
        };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const exclusiveEnd = new Date(end);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
            transactionQuery.date = { $gte: start, $lt: exclusiveEnd };
        } else {
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
            transactionQuery.date = { $gte: startOfThisMonth, $lt: startOfNextMonth };
        }

        const spentResult = await Transaction.aggregate([
            { $match: transactionQuery },
            { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
        ]);

        const spentInPaise = spentResult.length > 0 ? spentResult[0].totalSpent : 0;
        const monthKey = getSingleMonthKey(startDate, endDate) || getThisMonthKey();
        const thisMonthKey = getThisMonthKey();

        let budgetInPaise = 0;
        if (category.type === 'expense' && monthKey) {
            if (category.monthlyBudgets && category.monthlyBudgets.has(monthKey)) {
                budgetInPaise = category.monthlyBudgets.get(monthKey);
            } else if (monthKey === thisMonthKey) {
                budgetInPaise = category.budgetLimit || 0;
            }
        }

        const formatted = category.toObject();
        formatted.budgetLimit = Number((budgetInPaise / 100).toFixed(2));
        formatted.spent = Number((spentInPaise / 100).toFixed(2));
        formatted.spentThisMonth = formatted.spent;

        res.status(200).json({ success: true, data: formatted });
    } catch (error) { next(error); }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Category ID format' });
        }

        const category = await Category.findOne({ _id: id, user: req.user.id });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
        }

        if (category.name === 'Uncategorized') {
            return res.status(400).json({ success: false, message: 'Cannot delete the default Uncategorized category' });
        }

        const transactionsCount = await Transaction.countDocuments({ category: id, user: req.user.id });

        if (transactionsCount > 0) {
            let uncategorized = await Category.findOne({ 
                user: req.user.id, 
                name: 'Uncategorized', 
                type: category.type 
            });

            if (!uncategorized) {
                uncategorized = await Category.create({
                    user: req.user.id,
                    name: 'Uncategorized',
                    color: '#9CA3AF',
                    type: category.type
                });
            }

            await Transaction.updateMany(
                { category: id, user: req.user.id },
                { $set: { category: uncategorized._id } }
            );
        }

        await Category.findByIdAndDelete(id);

        res.status(200).json({ 
            success: true, 
            message: 'Category deleted successfully',
            data: { id }
        });
    } catch (error) { 
        next(error); 
    }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };