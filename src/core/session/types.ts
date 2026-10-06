import type {
  ComparisonRelation,
  Difficulty,
  FractionAnswer,
  Grade,
  QuestionType,
  RepresentationType,
  Shape2D,
  SkillId,
  TimeAnswer,
} from '../types';

export const PRACTICE_SESSION_SCHEMA_VERSION = 1 as const;
export const DEFAULT_PRACTICE_TARGET_MS = 10 * 60 * 1000;

export type PracticeSessionStatus = 'active' | 'paused' | 'completed';
export type QuestionAttemptStatus = 'active' | 'completed';

export interface PracticeSessionPlan {
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  targetDurationMs: number;
}

export interface SessionQuestionContext {
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  seed: number;
}

export interface SessionQuestionReference {
  ordinal: number;
  generationContext: SessionQuestionContext;
  questionId: string;
  questionType: QuestionType;
  representation: RepresentationType;
}

export type LearnerAnswer =
  | {
      kind: 'numeric';
      value: number;
    }
  | {
      kind: 'relation';
      value: ComparisonRelation;
    }
  | {
      kind: 'fraction';
      value: FractionAnswer;
    }
  | {
      kind: 'time';
      value: TimeAnswer;
    }
  | {
      kind: 'shape';
      value: Shape2D;
    };

export interface AnswerRecord {
  answer: LearnerAnswer;
  correct: boolean;
  submittedAtMs: number;
}

export interface QuestionAttempt {
  question: SessionQuestionReference;
  status: QuestionAttemptStatus;
  answers: readonly AnswerRecord[];
  completedAtMs: number | null;
}

export interface PracticeSession {
  schemaVersion: typeof PRACTICE_SESSION_SCHEMA_VERSION;
  id: string;
  sessionSeed: number;
  plan: PracticeSessionPlan;
  status: PracticeSessionStatus;
  startedAtMs: number;
  activeSinceMs: number | null;
  accumulatedActiveDurationMs: number;
  completedAtMs: number | null;
  attempts: readonly QuestionAttempt[];
}
