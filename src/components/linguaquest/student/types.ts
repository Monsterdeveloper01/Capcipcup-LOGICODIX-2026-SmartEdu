import { GameMode, QuestScenario, ScannedItem, RoleplayTurnMessage, SpeakingEvaluation } from "@/lib/linguaquest/types";

export type StudentStep = "select_mode" | "scanning" | "inventory" | "hud" | "autopsy";

export interface ActiveClassroom {
  id?: string;
  roomCode: string;
  name?: string;
  creatorName: string;
  topic?: string;
  questTitle?: string;
  questId?: string;
  difficultyLevel?: string;
  quizQuestions?: any[];
  scenarioStory?: string;
  npcName?: string;
  npcRole?: string;
  targetVocab?: string[];
  requiredHint?: string;
  gradeLevel?: string;
  description?: string;
}

export interface SafetyAlert {
  isHazard: boolean;
  hazardName: string;
  warningMessage: string;
}

export interface CodeSwitchRescue {
  detectedIndonesianWord: string;
  englishEquivalent: string;
  explanation: string;
}

export interface ClassroomTaskItem {
  id: string;
  title: string;
  description?: string;
  caseStudyStory?: string;
  case_study_story?: string;
  npcName?: string;
  npc_name?: string;
  npcPersona?: string;
  npc_persona?: string;
  requiredObjectHint?: string;
  required_object_hint?: string;
  difficultyLevel?: string;
  difficulty_level?: string;
  isCompleted?: boolean;
  studentScore?: number;
  quizQuestions?: any[];
  quiz_questions?: any;
  missionObjectives?: any[];
  mission_objectives?: any;
  targetVocabularies?: any[];
  target_vocabularies?: any;
}

