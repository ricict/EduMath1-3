import type {
  DataDisplayRow,
  DataGroupLabel,
  Difficulty,
  QuestionGenerationContext,
  SimplePictogramQuestion,
} from '../types';
import { validatePictogramsSimple } from '../validation/pictogramsSimple';
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
  2: 7,
  3: 10,
};

export function generatePictogramsSimple(
  context: QuestionGenerationContext,
): SimplePictogramQuestion {
  if (context.grade !== 1 && context.grade !== 2) {
    throw new Error(
      'pictograms_simple is currently available only for Grades 1 and 2.',
    );
  }
  if (context.skillId !== 'pictograms_simple') {
    throw new Error(
      'Generator context must request the pictograms_simple skill.',
    );
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error('pictograms_simple supports only numeric-choice questions.');
  }
  if (context.representation && context.representation !== 'pictogram') {
    throw new Error(
      'pictograms_simple currently generates only pictogram questions.',
    );
  }

  const random = createSeededRandom(context.seed);
  random.next();

  const labels = GROUPS_BY_DIFFICULTY[context.difficulty];
  const maxCount = MAX_COUNT_BY_DIFFICULTY[context.difficulty];
  const rows: readonly DataDisplayRow[] = labels.map((label) => ({
    label,
    count: random.integer(1, maxCount),
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
    id: `pictograms_simple:${context.grade}:${context.seed}:${targetLabel}:${expectedAnswer}`,
    grade: context.grade,
    domain: 'data',
    topic: 'pictograms',
    skillId: 'pictograms_simple',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'pictogram',
    promptKey: 'question.readPictogram',
    data: {
      operation: 'read-pictogram',
      rows,
      targetLabel,
      symbolValue: 1,
    },
    answerOptions,
    expectedAnswer,
  };
}

export const pictogramsSimpleGenerator: QuestionGenerator = {
  id: 'pictograms-simple',
  supportedSkills: ['pictograms_simple'],
  capability: 'pictogram',
  supportedGrades: [1, 2],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['pictogram'],
  requiredConstraints: [],
  generate: generatePictogramsSimple,
  validate: validatePictogramsSimple,
};
