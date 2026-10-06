import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Grade } from '@/core/types';
import type { Locale } from '@/localization';
import { localAppPreferencesStore } from '@/infrastructure/storage/expoSqliteAppPreferencesStore';

import {
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
} from './appPreferences';

interface AppPreferencesContextValue {
  ready: boolean;
  preferences: AppPreferences;
  storageError: boolean;
  setLocale(locale: Locale): Promise<void>;
  setSelectedGrade(grade: Grade): Promise<void>;
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(
  null,
);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState<AppPreferences>(
    DEFAULT_APP_PREFERENCES,
  );
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void localAppPreferencesStore
      .load()
      .then((restored) => {
        if (!cancelled) {
          setPreferences(restored);
          setStorageError(false);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStorageError(true);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (nextPreferences: AppPreferences) => {
    setPreferences(nextPreferences);

    try {
      await localAppPreferencesStore.save(nextPreferences);
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, []);

  const setLocale = useCallback(
    async (locale: Locale) => {
      await persist({ ...preferences, locale });
    },
    [persist, preferences],
  );

  const setSelectedGrade = useCallback(
    async (selectedGrade: Grade) => {
      await persist({ ...preferences, selectedGrade });
    },
    [persist, preferences],
  );

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      ready,
      preferences,
      storageError,
      setLocale,
      setSelectedGrade,
    }),
    [preferences, ready, setLocale, setSelectedGrade, storageError],
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences(): AppPreferencesContextValue {
  const value = useContext(AppPreferencesContext);

  if (value === null) {
    throw new Error(
      'useAppPreferences must be used inside AppPreferencesProvider.',
    );
  }

  return value;
}
