import { SKILL_IDS } from '../curriculum/skillIds';
import { generateQuestion } from '../question-engine/registry';
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
import { deriveQuestionSeed, evaluateLearnerAnswer } from './session';
import {
  PRACTICE_SESSION_SCHEMA_VERSION,
  type AnswerRecord,
  type LearnerAnswer,
  type PracticeSession,
  type PracticeSessionPlan,
  type PracticeSessionStatus,
  type QuestionAttempt,
  type QuestionAttemptStatus,
  type SessionQuestionContext,
  type SessionQuestionReference,
} from './types';

const MAX_UINT32 = 0xffffffff;

const QUESTION_TYPES = [
  'numeric-choice',
  'relation-choice',
  'fraction-choice',
  'time-choice',
  'shape-choice',
] as const satisfies readonly QuestionType[];

const REPRESENTATIONS = [
  'symbolic',
  'visual',
  'concrete',
  'number-line',
  'clock',
  'money',
  'table',
  'pictogram',
  'bar-chart',
] as const satisfies readonly RepresentationType[];

const RELATIONS = [
  'less-than',
  'equal',
  'greater-than',
] as const satisfies readonly ComparisonRelation[];

const SHAPES = [
  'circle',
  'triangle',
  'square',
  'rectangle',
] as const satisfies readonly Shape2D[];

const SESSION_STATUSES = [
  'active',
  'paused',
  'completed',
] as const satisfies readonly PracticeSessionStatus[];

const ATTEMPT_STATUSES = [
  'active',
  'completed',
] as const satisfies readonly QuestionAttemptStatus[];

const SESSION_KEY_PREFIX = 'edumath:m4:practice-session:v1:';
const RESUMABLE_SESSION_KEY = 'edumath:m4:resumable-session-id:v1';
const COMPLETED_SESSION_INDEX_KEY = 'edumath:m4:completed-session-ids:v1';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface LocalSessionStore {
  save(session: PracticeSession): Promise<void>;
  load(sessionId: string): Promise<PracticeSession | null>;
  loadResumable(): Promise<PracticeSession | null>;
  listCompleted(): Promise<readonly PracticeSession[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function requireFiniteNonNegativeNumber(
  value: unknown,
  label: string,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number.`);
  }

  return value;
}

function requireNullableTimestamp(
  value: unknown,
  label: string,
): number | null {
  if (value === null) {
    return null;
  }

  return requireFiniteNonNegativeNumber(value, label);
}

function requirePositiveSafeInteger(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${label} must be a positive safe integer.`);
  }

  return value;
}

function requireUint32(value: unknown, label: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_UINT32
  ) {
    throw new Error(`${label} must be an unsigned 32-bit integer.`);
  }

  return value;
}

function requireArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function requireMember<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${label} has an unsupported value.`);
  }

  return value as T;
}

function requireGrade(value: unknown, label: string): Grade {
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new Error(`${label} must be Grade 1, 2, or 3.`);
  }

  return value;
}

function requireDifficulty(value: unknown, label: string): Difficulty {
  if (value !== 1 && value !== 2 && value !== 3) {
    throw new Error(`${label} must be difficulty 1, 2, or 3.`);
  }

  return value;
}

function requireSkillId(value: unknown, label: string): SkillId {
  if (
    typeof value !== 'string' ||
    !(SKILL_IDS as readonly string[]).includes(value)
  ) {
    throw new Error(`${label} must be a canonical SkillId.`);
  }

  return value as SkillId;
}

function parseFractionAnswer(value: unknown, label: string): FractionAnswer {
  const record = requireRecord(value, label);
  const numerator = record.numerator;
  const denominator = record.denominator;

  if (
    typeof numerator !== 'number' ||
    !Number.isInteger(numerator) ||
    typeof denominator !== 'number' ||
    !Number.isInteger(denominator) ||
    denominator === 0
  ) {
    throw new Error(`${label} must contain an integer fraction.`);
  }

  return { numerator, denominator };
}

function parseTimeAnswer(value: unknown, label: string): TimeAnswer {
  const record = requireRecord(value, label);
  const hour = record.hour;
  const minute = record.minute;

  if (
    typeof hour !== 'number' ||
    !Number.isInteger(hour) ||
    (minute !== 0 && minute !== 30)
  ) {
    throw new Error(`${label} must contain a supported clock answer.`);
  }

  return { hour, minute };
}

function parseLearnerAnswer(value: unknown, label: string): LearnerAnswer {
  const record = requireRecord(value, label);

  switch (record.kind) {
    case 'numeric':
      if (typeof record.value !== 'number' || !Number.isFinite(record.value)) {
        throw new Error(`${label}.value must be a finite number.`);
      }
      return { kind: 'numeric', value: record.value };

    case 'relation':
      return {
        kind: 'relation',
        value: requireMember(
          record.value,
          RELATIONS,
          `${label}.value`,
        ),
      };

    case 'fraction':
      return {
        kind: 'fraction',
        value: parseFractionAnswer(record.value, `${label}.value`),
      };

    case 'time':
      return {
        kind: 'time',
        value: parseTimeAnswer(record.value, `${label}.value`),
      };

    case 'shape':
      return {
        kind: 'shape',
        value: requireMember(record.value, SHAPES, `${label}.value`),
      };

    default:
      throw new Error(`${label}.kind has an unsupported value.`);
  }
}

function parseAnswerRecord(value: unknown, label: string): AnswerRecord {
  const record = requireRecord(value, label);

  if (typeof record.correct !== 'boolean') {
    throw new Error(`${label}.correct must be boolean.`);
  }

  return {
    answer: parseLearnerAnswer(record.answer, `${label}.answer`),
    correct: record.correct,
    submittedAtMs: requireFiniteNonNegativeNumber(
      record.submittedAtMs,
      `${label}.submittedAtMs`,
    ),
  };
}

function parseSessionQuestionContext(
  value: unknown,
  label: string,
): SessionQuestionContext {
  const record = requireRecord(value, label);

  return {
    grade: requireGrade(record.grade, `${label}.grade`),
    skillId: requireSkillId(record.skillId, `${label}.skillId`),
    difficulty: requireDifficulty(
      record.difficulty,
      `${label}.difficulty`,
    ),
    seed: requireUint32(record.seed, `${label}.seed`),
  };
}

function parseQuestionReference(
  value: unknown,
  label: string,
): SessionQuestionReference {
  const record = requireRecord(value, label);

  return {
    ordinal: requireUint32(record.ordinal, `${label}.ordinal`),
    generationContext: parseSessionQuestionContext(
      record.generationContext,
      `${label}.generationContext`,
    ),
    questionId: requireString(record.questionId, `${label}.questionId`),
    questionType: requireMember(
      record.questionType,
      QUESTION_TYPES,
      `${label}.questionType`,
    ),
    representation: requireMember(
      record.representation,
      REPRESENTATIONS,
      `${label}.representation`,
    ),
  };
}

function parseQuestionAttempt(value: unknown, label: string): QuestionAttempt {
  const record = requireRecord(value, label);

  return {
    question: parseQuestionReference(record.question, `${label}.question`),
    status: requireMember(
      record.status,
      ATTEMPT_STATUSES,
      `${label}.status`,
    ),
    answers: requireArray(record.answers, `${label}.answers`).map(
      (answer, index) =>
        parseAnswerRecord(answer, `${label}.answers[${index}]`),
    ),
    completedAtMs: requireNullableTimestamp(
      record.completedAtMs,
      `${label}.completedAtMs`,
    ),
  };
}

function parsePlan(value: unknown): PracticeSessionPlan {
  const record = requireRecord(value, 'Practice session plan');

  return {
    grade: requireGrade(record.grade, 'Practice session plan grade'),
    skillId: requireSkillId(
      record.skillId,
      'Practice session plan skillId',
    ),
    difficulty: requireDifficulty(
      record.difficulty,
      'Practice session plan difficulty',
    ),
    targetDurationMs: requirePositiveSafeInteger(
      record.targetDurationMs,
      'Practice session target duration',
    ),
  };
}

function assertSessionSemantics(session: PracticeSession): void {
  if (session.id !== session.id.trim()) {
    throw new Error('Practice session ID must already be normalized.');
  }

  if (
    !Number.isInteger(session.sessionSeed) ||
    session.sessionSeed < 0 ||
    session.sessionSeed > MAX_UINT32
  ) {
    throw new Error('Practice session seed must be an unsigned 32-bit integer.');
  }

  if (
    !Number.isFinite(session.accumulatedActiveDurationMs) ||
    session.accumulatedActiveDurationMs < 0
  ) {
    throw new Error('Accumulated active duration is invalid.');
  }

  if (session.status === 'active') {
    if (session.activeSinceMs === null || session.completedAtMs !== null) {
      throw new Error('Active session timestamps are inconsistent.');
    }
  } else if (session.status === 'paused') {
    if (session.activeSinceMs !== null || session.completedAtMs !== null) {
      throw new Error('Paused session timestamps are inconsistent.');
    }
  } else if (
    session.activeSinceMs !== null ||
    session.completedAtMs === null
  ) {
    throw new Error('Completed session timestamps are inconsistent.');
  }

  if (
    session.activeSinceMs !== null &&
    session.activeSinceMs < session.startedAtMs
  ) {
    throw new Error('Active session timestamp predates session start.');
  }

  if (
    session.completedAtMs !== null &&
    session.completedAtMs < session.startedAtMs
  ) {
    throw new Error('Completion timestamp predates session start.');
  }

  let activeAttemptIndex = -1;

  session.attempts.forEach((attempt, index) => {
    if (attempt.question.ordinal !== index) {
      throw new Error('Question attempt ordinal does not match stored order.');
    }

    const context = attempt.question.generationContext;
    if (
      context.grade !== session.plan.grade ||
      context.skillId !== session.plan.skillId ||
      context.difficulty !== session.plan.difficulty
    ) {
      throw new Error('Stored question context does not match the session plan.');
    }

    const expectedSeed = deriveQuestionSeed(session.sessionSeed, index);
    const legacySequentialSeed = (session.sessionSeed + index) >>> 0;
    if (
      context.seed !== expectedSeed &&
      context.seed !== legacySequentialSeed
    ) {
      throw new Error('Stored question seed does not match deterministic sequencing.');
    }

    const question = generateQuestion(context);
    if (
      question.id !== attempt.question.questionId ||
      question.questionType !== attempt.question.questionType ||
      question.representation !== attempt.question.representation
    ) {
      throw new Error('Stored question reference does not reconstruct deterministically.');
    }

    for (const answer of attempt.answers) {
      if (answer.submittedAtMs < session.startedAtMs) {
        throw new Error('Stored answer predates the session start.');
      }
      if (
        session.completedAtMs !== null &&
        answer.submittedAtMs > session.completedAtMs
      ) {
        throw new Error('Stored answer occurs after session completion.');
      }

      const expectedCorrect = evaluateLearnerAnswer(question, answer.answer);
      if (answer.correct !== expectedCorrect) {
        throw new Error('Stored answer correctness does not match question semantics.');
      }
    }

    if (attempt.status === 'active') {
      if (activeAttemptIndex !== -1) {
        throw new Error('Persisted session contains multiple active attempts.');
      }
      activeAttemptIndex = index;

      if (attempt.completedAtMs !== null) {
        throw new Error('Active attempt cannot have a completion timestamp.');
      }
      if (attempt.answers.some((answer) => answer.correct)) {
        throw new Error('Active attempt cannot contain a correct terminal answer.');
      }
    } else {
      const lastAnswer = attempt.answers.at(-1);
      if (
        attempt.completedAtMs === null ||
        !lastAnswer ||
        !lastAnswer.correct ||
        lastAnswer.submittedAtMs !== attempt.completedAtMs
      ) {
        throw new Error('Completed attempt must end with its correct terminal answer.');
      }
    }
  });

  if (
    activeAttemptIndex !== -1 &&
    activeAttemptIndex !== session.attempts.length - 1
  ) {
    throw new Error('Only the latest persisted question attempt may remain active.');
  }

  if (session.status === 'completed' && activeAttemptIndex !== -1) {
    throw new Error('Completed session cannot contain an active question attempt.');
  }
}

export function deserializePracticeSession(serialized: string): PracticeSession {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error('Persisted practice session is not valid JSON.');
  }

  const record = requireRecord(parsed, 'Persisted practice session');

  if (record.schemaVersion !== PRACTICE_SESSION_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported practice session schema version: ${String(record.schemaVersion)}.`,
    );
  }

  const session: PracticeSession = {
    schemaVersion: PRACTICE_SESSION_SCHEMA_VERSION,
    id: requireString(record.id, 'Practice session ID'),
    sessionSeed: requireUint32(record.sessionSeed, 'Practice session seed'),
    plan: parsePlan(record.plan),
    status: requireMember(
      record.status,
      SESSION_STATUSES,
      'Practice session status',
    ),
    startedAtMs: requireFiniteNonNegativeNumber(
      record.startedAtMs,
      'Practice session startedAtMs',
    ),
    activeSinceMs: requireNullableTimestamp(
      record.activeSinceMs,
      'Practice session activeSinceMs',
    ),
    accumulatedActiveDurationMs: requireFiniteNonNegativeNumber(
      record.accumulatedActiveDurationMs,
      'Practice session accumulatedActiveDurationMs',
    ),
    completedAtMs: requireNullableTimestamp(
      record.completedAtMs,
      'Practice session completedAtMs',
    ),
    attempts: requireArray(
      record.attempts,
      'Practice session attempts',
    ).map((attempt, index) =>
      parseQuestionAttempt(attempt, `Practice session attempts[${index}]`),
    ),
  };

  assertSessionSemantics(session);
  return session;
}

