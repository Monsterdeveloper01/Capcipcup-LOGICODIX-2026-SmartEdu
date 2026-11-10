import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { CHEMICAL_CATALOG } from "@/lib/lab/chemicals-db";
import { requireTeacher } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { title, gradeLevel, chemicalIds, instructions } = await req.json();

    if (!chemicalIds || !Array.isArray(chemicalIds) || chemicalIds.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal 1 zat kimia untuk eksperimen." },
        { status: 400 }
      );
    }

    const selectedChemicals = CHEMICAL_CATALOG.filter((c) => chemicalIds.includes(c.id));
    const chemList = selectedChemicals.map((c) => `${c.name} (${c.formula})`).join(", ");

    // If no AI key, return educational default template (exactly 3 questions)
    if (!hasAiKey()) {
      return NextResponse.json({
        success: true,
        questions: [
          {
            id: `q_${Date.now()}_1`,
            question: `Apa yang terjadi saat zat kimia [${selectedChemicals[0]?.name || "Zat A"}] direaksikan dalam praktikum ini?`,
            options: [
              "Terjadi perubahan fasa atau warna larutan yang menunjukkan reaksi kimia",
              "Zat langsung membeku menjadi es kristal tanpa reaksi",
              "Tidak terjadi interaksi atau perubahan molekuler apa pun",
              "Zat menghilang seketika tanpa massa",
            ],
            correctIndex: 0,
            explanation: "Reaksi kimia ditandai dengan perubahan warna, pembentukan endapan, pelepasan gas, atau perubahan suhu.",
          },
          {
            id: `q_${Date.now()}_2`,
            question: "Bagaimana cara pengamatan yang benar terhadap perubahan suhu selama eksperimen berlangsung?",
            options: [
              "Mengamati apakah bejana terasa lebih hangat (eksoterm) atau lebih dingin (endoterm)",
              "Memegang langsung cairan tanpa sarung tangan",
              "Meminum larutan untuk mencicipi suhunya",
              "Mengabaikan suhu karena tidak mempengaruhi reaksi",
            ],
            correctIndex: 0,
            explanation: "Perubahan entalpi reaksi dapat diamati melalui pelepasan kalor (eksotermik) atau penyerapan kalor (endotermik).",
          },
          {
            id: `q_${Date.now()}_3`,
            question: "Bagaimana prinsip kekekalan massa (Hukum Lavoisier) berlaku pada reaksi di meja praktikum ini?",
            options: [
              "Total massa reaktan sebelum reaksi sama dengan total massa produk yang terbentuk",
              "Massa produk selalu dua kali lipat lebih berat dari reaktan",
              "Massa zat akan musnah setelah timbul gelembung gas",
              "Hukum kekekalan massa tidak berlaku pada reaksi kimia",
            ],
            correctIndex: 0,
            explanation: "Menurut hukum Lavoisier, dalam sistem tertutup massa zat sebelum dan sesudah reaksi kimia adalah kekal (tetap).",
          },
        ],
      });
    }

    const ai = getAiClient();
    const prompt = `Anda adalah Guru Sains & Kimia Ahli Kurikulum Merdeka untuk jenjang ${gradeLevel || "SMP/SMA"}.
Tugas Anda adalah membuat TEPAT 3 butir soal kuis pilihan ganda berbasis observasi praktikum lab untuk siswa, berdasarkan eksperimen berikut:
- Judul Eksperimen: "${title || "Praktikum Laboratorium"}"
- Jenjang: ${gradeLevel || "SMP/SMA"}
- Bahan Kimia di Meja Praktik: ${chemList}
- Instruksi Praktik Guru: "${instructions || "Campurkan zat dan amati reaksinya"}"

KETENTUAN SOAL:
1. Buat TEPAT 3 butir soal (tidak boleh kurang dari 3, tidak boleh lebih dari 3).
2. Soal harus menguji pemahaman KONSEPTUAL dan OBSERVASI HASIL PRAKTIKUM (bukan hafalan teori kering).
3. Pilihan jawaban berupa 4 opsi [A, B, C, D] yang masuk akal.
4. Berikan indeks jawaban yang benar (0 untuk A, 1 untuk B, 2 untuk C, 3 untuk D).
5. Berikan penjelasan ilmiah mengapa jawaban tersebut benar.

Kembalikan HANYA format JSON valid tanpa markdown quotes, format:
{
  "questions": [
    {
      "id": "q1",
      "question": "Kalimat pertanyaan...",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctIndex": 0,
      "explanation": "Penjelasan konsep sains..."
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

    return NextResponse.json({
      success: true,
      questions: (parsed.questions || []).slice(0, 3),
    });
  } catch (err: any) {
    console.error("AI Quiz Gen error:", err);
    // Fallback template (exactly 3 questions) so teacher is never blocked
    return NextResponse.json({
      success: true,
      questions: [
        {
          id: `q_fb_${Date.now()}_1`,
          question: "Fenomena apa yang membuktikan bahwa reaksi kimia telah berhasil terjadi dalam eksperimen ini?",
          options: [
            "Timbulnya gas (gelembung), endapan padat, atau perubahan warna larutan",
            "Wadah bejana tiba-tiba bertambah berat 10 kali lipat",
            "Cairan kembali ke bentuk aslinya tanpa jejak reaksi",
            "Tidak ada indikator perubahan visual maupun termal",
          ],
          correctIndex: 0,
          explanation: "Indikator umum reaksi kimia meliputi perubahan warna, pembentukan gas/buih, terbentuknya endapan, atau pelepasan energi panas.",
        },
        {
          id: `q_fb_${Date.now()}_2`,
          question: "Apa kesimpulan utama yang dapat diambil dari pengamatan suhu pada bejana reaksi?",
          options: [
            "Reaksi melibatkan pertukaran energi kalor (eksotermik atau endotermik)",
            "Suhu larutan tidak ada hubungannya dengan reaksi kimia",
            "Semua reaksi kimia selalu mendinginkan wadah",
            "Termometer tidak berfungsi dalam larutan kimia",
          ],
          correctIndex: 0,
          explanation: "Setiap perubahan ikatan kimiawi disertai pelepasan (eksoterm) atau penyerapan (endoterm) energi termal kalor.",
        },
        {
          id: `q_fb_${Date.now()}_3`,
          question: "Mengapa penting mencampurkan reagen kimiawi dengan takaran stoikiometri yang tepat?",
          options: [
            "Agar seluruh pereaksi dapat bereaksi optimum menghasilkan produk yang diharapkan",
            "Agar larutan langsung menguap ke udara tanpa residu",
            "Hanya untuk menghemat persediaan bahan laboratorium",
            "Takaran tidak mempengaruhi jalannya reaksi kimia",
          ],
          correctIndex: 0,
          explanation: "Perbandingan mol stoikiometris memastikan reaktan bereaksi habis atau membentuk produk reaksi secara sempurna sesuai persamaan reaksi seimbang.",
        },
      ],
    });
  }
}
