import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAdditionConcept } from '../../src/core/question-engine/additionConcept';
import { generateAdditionWithin10 } from '../../src/core/question-engine/additionWithin10';
import { generateMultiplicationFacts2510 } from '../../src/core/question-engine/multiplicationFacts2510';
import { generateNumberRecognition10 } from '../../src/core/question-engine/numberRecognition10';
import { generateSubtractionWithin10 } from '../../src/core/question-engine/subtractionWithin10';

test('all numeric-choice generators emit four deterministic unique choices containing the correct answer', () => {
  const questions = [
    generateNumberRecognition10({
      grade: 1,
      skillId: 'number_recognition_10',
      difficulty: 3,
      seed: 20261006,
    }),
    generateAdditionConcept({
      grade: 1,
      skillId: 'addition_concept',
      difficulty: 3,
      seed: 20261006,
    }),
    generateAdditionWithin10({
      grade: 1,
      skillId: 'addition_within_10',
      difficulty: 3,
      seed: 20261006,
    }),
    generateSubtractionWithin10({
      grade: 1,
      skillId: 'subtraction_within_10',
      difficulty: 3,
      seed: 20261006,
    }),
    generateMultiplicationFacts2510({
      grade: 2,
      skillId: 'multiplication_facts_2_5_10',
      difficulty: 3,
      seed: 20261006,
    }),
  ];

  for (const question of questions) {
    assert.equal(question.answerOptions.length, 4);
    assert.equal(new Set(question.answerOptions).size, 4);
    assert.equal(
      question.answerOptions.filter(
        (value) => value === question.expectedAnswer,
      ).length,
      1,
    );
  }
});

test('adding numeric answer choices does not change the locked M1 addition mathematics', () => {
  const question = generateAdditionWithin10({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: 20261006,
  });

  assert.equal(question.data.operation, 'addition');
  assert.equal(question.data.a, 4);
  assert.equal(question.data.b, 1);
  assert.equal(question.expectedAnswer, 5);
  assert.ok(question.answerOptions.includes(5));
});

test('multiplication choices stay inside the generated fact family', () => {
  for (let seed = 0; seed < 256; seed += 1) {
    const question = generateMultiplicationFacts2510({
      grade: 2,
      skillId: 'multiplication_facts_2_5_10',
      difficulty: 3,
      seed,
    });

    assert.ok(
      question.answerOptions.every(
        (value) =>
          value >= 0 &&
          value <= question.data.factFamily * 10 &&
          value % question.data.factFamily === 0,
      ),
    );
  }
});
