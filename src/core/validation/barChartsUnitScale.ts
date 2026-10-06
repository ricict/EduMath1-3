import type {
  DataGroupLabel,
  Difficulty,
  Question,
  UnitBarChartQuestion,
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
  2: 8,
  3: 10,
};

export function validateBarChartsUnitScale(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 3) {
    errors.push('bar_charts_unit_scale is available only for Grade 3.');
  }
  if (question.skillId !== 'bar_charts_unit_scale') {
    errors.push('Question skill must be bar_charts_unit_scale.');
  }
  if (question.questionType !== 'numeric-choice') {
    errors.push('Bar-chart question type must be numeric-choice.');
  }
  if (question.representation !== 'bar-chart') {
    errors.push('Bar-chart questions must use the bar-chart representation.');
  }
  if (question.data.operation !== 'read-unit-bar-chart') {
    errors.push('Question operation must be read-unit-bar-chart.');
    return { valid: false, errors };
  }

  const chartQuestion = question as UnitBarChartQuestion;
  const expectedLabels = GROUPS_BY_DIFFICULTY[question.difficulty];
  const maxCount = MAX_COUNT_BY_DIFFICULTY[question.difficulty];

  if (chartQuestion.data.scaleUnit !== 1) {
    errors.push('Unit-scale bar charts must use a scale unit of exactly one.');
  }
  if (chartQuestion.data.rows.length !== expectedLabels.length) {
    errors.push('Bar chart must contain the configured number of groups.');
  }
  if (
    chartQuestion.data.rows.some(
      (row, index) => row.label !== expectedLabels[index],
    )
  ) {
    errors.push('Bar-chart group labels must follow the configured domain.');
  }
  if (
    chartQuestion.data.rows.some(
      (row) =>
        !Number.isInteger(row.count) || row.count < 0 || row.count > maxCount,
    )
  ) {
    errors.push('Bar-chart counts are outside the configured difficulty range.');
  }

  const targetRow = chartQuestion.data.rows.find(
    (row) => row.label === chartQuestion.data.targetLabel,
  );
  if (!targetRow) {
    errors.push('Bar-chart target group must exist exactly in the displayed rows.');
  } else if (chartQuestion.expectedAnswer !== targetRow.count) {
    errors.push('Expected answer must match the target bar-chart count.');
  }

  errors.push(
    ...validateNumericAnswerOptions(
      chartQuestion.answerOptions,
      chartQuestion.expectedAnswer,
      (value) => value >= 0 && value <= maxCount,
    ),
  );

  return {
    valid: errors.length === 0,
    errors,
  };
}
