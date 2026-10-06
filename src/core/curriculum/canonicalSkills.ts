import type { Grade, MathDomain, MathTopic, SkillId } from '../types';

export interface CanonicalSkillDefinition {
  id: SkillId;
  domain: MathDomain;
  topic: MathTopic;
  grades: readonly Grade[];
  prerequisites: readonly SkillId[];
}

export const canonicalSkills: Readonly<Record<SkillId, CanonicalSkillDefinition>> = {
  number_recognition_10: {
    id: 'number_recognition_10',
    domain: 'number',
    topic: 'number-sense',
    grades: [1],
    prerequisites: [],
  },
  addition_concept: {
    id: 'addition_concept',
    domain: 'operations',
    topic: 'addition',
    grades: [1],
    prerequisites: ['number_recognition_10'],
  },
  addition_within_10: {
    id: 'addition_within_10',
    domain: 'operations',
    topic: 'addition',
    grades: [1],
    prerequisites: ['addition_concept'],
  },
};
