import type { ComparisonRelation, Question } from '@/core/types';
import {
  translateNumberWord,
  translateShapeName,
  type Locale,
} from '@/localization';

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

    case 'shape-choice':
      return question.answerOptions.map((value) => ({
        kind: 'shape',
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
    case 'shape':
      return `shape:${answer.value}`;
  }
}

export function formatPracticeAnswerText(
  answer: PracticeScreenAnswer,
  locale: Locale = 'en',
  question?: Question,
): string {
  switch (answer.kind) {
    case 'numeric':
      return question?.data.operation === 'number-recognition'
        ? translateNumberWord(locale, answer.value)
        : String(answer.value);
    case 'relation':
      return relationSymbol(answer.value);
    case 'fraction':
      return `${answer.value.numerator}/${answer.value.denominator}`;
    case 'time':
      return `${answer.value.hour}:${answer.value.minute
        .toString()
        .padStart(2, '0')}`;
    case 'shape':
      return translateShapeName(locale, answer.value);
  }
}

export function getCorrectPracticeAnswer(
  question: Question,
): PracticeScreenAnswer {
  switch (question.questionType) {
    case 'numeric-choice':
      return { kind: 'numeric', value: question.expectedAnswer };
    case 'relation-choice':
      return { kind: 'relation', value: question.expectedAnswer };
    case 'fraction-choice':
      return { kind: 'fraction', value: question.expectedAnswer };
    case 'time-choice':
      return { kind: 'time', value: question.expectedAnswer };
    case 'shape-choice':
      return { kind: 'shape', value: question.expectedAnswer };
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

  if (left.kind === 'shape' && right.kind === 'shape') {
    return left.value === right.value;
  }

  return false;
}
