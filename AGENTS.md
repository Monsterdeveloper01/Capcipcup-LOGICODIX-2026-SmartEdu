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
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";

export async function POST(req: Request) {
  if (!hasAiKey()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum disetel di .env.local" },
      { status: 500 }
    );
  }

  const { prompt } = await req.json();
  const ai = getAiClient();

  const response = await generateContentWithFallback(ai, {
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

---

## 5. Rencana & Spesifikasi Fitur: Dual-Graphics 3D Lab (Mode Low vs Mode HD Nyata)

Dokumen spesifikasi ini mencatat rancangan sistem grafis ganda untuk Laboratorium Virtual Sains 3D Capcipcup. Pengguna dapat berganti antara performa ringan (Low) dan visual fisik fotorealistik (HD Nyata) langsung dari antarmuka meja lab.

### A. Tabel Perbandingan Spesifikasi Visual

| Aspek Grafis | ⚡ Mode Low (Performa Ringan / Default Hemat Daya) | 💎 Mode HD (Ultra Realistis & Nyata) |
| :--- | :--- | :--- |
| **Material Kaca Wadah** | `meshPhysicalMaterial` standar tanpa transmisi berat (`opacity = 0.35`, `roughness = 0.05`). Sangat ringan untuk laptop kentang & perangkat mobile. | **True Borosilicate Glass 3.3:** Refraksi fisik optik (`transmission = 0.92`, `ior = 1.52`, `thickness = 0.4`), kilau specular tajam (`clearcoat = 1.0`, `clearcoatRoughness = 0.02`), dan distorsi visual objek di balik kaca. |
| **Zat Cair & Fluida** | Silinder fasa cairan semi-transparan dengan emissive warna ringan. | **Fluida Fisik Refraktif:** Indeks bias larutan air ($ior = 1.33$), penyerapan kedalaman warna (*volumetric optical depth*), gelombang dinamis halus (*micro-ripples*) di permukaan meniskus, dan pembiasan cahaya garis batas dua fasa (misal minyak di atas air). |
| **Reaksi Kimia (Partikel)** | Partikel 2D sprite dasar (20–30 partikel) berkinerja tinggi 60 FPS di semua perangkat. | **Partikel Volumetrik HD (100+ partikel):**<br>• *Effervescence:* Buih gas mendesis dengan kilau gelembung specular.<br>• *Turbulent Steam:* Asap/uap tebal lembut rotasional dengan thermal glow di pusat reaksi.<br>• *Golden Rain:* Kerlap-kerlip kristal emas berkilau (*twinkling anisotropic sparkles*).<br>• *Precipitate Tendrils:* Difusi koloid organik menyebar perlahan dalam cairan. |
| **Meja & Ruang Laboratorium** | Meja solid warna putih/abu-abu dengan grid helper dasar. | **Countertop Epoksi Glossy / Marmer Lab:** Pantulan refleksi meja terhadap bejana kaca di atasnya, detail grout ubin lantai vinil, panel lampu neon plafon dengan highlight specular. |
| **Renderer Three.js** | `dpr = 1`, `shadow-mapSize = [512, 512]`, antialias standar. | `dpr = [1, 2]` (*Retina HD Sharp*), *Soft Ambient Contact Shadows* (`PCFSoftShadowMap`, `shadow-mapSize = [2048, 2048]`), akurasi pencahayaan HDR. |

### B. Mekanisme State & User Interface
1. **Penyimpanan Pengaturan:** State `graphicsQuality` bernilai `"low"` atau `"hd"`, disimpan di `localStorage` (`capcipcup_lab_graphics_quality`) agar preferensi pengguna diingat otomatis setiap kali membuka lab.
2. **Kontrol UI:** Tombol toggle kualitas grafis di bagian atas meja 3D:
   - `[ ⚡ Mode: Low ]` / `[ 💎 Mode: HD Nyata ]`
3. **File Terkait:**
   - [`src/components/lab/SmartScienceLabViewer.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/lab/SmartScienceLabViewer.tsx): Mengelola state `graphicsQuality` dan tombol toggle UI.
   - [`src/components/lab/ChemistryLabScene.tsx`](file:///D:/Application/examppp/htdocs/capcipcup/src/components/lab/ChemistryLabScene.tsx): Menerima prop `graphicsQuality` untuk mengaktifkan pengaturan PBR transmission, partikel HD, pencahayaan, dan shadow map.
