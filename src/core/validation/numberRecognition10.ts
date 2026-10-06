import type { Question } from '../types';
import type { QuestionValidationResult } from './types';

export function validateNumberRecognition10(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1) {
    errors.push('number_recognition_10 must remain in Grade 1.');
  }
  if (question.skillId !== 'number_recognition_10') {
    errors.push('Question skill must be number_recognition_10.');
  }
  if (question.data.operation !== 'number-recognition') {
    errors.push('Question operation must be number-recognition.');
    return { valid: false, errors };
  }

  const { target } = question.data;
  if (!Number.isInteger(target)) {
    errors.push('Recognized number must be an integer.');
  }
  if (target < 0 || target > 10) {
    errors.push('Recognized number must remain within 0 to 10.');
  }
  if (question.expectedAnswer !== target) {
    errors.push('Expected answer must equal the displayed target number.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
