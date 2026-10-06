import { SKILL_IDS, type SkillId } from './skillIds';
import { isTopicAllowedForDomain } from './taxonomy';
import type { CanonicalSkillDefinition } from './canonicalSkills';

export type SkillGraphIssueCode =
  | 'DUPLICATE_SKILL_ID'
  | 'MISSING_CANONICAL_SKILL'
  | 'UNKNOWN_PREREQUISITE'
  | 'SELF_PREREQUISITE'
  | 'DUPLICATE_PREREQUISITE'
  | 'CYCLIC_PREREQUISITE'
  | 'INVALID_GRADES'
  | 'PREREQUISITE_AFTER_SKILL'
  | 'INVALID_DOMAIN_TOPIC'
  | 'MISSING_REPRESENTATION';

export interface SkillGraphIssue {
  code: SkillGraphIssueCode;
  skillId: string;
  message: string;
}

export interface SkillGraphValidationResult {
  valid: boolean;
  issues: readonly SkillGraphIssue[];
}

function firstGrade(skill: CanonicalSkillDefinition): number {
  return Math.min(...skill.grades);
}

export function validateSkillGraph(
  definitions: readonly CanonicalSkillDefinition[],
): SkillGraphValidationResult {
  const issues: SkillGraphIssue[] = [];
  const byId = new Map<string, CanonicalSkillDefinition>();

  for (const skill of definitions) {
    if (byId.has(skill.id)) {
      issues.push({
        code: 'DUPLICATE_SKILL_ID',
        skillId: skill.id,
        message: `Duplicate canonical skill ID: ${skill.id}`,
      });
      continue;
    }

    byId.set(skill.id, skill);

    const uniqueGrades = new Set(skill.grades);
    const sortedGrades = [...skill.grades].sort((a, b) => a - b);
    const gradesAreSorted = sortedGrades.every((grade, index) => grade === skill.grades[index]);

    if (skill.grades.length === 0 || uniqueGrades.size !== skill.grades.length || !gradesAreSorted) {
      issues.push({
        code: 'INVALID_GRADES',
        skillId: skill.id,
        message: `Skill ${skill.id} must declare non-empty, unique, ascending grades.`,
      });
    }

    if (!isTopicAllowedForDomain(skill.domain, skill.topic)) {
      issues.push({
        code: 'INVALID_DOMAIN_TOPIC',
        skillId: skill.id,
        message: `Topic ${skill.topic} is not valid for domain ${skill.domain}.`,
      });
    }

    if (skill.representations.length === 0) {
      issues.push({
        code: 'MISSING_REPRESENTATION',
        skillId: skill.id,
        message: `Skill ${skill.id} must support at least one representation.`,
      });
    }

    const prerequisiteSet = new Set<string>();
    for (const prerequisiteId of skill.prerequisites) {
      if (prerequisiteId === skill.id) {
        issues.push({
          code: 'SELF_PREREQUISITE',
          skillId: skill.id,
          message: `Skill ${skill.id} cannot depend on itself.`,
        });
      }

      if (prerequisiteSet.has(prerequisiteId)) {
        issues.push({
          code: 'DUPLICATE_PREREQUISITE',
          skillId: skill.id,
          message: `Skill ${skill.id} repeats prerequisite ${prerequisiteId}.`,
        });
      }
      prerequisiteSet.add(prerequisiteId);
    }
  }

  for (const skill of definitions) {
    for (const prerequisiteId of skill.prerequisites) {
      const prerequisite = byId.get(prerequisiteId);
      if (!prerequisite) {
        issues.push({
          code: 'UNKNOWN_PREREQUISITE',
          skillId: skill.id,
          message: `Skill ${skill.id} references unknown prerequisite ${prerequisiteId}.`,
        });
        continue;
      }

      if (prerequisiteId !== skill.id && firstGrade(prerequisite) > firstGrade(skill)) {
        issues.push({
          code: 'PREREQUISITE_AFTER_SKILL',
          skillId: skill.id,
          message: `Prerequisite ${prerequisiteId} starts after dependent skill ${skill.id}.`,
        });
      }
    }
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const cycleSignatures = new Set<string>();

  function visit(skillId: string, path: readonly string[]): void {
    const currentState = state.get(skillId);
    if (currentState === 'visited') {
      return;
    }

    if (currentState === 'visiting') {
      const cycleStart = path.indexOf(skillId);
      const cycle = [...path.slice(cycleStart), skillId];
      const signature = [...new Set(cycle)].sort().join('|');

      if (!cycleSignatures.has(signature)) {
        cycleSignatures.add(signature);
        issues.push({
          code: 'CYCLIC_PREREQUISITE',
          skillId,
          message: `Cyclic prerequisite path: ${cycle.join(' -> ')}`,
        });
      }
      return;
    }

    const skill = byId.get(skillId);
    if (!skill) {
      return;
    }

    state.set(skillId, 'visiting');
    for (const prerequisiteId of skill.prerequisites) {
      if (byId.has(prerequisiteId)) {
        visit(prerequisiteId, [...path, skillId]);
      }
    }
    state.set(skillId, 'visited');
  }

  for (const skill of definitions) {
    visit(skill.id, []);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function validateCanonicalSkillGraph(
  definitions: readonly CanonicalSkillDefinition[],
): SkillGraphValidationResult {
  const base = validateSkillGraph(definitions);
  const issues = [...base.issues];
  const ids = new Set(definitions.map((skill) => skill.id));

  for (const skillId of SKILL_IDS) {
    if (!ids.has(skillId)) {
      issues.push({
        code: 'MISSING_CANONICAL_SKILL',
        skillId,
        message: `Declared canonical skill ${skillId} has no definition.`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

export function createSkillIndex(
  definitions: readonly CanonicalSkillDefinition[],
): Readonly<Record<string, CanonicalSkillDefinition>> {
  const validation = validateSkillGraph(definitions);

  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join('\n'));
  }

  return Object.freeze(
    Object.fromEntries(definitions.map((skill) => [skill.id, skill] as const)),
  );
}

export function topologicallySortSkills(
  definitions: readonly CanonicalSkillDefinition[],
): readonly SkillId[] {
  const validation = validateCanonicalSkillGraph(definitions);
  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join('\n'));
  }

  const byId = new Map(definitions.map((skill) => [skill.id, skill] as const));
  const visited = new Set<SkillId>();
  const ordered: SkillId[] = [];

  function visit(skillId: SkillId): void {
    if (visited.has(skillId)) {
      return;
    }

    const skill = byId.get(skillId);
    if (!skill) {
      throw new Error(`Missing canonical skill definition: ${skillId}`);
    }

    for (const prerequisiteId of skill.prerequisites) {
      visit(prerequisiteId);
    }

    visited.add(skillId);
    ordered.push(skillId);
  }

  for (const skillId of SKILL_IDS) {
    visit(skillId);
  }

  return ordered;
}

export function getPrerequisiteClosure(
  skillId: SkillId,
  definitions: readonly CanonicalSkillDefinition[],
): readonly SkillId[] {
  const validation = validateCanonicalSkillGraph(definitions);
  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join('\n'));
  }

  const byId = new Map(definitions.map((skill) => [skill.id, skill] as const));
  const closure = new Set<SkillId>();

  function collect(currentId: SkillId): void {
    const skill = byId.get(currentId);
    if (!skill) {
      throw new Error(`Missing canonical skill definition: ${currentId}`);
    }

    for (const prerequisiteId of skill.prerequisites) {
      collect(prerequisiteId);
      closure.add(prerequisiteId);
    }
  }

  collect(skillId);

  const progression = topologicallySortSkills(definitions);
  return progression.filter((candidate) => closure.has(candidate));
}
