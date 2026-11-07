import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// System prompt for CapcipBot Educational Tutor
export const SMARTEDU_SYSTEM_PROMPT = `
Kamu adalah CapcipBot, asisten AI Tutor pribadi dalam platform pendidikan "Capcipcup SmartEdu" (LOGICODIX 2026).
Tujuan utamamu adalah membuat proses belajar-mengajar menjadi interaktif, aksesibel, dan menyenangkan (Smart & Fun Education).

Pedoman Komunikasi:
1. Nada bicara: Ramah, antusias, suportif, mudah dipahami (menggunakan bahasa Indonesia yang santai tapi edukatif).
2. Gunakan analogi dunia nyata dan penjelasan bertahap (metode ELI5 / Socratic) agar konsep abstrak mudah dibayangkan.
3. Sisipkan emoji yang relevan untuk menjaga suasana belajar tetap ceria dan tidak membosankan.
4. Selalu dorong pelajar untuk berpikir kritis dan beri pujian atas rasa ingin tahu mereka.
5. Jika ditanya rumus matematika atau sains, jelaskan arti di balik setiap variabel sebelum memberikan contoh soal.
`;

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  content: string;
}

export interface TutorOptions {
  messages: ChatMessage[];
  subject?: string;
  mode?: "explain" | "quiz" | "visualize" | "story";
}

/**
 * 1. AI Tutor Chat Completion
 */
export async function chatWithTutor(options: TutorOptions): Promise<string> {
  const { messages, subject, mode = "explain" } = options;

  let modeInstruction = "";
  if (mode === "quiz") {
    modeInstruction = "Berikan 1 pertanyaan kuis interaktif singkat dengan 4 opsi pilihan ganda dan tunggu jawaban pengguna.";
  } else if (mode === "visualize") {
    modeInstruction = "Bantu visualisasikan konsep ini menggunakan analogi visual langkah demi langkah yang sangat mudah dibayangkan.";
  } else if (mode === "story") {
    modeInstruction = "Jelaskan konsep ini dalam bentuk cerita petualangan pendek yang seru.";
  }

  const systemInstruction = `${SMARTEDU_SYSTEM_PROMPT}\n${subject ? `Topik pelajaran: ${subject}.` : ""}\n${modeInstruction}`;

  // If no Gemini API key is configured, fallback to high-quality smart mock response
  if (!ai || !apiKey) {
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    return generateFallbackTutorResponse(lastUserMsg, mode);
  }

  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : m.role,
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "Maaf, aku sedang berpikir keras. Bisakah kamu ulangi pertanyaannya?";
  } catch (error: any) {
    console.warn("Gemini API call failed, using smart fallback:", error?.message);
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    return generateFallbackTutorResponse(lastUserMsg, mode);
  }
}

/**
 * 2. Generate Structured Quiz Questions
 */
export async function generateQuizQuestions(topic: string, count: number = 3): Promise<Array<{
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}>> {
  if (!ai || !apiKey) {
    return [
      {
        question: `Konsep dasar apa yang paling esensial dalam mempelajari ${topic}?`,
        options: [
          "Pemahaman konsep dasar dan prinsip kerja",
          "Menghafal rumus tanpa mengerti logika",
          "Membaca sekilas tanpa latihan",
          "Melewatkan bab pendahuluan",
        ],
        correctAnswerIndex: 0,
        explanation: "Memahami konsep dan prinsip kerja mendasar adalah kunci utama dalam belajar efektif.",
      },
    ];
  }

  const prompt = `Buatkan ${count} soal kuis pilihan ganda bertema "${topic}" dalam format JSON murni.
Format harus berupa array objek JSON dengan struktur:
[
  {
    "question": "string pertanyaan",
    "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
    "correctAnswerIndex": 0,
    "explanation": "penjelasan singkat mengapa jawaban tersebut benar"
  }
]
Keluarkan HANYA JSON tanpa tanda kutip markdown backticks.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to generate quiz with Gemini:", err);
    return [
      {
        question: `Berdasarkan materi ${topic}, apa tujuan utama mempelajarinya?`,
        options: [
          "Meningkatkan pemecahan masalah (problem solving)",
          "Hanya untuk nilai ujian",
          "Menghabiskan waktu luang",
          "Tidak ada kegunaan nyata",
        ],
        correctAnswerIndex: 0,
        explanation: "Pendidikan interaktif melatih pola pikir analitis dan pemecahan masalah.",
      },
    ];
  }
}

/**
 * Fallback response generator when API key is not present
 */
function generateFallbackTutorResponse(question: string, mode: string): string {
  const q = question.toLowerCase();

  if (q.includes("fotosintesis")) {
    return "🌿 **Fotosintesis itu mudah dipahami!**\n\nBayangkan daun tanaman seperti koki di restoran tenaga surya:\n1. Daun menyerap air (H₂O) dari akar.\n2. Mengambil gas karbon dioksida (CO₂) dari udara.\n3. Memasak dengan bantuan sinar matahari (energi foton).\n\n**Hasilnya?** Makanan untuk tanaman (glukosa) dan bonus udara segar (Oksigen / O₂) untuk kita bernapas! ☀️🍃";
  }

  if (q.includes("pythagoras") || q.includes("pitagoras")) {
    return "📐 **Teorema Pythagoras (a² + b² = c²)!**\n\nTeorema ini berlaku khusus untuk **segitiga siku-siku**:\n- Sisi miring (hipotenusa / c) selalu yang paling panjang.\n- Luas persegi pada sisi miring sama dengan jumlah luas persegi pada kedua sisi tegaknya.\n\n*Contoh nyata:* Jika tinggi tiang 3m dan jarak ke alas 4m, panjang tali penarik ke puncak tiang adalah √(3² + 4²) = √(9 + 16) = √25 = **5 meter**! ✨";
  }

  if (q.includes("gravitasi") || q.includes("newton")) {
    return "🍎 **Gravitasi: Gaya Tarik Semesta!**\n\nGravitasi adalah gaya tak terlihat yang menarik benda-benda satu sama lain. Semakin besar massa suatu benda (seperti Bumi kita), semakin kuat tarikan gravitasinya. Itulah sebabnya saat apel lepas dari pohonnya, ia jatuh ke tanah, bukan melayang ke langit! 🌍";
  }

  return `Pertanyaan yang sangat menarik tentang "${question}"! 💡\n\nSebagai tutor belajarmu di Capcipcup SmartEdu, aku sarankan kita pecah topik ini menjadi 3 langkah mudah:\n1. Pahami ide dasarnya lewat contoh kehidupan sehari-hari.\n2. Coba uji pemahamanmu lewat kuis interaktif.\n3. Simulasikan hasilnya secara visual.\n\n*(Catatan: Pasang \`GEMINI_API_KEY\` pada \`.env.local\` untuk mengaktifkan AI dinamis secara live!)*`;
}
