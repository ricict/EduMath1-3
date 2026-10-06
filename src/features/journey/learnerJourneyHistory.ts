import { loadLearnerModel } from '@/core/adaptive/history';
import type { LocalSessionStore } from '@/core/session/persistence';

import {
  buildLearnerJourney,
  type LearnerJourneyGradeSummary,
} from './learnerJourneyModel';

export interface LearnerJourneySnapshot {
  completedSessionCount: number;
  evidenceCount: number;
  grades: readonly LearnerJourneyGradeSummary[];
}

export async function loadLearnerJourneySnapshot(
  store: Pick<LocalSessionStore, 'listCompleted'>,
): Promise<LearnerJourneySnapshot> {
  const model = await loadLearnerModel(store);

  return {
    completedSessionCount: model.completedSessionCount,
    evidenceCount: model.evidenceCount,
    grades: buildLearnerJourney(model),
  };
}
