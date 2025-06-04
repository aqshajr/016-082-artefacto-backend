// ===================================
// Middleware Validasi Input
// ===================================
// Fungsi: Memvalidasi input dari request sebelum diproses
// Menggunakan express-validator untuk:
// 1. Validasi body request
// 2. Validasi parameter URL
// 3. Validasi query string
// 4. Custom validasi dengan database

const { body, param, query } = require('express-validator');  // Library untuk validasi
const { Temple, Ticket } = require('../models');             // Model untuk validasi foreign key

// === Validasi Autentikasi ===
// Validasi input registrasi user baru
exports.registerValidation = [
  body('username')
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email')
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
  body('password')
    .notEmpty().withMessage('Password wajib diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
  body('passwordConfirmation')
    .notEmpty().withMessage('Konfirmasi password wajib diisi')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Konfirmasi password tidak cocok dengan password');
      }
      return true;
    })
];

// Validasi input login
exports.loginValidation = [
  body('email')
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
  body('password')
    .notEmpty().withMessage('Password wajib diisi')
];

// === Validasi Data Candi ===
// Validasi input data candi baru/update
exports.templeValidation = [
  body('title')
    .notEmpty().withMessage('Judul candi wajib diisi')
    .isLength({ min: 3 }).withMessage('Judul minimal 3 karakter'),
  body('description')
    .notEmpty().withMessage('Deskripsi candi wajib diisi')
    .isLength({ min: 10 }).withMessage('Deskripsi minimal 10 karakter'),
  body('funfactTitle')
    .notEmpty().withMessage('Judul funfact wajib diisi')
    .isLength({ min: 3 }).withMessage('Judul funfact minimal 3 karakter'),
  body('funfactDescription')
    .notEmpty().withMessage('Deskripsi funfact wajib diisi')
    .isLength({ min: 10 }).withMessage('Deskripsi funfact minimal 10 karakter'),
  body('locationUrl')
    .notEmpty().withMessage('URL lokasi wajib diisi')
    .isURL().withMessage('Format URL lokasi tidak valid')
    .isLength({ max: 500 }).withMessage('URL lokasi maksimal 500 karakter')
];

// === Validasi Data Artefak ===
// Validasi input artefak baru
exports.artifactValidation = [
  // Validasi foreign key ke candi
  body('templeID')
    .notEmpty().withMessage('ID Candi wajib diisi')
    .isInt().withMessage('ID Candi harus berupa angka')
    .custom(async (value) => {
      const temple = await Temple.findByPk(value);
      if (!temple) {
        throw new Error('Candi tidak ditemukan');
      }
      return true;
    }),
  // Validasi data utama artefak
  body('title')
    .notEmpty().withMessage('Judul artefak wajib diisi')
    .isLength({ min: 3 }).withMessage('Judul minimal 3 karakter'),
  body('description')
    .notEmpty().withMessage('Deskripsi artefak wajib diisi')
    .isLength({ min: 10 }).withMessage('Deskripsi minimal 10 karakter'),
  // Validasi detail artefak
  body('detailPeriod')
    .notEmpty().withMessage('Detail periode wajib diisi'),
  body('detailMaterial')
    .notEmpty().withMessage('Detail material wajib diisi'),
  body('detailSize')
    .notEmpty().withMessage('Detail ukuran wajib diisi'),
  body('detailStyle')
    .notEmpty().withMessage('Detail gaya wajib diisi'),
  // Validasi funfact
  body('funfactTitle')
    .notEmpty().withMessage('Judul funfact wajib diisi')
    .isLength({ min: 3 }).withMessage('Judul funfact minimal 3 karakter'),
  body('funfactDescription')
    .notEmpty().withMessage('Deskripsi funfact wajib diisi')
    .isLength({ min: 10 }).withMessage('Deskripsi funfact minimal 10 karakter'),
  // Validasi lokasi
  body('locationUrl')
    .notEmpty().withMessage('URL lokasi wajib diisi')
    .isURL().withMessage('Format URL lokasi tidak valid')
    .isLength({ max: 500 }).withMessage('URL lokasi maksimal 500 karakter')
];

// Validasi update artefak (semua field optional)
exports.updateArtifactValidation = [
  body('title')
    .optional()
    .notEmpty().withMessage('Judul artefak tidak boleh kosong')
    .isLength({ min: 3 }).withMessage('Judul minimal 3 karakter'),
  body('description')
    .optional()
    .notEmpty().withMessage('Deskripsi artefak tidak boleh kosong')
    .isLength({ min: 10 }).withMessage('Deskripsi minimal 10 karakter'),
  body('detailPeriod')
    .optional()
    .notEmpty().withMessage('Detail periode tidak boleh kosong'),
  body('detailMaterial')
    .optional()
    .notEmpty().withMessage('Detail material tidak boleh kosong'),
  body('detailSize')
    .optional()
    .notEmpty().withMessage('Detail ukuran tidak boleh kosong'),
  body('detailStyle')
    .optional()
    .notEmpty().withMessage('Detail gaya tidak boleh kosong'),
  body('funfactTitle')
    .optional()
    .notEmpty().withMessage('Judul funfact tidak boleh kosong')
    .isLength({ min: 3 }).withMessage('Judul funfact minimal 3 karakter'),
  body('funfactDescription')
    .optional()
    .notEmpty().withMessage('Deskripsi funfact tidak boleh kosong')
    .isLength({ min: 10 }).withMessage('Deskripsi funfact minimal 10 karakter'),
  body('locationUrl')
    .optional()
    .notEmpty().withMessage('URL lokasi tidak boleh kosong')
    .isURL().withMessage('Format URL lokasi tidak valid')
    .isLength({ max: 500 }).withMessage('URL lokasi maksimal 500 karakter')
];

