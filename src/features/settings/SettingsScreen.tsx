import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Grade } from '@/core/types';
import { evaluateGradeSwitch } from '@/features/journey/gradeSwitchPolicy';
import { localPracticeSessionStore } from '@/infrastructure/storage/expoSqlitePracticeSessionStore';
import { translateAppShell } from '@/localization/appShell';

import { useAppPreferences } from './AppPreferencesContext';

const LOCALES = ['en', 'id', 'th'] as const;
const GRADES = [1, 2, 3] as const satisfies readonly Grade[];

export function SettingsScreen() {
  const {
    preferences,
    setLocale,
    setSelectedGrade,
    storageError,
  } = useAppPreferences();
  const { locale, selectedGrade } = preferences;

  const chooseGrade = async (grade: Grade) => {
    const decision = await evaluateGradeSwitch(
      localPracticeSessionStore,
      selectedGrade,
      grade,
    );

    if (!decision.allowed) {
      Alert.alert(
        translateAppShell(locale, 'gradeSwitch.blockedTitle'),
        translateAppShell(locale, 'gradeSwitch.blockedMessage', {
          grade: decision.currentGrade,
          completed: decision.masteredLevelCount,
          minimum: decision.minimumMasteredLevelCount,
        }),
        [{ text: translateAppShell(locale, 'gradeSwitch.ok') }],
      );
      return;
    }

    await setSelectedGrade(grade);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>
          {translateAppShell(locale, 'settings.eyebrow')}
        </Text>
        <Text style={styles.title}>
          {translateAppShell(locale, 'settings.title')}
        </Text>
        <Text style={styles.subtitle}>
          {translateAppShell(locale, 'settings.subtitle')}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {translateAppShell(locale, 'settings.languageTitle')}
          </Text>
          <Text style={styles.cardDescription}>
            {translateAppShell(locale, 'settings.languageDescription')}
          </Text>
          <View style={styles.optionRow}>
            {LOCALES.map((option) => {
              const selected = locale === option;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option}
                  onPress={() => void setLocale(option)}
                  style={[styles.optionButton, selected && styles.optionSelected]}
                >
                  <Text style={styles.optionText}>{option.toUpperCase()}</Text>
                  {selected ? (
                    <Text style={styles.selectedText}>
                      {translateAppShell(locale, 'settings.selected')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {translateAppShell(locale, 'settings.gradeTitle')}
          </Text>
          <Text style={styles.cardDescription}>
            {translateAppShell(locale, 'settings.gradeDescription')}
          </Text>
          <View style={styles.optionRow}>
            {GRADES.map((grade) => {
              const selected = selectedGrade === grade;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={grade}
                  onPress={() => void chooseGrade(grade)}
                  style={[styles.optionButton, selected && styles.optionSelected]}
                >
                  <Text style={styles.optionText}>
                    {translateAppShell(locale, 'home.gradeTitle', { grade })}
                  </Text>
                  {selected ? (
                    <Text style={styles.selectedText}>
                      {translateAppShell(locale, 'settings.selected')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {storageError ? (
          <Text style={styles.errorText}>
            {translateAppShell(locale, 'settings.storageError')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  container: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 16,
  },
  eyebrow: {
    color: '#526071',
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: '#172033',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '900',
  },
  subtitle: {
    color: '#526071',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  cardTitle: {
    color: '#172033',
    fontSize: 22,
    fontWeight: '900',
  },
  cardDescription: {
    color: '#526071',
    fontSize: 14,
    lineHeight: 21,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  optionButton: {
    minWidth: 96,
    gap: 4,
    borderWidth: 2,
    borderColor: '#D7DFE8',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    borderColor: '#315EFB',
    backgroundColor: '#EAF0FF',
  },
  optionText: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  selectedText: {
    color: '#315EFB',
    fontSize: 11,
    fontWeight: '800',
  },
  errorText: {
    color: '#B44136',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
});
