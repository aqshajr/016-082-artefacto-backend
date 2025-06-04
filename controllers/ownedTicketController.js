// ===================================
// Controller Tiket Dimiliki/Owned Ticket
// ===================================
// Fungsi: Menangani operasi terkait tiket yang dimiliki user
// Fitur:
// 1. Mendapatkan semua tiket yang dimiliki user
// 2. Mendapatkan detail tiket yang dimiliki
// 3. Membuat record tiket yang dimiliki
// 4. Memperbarui status penggunaan tiket

// Import library dan model yang dibutuhkan
const { OwnedTicket, Ticket, Temple, Transaction } = require('../models');  // Model dari database
const { validationResult } = require('express-validator');                  // Validasi input
const crypto = require('crypto');                                          // Generate kode unik

// === Get All Owned Tickets ===
// Fungsi: Mendapatkan daftar semua tiket yang dimiliki user
// Method: GET
// Endpoint: /api/owned-tickets
// Akses: User yang login
exports.getOwnedTickets = async (req, res) => {
  try {
    // === Tahap 1: Ambil ID User ===
    const userID = req.user.userID;
    
    // === Tahap 2: Ambil Data Tiket ===
    const ownedTickets = await OwnedTicket.findAll({
      where: { userID },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }, {
        model: Transaction,
        attributes: ['transactionID', 'validDate', 'totalPrice', 'transactionDate', 'status']
      }],
      order: [['ownedTicketID', 'DESC']]
    });

    // === Tahap 3: Kirim Response ===
    res.json({
      status: 'sukses',
      data: { ownedTickets }
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

// === Get Owned Ticket By ID ===
// Fungsi: Mendapatkan detail satu tiket yang dimiliki
// Method: GET
// Endpoint: /api/owned-tickets/:id
// Akses: User yang login
exports.getOwnedTicketById = async (req, res) => {
  try {
    // === Tahap 1: Ambil Parameter ===
    const { id } = req.params;
    const userID = req.user.userID;

    // === Tahap 2: Ambil Data Tiket ===
    const ownedTicket = await OwnedTicket.findOne({
      where: { 
        ownedTicketID: id,
        userID 
      },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }, {
        model: Transaction,
        attributes: ['transactionID', 'validDate', 'totalPrice', 'transactionDate', 'status']
      }]
    });

    // === Tahap 3: Validasi Keberadaan Tiket ===
    if (!ownedTicket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // === Tahap 4: Kirim Response ===
    res.json({
      status: 'sukses',
      data: { ownedTicket }
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

// === Create Owned Ticket ===
// Fungsi: Membuat record tiket yang dimiliki
// Method: POST
// Endpoint: /api/owned-tickets
// Akses: User yang login
exports.createOwnedTicket = async (req, res) => {
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
    const { ticketID, transactionID } = req.body;
    const userID = req.user.userID;

    // === Tahap 3: Generate Kode Unik ===
    const uniqueCode = crypto.randomBytes(8).toString('hex');

    // === Tahap 4: Buat Record Tiket ===
    const ownedTicket = await OwnedTicket.create({
      userID,
      ticketID,
      transactionID,
      uniqueCode,
      usageStatus: 'Belum Digunakan'
    });

    // === Tahap 5: Kirim Response ===
    res.status(201).json({
      status: 'sukses',
      message: 'Tiket berhasil dibuat',
      data: { ownedTicket }
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

// === Update Usage Status ===
// Fungsi: Memperbarui status penggunaan tiket
// Method: PUT
// Endpoint: /api/owned-tickets/:id/usage
// Akses: User yang login
exports.updateUsageStatus = async (req, res) => {
  try {
    // === Tahap 1: Ambil Parameter ===
    const { id } = req.params;
    const userID = req.user.userID;

    // === Tahap 2: Validasi Keberadaan Tiket ===
    const ownedTicket = await OwnedTicket.findOne({
      where: { 
        ownedTicketID: id,
        userID 
      }
    });

    if (!ownedTicket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // === Tahap 3: Validasi Status Tiket ===
    if (ownedTicket.usageStatus === 'Sudah Digunakan') {
      return res.status(400).json({
        status: 'error',
        message: 'Tiket sudah pernah digunakan'
      });
    }

    // === Tahap 4: Update Status ===
    await ownedTicket.update({
      usageStatus: 'Sudah Digunakan'
    });

    // === Tahap 5: Ambil Data Terbaru ===
    const updatedTicket = await OwnedTicket.findOne({
      where: { ownedTicketID: id },
      include: [{
        model: Ticket,
        include: [{
          model: Temple,
          attributes: ['title', 'locationUrl']
        }]
      }, {
        model: Transaction,
        attributes: ['transactionID', 'validDate', 'totalPrice', 'transactionDate', 'status']
      }]
    });

    // === Tahap 6: Kirim Response ===
    res.json({
      status: 'sukses',
      message: 'Status penggunaan tiket berhasil diperbarui',
      data: { ownedTicket: updatedTicket }
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
