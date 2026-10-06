import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completePracticeSession,
  issueNextQuestion,
  startPracticeSession,
  submitAnswer,
} from '../../src/core/session/session';
import type { LearnerAnswer } from '../../src/core/session/types';
import type { Question } from '../../src/core/types';
import { loadLearnerJourneySnapshot } from '../../src/features/journey/learnerJourneyHistory';

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
    case 'shape-choice':
      return { kind: 'shape', value: question.expectedAnswer };
  }
}

test('progress snapshot delegates completed history through M5 before M7 projection', async () => {
  let session = startPracticeSession({
    id: 'm7-progress-history',
    grade: 1,
    skillId: 'number_recognition_10',
    difficulty: 1,
    sessionSeed: 20261007,
    startedAtMs: 1_000,
  });
  const issued = issueNextQuestion(session);
  session = issued.session;
  session = submitAnswer(
    session,
    correctAnswerFor(issued.question),
    1_001,
  ).session;
  const completed = completePracticeSession(session, 1_002);
  let calls = 0;

  const snapshot = await loadLearnerJourneySnapshot({
    async listCompleted() {
      calls += 1;
      return [completed];
    },
  });

  assert.equal(calls, 1);
  assert.equal(snapshot.completedSessionCount, 1);
  assert.equal(snapshot.evidenceCount, 1);
  assert.equal(snapshot.grades.length, 3);

  const grade1 = snapshot.grades[0];
  assert.equal(grade1.grade, 1);
  assert.equal(grade1.masteredSkillCount, 0);
  assert.equal(grade1.inProgressSkillCount, 1);
  assert.equal(grade1.unseenSkillCount, 29);
});

test('progress snapshot preserves zero-history Grade 1–3 projection', async () => {
  const snapshot = await loadLearnerJourneySnapshot({
    async listCompleted() {
      return [];
    },
  });

  assert.equal(snapshot.completedSessionCount, 0);
  assert.equal(snapshot.evidenceCount, 0);
  assert.deepEqual(
    snapshot.grades.map((summary) => [
      summary.grade,
      summary.canonicalSkillCount,
      summary.masteredSkillCount,
      summary.inProgressSkillCount,
      summary.unseenSkillCount,
    ]),
    [
      [1, 30, 0, 0, 30],
      [2, 34, 0, 0, 34],
      [3, 25, 0, 0, 25],
    ],
  );
});
