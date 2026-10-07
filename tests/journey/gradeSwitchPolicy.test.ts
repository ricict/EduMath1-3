import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateGradeSwitch,
  MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH,
} from '../../src/features/journey/gradeSwitchPolicy';
import {
  completePracticeSession,
  issueNextQuestion,
  startPracticeSession,
  submitAnswer,
} from '../../src/core/session/session';
import type { PracticeSession } from '../../src/core/session/types';
import type { Question } from '../../src/core/types';

function answerFor(question: Question) {
  if (question.questionType !== 'numeric-choice') {
    throw new Error('Grade-switch fixture expects numeric questions.');
  }

  return { kind: 'numeric' as const, value: question.expectedAnswer };
}

function completedLevel(difficulty: 1 | 2 | 3, index: number): PracticeSession {
  let session = startPracticeSession({
    id: `grade1-level-${difficulty}`,
    grade: 1,
    skillId: 'number_recognition_10',
    difficulty,
    sessionSeed: 10_000 + index,
    startedAtMs: 1_000 + index * 100,
  });

  for (let questionIndex = 0; questionIndex < 5; questionIndex += 1) {
    const issued = issueNextQuestion(session);
    session = submitAnswer(
      issued.session,
      answerFor(issued.question),
      2_000 + index * 100 + questionIndex,
    ).session;
  }

  return completePracticeSession(session, 3_000 + index * 100);
}

test('grade switch is allowed before the current grade has ever started', async () => {
  const decision = await evaluateGradeSwitch(
    {
      async listCompleted() {
        return [];
      },
      async loadResumable() {
        return null;
      },
    },
    1,
    2,
  );

  assert.equal(decision.allowed, true);
});

test('started grade is locked until three mastered levels are complete', async () => {
  const history = [completedLevel(1, 0)];
  const decision = await evaluateGradeSwitch(
    {
      async listCompleted() {
        return history;
      },
      async loadResumable() {
        return null;
      },
    },
    1,
    2,
  );

  assert.equal(decision.allowed, false);
  assert.equal(decision.masteredLevelCount, 1);
  assert.equal(
    decision.minimumMasteredLevelCount,
    MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH,
  );
});

test('grade switch unlocks after all three first-skill levels are mastered', async () => {
  const history = [
    completedLevel(1, 0),
    completedLevel(2, 1),
    completedLevel(3, 2),
  ];
  const decision = await evaluateGradeSwitch(
    {
      async listCompleted() {
        return history;
      },
      async loadResumable() {
        return null;
      },
    },
    1,
    2,
  );

  assert.equal(decision.allowed, true);
  assert.equal(decision.masteredLevelCount, 3);
});
