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

// Koneksi database dan memulai server
const PORT = process.env.PORT || 8080;

sequelize.sync()
  .then(() => {
    console.log('Database berhasil terhubung');
    app.listen(PORT, () => {
      console.log(`Server berjalan pada port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Tidak dapat terhubung ke database:', error);
  });

module.exports = app;
