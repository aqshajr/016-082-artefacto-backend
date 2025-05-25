/**
 * Middleware untuk memvalidasi JWT token pada rute protected.
 * - Cek keberadaan & format token
 * - Verifikasi validitas & expiry token
 * - Validasi user di database
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    // 1. Cek keberadaan dan format header
    const authHeader = req.headers.authorization;

    // 2. Ekstrak token
    const token = authHeader && authHeader.split(' ')[1];

    // 3. Jika token tidak ditemukan
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token akses tidak ditemukan'
      });
    }

    // 4. Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Cek user di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // 6. Simpan user ke request
    req.user = user;
    next();
  } catch (error) {
    // error handling jika token kadaluarsa
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token telah kadaluarsa'
      });
    }

    // error handling jika token tidak valid
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token tidak valid'
      });
    }

    // error handling jika terjadi kesalahan
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

module.exports = authenticateToken;
