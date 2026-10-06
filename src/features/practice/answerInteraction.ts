import type { Question } from '@/core/types';

import type { PracticeScreenAnswer } from './practiceCompatibility';

const NUMERIC_ANSWERS = Array.from({ length: 11 }, (_, value) => value);

export function getPracticeAnswerOptions(
  question: Question,
): readonly PracticeScreenAnswer[] | null {
  switch (question.questionType) {
    case 'numeric-choice':
      return NUMERIC_ANSWERS.map((value) => ({
        kind: 'numeric',
        value,
      }));

    case 'fraction-choice':
      return question.answerOptions.map((value) => ({
        kind: 'fraction',
        value,
      }));

    default:
      return null;
  }
}

export function practiceAnswerKey(answer: PracticeScreenAnswer): string {
  if (answer.kind === 'numeric') {
    return `numeric:${answer.value}`;
  }

  return `fraction:${answer.value.numerator}/${answer.value.denominator}`;
}

export function formatPracticeAnswerText(
  answer: PracticeScreenAnswer,
): string {
  if (answer.kind === 'numeric') {
    return String(answer.value);
  }

  return `${answer.value.numerator}/${answer.value.denominator}`;
}

export function isSamePracticeAnswer(
  left: PracticeScreenAnswer | null,
  right: PracticeScreenAnswer,
): boolean {
  if (left === null || left.kind !== right.kind) {
    return false;
  }

  if (left.kind === 'numeric' && right.kind === 'numeric') {
    return left.value === right.value;
  }

  if (left.kind === 'fraction' && right.kind === 'fraction') {
    return (
      left.value.numerator === right.value.numerator &&
      left.value.denominator === right.value.denominator
    );
  }

  return false;
}
