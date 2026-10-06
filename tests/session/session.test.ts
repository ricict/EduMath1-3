import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkpointPracticeSession,
  completePracticeSession,
  deriveQuestionSeed,
  getActivePracticeDurationMs,
  issueNextQuestion,
  pausePracticeSession,
  recoverInterruptedPracticeSession,
  restoreActiveQuestion,
  resumePracticeSession,
  startPracticeSession,
  submitAnswer,
} from '../../src/core/session/session';
import {
  DEFAULT_PRACTICE_TARGET_MS,
  PRACTICE_SESSION_SCHEMA_VERSION,
  type LearnerAnswer,
  type PracticeSession,
} from '../../src/core/session/types';
import type { Question } from '../../src/core/types';

function createAdditionSession(
  overrides: Partial<Parameters<typeof startPracticeSession>[0]> = {},
): PracticeSession {
  return startPracticeSession({
    id: 'session-test-1',
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    sessionSeed: 20261006,
    startedAtMs: 1_000,
    ...overrides,
  });
}

function correctAnswerFor(question: Question): LearnerAnswer {
  switch (question.questionType) {
    case 'numeric-choice':
      return { kind: 'numeric', value: question.expectedAnswer };
    case 'relation-choice':
      return { kind: 'relation', value: question.expectedAnswer };
    case 'fraction-choice':
      return { kind: 'fraction', value: question.expectedAnswer };
    case 'time-choice':
      return { kind: 'time', value: question.expectedAnswer };
  }
}

test('session starts with a versioned 10-minute practice target and no learner PII', () => {
  const session = createAdditionSession();

  assert.equal(session.schemaVersion, PRACTICE_SESSION_SCHEMA_VERSION);
  assert.equal(session.plan.targetDurationMs, DEFAULT_PRACTICE_TARGET_MS);
  assert.equal(session.status, 'active');
  assert.equal(session.attempts.length, 0);
  assert.deepEqual(Object.keys(session).sort(), [
    'accumulatedActiveDurationMs',
    'activeSinceMs',
    'attempts',
    'completedAtMs',
    'id',
    'plan',
    'schemaVersion',
    'sessionSeed',
    'startedAtMs',
    'status',
  ]);
});

test('question seeds are deterministic and position-specific without changing the M3 PRNG', () => {
  assert.equal(deriveQuestionSeed(20261006, 0), 20261006);
  assert.equal(deriveQuestionSeed(20261006, 1), 20261007);
  assert.equal(deriveQuestionSeed(0xffffffff, 1), 0);
  assert.throws(() => deriveQuestionSeed(1, -1), /unsigned 32-bit integer/);
});

test('first issued question consumes the M3 registry and preserves the locked M1 reference', () => {
  const issued = issueNextQuestion(createAdditionSession());

  assert.equal(issued.question.id, 'addition_within_10:20261006:4:1');
  if (issued.question.data.operation !== 'addition') {
    throw new Error('Expected addition semantics.');
  }

  assert.equal(issued.question.data.a, 4);
  assert.equal(issued.question.data.b, 1);
  assert.equal(issued.question.expectedAnswer, 5);
  assert.equal(issued.session.attempts[0].question.ordinal, 0);
  assert.equal(
    issued.session.attempts[0].question.generationContext.seed,
    20261006,
  );
});

test('an incorrect answer is retained and the same deterministic question remains active', () => {
  const issued = issueNextQuestion(createAdditionSession());
  const wrong = submitAnswer(
    issued.session,
    { kind: 'numeric', value: 999 },
    2_000,
  );

  assert.equal(wrong.correct, false);
  assert.equal(wrong.session.attempts[0].status, 'active');
  assert.equal(wrong.session.attempts[0].answers.length, 1);
  assert.equal(wrong.session.attempts[0].answers[0].correct, false);
  assert.equal(restoreActiveQuestion(wrong.session)?.id, issued.question.id);

  assert.throws(
    () => issueNextQuestion(wrong.session),
    /Complete the active question/,
  );
});

test('a correct answer completes the current attempt and permits deterministic progression', () => {
  const first = issueNextQuestion(createAdditionSession());
  const answered = submitAnswer(
    first.session,
    correctAnswerFor(first.question),
    2_000,
  );
  const second = issueNextQuestion(answered.session);

  assert.equal(answered.correct, true);
  assert.equal(answered.session.attempts[0].status, 'completed');
  assert.equal(answered.session.attempts[0].completedAtMs, 2_000);
  assert.equal(second.session.attempts.length, 2);
  assert.equal(
    second.session.attempts[1].question.generationContext.seed,
    20261007,
  );
});