export function serializePracticeSession(session: PracticeSession): string {
  assertSessionSemantics(session);
  return JSON.stringify(session);
}

function sessionStorageKey(sessionId: string): string {
  const normalizedId = sessionId.trim();

  if (!normalizedId) {
    throw new Error('Practice session ID must be non-empty.');
  }

  return `${SESSION_KEY_PREFIX}${encodeURIComponent(normalizedId)}`;
}

function parseCompletedSessionIds(serialized: string | null): readonly string[] {
  if (serialized === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error('Completed session index is not valid JSON.');
  }

  if (
    !Array.isArray(parsed) ||
    parsed.some((value) => typeof value !== 'string' || value.length === 0)
  ) {
    throw new Error('Completed session index must contain only session IDs.');
  }

  return [...new Set(parsed)];
}

export function createLocalSessionStore(
  storage: KeyValueStorage,
): LocalSessionStore {
  const load = async (sessionId: string): Promise<PracticeSession | null> => {
    const serialized = await storage.getItem(sessionStorageKey(sessionId));
    return serialized === null
      ? null
      : deserializePracticeSession(serialized);
  };

  return {
    async save(session) {
      const serialized = serializePracticeSession(session);
      await storage.setItem(sessionStorageKey(session.id), serialized);

      if (session.status === 'completed') {
        const completedIds = parseCompletedSessionIds(
          await storage.getItem(COMPLETED_SESSION_INDEX_KEY),
        );
        if (!completedIds.includes(session.id)) {
          await storage.setItem(
            COMPLETED_SESSION_INDEX_KEY,
            JSON.stringify([...completedIds, session.id]),
          );
        }

        const resumableId = await storage.getItem(RESUMABLE_SESSION_KEY);
        if (resumableId === session.id) {
          await storage.removeItem(RESUMABLE_SESSION_KEY);
        }
        return;
      }

      await storage.setItem(RESUMABLE_SESSION_KEY, session.id);
    },

    load,

    async loadResumable() {
      const sessionId = await storage.getItem(RESUMABLE_SESSION_KEY);
      if (sessionId === null) {
        return null;
      }

      const session = await load(sessionId);
      if (session === null || session.status === 'completed') {
        await storage.removeItem(RESUMABLE_SESSION_KEY);
        return null;
      }

      return session;
    },

    async listCompleted() {
      const sessionIds = parseCompletedSessionIds(
        await storage.getItem(COMPLETED_SESSION_INDEX_KEY),
      );
      const sessions: PracticeSession[] = [];

      for (const sessionId of sessionIds) {
        const session = await load(sessionId);
        if (session === null) {
          throw new Error(`Completed session index references missing session ${sessionId}.`);
        }
        if (session.status !== 'completed') {
          throw new Error(`Completed session index references non-completed session ${sessionId}.`);
        }
        sessions.push(session);
      }

      return sessions;
    },
  };
}
