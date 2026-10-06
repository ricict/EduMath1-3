import type {
  DataDisplayRow,
  DataGroupLabel,
  Difficulty,
  QuestionGenerationContext,
  UnitBarChartQuestion,
} from '../types';
import { validateBarChartsUnitScale } from '../validation/barChartsUnitScale';
import type { QuestionGenerator } from './generator';
import {
  createNumericAnswerOptions,
  integerRangeInclusive,
} from './numericAnswerOptions';
import { createSeededRandom } from './seededRandom';

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

export function generateBarChartsUnitScale(
  context: QuestionGenerationContext,
): UnitBarChartQuestion {
  if (context.grade !== 3) {
    throw new Error(
      'bar_charts_unit_scale is currently available only for Grade 3.',
    );
  }
  if (context.skillId !== 'bar_charts_unit_scale') {
    throw new Error(
      'Generator context must request the bar_charts_unit_scale skill.',
    );
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error(
      'bar_charts_unit_scale supports only numeric-choice questions.',
    );
  }
  if (context.representation && context.representation !== 'bar-chart') {
    throw new Error(
      'bar_charts_unit_scale currently generates only bar-chart questions.',
    );
  }

  const random = createSeededRandom(context.seed);
  random.next();

  const labels = GROUPS_BY_DIFFICULTY[context.difficulty];
  const maxCount = MAX_COUNT_BY_DIFFICULTY[context.difficulty];
  const rows: readonly DataDisplayRow[] = labels.map((label) => ({
    label,
    count: random.integer(0, maxCount),
  }));
  const targetLabel = labels[random.integer(0, labels.length - 1)];
  const expectedAnswer =
    rows.find((row) => row.label === targetLabel)?.count ?? 0;
  const answerOptions = createNumericAnswerOptions(
    expectedAnswer,
    integerRangeInclusive(0, maxCount),
    random,
  );

  return {
    id: `bar_charts_unit_scale:${context.seed}:${targetLabel}:${expectedAnswer}`,
    grade: 3,
    domain: 'data',
    topic: 'bar-charts',
    skillId: 'bar_charts_unit_scale',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'bar-chart',
    promptKey: 'question.readBarChart',
    data: {
      operation: 'read-unit-bar-chart',
      rows,
      targetLabel,
      scaleUnit: 1,
    },
    answerOptions,
    expectedAnswer,
  };
}

export const barChartsUnitScaleGenerator: QuestionGenerator = {
  id: 'bar-charts-unit-scale',
  supportedSkills: ['bar_charts_unit_scale'],
  capability: 'bar-chart',
  supportedGrades: [3],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['bar-chart'],
  requiredConstraints: [],
  generate: generateBarChartsUnitScale,
  validate: validateBarChartsUnitScale,
};
