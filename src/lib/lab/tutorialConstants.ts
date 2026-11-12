import { LabTask } from "./types";

export interface DummyTutorialClassroom {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  classCode: string;
  teacherId: string;
  teacherName: string;
  description: string;
  createdAt: string;
  taskCount: number;
}

export const DUMMY_TUTORIAL_CLASSROOM: DummyTutorialClassroom = {
  id: "tutorial-dummy-classroom",
  name: "Kelas Simulasi: X IPA 1 - Kimia Eksperimental",
  subject: "Kimia Eksperimental",
  gradeLevel: "SMA KELAS 10",
  classCode: "TUTOR10",
  teacherId: "guru-tutor",
  teacherName: "Prof. Cupcup (Pemandu)",
  description:
    "Ruang kelas simulasi interaktif untuk pengenalan praktikum laboratorium sains 3D Capcipcup.",
  createdAt: new Date().toISOString(),
  taskCount: 1,
};

export const DUMMY_TUTORIAL_TASK: LabTask = {
  id: "tutorial-dummy-task",
  classroomId: "tutorial-dummy-classroom",
  roomCode: "TUTOR10",
  teacherId: "guru-tutor",
  teacherName: "Prof. Cupcup (Pemandu)",
  title: "Misi Eksperimen: Detektif Reaksi Warna & Gas",
  instructions:
    "Gunakan meja lab 3D untuk mencampurkan larutan kimia. Amati perubahan warna larutan, pembentukan gelembung gas, dan uji dengan kertas lakmus sebelum mengerjakan kuis evaluasi.",
  level: "SMA",
  gradeLevel: "SMA",
  chemicalIds: ["c1", "c2", "c7"],
  kkmScore: 75,
  allowRetakeBelowKkm: true,
  questions: [
    {
      id: "q1",
      question:
        "Apa fenomena visual yang teramati saat larutan asam klorida (HCl) direaksikan dengan natrium hidroksida (NaOH)?",
      options: [
        "Reaksi netralisasi eksotermik (pelepasan kalor) dan perubahan warna indikator",
        "Campuran membeku membentuk es kristal",
        "Larutan mendidih meledak seketika",
        "Warna cairan menghilang menjadi udara hampa",
      ],
      correctIndex: 0,
      explanation:
        "Reaksi asam kuat dan basa kuat merupakan reaksi netralisasi eksoterm yang membebaskan kalor reaksi dan mengubah warna indikator pH.",
    },
    {
      id: "q2",
      question:
        "Kertas lakmus merah akan berubah warna menjadi biru bila dicelupkan ke dalam larutan yang bersifat apa?",
      options: [
        "Basa (Alkalin)",
        "Asam Kuat",
        "Netral (pH 7)",
        "Minyak Netral",
      ],
      correctIndex: 0,
      explanation:
        "Sifat dasar larutan basa mengubah kertas lakmus merah menjadi warna biru.",
    },
  ],
  createdAt: new Date().toISOString(),
};
