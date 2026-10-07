import { buildLearnerModel } from '@/core/adaptive/mastery';
import { recommendPractice } from '@/core/adaptive/recommendation';
import type { LocalSessionStore } from '@/core/session/persistence';
import type { Grade } from '@/core/types';

export interface GradeReadiness {
  targetGrade: Grade;
  previousGrade: Grade | null;
  previousGradeComplete: boolean;
}

export async function evaluateGradeReadiness(
  store: Pick<LocalSessionStore, 'listCompleted'>,
  targetGrade: Grade,
): Promise<GradeReadiness> {
  if (targetGrade === 1) {
    return {
      targetGrade,
      previousGrade: null,
      previousGradeComplete: true,
    };
  }

  const previousGrade = (targetGrade - 1) as Grade;
  const completedSessions = await store.listCompleted();
  const learnerModel = buildLearnerModel(completedSessions);
  const recommendation = recommendPractice(previousGrade, learnerModel);
  const previousGradeComplete =
    recommendation.kind === 'unavailable' &&
    recommendation.reason.code === 'ALL_GRADE_SKILLS_MASTERED';

  return {
    targetGrade,
    previousGrade,
    previousGradeComplete,
  };
}
