# CAPCIPCUP SMARTEDU — 3D Virtual Science & Chemistry Laboratory
Platform Laboratorium Sains & Praktikum Reaksi Kimia Virtual Berbasis 3D WebGL, AR Hand Gesture Tracking, dan Evaluasi Kuis AI.

---

## 🌟 Fitur Utama Proyek

1. **Meja Laboratorium 3D Interaktif (`Three.js` + `@react-three/fiber`):**
   - Simulasi bejana kimia kaca transparan (Gelas Kimia / Beaker, Labu Erlenmeyer, Tabung Reaksi) dengan visual cairan berwarna, volume dinamis, dan efek reaksi sains (gelembung busa CO2, uap panas eksotermik, endapan presipitasi *Golden Rain*, perubahan warna indikator pH).
2. **Kontrol Gestur Tangan Kamera AR (`MediaPipe Tasks-Vision`):**
   - Siswa dapat mengarahkan telapak tangan ke webcam untuk membidik botol, mengepalkan tangan (*pinch/grab*) untuk mengangkat bejana, dan mendekatkan dua bejana untuk menuangkan (*tilt & pour*) cairan.
   - Dilengkapi fallback interaksi mouse drag-and-drop.
3. **Portal Guru: Pembuat Tugas Praktikum & Generator Kuis AI (`Gemini AI`):**
   - Guru memilih zat kimia dari katalog database terstruktur (SD, SMP, SMA).
   - Menetapkan instruksi observasi praktikum.
   - Sekali klik **`[ GENERATE KUIS DENGAN AI ]`**, Gemini AI otomatis merangkai soal observasi konseptual lengkap dengan 4 opsi pilihan ganda dan pembahasan ilmiah.
4. **Kak Lab-AI (Asisten Laboratorium Cerdas):**
   - Siswa dapat menanyakan konsep reaksi kimia, alasan terjadinya perubahan suhu/gas, dan edukasi keselamatan laboratorium K3 secara langsung saat bereksperimen.
5. **Database Lokal Terstruktur (MariaDB / MySQL):**
   - Mengelola akun guru & siswa, kelas, katalog zat kimia, matriks reaksi kimia, tugas laboratorium, dan riwayat nilai kuis siswa.

---

## 🚀 Panduan Menjalankan Proyek Secara Lokal

### 1. Prasyarat:
- Node.js versi 18+ atau 20+
- XAMPP / MariaDB aktif di port 3306

### 2. Konfigurasi Environment (`.env.local`):
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=capcipcup-db
DB_USER=root
DB_PASSWORD=

# Google Gemini API Key
GEMINI_API_KEY=masukkan_api_key_gemini_anda
```

### 3. Setup Database Otomatis:
Jalankan skrip migrasi database sekali saja untuk membuat tabel dan data demo:
```bash
node scripts/setup_local_db.js
```

### 4. Menjalankan Aplikasi:
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

---

## 📂 Struktur Direktori Proyek

```text
capcipcup/
├── public/
│   ├── models/hand_landmarker.task   # Model AI MediaPipe offline
│   └── wasm/                         # Modul WebAssembly vision
├── scripts/
│   └── setup_local_db.js             # Migrasi & seed database lab sains
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/                # Endpoint metrik sistem
│   │   │   ├── auth/                 # Autentikasi sesi
│   │   │   └── lab/
│   │   │       ├── assistant/        # Chatbot Asisten Lab AI
│   │   │       ├── generate-quiz/    # Generator Kuis Sains AI
│   │   │       ├── submissions/      # Pengumpulan nilai kuis siswa
│   │   │       └── tasks/            # Manajemen tugas praktikum guru
│   │   └── page.tsx                  # Halaman utama aplikasi
│   ├── components/
│   │   ├── 3d/                       # Komponen 3D sandbox
│   │   ├── camera/                   # Kamera WebRTC & HandGestureTracker
│   │   └── lab/
│   │       ├── ChemistryLabScene.tsx # Engine Meja 3D Lab Kimia
│   │       ├── SmartScienceLabViewer.tsx # Container utama Lab Sains
│   │       ├── TeacherTaskBuilder.tsx    # Form buat tugas guru + Kuis AI
│   │       ├── PostLabQuizModal.tsx      # Modal pengerjaan kuis siswa
│   │       └── AiLabAssistantModal.tsx   # Modal konsultasi Kak Lab-AI
│   └── lib/
│       ├── ai/client.ts              # SDK Google Gemini AI
│       ├── db.ts                     # MySQL Pool Connection
│       └── lab/
│           ├── chemicals-db.ts       # Database katalog zat kimia & reaksi
│           └── types.ts              # Type definitions tugas lab
```
