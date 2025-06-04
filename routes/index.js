// Import Express untuk membuat router
const express = require('express');
const router = express.Router();

// Import semua route yang ada di aplikasi
const authRoutes = require('./authRoutes');           // Route untuk autentikasi (login/register)
const templeRoutes = require('./templeRoutes');       // Route untuk manajemen candi
const artifactRoutes = require('./artifactRoutes');   // Route untuk manajemen artefak
const ticketRoutes = require('./ticketRoutes');       // Route untuk manajemen tiket
const transactionRoutes = require('./transactionRoutes'); // Route untuk transaksi
const ownedTicketRoutes = require('./ownedTicketRoutes'); // Route untuk tiket yang dimiliki user
const mlRoutes = require('./mlRoutes');               // Route untuk machine learning

// Menghubungkan setiap route dengan endpoint spesifik
router.use('/auth', authRoutes);           // Contoh: /api/auth/login
router.use('/temples', templeRoutes);      // Contoh: /api/temples/list
router.use('/artifacts', artifactRoutes);  // Contoh: /api/artifacts/detail
router.use('/tickets', ticketRoutes);      // Contoh: /api/tickets/buy
router.use('/transactions', transactionRoutes); // Contoh: /api/transactions/history
router.use('/owned-tickets', ownedTicketRoutes); // Contoh: /api/owned-tickets/my-tickets
router.use('/ml', mlRoutes);              // Contoh: /api/ml/predict

// Export router untuk digunakan di server.js
module.exports = router; 