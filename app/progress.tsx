import { Stack } from 'expo-router';

import { ProgressScreen } from '@/features/journey/ProgressScreen';

export default function ProgressRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Progress',
        }}
      />
      <ProgressScreen />
    </>
  );
}
