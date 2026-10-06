import type {
  Difficulty,
  NumberRecognitionQuestion,
  QuestionGenerationContext,
} from '../types';
import { validateNumberRecognition10 } from '../validation/numberRecognition10';
import type { QuestionGenerator } from './generator';
import { createNumericAnswerOptions, integerRangeInclusive } from './numericAnswerOptions';
import { createSeededRandom } from './seededRandom';

const MAX_NUMBER_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 5,
  2: 7,
  3: 10,
};

export function generateNumberRecognition10(
  context: QuestionGenerationContext,
): NumberRecognitionQuestion {
  if (context.grade !== 1) {
    throw new Error('number_recognition_10 is currently available only for Grade 1.');
  }
  if (context.skillId !== 'number_recognition_10') {
    throw new Error('Generator context must request the number_recognition_10 skill.');
  }
  if (context.questionType && context.questionType !== 'numeric-choice') {
    throw new Error('number_recognition_10 supports only numeric-choice questions.');
  }
  if (context.representation && context.representation !== 'visual') {
    throw new Error('number_recognition_10 currently generates only visual questions.');
  }

  const random = createSeededRandom(context.seed);
  const maxNumber = MAX_NUMBER_BY_DIFFICULTY[context.difficulty];
  const target = random.integer(0, maxNumber);
  const answerOptions = createNumericAnswerOptions(
    target,
    integerRangeInclusive(0, maxNumber),
    random,
  );

  return {
    id: `number_recognition_10:${context.seed}:${target}`,
    grade: 1,
    domain: 'number',
    topic: 'number-sense',
    skillId: 'number_recognition_10',
    difficulty: context.difficulty,
    questionType: 'numeric-choice',
    representation: 'visual',
    promptKey: 'question.numberRecognition',
    data: {
      operation: 'number-recognition',
      target,
    },
    answerOptions,
    expectedAnswer: target,
  };
}

export const numberRecognition10Generator: QuestionGenerator = {
  id: 'number-recognition-10',
  supportedSkills: ['number_recognition_10'],
  capability: 'number-identification',
  supportedGrades: [1],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['numeric-choice'],
  supportedRepresentations: ['visual'],
  requiredConstraints: ['valueRange'],
  generate: generateNumberRecognition10,
  validate: validateNumberRecognition10,
};
