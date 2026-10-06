import type {
  ComparisonRelation,
  Difficulty,
  NumberComparisonQuestion,
  QuestionGenerationContext,
} from '../types';
import { validateCompareOrderNumbers20 } from '../validation/compareOrderNumbers20';
import type { QuestionGenerator } from './generator';
import { createSeededRandom } from './seededRandom';

const MAX_VALUE_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 10,
  2: 15,
  3: 20,
};

function relationFor(left: number, right: number): ComparisonRelation {
  if (left < right) {
    return 'less-than';
  }
  if (left > right) {
    return 'greater-than';
  }
  return 'equal';
}

export function generateCompareOrderNumbers20(
  context: QuestionGenerationContext,
): NumberComparisonQuestion {
  if (context.grade !== 1) {
    throw new Error('compare_order_numbers_20 is currently available only for Grade 1.');
  }
  if (context.skillId !== 'compare_order_numbers_20') {
    throw new Error('Generator context must request the compare_order_numbers_20 skill.');
  }
  if (context.questionType && context.questionType !== 'relation-choice') {
    throw new Error('compare_order_numbers_20 supports only relation-choice questions.');
  }
  if (
    context.representation &&
    context.representation !== 'symbolic' &&
    context.representation !== 'number-line'
  ) {
    throw new Error(
      'compare_order_numbers_20 supports symbolic or number-line questions.',
    );
  }

  const representation = context.representation ?? 'symbolic';
  const random = createSeededRandom(context.seed);
  const maxValue = MAX_VALUE_BY_DIFFICULTY[context.difficulty];
  const left = random.integer(0, maxValue);
  const right = random.integer(0, maxValue);

  return {
    id:
      representation === 'symbolic'
        ? `compare_order_numbers_20:${context.seed}:${left}:${right}`
        : `compare_order_numbers_20:${context.seed}:${left}:${right}:number-line`,
    grade: 1,
    domain: 'number',
    topic: 'comparison',
    skillId: 'compare_order_numbers_20',
    difficulty: context.difficulty,
    questionType: 'relation-choice',
    representation,
    promptKey: 'question.numberComparison',
    data: {
      operation: 'number-comparison',
      left,
      right,
      scaleMin: 0,
      scaleMax: maxValue,
    },
    expectedAnswer: relationFor(left, right),
  };
}

export const compareOrderNumbers20Generator: QuestionGenerator = {
  id: 'compare-order-numbers-20',
  supportedSkills: ['compare_order_numbers_20'],
  capability: 'number-comparison',
  supportedGrades: [1],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['relation-choice'],
  supportedRepresentations: ['symbolic', 'number-line'],
  requiredConstraints: ['valueRange'],
  generate: generateCompareOrderNumbers20,
  validate: validateCompareOrderNumbers20,
};
