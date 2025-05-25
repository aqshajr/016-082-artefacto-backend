/**
 * Konfigurasi untuk upload file ke Google Cloud Storage (GCS) menggunakan Multer.
 * - Handle proses upload gambar
 * - Validasi tipe dan ukuran file
 * - Simpan file ke GCS bucket dan generate URL publik
 */

const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');

/**
 * 1. Inisialisasi Google Cloud Storage
 * - Menggunakan credentials dari environment variable
 * - Membuat instance Storage untuk interaksi dengan GCS
 */
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

// Referensi ke bucket yang akan digunakan untuk menyimpan file
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

/**
 * 2. Konfigurasi Multer
 * - Menyimpan file di memory
 * - Filter untuk memastikan hanya gambar yang diupload
 * - Batasan ukuran file (5MB)
 */
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('File bukan gambar! Silakan upload gambar.'), false);
  }
};

// Konfigurasi upload untuk berbagai jenis file
const uploadConfig = {
  profilePicture: multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }).single('profilePicture'),
  
  templeImage: multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }).single('image'),
  
  artifactImage: multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
  }).single('image')
};

/**
 * Helper function untuk menghapus file dari GCS
 */
const deleteFileFromGCS = async (filename) => {
  try {
    await bucket.file(filename).delete();
    return true;
  } catch (error) {
    console.error('Error deleting file from GCS:', error);
    return false;
  }
};

/**
 * Helper function untuk mendapatkan nama file berdasarkan tipe
 */
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

/**
 * 3. Middleware uploadToGCS
 * - Mengupload file dari memory ke Google Cloud Storage
 * - Generate nama file sesuai dengan tipe dan ID
 * - Set metadata dan konfigurasi upload
 * - Generate URL publik setelah upload selesai
 */
const uploadToGCS = (type) => async (req, res, next) => {
  try {
    if (!req.file) return next();

    let id;
    switch (type) {
      case 'profilePicture':
        id = req.user.userID;
        break;
      case 'temple':
        // For new temples, we'll use a timestamp as temporary ID
        id = req.params.id || Date.now();
        break;
      case 'artifact':
        // For new artifacts, we'll use a timestamp as temporary ID
        id = req.params.id || Date.now();
        break;
      default:
        throw new Error('Invalid upload type');
    }

    const filename = getFilename(type, id);
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      gzip: true,
      metadata: {
        contentType: req.file.mimetype
      }
    });

    blobStream.on('error', (err) => {
      console.error(err);
      next(new Error('Gagal mengupload gambar, terjadi kesalahan'));
    });

    blobStream.on('finish', () => {
      req.file.cloudStorageObject = filename;
      req.file.cloudStoragePublicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
      next();
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    next(new Error('Gagal mengupload gambar, terjadi kesalahan'));
  }
};

module.exports = {
  uploadConfig,
  uploadToGCS,
  deleteFileFromGCS,
  getFilename,
  bucket
}; 