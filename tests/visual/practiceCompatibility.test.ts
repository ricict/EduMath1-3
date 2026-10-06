import assert from 'node:assert/strict';
import test from 'node:test';

import { startRecommendedPractice } from '../../src/core/adaptive/startRecommendedPractice';
import type { Question } from '../../src/core/types';
import { supportsPracticeScreenQuestion } from '../../src/features/practice/practiceCompatibility';

test('the zero-history adaptive entry question is supported by the current practice screen', async () => {
  const result = await startRecommendedPractice(
    {
      async listCompleted() {
        return [];
      },
    },
    {
      id: 'm6-ui-zero-history',
      grade: 1,
      sessionSeed: 20261006,
      startedAtMs: 1_000,
    },
  );

  assert.equal(result.kind, 'started');
  if (result.kind !== 'started') {
    throw new Error('Expected Grade 1 practice to start.');
  }

  assert.equal(result.question.skillId, 'number_recognition_10');
  assert.equal(supportsPracticeScreenQuestion(result.question), true);
});

test('numeric visual and symbolic questions share the same answer interaction boundary', () => {
  const questions: Question[] = [
    {
      id: 'number-recognition',
      grade: 1,
      domain: 'number',
      topic: 'number-sense',
      skillId: 'number_recognition_10',
      difficulty: 1,
      questionType: 'numeric-choice',
      representation: 'visual',
      promptKey: 'question.numberRecognition',
      data: {
        operation: 'number-recognition',
        target: 4,
      },
      expectedAnswer: 4,
    },
    {
      id: 'addition',
      grade: 1,
      domain: 'operations',
      topic: 'addition',
      skillId: 'addition_within_10',
      difficulty: 1,
      questionType: 'numeric-choice',
      representation: 'symbolic',
      promptKey: 'question.addition',
      data: {
        operation: 'addition',
        a: 2,
        b: 3,
      },
      expectedAnswer: 5,
    },
  ];

  assert.equal(questions.every(supportsPracticeScreenQuestion), true);
});

test('non-numeric question types remain explicitly unsupported by the first M6 practice screen', () => {
  const relationQuestion: Question = {
    id: 'comparison',
    grade: 1,
    domain: 'number',
    topic: 'comparison',
    skillId: 'compare_order_numbers_20',
    difficulty: 1,
    questionType: 'relation-choice',
    representation: 'symbolic',
    promptKey: 'question.numberComparison',
    data: {
      operation: 'number-comparison',
      left: 2,
      right: 3,
    },
    expectedAnswer: 'less-than',
  };

  assert.equal(supportsPracticeScreenQuestion(relationQuestion), false);
});
