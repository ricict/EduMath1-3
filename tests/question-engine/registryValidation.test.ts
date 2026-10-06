import assert from 'node:assert/strict';
import test from 'node:test';

import { additionWithin10Generator } from '../../src/core/question-engine/additionWithin10';
import type { QuestionGenerator } from '../../src/core/question-engine/generator';
import {
  registeredQuestionGeneratorValidation,
  registeredQuestionGenerators,
} from '../../src/core/question-engine/registry';
import { validateQuestionGeneratorRegistry } from '../../src/core/question-engine/registryValidation';

function cloneGenerator(
  generator: QuestionGenerator,
  overrides: Partial<QuestionGenerator>,
): QuestionGenerator {
  return {
    ...generator,
    ...overrides,
  };
}

test('registered M3 generator registry is valid', () => {
  assert.equal(
    registeredQuestionGeneratorValidation.valid,
    true,
    registeredQuestionGeneratorValidation.issues
      .map((issue) => issue.message)
      .join('\n'),
  );
  assert.equal(registeredQuestionGenerators.length, 8);
});

test('registry validator rejects duplicate generator IDs and skill ownership', () => {
  const duplicate = cloneGenerator(additionWithin10Generator, {});

  const result = validateQuestionGeneratorRegistry([
    additionWithin10Generator,
    duplicate,
  ]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'DUPLICATE_GENERATOR_ID'));
  assert.ok(
    result.issues.some((issue) => issue.code === 'DUPLICATE_SKILL_REGISTRATION'),
  );
});

test('registry validator rejects canonical capability drift', () => {
  const malformed = cloneGenerator(additionWithin10Generator, {
    capability: 'subtraction',
  });

  const result = validateQuestionGeneratorRegistry([malformed]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'CAPABILITY_MISMATCH'));
});

test('registry validator rejects non-canonical grade and representation declarations', () => {
  const malformed = cloneGenerator(additionWithin10Generator, {
    supportedGrades: [1, 2],
    supportedRepresentations: ['symbolic', 'money'],
  });

  const result = validateQuestionGeneratorRegistry([malformed]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'GRADE_NOT_CANONICAL'));
  assert.ok(
    result.issues.some((issue) => issue.code === 'REPRESENTATION_NOT_CANONICAL'),
  );
});

test('registry validator rejects missing required canonical constraints', () => {
  const malformed = cloneGenerator(additionWithin10Generator, {
    supportedSkills: ['compare_unit_fractions'],
    capability: 'fraction',
    supportedGrades: [3],
    supportedRepresentations: ['symbolic'],
    requiredConstraints: ['resultRange'],
  });

  const result = validateQuestionGeneratorRegistry([malformed]);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some((issue) => issue.code === 'MISSING_REQUIRED_CONSTRAINT'),
  );
});

test('registry validator rejects empty and duplicate descriptor metadata', () => {
  const malformed = cloneGenerator(additionWithin10Generator, {
    supportedDifficulties: [],
    supportedQuestionTypes: ['numeric-choice', 'numeric-choice'],
  });

  const result = validateQuestionGeneratorRegistry([malformed]);

  assert.equal(result.valid, false);
  assert.ok(
    result.issues.some((issue) => issue.code === 'EMPTY_SUPPORTED_DIFFICULTIES'),
  );
  assert.ok(
    result.issues.some((issue) => issue.code === 'DUPLICATE_METADATA_VALUE'),
  );
});
