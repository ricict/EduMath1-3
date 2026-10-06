import type { Question } from '@/core/types';

export type PracticeScreenQuestion = Extract<
  Question,
  {
    questionType: 'numeric-choice';
  }
>;

export function supportsPracticeScreenQuestion(
  question: Question,
): question is PracticeScreenQuestion {
  return question.questionType === 'numeric-choice';
}
