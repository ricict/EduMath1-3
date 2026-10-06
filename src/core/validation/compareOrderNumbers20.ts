import type {
  ComparisonRelation,
  Difficulty,
  NumberComparisonQuestion,
  Question,
} from '../types';
import type { QuestionValidationResult } from './types';

const MAX_VALUE_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 10,
  2: 15,
  3: 20,
};

function expectedRelation(left: number, right: number): ComparisonRelation {
  if (left < right) {
    return 'less-than';
  }
  if (left > right) {
    return 'greater-than';
  }
  return 'equal';
}

export function validateCompareOrderNumbers20(question: Question): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1) {
    errors.push('compare_order_numbers_20 is available only for Grade 1.');
  }
  if (question.skillId !== 'compare_order_numbers_20') {
    errors.push('Question skill must be compare_order_numbers_20.');
  }
  if (question.data.operation !== 'number-comparison') {
    errors.push('Question operation must be number-comparison.');
    return { valid: false, errors };
  }

  const comparisonQuestion = question as NumberComparisonQuestion;
  const { left, right, scaleMin, scaleMax } = comparisonQuestion.data;
  const maxValue = MAX_VALUE_BY_DIFFICULTY[question.difficulty];

  if (!Number.isInteger(left) || !Number.isInteger(right)) {
    errors.push('Compared values must be integers.');
  }
  if (left < 0 || right < 0 || left > 20 || right > 20) {
    errors.push('Compared values must remain within the canonical 0–20 range.');
  }
  if (left > maxValue || right > maxValue) {
    errors.push('Compared values exceed the configured difficulty cap.');
  }
  if (scaleMin !== 0 || scaleMax !== maxValue) {
    errors.push('Comparison scale must match the configured difficulty range.');
  }
  if (
    comparisonQuestion.representation !== 'symbolic' &&
    comparisonQuestion.representation !== 'number-line'
  ) {
    errors.push('Comparison representation must be symbolic or number-line.');
  }
  if (
    comparisonQuestion.expectedAnswer !== expectedRelation(left, right)
  ) {
    errors.push('Expected relation does not match the compared values.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
