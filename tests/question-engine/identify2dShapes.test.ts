import assert from 'node:assert/strict';
import test from 'node:test';

import {
  generateQuestion,
  getQuestionGenerator,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { generateIdentify2DShapes } from '../../src/core/question-engine/identify2dShapes';
import type { Difficulty, Shape2D } from '../../src/core/types';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

const EXPECTED_BY_DIFFICULTY: Readonly<
  Record<Difficulty, readonly Shape2D[]>
> = {
  1: ['circle', 'triangle'],
  2: ['circle', 'triangle', 'square'],
  3: ['circle', 'triangle', 'square', 'rectangle'],
};

function generate(
  seed: number,
  grade: 1 | 2 = 1,
  difficulty: Difficulty = 3,
) {
  return generateIdentify2DShapes({
    grade,
    skillId: 'identify_2d_shapes',
    difficulty,
    seed,
  });
}

test('2D shape generator declares the canonical Grade 1-2 visual shape contract', () => {
  const generator = getQuestionGenerator('identify_2d_shapes');

  assert.deepEqual(generator.supportedGrades, [1, 2]);
  assert.deepEqual(generator.supportedQuestionTypes, ['shape-choice']);
  assert.deepEqual(generator.supportedRepresentations, ['visual']);
  assert.deepEqual(generator.requiredConstraints, []);
  assert.equal(generator.capability, 'shape');
  assert.equal(
    supportsQuestionGeneration('identify_2d_shapes', 'shape-choice', 'visual'),
    true,
  );
});

test('2D shape generator is deterministic and dispatches for both supported grades', () => {
  assert.deepEqual(generate(20261006, 1), generate(20261006, 1));
  assert.deepEqual(generate(20261006, 2), generate(20261006, 2));

  for (const grade of [1, 2] as const) {
    assert.deepEqual(
      generateQuestion({
        grade,
        skillId: 'identify_2d_shapes',
        difficulty: 3,
        seed: 20261006,
      }),
      generate(20261006, grade),
    );
  }
});

test('2D shape questions satisfy semantic and answer-option invariants across many seeds', () => {
  for (const grade of [1, 2] as const) {
    for (const difficulty of [1, 2, 3] as const) {
      const permitted = EXPECTED_BY_DIFFICULTY[difficulty];

      for (let seed = 0; seed < 1000; seed += 1) {
        const question = generate(seed, grade, difficulty);
        const validation = validateQuestion(question);

        assert.equal(
          validation.valid,
          true,
          `grade ${grade}, difficulty ${difficulty}, seed ${seed}: ${validation.errors.join(', ')}`,
        );
        assert.ok(permitted.includes(question.data.shape));
        assert.equal(question.expectedAnswer, question.data.shape);
        assert.equal(question.answerOptions.length, permitted.length);
        assert.equal(
          new Set(question.answerOptions).size,
          question.answerOptions.length,
        );
        assert.ok(
          question.answerOptions.every((shape) => permitted.includes(shape)),
        );
        assert.equal(
          question.answerOptions.filter(
            (shape) => shape === question.expectedAnswer,
          ).length,
          1,
        );
      }
    }
  }
});

test('difficulty expands the visible semantic shape domain progressively', () => {
  for (const difficulty of [1, 2, 3] as const) {
    const seen = new Set<Shape2D>();

    for (let seed = 0; seed < 1000; seed += 1) {
      seen.add(generate(seed, 1, difficulty).data.shape);
    }

    assert.deepEqual(
      [...seen].sort(),
      [...EXPECTED_BY_DIFFICULTY[difficulty]].sort(),
    );
  }
});

test('2D shape generator rejects non-canonical grade and unsupported concrete rendering', () => {
  assert.throws(
    () =>
      generateQuestion({
        grade: 3,
        skillId: 'identify_2d_shapes',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 3/,
  );

  assert.throws(
    () =>
      generateQuestion({
        grade: 1,
        skillId: 'identify_2d_shapes',
        difficulty: 1,
        seed: 1,
        representation: 'concrete',
      }),
    /does not support representation concrete/,
  );
});

test('shape prompt stays localization-only while semantic shape is unchanged', () => {
  const question = generate(20261006, 1, 3);

  assert.equal(renderQuestionPrompt(question, 'en'), 'What shape is shown?');
  assert.equal(renderQuestionPrompt(question, 'id'), 'Bentuk apa yang ditunjukkan?');
  assert.equal(renderQuestionPrompt(question, 'th'), 'รูปทรงที่แสดงคือรูปอะไร?');
});
