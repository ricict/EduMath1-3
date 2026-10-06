import assert from 'node:assert/strict';
import test from 'node:test';

import { canonicalSkills } from '../../src/core/curriculum/canonicalSkills';
import { generateAdditionWithin10 } from '../../src/core/question-engine/additionWithin10';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(seed: number, difficulty: 1 | 2 | 3 = 3) {
  return generateAdditionWithin10({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty,
    seed,
  });
}

test('same seed reproduces the same question', () => {
  assert.deepEqual(generate(20261006), generate(20261006));
});

test('generated questions satisfy Grade 1 addition-within-10 invariants', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const question = generate(seed);
    const validation = validateQuestion(question);

    assert.equal(validation.valid, true, `seed ${seed}: ${validation.errors.join(', ')}`);
    assert.equal(question.expectedAnswer, question.data.a + question.data.b);
    assert.ok(question.data.a >= 0);
    assert.ok(question.data.b >= 0);
    assert.ok(question.expectedAnswer <= 10);
  }
});

test('difficulty caps remain explicit and grade-appropriate', () => {
  const caps = { 1: 5, 2: 7, 3: 10 } as const;

  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 0; seed < 250; seed += 1) {
      assert.ok(generate(seed, difficulty).expectedAnswer <= caps[difficulty]);
    }
  }
});

test('canonical skill proof preserves prerequisite order', () => {
  assert.deepEqual(canonicalSkills.number_recognition_10.prerequisites, []);
  assert.deepEqual(canonicalSkills.addition_concept.prerequisites, ['number_recognition_10']);
  assert.deepEqual(canonicalSkills.addition_within_10.prerequisites, ['addition_concept']);
});

test('question semantics render independently in all M1 locales', () => {
  const question = generate(20261006);

  assert.match(renderQuestionPrompt(question, 'en'), /^What is \d+ \+ \d+\?$/);
  assert.match(renderQuestionPrompt(question, 'id'), /^Berapakah \d+ \+ \d+\?$/);
  assert.match(renderQuestionPrompt(question, 'th'), /^\d+ \+ \d+ เท่ากับเท่าไร\?$/);
});
