const mysql = require('mysql2/promise');

async function migrateQuestsSubmissions() {
  const conn = await mysql.createConnection({
    host: '10.80.80.3',
    port: 3306,
    user: 'capcipcup-db-usr',
    password: '6wcWxy7YFwzPLRbc',
    database: 'capcipcup-db',
  });

  console.log('Connected to MariaDB.');

  // 1. Quests table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS quests (
      id VARCHAR(36) PRIMARY KEY,
      mode VARCHAR(10) NOT NULL CHECK (mode IN ('ROOM', 'SOLO')),
      room_code VARCHAR(10) UNIQUE,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Table `quests` verified/created.');

  // 2. Submissions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id VARCHAR(36) PRIMARY KEY,
      quest_id VARCHAR(36) NOT NULL,
      student_name VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
      scanned_object JSON,
      quiz_answers JSON,
      quiz_score INT DEFAULT 0,
      chat_transcript JSON,
      python_fluency_metrics JSON,
      speaking_score INT DEFAULT 0,
      total_score INT DEFAULT 0,
      cefr_level VARCHAR(10) DEFAULT 'A2',
      ai_feedback JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
    )
  `);
  console.log('Table `submissions` verified/created.');

  // Seed default demo room quest if none exists
  const [existingQuests] = await conn.query("SELECT id FROM quests WHERE room_code = 'EDU889'");
  if (existingQuests.length === 0) {
    const demoQuest = {
      id: 'quest_demo_edu889',
      mode: 'ROOM',
      room_code: 'EDU889',
      creator_name: 'Budi Santoso, S.Pd',
      title: 'Misi Negosiasi Produk Ramah Lingkungan',
      target_language: 'English',
      difficulty_level: 'B1',
      case_study_story: 'Kamu adalah kreator produk lokal. Seorang investor asing melihat botol minum dan buku di mejamu, lalu menantangmu mempresentasikan ide paket produk pelajar ramah lingkungan.',
      npc_name: 'Ms. Clara',
      npc_persona: 'Green Investor antusias, kritis soal daya tahan produk, suka bertanya detail strategi harga pelajar.',
      required_object_hint: 'Gunakan botol minum (bottle) atau buku (book) di sekitarmu sebagai contoh produk fisik!',
      mission_objectives: JSON.stringify([
        'Jelaskan keunggulan utama benda yang kamu scan menggunakan minimal 2 kata sifat bahasa Inggris',
        'Jawab pertanyaan Ms. Clara mengenai manfaat produk tersebut bagi pelajar di Indonesia',
        'Tutup presentasi dengan ajakan kerja sama yang sopan',
      ]),
      target_vocabularies: JSON.stringify(['eco-friendly', 'durable', 'sustainable', 'student', 'reusable']),
      quiz_questions: JSON.stringify([
        {
          question: "Kata sifat manakah yang paling tepat untuk mendeskripsikan botol minum yang tidak mudah pecah dan tahan lama?",
          options: ["Fragile", "Durable", "Temporary", "Hazardous"],
          correctIndex: 1,
          explanation: "'Durable' berarti tahan lama dan kuat, sangat cocok untuk mendeskripsikan kualitas fisik produk.",
        },
        {
          question: "Ungkapan pembuka yang paling profesional untuk memulai presentasi produk kepada investor asing adalah...",
          options: [
            "Hey look at my stuff now!",
            "Good morning Ms. Clara, thank you for having me today.",
            "Can you give me money right away?",
            "I don't know what to say honestly."
          ],
          correctIndex: 1,
          explanation: "'Good morning Ms. Clara, thank you for having me today' menunjukkan kesopanan dan etika bisnis internasional.",
        },
      ]),
    };

    await conn.query(
      `INSERT INTO quests (id, mode, room_code, creator_name, title, target_language, difficulty_level, case_study_story, npc_name, npc_persona, required_object_hint, mission_objectives, target_vocabularies, quiz_questions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        demoQuest.id,
        demoQuest.mode,
        demoQuest.room_code,
        demoQuest.creator_name,
        demoQuest.title,
        demoQuest.target_language,
        demoQuest.difficulty_level,
        demoQuest.case_study_story,
        demoQuest.npc_name,
        demoQuest.npc_persona,
        demoQuest.required_object_hint,
        demoQuest.mission_objectives,
        demoQuest.target_vocabularies,
        demoQuest.quiz_questions,
      ]
    );
    console.log("Seeded default demo room quest: EDU889");
  }

  await conn.end();
}

migrateQuestsSubmissions().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});

