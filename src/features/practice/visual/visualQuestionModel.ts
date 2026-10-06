import type {
  DataDisplayRow,
  DataGroupLabel,
  Question,
  Shape2D,
} from '@/core/types';

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

export interface NumberLineComparisonVisualModel {
  kind: 'number-line-comparison';
  questionId: string;
  left: number;
  right: number;
  scaleMin: 0;
  scaleMax: number;
}

export interface Identify2DShapeVisualModel {
  kind: 'identify-2d-shape';
  questionId: string;
  shape: Shape2D;
}

export interface TallyTableVisualModel {
  kind: 'tally-table';
  questionId: string;
  rows: readonly DataDisplayRow[];
  targetLabel: DataGroupLabel;
}

export interface PictogramVisualModel {
  kind: 'pictogram';
  questionId: string;
  rows: readonly DataDisplayRow[];
  targetLabel: DataGroupLabel;
  symbolValue: 1;
}

export interface UnitBarChartVisualModel {
  kind: 'unit-bar-chart';
  questionId: string;
  rows: readonly DataDisplayRow[];
  targetLabel: DataGroupLabel;
  scaleUnit: 1;
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
  | ReadClockVisualModel
  | NumberLineComparisonVisualModel
  | Identify2DShapeVisualModel
  | TallyTableVisualModel
  | PictogramVisualModel
  | UnitBarChartVisualModel;

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

    case 'number-comparison':
      if (question.representation !== 'number-line') {
        return null;
      }

      return {
        kind: 'number-line-comparison',
        questionId: question.id,
        left: question.data.left,
        right: question.data.right,
        scaleMin: question.data.scaleMin,
        scaleMax: question.data.scaleMax,
      };

    case 'identify-2d-shape':
      return {
        kind: 'identify-2d-shape',
        questionId: question.id,
        shape: question.data.shape,
      };

    case 'read-tally-table':
      return {
        kind: 'tally-table',
        questionId: question.id,
        rows: question.data.rows,
        targetLabel: question.data.targetLabel,
      };

    case 'read-pictogram':
      return {
        kind: 'pictogram',
        questionId: question.id,
        rows: question.data.rows,
        targetLabel: question.data.targetLabel,
        symbolValue: question.data.symbolValue,
      };

    case 'read-unit-bar-chart':
      return {
        kind: 'unit-bar-chart',
        questionId: question.id,
        rows: question.data.rows,
        targetLabel: question.data.targetLabel,
        scaleUnit: question.data.scaleUnit,
      };

    default:
      return null;
  }
}
