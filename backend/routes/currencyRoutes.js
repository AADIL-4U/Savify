const express = require('express');
const router = express.Router();
const { getCurrencyRates } = require('../controllers/currencyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/rates').get(protect, getCurrencyRates);

module.exports = router;