import assert from 'node:assert/strict';
import test from 'node:test';

import { startRecommendedPractice } from '../../src/core/adaptive/startRecommendedPractice';
import { generateIdentify2DShapes } from '../../src/core/question-engine/identify2dShapes';
import { generateTellTimeHourHalfHour } from '../../src/core/question-engine/tellTimeHourHalfHour';
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
      answerOptions: [1, 2, 4, 5],
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
      answerOptions: [2, 3, 4, 5],
      expectedAnswer: 5,
    },
  ];

  assert.equal(questions.every(supportsPracticeScreenQuestion), true);
});


test('fraction-choice is supported after the second M6 interaction increment', () => {
  const fractionQuestion: Question = {
    id: 'fraction',
    grade: 2,
    domain: 'number',
    topic: 'fractions',
    skillId: 'unit_fractions',
    difficulty: 1,
    questionType: 'fraction-choice',
    representation: 'visual',
    promptKey: 'question.unitFraction',
    data: {
      operation: 'unit-fraction',
      shadedParts: 1,
      totalParts: 2,
      numerator: 1,
      denominator: 2,
    },
    answerOptions: [
      { numerator: 1, denominator: 2 },
      { numerator: 1, denominator: 4 },
    ],
    expectedAnswer: { numerator: 1, denominator: 2 },
  };

  assert.equal(supportsPracticeScreenQuestion(fractionQuestion), true);
});

test('time-choice is supported after the clock interaction increment', () => {
  const question = generateTellTimeHourHalfHour({
    grade: 1,
    skillId: 'tell_time_hour_half_hour',
    difficulty: 3,
    seed: 20261006,
  });

  assert.equal(supportsPracticeScreenQuestion(question), true);
});

test('shape-choice is supported by the M6 geometry interaction boundary', () => {
  const question = generateIdentify2DShapes({
    grade: 1,
    skillId: 'identify_2d_shapes',
    difficulty: 3,
    seed: 20261006,
  });

  assert.equal(supportsPracticeScreenQuestion(question), true);
});

test('relation-choice is supported by the completed M6 interaction boundary', () => {
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
      scaleMin: 0,
      scaleMax: 10,
    },
    expectedAnswer: 'less-than',
  };

  assert.equal(supportsPracticeScreenQuestion(relationQuestion), true);
});
