import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Grade } from '@/core/types';
import { useAppPreferences } from '@/features/settings/AppPreferencesContext';
import { translate } from '@/localization';
import { translateAppShell } from '@/localization/appShell';


const GRADES = [1, 2, 3] as const satisfies readonly Grade[];

export function HomeScreen() {
  const { preferences, setSelectedGrade } = useAppPreferences();
  const { locale, selectedGrade } = preferences;

  const openPractice = async (grade: Grade) => {
    await setSelectedGrade(grade);
    router.push({
      pathname: '/practice',
      params: { grade: String(grade) },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>
          {translateAppShell(locale, 'home.eyebrow')}
        </Text>
        <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
        <Text style={styles.subtitle}>
          {translateAppShell(locale, 'home.subtitle')}
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/progress')}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>
              {translateAppShell(locale, 'home.viewProgress')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>
              {translateAppShell(locale, 'home.openSettings')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.gradeList}>
          {GRADES.map((grade) => {
            const selected = selectedGrade === grade;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={grade}
                onPress={() => void openPractice(grade)}
                style={[styles.gradeCard, selected && styles.gradeCardSelected]}
              >
                <View style={styles.gradeCopy}>
                  <View style={styles.gradeTitleRow}>
                    <Text style={styles.gradeTitle}>
                      {translateAppShell(locale, 'home.gradeTitle', { grade })}
                    </Text>
                    {selected ? (
                      <Text style={styles.selectedBadge}>
                        {translateAppShell(locale, 'home.selected')}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.gradeDescription}>
                    {translateAppShell(locale, 'home.gradeDescription')}
                  </Text>
                </View>
                <Text style={styles.gradeAction}>
                  {translateAppShell(locale, 'home.practice')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.note}>
          {translateAppShell(locale, 'home.resumeNote')}
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
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryAction: {
    borderWidth: 1,
    borderColor: '#315EFB',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  secondaryActionText: {
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
  gradeCardSelected: {
    borderColor: '#315EFB',
    backgroundColor: '#F7F9FF',
  },
  gradeCopy: {
    flex: 1,
  },
  gradeTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  gradeTitle: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '900',
  },
  selectedBadge: {
    color: '#315EFB',
    backgroundColor: '#EAF0FF',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '800',
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
