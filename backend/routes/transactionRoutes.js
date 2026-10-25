const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, updateTransaction, deleteTransaction, getTransactionSummary } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

// MUST be placed before /:id so Express doesn't interpret 'summary' as an ID parameter
router.route('/summary')
    .get(protect, getTransactionSummary);

router.route('/')
    .get(protect, getTransactions)
    .post(protect, createTransaction);

router.route('/:id')
    .put(protect, updateTransaction)
    .delete(protect, deleteTransaction);

module.exports = router;