export type Grade = 1 | 2 | 3;

export type MathDomain = 'number' | 'operations' | 'geometry' | 'measurement' | 'data';

export type MathTopic = 'number-sense' | 'addition';

export type SkillId = 'number_recognition_10' | 'addition_concept' | 'addition_within_10';

export type Difficulty = 1 | 2 | 3;

export type QuestionType = 'numeric-choice';

export type RepresentationType = 'symbolic' | 'visual';

export type QuestionPromptKey = 'question.addition';

export interface Question {
  id: string;
  grade: Grade;
  domain: MathDomain;
  topic: MathTopic;
  skillId: SkillId;
  difficulty: Difficulty;
  questionType: QuestionType;
  representation: RepresentationType;
  promptKey: QuestionPromptKey;
  data: {
    operation: 'addition';
    a: number;
    b: number;
  };
  expectedAnswer: number;
}

export interface QuestionGenerationContext {
  grade: Grade;
  skillId: SkillId;
  difficulty: Difficulty;
  seed: number;
}
