import type { AdditionConceptQuestion, Difficulty, Question } from '../types';
import { validateNumericAnswerOptions } from './numericAnswerOptions';
import type { QuestionValidationResult } from './types';

const MAX_TOTAL_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

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

  const conceptQuestion = question as AdditionConceptQuestion;
  const { a, b } = conceptQuestion.data;
  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    errors.push('Concept groups must contain integer quantities.');
  }
  if (a < 0 || b < 0) {
    errors.push('Concept groups must contain non-negative quantities.');
  }
  if (a + b > 10) {
    errors.push('Combined concept total must not exceed 10.');
  }
  if (conceptQuestion.expectedAnswer !== a + b) {
    errors.push('Expected answer must equal the combined group total.');
  }
  errors.push(
    ...validateNumericAnswerOptions(
      conceptQuestion.answerOptions,
      conceptQuestion.expectedAnswer,
      (value) =>
        value >= 0 &&
        value <= MAX_TOTAL_BY_DIFFICULTY[question.difficulty],
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
