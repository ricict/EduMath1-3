import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLearnerModel } from '../../src/core/adaptive/mastery';
import { recommendPractice } from '../../src/core/adaptive/recommendation';
import { canonicalSkills } from '../../src/core/curriculum/canonicalSkills';
import { getQuestionGenerator } from '../../src/core/question-engine/registry';
import { selectProvisionalPracticePlan } from '../../src/features/practice/provisionalPractice';

test('Grade 2 keeps the standard M5 recommendation authoritative when available', () => {
  const recommendation = recommendPractice(2, buildLearnerModel([]));
  assert.equal(recommendation.kind, 'practice');
});

for (const grade of [2, 3] as const) {
  test(`Grade ${grade} has a grade-appropriate provisional curriculum practice`, () => {
    const provisional = selectProvisionalPracticePlan(
      grade,
      buildLearnerModel([]),
    );

    assert.ok(provisional);
    assert.ok(canonicalSkills[provisional.skillId].grades.includes(grade));

    const generator = getQuestionGenerator(provisional.skillId);
    assert.ok(generator.supportedGrades.includes(grade));
    assert.ok(generator.supportedDifficulties.includes(provisional.difficulty));
  });
}

test('Grade 1 does not use provisional prerequisite bypass', () => {
  assert.equal(selectProvisionalPracticePlan(1, buildLearnerModel([])), null);
});
