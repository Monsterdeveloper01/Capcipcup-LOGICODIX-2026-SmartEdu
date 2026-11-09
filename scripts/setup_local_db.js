const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

function parseEnv() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) {
      env[k.trim()] = v.join('=').split('#')[0].trim();
    }
  });
  return env;
}

async function getAdminConnection() {
  const env = parseEnv();
  const host = env.DB_HOST || '127.0.0.1';
  const port = parseInt(env.DB_PORT || '3306', 10);

  const candidates = [
    { host, port, user: 'root', password: '' },
    { host, port, user: 'root', password: 'root' },
    { host: '127.0.0.1', port: 3306, user: 'root', password: '' },
    { host: 'localhost', port: 3306, user: 'root', password: '' },
    { host, port, user: env.DB_USER || 'capcipcup-db-usr', password: env.DB_PASSWORD || '6wcWxy7YFwzPLRbc' },
  ];

  for (const c of candidates) {
    try {
      const conn = await mysql.createConnection({
        host: c.host,
        port: c.port,
        user: c.user,
        password: c.password,
      });
      console.log(`[OK] Terhubung ke MySQL (${c.host}:${c.port}) sebagai '${c.user}'`);
      return { conn, user: c.user, password: c.password, host: c.host, port: c.port };
    } catch (err) {}
  }

  throw new Error('Tidak dapat terhubung ke MySQL lokal. Pastikan MySQL di XAMPP / MariaDB sudah berjalan.');
}

