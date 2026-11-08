# 02. Panduan Pengujian Login Multi-Role & Autentikasi

Dokumen ini menjelaskan alur pengujian hak akses peran (*Role-Based Access Control / RBAC*) untuk akun **Siswa**, **Guru**, dan **Superadmin**.

---

## 1. Tabel Kredensial Akun Contoh (Tersimpan di MariaDB)

Gunakan akun contoh berikut untuk masuk ke sistem:

| Peran (Role) | Username | Password | Nama Tampilan | Akses Halaman / Dashboard Utama |
|---|---|---|---|---|
| **Superadmin** | `superadmin` | `admin123` | Super Administrator | • Dashboard Superadmin (`[SUPERADMIN]`)<br>• Manajemen Pengguna (CRUD)<br>• Audit Database & AI Telemetri<br>• Akses ke seluruh tab Guru & Siswa |
| **Guru** | `guru` | `guru123` | Budi Santoso, S.Pd | • Dashboard Guru (`[GURU]`)<br>• Curriculum-to-Quest Generator<br>• 30-Seconds Speaking Grader<br>• Class Misconception Heatmap<br>• Matriks Malu vs Kurang Skill<br>• Buat Room Kelas (`/teacher/create`) |
| **Siswa** | `siswa` | `siswa123` | Ahmad Faiz | • Mode Siswa LinguaQuest RPG (`[SISWA]`)<br>• Pemindaian Objek Nyata Kamera<br>• Live Coaching HUD & Suara NPC<br>• Bergabung Room Kelas via PIN (`/room/join`)<br>• Solo Explorer Mode (`/solo/create`) |

---

## 2. Alur Pengujian Fitur 1-Klik Login Cepat (Tanpa Ketik)

Fitur ini dirancang untuk mendemokan aplikasi di hadapan dewan juri dengan cepat tanpa membuang waktu mengetik kredensial:

1. Buka browser di **`http://localhost:3000`**.
2. Jika Anda sedang melihat dashboard, klik tombol merah **`[ LOGOUT ]`** di navbar sebelah kanan atas untuk masuk ke layar login.
3. Pada kartu **`[ ⚡ CONTOH LOGIN 1-KLIK LANGSUNG ]`**, terdapat 3 tombol:
   - **Klik `[ SUPERADMIN ]`:** Otomatis mengisi `superadmin` / `admin123` dan langsung memproses login. Anda akan diarahkan seketika ke **Dashboard Superadmin**.
   - **Klik `[ GURU ]`:** Otomatis mengisi `guru` / `guru123` dan mengarahkan Anda ke **Dashboard Guru**.
   - **Klik `[ SISWA ]`:** Otomatis mengisi `siswa` / `siswa123` dan mengarahkan Anda ke **Mode Siswa (RPG)**.

---

## 3. Alur Pengujian Login Manual

1. Buka halaman login di `http://localhost:3000`.
2. Masukkan username: `guru`
3. Masukkan password: `guru123`
4. Klik tombol **`[ MASUK KE SISTEM SEKARANG ]`**.
5. **Ekspektasi:**
   - Muncul respon login sukses dari `/api/auth/login`.
   - Navbar menampilkan profil: `[Budi Santoso, S.Pd // GURU]`.
   - Tampilan otomatis beralih ke **Dashboard Guru**.

---

## 4. Alur Pengujian Manajemen Pengguna (Role: Superadmin)

1. Login sebagai `superadmin` (menggunakan tombol 1-klik atau kredensial `superadmin` / `admin123`).
2. Pada menu navbar atas, klik tab **`[03] Superadmin`**.
3. Di Dashboard Superadmin, Anda dapat menguji:
   - **Melihat Statistik:** Kartu total pengguna, sesi speaking, dan status koneksi MariaDB.
   - **Ubah Role Pengguna:** Pada kolom *"Role Saat Ini"*, ubah role salah satu siswa menjadi `TEACHER` melalui dropdown. Perubahan langsung tersimpan ke MariaDB tanpa reload!
   - **Tambah Pengguna Baru:** Klik tombol **`[ + TAMBAH AKUN USER ]`**, isi form (Nama, Username, Email, Password, Role) lalu klik simpan. Akun baru langsung terdaftar dan dapat digunakan untuk login seketika.
   - **Hapus Pengguna:** Klik tombol merah `[HAPUS]` pada baris pengguna untuk menghapus akun dari database.

---

## 5. Alur Pengujian Logout

1. Saat sedang berada di akun mana pun (Siswa, Guru, atau Superadmin), perhatikan sudut kanan atas navbar.
2. Klik tombol merah **`[ LOGOUT ]`**.
3. **Ekspektasi:**
   - Permintaan dikirim ke `/api/auth/logout`.
   - Cookie sesi `lq_session_user` dihapus.
   - Layar otomatis kembali ke halaman login.
   - Jika halaman di-refresh, status login tidak tersimpan lagi.

