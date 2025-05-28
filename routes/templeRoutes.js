const express = require('express');
const router = express.Router();
const templeController = require('../controllers/templeController');
const { templeValidation, idParamValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/adminMiddleware');
const { uploadConfig, uploadToGCS } = require('../middlewares/uploadMiddleware');

// Semua rute memerlukan autentikasi
router.use(authenticateToken);

// Rute publik
router.get('/', templeController.getAllTemples);
router.get('/:id', idParamValidation, templeController.getTempleById);

// Rute khusus admin
router.post('/',
  isAdmin,
  uploadConfig.templeImage,
  templeValidation,
  templeController.createTemple
);

router.put('/:id',
  isAdmin,
  uploadConfig.templeImage,
  uploadToGCS('temple'),
  idParamValidation,
  templeValidation,
  templeController.updateTemple
);

router.delete('/:id',
  isAdmin,
  idParamValidation,
  templeController.deleteTemple
);

module.exports = router;
