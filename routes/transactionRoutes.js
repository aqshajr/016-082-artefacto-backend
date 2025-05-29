const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { transactionValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Semua rute memerlukan autentikasi
router.use(authenticateToken);

// Rute transaksi
router.get('/admin/all', isAdmin, transactionController.getAllTransactionsAdmin);
router.post('/', transactionValidation, transactionController.createTransaction);

module.exports = router;
