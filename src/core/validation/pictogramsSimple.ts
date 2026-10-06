import type {
  DataGroupLabel,
  Difficulty,
  Question,
  SimplePictogramQuestion,
} from '../types';
import type { QuestionValidationResult } from './types';
import { validateNumericAnswerOptions } from './numericAnswerOptions';

const GROUPS_BY_DIFFICULTY: Readonly<
  Record<Difficulty, readonly DataGroupLabel[]>
> = {
  1: ['A', 'B'],
  2: ['A', 'B', 'C'],
  3: ['A', 'B', 'C'],
};

const MAX_COUNT_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function validatePictogramsSimple(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1 && question.grade !== 2) {
    errors.push('pictograms_simple is available only for Grades 1 and 2.');
  }
  if (question.skillId !== 'pictograms_simple') {
    errors.push('Question skill must be pictograms_simple.');
  }
  if (question.questionType !== 'numeric-choice') {
    errors.push('Pictogram question type must be numeric-choice.');
  }
  if (question.representation !== 'pictogram') {
    errors.push('Pictogram questions must use the pictogram representation.');
  }
  if (question.data.operation !== 'read-pictogram') {
    errors.push('Question operation must be read-pictogram.');
    return { valid: false, errors };
  }

  const pictogramQuestion = question as SimplePictogramQuestion;
  const expectedLabels = GROUPS_BY_DIFFICULTY[question.difficulty];
  const maxCount = MAX_COUNT_BY_DIFFICULTY[question.difficulty];

  if (pictogramQuestion.data.symbolValue !== 1) {
    errors.push('Simple pictogram symbols must each represent exactly one item.');
  }
  if (pictogramQuestion.data.rows.length !== expectedLabels.length) {
    errors.push('Pictogram must contain the configured number of groups.');
  }
  if (
    pictogramQuestion.data.rows.some(
      (row, index) => row.label !== expectedLabels[index],
    )
  ) {
    errors.push('Pictogram group labels must follow the configured domain.');
  }
  if (
    pictogramQuestion.data.rows.some(
      (row) =>
        !Number.isInteger(row.count) || row.count < 1 || row.count > maxCount,
    )
  ) {
    errors.push('Pictogram counts are outside the configured difficulty range.');
  }

  const targetRow = pictogramQuestion.data.rows.find(
    (row) => row.label === pictogramQuestion.data.targetLabel,
  );
  if (!targetRow) {
    errors.push('Pictogram target group must exist exactly in the displayed rows.');
  } else if (pictogramQuestion.expectedAnswer !== targetRow.count) {
    errors.push('Expected answer must match the target pictogram count.');
  }

  errors.push(
    ...validateNumericAnswerOptions(
      pictogramQuestion.answerOptions,
      pictogramQuestion.expectedAnswer,
      (value) => value >= 0 && value <= maxCount,
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
