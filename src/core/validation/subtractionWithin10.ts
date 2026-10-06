import type { AddSubtractQuestion, Difficulty, Question } from '../types';
import { validateNumericAnswerOptions } from './numericAnswerOptions';
import type { QuestionValidationResult } from './types';

const MAX_MINUEND_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function validateSubtractionWithin10(question: Question): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1) {
    errors.push('subtraction_within_10 is available only for Grade 1.');
  }
  if (question.skillId !== 'subtraction_within_10') {
    errors.push('Question skill must be subtraction_within_10.');
  }
  if (question.data.operation !== 'subtraction') {
    errors.push('Question operation must be subtraction.');
    return { valid: false, errors };
  }

  const subtractionQuestion = question as AddSubtractQuestion;
  const { a, b } = subtractionQuestion.data;
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    errors.push('Operands must be integers.');
  }
  if (a < 0 || b < 0) {
    errors.push('Operands must be non-negative.');
  }
  if (b > a) {
    errors.push('Subtrahend must not exceed the minuend.');
  }
  if (a > 10) {
    errors.push('The minuend must not exceed 10.');
  }
  if (subtractionQuestion.expectedAnswer !== a - b) {
    errors.push('Expected answer must equal a - b.');
  }
  errors.push(
    ...validateNumericAnswerOptions(
      subtractionQuestion.answerOptions,
      subtractionQuestion.expectedAnswer,
      (value) =>
        value >= 0 &&
        value <= MAX_MINUEND_BY_DIFFICULTY[question.difficulty],
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
