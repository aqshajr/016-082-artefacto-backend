// ===================================
// Middleware Upload File ke Google Cloud Storage
// ===================================
// Fungsi: Menangani upload file (terutama gambar) ke Google Cloud Storage
// Fitur:
// 1. Validasi tipe file (hanya gambar)
// 2. Batasan ukuran (maksimal 5MB)
// 3. Upload ke Google Cloud Storage
// 4. Generate URL publik untuk akses file

// Import library yang dibutuhkan
const { Storage } = require('@google-cloud/storage');  // Library untuk Google Cloud Storage
const multer = require('multer');                      // Middleware untuk handle file upload
const path = require('path');                          // Untuk manipulasi path file

// === Tahap 1: Konfigurasi Google Cloud Storage ===
// Inisialisasi koneksi ke Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,  // File kredensial
  projectId: process.env.GOOGLE_CLOUD_PROJECT              // ID Project Google Cloud
});

// Pilih bucket yang akan digunakan
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

// === Tahap 2: Konfigurasi Multer ===
// Setup penyimpanan file sementara di memory
const multerStorage = multer.memoryStorage();

// Filter untuk memastikan hanya file gambar yang diterima
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('File bukan gambar! Silakan upload gambar.'), false);
  }
};

// Konfigurasi upload untuk berbagai jenis file
// Setiap konfigurasi:
// - Menggunakan memory storage
// - Memiliki filter tipe file
// - Batasan ukuran 5MB
const uploadConfig = {
  // Upload foto profil
  profilePicture: multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
  }).single('profilePicture'),
  
  // Upload foto candi
  templeImage: multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
  }).single('image'),
  
  // Upload foto artefak
  artifactImage: multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB
  }).single('image')
};

// === Tahap 3: Helper Functions ===
// Mendapatkan URL gambar default jika tidak ada upload
const getDefaultImageUrl = () => {
  return `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/assets/image-placeholder.jpg`;
};

// Menghapus file dari Google Cloud Storage
const deleteFileFromGCS = async (filename) => {
  try {
    await bucket.file(filename).delete();
    return true;
  } catch (error) {
    console.error('Error deleting file from GCS:', error);
    return false;
  }
};

// Generate nama file berdasarkan tipe dan ID
const getFilename = (type, id) => {
  const extension = '.jpg';
  switch (type) {
    case 'profilePicture':
      return `assets/profilepicture/pp-${id}${extension}`;
    case 'temple':
      return `assets/temples/temple-${id}${extension}`;
    case 'artifact':
      return `assets/artifacts/artifact-${id}${extension}`;
    default:
      throw new Error('Invalid file type');
  }
};

// === Tahap 4: Middleware Upload ke GCS ===
// Middleware utama untuk upload file ke Google Cloud Storage
const uploadToGCS = (type) => async (req, res, next) => {
  try {
    // Skip jika tidak ada file yang diupload
    if (!req.file) return next();

    // Tentukan ID berdasarkan tipe upload
    let id;
    switch (type) {
      case 'profilePicture':
        id = req.user.userID;
        break;
      case 'temple':
        // Untuk candi baru, kita akan menggunakan timestamp sebagai ID sementara
        id = req.params.id || Date.now();
        break;
      case 'artifact':
        // Untuk artefak baru, kita akan menggunakan timestamp sebagai ID sementara
        id = req.params.id || Date.now();
        break;
      default:
        throw new Error('Invalid upload type');
    }

    // Setup upload ke Google Cloud Storage
    const filename = getFilename(type, id);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
      metadata: {
        contentType: req.file.mimetype
      }
    });

    // Handle error saat upload
    blobStream.on('error', (err) => {
      console.error(err);
      next(new Error('Gagal mengupload gambar, terjadi kesalahan'));
    });

    // Setelah upload selesai
    blobStream.on('finish', () => {
      // Simpan informasi file ke request untuk digunakan controller
      req.file.cloudStorageObject = filename;
      req.file.cloudStoragePublicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
      next();
    });

    // Mulai upload
    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    next(new Error('Gagal mengupload gambar, terjadi kesalahan'));
  }
};

// Export semua fungsi yang dibutuhkan
module.exports = {
  uploadConfig,      // Konfigurasi upload untuk berbagai tipe file
  uploadToGCS,       // Middleware upload ke Google Cloud Storage
  deleteFileFromGCS, // Fungsi untuk menghapus file
  getFilename,       // Fungsi untuk generate nama file
  bucket,           // Instance bucket GCS
  getDefaultImageUrl // Fungsi untuk mendapatkan URL default
}; 