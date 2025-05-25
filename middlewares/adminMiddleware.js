const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini.'
      });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

module.exports = isAdmin; 