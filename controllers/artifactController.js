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

    // Dapatkan URL gambar dari middleware upload jika ada
    const imageUrl = req.file?.cloudStoragePublicUrl;

    // Buat artifact dengan imageUrl langsung
    const artifact = await Artifact.create({
      templeID,
      imageUrl,
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

    res.status(201).json({
      status: 'sukses',
      message: 'Artefak berhasil dibuat',
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

    // Dapatkan URL gambar baru dari middleware upload jika ada
    const imageUrl = req.file?.cloudStoragePublicUrl;

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
      try {
        // Extract filename dari URL
        const url = new URL(artifact.imageUrl);
        const filename = url.pathname.substring(1); // Remove leading slash
        await deleteFileFromGCS(filename);
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with deletion even if image deletion fails
      }
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