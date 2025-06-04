// ===================================
// Controller Artefak/Artifact
// ===================================
// Fungsi: Menangani operasi terkait data artefak
// Fitur:
// 1. Mendapatkan semua data artefak
// 2. Mendapatkan detail artefak
// 3. Membuat artefak baru (admin)
// 4. Memperbarui data artefak (admin)
// 5. Menghapus artefak (admin)
// 6. Menandai artefak sebagai dibookmark
// 7. Menandai artefak sebagai dibaca

// Import library dan model yang dibutuhkan
const { Artifact, Temple, Bookmark, Read } = require('../models');  // Model dari database
const { validationResult } = require('express-validator');         // Validasi input
const { 
  getFilename,                                                     // Generate nama file
  bucket,                                                         // Instance bucket GCS
  deleteFileFromGCS,                                              // Hapus file dari GCS
  getDefaultImageUrl                                              // URL gambar default
} = require('../middlewares/uploadMiddleware');                    // Upload handler

// === Get All Artifacts ===
// Fungsi: Mendapatkan daftar semua artefak
// Method: GET
// Endpoint: /api/artifacts
// Query Params:
// - templeId: Filter artefak berdasarkan candi (opsional)
// Akses: Public
exports.getAllArtifacts = async (req, res) => {
  try {
    // === Tahap 1: Ambil Parameter ===
    const { templeId } = req.query;
    const userId = req.user?.userID; // Optional: jika user login

    // === Tahap 2: Setup Query ===
    const whereClause = templeId ? { templeID: templeId } : {};

    // === Tahap 3: Ambil Data Artefak ===
    const artifacts = await Artifact.findAll({
      where: whereClause,
      include: [
        {
          model: Temple,
          attributes: ['title']
        },
        ...(userId ? [
          {
            model: Bookmark,
            where: { userID: userId },
            required: false,
            attributes: ['isBookmark']
          },
          {
            model: Read,
            where: { userID: userId },
            required: false,
            attributes: ['isRead']
          }
        ] : [])
      ],
      order: [['created_at', 'DESC']]
    });

    // === Tahap 4: Format Response ===
    // Set gambar default dan status bookmark/read
    const artifactsWithPlaceholder = artifacts.map(artifact => {
      const artifactData = {
        ...artifact.toJSON(),
        isBookmarked: artifact.Bookmarks?.[0]?.isBookmark || false,
        isRead: artifact.Reads?.[0]?.isRead || false
      };
      
      if (!artifactData.imageUrl) {
        artifactData.imageUrl = getDefaultImageUrl();
      }
      
      return artifactData;
    });

    // === Tahap 5: Kirim Response ===
    res.json({
      status: 'sukses',
      data: {
        artifacts: artifactsWithPlaceholder
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

// === Get Artifact By ID ===
// Fungsi: Mendapatkan detail satu artefak
// Method: GET
// Endpoint: /api/artifacts/:id
// Akses: Public
exports.getArtifactById = async (req, res) => {
  try {
    // === Tahap 1: Ambil Parameter ===
    const { id } = req.params;
    const userId = req.user?.userID; // Optional: jika user login

    // === Tahap 2: Ambil Data Artefak ===
    const artifact = await Artifact.findByPk(id, {
      include: [
        {
          model: Temple,
          attributes: ['title']
        },
        ...(userId ? [
          {
            model: Bookmark,
            where: { userID: userId },
            required: false,
            attributes: ['isBookmark']
          },
          {
            model: Read,
            where: { userID: userId },
            required: false,
            attributes: ['isRead']
          }
        ] : [])
      ]
    });

    // === Tahap 3: Validasi Keberadaan Artefak ===
    if (!artifact) {
      return res.status(404).json({
        status: 'error',
        message: 'Artefak tidak ditemukan'
      });
    }

    // === Tahap 4: Format Response ===
    // Set gambar default dan status bookmark/read
    const artifactData = {
      ...artifact.toJSON(),
      isBookmarked: artifact.Bookmarks?.[0]?.isBookmark || false,
      isRead: artifact.Reads?.[0]?.isRead || false
    };
    
    if (!artifactData.imageUrl) {
      artifactData.imageUrl = getDefaultImageUrl();
    }

    // === Tahap 5: Kirim Response ===
    res.json({
      status: 'sukses',
      data: {
        artifact: artifactData
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

// === Create Artifact ===
// Fungsi: Membuat data artefak baru
// Method: POST
// Endpoint: /api/artifacts
// Akses: Admin only
exports.createArtifact = async (req, res) => {
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
    const {
      templeID,
      title,
      description,
      detailPeriod,
      detailMaterial,
      detailSize,
      detailStyle,
      funfactTitle,
      funfactDescription,
      locationUrl
    } = req.body;

    // === Tahap 3: Validasi Candi ===
    const temple = await Temple.findByPk(templeID);
    if (!temple) {
      return res.status(404).json({
        status: 'error',
        message: 'Candi tidak ditemukan'
      });
    }

    // === Tahap 4: Buat Record Artefak ===
    const artifact = await Artifact.create({
      templeID,
      imageUrl: null, // Model getter akan handle placeholder
      title,
      description,
      detailPeriod,
      detailMaterial,
      detailSize,
      detailStyle,
      funfactTitle,
      funfactDescription,
      locationUrl
    });

    // === Tahap 5: Upload Gambar (Jika Ada) ===
    if (req.file) {
      try {
        // Generate nama file
        const filename = getFilename('artifact', artifact.artifactID);
        
        // Setup upload stream
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
          resumable: false,
          gzip: true,
          metadata: {
            contentType: req.file.mimetype
          }
        });

        // Upload file ke GCS
        await new Promise((resolve, reject) => {
          blobStream.on('error', async (err) => {
            console.error(err);
            await artifact.destroy();
            reject(new Error('Gagal mengupload gambar'));
          });

          blobStream.on('finish', async () => {
            const imageUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
            await artifact.update({ imageUrl });
            resolve();
          });

          blobStream.end(req.file.buffer);
        });

        // Refresh data
        await artifact.reload();
        const responseArtifact = artifact.toJSON();
        
        // === Tahap 6: Kirim Response (Dengan Gambar) ===
        res.status(201).json({
          status: 'sukses',
          message: 'Artefak berhasil dibuat',
          data: {
            artifact: responseArtifact
          }
        });
      } catch (error) {
        // Handle error upload
        await artifact.destroy();
        throw error;
      }
    } else {
      // === Tahap 6: Kirim Response (Tanpa Gambar) ===
      const responseArtifact = artifact.toJSON();
      if (!responseArtifact.imageUrl) {
        responseArtifact.imageUrl = getDefaultImageUrl();
      }
      
      res.status(201).json({
        status: 'sukses',
        message: 'Artefak berhasil dibuat',
        data: {
          artifact: responseArtifact
        }
      });
    }
  } catch (error) {
    // === Error Handling ===
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan pada server'
    });
  }
};

// === Update Artifact ===
// Fungsi: Memperbarui data artefak
// Method: PUT
// Endpoint: /api/artifacts/:id
// Akses: Admin only
exports.updateArtifact = async (req, res) => {
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
      detailPeriod,
      detailMaterial,
      detailSize,
      detailStyle,
      funfactTitle,
      funfactDescription,
      locationUrl
    } = req.body;

    const artifact = await Artifact.findByPk(id);
    if (!artifact) {
      return res.status(404).json({
        status: 'error',
        message: 'Artefak tidak ditemukan'
      });
    }

    // Handle file upload jika ada file baru
    let imageUrl = artifact.imageUrl;
    if (req.file) {
      try {
        // Hapus file lama jika ada
        if (artifact.imageUrl) {
          const oldFilename = getFilename('artifact', id);
          await deleteFileFromGCS(oldFilename);
        }

        // Upload file baru
        const filename = getFilename('artifact', id);
        const blob = bucket.file(filename);
        const blobStream = blob.createWriteStream({
          resumable: false,
          gzip: true,
          metadata: {
            contentType: req.file.mimetype
          }
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', (err) => {
            console.error(err);
            reject(new Error('Gagal mengupload gambar'));
          });

          blobStream.on('finish', () => {
            imageUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${filename}`;
            resolve();
          });

          blobStream.end(req.file.buffer);
        });
      } catch (error) {
        throw new Error('Gagal mengupload gambar');
      }
    }

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(imageUrl && { imageUrl }),
      ...(detailPeriod && { detailPeriod }),
      ...(detailMaterial && { detailMaterial }),
      ...(detailSize && { detailSize }),
      ...(detailStyle && { detailStyle }),
      ...(funfactTitle && { funfactTitle }),
      ...(funfactDescription && { funfactDescription }),
      ...(locationUrl && { locationUrl })
    };

    await artifact.update(updateData);

    // Pastikan imageUrl menggunakan placeholder jika null
    const responseArtifact = artifact.toJSON();
    if (!responseArtifact.imageUrl) {
      responseArtifact.imageUrl = getDefaultImageUrl();
    }

    res.json({
      status: 'sukses',
      message: 'Artefak berhasil diperbarui',
      data: {
        artifact: responseArtifact
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan pada server'
    });
  }
};

// DELETE - Menghapus artefak (admin)
exports.deleteArtifact = async (req, res) => {
  try {
    const { id } = req.params;
    const artifact = await Artifact.findByPk(id);

    if (!artifact) {
      return res.status(404).json({
        status: 'error',
        message: 'Artefak tidak ditemukan'
      });
    }

    // Hapus gambar dari bucket jika ada
    if (artifact.imageUrl) {
      const filename = getFilename('artifact', id);
      await deleteFileFromGCS(filename);
    }

    await artifact.destroy();

    res.json({
      status: 'sukses',
      message: 'Artefak berhasil dihapus'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Toggle bookmark artifact
exports.toggleBookmark = async (req, res) => {
  try {
    const artifactID = req.params.id;
    const userID = req.user.userID;

    // Cek apakah artefak ada
    const artifact = await Artifact.findByPk(artifactID);
    if (!artifact) {
      return res.status(404).json({
        status: 'error',
        message: 'Artefak tidak ditemukan'
      });
    }

    // Cek apakah sudah di-bookmark
    let bookmark = await Bookmark.findOne({
      where: { userID, artifactID }
    });

    if (bookmark) {
      // Toggle status bookmark
      bookmark.isBookmark = !bookmark.isBookmark;
      await bookmark.save();
    } else {
      // Buat bookmark baru
      bookmark = await Bookmark.create({
        userID,
        artifactID,
        isBookmark: true
      });
    }

    res.json({
      status: 'sukses',
      message: bookmark.isBookmark ? 'Artefak berhasil di-bookmark' : 'Bookmark artefak berhasil dihapus',
      data: { isBookmarked: bookmark.isBookmark }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

// Mark artifact as read
exports.markAsRead = async (req, res) => {
  try {
    const artifactID = req.params.id;
    const userID = req.user.userID;

    // Cek apakah artefak ada
    const artifact = await Artifact.findByPk(artifactID);
    if (!artifact) {
      return res.status(404).json({
        status: 'error',
        message: 'Artefak tidak ditemukan'
      });
    }

    // Tandai sebagai sudah dibaca
    const [read, created] = await Read.findOrCreate({
      where: { userID, artifactID },
      defaults: { isRead: true }
    });

    if (!created) {
      read.isRead = true;
      await read.save();
    }

    res.json({
      status: 'sukses',
      message: 'Artefak ditandai sebagai sudah dibaca',
      data: { isRead: true }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};