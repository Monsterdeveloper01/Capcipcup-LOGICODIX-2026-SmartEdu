# 📚 Dokumentasi & Panduan Lengkap Pengujian LinguaQuest (DuniaKata)
### Capcipcup SmartEdu — LOGICODIX 2026 Hackathon

Selamat datang di pusat panduan pengujian dan dokumentasi arsitektur **LinguaQuest (DuniaKata)**. Seluruh sistem telah dibangun menggunakan **Arsitektur Hybrid AI (Next.js + Python FastAPI + Gemini API)** dengan antarmuka **Neo-Brutalism (Anti-AI Slop)** dan sistem autentikasi multi-role.

---

## 📑 Daftar Isi Panduan Lengkap

Silakan buka dokumen panduan sesuai kebutuhan pengujian Anda:

1. [**01. Ringkasan Fitur & Arsitektur Sistem**](file:///D:/Application/examppp/htdocs/capcipcup/docs/panduan-lengkap/01_RINGKASAN_FITUR_DAN_ARSITEKTUR.md)
   - Daftar seluruh file & komponen yang telah dibuat.
   - Diagram arsitektur Hybrid AI (Python FastAPI 0-Token vs Gemini AI Berat).
   - Skema database MariaDB (`users`, `quests`, `submissions`, `scanned_items`).

2. [**02. Panduan Login Multi-Role (Siswa, Guru, Superadmin)**](file:///D:/Application/examppp/htdocs/capcipcup/docs/panduan-lengkap/02_PANDUAN_LOGIN_MULTI_ROLE.md)
   - Tabel kredensial akun contoh yang siap dipakai.
   - Cara menguji fitur **1-Klik Login Cepat** (tanpa ketik).
   - Cara menguji hak akses masing-masing role dan alur logout.

3. [**03. Panduan Pengujian Mode 1: Classroom Room Mode (Guru & Murid)**](file:///D:/Application/examppp/htdocs/capcipcup/docs/panduan-lengkap/03_PANDUAN_TESTING_MODE_1_ROOM_KELAS.md)
   - Skenario Guru membuat room dengan topik RPP & PIN 6-Digit (`/teacher/create`).
   - Skenario Murid bergabung menggunakan PIN (`/room/join`).
   - Skenario memantau papan nilai live (*Live Leaderboard*) di layar proyektor (`/teacher/room/[code]`).

4. [**04. Panduan Pengujian Mode 2: Solo Explorer Mode & Unified Game Engine**](file:///D:/Application/examppp/htdocs/capcipcup/docs/panduan-lengkap/04_PANDUAN_TESTING_MODE_2_SOLO_EXPLORER.md)
   - Skenario membuat misi mandiri via scan kamera atau topik kustom (`/solo/create`).
   - Alur 3 Tahap Unified Game Engine:
     - **Stage 1 (Pre-Quiz):** Pilihan ganda kontekstual.
     - **Stage 2 (YOLO Scanner):** Deteksi benda kamera dengan Bounding Box & Kartu Kosakata.
     - **Stage 3 (Voice Roleplay Arena):** Dialog suara NPC, Live WPM Meter Python, dan Bisikan AI.
   - Rapor Evaluasi Akhir CEFR & Native Upgrade (`/result/[subId]`).

5. [**05. Panduan Menjalankan Server & Troubleshooting**](file:///D:/Application/examppp/htdocs/capcipcup/docs/panduan-lengkap/05_PANDUAN_RUNNING_DAN_TROUBLESHOOTING.md)
   - Cara menjalankan kedua server (Next.js Port 3000 & Python FastAPI Port 8000).
   - Cara menyetel token `GEMINI_API_KEY` di `.env.local`.
   - Solusi kendala umum (izin webcam, mikrofon, port bentrok).

---

## ⚡ Quick Start Checklist (Ringkas dalam 1 Menit)

| Periksa | Status Saat Ini | URL Pengujian |
|---|---|---|
| **Next.js Frontend & API** | 🟢 **RUNNING (Port 3000)** | [http://localhost:3000](http://localhost:3000) |
| **Python FastAPI Microservice** | 🟢 **RUNNING (Port 8000)** | [http://localhost:8000/health](http://localhost:8000/health) |
| **Database MariaDB** | 🟢 **CONNECTED** | `10.80.80.3:3306` (`capcipcup-db`) |
| **Seeded Demo Room PIN** | 🟢 **ACTIVE** | PIN: `EDU889` |
| **Seeded Superadmin** | 🟢 **ACTIVE** | `superadmin` / `admin123` |
| **Seeded Guru** | 🟢 **ACTIVE** | `guru` / `guru123` |
| **Seeded Siswa** | 🟢 **ACTIVE** | `siswa` / `siswa123` |

