import { loadLearnerModel } from './history';
import { recommendPractice } from './recommendation';
import type {
  PracticeRecommendation,
  UnavailablePracticeRecommendation,
} from './types';
import type { LocalSessionStore } from '../session/persistence';
import {
  issueNextQuestion,
  startPracticeSession,
} from '../session/session';
import type { PracticeSession } from '../session/types';
import type { Grade, Question } from '../types';

export interface StartRecommendedPracticeInput {
  id: string;
  grade: Grade;
  sessionSeed: number;
  startedAtMs: number;
  targetDurationMs?: number;
}

export interface StartedRecommendedPractice {
  kind: 'started';
  recommendation: PracticeRecommendation;
  session: PracticeSession;
  question: Question;
}

export interface UnavailableRecommendedPractice {
  kind: 'unavailable';
  recommendation: UnavailablePracticeRecommendation;
}

export type StartRecommendedPracticeResult =
  | StartedRecommendedPractice
  | UnavailableRecommendedPractice;

export async function startRecommendedPractice(
  store: Pick<LocalSessionStore, 'listCompleted'>,
  input: StartRecommendedPracticeInput,
): Promise<StartRecommendedPracticeResult> {
  const learnerModel = await loadLearnerModel(store);
  const recommendation = recommendPractice(input.grade, learnerModel);

  if (recommendation.kind === 'unavailable') {
    return {
      kind: 'unavailable',
      recommendation,
    };
  }

  const session = startPracticeSession({
    id: input.id,
    grade: recommendation.grade,
    skillId: recommendation.skillId,
    difficulty: recommendation.difficulty,
    sessionSeed: input.sessionSeed,
    startedAtMs: input.startedAtMs,
    ...(input.targetDurationMs === undefined
      ? {}
      : { targetDurationMs: input.targetDurationMs }),
  });
  const issued = issueNextQuestion(session);

  return {
    kind: 'started',
    recommendation,
    session: issued.session,
    question: issued.question,
  };
}
