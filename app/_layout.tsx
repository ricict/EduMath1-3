import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppPreferencesProvider,
  useAppPreferences,
} from '@/features/settings/AppPreferencesContext';

function AppStack() {
  const { ready } = useAppPreferences();

  if (!ready) {
    return (
      <View style={styles.loadingPage}>
        <Text style={styles.loadingText}>EduMath…</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AppPreferencesProvider>
      <StatusBar style="dark" />
      <AppStack />
    </AppPreferencesProvider>
  );
}

const styles = StyleSheet.create({
  loadingPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7FB',
  },
  loadingText: {
    color: '#526071',
    fontSize: 18,
    fontWeight: '800',
  },
});
