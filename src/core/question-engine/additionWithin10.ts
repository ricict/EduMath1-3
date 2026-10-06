import type { Difficulty, Question, QuestionGenerationContext } from '../types';
import { createSeededRandom } from './seededRandom';

const MAX_SUM_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function generateAdditionWithin10(context: QuestionGenerationContext): Question {
  if (context.grade !== 1) {
    throw new Error('addition_within_10 is currently available only for Grade 1.');
  }
  if (context.skillId !== 'addition_within_10') {
    throw new Error('Generator context must request the addition_within_10 skill.');
  }

  const random = createSeededRandom(context.seed);
  const maxSum = MAX_SUM_BY_DIFFICULTY[context.difficulty];
  const sum = random.integer(1, maxSum);
  const a = random.integer(0, sum);
  const b = sum - a;

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
    expectedAnswer: sum,
  };
}
