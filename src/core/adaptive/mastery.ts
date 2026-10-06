import { SKILL_IDS, type SkillId } from '../curriculum/skillIds';
import type { PracticeSession } from '../session/types';
import type { Difficulty } from '../types';
import {
  MASTERY_POLICY,
  type DifficultyMasteryState,
  type LearnerModel,
  type MasteryStatus,
  type SkillEvidence,
  type SkillMasteryState,
} from './types';

const DIFFICULTIES = [1, 2, 3] as const satisfies readonly Difficulty[];

function compareEvidence(left: SkillEvidence, right: SkillEvidence): number {
  if (left.completedAtMs !== right.completedAtMs) {
    return left.completedAtMs - right.completedAtMs;
  }

  const sessionComparison = left.sessionId.localeCompare(right.sessionId);
  if (sessionComparison !== 0) {
    return sessionComparison;
  }

  return left.questionOrdinal - right.questionOrdinal;
}

export function extractSkillEvidence(
  sessions: readonly PracticeSession[],
): readonly SkillEvidence[] {
  const evidence: SkillEvidence[] = [];

  for (const session of sessions) {
    if (session.status !== 'completed') {
      throw new Error('M5 mastery history accepts only completed practice sessions.');
    }

    for (const attempt of session.attempts) {
      if (
        attempt.status !== 'completed' ||
        attempt.completedAtMs === null ||
        attempt.answers.length === 0
      ) {
        throw new Error(
          'Completed M5 history must contain only completed question attempts with answers.',
        );
      }

      evidence.push({
        skillId: session.plan.skillId,
        grade: session.plan.grade,
        difficulty: session.plan.difficulty,
        sessionId: session.id,
        questionOrdinal: attempt.question.ordinal,
        completedAtMs: attempt.completedAtMs,
        firstTryCorrect: attempt.answers[0].correct,
        incorrectSubmissionCount: attempt.answers.filter((answer) => !answer.correct).length,
      });
    }
  }

  return [...evidence].sort(compareEvidence);
}

function evaluateDifficulty(
  difficulty: Difficulty,
  evidence: readonly SkillEvidence[],
): DifficultyMasteryState {
  const matchingEvidence = evidence
    .filter((item) => item.difficulty === difficulty)
    .sort(compareEvidence);

  const recentEvidence = matchingEvidence.slice(
    -MASTERY_POLICY.recentEvidenceWindow,
  );
  const recentFirstTryCorrectCount = recentEvidence.filter(
    (item) => item.firstTryCorrect,
  ).length;

  let status: MasteryStatus = 'insufficient-evidence';
  if (
    matchingEvidence.length >= MASTERY_POLICY.minimumEvidencePerDifficulty
  ) {
    status =
      recentFirstTryCorrectCount >=
      MASTERY_POLICY.requiredFirstTryCorrectInWindow
        ? 'mastered'
        : 'developing';
  }

  return {
    difficulty,
    status,
    totalEvidenceCount: matchingEvidence.length,
    recentEvidenceCount: recentEvidence.length,
    recentFirstTryCorrectCount,
    firstTryAccuracy:
      recentEvidence.length === 0
        ? null
        : recentFirstTryCorrectCount / recentEvidence.length,
  };
}

export function deriveSkillMasteryState(
  skillId: SkillId,
  evidence: readonly SkillEvidence[],
): SkillMasteryState {
  const skillEvidence = evidence.filter((item) => item.skillId === skillId);
  const difficulties = DIFFICULTIES.map((difficulty) =>
    evaluateDifficulty(difficulty, skillEvidence),
  ) as [
    DifficultyMasteryState,
    DifficultyMasteryState,
    DifficultyMasteryState,
  ];

  const allDifficultiesMastered = difficulties.every(
    (state) => state.status === 'mastered',
  );
  const hasEstablishedLearningState = difficulties.some(
    (state) => state.status === 'mastered' || state.status === 'developing',
  );

  const status: MasteryStatus = allDifficultiesMastered
    ? 'mastered'
    : hasEstablishedLearningState
      ? 'developing'
      : 'insufficient-evidence';

  const nextDifficulty =
    difficulties.find((state) => state.status !== 'mastered')?.difficulty ?? 3;

  return {
    skillId,
    status,
    totalEvidenceCount: skillEvidence.length,
    nextDifficulty,
    difficulties,
  };
}

export function buildLearnerModel(
  completedSessions: readonly PracticeSession[],
): LearnerModel {
  const evidence = extractSkillEvidence(completedSessions);
  const skills = Object.fromEntries(
    SKILL_IDS.map((skillId) => [
      skillId,
      deriveSkillMasteryState(skillId, evidence),
    ]),
  ) as Record<SkillId, SkillMasteryState>;

  return {
    completedSessionCount: completedSessions.length,
    evidenceCount: evidence.length,
    skills,
  };
}
