<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Panduan Arsitektur & Fondasi Integrasi AI: Capcipcup SmartEdu (LOGICODIX 2026)

Dokumen ini adalah referensi utama bagi AI Coding Agents dan developer tim u    ntuk memahami, mengimplementasikan, dan memperluas integrasi AI dalam proyek **Capcipcup SmartEdu**.

---

## 1. Visi & Filosofi AI (Smart & Fun Education)

Fondasi AI dalam sistem ini dirancang untuk mencapai tema kompetisi:
> **Smart & Fun Education:** Mengembangkan solusi digital yang membuat proses belajar-mengajar menjadi lebih interaktif, aksesibel, dan menyenangkan bagi pelajar maupun pengajar, termasuk penggunaan AI sebagai tutor pribadi atau alat bantu visualisasi materi.

### Karakteristik & Persona AI Tutor ("CapcipBot"):
1. **Socratic & Adaptive:** Tidak sekadar memberikan jawaban langsung, tetapi membimbing siswa langkah demi langkah (*scaffolding*).
2. **ELI5 (Explain Like I'm 5):** Menjelaskan konsep abstrak (fisika, kalkulus, biologi, coding) dengan analogi dunia nyata dan visual yang mudah dibayangkan.
3. **Fun & Gamified:** Respons ceria, suportif, kaya emoji edukatif, dan siap memicu kuis interaktif atau penghargaan XP.
4. **Resilient / Zero-Crash:** Memiliki sistem *smart fallback* lokal sehingga aplikasi tetap dapat mendemonstrasikan respons cerdas meskipun API key belum disetel.

---

## 2. Struktur Modul & Fondasi Kode

```text
src/
├── app/
│   ├── api/
│   │   ├── ai/
│   │   │   ├── tutor/route.ts      <-- Endpoint POST Chat AI Tutor
│   │   │   └── quiz/route.ts       <-- Endpoint POST Generator Kuis Otomatis
│   │   └── db-test/route.ts        <-- Endpoint status koneksi database
│   ├── page.tsx                    <-- Landing page & interactive playground
│   └── layout.tsx
├── lib/
│   ├── ai/
│   │   └── gemini.ts               <-- Core AI Engine (Google Gen AI SDK & Prompts)
│   └── db.ts                       <-- MariaDB / MySQL connection pool (mysql2)
```

---

## 3. Cara Menggunakan & Memanggil AI

### A. Memanggil AI Tutor dari Client Component (React)

Gunakan `fetch` ke endpoint `/api/ai/tutor`:

```tsx
"use client";
import { useState } from "react";

export function TutorWidget() {
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const askTutor = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: input }
          ],
          subject: "Fisika",              // Opsional
          mode: "explain"                 // "explain" | "quiz" | "visualize" | "story"
        }),
      });

      const data = await res.json();
      setReply(data.reply);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={askTutor} disabled={loading}>Tanya Tutor</button>
      <p>{reply}</p>
    </div>
  );
}
```

---

### B. Membuat Kuis Otomatis dari Topik Pelajaran

Panggil endpoint `/api/ai/quiz` untuk mendapatkan soal terstruktur dalam bentuk array JSON:

```tsx
const res = await fetch("/api/ai/quiz", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    topic: "Sistem Tata Surya",
    count: 3
  }),
});

const data = await res.json();
// data.questions format:
// [
//   {
//     question: "Planet apa yang terbesar di tata surya?",
//     options: ["Mars", "Jupiter", "Bumi", "Venus"],
//     correctAnswerIndex: 1,
//     explanation: "Jupiter adalah planet terbesar dengan massa lebih dari dua kali lipat gabungan semua planet lain."
//   }
// ]
```

---

### C. Memanggil Langsung di Server-Side / Server Action

Gunakan fungsi dari `src/lib/ai/gemini.ts`:

```ts
import { chatWithTutor, generateQuizQuestions } from "@/lib/ai/gemini";

// Di Server Action atau API Route:
export async function handleServerAction(userPrompt: string) {
  const response = await chatWithTutor({
    messages: [{ role: "user", content: userPrompt }],
    mode: "visualize",
  });
  return response;
}
```

---

## 4. Konfigurasi Lingkungan (`.env.local`)

Untuk mengaktifkan model Gemini secara live:
1. Dapatkan API Key gratis di [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Tambahkan ke file `.env.local`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. Jika `GEMINI_API_KEY` tidak diisi, sistem akan otomatis beralih ke *Smart Fallback Mode* (menjawab topik umum seperti fotosintesis, pythagoras, gravitasi, dll.) tanpa melempar error.

---

## 5. Integrasi Database MariaDB/MySQL (`src/lib/db.ts`)

AI ini dapat langsung diintegrasikan dengan database MariaDB yang telah terhubung:

### Rekomendasi Skema Tabel AI:
```sql
-- Tabel riwayat chat tutor
CREATE TABLE IF NOT EXISTS tutor_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) DEFAULT 'guest',
    subject VARCHAR(64),
    mode VARCHAR(32) DEFAULT 'explain',
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel kuis dan pencapaian XP gamifikasi
CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) DEFAULT 'guest',
    topic VARCHAR(128) NOT NULL,
    score INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Untuk menyimpan interaksi chat:
```ts
import { query } from "@/lib/db";

await query(
  "INSERT INTO tutor_conversations (subject, mode, user_message, ai_response) VALUES (?, ?, ?, ?)",
  [subject, mode, userMessage, aiResponse]
);
```

---

## 6. Aturan untuk AI Coding Agents Selanjutnya:
- **Keamanan Kunci API:** Jangan pernah menaruh `GEMINI_API_KEY` di Client Components (`use client`). Selalu panggil melalui server handler / API route.
- **Konsistensi UI:** Komponen interaktif baru harus selaras dengan estetika Tailwind CSS v4, menggunakan `lucide-react` untuk ikonografi dan `canvas-confetti` untuk efek selebrasi gamifikasi.
- **Dokumentasi Terjaga:** Jangan menghapus blok pembuka `<!-- BEGIN:nextjs-agent-rules -->`.
