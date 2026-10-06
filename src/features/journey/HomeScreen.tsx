import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Grade } from '@/core/types';

const GRADES = [1, 2, 3] as const satisfies readonly Grade[];

export function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>EduMath Grade 1–3</Text>
        <Text style={styles.title}>10 Minutes Math</Text>
        <Text style={styles.subtitle}>
          Choose your grade. EduMath will use the locked learning path to select
          the next practice that is currently available.
        </Text>

        <Pressable
          accessibilityHint="Open your Grade 1–3 learning progress"
          accessibilityRole="button"
          onPress={() => router.push('/progress')}
          style={styles.progressButton}
        >
          <Text style={styles.progressButtonText}>View learning progress</Text>
        </Pressable>

        <View style={styles.gradeList}>
          {GRADES.map((grade) => (
            <Pressable
              accessibilityHint={`Open the Grade ${grade} practice path`}
              accessibilityRole="button"
              key={grade}
              onPress={() =>
                router.push({
                  pathname: '/practice',
                  params: { grade: String(grade) },
                })
              }
              style={styles.gradeCard}
            >
              <View>
                <Text style={styles.gradeTitle}>Grade {grade}</Text>
                <Text style={styles.gradeDescription}>
                  Start or resume the recommended practice for this learning path.
                </Text>
              </View>
              <Text style={styles.gradeAction}>Practice</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.note}>
          An unfinished local practice session is resumed before a new session is
          created, so existing M4 session state is never silently replaced.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 20,
    paddingVertical: 56,
  },
  container: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: 14,
  },
  eyebrow: {
    color: '#526071',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#172033',
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
  },
  subtitle: {
    color: '#526071',
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 10,
  },
  progressButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#315EFB',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  progressButtonText: {
    color: '#315EFB',
    fontSize: 15,
    fontWeight: '800',
  },
  gradeList: {
    gap: 12,
  },
  gradeCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    borderWidth: 2,
    borderColor: '#D7DFE8',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  gradeTitle: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '900',
  },
  gradeDescription: {
    maxWidth: 410,
    color: '#526071',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  gradeAction: {
    color: '#315EFB',
    fontSize: 16,
    fontWeight: '900',
  },
  note: {
    color: '#738094',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
});
