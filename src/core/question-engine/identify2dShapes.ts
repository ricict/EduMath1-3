import type {
  Difficulty,
  Identify2DShapeQuestion,
  QuestionGenerationContext,
  Shape2D,
} from '../types';
import { validateIdentify2DShapes } from '../validation/identify2dShapes';
import type { QuestionGenerator } from './generator';
import { createSeededRandom, type SeededRandom } from './seededRandom';

const SHAPES_BY_DIFFICULTY: Readonly<
  Record<Difficulty, readonly Shape2D[]>
> = {
  1: ['circle', 'triangle'],
  2: ['circle', 'triangle', 'square'],
  3: ['circle', 'triangle', 'square', 'rectangle'],
};

function shuffleShapes(
  values: readonly Shape2D[],
  random: SeededRandom,
): Shape2D[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = random.integer(0, index);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function generateIdentify2DShapes(
  context: QuestionGenerationContext,
): Identify2DShapeQuestion {
  if (context.grade !== 1 && context.grade !== 2) {
    throw new Error(
      'identify_2d_shapes is currently available only for Grades 1 and 2.',
    );
  }
  if (context.skillId !== 'identify_2d_shapes') {
    throw new Error(
      'Generator context must request the identify_2d_shapes skill.',
    );
  }
  if (context.questionType && context.questionType !== 'shape-choice') {
    throw new Error('identify_2d_shapes supports only shape-choice questions.');
  }
  if (context.representation && context.representation !== 'visual') {
    throw new Error(
      'identify_2d_shapes currently generates only visual questions.',
    );
  }

  const random = createSeededRandom(context.seed);
  random.next();

  const permittedShapes = SHAPES_BY_DIFFICULTY[context.difficulty];
  const shape =
    permittedShapes[random.integer(0, permittedShapes.length - 1)];
  const answerOptions = shuffleShapes(permittedShapes, random);

  return {
    id: `identify_2d_shapes:${context.grade}:${context.seed}:${shape}`,
    grade: context.grade,
    domain: 'geometry',
    topic: '2d-shapes',
    skillId: 'identify_2d_shapes',
    difficulty: context.difficulty,
    questionType: 'shape-choice',
    representation: 'visual',
    promptKey: 'question.identify2dShape',
    data: {
      operation: 'identify-2d-shape',
      shape,
    },
    answerOptions,
    expectedAnswer: shape,
  };
}

export const identify2DShapesGenerator: QuestionGenerator = {
  id: 'identify-2d-shapes',
  supportedSkills: ['identify_2d_shapes'],
  capability: 'shape',
  supportedGrades: [1, 2],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['shape-choice'],
  supportedRepresentations: ['visual'],
  requiredConstraints: [],
  generate: generateIdentify2DShapes,
  validate: validateIdentify2DShapes,
};
