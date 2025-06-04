// Import library yang dibutuhkan
const express = require('express');        // Framework untuk membuat router
const axios = require('axios');            // Untuk melakukan HTTP request ke ML API
const FormData = require('form-data');     // Untuk mengirim file dalam format form-data
const multer = require('multer');          // Middleware untuk handle upload file
const router = express.Router();

// Konfigurasi multer untuk menangani upload file
// - Menggunakan memory storage (file disimpan di memory)
// - Batasan ukuran file 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// === Route untuk prediksi menggunakan Machine Learning ===
// Endpoint untuk mengirim gambar dan mendapatkan hasil prediksi
// POST /api/ml/predict
// Body: form-data dengan field 'file' berisi gambar
router.post('/predict', upload.single('file'), async (req, res) => {
  try {
    // Log informasi request untuk debugging
    console.log('ML Proxy: Forwarding request to ML API');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'No file');
    
    // Validasi apakah file telah dikirim
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided',
        message: 'File is required for ML prediction'
      });
    }
    
    // Persiapkan data untuk dikirim ke ML API
    // Menggunakan FormData untuk mengirim file
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Kirim request ke ML API
    // - Timeout 60 detik karena proses ML bisa memakan waktu
    // - Menggunakan header yang sesuai untuk form-data
    const mlResponse = await axios.post(
      'https://artefacto-749281711221.asia-southeast2.run.app/predict',
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 60000, // 60 detik
      }
    );
    
    // Kirim hasil prediksi ke client
    console.log('ML Proxy: Received response from ML API');
    res.status(200).json(mlResponse.data);
    
  } catch (error) {
    // Log error untuk debugging
    console.error('ML Proxy Error:', error.message);
    console.error('Error details:', error.response?.data);
    
    // Handling berbagai jenis error
    if (error.response) {
      // Error dari ML API (ada response tapi status error)
      res.status(error.response.status).json({
        error: 'ML API error',
        message: error.response.data
      });
    } else if (error.request) {
      // Tidak ada response dari ML API (timeout)
      res.status(500).json({
        error: 'ML API timeout',
        message: 'No response from ML API'
      });
    } else {
      // Error lainnya
      res.status(500).json({
        error: 'ML Proxy error',
        message: error.message
      });
    }
  }
});

module.exports = router; 