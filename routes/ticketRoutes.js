const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { ticketValidation, updateTicketValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');

// Semua endpoint di route ini memerlukan login (autentikasi)
router.use(authenticateToken);

// === Route untuk user yang sudah login ===
// Mendapatkan daftar semua tiket yang tersedia
// GET /api/tickets
router.get('/', ticketController.getAllTickets);

// Mendapatkan detail satu tiket berdasarkan ID
// GET /api/tickets/:id
router.get('/:id', idParamValidation, ticketController.getTicketById);

// === Route khusus admin ===
// Membuat jenis tiket baru
// POST /api/tickets
// Urutan middleware:
// 1. Cek role admin
// 2. Validasi data tiket
// 3. Simpan ke database
router.post('/',
  isAdmin,
  ticketValidation,
  ticketController.createTicket
);

// Mengupdate informasi tiket
// PUT /api/tickets/:id
// Urutan middleware:
// 1. Cek role admin
// 2. Validasi ID
// 3. Validasi data update
// 4. Update di database
router.put('/:id',
  isAdmin,
  idParamValidation,
  updateTicketValidation,
  ticketController.updateTicket
);

// Menghapus jenis tiket
// DELETE /api/tickets/:id
router.delete('/:id',
  isAdmin,
  idParamValidation,
  ticketController.deleteTicket
);

module.exports = router;
