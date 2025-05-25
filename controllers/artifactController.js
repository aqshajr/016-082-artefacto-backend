const { Artifact, Temple, Bookmark, Read } = require('../models');
const { validationResult } = require('express-validator');
const { getFilename, bucket, deleteFileFromGCS } = require('../middlewares/uploadMiddleware');

// GET - Mendapatkan semua artefak (publik)
exports.getAllArtifacts = async (req, res) => {
  try {
    const { templeId } = req.query;
    const userId = req.user?.userID; // Optional: jika user login

    const whereClause = templeId ? { templeID: templeId } : {};

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

    res.json({
      status: 'sukses',
      data: {
        artifacts: artifacts.map(artifact => ({
          ...artifact.toJSON(),
          isBookmarked: artifact.Bookmarks?.[0]?.isBookmark || false,
          isRead: artifact.Reads?.[0]?.isRead || false
        }))
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

// GET - Mendapatkan detail artefak (publik)
exports.getArtifactById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userID; // Optional: jika user login

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

    if (!artifact) {
      return res.status(404).json({
        status: 'error',
        message: 'Artefak tidak ditemukan'
      });
    }

    res.json({
      status: 'sukses',
      data: {
        artifact: {
          ...artifact.toJSON(),
          isBookmarked: artifact.Bookmarks?.[0]?.isBookmark || false,
          isRead: artifact.Reads?.[0]?.isRead || false
        }
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

// POST - Membuat artefak baru (admin)
exports.createArtifact = async (req, res) => {
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

    // Cek apakah candi ada
    const temple = await Temple.findByPk(templeID);
    if (!temple) {
      return res.status(404).json({
        status: 'error',
        message: 'Candi tidak ditemukan'
      });
    }

    // Buat artifact dulu tanpa imageUrl
    const artifact = await Artifact.create({
      templeID,
      imageUrl: null, // Set null dulu
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

    // Setelah artifact dibuat dan punya ID, baru handle upload gambar
    if (req.file) {
      try {
        const filename = getFilename('artifact', artifact.artifactID);
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

        res.status(201).json({
          status: 'sukses',
          message: 'Artefak berhasil dibuat',
          data: {
            artifact
          }
        });
      } catch (error) {
        // Jika upload gagal, hapus artifact yang sudah dibuat
        await artifact.destroy();
        throw error;
      }
    } else {
      res.status(201).json({
        status: 'sukses',
        message: 'Artefak berhasil dibuat',
        data: {
          artifact
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

// PUT - Memperbarui artefak (admin)
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

    res.json({
      status: 'sukses',
      message: 'Artefak berhasil diperbarui',
      data: {
        artifact
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