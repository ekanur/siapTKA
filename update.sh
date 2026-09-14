#!/usr/bin/env bash
# ==============================================================================
# Script Otomatis Pembaruan (Deployment / Update) Server - siapTKA
# Platform : Rocky Linux 8 / CentOS / Ubuntu (Node.js + PM2 + Next.js + SQLite)
# Lokasi   : /var/www/siaptka/update.sh
# Jalankan : bash update.sh (atau ./update.sh)
# ==============================================================================

set -euo pipefail

# Konfigurasi Warna Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

START_TIME=$(date +%s)

echo -e "${CYAN}${BOLD}"
echo "=========================================================="
echo "    🚀  siapTKA - SKRIP PEMBARUAN SISTEM (PRODUCTION)    "
echo "=========================================================="
echo -e "${NC}"

# 1. Navigasi ke direktori aplikasi
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"
echo -e "${BLUE}📍 Direktori aplikasi:${NC} $APP_DIR"

# 2. Validasi Kesiapan Environment & Tools
echo -e "\n${BLUE}🔍 [1/7] Memeriksa dependensi sistem...${NC}"
for cmd in git node npm npx pm2 curl; do
  if ! command -v "$cmd" &> /dev/null; then
    echo -e "${RED}❌ Kesalahan: Perintah '$cmd' tidak ditemukan di sistem server!${NC}"
    exit 1
  fi
done

if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  Peringatan: Berkas '.env' tidak ditemukan di $APP_DIR.${NC}"
  if [ -f ".env.example" ]; then
    echo -e "${YELLOW}ℹ️  Menyalin '.env.example' ke '.env'... Mohon sesuaikan kredensialnya!${NC}"
    cp .env.example .env
  fi
fi
echo -e "${GREEN}✅ Semua dependensi sistem siap.${NC}"

# 3. Otomatis Backup Database SQLite (Pencegahan Data Hilang)
echo -e "\n${BLUE}💾 [2/7] Melakukan pencadangan (backup) database SQLite...${NC}"
mkdir -p backups
DB_PATH="prisma/dev.db"
if [ -f "$DB_PATH" ]; then
  BACKUP_FILE="backups/siaptka_backup_$(date +%Y%m%d_%H%M%S).db"
  # Gunakan sqlite3 .backup jika tersedia, fallback ke cp
  if command -v sqlite3 &> /dev/null; then
    sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
  else
    cp "$DB_PATH" "$BACKUP_FILE"
  fi
  echo -e "${GREEN}✅ Database berhasil dicadangkan ke:${NC} $BACKUP_FILE"

  # Bersihkan backup lama (simpan 14 hari terakhir)
  find backups/ -name "*.db" -type f -mtime +14 -delete 2>/dev/null || true
else
  echo -e "${YELLOW}ℹ️  Berkas $DB_PATH belum ditemukan, melewati proses backup.${NC}"
fi

# 4. Ambil Pembaruan Kode dari Git Repository
echo -e "\n${BLUE}📥 [3/7] Mengambil pembaruan kode dari GitHub (origin/main)...${NC}"
PREV_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "initial")

# Simpan perubahan lokal yang belum di-commit secara aman jika ada
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Ditemukan modifikasi lokal yang belum di-commit. Menyimpan ke git stash...${NC}"
  git stash push -m "Auto-stashed by update.sh at $(date +%Y-%m-%d_%H:%M:%S)"
fi

git fetch origin main
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
  echo -e "${YELLOW}ℹ️  Kode server sudah pada commit terbaru (${LOCAL_HASH:0:7}). Memeriksa kompilasi...${NC}"
else
  git pull origin main
  NEW_COMMIT=$(git rev-parse --short HEAD)
  echo -e "${GREEN}✅ Kode berhasil diperbarui: ${PREV_COMMIT} ➔ ${NEW_COMMIT}${NC}"
  echo -e "${CYAN}📝 Commit terbaru:${NC} $(git log -1 --pretty=format:'%s (%an, %ar)')"
fi

# 5. Instalasi Dependensi & Sinkronisasi Prisma
echo -e "\n${BLUE}📦 [4/7] Memeriksa dependensi npm & sinkronisasi Prisma...${NC}"

# Cek apakah package.json berubah sejak commit sebelumnya
if [ "$PREV_COMMIT" != "initial" ] && git diff --name-only "$PREV_COMMIT" HEAD 2>/dev/null | grep -q "package.json"; then
  echo -e "${YELLOW}🔄 Terdeteksi perubahan pada package.json, menjalankan npm install...${NC}"
  npm install
