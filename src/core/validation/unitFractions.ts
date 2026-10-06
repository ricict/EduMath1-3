import { canonicalSkills } from '../curriculum/canonicalSkills';
import type { Difficulty, Question, UnitFractionQuestion } from '../types';
import type { QuestionValidationResult } from './types';

const DENOMINATORS_BY_DIFFICULTY: Readonly<Record<Difficulty, readonly number[]>> = {
  1: [2, 4],
  2: [2, 3, 4, 5],
  3: [2, 3, 4, 5, 6, 8, 10],
};

export function validateUnitFractionQuestion(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 2 && question.grade !== 3) {
    errors.push('unit_fractions is available only for Grades 2 and 3.');
  }
  if (question.skillId !== 'unit_fractions') {
    errors.push('Question skill must be unit_fractions.');
  }
  if (question.data.operation !== 'unit-fraction') {
    errors.push('Question operation must be unit-fraction.');
    return { valid: false, errors };
  }

  const unitFractionQuestion = question as UnitFractionQuestion;

  const canonicalDenominators =
    canonicalSkills.unit_fractions.constraints?.allowedDenominators;

  if (!canonicalDenominators) {
    errors.push('Canonical unit_fractions allowedDenominators metadata is missing.');
    return { valid: false, errors };
  }

  const { denominator, numerator, shadedParts, totalParts } =
    unitFractionQuestion.data;

  if (numerator !== 1 || shadedParts !== 1) {
    errors.push('A unit fraction must represent exactly one selected equal part.');
  }
  if (!Number.isInteger(denominator) || denominator < 2) {
    errors.push('Unit-fraction denominator must be an integer >= 2.');
  }
  if (totalParts !== denominator) {
    errors.push('Visual total parts must equal the fraction denominator.');
  }
  if (!canonicalDenominators.includes(denominator)) {
    errors.push('Denominator is not allowed by the canonical unit_fractions skill.');
  }
  if (!DENOMINATORS_BY_DIFFICULTY[question.difficulty].includes(denominator)) {
    errors.push('Denominator is not enabled at this difficulty.');
  }

  if (
    unitFractionQuestion.answerOptions.length < 2 ||
    unitFractionQuestion.answerOptions.length > 4
  ) {
    errors.push('Unit-fraction answer options must contain between two and four choices.');
  }

  const optionKeys = unitFractionQuestion.answerOptions.map(
    (option) => `${option.numerator}/${option.denominator}`,
  );
  if (new Set(optionKeys).size !== optionKeys.length) {
    errors.push('Unit-fraction answer options must be unique.');
  }

  for (const option of unitFractionQuestion.answerOptions) {
    if (
      option.numerator !== 1 ||
      !canonicalDenominators.includes(option.denominator) ||
      !DENOMINATORS_BY_DIFFICULTY[question.difficulty].includes(
        option.denominator,
      )
    ) {
      errors.push(
        'Unit-fraction answer options must use canonical denominators enabled at the current difficulty.',
      );
      break;
    }
  }

  const correctOptionCount = unitFractionQuestion.answerOptions.filter(
    (option) =>
      option.numerator === 1 &&
      option.denominator === denominator,
  ).length;
  if (correctOptionCount !== 1) {
    errors.push('Unit-fraction answer options must contain the correct answer exactly once.');
  }

  if (
    typeof unitFractionQuestion.expectedAnswer !== 'object' ||
    unitFractionQuestion.expectedAnswer === null ||
    !('numerator' in unitFractionQuestion.expectedAnswer) ||
    !('denominator' in unitFractionQuestion.expectedAnswer)
  ) {
    errors.push('Unit-fraction expected answer must be a fraction value.');
  } else if (
    unitFractionQuestion.expectedAnswer.numerator !== 1 ||
    unitFractionQuestion.expectedAnswer.denominator !== denominator
  ) {
    errors.push('Expected fraction answer does not match the generated visual semantics.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
