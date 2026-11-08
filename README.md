# LINGUAQUEST (DuniaKata) — AI Coding Agent Master Specification (`AGENT.md`)

Dokumen spesifikasi teknis ini dirancang khusus sebagai instruksi utama (*context & prompt guide*) untuk **AI Coding Agent** (Cursor, Windsurf, Claude Code, GitHub Copilot) dalam membangun MVP aplikasi hackathon bertema **Smart and Fun Education** menggunakan **Arsitektur Hybrid AI (Next.js + Python FastAPI Lokal + Gemini API Token)**.

## 1. Visi Produk & Konteks Masalah Pendidikan di Indonesia

**LinguaQuest (DuniaKata)** adalah platform *Real-World Environment Language & Case-Study RPG* pertama di Indonesia yang mengubah benda-benda di sekitar siswa menjadi media studi kasus interaktif, kuis kontekstual, dan simulasi *roleplay* suara bertenaga Hybrid AI.

* **Masalah Utama yang Diselesaikan:**
  1. **Passive Fluency & Context Gap (Siswa):** Siswa Indonesia menghafal teori bahasa dan materi di buku teks tetapi mengalami *speaking anxiety* (takut bicara) dan kesulitan menerapkan konsep pada objek atau situasi dunia nyata.
  2. **Beban Rasio Guru 1:35 (Guru):** Satu guru harus mengajar 35–40 siswa di kelas sehingga tidak mungkin menguji, menilai kemampuan berbicara (*speaking*), dan membuat studi kasus kontekstual secara personal untuk setiap siswa setiap minggu.
* **Solusi Inovatif (*Smart & Fun*):**
  Menggabungkan **Deteksi Kamera Cepat di Python**, **Simulasi Roleplay Suara Cerdas (`Gemini API`)**, dan **Sistem Kuis Studi Kasus** ke dalam 2 mode terpadu:
  1. **Mode 1 — Classroom Room Mode (Guru & Murid):** Guru membuat *Room* berisi kuis serta studi kasus *roleplay* sendiri (manual atau dibantu AI), lalu murid masuk menggunakan 6-digit PIN untuk mengerjakan misi dengan memindai objek nyata di sekitar mereka. Hasil nilai, transkrip, dan *insight* kelas langsung muncul secara *real-time* di *Dashboard* Guru.
  2. **Mode 2 — Solo Explorer Mode (Perseorangan / Mandiri):** Pengguna mandiri membuat soal kuis dan studi kasus sendiri secara instan—baik dengan memindai benda-benda di meja/kamar menggunakan kamera maupun mengetik skenario latihan kustom—lalu langsung mengerjakannya untuk mendapatkan evaluasi CEFR dan kartu kosakata (*Vocab Inventory*).

## 2. Pembagian Tugas Hybrid AI (Python Ringan vs Gemini API Berat)

Arsitektur ini membagi beban kerja AI menjadi dua lapisan agar **hemat token hingga 75%**, memiliki **kecepatan *real-time* di kamera**, dan **mendapatkan poin penuh pada aspek *Machine Learning* di mata juri hackathon**:

