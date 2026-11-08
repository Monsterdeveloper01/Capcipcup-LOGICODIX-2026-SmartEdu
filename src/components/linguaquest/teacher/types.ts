export interface ClassroomItem {
  id: string;
  classCode: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  teacherName: string;
  description?: string;
  membersCount: number;
  tasksCount: number;
}

export interface ClassroomMemberItem {
  memberId: string;
  userId: string;
  studentName: string;
  studentUsername: string;
  joinedAt: string;
  status: string;
  email?: string;
  xp?: number;
  level?: number;
  completedTasksCount?: number;
}

export interface AvailableStudentItem {
  userId: string;
  studentName: string;
  studentUsername: string;
  email: string;
}

export interface TeacherRoomItem {
  id: string;
  classroomId?: string;
  roomCode: string;
  creatorName: string;
  title: string;
  difficultyLevel: string;
  caseStudyStory?: string;
  npcName?: string;
  npcPersona?: string;
  requiredObjectHint?: string;
  missionObjectives?: any;
  targetVocabularies?: any;
  quizQuestions?: any;
  submissionsCount?: number;
  speakingCount?: number;
  createdAt?: string;
}

export interface QuizQuestionItem {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export type TeacherTab = "classes" | "tasks" | "builder" | "grader" | "diagnostics";

