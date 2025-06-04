// Import library dan middleware yang dibutuhkan
const express = require('express');
const router = express.Router();
const ownedTicketController = require('../controllers/ownedTicketController');  // Controller untuk tiket yang dimiliki user
const { ownedTicketValidation, idParamValidation } = require('../middlewares/validationMiddleware');  // Validasi input
const authenticateToken = require('../middlewares/authMiddleware');  // Middleware untuk cek token JWT

// Semua endpoint di route ini memerlukan login (autentikasi)
router.use(authenticateToken);

// === Route untuk user yang sudah login ===
// Mendapatkan semua tiket yang dimiliki user
// GET /api/owned-tickets
router.get('/', ownedTicketController.getOwnedTickets);

// Mendapatkan detail tiket tertentu yang dimiliki user
// GET /api/owned-tickets/:id
router.get('/:id', idParamValidation, ownedTicketController.getOwnedTicketById);

// Mencatat pembelian tiket baru oleh user
// POST /api/owned-tickets
router.post('/', ownedTicketValidation, ownedTicketController.createOwnedTicket);

// Mengupdate status penggunaan tiket (misal: sudah digunakan)
// PUT /api/owned-tickets/:id/use
router.put('/:id/use', idParamValidation, ownedTicketController.updateUsageStatus);

module.exports = router;
