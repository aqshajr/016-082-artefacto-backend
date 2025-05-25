//authController.js: Untuk mengontrol autentikasi pengguna

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { deleteFileFromGCS, getFilename } = require('../middlewares/uploadMiddleware');

//register: Untuk mendaftarkan pengguna baru ================================================
exports.register = async (req, res) => {
  try {
    //validasi input dari middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    //ambil data dari input
    const { username, email, password } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar'
      });
    }

    // Buat pengguna baru dan hash password
    const user = await User.create({
      username,
      email,
      password,
      profilePicture: 'https://storage.googleapis.com/' + process.env.GOOGLE_CLOUD_STORAGE_BUCKET + '/assets/profilepicture/pp-default.jpg'
    });

    // Generate token JWT
    const token = jwt.sign(
      { id: user.userID, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    //kirim response
    res.status(201).json({
      status: 'sukses',
      message: 'Pengguna berhasil didaftarkan',
      data: {
        user: {
          id: user.userID,
          username: user.username,
          email: user.email,
          createdAt: user.created_at
        },
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

//login: Untuk login pengguna ==================================================================
exports.login = async (req, res) => {
  try {
    //validasi input dari middleware
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    //ambil data dari input
    const { email, password } = req.body;

    // Cari pengguna berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password tidak valid'
      });
    }

    // Verifikasi password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password tidak valid'
      });
    }

    // Generate token JWT
    const token = jwt.sign(
      { id: user.userID, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    //kirim response
    res.json({
      status: 'sukses',
      message: 'Login berhasil',
      data: {
        user: {
          id: user.userID,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture
        },
        token
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

//getProfile: Untuk mengambil profil pengguna ================================================
exports.getProfile = async (req, res) => {
  try {
    //ambil data dari input
    const user = await User.findByPk(req.user.userID, {
      attributes: ['userID', 'username', 'email', 'profilePicture', 'created_at', 'updated_at']
    });

    //kirim response
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    //kirim response
    res.json({
      status: 'sukses',
      data: {
        user
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

//updateProfile: Untuk memperbarui profil pengguna ==========================================       
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.userID;
    const profilePicture = req.file?.cloudStoragePublicUrl;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Jika ada perubahan password
    if (currentPassword && newPassword) {
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Password saat ini tidak valid'
        });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashedPassword;
    }

    // Jika ada perubahan email, cek duplikat
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email sudah terdaftar'
        });
      }
      user.email = email;
    }

    // Update data lainnya
    if (username) user.username = username;
    if (profilePicture) user.profilePicture = profilePicture;
    user.updated_at = new Date();

    await user.save();

    res.json({
      status: 'sukses',
      message: 'Profil berhasil diperbarui',
      data: {
        user: {
          id: user.userID,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

//deleteUser: Untuk menghapus akun pengguna ================================================
exports.deleteUser = async (req, res) => {
  try {
    const userID = req.user.userID;
    const user = await User.findByPk(userID);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Hapus foto profil dari GCS jika ada
    if (user.profilePicture) {
      const filename = getFilename('profilePicture', userID);
      await deleteFileFromGCS(filename);
    }

    await user.destroy();

    res.json({
      status: 'sukses',
      message: 'Akun berhasil dihapus'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};