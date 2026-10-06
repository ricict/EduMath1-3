import {
  canonicalSkillDefinitions,
  canonicalSkills,
} from '../curriculum/canonicalSkills';
import {
  getPrerequisiteClosure,
  topologicallySortSkills,
} from '../curriculum/skillGraph';
import {
  getQuestionGenerator,
  supportsQuestionGeneration,
} from '../question-engine/registry';
import type { Difficulty, Grade, SkillId } from '../types';
import type {
  AdaptiveRecommendation,
  LearnerModel,
  PracticeRecommendation,
} from './types';

function isMastered(model: LearnerModel, skillId: SkillId): boolean {
  return model.skills[skillId].status === 'mastered';
}

export interface CurriculumEligibility {
  eligible: boolean;
  prerequisiteSkillIds: readonly SkillId[];
  unmetPrerequisiteSkillIds: readonly SkillId[];
}

export function getCurriculumEligibility(
  skillId: SkillId,
  grade: Grade,
  model: LearnerModel,
): CurriculumEligibility {
  const skill = canonicalSkills[skillId];

  if (!skill.grades.includes(grade)) {
    return {
      eligible: false,
      prerequisiteSkillIds: [],
      unmetPrerequisiteSkillIds: [],
    };
  }

  const prerequisiteSkillIds = getPrerequisiteClosure(
    skillId,
    canonicalSkillDefinitions,
  );
  const unmetPrerequisiteSkillIds = prerequisiteSkillIds.filter(
    (prerequisiteId) => !isMastered(model, prerequisiteId),
  );

  return {
    eligible: unmetPrerequisiteSkillIds.length === 0,
    prerequisiteSkillIds,
    unmetPrerequisiteSkillIds,
  };
}

function supportsPracticeContext(
  skillId: SkillId,
  grade: Grade,
  difficulty: Difficulty,
): boolean {
  if (!supportsQuestionGeneration(skillId)) {
    return false;
  }

  const generator = getQuestionGenerator(skillId);
  return (
    generator.supportedGrades.includes(grade) &&
    generator.supportedDifficulties.includes(difficulty)
  );
}

function recommendationFor(
  grade: Grade,
  skillId: SkillId,
  model: LearnerModel,
  prerequisiteSkillIds: readonly SkillId[],
): PracticeRecommendation {
  const state = model.skills[skillId];
  const difficultyState = state.difficulties[state.nextDifficulty - 1];

  let code: PracticeRecommendation['reason']['code'] = 'CONTINUE_SKILL';

  if (state.totalEvidenceCount === 0) {
    code = 'START_ELIGIBLE_SKILL';
  } else if (
    difficultyState.totalEvidenceCount === 0 &&
    state.nextDifficulty > 1
  ) {
    code = 'ADVANCE_DIFFICULTY';
  }

  return {
    kind: 'practice',
    grade,
    skillId,
    difficulty: state.nextDifficulty,
    reason: {
      code,
      prerequisiteSkillIds,
      evidenceCountForSkill: state.totalEvidenceCount,
    },
  };
}

export function recommendPractice(
  grade: Grade,
  model: LearnerModel,
): AdaptiveRecommendation {
  const progression = topologicallySortSkills(canonicalSkillDefinitions);
  const gradeSkillIds = progression.filter((skillId) =>
    canonicalSkills[skillId].grades.includes(grade),
  );

  if (gradeSkillIds.every((skillId) => isMastered(model, skillId))) {
    return {
      kind: 'unavailable',
      grade,
      reason: {
        code: 'ALL_GRADE_SKILLS_MASTERED',
        curriculumEligibleSkillIds: [],
        generatorUnavailableSkillIds: [],
        generatorContextUnavailableSkillIds: [],
      },
    };
  }

  const curriculumEligible = gradeSkillIds
    .filter((skillId) => !isMastered(model, skillId))
    .map((skillId) => ({
      skillId,
      eligibility: getCurriculumEligibility(skillId, grade, model),
    }))
    .filter((item) => item.eligibility.eligible);

  if (curriculumEligible.length === 0) {
    return {
      kind: 'unavailable',
      grade,
      reason: {
        code: 'NO_CURRICULUM_ELIGIBLE_UNMASTERED_SKILL',
        curriculumEligibleSkillIds: [],
        generatorUnavailableSkillIds: [],
        generatorContextUnavailableSkillIds: [],
      },
    };
  }

  const generatorUnavailableSkillIds = curriculumEligible
    .map((item) => item.skillId)
    .filter((skillId) => !supportsQuestionGeneration(skillId));

  const generatorContextUnavailableSkillIds = curriculumEligible
    .map((item) => item.skillId)
    .filter(
      (skillId) =>
        supportsQuestionGeneration(skillId) &&
        !supportsPracticeContext(
          skillId,
          grade,
          model.skills[skillId].nextDifficulty,
        ),
    );

  const practicable = curriculumEligible.filter((item) =>
    supportsPracticeContext(
      item.skillId,
      grade,
      model.skills[item.skillId].nextDifficulty,
    ),
  );

  if (practicable.length === 0) {
    return {
      kind: 'unavailable',
      grade,
      reason: {
        code: 'NO_PRACTICABLE_CURRICULUM_ELIGIBLE_SKILL',
        curriculumEligibleSkillIds: curriculumEligible.map(
          (item) => item.skillId,
        ),
        generatorUnavailableSkillIds,
        generatorContextUnavailableSkillIds,
      },
    };
  }

  const inProgress = practicable.filter(
    (item) => model.skills[item.skillId].totalEvidenceCount > 0,
  );
  const selected = (inProgress.length > 0 ? inProgress : practicable)[0];

  return recommendationFor(
    grade,
    selected.skillId,
    model,
    selected.eligibility.prerequisiteSkillIds,
  );
}
