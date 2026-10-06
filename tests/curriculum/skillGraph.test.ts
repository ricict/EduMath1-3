import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canonicalSkillDefinitions,
  canonicalSkills,
  type CanonicalSkillDefinition,
} from '../../src/core/curriculum/canonicalSkills';
import {
  getPrerequisiteClosure,
  topologicallySortSkills,
  validateCanonicalSkillGraph,
  validateSkillGraph,
} from '../../src/core/curriculum/skillGraph';
import { SKILL_IDS } from '../../src/core/curriculum/skillIds';

function cloneSkill(
  skill: CanonicalSkillDefinition,
  overrides: Partial<CanonicalSkillDefinition> = {},
): CanonicalSkillDefinition {
  return {
    ...skill,
    ...overrides,
  };
}

test('canonical Grade 1-3 skill graph is valid and complete', () => {
  const result = validateCanonicalSkillGraph(canonicalSkillDefinitions);

  assert.equal(result.valid, true, result.issues.map((issue) => issue.message).join('\n'));
  assert.equal(canonicalSkillDefinitions.length, SKILL_IDS.length);
  assert.deepEqual(
    new Set(canonicalSkillDefinitions.map((skill) => skill.id)),
    new Set(SKILL_IDS),
  );
});

test('M1 prerequisite regression chain is preserved', () => {
  assert.deepEqual(canonicalSkills.number_recognition_10.prerequisites, []);
  assert.deepEqual(canonicalSkills.addition_concept.prerequisites, ['number_recognition_10']);
  assert.deepEqual(canonicalSkills.addition_within_10.prerequisites, ['addition_concept']);
});

test('topological progression always places prerequisites before dependents', () => {
  const order = topologicallySortSkills(canonicalSkillDefinitions);
  const position = new Map(order.map((skillId, index) => [skillId, index] as const));

  for (const skill of canonicalSkillDefinitions) {
    for (const prerequisiteId of skill.prerequisites) {
      assert.ok(
        position.get(prerequisiteId)! < position.get(skill.id)!,
        `${prerequisiteId} must precede ${skill.id}`,
      );
    }
  }
});

test('prerequisite closure is deterministic for the M1 addition skill', () => {
  assert.deepEqual(
    getPrerequisiteClosure('addition_within_10', canonicalSkillDefinitions),
    ['number_recognition_10', 'addition_concept'],
  );
});

test('validator rejects duplicate skill IDs', () => {
  const base = canonicalSkills.number_recognition_10;
  const result = validateSkillGraph([base, cloneSkill(base)]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'DUPLICATE_SKILL_ID'));
});

test('validator rejects unknown prerequisites', () => {
  const base = canonicalSkills.addition_concept;
  const malformed = cloneSkill(base, {
    prerequisites: ['not_a_real_skill' as never],
  });
  const result = validateSkillGraph([malformed]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'UNKNOWN_PREREQUISITE'));
});

test('validator rejects self prerequisites', () => {
  const base = canonicalSkills.number_recognition_10;
  const malformed = cloneSkill(base, {
    prerequisites: ['number_recognition_10'],
  });
  const result = validateSkillGraph([malformed]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'SELF_PREREQUISITE'));
});

test('validator rejects cyclic prerequisites', () => {
  const first = cloneSkill(canonicalSkills.number_recognition_10, {
    prerequisites: ['addition_concept'],
  });
  const second = cloneSkill(canonicalSkills.addition_concept, {
    prerequisites: ['number_recognition_10'],
  });
  const result = validateSkillGraph([first, second]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'CYCLIC_PREREQUISITE'));
});

test('validator rejects invalid domain and topic combinations', () => {
  const malformed = cloneSkill(canonicalSkills.number_recognition_10, {
    domain: 'geometry',
    topic: 'addition',
  });
  const result = validateSkillGraph([malformed]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'INVALID_DOMAIN_TOPIC'));
});

test('validator rejects prerequisites introduced after their dependent skill', () => {
  const prerequisite = cloneSkill(canonicalSkills.number_recognition_10, {
    grades: [2],
  });
  const dependent = cloneSkill(canonicalSkills.addition_concept, {
    grades: [1],
    prerequisites: ['number_recognition_10'],
  });
  const result = validateSkillGraph([prerequisite, dependent]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'PREREQUISITE_AFTER_SKILL'));
});

test('validator rejects malformed grade metadata and empty representations', () => {
  const malformed = cloneSkill(canonicalSkills.number_recognition_10, {
    grades: [2, 1],
    representations: [],
  });
  const result = validateSkillGraph([malformed]);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.code === 'INVALID_GRADES'));
  assert.ok(result.issues.some((issue) => issue.code === 'MISSING_REPRESENTATION'));
});
