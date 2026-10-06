import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAdditionConcept } from '../../src/core/question-engine/additionConcept';
import { generateCompareOrderNumbers20 } from '../../src/core/question-engine/compareOrderNumbers20';
import { generateIdentify2DShapes } from '../../src/core/question-engine/identify2dShapes';
import { generateNumberRecognition10 } from '../../src/core/question-engine/numberRecognition10';
import { generateTellTimeHourHalfHour } from '../../src/core/question-engine/tellTimeHourHalfHour';
import { generateUnitFraction } from '../../src/core/question-engine/unitFractions';
import type { Question } from '../../src/core/types';
import {
  buildVisualQuestionModel,
  getClockHandDegrees,
} from '../../src/features/practice/visual/visualQuestionModel';
import { translate, translateShapeName } from '../../src/localization';

test('number-recognition visual model consumes the generated semantic target exactly', () => {
  const question = generateNumberRecognition10({
    grade: 1,
    skillId: 'number_recognition_10',
    difficulty: 3,
    seed: 20261006,
  });

  assert.deepEqual(buildVisualQuestionModel(question), {
    kind: 'number-recognition',
    questionId: question.id,
    target: question.data.target,
  });
});

test('addition-combine visual model preserves the two semantic groups without computing the answer', () => {
  const question = generateAdditionConcept({
    grade: 1,
    skillId: 'addition_concept',
    difficulty: 3,
    seed: 20261006,
  });

  const model = buildVisualQuestionModel(question);

  assert.deepEqual(model, {
    kind: 'addition-combine',
    questionId: question.id,
    groups: [
      { position: 'first', count: question.data.a },
      { position: 'second', count: question.data.b },
    ],
  });
  assert.equal(model === null ? true : 'expectedAnswer' in model, false);
});

test('symbolic questions remain outside the first M6 visual slice', () => {
  const question: Question = {
    id: 'symbolic-addition',
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
  };

  assert.equal(buildVisualQuestionModel(question), null);
});

test('unit-fraction visual model preserves equal-part semantics exactly', () => {
  const question = generateUnitFraction({
    grade: 2,
    skillId: 'unit_fractions',
    difficulty: 3,
    seed: 20261006,
  });

  assert.deepEqual(buildVisualQuestionModel(question), {
    kind: 'unit-fraction',
    questionId: question.id,
    numerator: question.data.numerator,
    denominator: question.data.denominator,
    shadedParts: question.data.shadedParts,
    totalParts: question.data.totalParts,
  });
});

test('clock visual model preserves generated time semantics and derives only display geometry', () => {
  const question = generateTellTimeHourHalfHour({
    grade: 1,
    skillId: 'tell_time_hour_half_hour',
    difficulty: 3,
    seed: 20261006,
  });

  assert.deepEqual(buildVisualQuestionModel(question), {
    kind: 'read-clock',
    questionId: question.id,
    hour: question.data.hour,
    minute: question.data.minute,
    ...getClockHandDegrees(question.data.hour, question.data.minute),
  });
});

test('clock hand geometry places hour hand between numerals at the half-hour', () => {
  assert.deepEqual(getClockHandDegrees(3, 0), {
    hourHandDegrees: 90,
    minuteHandDegrees: 0,
  });
  assert.deepEqual(getClockHandDegrees(3, 30), {
    hourHandDegrees: 105,
    minuteHandDegrees: 180,
  });
  assert.deepEqual(getClockHandDegrees(12, 0), {
    hourHandDegrees: 0,
    minuteHandDegrees: 0,
  });
});

test('number-line comparison visual model consumes explicit scale semantics', () => {
  const question = generateCompareOrderNumbers20({
    grade: 1,
    skillId: 'compare_order_numbers_20',
    difficulty: 3,
    seed: 20261006,
    representation: 'number-line',
  });

  assert.deepEqual(buildVisualQuestionModel(question), {
    kind: 'number-line-comparison',
    questionId: question.id,
    left: question.data.left,
    right: question.data.right,
    scaleMin: question.data.scaleMin,
    scaleMax: question.data.scaleMax,
  });

  const symbolic = generateCompareOrderNumbers20({
    grade: 1,
    skillId: 'compare_order_numbers_20',
    difficulty: 3,
    seed: 20261006,
  });
  assert.equal(buildVisualQuestionModel(symbolic), null);
});

test('2D-shape visual model preserves the generated semantic shape exactly', () => {
  const question = generateIdentify2DShapes({
    grade: 1,
    skillId: 'identify_2d_shapes',
    difficulty: 3,
    seed: 20261006,
  });

  assert.deepEqual(buildVisualQuestionModel(question), {
    kind: 'identify-2d-shape',
    questionId: question.id,
    shape: question.data.shape,
  });
});

test('visual accessibility wording stays localized while semantic values stay unchanged', () => {
  assert.equal(
    translate('en', 'visual.numberRecognitionLabel', { target: 7 }),
    'Shown number: 7',
  );
  assert.equal(
    translate('id', 'visual.additionFirstGroupLabel', { count: 3 }),
    'Kelompok pertama: 3 benda',
  );
  assert.equal(
    translate('th', 'visual.additionSecondGroupLabel', { count: 4 }),
    'กลุ่มที่สองมีสิ่งของ 4 ชิ้น',
  );
  assert.equal(
    translate('en', 'visual.unitFractionLabel', { shaded: 1, total: 4 }),
    '1 of 4 equal parts is shaded',
  );
  assert.equal(
    translate('id', 'visual.clockLabel', { hour: 3, minute: '30' }),
    'Jam analog menunjukkan pukul 3:30',
  );
  assert.equal(
    translate('en', 'visual.numberLineComparisonLabel', {
      min: 0,
      max: 20,
      left: 7,
      right: 12,
    }),
    'Number line from 0 to 20. Compare 7 and 12.',
  );
  assert.equal(translateShapeName('en', 'rectangle'), 'Rectangle');
  assert.equal(translateShapeName('id', 'rectangle'), 'Persegi panjang');
  assert.equal(translateShapeName('th', 'rectangle'), 'สี่เหลี่ยมผืนผ้า');
  assert.equal(
    translate('id', 'visual.shapeLabel', {
      shape: translateShapeName('id', 'circle'),
    }),
    'Bentuk yang ditampilkan: Lingkaran',
  );
});
