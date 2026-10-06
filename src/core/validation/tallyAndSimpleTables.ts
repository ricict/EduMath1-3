import type {
  DataGroupLabel,
  Difficulty,
  Question,
  SimpleTallyTableQuestion,
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

export function validateTallyAndSimpleTables(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1 && question.grade !== 2) {
    errors.push('tally_and_simple_tables is available only for Grades 1 and 2.');
  }
  if (question.skillId !== 'tally_and_simple_tables') {
    errors.push('Question skill must be tally_and_simple_tables.');
  }
  if (question.questionType !== 'numeric-choice') {
    errors.push('Tally-table question type must be numeric-choice.');
  }
  if (question.representation !== 'table') {
    errors.push('Tally-table questions must use the table representation.');
  }
  if (question.data.operation !== 'read-tally-table') {
    errors.push('Question operation must be read-tally-table.');
    return { valid: false, errors };
  }

  const tableQuestion = question as SimpleTallyTableQuestion;
  const expectedLabels = GROUPS_BY_DIFFICULTY[question.difficulty];
  const maxCount = MAX_COUNT_BY_DIFFICULTY[question.difficulty];

  if (tableQuestion.data.rows.length !== expectedLabels.length) {
    errors.push('Tally table must contain the configured number of groups.');
  }
  if (
    tableQuestion.data.rows.some(
      (row, index) => row.label !== expectedLabels[index],
    )
  ) {
    errors.push('Tally-table group labels must follow the configured domain.');
  }
  if (
    tableQuestion.data.rows.some(
      (row) =>
        !Number.isInteger(row.count) || row.count < 1 || row.count > maxCount,
    )
  ) {
    errors.push('Tally-table counts are outside the configured difficulty range.');
  }

  const targetRow = tableQuestion.data.rows.find(
    (row) => row.label === tableQuestion.data.targetLabel,
  );
  if (!targetRow) {
    errors.push('Tally-table target group must exist exactly in the displayed rows.');
  } else if (tableQuestion.expectedAnswer !== targetRow.count) {
    errors.push('Expected answer must match the target tally-table count.');
  }

  errors.push(
    ...validateNumericAnswerOptions(
      tableQuestion.answerOptions,
      tableQuestion.expectedAnswer,
      (value) => value >= 0 && value <= maxCount,
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
