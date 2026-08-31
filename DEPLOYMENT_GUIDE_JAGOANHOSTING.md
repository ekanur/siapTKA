# Panduan Deployment Aplikasi siapTKA di VPS Jagoanhosting (Docker Environment)

Panduan ini disusun khusus untuk spesifikasi VPS Jagoanhosting:
- **Spesifikasi VPS**: 2 Core CPU, 2 GB RAM, 40 GB Storage
- **Sistem Operasi Rekomendasi**: Ubuntu 22.04 LTS / 24.04 LTS
- **Metode Deployment**: Docker & Docker Compose (Multi-stage Node Alpine Standalone)

---

## 1. Persiapan VPS & Konfigurasi Swap Memory (Wajib untuk 2 GB RAM)

Saat pertama kali login ke VPS via SSH, buat **Swap Memory sebesar 2 GB – 4 GB** agar server memiliki memori cadangan saat proses kompilasi (*build*):

```bash
# Login ke VPS via SSH
ssh root@IP_VPS_ANDA

# 1. Update package sistem
sudo apt update && sudo apt upgrade -y

# 2. Buat file Swap 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 3. Jadikan permanen saat server reboot
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 4. Verifikasi status memory & swap
free -h
```

---

## 2. Instalasi Docker & Docker Compose di VPS

Jalankan skrip instalasi resmi Docker berikut:

```bash
# Install package pendukung
sudo apt install -y ca-certificates curl gnupg lsb-release git

# Tambahkan GPG key resmi Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Setup repository Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose Plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Cek versi Docker
docker --version
docker compose version
```

---

## 3. Clone Repository GitHub & Konfigurasi Environment

```bash
# Masuk ke direktori home/app
cd /home
git clone https://github.com/USERNAME_ANDA/siapTKA.git
cd siapTKA

# Buat file konfigurasi .env
cp .env.example .env
nano .env
```

Isi variabel pada file `.env`:
```env
NEXTAUTH_URL=https://domain-anda.com
NEXTAUTH_SECRET=rahasia_string_acak_32_karakter_aman_2026
GOOGLE_CLIENT_ID=isi_dari_google_cloud_console
GOOGLE_CLIENT_SECRET=isi_dari_google_cloud_console
GEMINI_API_KEY=isi_dari_google_ai_studio
NEXT_PUBLIC_CLIENT_SALT=siaptka_secure_offline_salt_key_2026
```

---

## 4. Menjalankan Aplikasi via Docker Compose

Jalankan container dengan satu perintah:

```bash
# Build dan jalankan di background
docker compose up -d --build

# Cek status container
docker compose ps

# Cek log aplikasi jika diperlukan
docker compose logs -f app
```

Aplikasi kini aktif di port internal `3000`.

---

## 5. Konfigurasi Nginx Reverse Proxy & SSL HTTPS Gratis (Certbot)

Agar aplikasi dapat diakses publik melalui domain sekolah dengan protokol aman HTTPS:

```bash
# Install Nginx dan Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Buat konfigurasi virtual host Nginx
sudo nano /etc/nginx/sites-available/siaptka
```

Tempel konfigurasi Nginx berikut (sesuaikan `domain-anda.com`):
```nginx
server {
    server_name domain-anda.com www.domain-anda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan konfigurasi dan pasang sertifikat SSL:
```bash
# Aktifkan konfigurasi
sudo ln -s /etc/nginx/sites-available/siaptka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Pasang SSL gratis (Let's Encrypt)
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

---

## 6. Selesai & Verifikasi

Buka browser dan akses `https://domain-anda.com`:
- Siswa dapat login dengan akun Google Workspace sekolah.
- Guru dapat login ke dashboard rekap dan generator soal AI.
- Siswa di lokasi PKL minim sinyal dapat mengunduh bank soal lalu beralih ke mode offline sepenuhnya.