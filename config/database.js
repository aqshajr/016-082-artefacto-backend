// ===================================
// Konfigurasi Database
// ===================================
// Fungsi: Mengatur koneksi ke database MySQL menggunakan Sequelize
// Konfigurasi:
// 1. Nama database (DB_NAME)
// 2. Username database (DB_USER)
// 3. Password database (DB_PASSWORD)
// 4. Host database (DB_HOST)
// 5. Port database (DB_PORT)
// 6. Pool connection
// 7. Logging mode

// Import library yang dibutuhkan
const { Sequelize } = require('sequelize');     // ORM Sequelize
require('dotenv').config();                     // Load environment variables

// === Inisialisasi Koneksi Database ===
// Membuat instance Sequelize dengan konfigurasi dari environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,        // Nama database
  process.env.DB_USER,        // Username database
  process.env.DB_PASSWORD,    // Password database
  {
    host: process.env.DB_HOST,    // Host database
    port: process.env.DB_PORT,    // Port database
    dialect: 'mysql',             // Jenis database yang digunakan
    
    // Logging hanya aktif di mode development
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Konfigurasi connection pool
    pool: {
      max: 5,        // Maksimal 5 koneksi
      min: 0,        // Minimal 0 koneksi
      acquire: 30000, // Waktu maksimal (ms) untuk mendapatkan koneksi
      idle: 10000    // Waktu maksimal (ms) koneksi idle sebelum dilepas
    }
  }
);

// Export instance Sequelize untuk digunakan di file lain
module.exports = sequelize;
