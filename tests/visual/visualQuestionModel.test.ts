import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAdditionConcept } from '../../src/core/question-engine/additionConcept';
import { generateNumberRecognition10 } from '../../src/core/question-engine/numberRecognition10';
import type { Question } from '../../src/core/types';
import { buildVisualQuestionModel } from '../../src/features/practice/visual/visualQuestionModel';
import { translate } from '../../src/localization';

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
    expectedAnswer: 5,
  };

  assert.equal(buildVisualQuestionModel(question), null);
});

test('future visual families are not silently treated as supported', () => {
  const question: Question = {
    id: 'unit-fraction-visual',
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
    expectedAnswer: {
      numerator: 1,
      denominator: 2,
    },
  };

  assert.equal(buildVisualQuestionModel(question), null);
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
});
