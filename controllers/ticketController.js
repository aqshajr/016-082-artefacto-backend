// ===================================
// Controller Tiket/Ticket
// ===================================
// Fungsi: Menangani operasi terkait data tiket masuk candi
// Fitur:
// 1. Mendapatkan semua data tiket
// 2. Mendapatkan detail tiket
// 3. Membuat tiket baru (admin)
// 4. Memperbarui data tiket (admin)
// 5. Menghapus tiket (admin)

// Import library dan model yang dibutuhkan
const { Ticket, Temple } = require('../models');                // Model dari database
const { validationResult } = require('express-validator');     // Validasi input

// === Get All Tickets ===
// Fungsi: Mendapatkan daftar semua tiket
// Method: GET
// Endpoint: /api/tickets
// Akses: Public
exports.getAllTickets = async (req, res) => {
  try {
    // === Tahap 1: Ambil Data Tiket ===
    const tickets = await Ticket.findAll({
      include: [{
        model: Temple,
        attributes: ['title', 'locationUrl']
      }]
    });

    // === Tahap 2: Kirim Response ===
    res.json({
      status: 'sukses',
      data: { tickets }
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

// === Get Ticket By ID ===
// Fungsi: Mendapatkan detail satu tiket
// Method: GET
// Endpoint: /api/tickets/:id
// Akses: Public
exports.getTicketById = async (req, res) => {
  try {
    // === Tahap 1: Ambil Data Tiket ===
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{
        model: Temple,
        attributes: ['title', 'locationUrl']
      }]
    });

    // === Tahap 2: Validasi Keberadaan Tiket ===
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // === Tahap 3: Kirim Response ===
    res.json({
      status: 'sukses',
      data: { ticket }
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

// === Create Ticket ===
// Fungsi: Membuat data tiket baru
// Method: POST
// Endpoint: /api/tickets
// Akses: Admin only
exports.createTicket = async (req, res) => {
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
    const { templeID, price, description } = req.body;

    // === Tahap 3: Buat Record Tiket ===
    const ticket = await Ticket.create({
      templeID,
      price,
      description
    });

    // === Tahap 4: Kirim Response ===
    res.status(201).json({
      status: 'sukses',
      message: 'Tiket berhasil dibuat',
      data: { ticket }
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

// === Update Ticket ===
// Fungsi: Memperbarui data tiket
// Method: PUT
// Endpoint: /api/tickets/:id
// Akses: Admin only
exports.updateTicket = async (req, res) => {
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

    // === Tahap 2: Validasi Keberadaan Tiket ===
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // === Tahap 3: Persiapkan Data Update ===
    const { templeID, price, description } = req.body;
    const updateData = {
      ...(templeID !== undefined && { templeID }),
      ...(price !== undefined && { price }),
      ...(description !== undefined && { description })
    };

    // === Tahap 4: Update Data Tiket ===
    await ticket.update(updateData);

    // === Tahap 5: Ambil Data Terbaru ===
    const updatedTicket = await Ticket.findByPk(req.params.id, {
      include: [{
        model: Temple,
        attributes: ['title', 'locationUrl']
      }]
    });

    // === Tahap 6: Kirim Response ===
    res.json({
      status: 'sukses',
      message: 'Tiket berhasil diperbarui',
      data: { ticket: updatedTicket }
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

// === Delete Ticket ===
// Fungsi: Menghapus data tiket
// Method: DELETE
// Endpoint: /api/tickets/:id
// Akses: Admin only
exports.deleteTicket = async (req, res) => {
  try {
    // === Tahap 1: Validasi Keberadaan Tiket ===
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        status: 'error',
        message: 'Tiket tidak ditemukan'
      });
    }

    // === Tahap 2: Hapus Tiket ===
    await ticket.destroy();

    // === Tahap 3: Kirim Response ===
    res.json({
      status: 'sukses',
      message: 'Tiket berhasil dihapus'
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