| Kategori Beban Kerja | Lokasi Eksekusi | Teknologi / Model | Tugas Spesifik yang Dikerjakan | Biaya Token API |
| :--- | :--- | :--- | :--- | :--- |
| **1. Tugas AI Ringan & Real-Time (*Low-Latency Edge Tasks*)** | **Backend Python Lokal** ([FastAPI](https://fastapi.tiangolo.com/)) | [Ultralytics YOLO](https://docs.ultralytics.com/usage/python) (`yolo11n.pt` / `yolov8n.pt`) + Python Text/Speech Metrics | 1. **Deteksi Objek Kamera Real-Time:** Mengidentifikasi benda di depan kamera + koordinat *bounding box* dan *confidence score*.<br>2. **Kamus & Phonetics Instan:** Mengambil terjemahan dasar, daftar kata sifat (*adjectives*), dan cara baca benda yang terdeteksi.<br>3. **Kalkulasi Metrik Fluency & Kecepatan Bicara:** Menghitung *Words Per Minute (WPM)*, rasio *filler words* ("umm", "eee"), dan pencocokan *target vocabulary* secara deterministik di Python. | **0 Token (100% Gratis)** |
| **2. Tugas AI Berat & Penalaran (*Heavy Reasoning Tasks*)** | **Cloud LLM via API Token** | **Google Gemini SDK** (`gemini-2.5-flash` di [Google AI Studio](https://aistudio.google.com/docs/pricing)) | 1. **Generator Studi Kasus & Kuis Kontekstual:** Menyusun cerita studi kasus, karakter NPC, dan soal kuis pilihan ganda dari daftar nama benda (teks) yang dikirim oleh Python.<br>2. **Dynamic NPC Roleplay:** Menjawab obrolan improvisasi siswa sesuai kepribadian NPC.<br>3. **Evaluasi Mendalam & Rapor CEFR:** Mengoreksi tata bahasa (*grammar upgrade*) dan merangkum peta kelemahan satu kelas untuk Guru. | **Sangat Hemat (~150–600 token teks per request, tanpa perlu kirim gambar ke API)** |

## 3. Struktur Direktori Proyek Monorepo (Next.js + Python FastAPI)

Bangun struktur folder *monorepo* berikut agar *frontend* Next.js dan *microservice* Python berjalan berdampingan dengan rapi:

```text
linguaquest-hackathon/
├── frontend/                           # Next.js 14/15/16 App Router (TypeScript + Tailwind + Neo-Brutalism UI)
│   └── src/
│       ├── app/
│       │   ├── page.tsx                # Landing Page: Pilih Mode Room (Guru/Murid) atau Mode Solo
│       │   ├── teacher/
│       │   │   ├── create/page.tsx     # Form Guru buat Room, Studi Kasus & Kuis (Manual / AI Assist)
│       │   │   └── room/[code]/page.tsx# Live Dashboard Guru: PIN Room, Leaderboard, Class Heatmap
│       │   ├── room/join/page.tsx      # Halaman Murid input 6-Digit PIN & Nama
│       │   ├── solo/create/page.tsx    # Halaman Perseorangan: Scan Benda / Ketik Topik untuk Buat Soal
│       │   ├── play/[questId]/page.tsx # Unified Game Engine: Pre-Quiz -> YOLO Scan -> NPC Roleplay
│       │   ├── result/[subId]/page.tsx # Rapor Evaluasi: Skor WPM Python + Koreksi Kalimat Gemini
│       │   └── api/                    # Next.js Route Handlers (untuk tugas berat Gemini API)
│       │       ├── generate-quest/route.ts
│       │       ├── roleplay-chat/route.ts
│       │       └── evaluate/route.ts
│       ├── components/
│       │   ├── game/
│       │   │   ├── CameraScanner.tsx   # Webcam + Bounding Box Overlay dari Python FastAPI
│       │   │   ├── QuizStage.tsx       # Komponen pengerjaan kuis pilihan ganda interaktif
│       │   │   ├── RoleplayArena.tsx   # Layar dialog NPC, Live WPM Meter, & Mission Checklist HUD
│       │   │   └── VocabCardModal.tsx  # Pop-up kartu item RPG saat benda berhasil di-scan
│       │   └── teacher/
│       │       ├── LiveSubmissionList.tsx
│       │       └── ClassInsightCard.tsx
│       └── lib/
│           ├── db.ts                   # Inisialisasi Database Client (MariaDB / Supabase)
│           ├── gemini.ts               # Inisialisasi GoogleGenAI (@google/genai)
│           └── python-api.ts           # Helper pemanggil endpoint FastAPI (http://localhost:8000)
│
└── backend-python/                     # Python Lightweight AI Service (FastAPI)
    ├── main.py                         # Server utama FastAPI (CORS aktif untuk localhost:3000)
    ├── vision_detector.py              # Modul deteksi objek ringan dengan Ultralytics YOLO nano
    ├── speech_metrics.py               # Modul penghitung WPM, Vocabulary Match, & Hesitation Score
    └── requirements.txt                # fastapi, uvicorn, ultralytics, pillow, python-multipart
```

## 4. Skema Database Supabase & MariaDB (SQL Migration)

Jalankan *query* SQL berikut untuk mendukung Mode 1 (Room Guru) dan Mode 2 (Solo):

```sql
-- 1. Tabel Utama Penyimpan Room Guru maupun Sesi Solo
CREATE TABLE IF NOT EXISTS quests (
  id VARCHAR(36) PRIMARY KEY,
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('ROOM', 'SOLO')),
  room_code VARCHAR(10) UNIQUE, -- Terisi 6 karakter (misal: 'EDU889') jika mode = 'ROOM', NULL jika 'SOLO'
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
);

-- 2. Tabel Hasil Pengerjaan Murid (Di-subscribe Realtime oleh Dashboard Guru)
CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(36) PRIMARY KEY,
  quest_id VARCHAR(36) NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  scanned_object JSON, -- Hasil deteksi YOLO Python {label, confidence, bbox, vocab_card}
  quiz_answers JSON,
  quiz_score INT DEFAULT 0,
  chat_transcript JSON,
  python_fluency_metrics JSON, -- {wpm, vocab_hit_rate, filler_count, fluency_score}
  speaking_score INT DEFAULT 0,
  total_score INT DEFAULT 0,
  cefr_level VARCHAR(10) DEFAULT 'A2',
  ai_feedback JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
);
```

## 5. Implementasi Backend Python untuk AI Ringan (`backend-python/main.py`)

Service Python menggunakan [FastAPI](https://fastapi.tiangolo.com/) dan model ringan [Ultralytics YOLO](https://docs.ultralytics.com/usage/python) (`yolov8n.pt` atau `yolo11n.pt` yang hanya berukuran ~6 MB dan berjalan sangat cepat di CPU maupun GPU tanpa memakan token API):

```python
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image
import io
import re

app = FastAPI(title="LinguaQuest Lightweight AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model YOLO Nano yang sangat ringan (~6MB, berjalan instan di CPU/GPU)
model = YOLO("yolov8n.pt")

# Kamus pengaya kosakata instan (0 Token API)
VOCAB_ENRICHMENT = {
    "bottle": {
        "name_id": "Botol Minum",
        "name_target": "Reusable Water Bottle",
        "phonetics": "/riːˈjuːzəbl ˈwɔːtər ˈbɒtl/",
        "adjectives": ["eco-friendly", "durable", "insulated", "portable"],
    },
    "cell phone": {
        "name_id": "Ponsel Pintar",
        "name_target": "Smartphone Device",
        "phonetics": "/ˈsmɑːrtfoʊn dɪˈvaɪs/",
        "adjectives": ["versatile", "high-speed", "essential", "modern"],
    },
    "book": {
        "name_id": "Buku Bacaan",
        "name_target": "Printed Book",
        "phonetics": "/ˈprɪntɪd bʊk/",
        "adjectives": ["informative", "insightful", "educational", "classic"],
    },
    "cup": {
        "name_id": "Cangkir / Gelas",
        "name_target": "Ceramic Cup",
        "phonetics": "/səˈræmɪk kʌp/",
        "adjectives": ["heat-resistant", "handcrafted", "sturdy", "minimalist"],
    },
}


@app.post("/python-api/detect-object")
async def detect_object(file: UploadFile = File(...)):
    """1. Tugas Ringan Computer Vision: Deteksi objek + Bounding Box dengan YOLO (0 Token)"""
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = model(image, verbose=False)

    detections = []
    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        label = model.names[cls_id]
        conf = round(float(box.conf[0]), 2)
        xyxy = [round(float(x), 1) for x in box.xyxy[0]]

        vocab_info = VOCAB_ENRICHMENT.get(
            label,
            {
                "name_id": f"Objek ({label})",
                "name_target": label.title(),
                "phonetics": f"/{label}/",
                "adjectives": ["useful", "practical", "unique", "valuable"],
            },
        )

        detections.append(
            {
                "label": label,
                "confidence": conf,
                "bbox": xyxy,
                "vocab_card": vocab_info,
            }
        )

    # Urutkan dari confidence tertinggi
    detections.sort(key=lambda x: x["confidence"], reverse=True)
    return {"success": True, "detections": detections[:3]}


class SpeechMetricsRequest(BaseModel):
    utterance_text: str
    duration_seconds: float
    target_vocabularies: list[str]


@app.post("/python-api/analyze-speech-metrics")
async def analyze_speech_metrics(req: SpeechMetricsRequest):
    """2. Tugas Ringan NLP/Audio Metrics: Hitung WPM, Filler Words, dan Vocab Match secara deterministik (0 Token)"""
    words = re.findall(r"\b\w+\b", req.utterance_text.lower())
    word_count = len(words)
    minutes = max(req.duration_seconds / 60.0, 0.05)
    wpm = round(word_count / minutes)

    fillers = ["umm", "uh", "eee", "anu", "apa", "hmm"]
    filler_count = sum(1 for w in words if w in fillers)

    matched_vocabs = [
        v for v in req.target_vocabularies if v.lower() in req.utterance_text.lower()
    ]

    # Skor kelancaran deterministik (skala 0-100)
    ideal_wpm_score = min(100, max(40, int((wpm / 110) * 100)))
    fluency_score = max(0, ideal_wpm_score - (filler_count * 5))

    return {
        "word_count": word_count,
        "wpm": wpm,
        "filler_count": filler_count,
        "matched_vocabularies": matched_vocabs,
        "fluency_score": fluency_score,
    }
```

## 6. Spesifikasi Endpoint Next.js untuk Tugas Berat (`Gemini API`)

Karena deteksi gambar sudah ditangani oleh Python YOLO secara lokal, *endpoint* Next.js hanya perlu mengirim **teks nama objek** ke Gemini API. Hal ini memangkas penggunaan token secara drastis:

### A. `POST /api/generate-quest` (Tugas Berat 1: Merancang Studi Kasus & Kuis)
* **Input:** Topik dari Guru (Mode Room) ATAU daftar `detected_labels` (misal: `["bottle", "book"]`) hasil tangkapan YOLO Python dari pemain mandiri (Mode Solo).
* **Estimasi Token:** ~250 Input Token (murni teks!), ~550 Output Token.

### B. `POST /api/roleplay-chat` (Tugas Berat 2: Dialog Improvisasi NPC)
* **Fungsi:** Menerima kalimat siswa + hasil metrik cepat dari Python (`matched_vocabularies` & `wpm`), lalu menghasilkan balasan NPC yang natural menggunakan `gemini-2.5-flash`.

### C. `POST /api/evaluate` (Tugas Berat 3: Rapor Akhir CEFR & Insight Kelas Guru)
* **Fungsi:** Menggabungkan skor kuis, skor `python_fluency_metrics` (WPM & *filler count* dari Python), serta analisis tata bahasa mendalam dari Gemini API menjadi satu rapor komprehensif di akhir sesi.

## 7. Urutan Pengerjaan (Step-by-Step)
1. **Setup Microservice Python (`backend-python/`)**: FastAPI, YOLO, Speech metrics.
2. **Setup Database Tables (`quests`, `submissions`)**: MariaDB migration.
3. **Implementasi API Routes**: `/api/generate-quest`, `/api/roleplay-chat`, `/api/evaluate`.
4. **Unified Game Engine**: `/play/[questId]`.
5. **Halaman Room Guru**: `/teacher/create` & `/teacher/room/[code]`.
6. **Halaman Murid Join Room**: `/room/join`.
7. **Halaman Solo Mode**: `/solo/create`.
8. **Halaman Rapor Hasil**: `/result/[subId]`.