async function setup() {
  console.log('================================================================');
  console.log('   CAPCIPCUP SMARTEDU // DATABASE SAINS & LAB KIMIA 3D LOKAL    ');
  console.log('================================================================\n');

  const { conn: adminConn, host, port } = await getAdminConnection();
  const dbName = 'capcipcup-db';

  console.log(`1. Menyiapkan database \`${dbName}\`...`);
  await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

  const env = parseEnv();
  const dbConn = await mysql.createConnection({
    host,
    port,
    user: 'root',
    password: '',
    database: dbName,
  });

  console.log('2. Menyiapkan tabel-tabel utama Lab Sains & Guru/Siswa...');

  // 1. Users
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('student', 'teacher', 'admin', 'superadmin') DEFAULT 'student',
      avatar_url VARCHAR(255),
      xp INT DEFAULT 0,
      level INT DEFAULT 1,
      streak_days INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `users`');

  // 2. Classrooms
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(36) PRIMARY KEY,
      class_code VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      grade_level VARCHAR(50) DEFAULT 'Kelas 10',
      teacher_id VARCHAR(36) DEFAULT NULL,
      teacher_name VARCHAR(100) NOT NULL DEFAULT 'Budi Santoso, S.Pd',
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `classrooms`');

  // 3. Classroom Members
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS classroom_members (
      id VARCHAR(36) PRIMARY KEY,
      classroom_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_student_class (classroom_id, user_id),
      CONSTRAINT fk_cm_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `classroom_members`');

  // 4. Chemicals (Katalog Bahan Kimia)
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS chemicals (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      formula VARCHAR(50) NOT NULL,
      color VARCHAR(20) NOT NULL,
      category VARCHAR(30) NOT NULL,
      grade_level ENUM('SD', 'SMP', 'SMA') NOT NULL,
      description TEXT NOT NULL,
      safety_note TEXT,
      hazard_level INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `chemicals`');

  // 5. Chemical Reactions (Matriks Reaksi Kimia)
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS chemical_reactions (
      id VARCHAR(36) PRIMARY KEY,
      reactant_a_id VARCHAR(36) NOT NULL,
      reactant_b_id VARCHAR(36) NOT NULL,
      title VARCHAR(150) NOT NULL,
      equation VARCHAR(200) NOT NULL,
      product_name VARCHAR(100) NOT NULL,
      product_formula VARCHAR(50) NOT NULL,
      product_color VARCHAR(20) NOT NULL,
      visual_effect VARCHAR(30) NOT NULL,
      temperature_change_c INT DEFAULT 0,
      explanation TEXT NOT NULL,
      grade_level ENUM('SD', 'SMP', 'SMA') NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `chemical_reactions`');

  // 6. Lab Tasks (Tugas Praktik Dibuat Guru)
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS lab_tasks (
      id VARCHAR(36) PRIMARY KEY,
      classroom_id VARCHAR(36) NOT NULL,
      room_code VARCHAR(10) NOT NULL,
      teacher_name VARCHAR(100) NOT NULL,
      title VARCHAR(150) NOT NULL,
      grade_level ENUM('SD', 'SMP', 'SMA') NOT NULL,
      instructions TEXT NOT NULL,
      chemical_ids JSON NOT NULL,
      expected_reaction_id VARCHAR(36) DEFAULT NULL,
      quiz_questions JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_lt_classroom (classroom_id),
      KEY idx_lt_code (room_code),
      CONSTRAINT fk_lt_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `lab_tasks`');

  // 7. Lab Submissions (Hasil Pengerjaan Praktik Siswa)
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS lab_submissions (
      id VARCHAR(36) PRIMARY KEY,
      task_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      is_reaction_achieved BOOLEAN DEFAULT FALSE,
      quiz_score INT DEFAULT 0,
      quiz_answers JSON DEFAULT NULL,
      ai_feedback TEXT DEFAULT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_ls_task (task_id),
      CONSTRAINT fk_ls_task FOREIGN KEY (task_id) REFERENCES lab_tasks (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `lab_submissions`');

  // Seed default users (Guru & Siswa demo)
  const passwordHash = await bcrypt.hash('password123', 10);
  await dbConn.query(`
    INSERT INTO users (id, name, username, email, password, role, xp, level)
    VALUES 
      ('usr_teacher_1', 'Budi Santoso, S.Pd', 'guru', 'guru@smartedu.id', ?, 'teacher', 1500, 5),
      ('usr_student_1', 'Ahmad Faiz', 'siswa', 'faiz@smartedu.id', ?, 'student', 450, 2),
      ('usr_student_2', 'Siti Rahma', 'siswa2', 'siti@smartedu.id', ?, 'student', 520, 2)
    ON DUPLICATE KEY UPDATE name=VALUES(name);
  `, [passwordHash, passwordHash, passwordHash]);

  // Seed demo class: IPA Kelas 10 (PIN: LAB889)
  await dbConn.query(`
    INSERT INTO classrooms (id, class_code, name, grade_level, teacher_id, teacher_name, description)
    VALUES ('cls_demo_1', 'LAB889', 'Praktikum Kimia Dasar 10A', 'SMA Kelas 10', 'usr_teacher_1', 'Budi Santoso, S.Pd', 'Kelas praktikum reaksi asam-basa, netralisasi, dan endapan presipitasi.')
    ON DUPLICATE KEY UPDATE name=VALUES(name);
  `);

  // Seed sample task by teacher
  const sampleQuiz = [
    {
      id: "q1",
      question: "Apakah reaksi yang terjadi saat Asam Klorida (HCl) dituangkan ke dalam Natrium Hidroksida (NaOH)?",
      options: [
        "Reaksi Netralisasi membentuk Garam (NaCl) dan Air",
        "Reaksi Pembakaran menghasilkan Karbon Monoksida",
        "Reaksi Reduksi menghasilkan Logam Natrium murni",
        "Tidak terjadi perubahan apa pun"
      ],
      correctIndex: 0,
      explanation: "Ion H+ dari asam bereaksi dengan ion OH- dari basa menghasilkan molekul air netral dan garam dapur (NaCl)."
    },
    {
      id: "q2",
      question: "Bagaimana perubahan suhu yang kamu amati setelah larutan HCl dan NaOH bercampur?",
      options: [
        "Suhu larutan meningkat (Eksotermik melepaskan panas)",
        "Suhu larutan menurun drastis menjadi beku (Endotermik)",
        "Suhu tetap stabil di 0 derajat Celsius",
        "Larutan mendadak menguap seluruhnya menjadi gas"
      ],
      correctIndex: 0,
      explanation: "Reaksi asam kuat dengan basa kuat bersifat eksotermik melepaskan energi panas ke lingkungan sekitar tabung."
    }
  ];

  await dbConn.query(`
    INSERT INTO lab_tasks (id, classroom_id, room_code, teacher_name, title, grade_level, instructions, chemical_ids, expected_reaction_id, quiz_questions)
    VALUES (
      'tsk_demo_1',
      'cls_demo_1',
      'LAB889',
      'Budi Santoso, S.Pd',
      'Eksperimen Netralisasi Asam Basa (HCl + NaOH)',
      'SMA',
      'Ambil bejana Asam Klorida (HCl), arahkan dan tuangkan ke dalam bejana Natrium Hidroksida (NaOH). Amati perubahan warna indikator dan kenaikan suhu larutan!',
      JSON_ARRAY('ch_hcl', 'ch_naoh', 'ch_h2o'),
      'rx_hcl_naoh',
      ?
    )
    ON DUPLICATE KEY UPDATE title=VALUES(title);
  `, [JSON.stringify(sampleQuiz)]);

  console.log('\n[SELESAI] Database Sains & Lab Kimia siap 100%!');
  process.exit(0);
}

setup().catch((e) => {
  console.error('Setup error:', e);
  process.exit(1);
});
