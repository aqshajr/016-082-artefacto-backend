// ===================================
// Controller Transaksi/Transaction
// ===================================
// Fungsi: Menangani operasi terkait transaksi pembelian tiket
// Fitur:
// 1. Mendapatkan semua transaksi (admin)
// 2. Membuat transaksi baru
// 3. Membuat tiket yang dimiliki setelah transaksi berhasil

// Import library dan model yang dibutuhkan
const { Transaction, Ticket, Temple, OwnedTicket } = require('../models');  // Model dari database
const { validationResult } = require('express-validator');                  // Validasi input
const crypto = require('crypto');                                          // Generate kode unik

// === Get All Transactions (Admin) ===
// Fungsi: Mendapatkan daftar semua transaksi (untuk admin)
// Method: GET
// Endpoint: /api/transactions/admin
// Akses: Admin only
exports.getAllTransactionsAdmin = async (req, res) => {
  try {
    // === Tahap 1: Ambil Data Transaksi ===
    const transactions = await Transaction.findAll({
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }],
      order: [['transaction_date', 'DESC']]
    });

    // === Tahap 2: Kirim Response ===
    res.json({
      status: 'sukses',
      data: { transactions }
    });
  } catch (error) {
    // === Error Handling ===
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// === Create Transaction ===
// Fungsi: Membuat transaksi baru dan tiket yang dimiliki
// Method: POST
// Endpoint: /api/transactions
// Akses: User yang login
exports.createTransaction = async (req, res) => {
  try {
    // === Tahap 1: Validasi Input ===
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    // === Tahap 2: Ambil Data Input ===
    const { ticketID, validDate, ticketQuantity } = req.body;
    const userID = req.user.userID;

    // === Tahap 3: Validasi Tiket ===
    const ticket = await Ticket.findByPk(ticketID, {
      include: [{
        model: Temple,
        attributes: ['title']
      }]
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // === Tahap 4: Hitung Total Harga ===
    const totalPrice = ticket.price * ticketQuantity;

    // === Tahap 5: Buat Transaksi ===
    const transaction = await Transaction.create({
      userID,
      ticketID,
      ticketQuantity,
      totalPrice,
      validDate,
      status: 'success',
      transactionDate: new Date()
    });

    // === Tahap 6: Buat Tiket yang Dimiliki ===
    const ownedTickets = [];
    for (let i = 0; i < ticketQuantity; i++) {
      const uniqueCode = crypto.randomBytes(8).toString('hex');
      const ownedTicket = await OwnedTicket.create({
        userID,
        ticketID,
        transactionID: transaction.transactionID,
        uniqueCode,
        usageStatus: 'Belum Digunakan'
      });
      ownedTickets.push(ownedTicket);
    }

    // === Tahap 7: Kirim Response ===
    res.status(201).json({
      status: 'sukses',
      message: 'Transaksi berhasil dibuat',
      data: {
        transaction: {
          ...transaction.toJSON(),
          ticket: {
            title: ticket.Temple.title,
            price: ticket.price
          }
        },
        ownedTickets
      }
    });
  } catch (error) {
    // === Error Handling ===
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};