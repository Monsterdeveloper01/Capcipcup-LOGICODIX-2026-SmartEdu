# 05. Panduan Menjalankan Server & Troubleshooting

Dokumen ini memuat panduan operasional server (Next.js & Python FastAPI), konfigurasi environment variable, dan panduan penanganan kendala teknis (*troubleshooting*).

---

## 1. Status Port & Layanan Saat Ini

Kedua server saat ini **sudah aktif berjalan di background**:

| Layanan | Port | Status | Perintah Cek Kesehatan |
|---|---|---|---|
| **Next.js Frontend & API Routes** | `http://localhost:3000` | 🟢 Active | Buka di browser: `http://localhost:3000` |
| **Python FastAPI Microservice** | `http://localhost:8000` | 🟢 Active | Buka di browser: `http://localhost:8000/health` |
| **Database MariaDB** | `10.80.80.3:3306` | 🟢 Connected | Database: `capcipcup-db` |

---

## 2. Cara Menjalankan Server Secara Manual (Jika Diperlukan)

Jika server pernah dimatikan atau komputer di-restart, ikuti langkah berikut:

### A. Menjalankan Backend Python FastAPI (Port 8000)
Buka terminal baru di direktori proyek:
```bash
# Pastikan dependensi terpasang
pip install -r backend-python/requirements.txt

# Jalankan server FastAPI
python backend-python/main.py
```
*Output yang diharapkan:*
```
INFO: Started server process
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

### B. Menjalankan Next.js Frontend (Port 3000)
Buka terminal kedua di direktori proyek:
```bash
# Jalankan Next.js dev server
npm run dev
```
*Output yang diharapkan:*
```
▲ Next.js 16.4.5
- Local: http://localhost:3000
✓ Ready in 1.5s
```

---

## 3. Konfigurasi Token AI (`.env.local`)

File [`.env.local`](file:///D:/Application/examppp/htdocs/capcipcup/.env.local) menyimpan kredensial database dan API key Gemini:

```env
DB_HOST=10.80.80.3
DB_PORT=3306
DB_NAME=capcipcup-db
DB_USER=capcipcup-db-usr
DB_PASSWORD=6wcWxy7YFwzPLRbc

# Google Gemini API Key (Dapatkan gratis di https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=masukkan_token_api_di_sini
```

> [!NOTE]
> **Tidak Perlu Restart Server saat Mengubah Token:**
> Fondasi AI di [`src/lib/ai/client.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/ai/client.ts) menggunakan *Dynamic Proxy*. Begitu Anda mengisi atau mengganti `GEMINI_API_KEY` di `.env.local` lalu menyimpan file, Next.js akan membaca token baru secara otomatis pada request berikutnya!

---

## 4. Panduan Troubleshooting Kendala Umum

### 1. Izin Kamera atau Mikrofon Diblokir Browser
- **Gejala:** Muncul pesan *"Kamera belum diaktifkan"* atau *"Speech recognition error"*.
- **Solusi:**
  1. Klik ikon gembok / perizinan di bilah alamat browser (sebelah kiri `http://localhost:3000`).
  2. Pastikan izin **Kamera** dan **Mikrofon** disetel ke **"Allow" (Izinkan)**.
  3. Gunakan peramban berbasis Chromium modern (**Google Chrome**, **Microsoft Edge**, atau **Brave**) yang mendukung standar Web Speech API (`webkitSpeechRecognition`).

### 2. Microservice Python Sedang Offline
- **Gejala:** Terminal Python tidak sengaja tertutup.
- **Dampak pada Aplikasi:** **Aplikasi TIDAK AKAN CRASH.**
  - Helper [`src/lib/python-api.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/python-api.ts) dirancang dengan mekanisme *graceful fallback*. Jika Python mati, Next.js akan beralih ke perhitungan metrik deterministik edge tanpa menghentikan alur bermain siswa.
- **Solusi:** Jalankan kembali perintah `python backend-python/main.py`.

### 3. Kendala Jaringan Database MariaDB
- **Gejala:** Respon lambat atau timeout pada request database.
- **Pemeriksaan:**
  Jalankan perintah pengujian koneksi cepat di terminal:
  ```bash
  node scripts/migrate_auth.js
  ```
  Jika muncul pesan *"Connected to MariaDB"*, koneksi ke server database `10.80.80.3:3306` berjalan normal.

### 4. Bounding Box YOLO Tidak Muncul
- **Gejala:** Kamera menyala tetapi kotak kuning deteksi belum tampak.
- **Penyebab:** Benda terlalu dekat atau pencahayaan kurang.
- **Solusi:** Arahkan kamera ke benda yang kontras (misal: botol minum di atas meja kayu atau buku di samping laptop). Model YOLO Nano dioptimalkan untuk mendeteksi 80 kelas benda sehari-hari COCO dataset.

