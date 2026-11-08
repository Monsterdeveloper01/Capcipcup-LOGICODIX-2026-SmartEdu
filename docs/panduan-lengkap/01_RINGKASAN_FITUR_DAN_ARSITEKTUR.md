# 01. Ringkasan Fitur & Arsitektur Sistem LinguaQuest

Dokumen ini memuat seluruh inventaris komponen, endpoint API, skema database, dan arsitektur Hybrid AI yang telah dibuat untuk **LinguaQuest (DuniaKata)**.

---

## 1. Arsitektur Hybrid AI (Python FastAPI + Gemini API)

Aplikasi ini menggunakan pendekatan **Hybrid AI** untuk mengatasi masalah latensi kamera dan menghemat biaya token API hingga 75%:

```
+---------------------------------------------------------------------------------------+
|                             USER INTERFACE (NEXT.JS 16)                               |
|                     Aliran Desain: Neo-Brutalism (Anti-AI Slop)                       |
+---------------------------+-----------------------------------------------+-----------+
                            |                                               |
             (Tugas Cepat / Real-time: 0 Token)              (Tugas Penalaran Kompleks)
                            |                                               |
                            v                                               v
+-------------------------------------------------------+ +-----------------------------+
|               BACKEND PYTHON FASTAPI                  | |       GOOGLE GEMINI API     |
|                     (PORT 8000)                       | |     (gemini-2.5-flash)      |
+-------------------------------------------------------+ +-----------------------------+
| 1. YOLO Nano Object Detection:                        | | 1. Quest & Quiz Generator:  |
|    - Mengenali benda kamera di meja/ruangan.          | |    - Membuat skenario kasus |
|    - Menghitung koordinat bounding box [x1,y1,x2,y2]. | |      dan kuis pilgan dari   |
| 2. Kamus Kosakata & Fonetik Instan:                   | |      nama benda (teks saja).|
|    - Mengeluarkan IPA phonetics & kata sifat.         | | 2. Dynamic NPC Roleplay:    |
| 3. Speech Metrics Deterministik:                      | |    - Dialog percakapan NPC  |
|    - Menghitung WPM (Words Per Minute).               | |      sesuai persona kasus.  |
|    - Mendeteksi filler words ("umm", "uh", "anu").    | | 3. CEFR Autopsy Evaluator:  |
|    - Mengukur vocab hit rate (kosakata wajib).        | |    - Analisis grammar &     |
|                                                       | |      Native-like Upgrade.   |
+-------------------------------------------------------+ +-----------------------------+
                            |                                               |
                            +-----------------------+-----------------------+
                                                    |
                                                    v
                                  +-----------------------------------+
                                  |         DATABASE MARIADB          |
                                  |       10.80.80.3:3306             |
                                  |         (capcipcup-db)            |
                                  +-----------------------------------+
```

---

## 2. Inventaris File & Endpoint yang Telah Dibuat

