import type {
  CanonicalSkillConstraints,
  GeneratorCapability,
} from '../curriculum/canonicalSkills';
import type {
  Difficulty,
  Grade,
  Question,
  QuestionGenerationContext,
  QuestionType,
  RepresentationType,
  SkillId,
} from '../types';
import type { QuestionValidationResult } from '../validation/types';

export type CanonicalConstraintKey = keyof CanonicalSkillConstraints;

export interface QuestionGenerator {
  readonly id: string;
  readonly supportedSkills: readonly SkillId[];
  readonly capability: GeneratorCapability;
  readonly supportedGrades: readonly Grade[];
  readonly supportedDifficulties: readonly Difficulty[];
  readonly supportedQuestionTypes: readonly QuestionType[];
  readonly supportedRepresentations: readonly RepresentationType[];
  readonly requiredConstraints: readonly CanonicalConstraintKey[];
  generate(context: QuestionGenerationContext): Question;
  validate(question: Question): QuestionValidationResult;
}
