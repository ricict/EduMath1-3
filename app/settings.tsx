import { Stack } from 'expo-router';

import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { useAppPreferences } from '@/features/settings/AppPreferencesContext';
import { translateAppShell } from '@/localization/appShell';

export default function SettingsRoute() {
  const { preferences } = useAppPreferences();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: translateAppShell(preferences.locale, 'nav.settings'),
        }}
      />
      <SettingsScreen />
    </>
  );
}
