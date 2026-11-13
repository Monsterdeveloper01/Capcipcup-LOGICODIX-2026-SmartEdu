# Daftar Akun Guru dan Murid (Capcipcup SmartEdu)

Dokumen ini berisi daftar akun guru dan murid yang telah dimasukkan ke database melalui script [`scripts/seed_29_students_2_teachers.js`](../scripts/seed_29_students_2_teachers.js). Seluruh password di bawah ini sudah disimpan dalam bentuk hash `bcryptjs` di tabel `users`.

## Ringkasan Pembagian

- **Total Akun Guru Baru:** 2 akun
- **Total Akun Murid Baru:** 29 akun
- **Total Akun Administrator:** 1 akun (`admin` / `admin123`)
- **Pembagian Kelas:**
  - **Guru 1 (`guru.rina`)** — Kelas **X IPA 1 - Kimia Dasar** (`KIM10A`): **10 murid** (`murid01` s.d. `murid10`)
  - **Guru 2 (`guru.hendra`)** — Kelas **XI IPA 2 - Reaksi Larutan** (`KIM11B`): **10 murid** (`murid11` s.d. `murid20`)
  - **Belum Masuk Kelas:** **9 murid** (`murid21` s.d. `murid29`) — dapat bergabung menggunakan kode kelas `KIM10A` atau `KIM11B`

---

## 1. Akun Guru (2 Akun)

| No | Nama Guru | Username | Email | Password | ID Kelas | Kode Kelas | Nama Kelas | Jumlah Murid |
| :-: | :--- | :--- | :--- | :--- | :--- | :---: | :--- | :-: |
| 1 | Rina Wijaya, S.Pd | `guru.rina` | `rina.wijaya@capcipcup.edu` | `GuruRina2026!` | `cls_kimia_101` | `KIM10A` | X IPA 1 - Kimia Dasar | 10 |
| 2 | Hendra Kusuma, M.Pd | `guru.hendra` | `hendra.kusuma@capcipcup.edu` | `GuruHendra2026!` | `cls_kimia_102` | `KIM11B` | XI IPA 2 - Reaksi Larutan | 10 |

---

## 2. Akun Murid — Kelas Guru 1: Rina Wijaya, S.Pd (`KIM10A` — 10 Murid)

| No | Nama Murid | Username | Email | Password | Kelas / Guru Pengampu |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | Aditya Pratama | `murid01` | `murid01@capcipcup.edu` | `Siswa01#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 2 | Nadia Putri Sari | `murid02` | `murid02@capcipcup.edu` | `Siswa02#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 3 | Rizky Ramadhan | `murid03` | `murid03@capcipcup.edu` | `Siswa03#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 4 | Aulia Zahra | `murid04` | `murid04@capcipcup.edu` | `Siswa04#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 5 | Bagas Setiawan | `murid05` | `murid05@capcipcup.edu` | `Siswa05#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 6 | Citra Dewi Lestari | `murid06` | `murid06@capcipcup.edu` | `Siswa06#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 7 | Dimas Saputra | `murid07` | `murid07@capcipcup.edu` | `Siswa07#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 8 | Eka Wulandari | `murid08` | `murid08@capcipcup.edu` | `Siswa08#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 9 | Fajar Nugroho | `murid09` | `murid09@capcipcup.edu` | `Siswa09#2026` | `KIM10A` (Rina Wijaya, S.Pd) |
| 10 | Gita Permatasari | `murid10` | `murid10@capcipcup.edu` | `Siswa10#2026` | `KIM10A` (Rina Wijaya, S.Pd) |

---

## 3. Akun Murid — Kelas Guru 2: Hendra Kusuma, M.Pd (`KIM11B` — 10 Murid)

