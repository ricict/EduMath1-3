import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLearnerModel } from '../../src/core/adaptive/mastery';
import { recommendPractice } from '../../src/core/adaptive/recommendation';
import type {
  LearnerModel,
  SkillMasteryState,
} from '../../src/core/adaptive/types';
import type { SkillId } from '../../src/core/types';
import {
  buildLearnerJourney,
  buildLearnerJourneyGradeSummary,
} from '../../src/features/journey/learnerJourneyModel';

function withSkillState(
  model: LearnerModel,
  skillId: SkillId,
  patch: Partial<SkillMasteryState>,
): LearnerModel {
  return {
    ...model,
    skills: {
      ...model.skills,
      [skillId]: {
        ...model.skills[skillId],
        ...patch,
      },
    },
  };
}

test('zero-history journey reflects the locked M2 Grade 1–3 catalog sizes', () => {
  const journey = buildLearnerJourney(buildLearnerModel([]));

  assert.deepEqual(
    journey.map((grade) => ({
      grade: grade.grade,
      canonicalSkillCount: grade.canonicalSkillCount,
      masteredSkillCount: grade.masteredSkillCount,
      inProgressSkillCount: grade.inProgressSkillCount,
      unseenSkillCount: grade.unseenSkillCount,
    })),
    [
      {
        grade: 1,
        canonicalSkillCount: 30,
        masteredSkillCount: 0,
        inProgressSkillCount: 0,
        unseenSkillCount: 30,
      },
      {
        grade: 2,
        canonicalSkillCount: 34,
        masteredSkillCount: 0,
        inProgressSkillCount: 0,
        unseenSkillCount: 34,
      },
      {
        grade: 3,
        canonicalSkillCount: 25,
        masteredSkillCount: 0,
        inProgressSkillCount: 0,
        unseenSkillCount: 25,
      },
    ],
  );
});

test('journey projection distinguishes mastered, in-progress, and unseen skills without changing mastery', () => {
  let model = buildLearnerModel([]);

  model = withSkillState(model, 'number_recognition_10', {
    status: 'mastered',
    totalEvidenceCount: 15,
  });
  model = withSkillState(model, 'addition_concept', {
    status: 'insufficient-evidence',
    totalEvidenceCount: 2,
  });
  model = withSkillState(model, 'compare_length', {
    status: 'developing',
    totalEvidenceCount: 5,
  });

  const summary = buildLearnerJourneyGradeSummary(1, model);

  assert.equal(summary.canonicalSkillCount, 30);
  assert.equal(summary.masteredSkillCount, 1);
  assert.equal(summary.inProgressSkillCount, 2);
  assert.equal(summary.unseenSkillCount, 27);

  assert.equal(model.skills.number_recognition_10.status, 'mastered');
  assert.equal(model.skills.addition_concept.totalEvidenceCount, 2);
  assert.equal(model.skills.compare_length.status, 'developing');
});

test('journey projection delegates practice authority to the locked M5 recommendation', () => {
  const model = buildLearnerModel([]);

  for (const grade of [1, 2, 3] as const) {
    const summary = buildLearnerJourneyGradeSummary(grade, model);
    const directRecommendation = recommendPractice(grade, model);

    assert.deepEqual(summary.recommendation, directRecommendation);
    assert.equal(
      summary.practiceAvailable,
      directRecommendation.kind === 'practice',
    );
  }
});

test('zero-history journey exposes current practicability without fabricating blocked Grade 3 practice', () => {
  const model = buildLearnerModel([]);
  const grade1 = buildLearnerJourneyGradeSummary(1, model);
  const grade2 = buildLearnerJourneyGradeSummary(2, model);
  const grade3 = buildLearnerJourneyGradeSummary(3, model);

  assert.equal(grade1.practiceAvailable, true);
  assert.equal(grade1.recommendation.kind, 'practice');
  if (grade1.recommendation.kind === 'practice') {
    assert.equal(grade1.recommendation.skillId, 'number_recognition_10');
  }

  assert.equal(grade2.practiceAvailable, true);
  assert.equal(grade2.recommendation.kind, 'practice');
  if (grade2.recommendation.kind === 'practice') {
    assert.equal(grade2.recommendation.skillId, 'identify_2d_shapes');
  }

  assert.equal(grade3.practiceAvailable, false);
  assert.equal(grade3.recommendation.kind, 'unavailable');
  if (grade3.recommendation.kind === 'unavailable') {
    assert.equal(
      grade3.recommendation.reason.code,
      'NO_CURRICULUM_ELIGIBLE_UNMASTERED_SKILL',
    );
  }
});
