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
- `GET /api/auth/profile` - Mendapatkan profil pengguna (Protected)
- `PUT /api/auth/profile` - Memperbarui profil pengguna (Protected, dengan upload gambar profil)
- `DELETE /api/auth/profile` - Menghapus akun pengguna (Protected)

### Candi (Temples)
- `GET /api/temples` - Mendapatkan daftar candi (Protected)
- `GET /api/temples/:id` - Mendapatkan detail candi berdasarkan ID (Protected)
- `POST /api/temples` - Menambah candi baru (Admin only, dengan upload gambar)
- `PUT /api/temples/:id` - Mengupdate candi (Admin only, dengan upload gambar)
- `DELETE /api/temples/:id` - Menghapus candi (Admin only)

### Artefak (Artifacts)
- `GET /api/artifacts` - Mendapatkan daftar artefak (Protected)
- `GET /api/artifacts/:id` - Mendapatkan detail artefak berdasarkan ID (Protected)
- `POST /api/artifacts/:id/bookmark` - Toggle bookmark artefak (Protected)
- `POST /api/artifacts/:id/read` - Tandai artefak sebagai sudah dibaca (Protected)
- `POST /api/artifacts` - Menambah artefak baru (Admin only, dengan upload gambar)
- `PUT /api/artifacts/:id` - Mengupdate artefak (Admin only, dengan upload gambar)
- `DELETE /api/artifacts/:id` - Menghapus artefak (Admin only)

### Tiket (Tickets)
- `GET /api/tickets` - Mendapatkan daftar tiket (Protected)
- `GET /api/tickets/:id` - Mendapatkan detail tiket berdasarkan ID (Protected)
- `POST /api/tickets` - Menambah tiket baru (Admin only)
- `PUT /api/tickets/:id` - Mengupdate tiket (Admin only)
- `DELETE /api/tickets/:id` - Menghapus tiket (Admin only)

### Transaksi (Transactions)
- `GET /api/transactions/admin/all` - Mendapatkan semua transaksi (Admin only)
- `POST /api/transactions` - Membuat transaksi baru (Protected)

### Tiket yang Dimiliki (Owned Tickets)
- `GET /api/owned-tickets` - Mendapatkan daftar tiket yang dimiliki user (Protected)
- `GET /api/owned-tickets/:id` - Mendapatkan detail tiket yang dimiliki (Protected)
- `POST /api/owned-tickets` - Membuat tiket yang dimiliki baru (Protected)
- `PUT /api/owned-tickets/:id/use` - Update status penggunaan tiket (Protected)

### Machine Learning (ML)
- `POST /api/ml/predict` - Prediksi gambar menggunakan model ML (dengan upload file gambar)

### Keterangan:
- **Protected**: Memerlukan token autentikasi JWT
- **Admin only**: Memerlukan token autentikasi JWT dan role admin
- **Upload gambar**: Mendukung upload file gambar (jpg, jpeg, png)
- **File upload**: Mendukung upload file untuk prediksi ML

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
