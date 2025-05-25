const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation, updateProfileValidation } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const { uploadConfig, uploadToGCS } = require('../middlewares/uploadMiddleware');

// Rute public
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Rute protected
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile',
  authenticateToken,
  updateProfileValidation,
  uploadConfig.profilePicture,
  uploadToGCS('profilePicture'),
  authController.updateProfile
);

router.delete('/profile', authenticateToken, authController.deleteUser);

module.exports = router;
