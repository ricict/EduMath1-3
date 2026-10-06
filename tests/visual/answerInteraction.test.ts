import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAdditionWithin10 } from '../../src/core/question-engine/additionWithin10';
import { generateTellTimeHourHalfHour } from '../../src/core/question-engine/tellTimeHourHalfHour';
import { generateUnitFraction } from '../../src/core/question-engine/unitFractions';
import { evaluateLearnerAnswer } from '../../src/core/session/session';
import {
  formatPracticeAnswerText,
  getPracticeAnswerOptions,
  isSamePracticeAnswer,
} from '../../src/features/practice/answerInteraction';

test('numeric interaction preserves the existing 0 through 10 answer surface', () => {
  const question = generateAdditionWithin10({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);

  assert.ok(options);
  assert.equal(options.length, 11);
  assert.deepEqual(options[0], { kind: 'numeric', value: 0 });
  assert.deepEqual(options[10], { kind: 'numeric', value: 10 });
});

test('fraction interaction consumes M3 semantic answerOptions exactly', () => {
  const question = generateUnitFraction({
    grade: 2,
    skillId: 'unit_fractions',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);

  assert.ok(options);
  assert.deepEqual(
    options,
    question.answerOptions.map((value) => ({
      kind: 'fraction',
      value,
    })),
  );
  assert.equal(
    options.some((answer) => evaluateLearnerAnswer(question, answer)),
    true,
  );
});

test('fraction answer comparison and display preserve numerator and denominator', () => {
  const answer = {
    kind: 'fraction' as const,
    value: { numerator: 1, denominator: 4 },
  };

  assert.equal(formatPracticeAnswerText(answer), '1/4');
  assert.equal(isSamePracticeAnswer(answer, answer), true);
  assert.equal(
    isSamePracticeAnswer(answer, {
      kind: 'fraction',
      value: { numerator: 1, denominator: 2 },
    }),
    false,
  );
});


test('time interaction consumes M3 semantic answerOptions exactly', () => {
  const question = generateTellTimeHourHalfHour({
    grade: 1,
    skillId: 'tell_time_hour_half_hour',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);

  assert.ok(options);
  assert.deepEqual(
    options,
    question.answerOptions.map((value) => ({
      kind: 'time',
      value,
    })),
  );
  assert.equal(
    options.some((answer) => evaluateLearnerAnswer(question, answer)),
    true,
  );
});

test('time answer comparison and display preserve hour and minute semantics', () => {
  const halfHour = {
    kind: 'time' as const,
    value: { hour: 3, minute: 30 as const },
  };
  const wholeHour = {
    kind: 'time' as const,
    value: { hour: 3, minute: 0 as const },
  };

  assert.equal(formatPracticeAnswerText(halfHour), '3:30');
  assert.equal(formatPracticeAnswerText(wholeHour), '3:00');
  assert.equal(isSamePracticeAnswer(halfHour, halfHour), true);
  assert.equal(isSamePracticeAnswer(halfHour, wholeHour), false);
});
