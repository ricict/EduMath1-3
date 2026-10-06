import type { Question } from '../types';
import { getQuestionGenerator } from '../question-engine/registry';
import type { QuestionValidationResult } from './types';

export type { QuestionValidationResult } from './types';

export function validateQuestion(question: Question): QuestionValidationResult {
  try {
    return getQuestionGenerator(question.skillId).validate(question);
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Question validation failed.'],
    };
  }
}
