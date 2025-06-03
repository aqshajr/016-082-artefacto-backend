# Memanfaatkan image dasar Node.js versi 20
# dengan distro Alpine Linux (ukuran ringan)
FROM node:20-alpine

# Install dumb-init untuk proper signal handling
RUN apk add --no-cache dumb-init

# Mengkonfigurasi direktori utama dalam container sebagai /app
WORKDIR /app

# Create non-root user untuk security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files terlebih dahulu untuk better caching
COPY package*.json ./

# Proses instalasi dependencies production only
RUN npm ci --only=production && npm cache clean --force

# Copy semua file aplikasi
COPY --chown=nodejs:nodejs . .

# Switch ke non-root user
USER nodejs

# Membuka akses jaringan pada port 8080 untuk koneksi eksternal
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    http.get('http://localhost:8080/health', (res) => { \
      if (res.statusCode === 200) process.exit(0); \
      else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Perintah utama menggunakan dumb-init untuk proper signal handling
CMD ["dumb-init", "node", "server.js"]
