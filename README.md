# Artefacto Backend

## 📝 Deskripsi Proyek
Artefacto Backend adalah layanan backend untuk proyek Artefacto yang dibangun menggunakan Node.js dan Express.js. Sistem ini menyediakan API untuk mengelola data artefak budaya dengan fitur autentikasi, manajemen data, dan integrasi dengan Google Cloud Storage.

## 🚀 Fitur Utama
- Autentikasi dan Otorisasi menggunakan JWT.
- Upload dan manajemen file menggunakan Multer dan Google Cloud Storage.
- RESTful API untuk manajemen data candi, artefak, dan tiket.
- Validasi data menggunakan Express Validator.
- Integrasi dengan database MySQL menggunakan Sequelize ORM.
- CORS support untuk integrasi dengan frontend.
- Sistem transaksi dan manajemen tiket.
- Bookmarking dan tracking artefak yang sudah dibaca.

## 📋 Prasyarat
Sebelum menjalankan proyek ini, pastikan Anda telah menginstal:
- Node.js (versi 14 atau lebih tinggi)
- MySQL Server
- Git

## 🛠️ Teknologi yang Digunakan
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **File Storage**: Google Cloud Storage
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Development Tools**: nodemon

## ⚙️ Instalasi dan Pengaturan

1. Clone repositori ini:
   bash
   git clone [URL_REPOSITORI]
   cd artefacto-backend
   

2. Instal dependensi:
   bash
   npm install
   

3. Buat file .env di root direktori dan isi dengan konfigurasi berikut:
   ```
   env
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_NAME=artefacto_db
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLOUD_PROJECT_ID=your_project_id
   GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name
   ```


5. Siapkan database MySQL:
   - Buat database baru dengan nama sesuai DB_NAME di file .env
   - Struktur database akan dibuat otomatis oleh Sequelize

## 🚀 Menjalankan Aplikasi

### Mode Development
    bash
    npm run dev

Server akan berjalan di `http://localhost:3000` dengan fitur hot-reload.

### Mode Production
    bash
    npm start


## 📁 Struktur Direktori
```
   artefacto-backend/
   ├── config/          # Konfigurasi database dan aplikasi
   ├── controllers/     # Logic controller untuk setiap route
   ├── middlewares/     # Middleware Express (auth, validation, dll)
   ├── models/          # Model Sequelize
   ├── routes/          # Definisi route API
   ├── server.js        # Entry point aplikasi
   ├── package.json     # Dependensi dan skrip
   └── README.md        # Dokumentasi proyek
```

## 🔑 Endpoint API

### Autentikasi
- `POST /api/auth/register` - Registrasi pengguna baru
- `POST /api/auth/login` - Login pengguna
- `GET /api/auth/profile` - Mendapatkan profil pengguna
- `PUT /api/auth/profile` - Memperbarui profil pengguna
- `DELETE /api/auth/profile` - Menghapus akun pengguna

### Candi
- `GET /api/temples` - Mendapatkan daftar candi
- `POST /api/temples` - Menambah candi baru (Admin only)
- `PUT /api/temples/:id` - Mengupdate candi (Admin only)
- `DELETE /api/temples/:id` - Menghapus candi (Admin only)

### Artefak
- `GET /api/artifacts` - Mendapatkan daftar artefak
- `POST /api/artifacts` - Menambah artefak baru (Admin only)
- `PUT /api/artifacts/:id` - Mengupdate artefak (Admin only)
- `DELETE /api/artifacts/:id` - Menghapus artefak (Admin only)
- `POST /api/artifacts/:id/bookmark` - Toggle bookmark artefak
- `POST /api/artifacts/:id/read` - Tandai artefak sebagai sudah dibaca

### Tiket
- `GET /api/tickets` - Mendapatkan daftar tiket
- `POST /api/tickets` - Menambah tiket baru (Admin only)
- `PUT /api/tickets/:id` - Mengupdate tiket (Admin only)
- `DELETE /api/tickets/:id` - Menghapus tiket (Admin only)

### Transaksi
- `GET /api/transactions` - Mendapatkan daftar transaksi user
- `POST /api/transactions` - Membuat transaksi baru

### Tiket Dimiliki
- `GET /api/owned-tickets` - Mendapatkan daftar tiket yang dimiliki user
- `GET /api/owned-tickets/:id` - Mendapatkan detail tiket yang dimiliki

## 🖼️ Default Image Placeholder

Aplikasi ini menggunakan gambar placeholder default untuk temple dan artifact yang tidak memiliki gambar khusus:

- **URL Placeholder**: `https://storage.googleapis.com/{BUCKET_NAME}/assets/image-placeholder.jpg`
- **Implementasi**: Menggunakan Sequelize getter pada model Temple dan Artifact
- **Behavior**: 
  - Jika `imageUrl` adalah `null` atau kosong, akan mengembalikan URL placeholder
  - Jika `imageUrl` memiliki nilai, akan mengembalikan URL asli
  - Placeholder otomatis digunakan saat membuat temple/artifact tanpa upload gambar

## 🔒 Keamanan
- Implementasi JWT untuk autentikasi
- Password di-hash menggunakan bcrypt
- Validasi input menggunakan express-validator
- CORS protection
- Environment variables untuk data sensitif
- Pembatasan akses endpoint admin dengan middleware


---
Dibuat dengan ❤️ untuk Artefacto Project
