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

  // Try candidate connections for local XAMPP / MariaDB
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
      console.log(`[OK] Berhasil terhubung ke MySQL lokal (${c.host}:${c.port}) sebagai '${c.user}'`);
      return { conn, user: c.user, password: c.password, host: c.host, port: c.port };
    } catch (err) {
      // try next
    }
  }

  throw new Error('Tidak dapat terhubung ke MySQL lokal. Pastikan modul MySQL di XAMPP / MariaDB sudah aktif (Running).');
}

async function setup() {
  console.log('================================================================');
  console.log('   CAPCIPCUP SMARTEDU // PEMBUATAN DATABASE OTOMATIS (LOKAL)   ');
  console.log('================================================================\n');

  const { conn: adminConn, user: activeUser, password: activePassword, host, port } = await getAdminConnection();

  const dbName = 'capcipcup-db';

  // 1. Create database
  console.log(`1. Membuat database \`${dbName}\` jika belum ada...`);
  await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log(`   [V] Database \`${dbName}\` siap digunakan.\n`);

  // 1.1 Grant privileges to both root and capcipcup-db-usr for maximum convenience
  try {
    await adminConn.query(`CREATE USER IF NOT EXISTS 'capcipcup-db-usr'@'%' IDENTIFIED BY '6wcWxy7YFwzPLRbc';`);
    await adminConn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO 'capcipcup-db-usr'@'%';`);
    await adminConn.query(`CREATE USER IF NOT EXISTS 'capcipcup-db-usr'@'localhost' IDENTIFIED BY '6wcWxy7YFwzPLRbc';`);
    await adminConn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO 'capcipcup-db-usr'@'localhost';`);
    await adminConn.query(`FLUSH PRIVILEGES;`);
    console.log(`   [V] Pengguna database 'capcipcup-db-usr' berhasil dikonfigurasi & diberi izin akses.`);
  } catch (e) {
    console.log(`   [INFO] User grant dilewati (menggunakan akses ${activeUser}).`);
  }

  await adminConn.end();

  // 2. Connect into target database
  const dbConn = await mysql.createConnection({
    host,
    port,
    user: activeUser,
    password: activePassword,
    database: dbName,
  });

  console.log(`\n2. Menyusun tabel-tabel sistem ke dalam \`${dbName}\`...`);

  // Table: users
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
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `users`');

  // Table: classrooms
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(36) PRIMARY KEY,
      class_code VARCHAR(10) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      grade_level VARCHAR(50) DEFAULT 'Kelas 10',
      academic_year VARCHAR(20) DEFAULT '2026/2027',
      teacher_id VARCHAR(36) DEFAULT NULL,
      teacher_name VARCHAR(100) NOT NULL DEFAULT 'Budi Santoso, S.Pd',
      description TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `classrooms`');

  // Table: classroom_members
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS classroom_members (
      id VARCHAR(36) PRIMARY KEY,
      classroom_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      student_username VARCHAR(50) DEFAULT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      UNIQUE KEY unique_student_class (classroom_id, user_id),
      KEY idx_cm_classroom (classroom_id),
      KEY idx_cm_user (user_id),
      CONSTRAINT fk_cm_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms (id) ON DELETE CASCADE,
      CONSTRAINT fk_cm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `classroom_members`');

  // Table: quests
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS quests (
      id VARCHAR(36) PRIMARY KEY,
      mode VARCHAR(10) NOT NULL DEFAULT 'ROOM',
      task_type VARCHAR(30) DEFAULT 'HYBRID',
      classroom_id VARCHAR(36) DEFAULT NULL,
      room_code VARCHAR(10) DEFAULT NULL,
      creator_name VARCHAR(100) NOT NULL,
      title VARCHAR(150) NOT NULL,
      target_language VARCHAR(50) NOT NULL DEFAULT 'English',
      difficulty_level VARCHAR(10) NOT NULL DEFAULT 'B1',
      case_study_story TEXT NOT NULL,
      npc_name VARCHAR(100) NOT NULL,
      npc_persona TEXT NOT NULL,
      required_object_hint TEXT NOT NULL,
      mission_objectives JSON NOT NULL,
      target_vocabularies JSON NOT NULL,
      quiz_questions JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_q_classroom (classroom_id),
      KEY idx_q_room_code (room_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `quests`');

  // Table: submissions
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(36) PRIMARY KEY,
      quest_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
      scanned_object JSON DEFAULT NULL,
      quiz_answers JSON DEFAULT NULL,
      quiz_score INT DEFAULT 0,
      chat_transcript JSON DEFAULT NULL,
      python_fluency_metrics JSON DEFAULT NULL,
      speaking_score INT DEFAULT 0,
      total_score INT DEFAULT 0,
      cefr_level VARCHAR(10) DEFAULT 'A2',
      ai_feedback JSON DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL DEFAULT NULL,
      KEY idx_sub_quest (quest_id),
      CONSTRAINT fk_sub_quest FOREIGN KEY (quest_id) REFERENCES quests (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `submissions`');

  // Table: subjects
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      color_theme VARCHAR(50) DEFAULT 'indigo',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `subjects`');

  // Table: learning_modules
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS learning_modules (
      id VARCHAR(36) PRIMARY KEY,
      subject_id VARCHAR(50) NOT NULL,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      content_markdown MEDIUMTEXT,
      visualizer_type VARCHAR(50),
      order_index INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_lm_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `learning_modules`');

  // Table: quiz_sessions
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      subject_id VARCHAR(50),
      score INT DEFAULT 0,
      total_questions INT DEFAULT 0,
      xp_earned INT DEFAULT 0,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_qs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
      CONSTRAINT fk_qs_subject FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `quiz_sessions`');

  // Table: ai_interactions
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS ai_interactions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      feature_type VARCHAR(50) DEFAULT 'tutor',
      prompt TEXT NOT NULL,
      response MEDIUMTEXT,
      tokens_used INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_ai_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `ai_interactions`');

  // Table: scanned_items
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS scanned_items (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      quest_id VARCHAR(36),
      object_name VARCHAR(100) NOT NULL,
      foreign_word VARCHAR(100) NOT NULL,
      phonetics VARCHAR(100),
      meaning_id VARCHAR(150),
      idiom VARCHAR(255),
      rpg_attribute VARCHAR(255),
      image_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `scanned_items`');

  // Table: speaking_sessions
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS speaking_sessions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36),
      quest_id VARCHAR(36),
      class_code VARCHAR(50) DEFAULT 'CLASS-10A',
      duration_seconds INT DEFAULT 0,
      cefr_level VARCHAR(10) DEFAULT 'A2',
      overall_score INT DEFAULT 0,
      fluency_score INT DEFAULT 0,
      pronunciation_score INT DEFAULT 0,
      vocabulary_score INT DEFAULT 0,
      grammar_score INT DEFAULT 0,
      hesitation_seconds INT DEFAULT 0,
      code_switching_count INT DEFAULT 0,
      transcript_json JSON,
      feedback_json JSON,
      native_upgrades_json JSON,
      xp_earned INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `speaking_sessions`');

  // Table: class_misconceptions
  await dbConn.query(`
    CREATE TABLE IF NOT EXISTS class_misconceptions (
      id VARCHAR(36) PRIMARY KEY,
      class_code VARCHAR(50) NOT NULL,
      topic VARCHAR(150) NOT NULL,
      target_language VARCHAR(30) DEFAULT 'english',
      common_mistakes_json JSON,
      recommended_warmup JSON,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('   [V] Tabel `class_misconceptions`');

  // 3. SEEDING DEFAULT USERS (BCRYPT HASHED)
  console.log('\n3. Mengisi akun demo pengguna...');
  const usersToSeed = [
    {
      id: 'usr_superadmin_01',
      name: 'Super Administrator',
      username: 'superadmin',
      email: 'superadmin@capcipcup.edu',
      password: 'admin123',
      role: 'superadmin',
      avatar: '⚡',
      xp: 9999,
      level: 99,
    },
    {
      id: 'usr_teacher_01',
      name: 'Budi Santoso, S.Pd',
      username: 'guru',
      email: 'budi.guru@capcipcup.edu',
      password: 'guru123',
      role: 'teacher',
      avatar: '👨‍🏫',
      xp: 4200,
      level: 25,
    },
    {
      id: 'usr_student_01',
      name: 'Ahmad Faiz',
      username: 'siswa',
      email: 'ahmad.siswa@capcipcup.edu',
      password: 'siswa123',
      role: 'student',
      avatar: '🎒',
      xp: 680,
      level: 4,
    },
    {
      id: 'usr_student_02',
      name: 'Siti Rahma',
      username: 'siswa1',
      email: 'siti.rahma@capcipcup.edu',
      password: 'siswa123',
      role: 'student',
      avatar: '👩‍🎓',
      xp: 520,
      level: 3,
    },
    {
      id: 'usr_student_03',
      name: 'Budi Pratama',
      username: 'siswa2',
      email: 'budi.pratama@capcipcup.edu',
      password: 'siswa123',
      role: 'student',
      avatar: '🧑‍💻',
      xp: 450,
      level: 3,
    },
    {
      id: 'usr_student_04',
      name: 'Dewi Lestari',
      username: 'siswa3',
      email: 'dewi.lestari@capcipcup.edu',
      password: 'siswa123',
      role: 'student',
      avatar: '✨',
      xp: 380,
      level: 2,
    },
  ];

  for (const u of usersToSeed) {
    const hashed = await bcrypt.hash(u.password, 10);
    await dbConn.query(
      `INSERT INTO users (id, name, username, email, password, role, avatar_url, xp, level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), xp=VALUES(xp), level=VALUES(level);`,
      [u.id, u.name, u.username, u.email, hashed, u.role, u.avatar, u.xp, u.level]
    );
    console.log(`   [V] Akun siap: ${u.username} (${u.role}) • Password: ${u.password}`);
  }

  // 4. SEEDING CLASSROOMS
  console.log('\n4. Mengisi data rombel kelas...');
  const classroomsToSeed = [
    {
      id: 'cls_11_hotel_2',
      class_code: 'EDU889',
      name: 'Kelas 11 Perhotelan 2',
      grade_level: 'Kelas 11 SMK',
      academic_year: '2026/2027',
      teacher_id: 'usr_teacher_01',
      teacher_name: 'Budi Santoso, S.Pd',
      description: 'Kelas Praktik Bahasa Inggris Layanan Perhotelan & Resepsionis VIP.',
    },
    {
      id: 'cls_10_rpl_1',
      class_code: 'JOB999',
      name: 'Kelas 10 RPL 1',
      grade_level: 'Kelas 10 SMK',
      academic_year: '2026/2027',
      teacher_id: 'usr_teacher_01',
      teacher_name: 'Budi Santoso, S.Pd',
      description: 'Kelas Simulasi Interview Kerja Bahasa Inggris Bidang Teknologi & IT.',
    },
  ];

  for (const c of classroomsToSeed) {
    await dbConn.query(
      `INSERT INTO classrooms (id, class_code, name, grade_level, academic_year, teacher_id, teacher_name, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), grade_level=VALUES(grade_level), description=VALUES(description);`,
      [c.id, c.class_code, c.name, c.grade_level, c.academic_year, c.teacher_id, c.teacher_name, c.description]
    );
    console.log(`   [V] Rombel siap: [${c.class_code}] ${c.name}`);
  }

  // 5. SEEDING CLASSROOM MEMBERS
  console.log('\n5. Menghubungkan siswa ke rombel kelas...');
  const membersToSeed = [
    { id: 'cm_01', classroom_id: 'cls_11_hotel_2', user_id: 'usr_student_01', name: 'Ahmad Faiz', username: 'siswa' },
    { id: 'cm_02', classroom_id: 'cls_11_hotel_2', user_id: 'usr_student_02', name: 'Siti Rahma', username: 'siswa1' },
    { id: 'cm_03', classroom_id: 'cls_10_rpl_1', user_id: 'usr_student_01', name: 'Ahmad Faiz', username: 'siswa' },
    { id: 'cm_04', classroom_id: 'cls_10_rpl_1', user_id: 'usr_student_03', name: 'Budi Pratama', username: 'siswa2' },
    { id: 'cm_05', classroom_id: 'cls_10_rpl_1', user_id: 'usr_student_04', name: 'Dewi Lestari', username: 'siswa3' },
  ];

  for (const m of membersToSeed) {
    await dbConn.query(
      `INSERT INTO classroom_members (id, classroom_id, user_id, student_name, student_username, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')
       ON DUPLICATE KEY UPDATE student_name=VALUES(student_name), status='ACTIVE';`,
      [m.id, m.classroom_id, m.user_id, m.name, m.username]
    );
  }
  console.log(`   [V] 5 keanggotaan siswa terdaftar di rombel kelas.`);

  // 6. SEEDING DEMO QUESTS
  console.log('\n6. Mengisi tugas kelas & butir soal kuis...');
  const questsToSeed = [
    {
      id: 'quest_demo_edu889',
      mode: 'ROOM',
      task_type: 'HYBRID',
      classroom_id: 'cls_11_hotel_2',
      room_code: 'EDU889',
      creator_name: 'Budi Santoso, S.Pd',
      title: 'Misi Negosiasi Produk Ramah Lingkungan',
      target_language: 'English',
      difficulty_level: 'B1',
      case_study_story: 'Kamu adalah staf layanan perhotelan. Seorang investor asing (Ms. Clara) menanyakan botol minum dan wadah ramah lingkungan di mejamu, lalu menantangmu mempresentasikan ide fasilitas hotel bebas plastik.',
      npc_name: 'Ms. Clara',
      npc_persona: 'Green Investor antusias, kritis soal daya tahan produk, menyukai pelayanan yang ramah dan solutif.',
      required_object_hint: 'Tunjukkan botol minum (bottle) atau buku catatan (book) di mejamu!',
      mission_objectives: JSON.stringify([
        'Jelaskan keunggulan utama produk menggunakan minimal 2 kata sifat bahasa Inggris',
        'Jawab pertanyaan Ms. Clara mengenai efisiensi penggunaan produk ramah lingkungan',
        'Tutup presentasi dengan tawaran kerja sama yang sopan dan profesional',
      ]),
      target_vocabularies: JSON.stringify(['sustainable', 'biodegradable', 'hospitality', 'durable', 'alternative']),
      quiz_questions: JSON.stringify([
        {
          type: 'listening',
          audioScript: 'Good morning! We are excited to announce that all guest rooms will replace plastic amenities with bamboo and refillable glass dispensers starting next Monday.',
          question: 'According to the hotel announcement, what will replace plastic amenities?',
          options: ['Bamboo and refillable glass dispensers', 'Plastic bottles and single-use bags', 'Metal cans imported from overseas', 'Disposable ceramic containers'],
          correctIndex: 0,
          explanation: 'The announcement clearly states bamboo and refillable glass dispensers will replace plastic amenities.',
        },
        {
          type: 'multiple_choice',
          audioScript: null,
          question: "Kata sifat manakah yang paling tepat untuk mendeskripsikan botol minum yang kuat dan tahan lama?",
          options: ['Fragile', 'Durable', 'Temporary', 'Hazardous'],
          correctIndex: 1,
          explanation: "'Durable' berarti tahan lama dan tidak mudah rusak.",
        },
        {
          type: 'multiple_choice',
          audioScript: null,
          question: 'Ungkapan pembuka yang paling profesional untuk menyambut tamu hotel VIP asing adalah...',
          options: [
            'Hey, what do you want from us?',
            'Good morning Ms. Clara, welcome to our hotel. How may I assist you today?',
            'Please sit down and wait until I am free.',
            'I do not speak English very well today.',
          ],
          correctIndex: 1,
          explanation: "'Good morning Ms. Clara, welcome to our hotel...' menunjukkan keramahtamahan internasional standar industri perhotelan.",
        },
      ]),
    },
    {
      id: 'quest_demo_job999',
      mode: 'ROOM',
      task_type: 'HYBRID',
      classroom_id: 'cls_10_rpl_1',
      room_code: 'JOB999',
      creator_name: 'Budi Santoso, S.Pd',
      title: 'Simulasi Wawancara Kerja Customer Support IT',
      target_language: 'English',
      difficulty_level: 'B1',
      case_study_story: 'Kamu sedang melamar pekerjaan sebagai junior technical support di perusahaan teknologi multinasional. Penguji ingin mengetahui caramu menangani keluhan pengguna aplikasi.',
      npc_name: 'Mr. Arthur (Lead HR & IT Manager)',
      npc_persona: 'Profesional, sistematis, menghargai solusi logis dan komunikasi bahasa Inggris yang sopan.',
      required_object_hint: 'Siapkan laptop atau buku catatan untuk mencatat detail keluhan klien!',
      mission_objectives: JSON.stringify([
        'Perkenalkan diri dan keahlian dasarmu di bidang IT dengan percaya diri',
        'Jelaskan langkah penyelesaian masalah bug aplikasi kepada klien',
        'Gunakan minimal 3 istilah teknis pendukung komunikasi pelanggan',
      ]),
      target_vocabularies: JSON.stringify(['troubleshoot', 'resolution', 'ticket', 'efficient', 'communication']),
      quiz_questions: JSON.stringify([
        {
          type: 'multiple_choice',
          audioScript: null,
          question: 'What is the most professional response when a client reports an application error?',
          options: [
            "It is not our problem, please restart your computer.",
            "I apologize for the inconvenience; let me look into your error log right away.",
            "You should have bought a better phone to run this software.",
            "Our office is closing in five minutes so call again tomorrow."
          ],
          correctIndex: 1,
          explanation: 'Taking immediate ownership and offering a direct action step demonstrates professionalism.',
        },
        {
          type: 'multiple_choice',
          audioScript: null,
          question: "Which word best describes a fast and reliable solution to a technical problem?",
          options: ['Complicated', 'Effective', 'Defective', 'Unstable'],
          correctIndex: 1,
          explanation: "'Effective' means successful in producing a desired or intended result.",
        },
      ]),
    },
  ];

  for (const q of questsToSeed) {
    await dbConn.query(
      `INSERT INTO quests (
        id, mode, task_type, classroom_id, room_code, creator_name, title, target_language,
        difficulty_level, case_study_story, npc_name, npc_persona, required_object_hint,
        mission_objectives, target_vocabularies, quiz_questions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title=VALUES(title), task_type=VALUES(task_type), classroom_id=VALUES(classroom_id), quiz_questions=VALUES(quiz_questions);`,
      [
        q.id,
        q.mode,
        q.task_type,
        q.classroom_id,
        q.room_code,
        q.creator_name,
        q.title,
        q.target_language,
        q.difficulty_level,
        q.case_study_story,
        q.npc_name,
        q.npc_persona,
        q.required_object_hint,
        q.mission_objectives,
        q.target_vocabularies,
        q.quiz_questions,
      ]
    );
    console.log(`   [V] Tugas siap: [${q.room_code}] ${q.title} (${q.task_type})`);
  }

  await dbConn.end();

  // 7. SYNC .env.local
  console.log('\n7. Memperbarui file `.env.local` untuk koneksi lokal aktif...');
  let envRaw = '';
  if (fs.existsSync(envPath)) {
    envRaw = fs.readFileSync(envPath, 'utf-8');
  }

  const existingLines = envRaw.split('\n');
  const keepKeys = ['GEMINI_API_KEY'];
  const preserved = [];
  existingLines.forEach((l) => {
    if (keepKeys.some((k) => l.trim().startsWith(k))) {
      preserved.push(l.trim());
    }
  });

  const geminiKey = preserved.find((l) => l.startsWith('GEMINI_API_KEY')) || 'GEMINI_API_KEY=';

  const newEnvContent = `# ==============================================================================
# KONFIGURASI DATABASE LOKAL (XAMPP / MARIADB) - DIBUAT OTOMATIS
# ==============================================================================
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=capcipcup-db
DB_USER=${activeUser}
DB_PASSWORD=${activePassword}

# Opsi Cadangan Remote (Jika dibutuhkan kembali di masa depan):
# DB_HOST=10.80.80.3
# DB_PORT=3306
# DB_USER=capcipcup-db-usr
# DB_PASSWORD=6wcWxy7YFwzPLRbc

# ==============================================================================
# INTEGRASI GOOGLE GEMINI AI
# ==============================================================================
${geminiKey}
`;

  fs.writeFileSync(envPath, newEnvContent, 'utf-8');
  console.log(`   [V] File \`.env.local\` telah diselaraskan ke database lokal:`);
  console.log(`       HOST: 127.0.0.1 | PORT: 3306 | DB: ${dbName} | USER: ${activeUser}`);

  console.log('\n================================================================');
  console.log('   [SUKSES] DATABASE LOKAL & SEMUA TABEL TELAH SELESAI DIBUAT!  ');
  console.log('   Tidak perlu lagi membuka phpMyAdmin di browser.               ');
  console.log('================================================================\n');
}

setup().catch((err) => {
  console.error('\n[ERROR SETUP DATABASE]:', err.message);
  process.exit(1);
});
