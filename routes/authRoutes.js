const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, updateProfileValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const { uploadConfig, uploadToGCS } = require('../middlewares/uploadMiddleware');

// === Route yang bisa diakses tanpa login (public) ===
// Route untuk mendaftar akun baru
// POST /api/auth/register
router.post('/register', registerValidation, authController.register);

// Route untuk login
// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// === Route yang membutuhkan login (protected) ===
// Ambil data profil user yang sedang login
// GET /api/auth/profile
router.get('/profile', authenticateToken, authController.getProfile);

// Update profil user
// PUT /api/auth/profile
// Urutan middleware: 
// 1. Cek token
// 2. Validasi input
// 3. Proses upload foto
// 4. Upload ke Google Cloud
// 5. Update data di database
router.put('/profile',
  authenticateToken,
  updateProfileValidation,
  uploadConfig.profilePicture,
  uploadToGCS('profilePicture'),
  authController.updateProfile
);

// Hapus akun user
// DELETE /api/auth/profile
router.delete('/profile', authenticateToken, authController.deleteUser);

module.exports = router;
