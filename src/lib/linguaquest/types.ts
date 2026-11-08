// ==============================================================================
// LINGUAQUEST - RPG BAHASA INGGRIS DUNIA NYATA (LIVE ENVIRONMENT ROLEPLAY)
// Fokus Utama: Mengatasi "Passive Fluency Trap" Siswa Indonesia dalam Bahasa Inggris
// ==============================================================================

export type GameMode = "survival" | "smk_career" | "local_pride" | "boss_raid";

export interface ScannedItem {
  id: string;
  objectName: string; // nama objek lokal (misal: "Sepatu")
  englishWord: string; // kosakata bahasa Inggris (misal: "Hiking Sneakers")
  phonetics: string; // IPA phonetics (misal: "/ˈhaɪ.kɪŋ ˈsniː.kərz/")
  meaningId: string; // arti/konteks dalam bahasa Indonesia
  idiom: string; // idiom bahasa Inggris terkait (misal: "Put yourself in someone's shoes")
  rpgAttribute: string; // status & efek dalam quest RPG
  iconName: string;
  usedInSpeech?: boolean;
}

export interface QuestScenario {
  id: string;
  title: string;
  mode: GameMode;
  npcName: string;
  npcRole: string;
  npcAvatar: string;
  npcPersonality: string;
  scenarioBrief: string;
  urgentGoal: string; // Tantangan mendesak dalam bahasa Inggris
  targetVocab: string[]; // Kosakata wajib yang harus diucapkan dalam kalimat
  timeLimitSeconds: number;
  initialNpcGreeting: string; // Kalimat pembuka NPC dalam bahasa Inggris
  curriculumTopic: string; // RPP / Elemen Kurikulum Merdeka
  targetItems: ScannedItem[];
}

export interface RoleplayTurnMessage {
  id: string;
  sender: "npc" | "student" | "system";
  text: string;
  timestamp: number;
  hint?: string; // Bisikan AI jika siswa terhenti lebih dari 5 detik atau code-switching
  upgrade?: string; // Native-like Upgrade ("Cara ngomong yang lebih natural")
  usedItems?: string[]; // Kosakata benda yang berhasil diucapkan
  rapportChange?: number; // Perubahan meter kepuasan/kepercayaan NPC (+15, -5)
}

export interface NativeUpgrade {
  original: string;
  upgraded: string;
  explanation: string;
}

export interface SpeakingEvaluation {
  id: string;
  questTitle: string;
  studentName: string;
  timestamp: string;
  cefrLevel: "A1" | "A2" | "B1" | "B2" | "C1";
  overallScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  vocabularyScore: number;
  grammarScore: number;
  hesitationSeconds: number;
  codeSwitchingCount: number;
  transcriptSummary: string;
  strengths: string[];
  areasToImprove: string[];
  nativeUpgrades: NativeUpgrade[];
  xpEarned: number;
  transcriptMessages?: Array<{ sender: "student" | "npc"; text: string; upgrade?: string; timestamp?: number }>;
  badgeUnlocked?: {
    title: string;
    icon: string;
    description: string;
  };
}

export interface TeacherCurriculumQuestInput {
  gradeLevel: string; // e.g. "SMP Kelas 8", "SMK Perhotelan", "SMA Kelas 11"
  subjectTopic: string; // e.g. "Procedure Text", "Handling Guest Complaint", "Describing Local Craft"
  requiredVocabulary: string; // e.g. "apologize, refund, complimentary, receipt"
}

export interface ClassMisconceptionItem {
  id: string;
  category: "Pronunciation" | "Grammar" | "Vocabulary" | "Fluency";
  errorDescription: string;
  affectedPercentage: number; // e.g. 68% siswa
  exampleMistake: string;
  correctForm: string;
  recommendedWarmup: string;
}
