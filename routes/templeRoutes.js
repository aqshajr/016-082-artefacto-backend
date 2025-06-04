const express = require('express');
const router = express.Router();
const templeController = require('../controllers/templeController');
const { templeValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');
const { uploadConfig, uploadToGCS } = require('../middlewares/uploadMiddleware');

// Semua endpoint di route ini memerlukan login (autentikasi)
router.use(authenticateToken);

// === Route untuk user yang sudah login ===
// Mendapatkan daftar semua candi
// GET /api/temples
router.get('/', templeController.getAllTemples);

// Mendapatkan detail satu candi berdasarkan ID
// GET /api/temples/:id
router.get('/:id', idParamValidation, templeController.getTempleById);

// === Route khusus admin ===
// Menambah data candi baru
// POST /api/temples
// Urutan middleware: 
// 1. Cek role admin
// 2. Setup upload gambar
// 3. Validasi data candi
// 4. Simpan ke database
router.post('/',
  isAdmin,
  uploadConfig.templeImage,
  templeValidation,
  templeController.createTemple
);

// Mengupdate data candi yang ada
// PUT /api/temples/:id
// Urutan middleware:
// 1. Cek role admin
// 2. Setup upload gambar
// 3. Upload ke Google Cloud
// 4. Validasi ID
// 5. Validasi data candi
// 6. Update di database
router.put('/:id',
  isAdmin,
  uploadConfig.templeImage,
  uploadToGCS('temple'),
  idParamValidation,
  templeValidation,
  templeController.updateTemple
);

// Menghapus data candi
// DELETE /api/temples/:id
// Urutan middleware:
// 1. Cek role admin
// 2. Validasi ID
// 3. Hapus dari database
router.delete('/:id',
  isAdmin,
  idParamValidation,
  templeController.deleteTemple
);

module.exports = router;
