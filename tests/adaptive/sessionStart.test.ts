import assert from 'node:assert/strict';
import test from 'node:test';

import { startRecommendedPractice } from '../../src/core/adaptive/startRecommendedPractice';
import {
  completePracticeSession,
  issueNextQuestion,
  startPracticeSession,
  submitAnswer,
} from '../../src/core/session/session';
import type { PracticeSession } from '../../src/core/session/types';
import type { Difficulty, Question, SkillId } from '../../src/core/types';

function correctNumericAnswer(question: Question): number {
  if (question.questionType !== 'numeric-choice') {
    throw new Error('Adaptive entry-path helper expects numeric-choice questions.');
  }

  return question.expectedAnswer;
}

function masteredDifficultySession(
  skillId: SkillId,
  difficulty: Difficulty,
  index: number,
): PracticeSession {
  const startedAtMs = 10_000 + index * 1_000;
  let nowMs = startedAtMs + 1;
  let session = startPracticeSession({
    id: `bridge-history-${skillId}-d${difficulty}`,
    grade: 1,
    skillId,
    difficulty,
    sessionSeed: 9_000 + index,
    startedAtMs,
  });

  for (let questionIndex = 0; questionIndex < 5; questionIndex += 1) {
    const issued = issueNextQuestion(session);
    session = issued.session;
    session = submitAnswer(
      session,
      { kind: 'numeric', value: correctNumericAnswer(issued.question) },
      nowMs,
    ).session;
    nowMs += 1;
  }

  return completePracticeSession(session, nowMs);
}

test('zero-history bridge starts the first recommended Grade 1 skill through M4 and M3', async () => {
  let listCompletedCalls = 0;
  const result = await startRecommendedPractice(
    {
      async listCompleted() {
        listCompletedCalls += 1;
        return [];
      },
    },
    {
      id: 'adaptive-zero-history',
      grade: 1,
      sessionSeed: 20261006,
      startedAtMs: 100_000,
      targetDurationMs: 300_000,
    },
  );

  assert.equal(listCompletedCalls, 1);
  assert.equal(result.kind, 'started');
  if (result.kind !== 'started') {
    throw new Error('Expected an adaptive practice session to start.');
  }

  assert.equal(result.recommendation.skillId, 'number_recognition_10');
  assert.equal(result.recommendation.difficulty, 1);
  assert.equal(result.session.plan.skillId, result.recommendation.skillId);
  assert.equal(result.session.plan.difficulty, result.recommendation.difficulty);
  assert.equal(result.session.plan.targetDurationMs, 300_000);
  assert.equal(result.session.attempts.length, 1);
  assert.equal(result.question.skillId, result.recommendation.skillId);
  assert.equal(result.question.difficulty, result.recommendation.difficulty);
  assert.equal(
    result.session.attempts[0].question.questionId,
    result.question.id,
  );
});

test('fixed history and fixed session inputs produce the same adaptive session start', async () => {
  const store = {
    async listCompleted(): Promise<readonly PracticeSession[]> {
      return [];
    },
  };
  const input = {
    id: 'adaptive-deterministic',
    grade: 1 as const,
    sessionSeed: 123456,
    startedAtMs: 200_000,
  };

  assert.deepEqual(
    await startRecommendedPractice(store, input),
    await startRecommendedPractice(store, input),
  );
});

test('completed prerequisite history starts addition_within_10 rather than bypassing the DAG', async () => {
  const history: PracticeSession[] = [];
  let index = 0;

  for (const skillId of [
    'number_recognition_10',
    'addition_concept',
  ] as const) {
    for (const difficulty of [1, 2, 3] as const) {
      history.push(masteredDifficultySession(skillId, difficulty, index));
      index += 1;
    }
  }

  const result = await startRecommendedPractice(
    {
      async listCompleted() {
        return history;
      },
    },
    {
      id: 'adaptive-after-prerequisites',
      grade: 1,
      sessionSeed: 654321,
      startedAtMs: 300_000,
    },
  );

  assert.equal(result.kind, 'started');
  if (result.kind !== 'started') {
    throw new Error('Expected addition_within_10 session to start.');
  }

  assert.equal(result.recommendation.skillId, 'addition_within_10');
  assert.equal(result.recommendation.difficulty, 1);
  assert.deepEqual(result.recommendation.reason.prerequisiteSkillIds, [
    'number_recognition_10',
    'addition_concept',
  ]);
  assert.equal(result.session.plan.skillId, 'addition_within_10');
  assert.equal(result.question.skillId, 'addition_within_10');
});

test('bridge returns the unavailable recommendation without creating a Grade 3 session', async () => {
  const result = await startRecommendedPractice(
    {
      async listCompleted() {
        return [];
      },
    },
    {
      id: 'grade-three-unavailable',
      grade: 3,
      sessionSeed: 1,
      startedAtMs: 400_000,
    },
  );

  assert.equal(result.kind, 'unavailable');
  if (result.kind !== 'unavailable') {
    throw new Error('Expected Grade 3 to remain unavailable without prerequisite evidence.');
  }

  assert.equal(
    result.recommendation.reason.code,
    'NO_CURRICULUM_ELIGIBLE_UNMASTERED_SKILL',
  );
});
