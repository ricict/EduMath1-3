import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLearnerModel } from '../../src/core/adaptive/mastery';
import { recommendPractice } from '../../src/core/adaptive/recommendation';
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
    throw new Error('Grade 1 adaptive entry path expects numeric-choice questions.');
  }

  return question.expectedAnswer;
}

function completedMasterySession(
  skillId: SkillId,
  difficulty: Difficulty,
  index: number,
): PracticeSession {
  const startedAtMs = 100_000 + index * 10_000;
  let nowMs = startedAtMs + 1;
  let session = startPracticeSession({
    id: `entry-${skillId}-d${difficulty}`,
    grade: 1,
    skillId,
    difficulty,
    sessionSeed: 50_000 + index,
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

test('zero-history Grade 1 progression reaches addition_within_10 without bypassing prerequisites', () => {
  const history: PracticeSession[] = [];
  let sessionIndex = 0;

  let recommendation = recommendPractice(1, buildLearnerModel(history));
  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected number recognition practice for a new learner.');
  }
  assert.equal(recommendation.skillId, 'number_recognition_10');
  assert.equal(recommendation.difficulty, 1);

  for (const difficulty of [1, 2, 3] as const) {
    assert.equal(recommendation.kind, 'practice');
    if (recommendation.kind !== 'practice') {
      throw new Error('Expected number recognition progression.');
    }
    assert.equal(recommendation.skillId, 'number_recognition_10');
    assert.equal(recommendation.difficulty, difficulty);

    history.push(
      completedMasterySession(
        'number_recognition_10',
        difficulty,
        sessionIndex,
      ),
    );
    sessionIndex += 1;
    recommendation = recommendPractice(1, buildLearnerModel(history));
  }

  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected addition concept after number recognition mastery.');
  }
  assert.equal(recommendation.skillId, 'addition_concept');
  assert.equal(recommendation.difficulty, 1);
  assert.deepEqual(recommendation.reason.prerequisiteSkillIds, [
    'number_recognition_10',
  ]);

  for (const difficulty of [1, 2, 3] as const) {
    assert.equal(recommendation.kind, 'practice');
    if (recommendation.kind !== 'practice') {
      throw new Error('Expected addition concept progression.');
    }
    assert.equal(recommendation.skillId, 'addition_concept');
    assert.equal(recommendation.difficulty, difficulty);

    history.push(
      completedMasterySession(
        'addition_concept',
        difficulty,
        sessionIndex,
      ),
    );
    sessionIndex += 1;
    recommendation = recommendPractice(1, buildLearnerModel(history));
  }

  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected addition_within_10 after prerequisite mastery.');
  }
  assert.equal(recommendation.skillId, 'addition_within_10');
  assert.equal(recommendation.difficulty, 1);
  assert.deepEqual(recommendation.reason.prerequisiteSkillIds, [
    'number_recognition_10',
    'addition_concept',
  ]);
});
