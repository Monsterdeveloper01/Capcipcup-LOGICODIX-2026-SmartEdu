# Daftar Fitur Software: Capcipcup SmartEdu (LinguaQuest / DuniaKata)

Dokumen ini mendokumentasikan **seluruh fitur fungsional yang telah dibuat dan aktif** di dalam aplikasi **LinguaQuest (DuniaKata)** pada platform **Capcipcup SmartEdu**.

---

## DAFTAR ISI
1. [Fitur Sisi Siswa (Student & Player RPG Experience)](#1-fitur-sisi-siswa-student--player-rpg-experience)
2. [Fitur Sisi Guru (AI Classroom Game Master & Co-Pilot)](#2-fitur-sisi-guru-ai-classroom-game-master--co-pilot)
3. [Fitur Sisi Superadmin (Control Tower & Infrastruktur)](#3-fitur-sisi-superadmin-control-tower--infrastruktur)
4. [Fitur Autentikasi & Keamanan (Role-Based Access Control)](#4-fitur-autentikasi--keamanan-role-based-access-control)
5. [Fitur Mode Khusus Demo & Kolaborasi Kelas](#5-fitur-mode-khusus-demo--kolaborasi-kelas)
6. [Fitur Desain Antarmuka (UI/UX Neo-Brutalisme Terang)](#6-fitur-desain-antarmuka-uiux-neo-brutalisme-terang)
7. [Fitur Fondasi AI & Arsitektur Backend](#7-fitur-fondasi-ai--arsitektur-backend)
8. [Fitur Unggulan Hackathon (6 Inovasi Kunci Jawaban Evaluasi Juri)](#8-fitur-unggulan-hackathon-6-inovasi-kunci-jawaban-evaluasi-juri)

---

## 1. Fitur Sisi Siswa (Student & Player RPG Experience)

### A. Dua Pilihan Mode Masuk Utama
1. **Mode 1: Room Kelas PIN 6-Digit (`/room/join`)**
   - Siswa memasukkan 6 digit PIN unik yang dibuat oleh guru kelas.
   - Seluruh aktivitas scan benda dan nilai berbicara siswa tersinkronisasi otomatis ke dashboard guru.
2. **Mode 2: Solo Explorer Mode (`/solo/create`)**
   - Siswa bermain mandiri kapan saja tanpa perlu menunggu guru.
   - Memindai benda di meja kamar/rumah atau memilih topik latihan sendiri untuk langsung menantang NPC AI.

### B. "Object-to-Inventory" (AI Vision Camera Scanner)
- **Kamera Langsung & Unggah Gambar:** Dukungan penuh untuk kamera webcam real-time (laptop/smartphone) serta pengunggahan file foto fisik.
- **Deteksi Objek Nyata Multimodal:** Memindai 2 hingga 4 benda nyata di sekitar siswa (misal: botol minum, pulpen, buku catatan, kacamata, cangkir kopi).
- **Konversi Otomatis Menjadi Kartu Item RPG:**
  - **Nama Objek Dwibahasa:** Bahasa Indonesia & kosakata bahasa Inggris natural.
  - **Simbol Fonetik IPA:** Transkripsi pengucapan akurat internasional (contoh: `/ˈwɔːtər ˈbɒtəl/`).
  - **Audio Pelafalan (TTS):** Tombol speaker untuk mendengarkan pelafalan asli kata tersebut.
  - **Idiom Bahasa Inggris:** Menampilkan idiom atau frasa umum bahasa Inggris yang memuat benda tersebut beserta artinya.
  - **Atribut RPG Unik:** Memberikan fungsi fiksi game (contoh: *Hydration Flask: Restores 30 NPC Patience*).

### C. 4 Mode Permainan RPG
1. **Mode 1: Survival & Adventure RPG (Target: SD – SMA)**
   - Tema petualangan bertahan hidup di pulau terpencil/dungeon. Siswa harus membujuk NPC Penjaga Gerbang menggunakan benda hasil scan sebagai alat barter.
2. **Mode 2: SMK & Career Simulator (Target: SMK Vokasi & Bisnis)**
   - Tema perhotelan dan layanan pelanggan profesional. Siswa menghadapi tamu VIP asing yang komplain dan harus menegosiasikan kompensasi.
3. **Mode 3: Local Pride Ambassador (Target: Budaya & Ekspor)**
   - Tema diplomasi budaya nusantara. Siswa menjelaskan produk lokal, kuliner, atau warisan nusantara kepada travel blogger internasional.
4. **Mode 4: Classroom Boss Raid (Target: Satu Kelas Kolaboratif)**
   - Seluruh siswa bersatu dalam mode proyektor untuk mengalahkan Boss Titan Polusi menggunakan argumen inovasi ramah lingkungan.

### D. Dynamic Quest Synthesis (Generator Misi Darurat)
- AI menyintesis benda yang di-scan menjadi skenario darurat unik dan tidak pernah berulang.
- Dilengkapi karakter NPC dengan nama, peran, avatar visual, batasan waktu (*countdown timer*), dan **Kosakata Wajib Bicara** (*Target Vocabulary*).

### E. Live Coaching HUD (Heads-Up Display)
- **Arcade Rapport Health Bar (0–100%):** Indikator kepuasan/keberhasilan rayuan kepada NPC yang naik atau turun sesuai kelancaran berbicara siswa.
- **Interaksi Suara Dua Arah (Voice-to-Voice):**
  - **Speech-to-Text (STT):** Siswa berbicara langsung ke mikrofon menggunakan Web Speech API (English US).
  - **Text-to-Speech (TTS):** Karakter NPC AI membalas langsung secara audio bersuara.
- **Scanned Items Tray with Spoken Detection Glow:** Kartu item di layar otomatis menyala (*glow*) dan tercentang ketika kosakatanya berhasil diucapkan dalam kalimat siswa.
- **Bisikan AI (Smart Floating Hint):** Muncul kartu bantuan melayang di layar jika siswa terdiam >3 detik atau mengalami kebingungan kata (*code-switching*) tanpa memutus alur permainan.
- **Input Alternatif Keyboard:** Siswa tetap dapat berpartisipasi dengan mengetik jika perangkat tidak memiliki mikrofon.

### F. Post-Game CEFR Replay & Autopsy (Rapor Diagnostik Siswa)
- **Penilaian 4 Pilar Standar CEFR:**
  - *Fluency* (Kelancaran berbicara) %
  - *Pronunciation* (Pelafalan kata kunci) %
  - *Vocabulary Usage* (Pemakaian kosakata target) %
  - *Grammar Accuracy* (Ketepatan tata bahasa) %
- **Penentuan Level CEFR Otomatis:** Menghasilkan predikat level resmi (`A1`, `A2`, `B1`, `B2`).
- **Native-Like Upgrade:** Menampilkan perbandingan kalimat asli siswa vs versi kalimat bahasa Inggris yang lebih alami/native beserta alasannya.
- **Analisis Kekuatan & Kelemahan:** Rangkuman poin kelebihan (*Strengths*) dan area yang perlu ditingkatkan (*Areas to Improve*).
- **Sistem Gamifikasi XP & Level:** Reward perolehan poin XP dan penambahan *streak days*.

---

## 2. Fitur Sisi Guru (AI Classroom Game Master & Co-Pilot)

### A. Curriculum-to-Quest Generator (RPP to Game dalam 10 Detik)
- Mengonversi teks Capaian Pembelajaran (CP/ATP) Kurikulum Merdeka atau silabus buku teks menjadi misi game kamera.
- **Input Guru:** Tingkat kelas (SMP/SMA/SMK), topik materi speaking, dan target kosakata yang ingin dikunci.
- **Output AI:** Skenario misi darurat, karakter NPC penguji, aturan dialog, dan daftar rekomendasi benda nyata di sekitar siswa yang harus dipindai.

### B. 30-Seconds Speaking Grader (Asisten Penilai Otomatis)
- Merekap dan menilai kemampuan berbicara hingga 35-40 siswa secara instan dari database MariaDB tanpa guru perlu mendengarkan rekaman puluhan jam.
- **Tabel Nilai Terperinci:** Menampilkan Nama Siswa, Judul Quest, Level CEFR, Nilai Keseluruhan, Fluency, Pronunciation, Vocabulary, dan Grammar.
- Tombol sinkronisasi real-time untuk memperbarui data rekaman yang baru selesai dimainkan siswa.

### C. Class Misconception Heatmap (Peta Kelemahan Sekelas)
- Menganalisis agregasi pola kesalahan berbicara satu kelas (misal: persentase siswa yang ragu pada *Simple Past*, frekuensi *code-switching* "anu apa ya...", atau repetisi kata monoton).
- **Generator Kuis Pemanasan 5 Menit (1-Klik):** Menghasilkan latihan *rapid-fire echo speaking* siap pakai di awal jam pelajaran berikutnya berdasarkan titik lemah kolektif yang terdeteksi.

### D. Shyness vs Skill Diagnostic Matrix
- Membedakan siswa yang pasif karena malu vs siswa yang belum paham materi melalui 4 kuadran analitis:
  - **Kuadran A (Malu / Takut Salah):** Grammar tinggi (>80%) tetapi durasi jeda lama (>4 detik).
  - **Kuadran B (Pemberani tapi Salah Konsep):** Bicara sangat cepat tanpa jeda, namun akurasi grammar rendah.
  - **Kuadran C (Natural Communicator):** Kelancaran dan grammar seimbang tinggi (>80%).
  - **Kuadran D (Butuh Pendampingan Dasar):** Durasi jeda tinggi dan kosakata terbatas.
- Menyediakan rekomendasi solusi pedagogis langsung untuk masing-masing kuadran.

### E. Pembuat Room Kelas Berbasis PIN (`/teacher/create`)
- Form pembuatan room kelas dengan pilihan topik kuis dan pengaturan waktu misi.

---

## 3. Fitur Sisi Superadmin (Control Tower & Infrastruktur)

### A. Manajemen Pengguna Terpusat (User Management)
- Melihat seluruh daftar akun yang tersimpan nyata di tabel `users` MariaDB.
- **Tambah Akun Baru:** Modal pop-up untuk membuat akun Siswa, Guru, atau Superadmin baru lengkap dengan enkripsi password.
- **Ubah Peran Real-Time:** Dropdown untuk mengubah role akun (`student`, `teacher`, `superadmin`) secara langsung tanpa membuka database client.
- **Hapus Akun:** Menghapus data akun pengguna dari sistem dengan konfirmasi keamanan.

### B. Telemetri & Metrik Sistem
- Pemantauan metrik langsung:
  - Jumlah Total Pengguna (jumlah Siswa dan Guru).
  - Total Sesi Speaking Tercatat & Rata-rata Skor Nilai Kelas.
  - Total Benda Scan Tersimpan di database.
  - Total Quest RPG Aktif.

### C. Audit Infrastruktur & AI Engine
- Status konektivitas database MariaDB (`10.80.80.3:3306`).
- Status konfigurasi AI Vision Engine (Gemini API SDK).

---

## 4. Fitur Autentikasi & Keamanan (Role-Based Access Control)

### A. Autentikasi Terintegrasi Database MariaDB
- Endpoint login (`POST /api/auth/login`) yang memverifikasi kredensial asli.
- Session cookie aman (`lq_session_user`) dengan masa aktif 7 hari.
- Endpoint validasi sesi aktif (`GET /api/auth/me`).
- Endpoint keluar akun (`POST /api/auth/logout`).

### B. Isolasi Hak Akses (Strict RBAC Guarding)
- **Tamu / Belum Login:** Tab Guru dan Superadmin otomatis disembunyikan dari navbar. Jika mencoba membuka URL guru/admin, muncul layar proteksi *Access Denied Gate* yang mewajibkan login.
- **Role Siswa (`student`):** Hanya dapat mengakses antarmuka permainan siswa. Tab Guru dan Superadmin disembunyikan.
- **Role Guru (`teacher`):** Mengakses seluruh perangkat guru (RPP Quest Gen, Grader, Heatmap) serta preview siswa. Tab Superadmin disembunyikan.
- **Role Superadmin (`superadmin`):** Memiliki hak root penuh untuk mengakses Control Tower, manajemen database user, dan mengaudit seluruh dashboard.

### C. Fasilitas Login Cepat 1-Klik (Frictionless Evaluator Speed)
- Disediakan tombol 1-klik untuk login sebagai:
  - **Siswa:** `siswa` atau `siswa1` (password: `siswa123`)
  - **Guru:** `guru` atau `guru1` (password: `guru123`)
  - **Superadmin:** `superadmin` atau `admin` (password: `admin123`)

---

## 5. Fitur Mode Khusus Demo & Kolaborasi Kelas

### A. Classroom Boss Raid (Mode Proyektor Papan Tulis)
- Dirancang untuk 1 laptop guru yang dihubungkan ke proyektor kelas.
- Pertarungan interaktif melawan **Titan Smog** (Boss Monster Polusi) dengan Health Bar 100 HP.
- Siswa bergiliran berdiri dan berbicara ke arah mikrofon laptop guru untuk menyerang boss menggunakan argumen ramah lingkungan.
- Boss AI membalas argumen dengan suara audio via TTS.
- Efek visual confetti saat boss berhasil dikalahkan oleh suara siswa satu kelas.

### B. Dual-Screen Live Sync (Split Screen Demo View)
- Menampilkan simulasi 2 layar sekaligus dalam 1 tampilan untuk demonstrasi juri:
  - **Layar Kiri:** Simulasi layar HP Siswa (Webcam vision & interaksi spoken HUD).
  - **Layar Kanan:** Simulasi layar Laptop Guru (Pemantauan nilai siswa & Heatmap kelas secara real-time).

---

## 6. Fitur Desain Antarmuka (UI/UX Neo-Brutalisme Terang)

- **Standar Desain Bersih (Light Theme Neo-Brutalist):** Latar belakang cerah (`#f8fafc`), kartu putih solid, garis tepi hitam tebal 2px, dan bayangan offset tajam (`shadow-[4px_4px_0px_#000000]`) tanpa efek blur gelap (*anti-AI slop*).
- **Tipografi Berkontras Tinggi:** Pembagian hierarki teks yang jelas menggunakan font sans-serif modern dan font mono untuk metadata.
- **Micro-Interactions Tactile:** Tombol mekanis dengan umpan balik visual saat ditekan (*press/crunch feedback*).
- **Indikator Gamifikasi:** Tampilan badge Level, XP counter, dan Streak Days di navbar.
- **Desain Responsif:** Optimal digunakan di layar ponsel, tablet, monitor laptop, maupun proyektor layar lebar.

---

## 7. Fitur Fondasi AI & Arsitektur Backend

### A. Optimasi Latensi Rendah (Gemini 3.1 Flash-Lite)
- Menggunakan model **`gemini-3.1-flash-lite`** sebagai prioritas utama.
- **Waktu Eksekusi Scan Vision:** ~1.4 detik.
- **Waktu Balasan Spoken NPC:** ~1.1 detik.
- Menghasilkan format Structured Outputs (Strict JSON) secara konsisten.

### B. Multi-Tier AI Fallback Cascade
- Jika salah satu model AI mengalami lonjakan trafik (*503 High Demand Spike*), sistem otomatis mengalirkan request ke model cadangan:
  1. `gemini-3.1-flash-lite` (Prioritas Utama - Paling Cepat)
  2. `gemini-3.5-flash`
  3. `gemini-3.7-flash`
  4. `gemini-3.8-flash`
- Dilengkapi fallback cerdas deterministik sehingga aplikasi tidak akan pernah menampilkan layar putih/error 500 saat terjadi kendala koneksi internet.

### C. Arsitektur Hybrid Python + Next.js
- **Python FastAPI Microservice (Port 8000):** Menjalankan ekstraksi fitur audio/teks (WPM counter, pencocokan target vocab, dan deteksi kata jeda/filler).
- **Next.js App Router (Port 3000):** Menangani routing antarmuka pengguna, proteksi server-side token API, dan operasi database MariaDB.
- **Keamanan Token Server-Side:** Token AI (`GEMINI_API_KEY`) dan kredensial database tersimpan aman di environment server dan tidak pernah terpapar ke client browser.

---

## 8. Fitur Unggulan Hackathon (6 Inovasi Kunci Jawaban Evaluasi Juri)

Fitur-fitur ini dibangun khusus untuk melengkapi seluruh celah evaluasi pedagogis dan kompetisi teknologi:

### 1. Custom Case & Quiz Builder Mandiri (Manual + AI)
- **Lokasi Akses:** `/teacher/create` (Mode Guru) dan `/solo/create` (Mode Solo Explorer).
- **Dua Pilihan Fleksibel:**
  - **Mode A (⚡ AI Auto-Generate Draf):** Cukup ketik topik materi (misal: *Sustainable Hospitality*), AI merancang draf skenario kasus dan 3 butir soal kuis dalam 1 detik. Guru/siswa bebas mengedit teks sebelum menyimpan.
  - **Mode B (✍️ Manual Builder Kontrol Penuh):** Guru/siswa merancang sendiri judul kasus, skenario situasi darurat, nama & persona NPC, kosakata wajib, serta membuat butir soal kuis pilihan ganda (pertanyaan, 4 opsi A/B/C/D, penentuan kunci jawaban, dan penjelasan edukasi).
- **Stage Pre-Quiz Interaktif:** Siswa mengerjakan 2–3 butir soal pengantar konsep sebelum masuk ke pemindaian kamera dan percakapan suara NPC.
- **Penyimpanan Nyata MariaDB:** Seluruh data kuis dan skenario tersimpan di tabel `quests`.

### 2. Modal "Bukti Transkrip & Detail Jawaban" di Tabel Guru
- **Lokasi Akses:** Tab *Speaking Grader* pada Dashboard Guru (`/teacher/room/[pin]`).
- **Interaksi:** Setiap baris nama siswa di tabel nilai dapat diklik secara interaktif.
- **Pop-Up Verbatim Stream:** Membuka modal yang menampilkan:
  - **Transkrip Dialog Asli:** Rekaman kata demi kata percakapan murid melawan NPC AI yang diambil langsung dari kolom `transcript_json` database MariaDB.
  - **Native-Like Upgrade Comparison:** Memperlihatkan kalimat mana yang diucapkan murid beserta saran versi bahasa Inggris yang lebih alami dan penjelasan tata bahasanya.
  - **Rincian Kekuatan & Kelemahan:** Penjelasan pedagogis terperinci mengenai mengapa nilai kelancaran atau tata bahasa murid tersebut berada di level tertentu.

### 3. Buku Koleksi Kartu / Vocab Pokedex ("My Inventory Deck")
- **Lokasi Akses:** Tombol permanen `[ 🎒 BUKU KOLEKSI KATA (POKEDEX) ]` di layar siswa (`StudentGameView`).
- **Penyimpanan Persisten:** Menggunakan `localStorage` (`lq_inventory_deck`), sehingga kartu benda yang pernah dipindai tetap tersimpan dan tidak hilang meskipun siswa menutup peramban.
- **Fitur Kartu:**
  - Menampilkan nama benda Indonesia dan bahasa Inggris formal.
  - Simbol fonetik IPA internasional lengkap dengan **tombol audio TTS** untuk memutar pelafalan asli.
  - Idiom bahasa Inggris relevan beserta konteks maknanya.
  - Atribut gamifikasi RPG (+XP, status bonus).
  - **Pencarian Real-Time:** Filter pencarian instan berdasarkan kata Indonesia, kata Inggris, atau idiom.

### 4. Export Rekap Nilai ke e-Rapor (.CSV / Kurikulum Merdeka)
- **Lokasi Akses:** Tombol `[ 📥 EXPORT E-RAPOR (.CSV) ]` di header tabel Speaking Grader Guru.
- **Format Output:** File `.csv` UTF-8 yang dapat langsung dibuka di Microsoft Excel, Google Sheets, maupun diimpor ke sistem administrasi sekolah / e-Rapor Kurikulum Merdeka.
- **Kolom Standar Sekolah:**
  - Nama Siswa, Judul Quest, Predikat CEFR, Skor Total, Kelancaran (Fluency %), Pelafalan (Pronunciation %), Kosakata (Vocabulary %), Tata Bahasa (Grammar %), Durasi Jeda (Detik), Frekuensi Code-Switching, Tanggal & Waktu Sesi, serta Catatan Kemampuan Berbicara.

### 5. Safe-School Shield (AI Child-Safety & Hazard Guardrail)
- **Protokol Keamanan Sekolah:** Mencegah penyalahgunaan kamera dan mikrofon oleh siswa di lingkungan sekolah.
- **Deteksi Objek Berbahaya (Camera Vision Guardrail):**
  - Jika siswa mengarahkan kamera ke benda tajam (pisau, gunting berlebih), api/rokok, atau benda tidak pantas lainnya, sistem otomatis menolak memproses gambar.
  - Menampilkan modal pop-up darurat bertema peringatan merah: `[ ⚠️ SAFE-SCHOOL SHIELD: BENDA BERBAHAYA TERDETEKSI ]` lengkap dengan nama objek dan penjelasan edukatif dari AI mengapa benda tersebut tidak diperbolehkan.
- **Filter Ujaran Tidak Pantas (Spoken Speech Guardrail):**
  - Jika siswa mengucapkan kata kasar, ujaran kebencian, atau kalimat tidak pantas kepada NPC, AI otomatis memotong poin Rapport (-20 poin) dan menampilkan banner peringatan edukatif.

### 6. Fitur "Lupa Kosakata / Code-Switching Rescue" (ID -> EN)
- **Mengatasi Kecemasan Berbicara (Speaking Anxiety Rescue):** Siswa pemula di Indonesia sering kali ragu berbicara karena lupa 1 kata bahasa Inggris di tengah kalimat.
- **Tombol SOS Cepat:** Tombol `[ 💡 SOS: LUPA KATA (ID -> EN) ]` di samping tombol mikrofon. Siswa cukup mengetik kata Indonesia yang ingin ditanyakan (contoh: *talenan*, *wadah*, *timbangan*), dan sistem langsung memformat pertanyaan santun ke NPC.
- **Deteksi Otomatis AI:** Jika siswa menyelipkan kata bahasa Indonesia saat berbicara, NPC AI tidak menghukum murid, melainkan langsung mengajari kata bahasa Inggrisnya di dalam dialog (*conversational scaffolding*).
- **Banner Melayang Code-Switching Rescue:** Muncul kartu bantuan kuning di atas kolom bicara yang memuat:
  - Kata Indonesia yang terdeteksi vs istilah bahasa Inggris yang benar.
  - Tombol audio TTS untuk mendengarkan cara pengucapan istilah tersebut.
  - Tombol 1-klik `[ + SISIPKAN KE INPUT ]` untuk langsung menggunakan kata tersebut dalam dialog.
