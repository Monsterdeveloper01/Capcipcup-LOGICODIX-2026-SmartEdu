/**
 * Guardrails & Anti-Prompt Injection Filter untuk Asisten Lab Sains Virtual AI
 * Memastikan AI hanya menjawab seputar sains sekolah dan kebal dari manipulasi jailbreak/coding.
 */

export interface GuardrailCheckResult {
  blocked: boolean;
  reason?: "coding_request" | "jailbreak_attempt" | "dangerous_content" | "off_topic";
  safeResponse?: string;
}

// 1. Pola Permintaan Coding / Pemrograman Komputer (misal: "buatkan html", "bikin kode js", dll.)
const CODING_INJECTION_PATTERNS = [
  /(?:buatkan|bikin|tuliskan|generate|create|koding|coding|code)\s+(?:saya\s+)?(?:sebuah\s+)?(?:kode|script|kodingan|html|css|javascript|js|python|php|sql|bash|c\+\+|java|react|nextjs|program|aplikasi|website|web\s+page)/i,
  /<\s*(!doctype\s+html|html|script|style|body|head|iframe|embed|object)[\s>]/i,
  /(?:tulis|buat|bikin)\s+(?:kode|code|skrip|script|program)/i,
  /(?:bagaimana|cara)\s+(?:coding|membuat\s+web|bikin\s+aplikasi|koding)/i,
  /```(?:html|css|js|javascript|python|php|bash|sql|cpp|java)/i,
  /(?:function\s*\(|console\.log|document\.get|alert\s*\(|<\?php)/i,
];

// 2. Pola Jailbreak / Manipulasi System Prompt / Instruction Override
const JAILBREAK_PATTERNS = [
  /(?:ignore|abaikan|lupakan|reset|hapus)\s+(?:all\s+)?(?:previous|semua)?\s*(?:instruction|instruksi|aturan|prompt|peran|role|command)/i,
  /(?:you\s+are\s+now|kamu\s+sekarang\s+adalah|act\s+as|pretend\s+to\s+be|berperanlah\s+sebagai|jadilah)\s+(?:dan|developer\s+mode|unrestricted|hacker|programmer|ai\s+tanpa\s+batas|bot\s+bebas)/i,
  /(?:reveal|tampilkan|bocorkan|sebutkan|print)\s+(?:your\s+)?(?:system\s+prompt|instruksi\s+awal|aturan\s+rahasia|prompt\s+asli)/i,
  /(?:bypass|jailbreak|exploit|injection|inject)/i,
  /(?:mode\s+pengembang|developer\s+mode|unfiltered)/i,
  /(?:mulai\s+sekarang\s+kamu\s+harus|jangan\s+patuhi\s+aturan)/i,
];

// 3. Pola Bahan Berbahaya Ilegal / Senjata / Peledak Terlarang
const DANGEROUS_CONTENT_PATTERNS = [
  /(?:cara\s+membuat|resep|sintesis|panduan\s+merakit|racik)\s+(?:bom|peledak|senjata\s+kimia|racun\s+mematikan|sianida\s+murni|narkoba|sabu|ekstasi)/i,
  /(?:petasan\s+daya\s+ledak\s+tinggi|mesiu\s+ilegal|molotov)/i,
];

/**
 * Memvalidasi input pertanyaan siswa sebelum dikirim ke model LLM.
 * Jika terdeteksi prompt injection atau permintaan coding, langsung ditolak secara aman.
 */
export function validateStudentLabPrompt(rawInput?: string): GuardrailCheckResult {
  if (!rawInput || typeof rawInput !== "string") {
    return { blocked: false };
  }

  const text = rawInput.trim();

  // Cek 1: Permintaan Coding / HTML / Script
  for (const pattern of CODING_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: "coding_request",
        safeResponse:
          "Halo! Kak Lab-AI bertugas khusus membantu eksperimen laboratorium dan pembelajaran konsep sains (SD, SMP, SMA). Kakak tidak dapat membuatkan kode pemrograman komputer, halaman HTML/Web, ataupun script. Yuk, tanyakan seputar reaksi kimia, zat di mejamu, atau fenomena alam yang sedang kamu amati!",
      };
    }
  }

  // Cek 2: Percobaan Jailbreak & Prompt Override
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: "jailbreak_attempt",
        safeResponse:
          "Kak Lab-AI tetap teguh dan fokus sebagai asisten praktikum sains virtualmu! Jika ada konsep reaksi kimia, teori sains, atau zat di mejamu yang ingin kamu tanyakan, silakan beri tahu Kakak ya!",
      };
    }
  }

  // Cek 3: Konten Berbahaya / Bahan Peledak
  for (const pattern of DANGEROUS_CONTENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        blocked: true,
        reason: "dangerous_content",
        safeResponse:
          "Demi keselamatan kerja laboratorium (K3) dan etika ilmiah, Kak Lab-AI tidak dapat memberikan instruksi tentang perakitan senjata, bahan peledak terlarang, atau zat berbahaya. Mari kita pelajari reaksi sains yang aman dan bermanfaat di laboratorium sekolah ini!",
      };
    }
  }

  return { blocked: false };
}

/**
 * Membersihkan output AI dari kemungkinan tag HTML atau script berbahaya
 * sebelum dikirimkan kembali ke antarmuka chat siswa.
 */
export function sanitizeAiLabResponse(rawOutput?: string): string {
  if (!rawOutput) return "";

  let cleaned = rawOutput;

  // Jika AI masih menyelipkan tag HTML atau script code block, bersihkan
  if (/<\s*(script|iframe|embed|object|!doctype|html)/i.test(cleaned)) {
    return "Halo! Kak Lab-AI hanya memberikan penjelasan sains dan konsep laboratorium sekolah. Yuk, tanyakan seputar zat di mejamu atau reaksi kimia yang sedang berlangsung!";
  }

  // Hapus tag HTML mencurigakan yang mungkin diselipkan
  cleaned = cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .trim();

  return cleaned;
}