| No | Nama Murid | Username | Email | Password | Kelas / Guru Pengampu |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 11 | Hana Salsabila | `murid11` | `murid11@capcipcup.edu` | `Siswa11#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 12 | Irfan Maulana | `murid12` | `murid12@capcipcup.edu` | `Siswa12#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 13 | Jihan Khairunnisa | `murid13` | `murid13@capcipcup.edu` | `Siswa13#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 14 | Kevin Oktavian | `murid14` | `murid14@capcipcup.edu` | `Siswa14#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 15 | Laila Fitriani | `murid15` | `murid15@capcipcup.edu` | `Siswa15#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 16 | Muhammad Farhan | `murid16` | `murid16@capcipcup.edu` | `Siswa16#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 17 | Nabila Syakira | `murid17` | `murid17@capcipcup.edu` | `Siswa17#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 18 | Omar Hakim | `murid18` | `murid18@capcipcup.edu` | `Siswa18#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 19 | Putri Anggraini | `murid19` | `murid19@capcipcup.edu` | `Siswa19#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |
| 20 | Qori Azzahra | `murid20` | `murid20@capcipcup.edu` | `Siswa20#2026` | `KIM11B` (Hendra Kusuma, M.Pd) |

---

## 4. Akun Murid — Belum Tergabung ke Kelas (9 Murid)

| No | Nama Murid | Username | Email | Password | Status Kelas |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 21 | Rafi Hidayat | `murid21` | `murid21@capcipcup.edu` | `Siswa21#2026` | Belum bergabung kelas |
| 22 | Salsa Nurhaliza | `murid22` | `murid22@capcipcup.edu` | `Siswa22#2026` | Belum bergabung kelas |
| 23 | Taufik Hidayah | `murid23` | `murid23@capcipcup.edu` | `Siswa23#2026` | Belum bergabung kelas |
| 24 | Umar Alfaruq | `murid24` | `murid24@capcipcup.edu` | `Siswa24#2026` | Belum bergabung kelas |
| 25 | Vina Melati | `murid25` | `murid25@capcipcup.edu` | `Siswa25#2026` | Belum bergabung kelas |
| 26 | Wahyu Kurniawan | `murid26` | `murid26@capcipcup.edu` | `Siswa26#2026` | Belum bergabung kelas |
| 27 | Xena Maharani | `murid27` | `murid27@capcipcup.edu` | `Siswa27#2026` | Belum bergabung kelas |
| 28 | Yusuf Alamsyah | `murid28` | `murid28@capcipcup.edu` | `Siswa28#2026` | Belum bergabung kelas |
| 29 | Zahra Amelia | `murid29` | `murid29@capcipcup.edu` | `Siswa29#2026` | Belum bergabung kelas |

---

## 5. Relasi Database & Isolasi Kelas, Tugas, dan Rekap Nilai

Sistem menerapkan isolasi data penuh (*data isolation*) sesuai hak akses:
1. **Guru Pengampu (`classrooms` & `users`):**
   - Guru **Rina Wijaya, S.Pd** (`guru.rina`) hanya dapat melihat dan mengelola kelas **KIM10A**.
   - Guru **Hendra Kusuma, M.Pd** (`guru.hendra`) hanya dapat melihat dan mengelola kelas **KIM11B**.
   - Guru **Budi Santoso, S.Pd** (`guru`) hanya dapat melihat dan mengelola kelas **KIM500**.
2. **Tugas Praktikum (`lab_tasks`):**
   - Tugas otomatis terkait dengan `classroom_id`, `room_code`, dan `teacher_name`. Guru hanya dapat mengedit/menghapus tugas miliknya.
3. **Rekap Nilai Siswa (`lab_submissions`):**
   - Rekap nilai di dalam kelas terisolasi berdasarkan relasi `task_id` dan `classroom_id`.
   - Di kelas **KIM10A**, hanya nilai siswa murid01 - murid10 (Aditya & Nadia) yang ditampilkan.
   - Di kelas **KIM11B**, hanya nilai siswa murid11 - murid20 (Hana & Irfan) yang ditampilkan.
   - Nilai dari kelas lain (`KIM500`, Ahmad Faiz) tidak akan pernah bocor ke kelas guru lain.

---

## Cara Menjalankan Ulang Seed (Opsional / Idempoten)

```bash
node scripts/seed_29_students_2_teachers.js
```

