import { buildLearnerModel } from '@/core/adaptive/mastery';
import { canonicalSkills } from '@/core/curriculum/canonicalSkills';
import type { LocalSessionStore } from '@/core/session/persistence';
import type { Grade } from '@/core/types';

export const MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH = 3;

export interface GradeSwitchDecision {
  allowed: boolean;
  currentGrade: Grade;
  targetGrade: Grade;
  masteredLevelCount: number;
  minimumMasteredLevelCount: number;
}

function countMasteredLevels(
  grade: Grade,
  completedSessions: Awaited<ReturnType<LocalSessionStore['listCompleted']>>,
): number {
  const gradeHistory = completedSessions.filter(
    (session) => session.plan.grade === grade,
  );

  if (gradeHistory.length === 0) {
    return 0;
  }

  const model = buildLearnerModel(gradeHistory);

  return Object.values(model.skills).reduce((total, state) => {
    if (!canonicalSkills[state.skillId].grades.includes(grade)) {
      return total;
    }

    return (
      total +
      state.difficulties.filter((difficulty) => difficulty.status === 'mastered')
        .length
    );
  }, 0);
}

export async function evaluateGradeSwitch(
  store: Pick<LocalSessionStore, 'listCompleted' | 'loadResumable'>,
  currentGrade: Grade,
  targetGrade: Grade,
): Promise<GradeSwitchDecision> {
  if (currentGrade === targetGrade) {
    return {
      allowed: true,
      currentGrade,
      targetGrade,
      masteredLevelCount: MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH,
      minimumMasteredLevelCount: MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH,
    };
  }

  const [completedSessions, resumable] = await Promise.all([
    store.listCompleted(),
    store.loadResumable(currentGrade),
  ]);
  const currentGradeHistory = completedSessions.filter(
    (session) => session.plan.grade === currentGrade,
  );
  const started = resumable !== null || currentGradeHistory.length > 0;
  const masteredLevelCount = countMasteredLevels(
    currentGrade,
    completedSessions,
  );

  return {
    allowed:
      !started ||
      masteredLevelCount >= MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH,
    currentGrade,
    targetGrade,
    masteredLevelCount,
    minimumMasteredLevelCount: MIN_MASTERED_LEVELS_BEFORE_GRADE_SWITCH,
  };
}
