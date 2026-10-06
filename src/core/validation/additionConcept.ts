import type { Question } from '../types';
import type { QuestionValidationResult } from './types';

export function validateAdditionConcept(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1) {
    errors.push('addition_concept must remain in Grade 1.');
  }
  if (question.skillId !== 'addition_concept') {
    errors.push('Question skill must be addition_concept.');
  }
  if (question.data.operation !== 'addition-combine') {
    errors.push('Question operation must be addition-combine.');
    return { valid: false, errors };
  }

  const { a, b } = question.data;
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    errors.push('Concept groups must contain integer quantities.');
  }
  if (a < 0 || b < 0) {
    errors.push('Concept groups must contain non-negative quantities.');
  }
  if (a + b > 10) {
    errors.push('Combined concept total must not exceed 10.');
  }
  if (question.expectedAnswer !== a + b) {
    errors.push('Expected answer must equal the combined group total.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
