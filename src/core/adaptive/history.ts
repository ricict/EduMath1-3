import type { LocalSessionStore } from '../session/persistence';
import { buildLearnerModel } from './mastery';
import type { LearnerModel } from './types';

export async function loadLearnerModel(
  store: Pick<LocalSessionStore, 'listCompleted'>,
): Promise<LearnerModel> {
  const completedSessions = await store.listCompleted();
  return buildLearnerModel(completedSessions);
}