else
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules belum ada, menjalankan npm install...${NC}"
    npm install
  else
    echo -e "${GREEN}✅ Dependensi npm up-to-date.${NC}"
  fi
fi

# Generate Prisma Client
echo -e "${BLUE}⚙️  Sinkronisasi Prisma Client...${NC}"
npx prisma generate

# Jika schema.prisma berubah, jalankan db push secara aman
if [ "$PREV_COMMIT" != "initial" ] && git diff --name-only "$PREV_COMMIT" HEAD 2>/dev/null | grep -q "prisma/schema.prisma"; then
  echo -e "${YELLOW}🔄 Terdeteksi perubahan skema database, menjalankan prisma db push...${NC}"
  npx prisma db push --skip-generate
fi

# 6. Kompilasi Next.js untuk Produksi (Production Build)
echo -e "\n${BLUE}🏗️  [5/7] Membangun aplikasi Next.js (npm run build)...${NC}"
echo -e "${CYAN}ℹ️  Jika proses build gagal, aplikasi yang sedang berjalan di PM2 TIDAK AKAN terganggu.${NC}"

if npm run build; then
  echo -e "${GREEN}✅ Build Next.js selesai dengan sukses!${NC}"
else
  echo -e "${RED}${BOLD}❌ ERROR: Gagal melakukan build Next.js!${NC}"
  echo -e "${RED}Layanan lama tetap berjalan di PM2 untuk menjaga ketersediaan sistem.${NC}"
  echo -e "${YELLOW}Silakan periksa log error di atas sebelum mencoba kembali.${NC}"
  exit 1
fi

# 7. Reload / Restart PM2 (Zero-Downtime Reload)
echo -e "\n${BLUE}🔄 [6/7] Memperbarui proses di PM2...${NC}"

APP_NAME="siaptka"

if [ -f "ecosystem.config.js" ]; then
  if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}🔄 Menjalankan reload untuk proses '$APP_NAME' via ecosystem.config.js...${NC}"
    pm2 reload ecosystem.config.js || pm2 restart ecosystem.config.js
  else
    echo -e "${YELLOW}ℹ️  Mendaftarkan proses baru dari ecosystem.config.js...${NC}"
    pm2 start ecosystem.config.js
  fi
else
  if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}🔄 Menjalankan reload untuk proses '$APP_NAME'...${NC}"
    pm2 reload "$APP_NAME" || pm2 restart "$APP_NAME"
  else
    echo -e "${YELLOW}ℹ️  Proses '$APP_NAME' belum terdaftar di PM2. Mendaftarkan proses baru...${NC}"
    pm2 start npm --name "$APP_NAME" -- start
  fi
fi

pm2 save
echo -e "${GREEN}✅ PM2 berhasil diperbarui dan disimpan.${NC}"

# 8. Uji Kesehatan Sistem (Automated Health Check)
echo -e "\n${BLUE}🩺 [7/7] Melakukan uji kesehatan layanan (Health Check)...${NC}"
echo -e "Menunggu 4 detik agar port server aktif..."
sleep 4

HEALTH_URL="http://127.0.0.1:3000/api/health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  HEALTH_BODY=$(curl -s "$HEALTH_URL" 2>/dev/null || echo "{}")
  echo -e "${GREEN}${BOLD}✅ SISTEM SEHAT & RESPONSIF! (HTTP 200 OK)${NC}"
  echo -e "${CYAN}Detail Health Check: $HEALTH_BODY${NC}"
else
  # Fallback check ke /login jika /api/health mengembalikan status lain
  LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/login" 2>/dev/null || echo "000")
  if [ "$LOGIN_STATUS" = "200" ] || [ "$LOGIN_STATUS" = "307" ]; then
    echo -e "${GREEN}${BOLD}✅ SISTEM BERJALAN NORMAL! (HTTP $LOGIN_STATUS pada /login)${NC}"
  else
    echo -e "${RED}${BOLD}⚠️  PERINGATAN: Health check mengembalikan kode HTTP $HTTP_STATUS!${NC}"
    echo -e "${YELLOW}Log 25 baris terakhir dari PM2:${NC}"
    pm2 logs "$APP_NAME" --lines 25 --nostream || true
  fi
fi

# Ringkasan Selesai
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo -e "\n${GREEN}${BOLD}"
echo "=========================================================="
echo "    ✨  PEMBARUAN BERHASIL SELESAI DALAM ${ELAPSED} DETIK!          "
echo "    🌐  Aplikasi : https://siaptka.cloud                  "
echo "    📌  Versi    : $(git rev-parse --short HEAD) - $(git log -1 --pretty=format:'%s') "
echo "=========================================================="
echo -e "${NC}"

