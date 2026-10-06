import Storage from 'expo-sqlite/kv-store';

import { createAppPreferencesStore } from '@/features/settings/appPreferences';

export const localAppPreferencesStore = createAppPreferencesStore(Storage);
