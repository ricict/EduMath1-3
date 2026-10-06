import type { ComparisonRelation, Question } from '@/core/types';

import type { PracticeScreenAnswer } from './practiceCompatibility';

const RELATION_ANSWERS: readonly ComparisonRelation[] = [
  'less-than',
  'equal',
  'greater-than',
];

function relationSymbol(value: ComparisonRelation): '<' | '=' | '>' {
  switch (value) {
    case 'less-than':
      return '<';
    case 'equal':
      return '=';
    case 'greater-than':
      return '>';
  }
}

export function getPracticeAnswerOptions(
  question: Question,
): readonly PracticeScreenAnswer[] | null {
  switch (question.questionType) {
    case 'numeric-choice':
      return question.answerOptions.map((value) => ({
        kind: 'numeric',
        value,
      }));

    case 'relation-choice':
      return RELATION_ANSWERS.map((value) => ({
        kind: 'relation',
        value,
      }));

    case 'fraction-choice':
      return question.answerOptions.map((value) => ({
        kind: 'fraction',
        value,
      }));

    case 'time-choice':
      return question.answerOptions.map((value) => ({
        kind: 'time',
        value,
      }));

    default:
      return null;
  }
}

export function practiceAnswerKey(answer: PracticeScreenAnswer): string {
  switch (answer.kind) {
    case 'numeric':
      return `numeric:${answer.value}`;
    case 'relation':
      return `relation:${answer.value}`;
    case 'fraction':
      return `fraction:${answer.value.numerator}/${answer.value.denominator}`;
    case 'time':
      return `time:${answer.value.hour}:${answer.value.minute}`;
  }
}

export function formatPracticeAnswerText(
  answer: PracticeScreenAnswer,
): string {
  switch (answer.kind) {
    case 'numeric':
      return String(answer.value);
    case 'relation':
      return relationSymbol(answer.value);
    case 'fraction':
      return `${answer.value.numerator}/${answer.value.denominator}`;
    case 'time':
      return `${answer.value.hour}:${answer.value.minute
        .toString()
        .padStart(2, '0')}`;
  }
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

  if (left.kind === 'relation' && right.kind === 'relation') {
    return left.value === right.value;
  }

  if (left.kind === 'fraction' && right.kind === 'fraction') {
    return (
      left.value.numerator === right.value.numerator &&
      left.value.denominator === right.value.denominator
    );
  }

  if (left.kind === 'time' && right.kind === 'time') {
    return (
      left.value.hour === right.value.hour &&
      left.value.minute === right.value.minute
    );
  }

  return false;
}
