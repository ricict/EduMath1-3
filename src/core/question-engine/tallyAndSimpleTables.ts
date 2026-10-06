import type {
  DataDisplayRow,
  DataGroupLabel,
  Difficulty,
  QuestionGenerationContext,
  SimpleTallyTableQuestion,
} from '../types';
import { validateTallyAndSimpleTables } from '../validation/tallyAndSimpleTables';
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

export function generateTallyAndSimpleTables(
  context: QuestionGenerationContext,
): SimpleTallyTableQuestion {
  if (context.grade !== 1 && context.grade !== 2) {
    throw new Error(
      'tally_and_simple_tables is currently available only for Grades 1 and 2.',
    );
  }
  if (context.skillId !== 'tally_and_simple_tables') {
    throw new Error(
      'Generator context must request the tally_and_simple_tables skill.',
    );
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error(
      'tally_and_simple_tables supports only numeric-choice questions.',
    );
  }
  if (context.representation && context.representation !== 'table') {
    throw new Error(
      'tally_and_simple_tables currently generates only table questions.',
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
    id: `tally_and_simple_tables:${context.grade}:${context.seed}:${targetLabel}:${expectedAnswer}`,
    grade: context.grade,
    domain: 'data',
    topic: 'tables',
    skillId: 'tally_and_simple_tables',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'table',
    promptKey: 'question.readTallyTable',
    data: {
      operation: 'read-tally-table',
      rows,
      targetLabel,
    },
    answerOptions,
    expectedAnswer,
  };
}

export const tallyAndSimpleTablesGenerator: QuestionGenerator = {
  id: 'tally-and-simple-tables',
  supportedSkills: ['tally_and_simple_tables'],
  capability: 'data-table',
  supportedGrades: [1, 2],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['table'],
  requiredConstraints: [],
  generate: generateTallyAndSimpleTables,
  validate: validateTallyAndSimpleTables,
};
