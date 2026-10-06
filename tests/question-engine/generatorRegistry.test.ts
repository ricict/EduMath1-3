import assert from 'node:assert/strict';
import test from 'node:test';

import { canonicalSkills } from '../../src/core/curriculum/canonicalSkills';
import { generateQuestion, getQuestionGenerator, supportsQuestionGeneration } from '../../src/core/question-engine/registry';

test('registry exposes an explicit typed contract for addition_within_10', () => {
  const generator = getQuestionGenerator('addition_within_10');

  assert.deepEqual(generator.supportedSkills, ['addition_within_10']);
  assert.deepEqual(generator.supportedGrades, [1]);
  assert.deepEqual(generator.supportedDifficulties, [1, 2, 3]);
  assert.deepEqual(generator.supportedQuestionTypes, ['numeric-choice']);
  assert.deepEqual(generator.supportedRepresentations, ['symbolic']);
  assert.deepEqual(generator.requiredConstraints, ['resultRange']);
  assert.equal(generator.capability, canonicalSkills.addition_within_10.generatorCapability);
});

test('registry dispatch preserves the M1 deterministic reference case', () => {
  const question = generateQuestion({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: 20261006,
  });

  if (question.data.operation !== 'addition') {
    throw new Error('Expected the addition_within_10 generator to return addition semantics.');
  }

  assert.equal(question.data.a, 4);
  assert.equal(question.data.b, 1);
  assert.equal(question.expectedAnswer, 5);
});

test('registry rejects skills without an implemented generator', () => {
  assert.equal(supportsQuestionGeneration('division_facts_2_5_10'), false);
  assert.throws(
    () =>
      generateQuestion({
        grade: 2,
        skillId: 'division_facts_2_5_10',
        difficulty: 1,
        seed: 1,
      }),
    /Unsupported question-generation skill/,
  );
});

test('registry enforces canonical grade applicability before generation', () => {
  assert.throws(
    () =>
      generateQuestion({
        grade: 2,
        skillId: 'addition_within_10',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 2/,
  );
});

test('registry enforces requested representation compatibility', () => {
  assert.equal(supportsQuestionGeneration('addition_within_10', 'numeric-choice', 'symbolic'), true);
  assert.equal(supportsQuestionGeneration('addition_within_10', 'numeric-choice', 'visual'), false);

  assert.throws(
    () =>
      generateQuestion({
        grade: 1,
        skillId: 'addition_within_10',
        difficulty: 1,
        seed: 1,
        representation: 'visual',
      }),
    /does not support representation visual/,
  );
});
