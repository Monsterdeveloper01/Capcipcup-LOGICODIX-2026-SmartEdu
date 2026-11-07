<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Panduan Fondasi AI & Manajemen API Token: Capcipcup SmartEdu

Dokumen ini adalah acuan bagi developer dan AI Coding Agent mengenai cara meletakkan, membaca, dan mengamankan Token/API Key AI di project ini.

---

## 1. Tempat Menaruh Token / API Key

Token AI dikelola melalui environment variables di Next.js:

### A. Di Komputer Lokal (`.env.local`)
File [`.env.local`](file:///D:/Application/examppp/htdocs/capcipcup/.env.local) bersifat rahasia dan **otomatis diabaikan oleh Git** (`.gitignore`) agar token tidak bocor ke publik:
```env
# Google Gemini API Key
# Dapatkan token gratis di: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=masukkan_token_api_di_sini
```

### B. Template untuk Tim (`.env.example`)
File [`.env.example`](file:///D:/Application/examppp/htdocs/capcipcup/.env.example) dicatat di Git sebagai panduan bagi rekan tim saat clone:
```env
GEMINI_API_KEY=
```

---

## 2. Fondasi Client AI (`src/lib/ai/client.ts`)

File [`src/lib/ai/client.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/ai/client.ts) berfungsi sebagai fondasi dasar yang membaca token dan menginisialisasi SDK AI (`@google/genai`):

```ts
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

// Instance client AI (bernilai null jika token belum diisi)
export const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Helper untuk mengecek ketersediaan token
export function hasAiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
}
```

---

## 3. Cara Menggunakan Client AI di Route Handler / Server Action

Kapan pun tim ingin membuat endpoint atau fitur AI baru, gunakan fondasi dari `src/lib/ai/client.ts`:

```ts
import { NextResponse } from "next/server";
import { aiClient, hasAiKey } from "@/lib/ai/client";

export async function POST(req: Request) {
  if (!hasAiKey() || !aiClient) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum disetel di .env.local" },
      { status: 500 }
    );
  }

  const { prompt } = await req.json();

  const response = await aiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return NextResponse.json({
    result: response.text,
  });
}
```

---

## 4. Aturan Keamanan Penting untuk AI Agents & Tim:
1. **Jangan Mengekspos Token ke Client:**
   - Dilarang memberi prefix `NEXT_PUBLIC_` pada token AI.
   - Panggilan ke SDK AI **hanya boleh dilakukan di Server** (Route Handler di `src/app/api/...` atau Server Action).
2. **Koneksi Database:**
   - Jika ingin menyimpan input/output AI ke database, gunakan helper `query` dari [`src/lib/db.ts`](file:///D:/Application/examppp/htdocs/capcipcup/src/lib/db.ts).
3. **Fleksibilitas Desain:**
   - Seluruh logika bisnis, pembuatan prompt, struktur JSON kuis, dan alur percakapan diserahkan kepada perancangan tim.
