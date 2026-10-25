const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
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

const getCategories = async (req, res, next) => {
    try {
        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

        const spendingAggregation = await Transaction.aggregate([
            { 
                $match: { 
                    user: userObjectId, 
                    type: 'expense',
                    date: { $gte: startOfThisMonth, $lt: startOfNextMonth } 
                } 
            },
            { $group: { _id: "$category", totalSpent: { $sum: "$amount" } } }
        ]);

        const spendingMap = {};
        spendingAggregation.forEach(item => {
            spendingMap[item._id.toString()] = item.totalAmount || item.totalSpent || 0;
        });

        const categories = await Category.find({ user: req.user.id }).sort({ createdAt: -1 });
        
        const enrichedCategories = categories.map(cat => {
            const catObj = cat.toObject();
            const spentInPaise = spendingMap[cat._id.toString()] || 0;

            catObj.budgetLimit = Number((catObj.budgetLimit / 100).toFixed(2));
            catObj.spentThisMonth = Number((spentInPaise / 100).toFixed(2));
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
            
            // Authoritative backend conversion
            try {
                paiseLimit = await convertToPaise(numBudget, currency);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!Number.isSafeInteger(paiseLimit)) {
                return res.status(400).json({ success: false, message: 'Budget limit is out of valid bounds' });
            }
        }

        const category = await Category.create({
            user: req.user.id,
            name,
            type,
            color,
            budgetLimit: type === 'expense' ? paiseLimit : 0 
        });

        const formatted = category.toObject();
        formatted.budgetLimit = Number((formatted.budgetLimit / 100).toFixed(2));
        formatted.spentThisMonth = 0;

        res.status(201).json({ success: true, data: formatted });
    } catch (error) { next(error); }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, color, budgetLimit, currency } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid Category ID format' });

        const category = await Category.findById(id);
        if (!category || category.user.toString() !== req.user.id) {
            return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
        }

        let updateData = {};
        if (name) updateData.name = name;
        if (color) updateData.color = color;

        if (budgetLimit !== undefined) {
            if (category.type === 'income') return res.status(400).json({ success: false, message: 'Income categories cannot have budget limits' });
            
            const numBudget = Number(budgetLimit);
            if (!Number.isFinite(numBudget) || numBudget < 0) return res.status(400).json({ success: false, message: 'Budget limit must be a valid non-negative number' });
            
            // Authoritative backend conversion
            let paiseLimit;
            try {
                paiseLimit = await convertToPaise(numBudget, currency);
            } catch (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (!Number.isSafeInteger(paiseLimit)) return res.status(400).json({ success: false, message: 'Budget limit is out of valid bounds' });
            updateData.budgetLimit = paiseLimit;
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });

        const userObjectId = new mongoose.Types.ObjectId(req.user.id);
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

        const spentResult = await Transaction.aggregate([
            { 
                $match: { 
                    user: userObjectId, 
                    category: updatedCategory._id,
                    type: 'expense',
                    date: { $gte: startOfThisMonth, $lt: startOfNextMonth } 
                } 
            },
            { $group: { _id: null, totalSpent: { $sum: "$amount" } } }
        ]);

        const spentInPaise = spentResult.length > 0 ? spentResult[0].totalSpent : 0;
        const formatted = updatedCategory.toObject();
        formatted.budgetLimit = Number((formatted.budgetLimit / 100).toFixed(2));
        formatted.spentThisMonth = Number((spentInPaise / 100).toFixed(2));

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

        // Check if there are transactions associated with this category
        const transactionsCount = await Transaction.countDocuments({ category: id, user: req.user.id });

        if (transactionsCount > 0) {
            // Find an existing Uncategorized category of the same type for this user
            let uncategorized = await Category.findOne({ 
                user: req.user.id, 
                name: 'Uncategorized', 
                type: category.type 
            });

            // If it doesn't exist, generate it dynamically
            if (!uncategorized) {
                uncategorized = await Category.create({
                    user: req.user.id,
                    name: 'Uncategorized',
                    color: '#9CA3AF', // Neutral gray color for UI
                    type: category.type
                });
            }

            // Reassign all orphaned transactions to this Uncategorized category
            await Transaction.updateMany(
                { category: id, user: req.user.id },
                { $set: { category: uncategorized._id } }
            );
        }

        // Delete the original category
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