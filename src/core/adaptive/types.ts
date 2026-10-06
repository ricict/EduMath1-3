import type { Difficulty, Grade, SkillId } from '../types';

export const MASTERY_POLICY = {
  recentEvidenceWindow: 5,
  minimumEvidencePerDifficulty: 5,
  requiredFirstTryCorrectInWindow: 4,
} as const;

export type MasteryStatus =
  | 'insufficient-evidence'
  | 'developing'
  | 'mastered';

export interface SkillEvidence {
  skillId: SkillId;
  grade: Grade;
  difficulty: Difficulty;
  sessionId: string;
  questionOrdinal: number;
  completedAtMs: number;
  firstTryCorrect: boolean;
  incorrectSubmissionCount: number;
}

export interface DifficultyMasteryState {
  difficulty: Difficulty;
  status: MasteryStatus;
  totalEvidenceCount: number;
  recentEvidenceCount: number;
  recentFirstTryCorrectCount: number;
  firstTryAccuracy: number | null;
}

export interface SkillMasteryState {
  skillId: SkillId;
  status: MasteryStatus;
  totalEvidenceCount: number;
  nextDifficulty: Difficulty;
  difficulties: readonly [
    DifficultyMasteryState,
    DifficultyMasteryState,
    DifficultyMasteryState,
  ];
}

export interface LearnerModel {
  completedSessionCount: number;
  evidenceCount: number;
  skills: Readonly<Record<SkillId, SkillMasteryState>>;
}

export type RecommendationReasonCode =
  | 'START_ELIGIBLE_SKILL'
  | 'CONTINUE_SKILL'
  | 'ADVANCE_DIFFICULTY';

export interface PracticeRecommendation {
  kind: 'practice';
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  reason: {
    code: RecommendationReasonCode;
    prerequisiteSkillIds: readonly SkillId[];
    evidenceCountForSkill: number;
  };
}

export type RecommendationUnavailableCode =
  | 'ALL_GRADE_SKILLS_MASTERED'
  | 'NO_CURRICULUM_ELIGIBLE_UNMASTERED_SKILL'
  | 'NO_PRACTICABLE_CURRICULUM_ELIGIBLE_SKILL';

export interface UnavailablePracticeRecommendation {
  kind: 'unavailable';
  grade: Grade;
  reason: {
    code: RecommendationUnavailableCode;
    curriculumEligibleSkillIds: readonly SkillId[];
    generatorUnavailableSkillIds: readonly SkillId[];
    generatorContextUnavailableSkillIds: readonly SkillId[];
  };
}

export type AdaptiveRecommendation =
  | PracticeRecommendation
  | UnavailablePracticeRecommendation;
