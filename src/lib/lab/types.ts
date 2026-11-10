/**
 * Database Types & Interfaces for SmartEdu Virtual Science & Chemistry Laboratory
 */

export interface ChemicalItem {
  id: string;
  name: string;
  formula: string;
  color: string;
  category: "asam" | "basa" | "garam" | "oksidator" | "indikator" | "organik" | "pelarut";
  level: "SD" | "SMP" | "SMA";
  description: string;
  safetyNote?: string;
  hazardLevel: 0 | 1 | 2 | 3; // 0=Aman (air/gula), 3=Sangat korosif/reaktif
  defaultVolumeMl?: number;
}

export interface ChemicalReaction {
  id: string;
  reactantAId: string;
  reactantBId: string;
  reactantCId?: string; // Reaktan ke-3 opsional untuk reaksi multikomponen
  reactantAFormula: string;
  reactantBFormula: string;
  reactantCFormula?: string; // Formula reaktan ke-3
  reactants?: string[]; // Daftar formula/token semua reaktan yang diperlukan (2 atau 3+)
  title: string;
  equation: string;
  productName: string;
  productFormula: string;
  productColor: string;
  visualEffect: "bubbles" | "steam" | "spark" | "precipitate" | "color_change" | "two_phase";
  temperatureChangeC: number;
  explanation: string;
  reasonWhy?: string; // Alasan & mekanisme ilmiah terjadinya reaksi
  observablePhenomena?: string; // Ciri-ciri visual & fisik nyata yang teramati
  level: "SD" | "SMP" | "SMA";
}

export interface LabTaskQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface LabTask {
  id: string;
  classroomId: string;
  roomCode: string;
  teacherId?: string;
  teacherName: string;
  title: string;
  level: "SD" | "SMP" | "SMA";
  gradeLevel?: "SD" | "SMP" | "SMA";
  instructions: string;
  chemicalIds: string[]; // Chemicals placed on the 3D table
  expectedReactionId?: string;
  questions: LabTaskQuestion[];
  createdAt?: string;
}

export interface LabSubmission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  isReactionAchieved: boolean;
  score: number;
  answers: { questionId: string; selectedIndex: number; isCorrect: boolean }[];
  aiAnalysis?: string;
  completedAt: string;
}
