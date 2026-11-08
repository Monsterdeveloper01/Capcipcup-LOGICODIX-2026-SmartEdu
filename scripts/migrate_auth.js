const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function migrateAuth() {
  const conn = await mysql.createConnection({
    host: '10.80.80.3',
    port: 3306,
    user: 'capcipcup-db-usr',
    password: '6wcWxy7YFwzPLRbc',
    database: 'capcipcup-db',
  });

  console.log('Connected to MariaDB.');

  // Check columns
  const [cols] = await conn.query('DESCRIBE users');
  const colNames = cols.map((c) => c.Field);

  if (!colNames.includes('username')) {
    await conn.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE AFTER name');
    console.log('Added column `username`.');
  }

  if (!colNames.includes('password')) {
    await conn.query('ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER email');
    console.log('Added column `password`.');
  } else {
    await conn.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255)');
  }

  // Update enum
  await conn.query("ALTER TABLE users MODIFY COLUMN role ENUM('student', 'teacher', 'admin', 'superadmin') DEFAULT 'student'");
  console.log('Updated `role` enum to include superadmin.');

  // Seed default demo accounts with BCYPT HASHED PASSWORDS
  const demoUsers = [
    {
      id: 'usr_superadmin_01',
      name: 'Super Administrator',
      username: 'superadmin',
      email: 'superadmin@capcipcup.edu',
      rawPassword: 'admin123',
      role: 'superadmin',
      avatar_url: '⚡',
      xp: 9999,
      level: 99,
      streak_days: 30,
    },
    {
      id: 'usr_teacher_01',
      name: 'Budi Santoso, S.Pd',
      username: 'guru',
      email: 'budi.guru@capcipcup.edu',
      rawPassword: 'guru123',
      role: 'teacher',
      avatar_url: '👨‍🏫',
      xp: 4200,
      level: 25,
      streak_days: 14,
    },
    {
      id: 'usr_student_01',
      name: 'Ahmad Faiz',
      username: 'siswa',
      email: 'ahmad.siswa@capcipcup.edu',
      rawPassword: 'siswa123',
      role: 'student',
      avatar_url: '🎒',
      xp: 680,
      level: 4,
      streak_days: 5,
    },
  ];

  for (const u of demoUsers) {
    const hashedPassword = await bcrypt.hash(u.rawPassword, 10);
    await conn.query(
      `INSERT INTO users (id, name, username, email, password, role, avatar_url, xp, level, streak_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), xp=VALUES(xp), level=VALUES(level)`,
      [u.id, u.name, u.username, u.email, hashedPassword, u.role, u.avatar_url, u.xp, u.level, u.streak_days]
    );
    console.log(`Seeded user: ${u.username} (${u.role}) - Password Hashed with Bcrypt`);
  }

  const [finalUsers] = await conn.query('SELECT id, name, username, email, role, xp, level FROM users');
  console.log('Current users in DB:', finalUsers);

  await conn.end();
}

migrateAuth().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

