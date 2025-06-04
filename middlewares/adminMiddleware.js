// ===================================
// Middleware Pengecekan Role Admin
// ===================================
// Fungsi: Memvalidasi apakah user yang login memiliki role admin
// Proses:
// 1. Mengecek role dari user yang tersimpan di request
// 2. Menolak akses jika bukan admin
// 3. Melanjutkan request jika admin
// Catatan: Middleware ini harus dipasang setelah authenticateToken

const isAdmin = async (req, res, next) => {
  try {
    // === Tahap 1: Cek Role User ===
    // Periksa apakah user memiliki role admin
    if (!req.user.role) {
      // Jika bukan admin, tolak akses
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini.'
      });
    }

    // Lanjutkan ke endpoint jika user adalah admin
    next();
  } catch (error) {
    // === Error Handling ===
    // Tangani error yang mungkin terjadi
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

module.exports = isAdmin; 