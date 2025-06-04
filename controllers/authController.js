// ===================================
// Controller Autentikasi
// ===================================
// Fungsi: Menangani operasi terkait autentikasi user
// Fitur:
// 1. Register user baru
// 2. Login user
// 3. Mendapatkan profil user
// 4. Update profil user
// 5. Hapus akun user

// Import library dan model yang dibutuhkan
const jwt = require('jsonwebtoken');              // Library untuk generate token JWT
const { User } = require('../models');            // Model User dari database
const { validationResult } = require('express-validator');  // Validasi input
const bcrypt = require('bcrypt');                 // Library untuk hashing password
const { deleteFileFromGCS, getFilename } = require('../middlewares/uploadMiddleware');  // Upload handler

// === Register User ===
// Fungsi: Mendaftarkan user baru ke sistem
// Method: POST
// Endpoint: /api/auth/register
exports.register = async (req, res) => {
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
    const { username, email, password } = req.body;

    // === Tahap 3: Cek Email Duplikat ===
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar'
      });
    }

    // === Tahap 4: Buat User Baru ===
    // Password akan di-hash otomatis oleh hook di model User
    const user = await User.create({
      username,
      email,
      password,
      profilePicture: 'https://storage.googleapis.com/' + process.env.GOOGLE_CLOUD_STORAGE_BUCKET + '/assets/profilepicture/pp-default.jpg'
    });

    // === Tahap 5: Generate Token JWT ===
    const token = jwt.sign(
      { id: user.userID, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // === Tahap 6: Kirim Response ===
    res.status(201).json({
      status: 'sukses',
      message: 'Pengguna berhasil didaftarkan',
      data: {
        user: {
          id: user.userID,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.created_at
        },
        token
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

// === Login User ===
// Fungsi: Melakukan autentikasi user
// Method: POST
// Endpoint: /api/auth/login
exports.login = async (req, res) => {
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
    const { email, password } = req.body;

    // === Tahap 3: Cek User Exists ===
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password tidak valid'
      });
    }

    // === Tahap 4: Validasi Password ===
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password tidak valid'
      });
    }

    // === Tahap 5: Generate Token JWT ===
    const token = jwt.sign(
      { id: user.userID, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // === Tahap 6: Kirim Response ===
    res.json({
      status: 'sukses',
      message: 'Login berhasil',
      data: {
        user: {
          id: user.userID,
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture,
          role: user.role
        },
        token
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

// === Get Profile ===
// Fungsi: Mengambil data profil user
// Method: GET
// Endpoint: /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    // === Tahap 1: Ambil Data User ===
    const user = await User.findByPk(req.user.userID, {
      attributes: ['userID', 'username', 'email', 'profilePicture', 'role', 'created_at', 'updated_at']
    });

    // === Tahap 2: Validasi User Exists ===
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // === Tahap 3: Kirim Response ===
    res.json({
      status: 'sukses',
      data: {
        user
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

// === Update Profile ===
// Fungsi: Memperbarui data profil user
// Method: PUT
// Endpoint: /api/auth/profile
exports.updateProfile = async (req, res) => {
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
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.userID;
    const profilePicture = req.file?.cloudStoragePublicUrl;

    // === Tahap 3: Validasi User Exists ===
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengguna tidak ditemukan'
      });
    }

    // === Tahap 4: Update Password (Jika Ada) ===
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

    // === Tahap 5: Update Email (Jika Ada) ===
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

    // === Tahap 6: Update Data Lainnya ===
    if (username) user.username = username;
    if (profilePicture) user.profilePicture = profilePicture;
    user.updated_at = new Date();

    await user.save();

    // === Tahap 7: Kirim Response ===
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
    // === Error Handling ===
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