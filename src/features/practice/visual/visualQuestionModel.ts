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

export type VisualQuestionModel =
  | NumberRecognitionVisualModel
  | AdditionCombineVisualModel;

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

    default:
      return null;
  }
}
