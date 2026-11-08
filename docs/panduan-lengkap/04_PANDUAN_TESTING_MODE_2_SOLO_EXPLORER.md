# 04. Panduan Pengujian Mode 2: Solo Explorer Mode (Mandiri)

Mode 2 ditujukan bagi pelajar mandiri yang ingin berlatih berbicara bahasa Inggris secara personal tanpa perlu menunggu guru membuka room kelas. Siswa dapat memindai benda apa pun di sekitar mereka untuk membuat kuis dan studi kasus darurat secara instan.

---

## 1. Membuka Halaman Solo Explorer

1. Buka browser di **`http://localhost:3000`**.
2. Pada kartu kanan **`[MODE 2: SOLO EXPLORER MODE]`**, klik tombol kuning **`[ MULAI SOLO EXPLORER INSTAN ]`** (atau langsung akses URL: [`/solo/create`](http://localhost:3000/solo/create)).
3. Pada halaman ini, terdapat 2 opsi metode pembuatan studi kasus:
   - **Pilihan A: Scan Benda di Sekitarmu (YOLO Camera Scan)**
   - **Pilihan B: Ketik Topik Latihan Kustom**

---

## 2. Pengujian Pilihan A: Scan Benda Kamera Nyata

1. Pilih tab **`[ PILIHAN A: SCAN BENDA DI SEKITARMU (YOLO) ]`**.
2. Masukkan nama panggilan Anda pada kolom *"Nama Panggilanmu"*, misalnya: `Arka`.
3. Pilih tingkat kesulitan CEFR: `B1 (Intermediate)`.
4. Klik tombol **`[ NYALAKAN KAMERA SEKARANG ]`** dan izinkan akses webcam pada browser.
5. Letakkan 1 atau 2 benda nyata di depan kamera (misalnya: botol minum, buku, cangkir, atau ponsel).
6. Klik tombol kuning **`[ 📸 SCAN BENDA DI KAMERA DENGAN YOLO ]`**.
7. **Ekspektasi:**
   - Model Ultralytics YOLO pada microservice Python mendeteksi benda tanpa memakan token API.
   - Kotak batas (*Bounding Box*) berwarna kuning muncul membingkai benda dengan label dan persentase keyakinan (misal: `BOTTLE (94%)`).
   - Pop-up modal kartu kosakata muncul dengan simbol IPA, tombol audio pelafalan, dan daftar kata sifat yang harus dipakai.
8. Klik tombol **`[ LANJUT KE ARENA ]`**.
9. Sistem memanggil `/api/generate-quest` secara otomatis dan mengarahkan Anda ke **Unified Game Engine** (`/play/[questId]`).

---

## 3. Pengujian Pilihan B: Ketik Topik Latihan Kustom

Jika webcam tidak tersedia atau Anda ingin skenario khusus:
1. Pilih tab **`[ PILIHAN B: KETIK TOPIK LATIHAN KUSTOM ]`**.
2. Pada kolom *"Topik Skenario yang Ingin Kamu Latih"*, Anda dapat:
   - Mengetik topik sendiri, misalnya: `"Job Interview for Software Engineer at Google Singapore"` atau `"Handling Guest Luggage in 5-Star Hotel"`.
   - Atau klik salah satu tombol contoh cepat:
     - `[ Eco-Friendly Pitch ]`
     - `[ Hotel Complaint ]`
     - `[ Indonesian Batik ]`
3. Klik tombol kuning **`[ BUAT MISI & MULAI PRE-QUIZ ]`**.
4. Sistem langsung men-generate skenario studi kasus yang relevan dan membawa Anda ke Pre-Quiz.

---

## 4. Alur Permainan di Unified Game Engine (`/play/[questId]`)

Siswa akan menyelesaikan 3 tahap terintegrasi:

```
[TAHAP 1: PRE-QUIZ] --------> [TAHAP 2: YOLO SCAN] --------> [TAHAP 3: ARENA ROLEPLAY]
Pilihan ganda kontekstual    Verifikasi benda fisik nyata      Dialog suara + WPM Python
```

### Tips Pengujian Percakapan Suara di Arena:
- Pastikan mikrofon laptop/HP aktif.
- Saat menekan tombol mikrofon (berkedip merah), gunakan salah satu kata sifat yang direkomendasikan kartu (misal: *durable*, *portable*, *eco-friendly*).
- Amati indikator telemetri di atas arena:
  - **Python WPM Meter:** Mengukur kecepatan bicara (standar normal bahasa Inggris: 90–120 WPM).
  - **Target Vocab Hit:** Berubah menjadi hijau begitu kata target berhasil diucapkan.
  - **Bisikan AI:** Muncul otomatis jika Anda membutuhkan panduan kalimat berikutnya.

---

## 5. Lembar Rapor Evaluasi Akhir (`/result/[subId]`)

Setelah menekan tombol **`[ SELESAI & RAPOR ]`**:
1. Layar menampilkan efek konfeti kelulusan misi.
2. Muncul evaluasi mendalam berstandar CEFR:
   - **CEFR Grade Stamp:** `A2`, `B1`, atau `B2`.
   - **Skor Total:** Rata-rata terbobot antara Kuis Pilgan dan Percakapan Speaking.
   - **Native-like Upgrade:** Menampilkan kalimat yang Anda ucapkan vs perbaikan kalimat yang lebih idiomatis dan alami.
   - **Kelebihan & Area Peningkatan:** Rangkuman objektif untuk bahan belajar selanjutnya.
3. Klik **`[ SELESAI & KEMBALI KE MENU UTAMA ]`** untuk kembali ke beranda.
