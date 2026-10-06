import assert from 'node:assert/strict';
import test from 'node:test';

import { generateAdditionConcept } from '../../src/core/question-engine/additionConcept';
import {
  generateQuestion,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(seed: number, difficulty: 1 | 2 | 3 = 3) {
  return generateAdditionConcept({
    grade: 1,
    skillId: 'addition_concept',
    difficulty,
    seed,
  });
}

test('addition concept generator is deterministic and registered', () => {
  assert.deepEqual(generate(20261006), generate(20261006));
  assert.equal(supportsQuestionGeneration('addition_concept'), true);
  assert.deepEqual(
    generateQuestion({
      grade: 1,
      skillId: 'addition_concept',
      difficulty: 3,
      seed: 20261006,
    }),
    generate(20261006),
  );
});

test('addition concept questions model combining two non-negative groups', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const question = generate(seed);
    const validation = validateQuestion(question);

    assert.equal(validation.valid, true, `seed ${seed}: ${validation.errors.join(', ')}`);
    assert.ok(question.data.a >= 0);
    assert.ok(question.data.b >= 0);
    assert.equal(question.expectedAnswer, question.data.a + question.data.b);
    assert.ok(question.expectedAnswer <= 10);
    assert.equal(question.representation, 'visual');
  }
});

test('addition concept difficulty caps are explicit', () => {
  const caps = { 1: 5, 2: 7, 3: 10 } as const;

  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 0; seed < 250; seed += 1) {
      assert.ok(generate(seed, difficulty).expectedAnswer <= caps[difficulty]);
    }
  }
});

test('addition concept semantics render independently in all locales', () => {
  const question = generate(20261006);

  assert.match(
    renderQuestionPrompt(question, 'en'),
    /^There are \d+ objects and \d+ more objects\. How many are there altogether\?$/,
  );
  assert.match(
    renderQuestionPrompt(question, 'id'),
    /^Ada \d+ benda dan ditambah \d+ benda lagi\. Berapa jumlah semuanya\?$/,
  );
  assert.match(
    renderQuestionPrompt(question, 'th'),
    /^มีสิ่งของ \d+ ชิ้น และเพิ่มอีก \d+ ชิ้น รวมทั้งหมดมีกี่ชิ้น\?$/,
  );
});
