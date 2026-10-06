import { canonicalSkills } from '../curriculum/canonicalSkills';
import type {
  Difficulty,
  FractionAnswer,
  QuestionGenerationContext,
  UnitFractionQuestion,
} from '../types';
import { validateUnitFractionQuestion } from '../validation/unitFractions';
import type { QuestionGenerator } from './generator';
import { createSeededRandom, type SeededRandom } from './seededRandom';

const DENOMINATORS_BY_DIFFICULTY: Readonly<Record<Difficulty, readonly number[]>> = {
  1: [2, 4],
  2: [2, 3, 4, 5],
  3: [2, 3, 4, 5, 6, 8, 10],
};

function getCanonicalDenominators(): readonly number[] {
  const denominators =
    canonicalSkills.unit_fractions.constraints?.allowedDenominators;

  if (!denominators) {
    throw new Error(
      'unit_fractions requires canonical allowedDenominators metadata.',
    );
  }

  return denominators;
}

function shuffleDenominators(
  values: readonly number[],
  random: SeededRandom,
): number[] {
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

function createFractionAnswerOptions(
  permittedDenominators: readonly number[],
  correctDenominator: number,
  random: SeededRandom,
): readonly FractionAnswer[] {
  const alternatives = shuffleDenominators(
    permittedDenominators.filter(
      (denominator) => denominator !== correctDenominator,
    ),
    random,
  ).slice(0, 3);

  return shuffleDenominators(
    [correctDenominator, ...alternatives],
    random,
  ).map((denominator) => ({
    numerator: 1,
    denominator,
  }));
}

export function generateUnitFraction(
  context: QuestionGenerationContext,
): UnitFractionQuestion {
  if (context.grade !== 2 && context.grade !== 3) {
    throw new Error('unit_fractions is currently available only for Grades 2 and 3.');
  }
  if (context.skillId !== 'unit_fractions') {
    throw new Error('Generator context must request the unit_fractions skill.');
  }
  if (context.questionType && context.questionType !== 'fraction-choice') {
    throw new Error('unit_fractions supports only fraction-choice questions.');
  }
  if (context.representation && context.representation !== 'visual') {
    throw new Error('unit_fractions currently generates only visual questions.');
  }

  const canonicalDenominators = getCanonicalDenominators();
  const permittedDenominators = DENOMINATORS_BY_DIFFICULTY[
    context.difficulty
  ].filter((denominator) => canonicalDenominators.includes(denominator));

  if (permittedDenominators.length === 0) {
    throw new Error(
      'No canonical unit-fraction denominators are available at this difficulty.',
    );
  }

  const random = createSeededRandom(context.seed);
  random.next();
  const denominator =
    permittedDenominators[
      random.integer(0, permittedDenominators.length - 1)
    ];
  const answerOptions = createFractionAnswerOptions(
    permittedDenominators,
    denominator,
    random,
  );

  return {
    id: `unit_fractions:${context.grade}:${context.seed}:1:${denominator}`,
    grade: context.grade,
    domain: 'number',
    topic: 'fractions',
    skillId: 'unit_fractions',
    difficulty: context.difficulty,
    questionType: 'fraction-choice',
    representation: 'visual',
    promptKey: 'question.unitFraction',
    data: {
      operation: 'unit-fraction',
      shadedParts: 1,
      totalParts: denominator,
      numerator: 1,
      denominator,
    },
    answerOptions,
    expectedAnswer: {
      numerator: 1,
      denominator,
    },
  };
}

export const unitFractionsGenerator: QuestionGenerator = {
  id: 'unit-fractions',
  supportedSkills: ['unit_fractions'],
  capability: 'fraction',
  supportedGrades: [2, 3],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['fraction-choice'],
  supportedRepresentations: ['visual'],
  requiredConstraints: ['allowedDenominators'],
  generate: generateUnitFraction,
  validate: validateUnitFractionQuestion,
};
