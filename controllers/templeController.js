const { Temple } = require('../models');
const { validationResult } = require('express-validator');
const { deleteFileFromGCS, getFilename, bucket } = require('../middlewares/uploadMiddleware');

// GET - Mendapatkan semua candi (publik)
exports.getAllTemples = async (req, res) => {
  try {
    const temples = await Temple.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json({
      status: 'sukses',
      data: {
        temples
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

    res.json({
      status: 'sukses',
      data: {
        temple
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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

    // Buat temple dulu tanpa imageUrl
    const temple = await Temple.create({
      title,
      description,
      imageUrl: null, // Set null dulu
      funfactTitle,
      funfactDescription,
      locationUrl
    });

    // Setelah temple dibuat dan punya ID, baru handle upload gambar
    if (req.file) {
      try {
        const filename = getFilename('temple', temple.templeID);
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
          resumable: false,
          gzip: true,
          metadata: {
            contentType: req.file.mimetype
          }
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', async (err) => {
            console.error(err);
            await temple.destroy();
            reject(new Error('Gagal mengupload gambar'));
          });

          blobStream.on('finish', async () => {
            const imageUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
            await temple.update({ imageUrl });
            resolve();
          });

          blobStream.end(req.file.buffer);
        });

        res.status(201).json({
          status: 'sukses',
          message: 'Candi berhasil dibuat',
          data: {
            temple
          }
        });
      } catch (error) {
        // Jika upload gagal, hapus temple yang sudah dibuat
        await temple.destroy();
        throw error;
      }
    } else {
      res.status(201).json({
        status: 'sukses',
        message: 'Candi berhasil dibuat',
        data: {
          temple
        }
      });
    }
  } catch (error) {
    console.error(error);
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

    res.json({
      status: 'sukses',
      message: 'Candi berhasil diperbarui',
      data: {
        temple
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