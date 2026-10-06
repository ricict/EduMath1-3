import type { Grade } from '@/core/types';
import type { Locale } from '@/localization';

export const APP_PREFERENCES_SCHEMA_VERSION = 1 as const;

const APP_PREFERENCES_STORAGE_KEY = 'edumath:m7:app-preferences:v1';
const LOCALES = ['en', 'id', 'th'] as const satisfies readonly Locale[];
const GRADES = [1, 2, 3] as const satisfies readonly Grade[];

export interface AppPreferences {
  schemaVersion: typeof APP_PREFERENCES_SCHEMA_VERSION;
  locale: Locale;
  selectedGrade: Grade;
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
  locale: 'en',
  selectedGrade: 1,
};

export interface AppPreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface AppPreferencesStore {
  load(): Promise<AppPreferences>;
  save(preferences: AppPreferences): Promise<void>;
}

function isMember<T extends string | number>(
  value: unknown,
  allowed: readonly T[],
): value is T {
  return allowed.some((candidate) => candidate === value);
}

function parseAppPreferences(serialized: string): AppPreferences {
  let parsed: unknown;

  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new Error('Persisted app preferences are not valid JSON.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Persisted app preferences must be an object.');
  }

  const record = parsed as Record<string, unknown>;

  if (record.schemaVersion !== APP_PREFERENCES_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported app preferences schema version: ${String(record.schemaVersion)}.`,
    );
  }

  if (!isMember(record.locale, LOCALES)) {
    throw new Error('Persisted app locale is invalid.');
  }

  if (!isMember(record.selectedGrade, GRADES)) {
    throw new Error('Persisted selected grade is invalid.');
  }

  return {
    schemaVersion: APP_PREFERENCES_SCHEMA_VERSION,
    locale: record.locale,
    selectedGrade: record.selectedGrade,
  };
}

function serializeAppPreferences(preferences: AppPreferences): string {
  if (preferences.schemaVersion !== APP_PREFERENCES_SCHEMA_VERSION) {
    throw new Error('App preferences schema version is invalid.');
  }
  if (!isMember(preferences.locale, LOCALES)) {
    throw new Error('App locale is invalid.');
  }
  if (!isMember(preferences.selectedGrade, GRADES)) {
    throw new Error('Selected grade is invalid.');
  }

  return JSON.stringify(preferences);
}

export function createAppPreferencesStore(
  storage: AppPreferenceStorage,
): AppPreferencesStore {
  return {
    async load() {
      const serialized = await storage.getItem(APP_PREFERENCES_STORAGE_KEY);
      return serialized === null
        ? DEFAULT_APP_PREFERENCES
        : parseAppPreferences(serialized);
    },

    async save(nextPreferences) {
      await storage.setItem(
        APP_PREFERENCES_STORAGE_KEY,
        serializeAppPreferences(nextPreferences),
      );
    },
  };
}
