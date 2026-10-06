import type {
  AdditionConceptQuestion,
  Difficulty,
  QuestionGenerationContext,
} from '../types';
import { validateAdditionConcept } from '../validation/additionConcept';
import type { QuestionGenerator } from './generator';
import { createSeededRandom } from './seededRandom';

const MAX_TOTAL_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function generateAdditionConcept(
  context: QuestionGenerationContext,
): AdditionConceptQuestion {
  if (context.grade !== 1) {
    throw new Error('addition_concept is currently available only for Grade 1.');
  }
  if (context.skillId !== 'addition_concept') {
    throw new Error('Generator context must request the addition_concept skill.');
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error('addition_concept supports only numeric-choice questions.');
  }
  if (context.representation && context.representation !== 'visual') {
    throw new Error('addition_concept currently generates only visual questions.');
  }

  const random = createSeededRandom(context.seed);
  const total = random.integer(1, MAX_TOTAL_BY_DIFFICULTY[context.difficulty]);
  const a = random.integer(0, total);
  const b = total - a;

  return {
    id: `addition_concept:${context.seed}:${a}:${b}`,
    grade: 1,
    domain: 'operations',
    topic: 'addition',
    skillId: 'addition_concept',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'visual',
    promptKey: 'question.additionConcept',
    data: {
      operation: 'addition-combine',
      a,
      b,
    },
    expectedAnswer: total,
  };
}

export const additionConceptGenerator: QuestionGenerator = {
  id: 'addition-concept',
  supportedSkills: ['addition_concept'],
  capability: 'addition',
  supportedGrades: [1],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['visual'],
  requiredConstraints: ['resultRange'],
  generate: generateAdditionConcept,
  validate: validateAdditionConcept,
};
