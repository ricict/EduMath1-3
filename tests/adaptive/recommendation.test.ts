import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLearnerModel } from '../../src/core/adaptive/mastery';
import {
  getCurriculumEligibility,
  recommendPractice,
} from '../../src/core/adaptive/recommendation';
import type {
  DifficultyMasteryState,
  LearnerModel,
  SkillMasteryState,
} from '../../src/core/adaptive/types';
import type { Difficulty, SkillId } from '../../src/core/types';

function difficultyState(
  difficulty: Difficulty,
  status: DifficultyMasteryState['status'],
  evidenceCount: number,
): DifficultyMasteryState {
  return {
    difficulty,
    status,
    totalEvidenceCount: evidenceCount,
    recentEvidenceCount: Math.min(evidenceCount, 5),
    recentFirstTryCorrectCount:
      status === 'mastered' ? Math.min(evidenceCount, 5) : 0,
    firstTryAccuracy:
      evidenceCount === 0 ? null : status === 'mastered' ? 1 : 0,
  };
}

function skillState(
  skillId: SkillId,
  status: SkillMasteryState['status'],
  nextDifficulty: Difficulty,
  currentDifficultyEvidenceCount = 0,
): SkillMasteryState {
  const difficulties = ([1, 2, 3] as const).map((difficulty) => {
    const masteredDifficulty =
      status === 'mastered' || difficulty < nextDifficulty;
    const currentDifficulty =
      status !== 'mastered' && difficulty === nextDifficulty;

    return difficultyState(
      difficulty,
      masteredDifficulty
        ? 'mastered'
        : currentDifficulty && currentDifficultyEvidenceCount >= 5
          ? 'developing'
          : 'insufficient-evidence',
      masteredDifficulty
        ? 5
        : currentDifficulty
          ? currentDifficultyEvidenceCount
          : 0,
    );
  }) as [
    DifficultyMasteryState,
    DifficultyMasteryState,
    DifficultyMasteryState,
  ];

  return {
    skillId,
    status,
    totalEvidenceCount:
      status === 'mastered'
        ? 15
        : 5 * (nextDifficulty - 1) + currentDifficultyEvidenceCount,
    nextDifficulty,
    difficulties,
  };
}

function withSkillStates(
  model: LearnerModel,
  states: readonly SkillMasteryState[],
): LearnerModel {
  const skills = { ...model.skills };

  for (const state of states) {
    skills[state.skillId] = state;
  }

  return {
    ...model,
    skills,
  };
}

function mastered(skillId: SkillId): SkillMasteryState {
  return skillState(skillId, 'mastered', 3);
}

test('a new Grade 1 learner gets an explicit unavailable result instead of a prerequisite bypass', () => {
  const recommendation = recommendPractice(1, buildLearnerModel([]));

  assert.equal(recommendation.kind, 'unavailable');
  if (recommendation.kind !== 'unavailable') {
    throw new Error('Expected unavailable recommendation.');
  }

  assert.equal(
    recommendation.reason.code,
    'NO_PRACTICABLE_CURRICULUM_ELIGIBLE_SKILL',
  );
  assert.ok(
    recommendation.reason.generatorUnavailableSkillIds.includes(
      'number_recognition_10',
    ),
  );
  assert.equal(
    recommendation.reason.generatorUnavailableSkillIds.includes(
      'addition_within_10',
    ),
    false,
  );
});

test('transitive prerequisites must all be mastered before a dependent skill is eligible', () => {
  const base = buildLearnerModel([]);
  const partial = withSkillStates(base, [mastered('addition_concept')]);
  const eligibility = getCurriculumEligibility(
    'addition_within_10',
    1,
    partial,
  );

  assert.equal(eligibility.eligible, false);
  assert.ok(
    eligibility.unmetPrerequisiteSkillIds.includes('number_recognition_10'),
  );
});

test('once all prerequisites are mastered, an implemented skill becomes practiceable', () => {
  const model = withSkillStates(buildLearnerModel([]), [
    mastered('number_recognition_10'),
    mastered('addition_concept'),
  ]);

  const recommendation = recommendPractice(1, model);

  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected practice recommendation.');
  }

  assert.equal(recommendation.skillId, 'addition_within_10');
  assert.equal(recommendation.difficulty, 1);
  assert.equal(recommendation.reason.code, 'START_ELIGIBLE_SKILL');
  assert.deepEqual(recommendation.reason.prerequisiteSkillIds, [
    'number_recognition_10',
    'addition_concept',
  ]);
});

test('mastered lower difficulty advances the same skill to the next difficulty', () => {
  const model = withSkillStates(buildLearnerModel([]), [
    mastered('number_recognition_10'),
    mastered('addition_concept'),
    skillState('addition_within_10', 'developing', 2),
  ]);

  const recommendation = recommendPractice(1, model);

  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected practice recommendation.');
  }

  assert.equal(recommendation.skillId, 'addition_within_10');
  assert.equal(recommendation.difficulty, 2);
  assert.equal(recommendation.reason.code, 'ADVANCE_DIFFICULTY');
});

test('existing evidence at the current difficulty is continued instead of counted as mastery', () => {
  const model = withSkillStates(buildLearnerModel([]), [
    mastered('number_recognition_10'),
    mastered('addition_concept'),
    skillState('addition_within_10', 'insufficient-evidence', 1, 3),
  ]);

  const recommendation = recommendPractice(1, model);

  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected practice recommendation.');
  }

  assert.equal(recommendation.difficulty, 1);
  assert.equal(recommendation.reason.code, 'CONTINUE_SKILL');
});

test('topological order deterministically breaks ties between equally new practiceable skills', () => {
  const model = withSkillStates(buildLearnerModel([]), [
    mastered('number_recognition_10'),
    mastered('addition_concept'),
    mastered('subtraction_concept'),
  ]);

  const first = recommendPractice(1, model);
  const second = recommendPractice(1, model);

  assert.deepEqual(first, second);
  assert.equal(first.kind, 'practice');
  if (first.kind !== 'practice') {
    throw new Error('Expected practice recommendation.');
  }

  assert.equal(first.skillId, 'addition_within_10');
});

test('an in-progress eligible skill is prioritized over an equally eligible unseen skill', () => {
  const model = withSkillStates(buildLearnerModel([]), [
    mastered('number_recognition_10'),
    mastered('addition_concept'),
    mastered('subtraction_concept'),
    skillState('subtraction_within_10', 'insufficient-evidence', 1, 2),
  ]);

  const recommendation = recommendPractice(1, model);

  assert.equal(recommendation.kind, 'practice');
  if (recommendation.kind !== 'practice') {
    throw new Error('Expected practice recommendation.');
  }

  assert.equal(recommendation.skillId, 'subtraction_within_10');
  assert.equal(recommendation.reason.code, 'CONTINUE_SKILL');
});
