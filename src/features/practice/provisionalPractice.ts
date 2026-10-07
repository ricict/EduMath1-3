import type { LearnerModel } from '@/core/adaptive/types';
import {
  canonicalSkillDefinitions,
  canonicalSkills,
} from '@/core/curriculum/canonicalSkills';
import { topologicallySortSkills } from '@/core/curriculum/skillGraph';
import {
  getQuestionGenerator,
  supportsQuestionGeneration,
} from '@/core/question-engine/registry';
import type { Difficulty, Grade, SkillId } from '@/core/types';

export interface ProvisionalPracticePlan {
  skillId: SkillId;
  difficulty: Difficulty;
}

function supportsProvisionalContext(
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

export function selectProvisionalPracticePlan(
  grade: Grade,
  model: LearnerModel,
): ProvisionalPracticePlan | null {
  if (grade === 1) {
    return null;
  }

  const progression = topologicallySortSkills(canonicalSkillDefinitions);
  const candidates = progression.filter((skillId) => {
    const skill = canonicalSkills[skillId];
    const state = model.skills[skillId];

    return (
      skill.grades.includes(grade) &&
      state.status !== 'mastered' &&
      supportsProvisionalContext(skillId, grade, state.nextDifficulty)
    );
  });

  const inProgress = candidates.filter(
    (skillId) => model.skills[skillId].totalEvidenceCount > 0,
  );
  const selected = (inProgress.length > 0 ? inProgress : candidates)[0];

  if (!selected) {
    return null;
  }

  return {
    skillId: selected,
    difficulty: model.skills[selected].nextDifficulty,
  };
}
