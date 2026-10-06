import assert from 'node:assert/strict';
import test from 'node:test';

import { generateCompareOrderNumbers20 } from '../../src/core/question-engine/compareOrderNumbers20';
import { generateQuestion, supportsQuestionGeneration } from '../../src/core/question-engine/registry';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(seed: number, difficulty: 1 | 2 | 3 = 3) {
  return generateCompareOrderNumbers20({
    grade: 1,
    skillId: 'compare_order_numbers_20',
    difficulty,
    seed,
  });
}

test('number comparison generator is deterministic and registered', () => {
  assert.deepEqual(generate(20261006), generate(20261006));
  assert.equal(
    supportsQuestionGeneration('compare_order_numbers_20', 'relation-choice', 'symbolic'),
    true,
  );
  assert.deepEqual(
    generateQuestion({
      grade: 1,
      skillId: 'compare_order_numbers_20',
      difficulty: 3,
      seed: 20261006,
    }),
    generate(20261006),
  );
});

test('number comparison preserves value and answer invariants across many seeds', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const question = generate(seed);
    const validation = validateQuestion(question);

    assert.equal(validation.valid, true, `seed ${seed}: ${validation.errors.join(', ')}`);
    assert.ok(question.data.left >= 0 && question.data.left <= 20);
    assert.ok(question.data.right >= 0 && question.data.right <= 20);

    const expected =
      question.data.left < question.data.right
        ? 'less-than'
        : question.data.left > question.data.right
          ? 'greater-than'
          : 'equal';
    assert.equal(question.expectedAnswer, expected);
  }
});

test('number comparison difficulty caps remain explicit', () => {
  const caps = { 1: 10, 2: 15, 3: 20 } as const;

  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 0; seed < 250; seed += 1) {
      const question = generate(seed, difficulty);
      assert.ok(question.data.left <= caps[difficulty]);
      assert.ok(question.data.right <= caps[difficulty]);
    }
  }
});

test('number comparison renders semantic prompts independently in all locales', () => {
  const question = generate(20261006);

  assert.match(renderQuestionPrompt(question, 'en'), /^Compare \d+ and \d+\. Choose <, =, or >\.$/);
  assert.match(renderQuestionPrompt(question, 'id'), /^Bandingkan \d+ dan \d+\. Pilih <, =, atau >\.$/);
  assert.match(renderQuestionPrompt(question, 'th'), /^เปรียบเทียบ \d+ และ \d+ เลือก <, = หรือ >$/);
});
