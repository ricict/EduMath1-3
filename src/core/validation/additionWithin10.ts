import type { Question } from '../types';
import type { QuestionValidationResult } from './types';

export function validateAdditionWithin10(question: Question): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1) {
    errors.push('addition_within_10 must remain in Grade 1 for the M1 vertical slice.');
  }
  if (question.skillId !== 'addition_within_10') {
    errors.push('Question skill must be addition_within_10.');
  }
  if (question.data.operation !== 'addition') {
    errors.push('Question operation must be addition.');
    return { valid: false, errors };
  }

  const { a, b } = question.data;
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    errors.push('Operands must be integers.');
  }
  if (a < 0 || b < 0) {
    errors.push('Operands must be non-negative.');
  }
  if (a + b > 10) {
    errors.push('The result must not exceed 10.');
  }
  if (question.expectedAnswer !== a + b) {
    errors.push('Expected answer must equal a + b.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
