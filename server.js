const express = require('express');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();

// Database
const sequelize = require('./config/database');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint untuk Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'artefacto-backend'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Artefacto Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server'
  });
});

// Get PORT from environment variable
const PORT = process.env.PORT || 8080;

// Start server dulu, database connection async
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server berjalan pada port ${PORT}`);
  console.log(`Health check tersedia di http://localhost:${PORT}/health`);
});

// Database connection berjalan terpisah (tidak blocking server start)
sequelize.authenticate()
  .then(() => {
    console.log('Database berhasil terhubung');
    return sequelize.sync();
  })
  .then(() => {
    console.log('Database sync completed');
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    console.log('Server tetap berjalan tanpa database connection');
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    sequelize.close();
    process.exit(0);
  });
});

module.exports = app;