test('the same session seed and progression reconstruct the same question sequence', () => {
  function firstTwoQuestionIds(): readonly string[] {
    const first = issueNextQuestion(createAdditionSession());
    const answered = submitAnswer(
      first.session,
      correctAnswerFor(first.question),
      2_000,
    );
    const second = issueNextQuestion(answered.session);

    return [first.question.id, second.question.id];
  }

  assert.deepEqual(firstTwoQuestionIds(), firstTwoQuestionIds());
});

test('semantic learner answers work across every M3 question type', () => {
  const cases = [
    {
      id: 'numeric',
      grade: 2 as const,
      skillId: 'multiplication_facts_2_5_10' as const,
      difficulty: 3 as const,
      sessionSeed: 12,
    },
    {
      id: 'relation',
      grade: 1 as const,
      skillId: 'compare_order_numbers_20' as const,
      difficulty: 3 as const,
      sessionSeed: 13,
    },
    {
      id: 'fraction',
      grade: 2 as const,
      skillId: 'unit_fractions' as const,
      difficulty: 3 as const,
      sessionSeed: 14,
    },
    {
      id: 'time',
      grade: 1 as const,
      skillId: 'tell_time_hour_half_hour' as const,
      difficulty: 3 as const,
      sessionSeed: 15,
    },
  ];

  for (const item of cases) {
    const issued = issueNextQuestion(
      startPracticeSession({
        ...item,
        startedAtMs: 1_000,
      }),
    );
    const answered = submitAnswer(
      issued.session,
      correctAnswerFor(issued.question),
      2_000,
    );

    assert.equal(answered.correct, true, item.id);
    assert.equal(answered.session.attempts[0].status, 'completed', item.id);
  }
});

test('pause and resume preserve the current question while counting only active practice time', () => {
  const issued = issueNextQuestion(createAdditionSession());
  const paused = pausePracticeSession(issued.session, 4_000);

  assert.equal(paused.status, 'paused');
  assert.equal(paused.accumulatedActiveDurationMs, 3_000);
  assert.equal(restoreActiveQuestion(paused)?.id, issued.question.id);
  assert.equal(getActivePracticeDurationMs(paused, 9_000), 3_000);

  const resumed = resumePracticeSession(paused, 10_000);
  assert.equal(restoreActiveQuestion(resumed)?.id, issued.question.id);
  assert.equal(getActivePracticeDurationMs(resumed, 12_000), 5_000);
});

test('a session can complete before its target duration once no question is active', () => {
  const first = issueNextQuestion(createAdditionSession());
  const answered = submitAnswer(
    first.session,
    correctAnswerFor(first.question),
    2_000,
  );
  const completed = completePracticeSession(answered.session, 3_000);

  assert.equal(completed.status, 'completed');
  assert.equal(completed.completedAtMs, 3_000);
  assert.equal(completed.accumulatedActiveDurationMs, 2_000);
  assert.ok(
    completed.accumulatedActiveDurationMs < completed.plan.targetDurationMs,
  );
  assert.throws(() => issueNextQuestion(completed), /only while a session is active/);
});

test('deterministic reconstruction rejects a tampered stored question identity', () => {
  const issued = issueNextQuestion(createAdditionSession());
  const tampered: PracticeSession = {
    ...issued.session,
    attempts: [
      {
        ...issued.session.attempts[0],
        question: {
          ...issued.session.attempts[0].question,
          questionId: 'tampered-question-id',
        },
      },
    ],
  };

  assert.throws(
    () => restoreActiveQuestion(tampered),
    /does not match deterministic reconstruction/,
  );
});


test('active session checkpoints fold elapsed time into persisted duration', () => {
  const session = createAdditionSession();
  const checkpointed = checkpointPracticeSession(session, 4_000);

  assert.equal(checkpointed.status, 'active');
  assert.equal(checkpointed.activeSinceMs, 4_000);
  assert.equal(checkpointed.accumulatedActiveDurationMs, 3_000);
  assert.equal(getActivePracticeDurationMs(checkpointed, 5_000), 4_000);
});

test('unexpected interruption recovery excludes unknown offline time', () => {
  const checkpointed = checkpointPracticeSession(
    createAdditionSession(),
    4_000,
  );
  const recovered = recoverInterruptedPracticeSession(checkpointed);

  assert.equal(recovered.status, 'paused');
  assert.equal(recovered.activeSinceMs, null);
  assert.equal(recovered.accumulatedActiveDurationMs, 3_000);

  const resumed = resumePracticeSession(recovered, 20_000);
  assert.equal(getActivePracticeDurationMs(resumed, 22_000), 5_000);
});
