const express = require('express');
const router = express.Router();
const artifactController = require('../controllers/artifactController');
const { artifactValidation, updateArtifactValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');
const { uploadConfig, uploadToGCS } = require('../middlewares/uploadMiddleware');

// Semua rute memerlukan autentikasi
router.use(authenticateToken);

// Rute publik
router.get('/', artifactController.getAllArtifacts);
router.get('/:id', idParamValidation, artifactController.getArtifactById);
router.post('/:id/bookmark', idParamValidation, artifactController.toggleBookmark);
router.post('/:id/read', idParamValidation, artifactController.markAsRead);

// Rute khusus admin
router.post('/',
  isAdmin,
  uploadConfig.artifactImage,
  artifactValidation,
  artifactController.createArtifact
);

router.put('/:id',
  isAdmin,
  uploadConfig.artifactImage,
  idParamValidation,
  updateArtifactValidation,
  artifactController.updateArtifact
);

router.delete('/:id',
  isAdmin,
  idParamValidation,
  artifactController.deleteArtifact
);

module.exports = router;
