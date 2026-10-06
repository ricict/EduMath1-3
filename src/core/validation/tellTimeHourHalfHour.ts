import type { Difficulty, Question, ReadClockQuestion } from '../types';
import type { QuestionValidationResult } from './types';

const MAX_HOUR_BY_DIFFICULTY: Readonly<Record<Difficulty, number>> = {
  1: 6,
  2: 12,
  3: 12,
};

export function validateTellTimeHourHalfHour(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1 && question.grade !== 2) {
    errors.push('tell_time_hour_half_hour is available only for Grades 1 and 2.');
  }
  if (question.skillId !== 'tell_time_hour_half_hour') {
    errors.push('Question skill must be tell_time_hour_half_hour.');
  }
  if (question.data.operation !== 'read-clock') {
    errors.push('Question operation must be read-clock.');
    return { valid: false, errors };
  }

  const clockQuestion = question as ReadClockQuestion;
  const { hour, minute } = clockQuestion.data;
  const maxHour = MAX_HOUR_BY_DIFFICULTY[question.difficulty];

  if (!Number.isInteger(hour) || hour < 1 || hour > maxHour) {
    errors.push('Clock hour is outside the configured difficulty range.');
  }
  if (minute !== 0 && minute !== 30) {
    errors.push('Clock minute must be 00 or 30.');
  }
  if (question.difficulty < 3 && minute !== 0) {
    errors.push('Half-hour questions are enabled only at difficulty 3.');
  }

  if (clockQuestion.answerOptions.length !== 4) {
    errors.push('Clock answer options must contain exactly four choices.');
  }

  const optionKeys = clockQuestion.answerOptions.map(
    (option) => `${option.hour}:${option.minute}`,
  );
  if (new Set(optionKeys).size !== optionKeys.length) {
    errors.push('Clock answer options must be unique.');
  }

  for (const option of clockQuestion.answerOptions) {
    if (
      !Number.isInteger(option.hour) ||
      option.hour < 1 ||
      option.hour > maxHour ||
      (option.minute !== 0 && option.minute !== 30) ||
      (question.difficulty < 3 && option.minute !== 0)
    ) {
      errors.push(
        'Clock answer options must stay inside the configured difficulty range.',
      );
      break;
    }
  }

  const correctOptionCount = clockQuestion.answerOptions.filter(
    (option) => option.hour === hour && option.minute === minute,
  ).length;
  if (correctOptionCount !== 1) {
    errors.push('Clock answer options must contain the correct answer exactly once.');
  }

  if (
    typeof clockQuestion.expectedAnswer !== 'object' ||
    clockQuestion.expectedAnswer === null ||
    !('hour' in clockQuestion.expectedAnswer) ||
    !('minute' in clockQuestion.expectedAnswer)
  ) {
    errors.push('Clock expected answer must contain hour and minute.');
  } else if (
    clockQuestion.expectedAnswer.hour !== hour ||
    clockQuestion.expectedAnswer.minute !== minute
  ) {
    errors.push('Expected time does not match the generated clock semantics.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
