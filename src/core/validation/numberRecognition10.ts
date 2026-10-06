import type { Difficulty, NumberRecognitionQuestion, Question } from '../types';
import { validateNumericAnswerOptions } from './numericAnswerOptions';
import type { QuestionValidationResult } from './types';

const MAX_NUMBER_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

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

  const numberQuestion = question as NumberRecognitionQuestion;
  const { target } = numberQuestion.data;
  if (!Number.isInteger(target)) {
    errors.push('Recognized number must be an integer.');
  }
  if (target < 0 || target > 10) {
    errors.push('Recognized number must remain within 0 to 10.');
  }
  if (numberQuestion.expectedAnswer !== target) {
    errors.push('Expected answer must equal the displayed target number.');
  }
  errors.push(
    ...validateNumericAnswerOptions(
      numberQuestion.answerOptions,
      numberQuestion.expectedAnswer,
      (value) =>
        value >= 0 &&
        value <= MAX_NUMBER_BY_DIFFICULTY[question.difficulty],
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
