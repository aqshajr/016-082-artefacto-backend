const express = require('express');
const axios = require('axios');
const router = express.Router();

// ML API proxy route
router.post('/predict', async (req, res) => {
  try {
    console.log('ML Proxy: Forwarding request to ML API');
    
    // Forward request to ML API
    const mlResponse = await axios.post(
      'https://artefacto-749281711221.asia-southeast2.run.app/predict',
      req.body,
      {
        headers: {
          'Content-Type': req.headers['content-type'],
        },
        timeout: 60000, // 60 second timeout for ML processing
      }
    );

    console.log('ML Proxy: Received response from ML API');
    
    // Return ML API response
    res.status(200).json(mlResponse.data);
  } catch (error) {
    console.error('ML Proxy Error:', error.message);
    
    if (error.response) {
      // ML API returned an error response
      res.status(error.response.status).json({
        error: 'ML API error',
        message: error.response.data
      });
    } else if (error.request) {
      // Request made but no response
      res.status(500).json({
        error: 'ML API timeout',
        message: 'No response from ML API'
      });
    } else {
      // Something else happened
      res.status(500).json({
        error: 'ML Proxy error',
        message: error.message
      });
    }
  }
});

module.exports = router;