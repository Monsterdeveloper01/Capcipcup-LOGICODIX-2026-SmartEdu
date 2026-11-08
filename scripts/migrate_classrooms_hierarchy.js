const mysql = require('../node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log("=== STARTING CLASSROOMS & ROSTER MIGRATION ===");
  const envPath = path.resolve(__dirname, '../.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });

  const conn = await mysql.createConnection({
    host: env.DB_HOST || '10.80.80.3',
    port: parseInt(env.DB_PORT || '3306'),
    user: env.DB_USER || 'admin',
    password: env.DB_PASSWORD || 'admin123',
    database: env.DB_NAME || 'capcipcup-db'
  });

  // 1. Create table `classrooms`
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`classrooms\` (
      \`id\` varchar(36) NOT NULL,
      \`class_code\` varchar(10) NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`grade_level\` varchar(50) DEFAULT 'Kelas 10',
      \`academic_year\` varchar(20) DEFAULT '2026/2027',
      \`teacher_id\` varchar(36) DEFAULT NULL,
      \`teacher_name\` varchar(100) NOT NULL DEFAULT 'Budi Santoso, S.Pd',
      \`description\` text DEFAULT NULL,
      \`created_at\` timestamp NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`class_code\` (\`class_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
  console.log("Table `classrooms` created/verified.");

  // 2. Create table `classroom_members`
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`classroom_members\` (
      \`id\` varchar(36) NOT NULL,
      \`classroom_id\` varchar(36) NOT NULL,
      \`user_id\` varchar(36) NOT NULL,
      \`student_name\` varchar(100) NOT NULL,
      \`student_username\` varchar(50) DEFAULT NULL,
      \`joined_at\` timestamp NULL DEFAULT current_timestamp(),
      \`status\` varchar(20) DEFAULT 'ACTIVE',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_student_class\` (\`classroom_id\`, \`user_id\`),
      KEY \`classroom_id\` (\`classroom_id\`),
      KEY \`user_id\` (\`user_id\`),
      CONSTRAINT \`fk_cm_classroom\` FOREIGN KEY (\`classroom_id\`) REFERENCES \`classrooms\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_cm_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
  console.log("Table `classroom_members` created/verified.");

  // 3. Add `classroom_id` column to `quests` if not exists and drop UNIQUE on room_code
  const [cols] = await conn.query("SHOW COLUMNS FROM quests LIKE 'classroom_id'");
  if (cols.length === 0) {
    await conn.query("ALTER TABLE quests ADD COLUMN classroom_id varchar(36) DEFAULT NULL AFTER mode");
    console.log("Added `classroom_id` column to `quests`.");
  } else {
    console.log("`classroom_id` column already exists in `quests`.");
  }

  // Check if room_code has UNIQUE index and convert to normal index
  try {
    const [indexes] = await conn.query("SHOW INDEXES FROM quests WHERE Key_name = 'room_code'");
    if (indexes.length > 0 && indexes[0].Non_unique === 0) {
      await conn.query("ALTER TABLE quests DROP INDEX room_code");
      await conn.query("ALTER TABLE quests ADD INDEX idx_room_code (room_code)");
      console.log("Converted quests.room_code from UNIQUE to standard INDEX (so 1 class can have multiple tasks).");
    }
  } catch (e) {
    console.warn("Index update warning:", e.message);
  }

  // 4. Seed default Classroom `EDU889`
  const [existingClasses] = await conn.query("SELECT id FROM classrooms WHERE class_code = 'EDU889'");
  let classroomId = 'cls_demo_edu889';
  if (existingClasses.length === 0) {
    await conn.query(`
      INSERT INTO classrooms (id, class_code, name, grade_level, academic_year, teacher_id, teacher_name, description)
      VALUES (?, 'EDU889', 'Kelas 10 RPL A (Bahasa Inggris)', 'Kelas 10 SMK', '2026/2027', 'usr_teacher_01', 'Budi Santoso, S.Pd', 'Kelas Speaking Kurikulum Merdeka Fase E - Bahasa Inggris Terapan SMK')
    `, [classroomId]);
    console.log("Seeded default classroom: [EDU889] Kelas 10 RPL A");
  } else {
    classroomId = existingClasses[0].id;
    console.log("Classroom EDU889 exists with id:", classroomId);
  }

  // 5. Seed default students into `classroom_members`
  const [students] = await conn.query("SELECT id, name, username FROM users WHERE role = 'student'");
  for (const s of students) {
    const [existingMember] = await conn.query(
      "SELECT id FROM classroom_members WHERE classroom_id = ? AND user_id = ?",
      [classroomId, s.id]
    );
    if (existingMember.length === 0) {
      const memberId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await conn.query(
        "INSERT INTO classroom_members (id, classroom_id, user_id, student_name, student_username) VALUES (?, ?, ?, ?, ?)",
        [memberId, classroomId, s.id, s.name, s.username]
      );
      console.log(`Enrolled student ${s.name} (${s.username}) into classroom EDU889.`);
    }
  }

  // 6. Link all current quests with room_code = 'EDU889' or 'JOB999' to classroomId
  await conn.query(
    "UPDATE quests SET classroom_id = ?, room_code = 'EDU889' WHERE room_code IS NOT NULL",
    [classroomId]
  );
  console.log("Linked active quests to classroom EDU889.");

  console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  await conn.end();
}

migrate().catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});
