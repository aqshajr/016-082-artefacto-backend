// Import library dan middleware yang dibutuhkan
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');  // Controller untuk transaksi
const { transactionValidation } = require('../middlewares/validationMiddleware');  // Validasi input transaksi
const authenticateToken = require('../middlewares/authMiddleware');  // Middleware untuk cek token JWT
const isAdmin = require('../middlewares/adminMiddleware');  // Middleware untuk cek role admin

// Semua endpoint di route ini memerlukan login (autentikasi)
router.use(authenticateToken);

// === Route untuk transaksi ===
// Mendapatkan semua data transaksi (khusus admin)
// GET /api/transactions/admin/all
router.get('/admin/all', isAdmin, transactionController.getAllTransactionsAdmin);

// Membuat transaksi baru (untuk user)
// POST /api/transactions
// Memerlukan: data transaksi yang valid
router.post('/', transactionValidation, transactionController.createTransaction);

module.exports = router;
