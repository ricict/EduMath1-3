import {
  canonicalSkills,
  type CanonicalSkillDefinition,
} from '../curriculum/canonicalSkills';
import type {
  Question,
  QuestionGenerationContext,
  QuestionType,
  RepresentationType,
  SkillId,
} from '../types';
import { additionWithin10Generator } from './additionWithin10';
import { compareOrderNumbers20Generator } from './compareOrderNumbers20';
import type { QuestionGenerator } from './generator';
import { multiplicationFacts2510Generator } from './multiplicationFacts2510';
import {
  assertQuestionGeneratorRegistryValid,
  validateQuestionGeneratorRegistry,
} from './registryValidation';
import { subtractionWithin10Generator } from './subtractionWithin10';

export const registeredQuestionGenerators = [
  additionWithin10Generator,
  subtractionWithin10Generator,
  compareOrderNumbers20Generator,
  multiplicationFacts2510Generator,
] as const satisfies readonly QuestionGenerator[];

export const registeredQuestionGeneratorValidation =
  validateQuestionGeneratorRegistry(registeredQuestionGenerators);

assertQuestionGeneratorRegistryValid(registeredQuestionGenerators);

function includesValue<T>(values: readonly T[], value: T): boolean {
  return values.includes(value);
}

function assertRequiredConstraints(
  generator: QuestionGenerator,
  skill: CanonicalSkillDefinition,
): void {
  for (const constraint of generator.requiredConstraints) {
    if (skill.constraints?.[constraint] === undefined) {
      throw new Error(
        `Generator ${generator.id} requires canonical constraint ${constraint} for ${skill.id}.`,
      );
    }
  }
}

function assertContextCompatibility(
  generator: QuestionGenerator,
  skill: CanonicalSkillDefinition,
  context: QuestionGenerationContext,
): void {
  if (!includesValue(generator.supportedSkills, context.skillId)) {
    throw new Error(`Generator ${generator.id} does not support skill ${context.skillId}.`);
  }
  if (skill.generatorCapability !== generator.capability) {
    throw new Error(
      `Generator capability mismatch for ${skill.id}: expected ${skill.generatorCapability}, got ${generator.capability}.`,
    );
  }
  if (!includesValue(skill.grades, context.grade)) {
    throw new Error(`Skill ${skill.id} is not applicable to Grade ${context.grade}.`);
  }
  if (!includesValue(generator.supportedGrades, context.grade)) {
    throw new Error(`Generator ${generator.id} does not support Grade ${context.grade}.`);
  }
  if (!includesValue(generator.supportedDifficulties, context.difficulty)) {
    throw new Error(
      `Generator ${generator.id} does not support difficulty ${context.difficulty}.`,
    );
  }
  if (
    context.questionType &&
    !includesValue(generator.supportedQuestionTypes, context.questionType)
  ) {
    throw new Error(
      `Generator ${generator.id} does not support question type ${context.questionType}.`,
    );
  }
  if (context.representation) {
    if (!includesValue(skill.representations, context.representation)) {
      throw new Error(
        `Representation ${context.representation} is not canonical for skill ${skill.id}.`,
      );
    }
    if (!includesValue(generator.supportedRepresentations, context.representation)) {
      throw new Error(
        `Generator ${generator.id} does not support representation ${context.representation}.`,
      );
    }
  }

  assertRequiredConstraints(generator, skill);
}

function assertGeneratedQuestionCompatibility(
  generator: QuestionGenerator,
  skill: CanonicalSkillDefinition,
  context: QuestionGenerationContext,
  question: Question,
): void {
  if (question.skillId !== context.skillId) {
    throw new Error('Generated question skill does not match the requested canonical skill.');
  }
  if (question.grade !== context.grade) {
    throw new Error('Generated question grade does not match the requested grade.');
  }
  if (question.difficulty !== context.difficulty) {
    throw new Error('Generated question difficulty does not match the requested difficulty.');
  }
  if (question.domain !== skill.domain || question.topic !== skill.topic) {
    throw new Error('Generated question domain/topic does not match canonical skill metadata.');
  }
  if (!includesValue(generator.supportedQuestionTypes, question.questionType)) {
    throw new Error('Generated question type is not declared by its generator.');
  }
  if (!includesValue(skill.representations, question.representation)) {
    throw new Error('Generated representation is not permitted by the canonical skill.');
  }
  if (!includesValue(generator.supportedRepresentations, question.representation)) {
    throw new Error('Generated representation is not declared by its generator.');
  }
  if (context.questionType && question.questionType !== context.questionType) {
    throw new Error('Generated question type does not match the requested question type.');
  }
  if (context.representation && question.representation !== context.representation) {
    throw new Error('Generated representation does not match the requested representation.');
  }
}

export function getQuestionGenerator(skillId: SkillId): QuestionGenerator {
  const generator = registeredQuestionGenerators.find((candidate) =>
    candidate.supportedSkills.includes(skillId),
  );

  if (!generator) {
    throw new Error(`Unsupported question-generation skill: ${skillId}.`);
  }

  return generator;
}

export function generateQuestion(context: QuestionGenerationContext): Question {
  const skill = canonicalSkills[context.skillId];
  const generator = getQuestionGenerator(context.skillId);

  assertContextCompatibility(generator, skill, context);

  const question = generator.generate(context);
  assertGeneratedQuestionCompatibility(generator, skill, context, question);

  const validation = generator.validate(question);
  if (!validation.valid) {
    throw new Error(
      `Generated question failed validation: ${validation.errors.join('; ')}`,
    );
  }

  return question;
}

export function supportsQuestionGeneration(
  skillId: SkillId,
  questionType?: QuestionType,
  representation?: RepresentationType,
): boolean {
  const generator = registeredQuestionGenerators.find((candidate) =>
    candidate.supportedSkills.includes(skillId),
  );

  if (!generator) {
    return false;
  }
  if (questionType && !includesValue(generator.supportedQuestionTypes, questionType)) {
    return false;
  }
  if (
    representation &&
    !includesValue(generator.supportedRepresentations, representation)
  ) {
    return false;
  }

  return true;
}
