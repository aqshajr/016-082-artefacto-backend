// ===================================
// Middleware Autentikasi dengan JWT
// ===================================
// Fungsi: Memvalidasi JWT token untuk mengamankan endpoint
// Proses:
// 1. Mengecek keberadaan token di header
// 2. Memverifikasi token dengan JWT
// 3. Memvalidasi user di database
// 4. Menyimpan data user ke request

// Import library dan model yang dibutuhkan
const jwt = require('jsonwebtoken');        // Library untuk handle JWT
const { User } = require('../models');      // Model User dari database

const authenticateToken = async (req, res, next) => {
  try {
    // === Tahap 1: Validasi Header ===
    // Cek apakah ada header Authorization dengan format "Bearer [token]"
    const authHeader = req.headers.authorization;

    // === Tahap 2: Ekstrak Token ===
    // Ambil token dari header (format: "Bearer [token]")
    const token = authHeader && authHeader.split(' ')[1];

    // Jika token tidak ada, kirim response error
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token akses tidak ditemukan'
      });
    }

    // === Tahap 3: Verifikasi Token ===
    // Verifikasi token menggunakan JWT_SECRET dari environment
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // === Tahap 4: Validasi User ===
    // Cek apakah user masih ada di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // === Tahap 5: Simpan Data User ===
    // Simpan data user ke object request untuk digunakan di endpoint
    req.user = user;
    next();

  } catch (error) {
    // === Error Handling ===
    // 1. Token Kadaluarsa
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token telah kadaluarsa'
      });
    }

    // 2. Token Tidak Valid (format salah atau signature tidak sesuai)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token tidak valid'
      });
    }

    // 3. Error Server Lainnya
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

module.exports = authenticateToken;