### A. Backend Python Microservice (`backend-python/`)
- [`backend-python/main.py`](file:///D:/Application/examppp/htdocs/capcipcup/backend-python/main.py): Server utama FastAPI yang menjalankan model YOLO Nano, endpoints `/python-api/detect-object` dan `/python-api/analyze-speech-metrics`.
- [`backend-python/requirements.txt`](file:///D:/Application/examppp/htdocs/capcipcup/backend-python/requirements.txt): Dependensi Python (`fastapi`, `uvicorn`, `ultralytics`, `pillow`, `python-multipart`, `pydantic`).

### B. Client Helper Next.js (`src/lib/`)
- [`src/lib/python-api.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/python-api.ts): Helper TypeScript untuk memanggil Python FastAPI (`http://localhost:8000`) dengan *fallback* aman jika server Python offline.
- [`src/lib/ai/client.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/ai/client.ts): Fondasi Google GenAI dengan dynamic token loader dari `.env.local`.
- [`src/lib/db.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/db.ts): Connection pool MariaDB (`mysql2/promise`).
- [`src/lib/auth/types.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/auth/types.ts): Tipe data pengguna dan hak akses peran (*Role-Based Access Control*).

### C. Route Handlers Next.js (`src/app/api/`)
1. **Autentikasi:**
   - [`POST /api/auth/login`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/auth/login/route.ts): Validasi kredensial pengguna ke MariaDB dan penyimpanan cookie sesi.
   - [`POST /api/auth/logout`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/auth/logout/route.ts): Menghapus cookie sesi secara aman.
   - [`GET /api/auth/me`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/auth/me/route.ts): Mengambil profil pengguna yang sedang aktif.
2. **Superadmin:**
   - [`GET /api/admin/stats`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/admin/stats/route.ts): Metrik telemetri platform dan audit infrastruktur.
   - [`GET, POST /api/admin/users`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/admin/users/route.ts): CRUD manajemen akun pengguna MariaDB.
3. **Misi & Game Engine:**
   - [`POST /api/generate-quest`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/generate-quest/route.ts): Merancang studi kasus, kuis, dan karakter NPC dari topik atau deteksi objek YOLO.
   - [`GET /api/quests/[id]`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/quests/[id]/route.ts): Memuat detail quest berdasarkan ID atau PIN Room.
   - [`POST /api/roleplay-chat`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/roleplay-chat/route.ts): Dialog NPC berbasis teks & metrik Python WPM.
   - [`POST /api/evaluate`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/evaluate/route.ts): Menggabungkan skor kuis dan speaking menjadi rapor CEFR.
   - [`GET /api/submissions/[id]`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/submissions/[id]/route.ts): Mengambil hasil evaluasi siswa.
   - [`GET /api/teacher/room/[code]`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/api/teacher/room/[code]/route.ts): Mengambil data live submission kelas untuk proyektor guru.

### D. Halaman Antarmuka (Pages)
- [`/`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/page.tsx): Beranda utama dengan pemilih Mode 1 (Room Kelas), Mode 2 (Solo Explorer), dan dashboard multi-role.
- [`/teacher/create`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/teacher/create/page.tsx): Form guru membuat room kelas dengan PIN 6-digit.
- [`/teacher/room/[code]`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/teacher/room/[code]/page.tsx): Live Dashboard proyektor guru dengan PIN raksasa dan leaderboard real-time.
- [`/room/join`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/room/join/page.tsx): Portal murid memasukkan 6-digit PIN & nama lengkap.
- [`/solo/create`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/solo/create/page.tsx): Pembuat soal & misi mandiri via scan kamera atau topik kustom.
- [`/play/[questId]`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/play/[questId]/page.tsx): Unified Game Engine (Stage 1: Pre-Quiz -> Stage 2: YOLO Scan -> Stage 3: Voice Arena).
- [`/result/[subId]`](file:///D:/Application/examppp/htdocs/capcipcup/src/app/result/[subId]/page.tsx): Rapor evaluasi akhir CEFR & Native Upgrade.

### E. Komponen Game & Desain
- [`src/components/game/QuizStage.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/game/QuizStage.tsx): Pilihan ganda interaktif dengan kunci jawaban.
- [`src/components/game/CameraScanner.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/game/CameraScanner.tsx): Kamera dengan bounding box YOLO overlay.
- [`src/components/game/VocabCardModal.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/game/VocabCardModal.tsx): Kartu item kosakata RPG popup dengan audio pengucapan.
- [`src/components/game/RoleplayArena.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/game/RoleplayArena.tsx): Dialog suara NPC, Live WPM Meter, dan Bisikan AI.
- [`src/components/linguaquest/admin/SuperadminDashboardView.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/linguaquest/admin/SuperadminDashboardView.tsx): Dashboard manajemen Superadmin.
- [`src/components/linguaquest/auth/LoginView.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/linguaquest/auth/LoginView.tsx): Layar login brutalist dengan 1-klik role login.

---

## 3. Skema Database MariaDB

Tabel-tabel berikut telah dibuat dan aktif di MariaDB:
1. `users`: Menyimpan data akun pengguna (id, name, username, email, password, role, xp, level, streak_days).
2. `quests`: Menyimpan skenario misi studi kasus, PIN room kelas, cerita NPC, target kosakata, dan kuis pilihan ganda.
3. `submissions`: Menyimpan hasil pengerjaan murid (skor kuis, transkrip obrolan, metrik WPM Python, skor speaking, total skor, grade CEFR, feedback AI).
4. `scanned_items`: Menyimpan riwayat benda fisik yang berhasil di-scan oleh kamera.
5. `class_misconceptions`: Menyimpan radar agregasi pola kesalahan berbicara sekelas.
