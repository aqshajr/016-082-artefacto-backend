// Import library dan middleware yang dibutuhkan
const express = require('express');
const router = express.Router();
const artifactController = require('../controllers/artifactController');  // Controller untuk logika artefak
const { artifactValidation, updateArtifactValidation, idParamValidation } = require('../middlewares/validationMiddleware');  // Validasi input dan parameter
const authenticateToken = require('../middlewares/authMiddleware');  // Middleware untuk cek token JWT
const isAdmin = require('../middlewares/adminMiddleware');  // Middleware untuk cek role admin
const { uploadConfig, uploadToGCS } = require('../middlewares/uploadMiddleware');  // Upload file

// Semua endpoint di route ini memerlukan login (autentikasi)
router.use(authenticateToken);

// === Route untuk user yang sudah login ===
// Mendapatkan daftar semua artefak
// GET /api/artifacts
router.get('/', artifactController.getAllArtifacts);

// Mendapatkan detail satu artefak berdasarkan ID
// GET /api/artifacts/:id
router.get('/:id', idParamValidation, artifactController.getArtifactById);

// Menandai artefak sebagai favorit/unfavorit
// POST /api/artifacts/:id/bookmark
// Memerlukan: ID artefak yang valid
router.post('/:id/bookmark', idParamValidation, artifactController.toggleBookmark);

// Menandai artefak sebagai sudah dibaca
// POST /api/artifacts/:id/read
// Memerlukan: ID artefak yang valid
router.post('/:id/read', idParamValidation, artifactController.markAsRead);

// === Route khusus admin ===
// Menambah data artefak baru
// POST /api/artifacts
// Urutan middleware:
// 1. Cek role admin
// 2. Setup upload gambar
// 3. Validasi data artefak
// 4. Simpan ke database
router.post('/',
  isAdmin,
  uploadConfig.artifactImage,
  artifactValidation,
  artifactController.createArtifact
);

// Mengupdate data artefak yang ada
// PUT /api/artifacts/:id
// Urutan middleware:
// 1. Cek role admin
// 2. Setup upload gambar
// 3. Validasi ID
// 4. Validasi data update artefak
// 5. Update di database
router.put('/:id',
  isAdmin,
  uploadConfig.artifactImage,
  idParamValidation,
  updateArtifactValidation,
  artifactController.updateArtifact
);

// Menghapus data artefak
// DELETE /api/artifacts/:id
// Urutan middleware:
// 1. Cek role admin
// 2. Validasi ID
// 3. Hapus dari database
router.delete('/:id',
  isAdmin,
  idParamValidation,
  artifactController.deleteArtifact
);

module.exports = router;
