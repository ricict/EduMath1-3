import type { LearnerAnswer } from '@/core/session/types';
import type { Question } from '@/core/types';

export type PracticeScreenQuestion =
  | Extract<Question, { questionType: 'numeric-choice' }>
  | Extract<Question, { questionType: 'relation-choice' }>
  | Extract<Question, { questionType: 'fraction-choice' }>
  | Extract<Question, { questionType: 'time-choice' }>;

export type PracticeScreenAnswer = Extract<
  LearnerAnswer,
  { kind: 'numeric' | 'relation' | 'fraction' | 'time' }
>;

export function supportsPracticeScreenQuestion(
  question: Question,
): boolean {
  return (
    question.questionType === 'numeric-choice' ||
    question.questionType === 'relation-choice' ||
    question.questionType === 'fraction-choice' ||
    question.questionType === 'time-choice'
  );
}
