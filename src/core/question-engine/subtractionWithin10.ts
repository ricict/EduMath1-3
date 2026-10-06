import type { ArithmeticQuestion, Difficulty, QuestionGenerationContext } from '../types';
import { validateSubtractionWithin10 } from '../validation/subtractionWithin10';
import type { QuestionGenerator } from './generator';
import { createSeededRandom } from './seededRandom';

const MAX_MINUEND_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function generateSubtractionWithin10(
  context: QuestionGenerationContext,
): ArithmeticQuestion {
  if (context.grade !== 1) {
    throw new Error('subtraction_within_10 is currently available only for Grade 1.');
  }
  if (context.skillId !== 'subtraction_within_10') {
    throw new Error('Generator context must request the subtraction_within_10 skill.');
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error('subtraction_within_10 supports only numeric-choice questions.');
  }
  if (context.representation && context.representation !== 'symbolic') {
    throw new Error('subtraction_within_10 currently generates only symbolic questions.');
  }

  const random = createSeededRandom(context.seed);
  const maxMinuend = MAX_MINUEND_BY_DIFFICULTY[context.difficulty];
  const a = random.integer(1, maxMinuend);
  const b = random.integer(0, a);

  return {
    id: `subtraction_within_10:${context.seed}:${a}:${b}`,
    grade: 1,
    domain: 'operations',
    topic: 'subtraction',
    skillId: 'subtraction_within_10',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'symbolic',
    promptKey: 'question.subtraction',
    data: {
      operation: 'subtraction',
      a,
      b,
    },
    expectedAnswer: a - b,
  };
}

export const subtractionWithin10Generator: QuestionGenerator = {
  id: 'subtraction-within-10',
  supportedSkills: ['subtraction_within_10'],
  capability: 'subtraction',
  supportedGrades: [1],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['symbolic'],
  requiredConstraints: ['resultRange'],
  generate: generateSubtractionWithin10,
  validate: validateSubtractionWithin10,
};
