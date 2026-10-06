import type {
  Difficulty,
  QuestionGenerationContext,
  ReadClockQuestion,
} from '../types';
import { validateTellTimeHourHalfHour } from '../validation/tellTimeHourHalfHour';
import type { QuestionGenerator } from './generator';
import { createSeededRandom } from './seededRandom';

const MAX_HOUR_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 6,
  2: 12,
  3: 12,
};

export function generateTellTimeHourHalfHour(
  context: QuestionGenerationContext,
): ReadClockQuestion {
  if (context.grade !== 1 && context.grade !== 2) {
    throw new Error(
      'tell_time_hour_half_hour is currently available only for Grades 1 and 2.',
    );
  }
  if (context.skillId !== 'tell_time_hour_half_hour') {
    throw new Error(
      'Generator context must request the tell_time_hour_half_hour skill.',
    );
  }
  if (context.questionType && context.questionType !== 'time-choice') {
    throw new Error('tell_time_hour_half_hour supports only time-choice questions.');
  }
  if (context.representation && context.representation !== 'clock') {
    throw new Error('tell_time_hour_half_hour currently generates only clock questions.');
  }

  const random = createSeededRandom(context.seed);
  const hour = random.integer(1, MAX_HOUR_BY_DIFFICULTY[context.difficulty]);
  const minute =
    context.difficulty === 3
      ? (random.integer(0, 1) * 30 as 0 | 30)
      : 0;

  return {
    id: `tell_time_hour_half_hour:${context.grade}:${context.seed}:${hour}:${minute}`,
    grade: context.grade,
    domain: 'measurement',
    topic: 'time',
    skillId: 'tell_time_hour_half_hour',
    difficulty: context.difficulty,
    questionType: 'time-choice',
    representation: 'clock',
    promptKey: 'question.readClock',
    data: {
      operation: 'read-clock',
      hour,
      minute,
    },
    expectedAnswer: {
      hour,
      minute,
    },
  };
}

export const tellTimeHourHalfHourGenerator: QuestionGenerator = {
  id: 'tell-time-hour-half-hour',
  supportedSkills: ['tell_time_hour_half_hour'],
  capability: 'time',
  supportedGrades: [1, 2],
  supportedDifficulties: [1, 2, 3],
  supportedQuestionTypes: ['time-choice'],
  supportedRepresentations: ['clock'],
  requiredConstraints: [],
  generate: generateTellTimeHourHalfHour,
  validate: validateTellTimeHourHalfHour,
};
