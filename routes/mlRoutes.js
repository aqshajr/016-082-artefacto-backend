const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const router = express.Router();

// Configure multer for file handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ML API proxy route with file upload handling
router.post('/predict', upload.single('file'), async (req, res) => {
  try {
    console.log('ML Proxy: Forwarding request to ML API');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'File is required for ML prediction'
      });
    }
    
    // Create FormData for ML API
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Forward to ML API
    const mlResponse = await axios.post(
      'https://artefacto-749281711221.asia-southeast2.run.app/predict',
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 60000,
      }
    );
    
    console.log('ML Proxy: Received response from ML API');
    res.status(200).json(mlResponse.data);
    
  } catch (error) {
    console.error('ML Proxy Error:', error.message);
    console.error('Error details:', error.response?.data);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: 'ML API error',
        message: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({
        error: 'ML API timeout',
        message: 'No response from ML API'
      });
    } else {
      res.status(500).json({
        error: 'ML Proxy error',
        message: error.message
      });
    }
  }
});

module.exports = router; 