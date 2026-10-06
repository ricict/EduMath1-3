import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APP_PREFERENCES_SCHEMA_VERSION,
  DEFAULT_APP_PREFERENCES,
  createAppPreferencesStore,
  type AppPreferenceStorage,
} from '../../src/features/settings/appPreferences';

class MemoryStorage implements AppPreferenceStorage {
  readonly values = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

test('M7 preferences default independently of M4 practice-session persistence', async () => {
  const storage = new MemoryStorage();
  const store = createAppPreferencesStore(storage);

  assert.deepEqual(await store.load(), DEFAULT_APP_PREFERENCES);
  assert.equal(storage.values.size, 0);
});

test('M7 preferences persist locale and selected grade in a dedicated namespace', async () => {
  const storage = new MemoryStorage();
  const store = createAppPreferencesStore(storage);

  await store.save({
    schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
    locale: 'th',
    selectedGrade: 3,
  });

  assert.deepEqual(await store.load(), {
    schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
    locale: 'th',
    selectedGrade: 3,
  });

  const keys = [...storage.values.keys()];
  assert.equal(keys.length, 1);
  assert.match(keys[0], /^edumath:m7:/);
  assert.doesNotMatch(keys[0], /edumath:m4:/);
});

test('M7 preferences reject corrupted or non-canonical stored values', async () => {
  const invalidPayloads = [
    '{not-json',
    JSON.stringify({ schemaVersion: 99, locale: 'en', selectedGrade: 1 }),
    JSON.stringify({ schemaVersion: 1, locale: 'fr', selectedGrade: 1 }),
    JSON.stringify({ schemaVersion: 1, locale: 'en', selectedGrade: 4 }),
  ];

  for (const payload of invalidPayloads) {
    const storage = new MemoryStorage();
    storage.values.set('edumath:m7:app-preferences:v1', payload);
    const store = createAppPreferencesStore(storage);

    await assert.rejects(() => store.load());
  }
});
