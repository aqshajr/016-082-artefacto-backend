# Memanfaatkan image dasar Node.js versi 20
# dengan distro Alpine Linux (ukuran ringan)
FROM node:20-alpine

# Mengkonfigurasi direktori utama dalam
#container sebagai /app
WORKDIR /app

# Melakukan copy semua file proyek dari host
# ke dalam container
COPY . .

# Proses instalasi seluruh package
# dependencies sesuai package.json
RUN npm install

# Membuka akses jaringan pada port 5000 untuk
# koneksi eksternal
EXPOSE 5000

# Perintah utama untuk menjalankan aplikasi
# menggunakan Node.js
CMD ["node", "server.js"]