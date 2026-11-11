const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).split('#')[0].trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const TEACHERS = [
  {
    id: 'usr_teacher_101',
    name: 'Rina Wijaya, S.Pd',
    username: 'guru.rina',
    email: 'rina.wijaya@capcipcup.edu',
    password: 'GuruRina2026!',
    xp: 1200,
    level: 4,
    streakDays: 7,
    classroom: {
      id: 'cls_kimia_101',
      classCode: 'KIM10A',
      name: 'X IPA 1 - Kimia Dasar',
      gradeLevel: 'SMA Kelas 10',
      academicYear: '2026/2027',
      description: 'Kelas praktikum kimia dasar bersama Ibu Rina Wijaya, S.Pd.',
    },
  },
  {
    id: 'usr_teacher_102',
    name: 'Hendra Kusuma, M.Pd',
    username: 'guru.hendra',
    email: 'hendra.kusuma@capcipcup.edu',
    password: 'GuruHendra2026!',
    xp: 1450,
    level: 5,
    streakDays: 10,
    classroom: {
      id: 'cls_kimia_102',
      classCode: 'KIM11B',
      name: 'XI IPA 2 - Reaksi Larutan',
      gradeLevel: 'SMA Kelas 11',
      academicYear: '2026/2027',
      description: 'Kelas praktikum kimia larutan dan titrasi bersama Bapak Hendra Kusuma, M.Pd.',
    },
  },
];

const STUDENT_NAMES = [
  'Aditya Pratama',
  'Nadia Putri Sari',
  'Rizky Ramadhan',
  'Aulia Zahra',
  'Bagas Setiawan',
  'Citra Dewi Lestari',
  'Dimas Saputra',
  'Eka Wulandari',
  'Fajar Nugroho',
  'Gita Permatasari',
  'Hana Salsabila',
  'Irfan Maulana',
  'Jihan Khairunnisa',
  'Kevin Oktavian',
  'Laila Fitriani',
  'Muhammad Farhan',
  'Nabila Syakira',
  'Omar Hakim',
  'Putri Anggraini',
  'Qori Azzahra',
  'Rafi Hidayat',
  'Salsa Nurhaliza',
  'Taufik Hidayah',
  'Umar Alfaruq',
  'Vina Melati',
  'Wahyu Kurniawan',
  'Xena Maharani',
  'Yusuf Alamsyah',
  'Zahra Amelia',
];

const STUDENTS = STUDENT_NAMES.map((name, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  let assignedClassroomId = null;
  if (idx < 10) {
    assignedClassroomId = TEACHERS[0].classroom.id;
  } else if (idx < 20) {
    assignedClassroomId = TEACHERS[1].classroom.id;
  }
  return {
    id: `usr_murid_${num}`,
    name,
    username: `murid${num}`,
    email: `murid${num}@capcipcup.edu`,
    password: `Siswa${num}#2026`,
    xp: 100 + idx * 15,
    level: 1 + Math.floor(idx / 10),
    streakDays: (idx % 5) + 1,
    assignedClassroomId,
    memberId: `cm_murid_${num}`,
  };
});

