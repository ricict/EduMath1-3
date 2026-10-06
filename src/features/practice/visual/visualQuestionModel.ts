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

export type VisualQuestionModel =
  | NumberRecognitionVisualModel
  | AdditionCombineVisualModel
  | UnitFractionVisualModel;

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

    default:
      return null;
  }
}
