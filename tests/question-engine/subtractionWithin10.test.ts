import assert from 'node:assert/strict';
import test from 'node:test';

import { generateSubtractionWithin10 } from '../../src/core/question-engine/subtractionWithin10';
import { generateQuestion, supportsQuestionGeneration } from '../../src/core/question-engine/registry';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(seed: number, difficulty: 1 | 2 | 3 = 3) {
  return generateSubtractionWithin10({
    grade: 1,
    skillId: 'subtraction_within_10',
    difficulty,
    seed,
  });
}

test('subtraction generator is deterministic and registered', () => {
  assert.deepEqual(generate(20261006), generate(20261006));
  assert.equal(supportsQuestionGeneration('subtraction_within_10'), true);
  assert.deepEqual(
    generateQuestion({
      grade: 1,
      skillId: 'subtraction_within_10',
      difficulty: 3,
      seed: 20261006,
    }),
    generate(20261006),
  );
});

test('subtraction questions preserve mathematical invariants across many seeds', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const question = generate(seed);
    const validation = validateQuestion(question);

    assert.equal(validation.valid, true, `seed ${seed}: ${validation.errors.join(', ')}`);
    assert.ok(question.data.a >= question.data.b);
    assert.ok(question.data.a <= 10);
    assert.equal(question.expectedAnswer, question.data.a - question.data.b);
    assert.ok(question.expectedAnswer >= 0);
  }
});

test('subtraction difficulty caps remain explicit', () => {
  const caps = { 1: 5, 2: 7, 3: 10 } as const;

  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 0; seed < 250; seed += 1) {
      assert.ok(generate(seed, difficulty).data.a <= caps[difficulty]);
    }
  }
});

test('subtraction semantic question renders independently in all locales', () => {
  const question = generate(20261006);

  assert.match(renderQuestionPrompt(question, 'en'), /^What is \d+ - \d+\?$/);
  assert.match(renderQuestionPrompt(question, 'id'), /^Berapakah \d+ - \d+\?$/);
  assert.match(renderQuestionPrompt(question, 'th'), /^\d+ - \d+ เท่ากับเท่าไร\?$/);
});
