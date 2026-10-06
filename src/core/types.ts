import type { SkillId } from './curriculum/skillIds';

export type { SkillId } from './curriculum/skillIds';

export type Grade = 1 | 2 | 3;

export type MathDomain =
  | 'number'
  | 'operations'
  | 'algebra'
  | 'geometry'
  | 'measurement'
  | 'data';

export type MathTopic =
  | 'number-sense'
  | 'counting'
  | 'comparison'
  | 'place-value'
  | 'fractions'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'operation-relations'
  | 'equality'
  | 'patterns'
  | 'length'
  | 'mass'
  | 'time'
  | 'money'
  | '2d-shapes'
  | '3d-shapes'
  | 'position'
  | 'classification'
  | 'tables'
  | 'pictograms'
  | 'bar-charts';

export type Difficulty = 1 | 2 | 3;

export type QuestionType =
  | 'numeric-choice'
  | 'relation-choice'
  | 'fraction-choice'
  | 'time-choice'
  | 'shape-choice';

export type RepresentationType =
  | 'symbolic'
  | 'visual'
  | 'concrete'
  | 'number-line'
  | 'clock'
  | 'money'
  | 'table'
  | 'pictogram'
  | 'bar-chart';

export type QuestionPromptKey =
  | 'question.numberRecognition'
  | 'question.additionConcept'
  | 'question.addition'
  | 'question.subtraction'
  | 'question.multiplication'
  | 'question.numberComparison'
  | 'question.unitFraction'
  | 'question.readClock'
  | 'question.identify2dShape';

export interface QuestionBase {
  id: string;
  grade: Grade;
  domain: MathDomain;
  topic: MathTopic;
  skillId: SkillId;
  difficulty: Difficulty;
  questionType: QuestionType;
  representation: RepresentationType;
  promptKey: QuestionPromptKey;
}

export interface NumberRecognitionQuestion extends QuestionBase {
  questionType: 'numeric-choice';
  representation: 'visual';
  promptKey: 'question.numberRecognition';
  data: {
    operation: 'number-recognition';
    target: number;
  };
  answerOptions: readonly number[];
  expectedAnswer: number;
}

export interface AdditionConceptQuestion extends QuestionBase {
  questionType: 'numeric-choice';
  representation: 'visual';
  promptKey: 'question.additionConcept';
  data: {
    operation: 'addition-combine';
    a: number;
    b: number;
  };
  answerOptions: readonly number[];
  expectedAnswer: number;
}

export interface AddSubtractQuestion extends QuestionBase {
  questionType: 'numeric-choice';
  representation: 'symbolic';
  promptKey: 'question.addition' | 'question.subtraction';
  data: {
    operation: 'addition' | 'subtraction';
    a: number;
    b: number;
  };
  answerOptions: readonly number[];
  expectedAnswer: number;
}

export type MultiplicationFactFamily = 2 | 5 | 10;

export interface MultiplicationQuestion extends QuestionBase {
  questionType: 'numeric-choice';
  representation: 'symbolic';
  promptKey: 'question.multiplication';
  data: {
    operation: 'multiplication';
    a: number;
    b: number;
    factFamily: MultiplicationFactFamily;
  };
  answerOptions: readonly number[];
  expectedAnswer: number;
}

export type ArithmeticQuestion =
  | AdditionConceptQuestion
  | AddSubtractQuestion
  | MultiplicationQuestion;

export type ComparisonRelation = 'less-than' | 'equal' | 'greater-than';

export interface NumberComparisonQuestion extends QuestionBase {
  questionType: 'relation-choice';
  representation: 'symbolic' | 'number-line';
  promptKey: 'question.numberComparison';
  data: {
    operation: 'number-comparison';
    left: number;
    right: number;
    scaleMin: 0;
    scaleMax: number;
  };
  expectedAnswer: ComparisonRelation;
}

export interface FractionAnswer {
  numerator: number;
  denominator: number;
}

export interface UnitFractionQuestion extends QuestionBase {
  questionType: 'fraction-choice';
  representation: 'visual';
  promptKey: 'question.unitFraction';
  data: {
    operation: 'unit-fraction';
    shadedParts: 1;
    totalParts: number;
    numerator: 1;
    denominator: number;
  };
  answerOptions: readonly FractionAnswer[];
  expectedAnswer: FractionAnswer;
}

export interface TimeAnswer {
  hour: number;
  minute: 0 | 30;
}

export interface ReadClockQuestion extends QuestionBase {
  questionType: 'time-choice';
  representation: 'clock';
  promptKey: 'question.readClock';
  data: {
    operation: 'read-clock';
    hour: number;
    minute: 0 | 30;
  };
  answerOptions: readonly TimeAnswer[];
  expectedAnswer: TimeAnswer;
}

export type Shape2D = 'circle' | 'triangle' | 'square' | 'rectangle';

export interface Identify2DShapeQuestion extends QuestionBase {
  questionType: 'shape-choice';
  representation: 'visual';
  promptKey: 'question.identify2dShape';
  data: {
    operation: 'identify-2d-shape';
    shape: Shape2D;
  };
  answerOptions: readonly Shape2D[];
  expectedAnswer: Shape2D;
}

export type Question =
  | NumberRecognitionQuestion
  | ArithmeticQuestion
  | NumberComparisonQuestion
  | UnitFractionQuestion
  | ReadClockQuestion
  | Identify2DShapeQuestion;

export interface QuestionGenerationContext {
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  seed: number;
  questionType?: QuestionType;
  representation?: RepresentationType;
}
