-- ==============================================================================
-- SKEMA DATABASE: Capcipcup SmartEdu (LOGICODIX 2026)
-- Database: capcipcup-db
-- Dialek: MariaDB / MySQL 8.x
-- ==============================================================================

-- 1. Tabel Pengguna (Pelajar & Pengajar)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    avatar_url VARCHAR(255),
    xp INT DEFAULT 0,
    level INT DEFAULT 1,
    streak_days INT DEFAULT 0,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Mata Pelajaran / Topik
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color_theme VARCHAR(50) DEFAULT 'indigo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Modul & Materi Pembelajaran Interaktif
CREATE TABLE IF NOT EXISTS learning_modules (
    id VARCHAR(36) PRIMARY KEY,
    subject_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    content_markdown MEDIUMTEXT,
    visualizer_type VARCHAR(50), -- misal: 'math-geometry', 'physics-motion', 'bio-cell'
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- 4. Tabel Sesi Kuis & Gamifikasi
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    subject_id VARCHAR(50),
    score INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- 5. Tabel Log Interaksi AI (Opsional - untuk riwayat belajar)
CREATE TABLE IF NOT EXISTS ai_interactions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    feature_type VARCHAR(50) DEFAULT 'tutor', -- 'tutor', 'visualizer', 'quiz_generator'
    prompt TEXT NOT NULL,
    response MEDIUMTEXT,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 6. TABEL LINGUAQUEST (RPG BAHASA BERBASIS DUNIA NYATA & AI CO-PILOT GURU)
-- ==============================================================================

-- 6.1 Tabel Quest / Misi Percakapan
CREATE TABLE IF NOT EXISTS lingua_quests (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    mode ENUM('survival', 'smk_career', 'local_pride', 'boss_raid') DEFAULT 'survival',
    target_language VARCHAR(30) DEFAULT 'english', -- 'english', 'mandarin', 'japanese', 'sunda', 'jawa'
    scenario_brief TEXT NOT NULL,
    npc_name VARCHAR(100) NOT NULL,
    npc_role VARCHAR(100),
    target_vocab JSON, -- Array kata wajib diucapkan
    curriculum_topic VARCHAR(150),
    created_by VARCHAR(36), -- ID Guru yang membuat quest
    class_code VARCHAR(50) DEFAULT 'CLASS-10A',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6.2 Tabel Item Hasil Scan Lingkungan Nyata (Object-to-Inventory)
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
);

-- 6.3 Tabel Sesi Bicara & Evaluasi CEFR (Post-Game Autopsy)
CREATE TABLE IF NOT EXISTS speaking_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    quest_id VARCHAR(36),
    class_code VARCHAR(50) DEFAULT 'CLASS-10A',
    duration_seconds INT DEFAULT 0,
    cefr_level VARCHAR(10) DEFAULT 'A2', -- A1, A2, B1, B2, C1
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
);

-- 6.4 Tabel Radar Peta Masalah Kelas (Class Misconception Heatmap)
CREATE TABLE IF NOT EXISTS class_misconceptions (
    id VARCHAR(36) PRIMARY KEY,
    class_code VARCHAR(50) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    target_language VARCHAR(30) DEFAULT 'english',
    common_mistakes_json JSON,
    recommended_warmup JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

