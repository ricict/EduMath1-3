import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLearnerModel } from '../../src/core/adaptive/mastery';
import { recommendPractice } from '../../src/core/adaptive/recommendation';
import { canonicalSkills } from '../../src/core/curriculum/canonicalSkills';
import { getQuestionGenerator } from '../../src/core/question-engine/registry';
import { selectProvisionalPracticePlan } from '../../src/features/practice/provisionalPractice';

for (const grade of [2, 3] as const) {
  test(`Grade ${grade} has a provisional curriculum practice when prerequisites are incomplete`, () => {
    const model = buildLearnerModel([]);
    const standard = recommendPractice(grade, model);
    const provisional = selectProvisionalPracticePlan(grade, model);

    assert.equal(standard.kind, 'unavailable');
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
