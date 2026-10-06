import assert from 'node:assert/strict';
import test from 'node:test';

import { generateMultiplicationFacts2510 } from '../../src/core/question-engine/multiplicationFacts2510';
import {
  generateQuestion,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(
  seed: number,
  grade: 2 | 3 = 2,
  difficulty: 1 | 2 | 3 = 3,
) {
  return generateMultiplicationFacts2510({
    grade,
    skillId: 'multiplication_facts_2_5_10',
    difficulty,
    seed,
  });
}

test('multiplication facts generator is deterministic and registered for Grades 2 and 3', () => {
  assert.deepEqual(generate(20261006, 2), generate(20261006, 2));
  assert.deepEqual(generate(20261006, 3), generate(20261006, 3));
  assert.equal(
    supportsQuestionGeneration('multiplication_facts_2_5_10', 'numeric-choice', 'symbolic'),
    true,
  );

  for (const grade of [2, 3] as const) {
    assert.deepEqual(
      generateQuestion({
        grade,
        skillId: 'multiplication_facts_2_5_10',
        difficulty: 3,
        seed: 20261006,
      }),
      generate(20261006, grade),
    );
  }
});

test('multiplication facts preserve mathematical invariants across many seeds and both grades', () => {
  for (const grade of [2, 3] as const) {
    for (let seed = 0; seed < 1000; seed += 1) {
      const question = generate(seed, grade);
      const validation = validateQuestion(question);

      assert.equal(
        validation.valid,
        true,
        `grade ${grade}, seed ${seed}: ${validation.errors.join(', ')}`,
      );
      assert.ok([2, 5, 10].includes(question.data.factFamily));
      assert.ok(
        question.data.a === question.data.factFamily ||
          question.data.b === question.data.factFamily,
      );
      assert.ok(question.data.a >= 0 && question.data.a <= 10);
      assert.ok(question.data.b >= 0 && question.data.b <= 10);
      assert.equal(question.expectedAnswer, question.data.a * question.data.b);
      assert.ok(question.expectedAnswer <= 100);
    }
  }
});

test('multiplication difficulty progressively enables 2, 5, and 10 fact families', () => {
  const allowed = {
    1: [2],
    2: [2, 5],
    3: [2, 5, 10],
  } as const;

  for (const difficulty of [1, 2, 3] as const) {
    const observed = new Set<number>();

    for (let seed = 0; seed < 500; seed += 1) {
      const question = generate(seed, 2, difficulty);
      observed.add(question.data.factFamily);
      assert.ok(allowed[difficulty].includes(question.data.factFamily as never));
    }

    for (const family of allowed[difficulty]) {
      assert.ok(observed.has(family), `difficulty ${difficulty} should produce family ${family}`);
    }
  }
});

test('multiplication rejects Grade 1 and unsupported presentation requests', () => {
  assert.throws(
    () =>
      generateQuestion({
        grade: 1,
        skillId: 'multiplication_facts_2_5_10',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 1/,
  );

  assert.throws(
    () =>
      generateQuestion({
        grade: 2,
        skillId: 'multiplication_facts_2_5_10',
        difficulty: 1,
        seed: 1,
        representation: 'visual',
      }),
    /does not support representation visual/,
  );
});

test('multiplication semantic question renders independently in all locales', () => {
  const question = generate(20261006, 2, 3);

  assert.match(renderQuestionPrompt(question, 'en'), /^What is \d+ × \d+\?$/);
  assert.match(renderQuestionPrompt(question, 'id'), /^Berapakah \d+ × \d+\?$/);
  assert.match(renderQuestionPrompt(question, 'th'), /^\d+ × \d+ เท่ากับเท่าไร\?$/);
});
