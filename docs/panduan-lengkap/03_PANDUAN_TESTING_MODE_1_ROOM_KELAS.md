# 03. Panduan Pengujian Mode 1: Classroom Room Mode (Guru & Murid)

Mode 1 adalah solusi khusus untuk mengatasi tantangan **Rasio Mengajar 1:35** di sekolah Indonesia. Guru dapat membuat room studi kasus kelas dengan PIN 6-digit, lalu 35 siswa bergabung menggunakan HP masing-masing untuk mengerjakan misi dan berbicara bahasa Inggris.

---

## 1. Skenario Sisi Guru: Membuat Room Kelas Baru

1. Buka browser di **`http://localhost:3000`**.
2. Pada kartu kiri **`[MODE 1: ROOM KELAS GURU/MURID]`**, klik tombol **`[ BUAT ROOM GURU ]`** (atau langsung akses URL: [`/teacher/create`](http://localhost:3000/teacher/create)).
3. Isi form pembuatan room:
   - **Nama Pengajar:** `Budi Santoso, S.Pd`
   - **Topik Studi Kasus / RPP:** `Hospitality Service & Eco-Friendly Dining` (atau topik pilihan Anda)
   - **Tingkat Kelas:** `SMK Kelas 11 Perhotelan`
   - **Target CEFR:** `B1 (Intermediate)`
   - **PIN Room Generated:** Catat PIN yang muncul (misalnya: `EDU889` atau klik tombol `[ ACAK PIN ]`).
4. Klik tombol kuning **`[ BUAT ROOM & BUKA DASHBOARD KELAS ]`**.
5. **Ekspektasi:**
   - Next.js memanggil `/api/generate-quest` dengan mode `ROOM`.
   - Data studi kasus, karakter NPC, target kosakata, dan kuis pilihan ganda disimpan ke tabel `quests` di MariaDB.
   - Halaman otomatis dialihkan ke Dashboard Proyektor Guru di [`/teacher/room/[PIN]`](http://localhost:3000/teacher/room/EDU889).

---

## 2. Skenario Layar Proyektor Kelas Guru (`/teacher/room/[code]`)

1. Pada halaman [`/teacher/room/[code]`](http://localhost:3000/teacher/room/EDU889), layar ini dirancang untuk diproyeksikan ke papan tulis kelas:
   - Menampilkan **PIN 6-Digit Raksasa** (misal: **`EDU889`**) yang mudah dibaca siswa dari kejauhan.
   - Tombol salin PIN.
   - Papan peringkat nilai langsung (*Live Submissions Leaderboard*) dengan kolom:
     - Rank (#1, #2, #3, ...)
     - Nama Siswa
     - Skor Kuis Pilgan
     - Skor Speaking
     - Total Skor Gabungan
     - Grade CEFR (A1–C1)
     - Status Pengerjaan
2. **Polling Otomatis:** Halaman ini melakukan refresh data dari MariaDB setiap 5 detik secara otomatis. Begitu ada murid yang menyelesaikan sesi bicara di HP mereka, nama dan nilai murid tersebut langsung muncul seketika di papan nilai guru!

---

## 3. Skenario Sisi Murid: Bergabung ke Room via PIN

1. Buka tab baru di browser (atau gunakan mode Incognito / HP yang terhubung ke jaringan yang sama):
   - Akses URL: [`http://localhost:3000/room/join`](http://localhost:3000/room/join)
2. Masukkan kredensial kelas:
   - **6-Digit PIN Room:** Masukkan PIN room guru tadi (misal: `EDU889`).
   - *(Tips cepat: Anda dapat mengklik tombol `[ ⚡ 1-KLIK ISI DEMO PIN: EDU889 ]`)*.
   - **Nama Lengkap Siswa:** Masukkan nama murid (misal: `Faiz Ramadhan`).
3. Klik tombol **`[ MASUK KE ARENA SEKARANG ]`**.
4. **Ekspektasi:**
   - Sistem memvalidasi PIN ke database MariaDB.
   - Murid langsung diarahkan ke **Unified Game Engine** di URL:
     `/play/[questId]?subId=[submissionId]&name=Faiz%20Ramadhan`.

---

## 4. Alur Permainan Siswa di Game Engine (3 Tahap Terpadu)

Setelah murid masuk, murid akan melewati 3 tahap:

### Tahap 1: Pre-Quiz Kontekstual
- Murid membaca pertanyaan pilihan ganda terkait topik studi kasus.
- Pilih salah satu jawaban (A, B, C, atau D) lalu klik **`[ KUNCI JAWABAN ]`**.
- Penjelasan langsung muncul. Klik **`[ SELESAI & LANJUT KE SCAN KAMERA ]`**.

### Tahap 2: Pemindaian Kamera Objek Nyata (YOLO 0-Token)
- Kamera laptop/HP aktif.
- Arahkan kamera ke benda nyata di meja (misalnya **Botol Minum** atau **Buku**).
- Klik tombol **`[ 📸 SCAN BENDA DI KAMERA DENGAN YOLO ]`**.
- Model YOLO mendeteksi benda, menampilkan kotak penanda (*Bounding Box*), dan memunculkan pop-up **Kartu Item RPG**:
  - Nama kosakata bahasa Inggris (`Reusable Water Bottle`)
  - Simbol fonetik IPA (`/riːˈjuːzəbl ˈwɔːtər ˈbɒtl/`)
  - Tombol audio untuk mendengarkan pelafalan asli.
  - Daftar kata sifat (*Adjectives*) yang harus digunakan saat bicara.
- Klik tombol **`[ LANJUT KE ARENA ]`**.

### Tahap 3: Arena Roleplay Suara dengan Karakter NPC
- NPC menyapa dan menantang siswa dalam bahasa Inggris.
- Klik tombol **Mikrofon** (berkedip merah tanda suara sedang direkam) lalu bicaralah dalam bahasa Inggris:
  - *Contoh ucapan:* `"Hello Ms. Clara, I present this durable and eco-friendly reusable water bottle for students."`
- Klik **`[ KIRIM DIALOG ]`**.
- Perhatikan meteran telemetri di atas layar:
  - **Python WPM Meter:** Kecepatan bicara Anda dihitung seketika (misal: `105 WPM`).
  - **Target Vocab Hit:** Indikator kata kunci langsung menyala hijau (misal: `durable`, `eco-friendly`).
  - **Checklist Misi:** Tujuan misi otomatis tercentang.
  - NPC membalas dialog dengan tanggapan cerdas + tips tata bahasa.
- Setelah 2-3 giliran obrolan, klik tombol kuning **`[ SELESAI & RAPOR ]`**.

---

## 5. Verifikasi Rapor & Leaderboard Kelas

1. **Rapor Murid (`/result/[subId]`):**
   - Muncul Rapor Resmi CEFR (misal: `Grade B1`, Total Skor `88/100`).
   - Rincian Skor Kuis (40%) + Skor Speaking (60%).
   - Kotak **Native-like Upgrade** yang menunjukkan kalimat murid vs versi penutur asli yang lebih natural.
2. **Cek Kembali Layar Proyektor Guru (`/teacher/room/[PIN]`):**
   - Buka kembali tab Guru: Nama murid (`Faiz Ramadhan`) beserta nilai `88` dan Grade `B1` **sudah otomatis tercatat di papan leaderboard kelas**!

