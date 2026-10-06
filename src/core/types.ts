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

export type QuestionType = 'numeric-choice' | 'relation-choice';

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
  | 'question.addition'
  | 'question.subtraction'
  | 'question.multiplication'
  | 'question.numberComparison';

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

export interface AddSubtractQuestion extends QuestionBase {
  questionType: 'numeric-choice';
  representation: 'symbolic';
  promptKey: 'question.addition' | 'question.subtraction';
  data: {
    operation: 'addition' | 'subtraction';
    a: number;
    b: number;
  };
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
  expectedAnswer: number;
}

export type ArithmeticQuestion = AddSubtractQuestion | MultiplicationQuestion;

export type ComparisonRelation = 'less-than' | 'equal' | 'greater-than';

export interface NumberComparisonQuestion extends QuestionBase {
  questionType: 'relation-choice';
  representation: 'symbolic';
  promptKey: 'question.numberComparison';
  data: {
    operation: 'number-comparison';
    left: number;
    right: number;
  };
  expectedAnswer: ComparisonRelation;
}

export type Question = ArithmeticQuestion | NumberComparisonQuestion;

export interface QuestionGenerationContext {
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  seed: number;
  questionType?: QuestionType;
  representation?: RepresentationType;
}
