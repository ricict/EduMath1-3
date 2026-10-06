import type { Question } from '@/core/types';

export interface NumberRecognitionVisualModel {
  kind: 'number-recognition';
  questionId: string;
  target: number;
}

export interface AdditionCombineVisualModel {
  kind: 'addition-combine';
  questionId: string;
  groups: readonly [
    {
      position: 'first';
      count: number;
    },
    {
      position: 'second';
      count: number;
    },
  ];
}

export interface UnitFractionVisualModel {
  kind: 'unit-fraction';
  questionId: string;
  numerator: 1;
  denominator: number;
  shadedParts: 1;
  totalParts: number;
}

export interface ReadClockVisualModel {
  kind: 'read-clock';
  questionId: string;
  hour: number;
  minute: 0 | 30;
  hourHandDegrees: number;
  minuteHandDegrees: number;
}

export function getClockHandDegrees(
  hour: number,
  minute: 0 | 30,
): Readonly<{
  hourHandDegrees: number;
  minuteHandDegrees: number;
}> {
  return {
    hourHandDegrees: (hour % 12) * 30 + minute * 0.5,
    minuteHandDegrees: minute * 6,
  };
}

export type VisualQuestionModel =
  | NumberRecognitionVisualModel
  | AdditionCombineVisualModel
  | UnitFractionVisualModel
  | ReadClockVisualModel;

export function buildVisualQuestionModel(
  question: Question,
): VisualQuestionModel | null {
  switch (question.data.operation) {
    case 'number-recognition':
      return {
        kind: 'number-recognition',
        questionId: question.id,
        target: question.data.target,
      };

    case 'addition-combine':
      return {
        kind: 'addition-combine',
        questionId: question.id,
        groups: [
          {
            position: 'first',
            count: question.data.a,
          },
          {
            position: 'second',
            count: question.data.b,
          },
        ],
      };

    case 'unit-fraction':
      return {
        kind: 'unit-fraction',
        questionId: question.id,
        numerator: question.data.numerator,
        denominator: question.data.denominator,
        shadedParts: question.data.shadedParts,
        totalParts: question.data.totalParts,
      };

    case 'read-clock': {
      const handDegrees = getClockHandDegrees(
        question.data.hour,
        question.data.minute,
      );

      return {
        kind: 'read-clock',
        questionId: question.id,
        hour: question.data.hour,
        minute: question.data.minute,
        ...handDegrees,
      };
    }

    default:
      return null;
  }
}