async function main() {
  loadEnvLocal();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'capcipcup-db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 5,
  });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const teacher of TEACHERS) {
      const hash = await bcrypt.hash(teacher.password, 10);
      await conn.query(
        `INSERT INTO users (id, name, username, email, password, role, avatar_url, xp, level, streak_days)
         VALUES (?, ?, ?, ?, ?, 'teacher', NULL, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           email = VALUES(email),
           password = VALUES(password),
           role = 'teacher'`,
        [teacher.id, teacher.name, teacher.username, teacher.email, hash, teacher.xp, teacher.level, teacher.streakDays]
      );

      const cls = teacher.classroom;
      await conn.query(
        `INSERT INTO classrooms (id, class_code, name, grade_level, academic_year, teacher_id, teacher_name, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           grade_level = VALUES(grade_level),
           academic_year = VALUES(academic_year),
           teacher_id = VALUES(teacher_id),
           teacher_name = VALUES(teacher_name),
           description = VALUES(description)`,
        [cls.id, cls.classCode, cls.name, cls.gradeLevel, cls.academicYear, teacher.id, teacher.name, cls.description]
      );
    }

    for (const student of STUDENTS) {
      const hash = await bcrypt.hash(student.password, 10);
      await conn.query(
        `INSERT INTO users (id, name, username, email, password, role, avatar_url, xp, level, streak_days)
         VALUES (?, ?, ?, ?, ?, 'student', NULL, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           email = VALUES(email),
           password = VALUES(password),
           role = 'student'`,
        [student.id, student.name, student.username, student.email, hash, student.xp, student.level, student.streakDays]
      );

      if (student.assignedClassroomId) {
        await conn.query(
          `INSERT INTO classroom_members (id, classroom_id, user_id, student_name, student_username, joined_at, status)
           VALUES (?, ?, ?, ?, ?, NOW(), 'ACTIVE')
           ON DUPLICATE KEY UPDATE
             student_name = VALUES(student_name),
             student_username = VALUES(student_username),
             status = 'ACTIVE'`,
          [student.memberId, student.assignedClassroomId, student.id, student.name, student.username]
        );
      }
    }

    // Tugas & Rekap Nilai untuk Kelas Ibu Rina Wijaya (cls_kimia_101 / KIM10A)
    const taskRina = {
      id: 'task_rina_01',
      classroomId: 'cls_kimia_101',
      roomCode: 'KIM10A',
      teacherName: 'Rina Wijaya, S.Pd',
      title: 'Eksperimen Hujan Emas: Pembentukan Endapan Timbal(II) Iodida (PbI2)',
      gradeLevel: 'SMA',
      instructions: '1. Siapkan bejana kimia di meja lab 3D. 2. Masukkan larutan Timbal(II) Nitrat Pb(NO3)2. 3. Tambahkan larutan Kalium Iodida KI secukupnya dan amati terbentuknya endapan kristal kuning keemasan berkilau.',
      chemicalIds: JSON.stringify(['ch_pbno32', 'ch_ki']),
      expectedReactionId: 'rx_pbi2',
      quizQuestions: JSON.stringify([
        {
          question: 'Apa warna endapan kristal yang terbentuk dari reaksi Pb(NO3)2 dan KI?',
          options: ['Kuning Keemasan', 'Putih Susu', 'Biru Cerah', 'Merah Bata'],
          correctIndex: 0,
          explanation: 'Reaksi antara ion Pb2+ dan I- menghasilkan endapan timbal(II) iodida (PbI2) yang berwarna kuning keemasan berkilau khas (fenomena Golden Rain).'
        },
        {
          question: 'Jenis reaksi kimia apa yang terjadi pada eksperimen ini?',
          options: ['Reaksi Pembakaran', 'Reaksi Pengendapan (Presipitasi)', 'Reaksi Redoks Gas', 'Reaksi Netralisasi'],
          correctIndex: 1,
          explanation: 'Reaksi ini merupakan reaksi metatesis / presipitasi pembentukan garam tak larut PbI2.'
        }
      ]),
      kkmScore: 75,
    };

    await conn.query(
      `INSERT INTO lab_tasks 
       (id, classroom_id, room_code, teacher_name, title, grade_level, instructions, chemical_ids, expected_reaction_id, quiz_questions, kkm_score, allow_retake_below_kkm, show_quiz_review_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE
         classroom_id = VALUES(classroom_id),
         room_code = VALUES(room_code),
         teacher_name = VALUES(teacher_name),
         title = VALUES(title),
         grade_level = VALUES(grade_level),
         instructions = VALUES(instructions),
         chemical_ids = VALUES(chemical_ids),
         expected_reaction_id = VALUES(expected_reaction_id),
         quiz_questions = VALUES(quiz_questions),
         kkm_score = VALUES(kkm_score)`,
      [
        taskRina.id,
        taskRina.classroomId,
        taskRina.roomCode,
        taskRina.teacherName,
        taskRina.title,
        taskRina.gradeLevel,
        taskRina.instructions,
        taskRina.chemicalIds,
        taskRina.expectedReactionId,
        taskRina.quizQuestions,
        taskRina.kkmScore,
      ]
    );

    // Submissions untuk Kelas Ibu Rina: Aditya Pratama (90) & Nadia Putri Sari (85)
    await conn.query(
      `INSERT INTO lab_submissions
       (id, task_id, student_name, is_reaction_achieved, quiz_score, quiz_answers, ai_feedback, completed_at)
       VALUES 
         ('sub_rina_01', 'task_rina_01', 'Aditya Pratama', 1, 90, '[]', 'Siswa berhasil membuktikan presipitasi PbI2 dengan sangat akurat dan memahami konsep Ksp.', NOW()),
         ('sub_rina_02', 'task_rina_01', 'Nadia Putri Sari', 1, 85, '[]', 'Pengamatan warna larutan dan waktu pembentukan kristal sangat teliti.', NOW())
       ON DUPLICATE KEY UPDATE
         quiz_score = VALUES(quiz_score),
         ai_feedback = VALUES(ai_feedback)`
    );

    // Tugas & Rekap Nilai untuk Kelas Bapak Hendra Kusuma (cls_kimia_102 / KIM11B)
    const taskHendra = {
      id: 'task_hendra_01',
      classroomId: 'cls_kimia_102',
      roomCode: 'KIM11B',
      teacherName: 'Hendra Kusuma, M.Pd',
      title: 'Reaksi Netralisasi Asam Basa & Indikator Fenolftalein',
      gradeLevel: 'SMA',
      instructions: '1. Masukkan 10 ml HCl ke dalam erlenmeyer. 2. Tambahkan 2 tetes indikator fenolftalein. 3. Tetesi larutan NaOH hingga titik ekuivalen tercapai dan terjadi perubahan warna merah muda lembayung.',
      chemicalIds: JSON.stringify(['ch_hcl', 'ch_naoh', 'ch_pp']),
      expectedReactionId: 'rx_neutralization',
      quizQuestions: JSON.stringify([
        {
          question: 'Bagaimana perubahan warna indikator fenolftalein pada titik akhir titrasi basa?',
          options: ['Jernih menjadi merah muda lembayung', 'Kuning menjadi biru pekat', 'Merah menjadi kuning', 'Tetap jernih tidak berubah'],
          correctIndex: 0,
          explanation: 'Indikator PP bersifat jernih dalam suasana asam dan berubah menjadi magenta/merah muda pada pH basa (titik akhir titrasi).'
        },
        {
          question: 'Garam apa yang dihasilkan dari netralisasi HCl dan NaOH?',
          options: ['NaCl', 'KCl', 'CaCl2', 'MgCl2'],
          correctIndex: 0,
          explanation: 'Reaksi HCl + NaOH -> NaCl + H2O menghasilkan garam natrium klorida (NaCl) dan air.'
        }
      ]),
      kkmScore: 75,
    };

    await conn.query(
      `INSERT INTO lab_tasks 
       (id, classroom_id, room_code, teacher_name, title, grade_level, instructions, chemical_ids, expected_reaction_id, quiz_questions, kkm_score, allow_retake_below_kkm, show_quiz_review_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE
         classroom_id = VALUES(classroom_id),
         room_code = VALUES(room_code),
         teacher_name = VALUES(teacher_name),
         title = VALUES(title),
         grade_level = VALUES(grade_level),
         instructions = VALUES(instructions),
         chemical_ids = VALUES(chemical_ids),
         expected_reaction_id = VALUES(expected_reaction_id),
         quiz_questions = VALUES(quiz_questions),
         kkm_score = VALUES(kkm_score)`,
      [
        taskHendra.id,
        taskHendra.classroomId,
        taskHendra.roomCode,
        taskHendra.teacherName,
        taskHendra.title,
        taskHendra.gradeLevel,
        taskHendra.instructions,
        taskHendra.chemicalIds,
        taskHendra.expectedReactionId,
        taskHendra.quizQuestions,
        taskHendra.kkmScore,
      ]
    );

    // Submissions untuk Kelas Bapak Hendra: Hana Salsabila (95) & Irfan Maulana (80)
    await conn.query(
      `INSERT INTO lab_submissions
       (id, task_id, student_name, is_reaction_achieved, quiz_score, quiz_answers, ai_feedback, completed_at)
       VALUES 
         ('sub_hendra_01', 'task_hendra_01', 'Hana Salsabila', 1, 95, '[]', 'Pemahaman stoikiometri titrasi asam basa sangat sempurna.', NOW()),
         ('sub_hendra_02', 'task_hendra_01', 'Irfan Maulana', 1, 80, '[]', 'Hasil titrasi mencapai titik netralisasi dengan baik.', NOW())
       ON DUPLICATE KEY UPDATE
         quiz_score = VALUES(quiz_score),
         ai_feedback = VALUES(ai_feedback)`
    );

    await conn.commit();
    console.log('Seed berhasil: 2 guru, 2 kelas, 2 tugas terisolasi, rekap nilai terisolasi, dan 29 murid.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});

