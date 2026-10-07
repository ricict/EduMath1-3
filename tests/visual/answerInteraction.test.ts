import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAdditionWithin10 } from '../../src/core/question-engine/additionWithin10';
import { generateCompareOrderNumbers20 } from '../../src/core/question-engine/compareOrderNumbers20';
import { generateIdentify2DShapes } from '../../src/core/question-engine/identify2dShapes';
import { generateMultiplicationFacts2510 } from '../../src/core/question-engine/multiplicationFacts2510';
import { generateNumberRecognition10 } from '../../src/core/question-engine/numberRecognition10';
import { generateTellTimeHourHalfHour } from '../../src/core/question-engine/tellTimeHourHalfHour';
import { generateUnitFraction } from '../../src/core/question-engine/unitFractions';
import { evaluateLearnerAnswer } from '../../src/core/session/session';
import { translateNumberWord } from '../../src/localization';
import {
  formatPracticeAnswerText,
  getCorrectPracticeAnswer,
  getPracticeAnswerOptions,
  isSamePracticeAnswer,
} from '../../src/features/practice/answerInteraction';

test('numeric interaction consumes M3 semantic answerOptions exactly', () => {
  const question = generateAdditionWithin10({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);

  assert.ok(options);
  assert.deepEqual(
    options,
    question.answerOptions.map((value) => ({
      kind: 'numeric',
      value,
    })),
  );
  assert.equal(
    options.filter((answer) => evaluateLearnerAnswer(question, answer)).length,
    1,
  );
});

test('number-recognition options render as localized number words without changing numeric semantics', () => {
  const question = generateNumberRecognition10({
    grade: 1,
    skillId: 'number_recognition_10',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);
  assert.ok(options);

  const expectedEnglish = new Map([
    [0, 'ZERO'],
    [1, 'ONE'],
    [2, 'TWO'],
    [3, 'THREE'],
    [4, 'FOUR'],
    [5, 'FIVE'],
    [6, 'SIX'],
    [7, 'SEVEN'],
    [8, 'EIGHT'],
    [9, 'NINE'],
    [10, 'TEN'],
  ]);

  for (const option of options) {
    assert.equal(option.kind, 'numeric');
    if (option.kind !== 'numeric') {
      throw new Error('Expected numeric number-recognition option.');
    }

    assert.equal(
      formatPracticeAnswerText(option, 'en', question),
      expectedEnglish.get(option.value),
    );
  }

  assert.equal(
    options.filter((option) => evaluateLearnerAnswer(question, option)).length,
    1,
  );
});

test('numeric interaction supports multiplication answers above ten without UI range logic', () => {
  let question = generateMultiplicationFacts2510({
    grade: 2,
    skillId: 'multiplication_facts_2_5_10',
    difficulty: 3,
    seed: 0,
  });

  for (let seed = 1; seed < 512 && question.expectedAnswer <= 10; seed += 1) {
    question = generateMultiplicationFacts2510({
      grade: 2,
      skillId: 'multiplication_facts_2_5_10',
      difficulty: 3,
      seed,
    });
  }

  assert.ok(question.expectedAnswer > 10);

  const options = getPracticeAnswerOptions(question);
  assert.ok(options);
  assert.deepEqual(
    options,
    question.answerOptions.map((value) => ({
      kind: 'numeric',
      value,
    })),
  );
  assert.equal(
    options.filter((answer) => evaluateLearnerAnswer(question, answer)).length,
    1,
  );
  assert.equal(
    formatPracticeAnswerText(options[0], 'en', question),
    options[0].kind === 'numeric' ? String(options[0].value) : '',
  );
});

test('relation interaction exposes the complete typed comparison domain', () => {
  const question = generateCompareOrderNumbers20({
    grade: 1,
    skillId: 'compare_order_numbers_20',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);

  assert.deepEqual(options, [
    { kind: 'relation', value: 'less-than' },
    { kind: 'relation', value: 'equal' },
    { kind: 'relation', value: 'greater-than' },
  ]);
  assert.equal(
    options?.filter((answer) => evaluateLearnerAnswer(question, answer)).length,
    1,
  );
});

test('relation answer display maps semantic relations to mathematical symbols', () => {
  const less = { kind: 'relation' as const, value: 'less-than' as const };
  const equal = { kind: 'relation' as const, value: 'equal' as const };
  const greater = { kind: 'relation' as const, value: 'greater-than' as const };

  assert.equal(formatPracticeAnswerText(less), '<');
  assert.equal(formatPracticeAnswerText(equal), '=');
  assert.equal(formatPracticeAnswerText(greater), '>');
  assert.equal(isSamePracticeAnswer(less, less), true);
  assert.equal(isSamePracticeAnswer(less, greater), false);
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

test('shape interaction consumes M3 semantic answerOptions and localizes names', () => {
  const question = generateIdentify2DShapes({
    grade: 1,
    skillId: 'identify_2d_shapes',
    difficulty: 3,
    seed: 20261006,
  });
  const options = getPracticeAnswerOptions(question);

  assert.ok(options);
  assert.deepEqual(
    options,
    question.answerOptions.map((value) => ({
      kind: 'shape',
      value,
    })),
  );
  assert.equal(
    options.filter((answer) => evaluateLearnerAnswer(question, answer)).length,
    1,
  );

  const circle = { kind: 'shape' as const, value: 'circle' as const };
  assert.equal(formatPracticeAnswerText(circle, 'en'), 'Circle');
  assert.equal(formatPracticeAnswerText(circle, 'id'), 'Lingkaran');
  assert.equal(formatPracticeAnswerText(circle, 'th'), 'วงกลม');
  assert.equal(isSamePracticeAnswer(circle, circle), true);
  assert.equal(
    isSamePracticeAnswer(circle, {
      kind: 'shape',
      value: 'triangle',
    }),
    false,
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


test('correct-answer reveal preserves typed semantics and localized display', () => {
  const question = generateNumberRecognition10({
    grade: 1,
    skillId: 'number_recognition_10',
    difficulty: 3,
    seed: 20261006,
  });
  const correct = getCorrectPracticeAnswer(question);

  assert.equal(correct.kind, 'numeric');
  assert.equal(
    formatPracticeAnswerText(correct, 'id', question),
    translateNumberWord('id', question.expectedAnswer),
  );
  assert.equal(evaluateLearnerAnswer(question, correct), true);
});
