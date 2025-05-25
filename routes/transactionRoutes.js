const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { transactionValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');

// Semua rute memerlukan autentikasi
router.use(authenticateToken);

// Rute transaksi
router.get('/', transactionController.getTransactions);
router.get('/:id', idParamValidation, transactionController.getTransactionById);
router.post('/', transactionValidation, transactionController.createTransaction);

module.exports = router;
