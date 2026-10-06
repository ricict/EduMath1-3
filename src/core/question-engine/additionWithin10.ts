import type { ArithmeticQuestion, Difficulty, QuestionGenerationContext } from '../types';
import { validateAdditionWithin10 } from '../validation/additionWithin10';
import type { QuestionGenerator } from './generator';
import { createNumericAnswerOptions, integerRangeInclusive } from './numericAnswerOptions';
import { createSeededRandom } from './seededRandom';

const MAX_SUM_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function generateAdditionWithin10(
  context: QuestionGenerationContext,
): ArithmeticQuestion {
  if (context.grade !== 1) {
    throw new Error('addition_within_10 is currently available only for Grade 1.');
  }
  if (context.skillId !== 'addition_within_10') {
    throw new Error('Generator context must request the addition_within_10 skill.');
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error('addition_within_10 supports only numeric-choice questions.');
  }
  if (context.representation && context.representation !== 'symbolic') {
    throw new Error('addition_within_10 currently generates only symbolic questions.');
  }

  const random = createSeededRandom(context.seed);
  const maxSum = MAX_SUM_BY_DIFFICULTY[context.difficulty];
  const sum = random.integer(1, maxSum);
  const a = random.integer(0, sum);
  const b = sum - a;
  const answerOptions = createNumericAnswerOptions(
    sum,
    integerRangeInclusive(0, maxSum),
    random,
  );

  return {
    id: `addition_within_10:${context.seed}:${a}:${b}`,
    grade: 1,
    domain: 'operations',
    topic: 'addition',
    skillId: 'addition_within_10',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'symbolic',
    promptKey: 'question.addition',
    data: {
      operation: 'addition',
      a,
      b,
    },
    answerOptions,
    expectedAnswer: sum,
  };
}

export const additionWithin10Generator: QuestionGenerator = {
  id: 'addition-within-10',
  supportedSkills: ['addition_within_10'],
  capability: 'addition',
  supportedGrades: [1],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['symbolic'],
  requiredConstraints: ['resultRange'],
  generate: generateAdditionWithin10,
  validate: validateAdditionWithin10,
};
