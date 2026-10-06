import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { parsePracticeGradeParam } from '@/features/journey/gradeRoute';
import { PracticeScreen } from '@/features/practice/PracticeScreen';

export default function PracticeRoute() {
  const params = useLocalSearchParams<{ grade?: string | string[] }>();
  const grade = parsePracticeGradeParam(params.grade);

  if (grade === null) {
    return (
      <View style={styles.invalidPage}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Practice',
          }}
        />
        <Text style={styles.invalidTitle}>Choose a valid Grade 1–3 practice path.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>Back to home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Grade ${grade} Practice`,
        }}
      />
      <PracticeScreen grade={grade} />
    </>
  );
}

const styles = StyleSheet.create({
  invalidPage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#F4F7FB',
    padding: 24,
  },
  invalidTitle: {
    color: '#172033',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#315EFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
