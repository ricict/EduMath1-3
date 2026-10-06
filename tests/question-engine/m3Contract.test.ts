import assert from 'node:assert/strict';
import test from 'node:test';

import {
  generateQuestion,
  registeredQuestionGenerators,
  registeredQuestionGeneratorValidation,
} from '../../src/core/question-engine/registry';
import { validateQuestion } from '../../src/core/validation/validateQuestion';

test('M3 registry collectively covers Grades 1-3 and representative generation modes', () => {
  const grades = new Set(registeredQuestionGenerators.flatMap((generator) => generator.supportedGrades));
  const capabilities = new Set(
    registeredQuestionGenerators.map((generator) => generator.capability),
  );
  const questionTypes = new Set(
    registeredQuestionGenerators.flatMap((generator) => generator.supportedQuestionTypes),
  );
  const representations = new Set(
    registeredQuestionGenerators.flatMap((generator) => generator.supportedRepresentations),
  );

  assert.deepEqual([...grades].sort(), [1, 2, 3]);
  assert.deepEqual(
    [...capabilities].sort(),
    [
      'addition',
      'fraction',
      'multiplication',
      'number-comparison',
      'number-identification',
      'shape',
      'subtraction',
      'time',
    ],
  );
  assert.deepEqual(
    [...questionTypes].sort(),
    ['fraction-choice', 'numeric-choice', 'relation-choice', 'shape-choice', 'time-choice'],
  );
  assert.deepEqual(
    [...representations].sort(),
    ['clock', 'number-line', 'symbolic', 'visual'],
  );
});

test('every registered generator passes a deterministic grade-difficulty-seed matrix through dispatch and validation', () => {
  assert.equal(
    registeredQuestionGeneratorValidation.valid,
    true,
    registeredQuestionGeneratorValidation.issues.map((issue) => issue.message).join('\n'),
  );

  for (const generator of registeredQuestionGenerators) {
    for (const skillId of generator.supportedSkills) {
      for (const grade of generator.supportedGrades) {
        for (const difficulty of generator.supportedDifficulties) {
          for (let seed = 0; seed < 128; seed += 1) {
            const context = {
              grade,
              skillId,
              difficulty,
              seed,
            } as const;

            const first = generateQuestion(context);
            const second = generateQuestion(context);
            const validation = validateQuestion(first);

            assert.deepEqual(
              first,
              second,
              `${generator.id} must be deterministic for grade ${grade}, difficulty ${difficulty}, seed ${seed}`,
            );
            assert.equal(
              validation.valid,
              true,
              `${generator.id}, grade ${grade}, difficulty ${difficulty}, seed ${seed}: ${validation.errors.join(', ')}`,
            );
            assert.equal(first.skillId, skillId);
            assert.equal(first.grade, grade);
            assert.equal(first.difficulty, difficulty);
            assert.ok(generator.supportedQuestionTypes.includes(first.questionType));
            assert.ok(generator.supportedRepresentations.includes(first.representation));
          }
        }
      }
    }
  }
});

test('M1 locked deterministic addition reference remains unchanged at M3 completion candidate', () => {
  const question = generateQuestion({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: 20261006,
  });

  assert.equal(question.data.operation, 'addition');
  if (question.data.operation !== 'addition') {
    throw new Error('Expected locked M1 addition semantics.');
  }

  assert.equal(question.data.a, 4);
  assert.equal(question.data.b, 1);
  assert.equal(question.expectedAnswer, 5);
});
