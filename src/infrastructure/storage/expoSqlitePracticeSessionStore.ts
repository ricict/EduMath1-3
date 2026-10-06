import Storage from 'expo-sqlite/kv-store';

import {
  createLocalSessionStore,
  type LocalSessionStore,
} from '@/core/session/persistence';

/**
 * Device-local M4 practice-session persistence.
 *
 * The domain store remains storage-agnostic. This adapter binds the minimal
 * KeyValueStorage contract to Expo SQLite's persistent key-value store.
 */
export const localPracticeSessionStore: LocalSessionStore =
  createLocalSessionStore(Storage);
