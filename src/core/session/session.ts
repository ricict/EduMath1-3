import { generateQuestion } from '../question-engine/registry';
import type { Difficulty, Grade, Question, SkillId } from '../types';
import {
  DEFAULT_PRACTICE_TARGET_MS,
  PRACTICE_SESSION_SCHEMA_VERSION,
  type LearnerAnswer,
  type PracticeSession,
  type QuestionAttempt,
  type SessionQuestionReference,
} from './types';
const MAX_UINT32 = 0xffffffff;

export interface StartPracticeSessionInput {
  id: string;
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  sessionSeed: number;
  startedAtMs: number;
  targetDurationMs?: number;
}

export interface IssuedQuestion {
  session: PracticeSession;
  question: Question;
}

export interface SubmittedAnswer {
  session: PracticeSession;
  question: Question;
  correct: boolean;
}

function assertTimestamp(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite number.`);
  }
}

function assertTimestampNotBefore(
  name: string,
  value: number,
  minimum: number,
): void {
  assertTimestamp(name, value);

  if (value < minimum) {
    throw new Error(`${name} cannot be earlier than ${minimum}.`);
  }
}

function normalizeSeed(seed: number): number {
  if (!Number.isSafeInteger(seed)) {
    throw new Error('Session seed must be a safe integer.');
  }

  return seed >>> 0;
}

function mixQuestionSeed(seed: number): number {
  let value = seed >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b) >>> 0;
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35) >>> 0;
  value ^= value >>> 16;
  return value >>> 0;
}

const QUESTION_NOVELTY_PROBE_LIMIT = 128;
const QUESTION_NOVELTY_PROBE_SALT = 0x7f4a7c15;

function semanticQuestionKey(question: Question): string {
  return JSON.stringify({
    skillId: question.skillId,
    difficulty: question.difficulty,
    questionType: question.questionType,
    representation: question.representation,
    promptKey: question.promptKey,
    data: question.data,
    expectedAnswer: question.expectedAnswer,
  });
}

function deriveProbeSeed(
  sessionSeed: number,
  ordinal: number,
  probe: number,
): number {
  const baseSeed = deriveQuestionSeed(sessionSeed, ordinal);
  if (probe === 0) {
    return baseSeed;
  }

  const probeSalt = Math.imul(probe, QUESTION_NOVELTY_PROBE_SALT) >>> 0;
  return mixQuestionSeed((baseSeed + probeSalt) >>> 0);
}

function getActiveAttemptIndex(session: PracticeSession): number {
  let activeIndex = -1;

  for (let index = 0; index < session.attempts.length; index += 1) {
    if (session.attempts[index].status === 'active') {
      if (activeIndex !== -1) {
        throw new Error('Session contains multiple active question attempts.');
      }
      activeIndex = index;
    }
  }

  if (activeIndex !== -1 && activeIndex !== session.attempts.length - 1) {
    throw new Error('Only the most recent question attempt may remain active.');
  }

  return activeIndex;
}

function reconstructQuestion(reference: SessionQuestionReference): Question {
  const question = generateQuestion(reference.generationContext);

  if (question.id !== reference.questionId) {
    throw new Error('Stored question ID does not match deterministic reconstruction.');
  }
  if (question.questionType !== reference.questionType) {
    throw new Error('Stored question type does not match deterministic reconstruction.');
  }
  if (question.representation !== reference.representation) {
    throw new Error('Stored representation does not match deterministic reconstruction.');
  }

  return question;
}

function replaceAttempt(
  session: PracticeSession,
  index: number,
  attempt: QuestionAttempt,
): readonly QuestionAttempt[] {
  return session.attempts.map((current, currentIndex) =>
    currentIndex === index ? attempt : current,
  );
}

export function deriveQuestionSeed(sessionSeed: number, ordinal: number): number {
  if (!Number.isInteger(ordinal) || ordinal < 0 || ordinal > MAX_UINT32) {
    throw new Error('Question ordinal must be an unsigned 32-bit integer.');
  }

  const normalizedSessionSeed = normalizeSeed(sessionSeed);

  // Preserve ordinal 0 exactly so the locked M1/M3 reference remains unchanged.
  if (ordinal === 0) {
    return normalizedSessionSeed;
  }

  const positionSalt = Math.imul(ordinal, 0x9e3779b9) >>> 0;
  return mixQuestionSeed((normalizedSessionSeed + positionSalt) >>> 0);
}

export function startPracticeSession(
  input: StartPracticeSessionInput,
): PracticeSession {
  const id = input.id.trim();
  if (!id) {
    throw new Error('Practice session ID must be a non-empty opaque identifier.');
  }

  assertTimestamp('startedAtMs', input.startedAtMs);

  const targetDurationMs =
    input.targetDurationMs ?? DEFAULT_PRACTICE_TARGET_MS;
  if (!Number.isSafeInteger(targetDurationMs) || targetDurationMs <= 0) {
    throw new Error('Practice target duration must be a positive safe integer.');
  }

  return {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    id,
    sessionSeed: normalizeSeed(input.sessionSeed),
    plan: {
      grade: input.grade,
      skillId: input.skillId,
      difficulty: input.difficulty,
      targetDurationMs,
    },
    status: 'active',
    startedAtMs: input.startedAtMs,
    activeSinceMs: input.startedAtMs,
    accumulatedActiveDurationMs: 0,
    completedAtMs: null,
    attempts: [],
  };
}

export function issueNextQuestion(session: PracticeSession): IssuedQuestion {
  if (session.status !== 'active') {
    throw new Error('Questions can be issued only while a session is active.');
  }
  if (getActiveAttemptIndex(session) !== -1) {
    throw new Error('Complete the active question before issuing the next question.');
  }

  const ordinal = session.attempts.length;
  const previousQuestions = session.attempts.map((attempt) =>
    reconstructQuestion(attempt.question),
  );
  const seenKeys = new Set(previousQuestions.map(semanticQuestionKey));
  const previousKey =
    previousQuestions.length === 0
      ? null
      : semanticQuestionKey(previousQuestions[previousQuestions.length - 1]);

  type QuestionCandidate = {
    generationContext: {
      grade: Grade;
      skillId: SkillId;
      difficulty: Difficulty;
      seed: number;
    };
    question: Question;
  };

  let firstCandidate: QuestionCandidate | null = null;
  let nonConsecutiveCandidate: QuestionCandidate | null = null;
  let selectedCandidate: QuestionCandidate | null = null;

  for (let probe = 0; probe < QUESTION_NOVELTY_PROBE_LIMIT; probe += 1) {
    const generationContext = {
      grade: session.plan.grade,
      skillId: session.plan.skillId,
      difficulty: session.plan.difficulty,
      seed: deriveProbeSeed(session.sessionSeed, ordinal, probe),
    } as const;
    const question = generateQuestion(generationContext);
    const candidate: QuestionCandidate = { generationContext, question };
    const key = semanticQuestionKey(question);

    if (firstCandidate === null) {
      firstCandidate = candidate;
    }
    if (key !== previousKey && nonConsecutiveCandidate === null) {
      nonConsecutiveCandidate = candidate;
    }
    if (!seenKeys.has(key)) {
      selectedCandidate = candidate;
      break;
    }
  }

  const chosen =
    selectedCandidate ?? nonConsecutiveCandidate ?? firstCandidate;
  if (chosen === null) {
    throw new Error('Unable to generate a practice question.');
  }

  const attempt: QuestionAttempt = {
    question: {
      ordinal,
      generationContext: chosen.generationContext,
      questionId: chosen.question.id,
      questionType: chosen.question.questionType,
      representation: chosen.question.representation,
    },
    status: 'active',
    answers: [],
    completedAtMs: null,
  };

  return {
    session: {
      ...session,
      attempts: [...session.attempts, attempt],
    },
    question: chosen.question,
  };
}

export function restoreActiveQuestion(session: PracticeSession): Question | null {
  const activeIndex = getActiveAttemptIndex(session);

  if (activeIndex === -1) {
    return null;
  }

  return reconstructQuestion(session.attempts[activeIndex].question);
}

export function evaluateLearnerAnswer(
  question: Question,
  answer: LearnerAnswer,
): boolean {
  switch (question.questionType) {
    case 'numeric-choice':
      return answer.kind === 'numeric' && answer.value === question.expectedAnswer;

    case 'relation-choice':
      return answer.kind === 'relation' && answer.value === question.expectedAnswer;

    case 'fraction-choice':
      return (
        answer.kind === 'fraction' &&
        answer.value.numerator === question.expectedAnswer.numerator &&
        answer.value.denominator === question.expectedAnswer.denominator
      );

    case 'time-choice':
      return (
        answer.kind === 'time' &&
        answer.value.hour === question.expectedAnswer.hour &&
        answer.value.minute === question.expectedAnswer.minute
      );

    case 'shape-choice':
      return answer.kind === 'shape' && answer.value === question.expectedAnswer;
  }
}

export function submitAnswer(
  session: PracticeSession,
  answer: LearnerAnswer,
  submittedAtMs: number,
): SubmittedAnswer {
  if (session.status !== 'active' || session.activeSinceMs === null) {
    throw new Error('Answers can be submitted only while a session is active.');
  }

  assertTimestampNotBefore(
    'submittedAtMs',
    submittedAtMs,
    session.activeSinceMs,
  );

  const activeIndex = getActiveAttemptIndex(session);
  if (activeIndex === -1) {
    throw new Error('No active question is available for an answer.');
  }

  const activeAttempt = session.attempts[activeIndex];
  const question = reconstructQuestion(activeAttempt.question);
  const correct = evaluateLearnerAnswer(question, answer);
  const updatedAttempt: QuestionAttempt = {
    ...activeAttempt,
    status: correct ? 'completed' : 'active',
    answers: [
      ...activeAttempt.answers,
      {
        answer,
        correct,
        submittedAtMs,
      },
    ],
    completedAtMs: correct ? submittedAtMs : null,
  };

  return {
    session: {
      ...session,
      attempts: replaceAttempt(session, activeIndex, updatedAttempt),
    },
    question,
    correct,
  };
}

export function pausePracticeSession(
  session: PracticeSession,
  pausedAtMs: number,
): PracticeSession {
  if (session.status !== 'active' || session.activeSinceMs === null) {
    throw new Error('Only an active session can be paused.');
  }

  assertTimestampNotBefore('pausedAtMs', pausedAtMs, session.activeSinceMs);

  return {
    ...session,
    status: 'paused',
    activeSinceMs: null,
    accumulatedActiveDurationMs:
      session.accumulatedActiveDurationMs +
      (pausedAtMs - session.activeSinceMs),
  };
}

export function resumePracticeSession(
  session: PracticeSession,
  resumedAtMs: number,
): PracticeSession {
  if (session.status !== 'paused') {
    throw new Error('Only a paused session can be resumed.');
  }

  assertTimestampNotBefore('resumedAtMs', resumedAtMs, session.startedAtMs);

  return {
    ...session,
    status: 'active',
    activeSinceMs: resumedAtMs,
  };
}

export function completePracticeSession(
  session: PracticeSession,
  completedAtMs: number,
): PracticeSession {
  if (session.status === 'completed') {
    throw new Error('Practice session is already completed.');
  }
  if (getActiveAttemptIndex(session) !== -1) {
    throw new Error('Complete the active question before completing the session.');
  }

  assertTimestampNotBefore('completedAtMs', completedAtMs, session.startedAtMs);

  if (session.status === 'active') {
    if (session.activeSinceMs === null) {
      throw new Error('Active session is missing its active start timestamp.');
    }
    assertTimestampNotBefore(
      'completedAtMs',
      completedAtMs,
      session.activeSinceMs,
    );

    return {
      ...session,
      status: 'completed',
      activeSinceMs: null,
      accumulatedActiveDurationMs:
        session.accumulatedActiveDurationMs +
        (completedAtMs - session.activeSinceMs),
      completedAtMs,
    };
  }

  return {
    ...session,
    status: 'completed',
    activeSinceMs: null,
    completedAtMs,
  };
}

export function getActivePracticeDurationMs(
  session: PracticeSession,
  nowMs: number,
): number {
  assertTimestampNotBefore('nowMs', nowMs, session.startedAtMs);

  if (session.status !== 'active') {
    return session.accumulatedActiveDurationMs;
  }
  if (session.activeSinceMs === null) {
    throw new Error('Active session is missing its active start timestamp.');
  }

  assertTimestampNotBefore('nowMs', nowMs, session.activeSinceMs);

  return (
    session.accumulatedActiveDurationMs +
    (nowMs - session.activeSinceMs)
  );
}


export function checkpointPracticeSession(
  session: PracticeSession,
  checkpointAtMs: number,
): PracticeSession {
  if (session.status !== 'active' || session.activeSinceMs === null) {
    return session;
  }

  assertTimestampNotBefore(
    'checkpointAtMs',
    checkpointAtMs,
    session.activeSinceMs,
  );

  return {
    ...session,
    activeSinceMs: checkpointAtMs,
    accumulatedActiveDurationMs:
      session.accumulatedActiveDurationMs +
      (checkpointAtMs - session.activeSinceMs),
  };
}

/**
 * Recovers an active session that was persisted before an unexpected process
 * interruption. Unknown offline time is deliberately not counted as practice.
 */
export function recoverInterruptedPracticeSession(
  session: PracticeSession,
): PracticeSession {
  if (session.status !== 'active') {
    return session;
  }
  if (session.activeSinceMs === null) {
    throw new Error('Active session is missing its active start timestamp.');
  }

  return {
    ...session,
    status: 'paused',
    activeSinceMs: null,
  };
}
