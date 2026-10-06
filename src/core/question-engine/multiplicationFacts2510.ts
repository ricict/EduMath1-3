import type {
  Difficulty,
  MultiplicationFactFamily,
  MultiplicationQuestion,
  QuestionGenerationContext,
} from '../types';
import { validateMultiplicationFacts2510 } from '../validation/multiplicationFacts2510';
import type { QuestionGenerator } from './generator';
import { createSeededRandom } from './seededRandom';

const FACT_FAMILIES_BY_DIFFICULTY: Readonly<
  Record<Difficulty, readonly MultiplicationFactFamily[]>
> = {
  1: [2],
  2: [2, 5],
  3: [2, 5, 10],
};

export function generateMultiplicationFacts2510(
  context: QuestionGenerationContext,
): MultiplicationQuestion {
  if (context.grade !== 2 && context.grade !== 3) {
    throw new Error('multiplication_facts_2_5_10 is available only for Grades 2 and 3.');
  }
  if (context.skillId !== 'multiplication_facts_2_5_10') {
    throw new Error(
      'Generator context must request the multiplication_facts_2_5_10 skill.',
    );
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error('multiplication_facts_2_5_10 supports only numeric-choice questions.');
  }
  if (context.representation && context.representation !== 'symbolic') {
    throw new Error(
      'multiplication_facts_2_5_10 currently generates only symbolic questions.',
    );
  }

  const random = createSeededRandom(context.seed);
  const factFamilies = FACT_FAMILIES_BY_DIFFICULTY[context.difficulty];
  const multiplier = random.integer(0, 10);
  const factFamily = factFamilies[random.integer(0, factFamilies.length - 1)];
  const familyFirst = random.next() < 0.5;
  const a = familyFirst ? factFamily : multiplier;
  const b = familyFirst ? multiplier : factFamily;

  return {
    id: `multiplication_facts_2_5_10:${context.grade}:${context.seed}:${a}:${b}`,
    grade: context.grade,
    domain: 'operations',
    topic: 'multiplication',
    skillId: 'multiplication_facts_2_5_10',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'symbolic',
    promptKey: 'question.multiplication',
    data: {
      operation: 'multiplication',
      a,
      b,
      factFamily,
    },
    expectedAnswer: a * b,
  };
}

export const multiplicationFacts2510Generator: QuestionGenerator = {
  id: 'multiplication-facts-2-5-10',
  supportedSkills: ['multiplication_facts_2_5_10'],
  capability: 'multiplication',
  supportedGrades: [2, 3],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['symbolic'],
  requiredConstraints: ['resultRange'],
  generate: generateMultiplicationFacts2510,
  validate: validateMultiplicationFacts2510,
};
