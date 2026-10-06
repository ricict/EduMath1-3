import { canonicalSkillDefinitions } from '@/core/curriculum/canonicalSkills';
import { recommendPractice } from '@/core/adaptive/recommendation';
import type {
  AdaptiveRecommendation,
  LearnerModel,
} from '@/core/adaptive/types';
import type { Grade, SkillId } from '@/core/types';

export type LearnerJourneySkillState = 'mastered' | 'in-progress' | 'unseen';

export interface LearnerJourneyGradeSummary {
  grade: Grade;
  canonicalSkillCount: number;
  masteredSkillCount: number;
  inProgressSkillCount: number;
  unseenSkillCount: number;
  practiceAvailable: boolean;
  recommendation: AdaptiveRecommendation;
}

function classifySkill(
  model: LearnerModel,
  skillId: SkillId,
): LearnerJourneySkillState {
  const state = model.skills[skillId];

  if (state.status === 'mastered') {
    return 'mastered';
  }

  return state.totalEvidenceCount > 0 ? 'in-progress' : 'unseen';
}

export function buildLearnerJourneyGradeSummary(
  grade: Grade,
  model: LearnerModel,
): LearnerJourneyGradeSummary {
  const gradeSkillIds = canonicalSkillDefinitions
    .filter((skill) => skill.grades.some((skillGrade) => skillGrade === grade))
    .map((skill) => skill.id);

  let masteredSkillCount = 0;
  let inProgressSkillCount = 0;
  let unseenSkillCount = 0;

  for (const skillId of gradeSkillIds) {
    const state = classifySkill(model, skillId);

    if (state === 'mastered') {
      masteredSkillCount += 1;
    } else if (state === 'in-progress') {
      inProgressSkillCount += 1;
    } else {
      unseenSkillCount += 1;
    }
  }

  const recommendation = recommendPractice(grade, model);

  return {
    grade,
    canonicalSkillCount: gradeSkillIds.length,
    masteredSkillCount,
    inProgressSkillCount,
    unseenSkillCount,
    practiceAvailable: recommendation.kind === 'practice',
    recommendation,
  };
}

export function buildLearnerJourney(
  model: LearnerModel,
): readonly LearnerJourneyGradeSummary[] {
  return ([1, 2, 3] as const).map((grade) =>
    buildLearnerJourneyGradeSummary(grade, model),
  );
}
