// ===================================
// Controller Candi/Temple
// ===================================
// Fungsi: Menangani operasi terkait data candi/temple
// Fitur:
// 1. Mendapatkan semua data candi
// 2. Mendapatkan detail candi
// 3. Membuat candi baru (admin)
// 4. Memperbarui data candi (admin)
// 5. Menghapus candi (admin)

// Import library dan model yang dibutuhkan
const { Temple } = require('../models');                    // Model Temple dari database
const { validationResult } = require('express-validator');  // Validasi input
const { 
  getFilename,                                             // Generate nama file
  bucket,                                                  // Instance bucket GCS
  deleteFileFromGCS,                                       // Hapus file dari GCS
  getDefaultImageUrl                                       // URL gambar default
} = require('../middlewares/uploadMiddleware');            // Upload handler

// === Get All Temples ===
// Fungsi: Mendapatkan daftar semua candi
// Method: GET
// Endpoint: /api/temples
// Akses: Public
exports.getAllTemples = async (req, res) => {
  try {
    // === Tahap 1: Ambil Data Candi ===
    const temples = await Temple.findAll({
      order: [['created_at', 'DESC']]
    });
    
    // === Tahap 2: Set Default Image ===
    // Pastikan setiap candi memiliki gambar default jika tidak ada
    const templesWithPlaceholder = temples.map(temple => {
      const templeData = temple.toJSON();
      if (!templeData.imageUrl) {
        templeData.imageUrl = getDefaultImageUrl();
      }
      return templeData;
    });
    
    // === Tahap 3: Kirim Response ===
    res.json({
      status: 'sukses',
      data: {
        temples: templesWithPlaceholder
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

// === Get Temple By ID ===
// Fungsi: Mendapatkan detail satu candi
// Method: GET
// Endpoint: /api/temples/:id
// Akses: Public
exports.getTempleById = async (req, res) => {
  try {
    // === Tahap 1: Ambil Data Candi ===
    const { id } = req.params;
    const temple = await Temple.findByPk(id);

    // === Tahap 2: Validasi Keberadaan Candi ===
    if (!temple) {
      return res.status(404).json({
        status: 'error',
        message: 'Candi tidak ditemukan'
      });
    }

    // === Tahap 3: Set Default Image ===
    const templeData = temple.toJSON();
    if (!templeData.imageUrl) {
      templeData.imageUrl = getDefaultImageUrl();
    }

    // === Tahap 4: Kirim Response ===
    res.json({
      status: 'sukses',
      data: {
        temple: templeData
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

// === Create Temple ===
// Fungsi: Membuat data candi baru
// Method: POST
// Endpoint: /api/temples
// Akses: Admin only
exports.createTemple = async (req, res) => {
  try {
    // === Tahap 1: Debug Info ===
    console.log('=== CreateTemple Debug ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'No buffer'
    } : 'No file received');
    console.log('Environment check:');
    console.log('- GOOGLE_CLOUD_PROJECT:', process.env.GOOGLE_CLOUD_PROJECT ? 'Set' : 'Missing');
    console.log('- GOOGLE_CLOUD_STORAGE_BUCKET:', process.env.GOOGLE_CLOUD_STORAGE_BUCKET ? 'Set' : 'Missing');
    console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'Set' : 'Missing');
    console.log('=== End Debug ===');

    // === Tahap 2: Validasi Input ===
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    // === Tahap 3: Ambil Data Input ===
    const { 
      title, 
      description, 
      funfactTitle, 
      funfactDescription, 
      locationUrl 
    } = req.body;

    // === Tahap 4: Buat Record Candi ===
    const temple = await Temple.create({
      title,
      description,
      imageUrl: null, // Model getter akan handle placeholder
      funfactTitle,
      funfactDescription,
      locationUrl
    });

    console.log('Temple created with ID:', temple.templeID);

    // === Tahap 5: Upload Gambar (Jika Ada) ===
    if (req.file) {
      console.log('Processing image upload...');
      try {
        // Generate nama file
        const filename = getFilename('temple', temple.templeID);
        console.log('Generated filename:', filename);
        
        // Cek akses bucket
        console.log('Testing bucket access...');
        try {
          const bucketExists = await bucket.exists();
          console.log('Bucket exists:', bucketExists);
        } catch (bucketError) {
          console.error('Bucket access error:', bucketError);
          throw new Error('Cannot access Google Cloud Storage bucket');
        }
        
        // Setup upload stream
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
          resumable: false,
          gzip: true,
          metadata: {
            contentType: req.file.mimetype
          }
        });

        console.log('Starting upload stream...');

        // Upload file ke GCS
        await new Promise((resolve, reject) => {
          blobStream.on('error', (err) => {
            console.error('GCS Upload Error:', err);
            console.error('Error details:', {
              message: err.message,
              code: err.code,
              stack: err.stack
            });
            reject(new Error('Gagal mengupload gambar: ' + err.message));
          });

          blobStream.on('finish', () => {
            console.log('Upload to GCS completed successfully');
            resolve();
          });

          console.log('Writing file buffer to stream...');
          blobStream.end(req.file.buffer);
        });

        // Update URL gambar di database
        const imageUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
        console.log('Updating temple with imageUrl:', imageUrl);
        
        await temple.update({ imageUrl });
        console.log('Temple updated successfully with imageUrl');

        // Refresh data
        await temple.reload();
        console.log('Temple after reload:', temple.toJSON());

      } catch (error) {
        // Handle error upload
        console.error('Image upload failed:', error);
        console.error('Error stack:', error.stack);
        
        // Hapus record jika upload gagal
        console.log('Deleting temple due to upload failure...');
        await temple.destroy();
        
        return res.status(500).json({
          status: 'error',
          message: 'Gagal mengupload gambar: ' + error.message
        });
      }
    } else {
      console.log('No file uploaded, using default placeholder image');
    }

    // === Tahap 6: Kirim Response ===
    const responseTemple = temple.toJSON();
    if (!responseTemple.imageUrl) {
      responseTemple.imageUrl = getDefaultImageUrl();
    }
    
    res.status(201).json({
      status: 'sukses',
      message: 'Candi berhasil dibuat',
      data: {
        temple: responseTemple
      }
    });

  } catch (error) {
    // === Error Handling ===
    console.error('CreateTemple Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan pada server'
    });
  }
};

// === Update Temple ===
// Fungsi: Memperbarui data candi
// Method: PUT
// Endpoint: /api/temples/:id
// Akses: Admin only
exports.updateTemple = async (req, res) => {
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
    const { id } = req.params;
    const { 
      title, 
      description, 
      funfactTitle, 
      funfactDescription, 
      locationUrl 
    } = req.body;

    // === Tahap 3: Validasi Keberadaan Candi ===
    const temple = await Temple.findByPk(id);
    if (!temple) {
      return res.status(404).json({
        status: 'error',
        message: 'Candi tidak ditemukan'
      });
    }

    // Dapatkan URL gambar baru jika ada upload
    const imageUrl = req.file?.cloudStoragePublicUrl;

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl }),
      ...(funfactTitle && { funfactTitle }),
      ...(funfactDescription && { funfactDescription }),
      ...(locationUrl && { locationUrl }),
      updated_at: new Date()
    };

    await temple.update(updateData);

    // Pastikan imageUrl menggunakan placeholder jika null
    const responseTemple = temple.toJSON();
    if (!responseTemple.imageUrl) {
      responseTemple.imageUrl = getDefaultImageUrl();
    }

    res.json({
      status: 'sukses',
      message: 'Candi berhasil diperbarui',
      data: {
        temple: responseTemple
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

// DELETE - Menghapus candi (admin)
exports.deleteTemple = async (req, res) => {
  try {
    const { id } = req.params;
    const temple = await Temple.findByPk(id);

    if (!temple) {
      return res.status(404).json({
        status: 'error',
        message: 'Candi tidak ditemukan'
      });
    }

    // Hapus gambar candi dari GCS jika ada
    if (temple.imageUrl) {
      const filename = getFilename('temple', id);
      await deleteFileFromGCS(filename);
    }

    await temple.destroy();

    res.json({
      status: 'sukses',
      message: 'Candi berhasil dihapus'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};