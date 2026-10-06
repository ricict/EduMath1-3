import { canonicalSkills } from '../curriculum/canonicalSkills';
import type { Grade, QuestionType, RepresentationType, SkillId } from '../types';
import type {
  CanonicalConstraintKey,
  QuestionGenerator,
} from './generator';

export type GeneratorRegistryIssueCode =
  | 'DUPLICATE_GENERATOR_ID'
  | 'DUPLICATE_SKILL_REGISTRATION'
  | 'EMPTY_SUPPORTED_SKILLS'
  | 'EMPTY_SUPPORTED_GRADES'
  | 'EMPTY_SUPPORTED_DIFFICULTIES'
  | 'EMPTY_SUPPORTED_QUESTION_TYPES'
  | 'EMPTY_SUPPORTED_REPRESENTATIONS'
  | 'DUPLICATE_METADATA_VALUE'
  | 'CAPABILITY_MISMATCH'
  | 'GRADE_NOT_CANONICAL'
  | 'REPRESENTATION_NOT_CANONICAL'
  | 'MISSING_REQUIRED_CONSTRAINT';

export interface GeneratorRegistryIssue {
  code: GeneratorRegistryIssueCode;
  generatorId: string;
  skillId?: SkillId;
  message: string;
}

export interface GeneratorRegistryValidationResult {
  valid: boolean;
  issues: readonly GeneratorRegistryIssue[];
}

function findDuplicates<T>(values: readonly T[]): readonly T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function validateMetadataDuplicates(
  generator: QuestionGenerator,
  issues: GeneratorRegistryIssue[],
): void {
  const metadata: readonly [string, readonly unknown[]][] = [
    ['supportedSkills', generator.supportedSkills],
    ['supportedGrades', generator.supportedGrades],
    ['supportedDifficulties', generator.supportedDifficulties],
    ['supportedQuestionTypes', generator.supportedQuestionTypes],
    ['supportedRepresentations', generator.supportedRepresentations],
    ['requiredConstraints', generator.requiredConstraints],
  ];

  for (const [name, values] of metadata) {
    for (const duplicate of findDuplicates(values)) {
      issues.push({
        code: 'DUPLICATE_METADATA_VALUE',
        generatorId: generator.id,
        message: `Generator ${generator.id} repeats ${String(duplicate)} in ${name}.`,
      });
    }
  }
}

function validateNonEmptyMetadata(
  generator: QuestionGenerator,
  issues: GeneratorRegistryIssue[],
): void {
  const checks: readonly [
    readonly unknown[],
    GeneratorRegistryIssueCode,
    string,
  ][] = [
    [generator.supportedSkills, 'EMPTY_SUPPORTED_SKILLS', 'supported skills'],
    [generator.supportedGrades, 'EMPTY_SUPPORTED_GRADES', 'supported grades'],
    [
      generator.supportedDifficulties,
      'EMPTY_SUPPORTED_DIFFICULTIES',
      'supported difficulties',
    ],
    [
      generator.supportedQuestionTypes,
      'EMPTY_SUPPORTED_QUESTION_TYPES',
      'supported question types',
    ],
    [
      generator.supportedRepresentations,
      'EMPTY_SUPPORTED_REPRESENTATIONS',
      'supported representations',
    ],
  ];

  for (const [values, code, label] of checks) {
    if (values.length === 0) {
      issues.push({
        code,
        generatorId: generator.id,
        message: `Generator ${generator.id} must declare at least one ${label}.`,
      });
    }
  }
}

export function validateQuestionGeneratorRegistry(
  generators: readonly QuestionGenerator[],
): GeneratorRegistryValidationResult {
  const issues: GeneratorRegistryIssue[] = [];
  const generatorIds = new Set<string>();
  const skillOwners = new Map<SkillId, string>();

  for (const generator of generators) {
    if (generatorIds.has(generator.id)) {
      issues.push({
        code: 'DUPLICATE_GENERATOR_ID',
        generatorId: generator.id,
        message: `Generator ID ${generator.id} is registered more than once.`,
      });
    }
    generatorIds.add(generator.id);

    validateNonEmptyMetadata(generator, issues);
    validateMetadataDuplicates(generator, issues);

    for (const skillId of generator.supportedSkills) {
      const existingOwner = skillOwners.get(skillId);
      if (existingOwner) {
        issues.push({
          code: 'DUPLICATE_SKILL_REGISTRATION',
          generatorId: generator.id,
          skillId,
          message: `Skill ${skillId} is registered by both ${existingOwner} and ${generator.id}.`,
        });
      } else {
        skillOwners.set(skillId, generator.id);
      }

      const skill = canonicalSkills[skillId];

      if (generator.capability !== skill.generatorCapability) {
        issues.push({
          code: 'CAPABILITY_MISMATCH',
          generatorId: generator.id,
          skillId,
          message: `Generator ${generator.id} declares capability ${generator.capability} but ${skillId} requires ${skill.generatorCapability}.`,
        });
      }

      for (const grade of generator.supportedGrades as readonly Grade[]) {
        if (!skill.grades.includes(grade)) {
          issues.push({
            code: 'GRADE_NOT_CANONICAL',
            generatorId: generator.id,
            skillId,
            message: `Generator ${generator.id} declares Grade ${grade}, which is not canonical for ${skillId}.`,
          });
        }
      }

      for (const representation of generator.supportedRepresentations as readonly RepresentationType[]) {
        if (!skill.representations.includes(representation)) {
          issues.push({
            code: 'REPRESENTATION_NOT_CANONICAL',
            generatorId: generator.id,
            skillId,
            message: `Generator ${generator.id} declares representation ${representation}, which is not canonical for ${skillId}.`,
          });
        }
      }

      for (const constraint of generator.requiredConstraints as readonly CanonicalConstraintKey[]) {
        if (skill.constraints?.[constraint] === undefined) {
          issues.push({
            code: 'MISSING_REQUIRED_CONSTRAINT',
            generatorId: generator.id,
            skillId,
            message: `Generator ${generator.id} requires missing canonical constraint ${constraint} for ${skillId}.`,
          });
        }
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function assertQuestionGeneratorRegistryValid(
  generators: readonly QuestionGenerator[],
): void {
  const validation = validateQuestionGeneratorRegistry(generators);

  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join('\n'));
  }
}

export type {
  Grade,
  QuestionType,
  RepresentationType,
};