// === Validasi Data Tiket ===
// Validasi input tiket baru
exports.ticketValidation = [
  // Validasi foreign key ke candi
  body('templeID')
    .notEmpty().withMessage('ID candi wajib diisi')
    .isInt().withMessage('ID candi harus berupa angka')
    .custom(async (value) => {
      const temple = await Temple.findByPk(value);
      if (!temple) {
        throw new Error('Candi tidak ditemukan');
      }
      return true;
    }),
  // Validasi harga dan deskripsi
  body('price')
    .notEmpty().withMessage('Harga tiket wajib diisi')
    .isFloat({ min: 0 }).withMessage('Harga tiket harus berupa angka positif'),
  body('description')
    .notEmpty().withMessage('Deskripsi tiket wajib diisi')
    .isLength({ min: 10 }).withMessage('Deskripsi minimal 10 karakter')
];

// Validasi update tiket (semua field optional)
exports.updateTicketValidation = [
  body('templeID')
    .optional()
    .isInt().withMessage('ID candi harus berupa angka')
    .custom(async (value) => {
      const temple = await Temple.findByPk(value);
      if (!temple) {
        throw new Error('Candi tidak ditemukan');
      }
      return true;
    }),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Harga tiket harus berupa angka positif'),
  body('description')
    .optional()
    .isLength({ min: 10 }).withMessage('Deskripsi minimal 10 karakter')
];

// === Validasi Transaksi ===
// Validasi pembuatan transaksi baru
exports.transactionValidation = [
  // Validasi tiket yang dibeli
  body('ticketID')
    .notEmpty().withMessage('ID Tiket wajib diisi')
    .isInt().withMessage('ID Tiket harus berupa angka')
    .custom(async (value) => {
      const ticket = await Ticket.findByPk(value);
      if (!ticket) {
        throw new Error('Tiket tidak ditemukan');
      }
      return true;
    }),
  // Validasi tanggal penggunaan
  body('validDate')
    .notEmpty().withMessage('Tanggal berlaku wajib diisi')
    .isISO8601().withMessage('Format tanggal tidak valid')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      // Set waktu ke awal hari untuk perbandingan tanggal saja
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const ticketDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (ticketDate < today) {
        throw new Error('Tanggal berlaku tidak boleh di masa lalu');
      }
      return true;
    }),
  // Validasi jumlah tiket
  body('ticketQuantity')
    .notEmpty().withMessage('Jumlah tiket wajib diisi')
    .isInt({ min: 1 }).withMessage('Jumlah tiket minimal 1')
];

// === Validasi Parameter dan Query ===
// Validasi parameter ID di URL
exports.idParamValidation = [
  param('id')
    .isInt().withMessage('ID harus berupa angka')
];

// Validasi parameter paginasi
exports.paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Halaman harus berupa angka positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Batas harus antara 1 dan 100')
];

// === Validasi Update Profil ===
// Validasi data update profil user
exports.updateProfileValidation = [
  // Data profil
  body('username')
    .optional()
    .notEmpty().withMessage('Username wajib diisi')
    .isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('email')
    .optional()
    .notEmpty().withMessage('Email wajib diisi')
    .isEmail().withMessage('Format email tidak valid'),
  // Validasi password
  body('currentPassword')
    .optional()
    .notEmpty().withMessage('Password saat ini wajib diisi'),
  body('newPassword')
    .optional()
    .notEmpty().withMessage('Password baru wajib diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter'),
  body('confirmNewPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Konfirmasi password baru tidak cocok');
      }
      return true;
    })
];

// === Validasi Tiket yang Dimiliki ===
// Validasi pembuatan record tiket yang dimiliki
exports.ownedTicketValidation = [
  // Validasi tiket yang dibeli
  body('ticketID')
    .notEmpty().withMessage('ID Tiket wajib diisi')
    .isInt().withMessage('ID Tiket harus berupa angka')
    .custom(async (value) => {
      const ticket = await Ticket.findByPk(value);
      if (!ticket) {
        throw new Error('Tiket tidak ditemukan');
      }
      return true;
    }),
  body('transactionID')
    .notEmpty().withMessage('ID Transaksi wajib diisi')
    .isInt().withMessage('ID Transaksi harus berupa angka')
    .custom(async (value) => {
      const { Transaction } = require('../models');
      const transaction = await Transaction.findByPk(value);
      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }
      return true;
    })
]; 