import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { requireTeacher } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { rppText, gradeLevel } = await req.json();

    if (!rppText || typeof rppText !== "string" || rppText.trim().length === 0) {
      return NextResponse.json(
        { error: "Teks RPP atau materi kurikulum praktikum tidak boleh kosong." },
        { status: 400 }
      );
    }

    // List of chemicals available in our 3D lab
    const availableChemicals = CHEMICAL_CATALOG.map((c) => ({
      id: c.id,
      name: c.name,
      formula: c.formula,
      category: c.category,
      level: c.level,
    }));

    // List of available reactions
    const availableReactions = REACTION_CATALOG.map((r) => ({
      id: r.id,
      title: r.title,
      level: r.level,
      reactantAId: r.reactantAId,
      reactantBId: r.reactantBId,
      equation: r.equation,
    }));

    // If Gemini key is available, use Gemini AI
    if (hasAiKey()) {
      try {
        const ai = getAiClient();
        const prompt = `Anda adalah Ahli Analisis Kurikulum & Guru Pembina Praktikum Laboratorium Sains Kimia Nasional (Kurikulum Merdeka).
Seorang guru mengunggah potongan teks RPP (Rencana Pelaksanaan Pembelajaran) / Modul Ajar berikut:

=== TEKS RPP / SILABUS GURU ===
${rppText.slice(0, 3000)}
=== AKHIR TEKS RPP ===

TARGET JENJANG PREFERENSI (jika ditentukan guru): ${gradeLevel || "Otomatis Ditentukan AI"}

KATALOG BAHAN KIMIA YANG TERSEDIA DI MEJA 3D LAB SAAT INI:
${JSON.stringify(availableChemicals, null, 2)}

KATALOG REAKSI KIMIA SPONTAN YANG DIDUKUNG SISTEM:
${JSON.stringify(availableReactions, null, 2)}

TUGAS ANDA:
1. Analisis tujuan pembelajaran, materi pokok, dan fenomena kimia yang ditekankan dalam teks RPP guru di atas.
2. Tentukan jenjang pendidikan ("SD", "SMP", atau "SMA") yang paling relevan.
3. Rumuskan judul praktikum laboratorium yang menarik dan edukatif.
4. Tentukan 2 sampai 4 ID zat kimia DARI KATALOG DI ATAS yang paling tepat untuk ditaruh di meja 3D siswa. WAJIB menggunakan ID yang ada di katalog (misal: "ch_hcl", "ch_naoh", "ch_kmno4", "ch_glycerin", "ch_ch3cooh", "ch_nahco3", "ch_lipid", "ch_h2o", "ch_iodine", "ch_starch", "ch_pbno32", "ch_ki", "ch_cuso4", "ch_fe").
5. Tentukan target expectedReactionId jika ada reaksi yang cocok dari katalog reaksi di atas.
6. Buat instruksi langkah demi langkah praktikum untuk siswa (instruksi meja lab 3D).
7. Buat ringkasan analisis pedagogis ("analysisSummary") yang menjelaskan korelasi RPP guru dengan praktikum yang diracik.
8. Buat TEPAT 3 butir soal kuis evaluasi pasca-praktikum (pilihan ganda 4 opsi: A, B, C, D) dengan kunci jawaban (correctIndex 0-3) dan pembahasan ilmiah. WAJIB tepat 3 butir soal (tidak boleh kurang, tidak boleh lebih).

FORMAT OUTPUT WAJIB BERUPA JSON VALID TANPA MARKDOWN BACKTICKS:
{
  "title": "Judul Praktikum",
  "gradeLevel": "SMP",
  "analysisSummary": "Penjelasan ringkas bagaimana materi RPP dipetakan ke simulasi praktikum ini...",
  "chemicalIds": ["ch_hcl", "ch_naoh"],
  "expectedReactionId": "rx_hcl_naoh",
  "instructions": "1. Ambil bejana... 2. Tuangkan perlahan...",
  "questions": [
    {
      "id": "q1",
      "question": "Kalimat pertanyaan...",
      "options": ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
      "correctIndex": 0,
      "explanation": "Penjelasan ilmiah jawaban..."
    }
  ]
}`;

        const res = await generateContentWithFallback(ai, { contents: prompt });
        const rawText = res.text || "";
        const cleanJson = rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleanJson);

        // Sanitize chemical IDs to ensure only valid catalog IDs are returned
        const validChemIds = (parsed.chemicalIds || []).filter((id: string) =>
          CHEMICAL_CATALOG.some((c) => c.id === id)
        );

        if (validChemIds.length > 0) {
          const finalQuestions = (parsed.questions || []).slice(0, 3);
          return NextResponse.json({
            success: true,
            title: parsed.title || "Praktikum Analisis RPP Sains",
            gradeLevel: parsed.gradeLevel || gradeLevel || "SMP",
            analysisSummary: parsed.analysisSummary || "RPP berhasil dianalisis oleh Asisten AI.",
            summary: parsed.analysisSummary || "RPP berhasil dianalisis oleh Asisten AI.",
            chemicalIds: validChemIds,
            recommendedChemicalIds: validChemIds,
            expectedReactionId: parsed.expectedReactionId || null,
            instructions: parsed.instructions || "Campurkan reagen di atas meja dan amati perubahan suhu serta warna.",
            questions: finalQuestions,
            generatedQuestions: finalQuestions,
          });
        }
      } catch (aiErr: any) {
        console.warn("AI RPP Analysis fallback triggered:", aiErr?.message || aiErr);
      }
    }

    // Intelligent Fallback Keyword Matching when AI is offline or parsing fails
    const lower = rppText.toLowerCase();

    if (lower.includes("asam") || lower.includes("basa") || lower.includes("netralisasi") || lower.includes("hcl") || lower.includes("naoh")) {
      const qList = [
        {
          id: `q_rpp_1_${Date.now()}`,
          question: "Apa produk utama dari reaksi antara larutan asam klorida (HCl) dengan natrium hidroksida (NaOH)?",
          options: [
            "Garam dapur (NaCl) dan air (H2O)",
            "Gas hidrogen dan endapan belerang",
            "Asam asetat dan gas metana",
            "Logam natrium murni",
          ],
          correctIndex: 0,
          explanation: "Reaksi asam kuat dan basa kuat menghasilkan senyawa garam netral (NaCl) dan molekul air (H2O).",
        },
        {
          id: `q_rpp_2_${Date.now()}`,
          question: "Mengapa bejana terasa hangat setelah kedua larutan dicampurkan?",
          options: [
            "Reaksi bersifat eksotermik melepaskan kalor ke lingkungan",
            "Reaksi menyerap kalor dari sekitar (endotermik)",
            "Terjadi gesekan mekanik antar molekul air",
            "Bejana dipanaskan oleh sinar laser luar",
          ],
          correctIndex: 0,
          explanation: "Reaksi netralisasi membebaskan energi entalpi pembentukan air sebesar kurang lebih -57 kJ/mol sehingga larutan menjadi hangat.",
        },
        {
          id: `q_rpp_3_${Date.now()}`,
          question: "Berapa perkiraan pH larutan akhir jika jumlah mol HCl dan NaOH setara?",
          options: ["pH 7 (Netral)", "pH 1 (Sangat Asam)", "pH 14 (Sangat Basa)", "pH 0"],
          correctIndex: 0,
          explanation: "Pada titik ekuivalen asam kuat dan basa kuat, larutan memiliki pH netral sekitar 7 pada suhu 25°C.",
        },
      ];

      return NextResponse.json({
        success: true,
        title: "Praktikum Netralisasi Asam Klorida & Natrium Hidroksida",
        gradeLevel: "SMP",
        analysisSummary: "Berdasarkan materi asam-basa pada RPP, sistem memilih Asam Klorida (HCl) dan Soda Api (NaOH) untuk mendemonstrasikan reaksi netralisasi eksotermik pembentukan air dan garam.",
        summary: "Berdasarkan materi asam-basa pada RPP, sistem memilih Asam Klorida (HCl) dan Soda Api (NaOH) untuk mendemonstrasikan reaksi netralisasi eksotermik pembentukan air dan garam.",
        chemicalIds: ["ch_hcl", "ch_naoh"],
        recommendedChemicalIds: ["ch_hcl", "ch_naoh"],
        expectedReactionId: "rx_hcl_naoh",
        instructions: "1. Ambil bejana Asam Klorida (HCl) dan dekatkan ke bejana Natrium Hidroksida (NaOH).\n2. Tuangkan larutan perlahan-lahan.\n3. Perhatikan kenaikan suhu termal dan terbentuknya uap reaksi netralisasi.",
        questions: qList,
        generatedQuestions: qList,
      });
    }

    if (lower.includes("redoks") || lower.includes("oksidasi") || lower.includes("kmno4") || lower.includes("gliserin") || lower.includes("pembakaran")) {
      const qList = [
        {
          id: `q_rpp_1_${Date.now()}`,
          question: "Peran zat KMnO4 dalam reaksi spontan dengan gliserin adalah sebagai...",
          options: ["Oksidator kuat", "Reduktor kuat", "Katalis netral", "Pelarut inert"],
          correctIndex: 0,
          explanation: "KMnO4 mengandung ion Mn(VII) yang memiliki bilangan oksidasi tertinggi sehingga bertindak sebagai oksidator kuat yang mudah tereduksi.",
        },
        {
          id: `q_rpp_2_${Date.now()}`,
          question: "Mengapa reaksi spontan berasap tebal ini hanya terjadi saat KMnO4 berbentuk serbuk padat (bukan larutan encer)?",
          options: [
            "Air pada larutan encer menyerap kalor sehingga meredam laju reaksi eksotermik",
            "Serbuk padat mengandung gas oksigen terkompresi",
            "Gliserin tidak dapat bereaksi sama sekali dengan permanganat",
            "Zat cair memiliki kerapatan yang terlalu tinggi",
          ],
          correctIndex: 0,
          explanation: "Pada larutan cair, molekul air bertindak sebagai heat sink (peredam panas) sehingga energi aktivasi untuk reaksi piroteknik tidak tercapai.",
        },
        {
          id: `q_rpp_3_${Date.now()}`,
          question: "Perubahan energi termal apakah yang teramati saat KMnO4 padat ditetesi gliserin?",
          options: [
            "Reaksi eksotermik hebat dengan pelepasan energi panas dan kepulan uap/asap",
            "Reaksi endotermik yang membekukan gliserin",
            "Suhu bejana tetap netral tanpa perubahan",
            "Hanya terjadi perubahan warna tanpa perubahan suhu",
          ],
          correctIndex: 0,
          explanation: "Oksidasi gliserol oleh KMnO4 melepaskan kalor dalam jumlah besar secara cepat sehingga terjadi kenaikan suhu drastis dan kepulan asap tebal.",
        },
      ];

      return NextResponse.json({
        success: true,
        title: "Praktikum Reaksi Redoks Spontan Kalium Permanganat & Gliserin",
        gradeLevel: "SMA",
        analysisSummary: "Berdasarkan topik reaksi redoks dan termokimia pada RPP, sistem memilih serbuk KMnO4 padat dan cairan gliserin murni untuk mengamati reaksi redoks spontan dengan lonjakan suhu drastis.",
        summary: "Berdasarkan topik reaksi redoks dan termokimia pada RPP, sistem memilih serbuk KMnO4 padat dan cairan gliserin murni untuk mengamati reaksi redoks spontan dengan lonjakan suhu drastis.",
        chemicalIds: ["ch_kmno4", "ch_glycerin"],
        recommendedChemicalIds: ["ch_kmno4", "ch_glycerin"],
        expectedReactionId: "rx_kmno4_glycerin",
        instructions: "1. Letakkan cawan serbuk Kalium Permanganat (KMnO4 padat) di tengah meja.\n2. Teteskan cairan gliserin murni ke atas serbuk.\n3. Amati pelepasan kalor hebat, kepulan asap tebal, dan sisa produk reaksi.",
        questions: qList,
        generatedQuestions: qList,
      });
    }

    if (lower.includes("endapan") || lower.includes("golden rain") || lower.includes("presipitasi") || lower.includes("timbal") || lower.includes("kelarutan")) {
      const qList = [
        {
          id: `q_rpp_1_${Date.now()}`,
          question: "Endapan berwarna kuning keemasan yang terbentuk merupakan senyawa...",
          options: ["PbI2 (Timbal(II) Iodida)", "KNO3 (Kalium Nitrat)", "Pb(OH)2", "I2 murni"],
          correctIndex: 0,
          explanation: "Pertukaran kation dan anion menghasilkan PbI2 yang memiliki nilai Ksp sangat rendah sehingga langsung mengendap sebagai kristal kuning.",
        },
        {
          id: `q_rpp_2_${Date.now()}`,
          question: "Mengapa kristal PbI2 dapat terbentuk dari dua larutan yang awalnya jernih transparan?",
          options: [
            "Nilai hasil kali kelarutan (Qsp) melampaui nilai Ksp PbI2 sehingga terjadi presipitasi",
            "Zat pelarut menguap seluruhnya seketika",
            "Terjadi perubahan massa jenis tanpa reaksi kimia",
            "Cahaya ruangan mengendapkan iodida",
          ],
          correctIndex: 0,
          explanation: "Kelarutan PbI2 sangat rendah di dalam air, sehingga saat ion Pb2+ dan I- bertemu, konsentrasinya melampaui Ksp dan memicu kristalisasi padatan.",
        },
        {
          id: `q_rpp_3_${Date.now()}`,
          question: "Larutan lain yang tetap larut transparan di dalam air selain kristal emas PbI2 adalah...",
          options: [
            "KNO3 (Kalium Nitrat)",
            "PbSO4",
            "Logam Timbal murni",
            "Gas Hidrogen",
          ],
          correctIndex: 0,
          explanation: "Reaksi metatesis menghasilkan endapan PbI2 dan larutan garam kalium nitrat (KNO3) yang sangat larut dalam air.",
        },
      ];

      return NextResponse.json({
        success: true,
        title: "Praktikum Presipitasi Kristal Emas (Golden Rain PbI2)",
        gradeLevel: "SMA",
        analysisSummary: "Berdasarkan konsep reaksi pengendapan dan hasil kali kelarutan (Ksp) pada RPP, sistem memilih Timbal(II) Nitrat dan Kalium Iodida untuk mendemonstrasikan pembentukan kristal berkilau emas.",
        summary: "Berdasarkan konsep reaksi pengendapan dan hasil kali kelarutan (Ksp) pada RPP, sistem memilih Timbal(II) Nitrat dan Kalium Iodida untuk mendemonstrasikan pembentukan kristal berkilau emas.",
        chemicalIds: ["ch_pbno32", "ch_ki"],
        recommendedChemicalIds: ["ch_pbno32", "ch_ki"],
        expectedReactionId: "rx_pbno32_ki",
        instructions: "1. Ambil bejana larutan jernih Timbal(II) Nitrat Pb(NO3)2.\n2. Tuangkan ke dalam larutan Kalium Iodida (KI).\n3. Amati pembentukan butiran kristal kuning keemasan PbI2 yang mengendap perlahan.",
        questions: qList,
        generatedQuestions: qList,
      });
    }

    // Default SD/SMP CO2 Gas Reaction
    const defaultQList = [
      {
        id: `q_rpp_1_${Date.now()}`,
        question: "Gas apakah yang dihasilkan saat soda kue bercampur dengan asam cuka?",
        options: ["Karbon Dioksida (CO2)", "Oksigen (O2)", "Hidrogen (H2)", "Helium (He)"],
        correctIndex: 0,
        explanation: "Asam asetat bereaksi dengan natrium bikarbonat melepaskan gas karbon dioksida yang membentuk busa meluap.",
      },
      {
        id: `q_rpp_2_${Date.now()}`,
        question: "Mengapa dasar bejana terasa dingin saat reaksi berlangsung?",
        options: [
          "Reaksi menyerap kalor dari lingkungan sekitar (reaksi endotermik)",
          "Terbentuk kristal es beku di dalam bejana",
          "Cuka memiliki sifat mendinginkan cairan",
          "Suhu lingkungan tiba-tiba turun",
        ],
        correctIndex: 0,
        explanation: "Reaksi ini membutuhkan energi untuk memecah ikatan ionik, sehingga menyerap energi panas dari sekitarnya.",
      },
      {
        id: `q_rpp_3_${Date.now()}`,
        question: "Bagaimanakah sifat keasaman (pH) dari asam cuka dapur (CH3COOH)?",
        options: [
          "Bersifat asam dengan pH < 7",
          "Bersifat basa kuat dengan pH > 12",
          "Bersifat netral dengan pH = 7",
          "Tidak memiliki nilai pH",
        ],
        correctIndex: 0,
        explanation: "Asam asetat encer (cuka dapur) merupakan asam lemah yang memiliki nilai pH di bawah 7.",
      },
    ];

    return NextResponse.json({
      success: true,
      title: "Praktikum Pembentukan Gas Karbon Dioksida & Reaksi Busa",
      gradeLevel: gradeLevel || "SD",
      analysisSummary: "Berdasarkan analisis silabus RPP, sistem memilih reagen aman Cuka Dapur (CH3COOH) dan Baking Soda (NaHCO3) agar siswa dapat mengamati pelepasan gas CO2 dan perubahan fasa.",
      summary: "Berdasarkan analisis silabus RPP, sistem memilih reagen aman Cuka Dapur (CH3COOH) dan Baking Soda (NaHCO3) agar siswa dapat mengamati pelepasan gas CO2 dan perubahan fasa.",
      chemicalIds: ["ch_ch3cooh", "ch_nahco3"],
      recommendedChemicalIds: ["ch_ch3cooh", "ch_nahco3"],
      expectedReactionId: "rx_ch3cooh_nahco3",
      instructions: "1. Siapkan bejana Cuka Dapur dan Baking Soda di atas meja.\n2. Tuangkan baking soda ke dalam larutan cuka.\n3. Amati semburan busa gas CO2 dan rasakan penurunan suhu bejana (endoterm).",
      questions: defaultQList,
      generatedQuestions: defaultQList,
    });
  } catch (err: any) {
    console.error("POST analyze-rpp error:", err);
    return NextResponse.json({ error: err.message || "Gagal menganalisis RPP." }, { status: 500 });
  }
}

