import type {
  Difficulty,
  MultiplicationFactFamily,
  Question,
} from '../types';
import type { QuestionValidationResult } from './types';

const FACT_FAMILIES_BY_DIFFICULTY: Readonly<
  Record<Difficulty, readonly MultiplicationFactFamily[]>
> = {
  1: [2],
  2: [2, 5],
  3: [2, 5, 10],
};

export function validateMultiplicationFacts2510(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 2 && question.grade !== 3) {
    errors.push('multiplication_facts_2_5_10 is available only for Grades 2 and 3.');
  }
  if (question.skillId !== 'multiplication_facts_2_5_10') {
    errors.push('Question skill must be multiplication_facts_2_5_10.');
  }
  if (question.data.operation !== 'multiplication') {
    errors.push('Question operation must be multiplication.');
    return { valid: false, errors };
  }

  const { a, b, factFamily } = question.data;
  const allowedFamilies = FACT_FAMILIES_BY_DIFFICULTY[question.difficulty];

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    errors.push('Multiplication factors must be integers.');
  }
  if (a < 0 || b < 0 || a > 10 || b > 10) {
    errors.push('Multiplication factors must remain within 0–10.');
  }
  if (!allowedFamilies.includes(factFamily)) {
    errors.push('Fact family is not enabled at this difficulty.');
  }
  if (a !== factFamily && b !== factFamily) {
    errors.push('One factor must match the declared 2, 5, or 10 fact family.');
  }
  if (question.expectedAnswer !== a * b) {
    errors.push('Expected answer must equal a × b.');
  }
  if (question.expectedAnswer < 0 || question.expectedAnswer > 100) {
    errors.push('Multiplication result must remain within the canonical 0–100 range.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
