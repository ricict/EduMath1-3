import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLearnerModel,
  extractSkillEvidence,
} from '../../src/core/adaptive/mastery';
import { loadLearnerModel } from '../../src/core/adaptive/history';
import {
  completePracticeSession,
  issueNextQuestion,
  startPracticeSession,
  submitAnswer,
} from '../../src/core/session/session';
import type { PracticeSession } from '../../src/core/session/types';
import type { Difficulty, Question } from '../../src/core/types';

function numericCorrectAnswer(question: Question): number {
  if (question.questionType !== 'numeric-choice') {
    throw new Error('Expected a numeric question in M5 mastery test.');
  }

  return question.expectedAnswer;
}

function createCompletedAdditionSession(
  id: string,
  difficulty: Difficulty,
  firstTryCorrect: readonly boolean[],
  startedAtMs: number,
): PracticeSession {
  let session = startPracticeSession({
    id,
    grade: 1,
    skillId: 'addition_within_10',
    difficulty,
    sessionSeed: startedAtMs,
    startedAtMs,
  });
  let nowMs = startedAtMs + 1;

  for (const isFirstTryCorrect of firstTryCorrect) {
    const issued = issueNextQuestion(session);
    session = issued.session;

    const correctValue = numericCorrectAnswer(issued.question);

    if (!isFirstTryCorrect) {
      session = submitAnswer(
        session,
        { kind: 'numeric', value: correctValue + 100 },
        nowMs,
      ).session;
      nowMs += 1;
    }

    session = submitAnswer(
      session,
      { kind: 'numeric', value: correctValue },
      nowMs,
    ).session;
    nowMs += 1;
  }

  return completePracticeSession(session, nowMs);
}

test('retrying a question produces one evidence unit and cannot inflate mastery', () => {
  let session = startPracticeSession({
    id: 'retry-evidence',
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 1,
    sessionSeed: 10,
    startedAtMs: 1_000,
  });
  const issued = issueNextQuestion(session);
  session = issued.session;
  const correctValue = numericCorrectAnswer(issued.question);

  session = submitAnswer(
    session,
    { kind: 'numeric', value: correctValue + 1 },
    1_001,
  ).session;
  session = submitAnswer(
    session,
    { kind: 'numeric', value: correctValue + 2 },
    1_002,
  ).session;
  session = submitAnswer(
    session,
    { kind: 'numeric', value: correctValue },
    1_003,
  ).session;
  session = completePracticeSession(session, 1_004);

  const evidence = extractSkillEvidence([session]);

  assert.equal(evidence.length, 1);
  assert.equal(evidence[0].firstTryCorrect, false);
  assert.equal(evidence[0].incorrectSubmissionCount, 2);
});

test('fewer than five completed questions remains insufficient evidence', () => {
  const session = createCompletedAdditionSession(
    'insufficient',
    1,
    [true, true, true, true],
    2_000,
  );
  const state = buildLearnerModel([session]).skills.addition_within_10;

  assert.equal(state.difficulties[0].status, 'insufficient-evidence');
  assert.equal(state.status, 'insufficient-evidence');
  assert.equal(state.nextDifficulty, 1);
});

test('four first-try successes in the recent five masters one difficulty only', () => {
  const session = createCompletedAdditionSession(
    'difficulty-one-mastered',
    1,
    [true, true, true, true, false],
    3_000,
  );
  const state = buildLearnerModel([session]).skills.addition_within_10;

  assert.equal(state.difficulties[0].status, 'mastered');
  assert.equal(state.difficulties[0].recentFirstTryCorrectCount, 4);
  assert.equal(state.status, 'developing');
  assert.equal(state.nextDifficulty, 2);
});

test('three first-try successes in five is developing rather than mastered', () => {
  const session = createCompletedAdditionSession(
    'difficulty-one-developing',
    1,
    [true, true, true, false, false],
    4_000,
  );
  const state = buildLearnerModel([session]).skills.addition_within_10;

  assert.equal(state.difficulties[0].status, 'developing');
  assert.equal(state.status, 'developing');
  assert.equal(state.nextDifficulty, 1);
});

test('skill mastery requires mastery at all three difficulty levels', () => {
  const sessions = [
    createCompletedAdditionSession('d1', 1, [true, true, true, true, false], 5_000),
    createCompletedAdditionSession('d2', 2, [true, true, true, true, false], 6_000),
    createCompletedAdditionSession('d3', 3, [true, true, true, true, false], 7_000),
  ];
  const state = buildLearnerModel(sessions).skills.addition_within_10;

  assert.equal(state.status, 'mastered');
  assert.equal(state.totalEvidenceCount, 15);
  assert.equal(state.nextDifficulty, 3);
});

test('mastery uses the most recent five evidence units at a difficulty', () => {
  const session = createCompletedAdditionSession(
    'recent-window',
    1,
    [false, false, false, false, false, true, true, true, true, true],
    8_000,
  );
  const state = buildLearnerModel([session]).skills.addition_within_10;

  assert.equal(state.difficulties[0].totalEvidenceCount, 10);
  assert.equal(state.difficulties[0].recentEvidenceCount, 5);
  assert.equal(state.difficulties[0].recentFirstTryCorrectCount, 5);
  assert.equal(state.difficulties[0].status, 'mastered');
});

test('same completed history yields the same model regardless of input session order', () => {
  const older = createCompletedAdditionSession(
    'older',
    1,
    [false, true, true],
    9_000,
  );
  const newer = createCompletedAdditionSession(
    'newer',
    1,
    [true, true, true],
    10_000,
  );

  assert.deepEqual(
    buildLearnerModel([older, newer]),
    buildLearnerModel([newer, older]),
  );
});

test('M5 rejects non-completed sessions as historical mastery evidence', () => {
  const active = startPracticeSession({
    id: 'active-history',
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 1,
    sessionSeed: 1,
    startedAtMs: 1,
  });

  assert.throws(
    () => buildLearnerModel([active]),
    /only completed practice sessions/,
  );
});

test('learner model loading consumes LocalSessionStore.listCompleted without mutating history', async () => {
  const completed = createCompletedAdditionSession(
    'history-store',
    1,
    [true, false, true],
    11_000,
  );
  const snapshot = JSON.stringify(completed);
  let calls = 0;

  const model = await loadLearnerModel({
    async listCompleted() {
      calls += 1;
      return [completed];
    },
  });

  assert.equal(calls, 1);
  assert.equal(model.completedSessionCount, 1);
  assert.equal(model.evidenceCount, 3);
  assert.equal(JSON.stringify(completed), snapshot);
});
