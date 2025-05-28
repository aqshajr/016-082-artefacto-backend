const { Temple } = require('../models');
const { validationResult } = require('express-validator');
const { getFilename, bucket, deleteFileFromGCS, getDefaultImageUrl } = require('../middlewares/uploadMiddleware');

// GET - Mendapatkan semua candi (publik)
exports.getAllTemples = async (req, res) => {
  try {
    const temples = await Temple.findAll({
      order: [['created_at', 'DESC']]
    });
    
    // Pastikan setiap temple menggunakan placeholder jika imageUrl null
    const templesWithPlaceholder = temples.map(temple => {
      const templeData = temple.toJSON();
      if (!templeData.imageUrl) {
        templeData.imageUrl = getDefaultImageUrl();
      }
      return templeData;
    });
    
    res.json({
      status: 'sukses',
      data: {
        temples: templesWithPlaceholder
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

// GET - Mendapatkan detail candi (publik)
exports.getTempleById = async (req, res) => {
  try {
    const { id } = req.params;
    const temple = await Temple.findByPk(id);

    if (!temple) {
      return res.status(404).json({
        status: 'error',
        message: 'Candi tidak ditemukan'
      });
    }

    // Pastikan imageUrl menggunakan placeholder jika null
    const templeData = temple.toJSON();
    if (!templeData.imageUrl) {
      templeData.imageUrl = getDefaultImageUrl();
    }

    res.json({
      status: 'sukses',
      data: {
        temple: templeData
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

// POST - Membuat candi baru (admin)
exports.createTemple = async (req, res) => {
  try {
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

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const { 
      title, 
      description, 
      funfactTitle, 
      funfactDescription, 
      locationUrl 
    } = req.body;

    // STEP 1: Buat temple record dulu, model akan handle default placeholder image
    const temple = await Temple.create({
      title,
      description,
      imageUrl: null, // Model getter akan handle placeholder
      funfactTitle,
      funfactDescription,
      locationUrl
    });

    console.log('Temple created with ID:', temple.templeID);

    // STEP 2: Upload gambar jika ada (sekarang sudah punya ID)
    if (req.file) {
      console.log('Processing image upload...');
      try {
        // Sekarang kita sudah punya temple.templeID yang valid!
        const filename = getFilename('temple', temple.templeID);
        console.log('Generated filename:', filename);
        
        // Check if bucket is accessible
        console.log('Testing bucket access...');
        try {
          const bucketExists = await bucket.exists();
          console.log('Bucket exists:', bucketExists);
        } catch (bucketError) {
          console.error('Bucket access error:', bucketError);
          throw new Error('Cannot access Google Cloud Storage bucket');
        }
        
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
          resumable: false,
          gzip: true,
          metadata: {
            contentType: req.file.mimetype
          }
        });

        console.log('Starting upload stream...');

        // Upload file to GCS
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

        // STEP 3: Update temple record dengan imageUrl yang baru diupload
        const imageUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
        console.log('Updating temple with imageUrl:', imageUrl);
        
        await temple.update({ imageUrl });
        console.log('Temple updated successfully with imageUrl');

        // Refresh temple data to get updated imageUrl
        await temple.reload();
        console.log('Temple after reload:', temple.toJSON());

      } catch (error) {
        console.error('Image upload failed:', error);
        console.error('Error stack:', error.stack);
        
        // Jika upload gagal, hapus temple yang sudah dibuat
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

    // STEP 4: Send response setelah semua selesai
    // Pastikan imageUrl menggunakan placeholder jika null
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
    console.error('CreateTemple Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan pada server'
    });
  }
};

// PUT - Memperbarui candi (admin)
exports.updateTemple = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Error validasi',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { 
      title, 
      description, 
      funfactTitle, 
      funfactDescription, 
      locationUrl 
    } = req.body;

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