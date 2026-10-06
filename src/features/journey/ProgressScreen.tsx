import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '@/features/settings/AppPreferencesContext';
import { localPracticeSessionStore } from '@/infrastructure/storage/expoSqlitePracticeSessionStore';
import { translateAppShell } from '@/localization/appShell';

import {
  loadLearnerJourneySnapshot,
  type LearnerJourneySnapshot,
} from './learnerJourneyHistory';
import type { LearnerJourneyGradeSummary } from './learnerJourneyModel';

function practiceStatusKey(summary: LearnerJourneyGradeSummary) {
  if (summary.recommendation.kind === 'practice') {
    return 'progress.nextAvailable' as const;
  }

  switch (summary.recommendation.reason.code) {
    case 'ALL_GRADE_SKILLS_MASTERED':
      return 'progress.gradeComplete' as const;
    case 'NO_CURRICULUM_ELIGIBLE_UNMASTERED_SKILL':
      return 'progress.nextUnavailable' as const;
    case 'NO_PRACTICABLE_CURRICULUM_ELIGIBLE_SKILL':
      return 'progress.noActivity' as const;
  }
}

export function ProgressScreen() {
  const { preferences } = useAppPreferences();
  const { locale } = preferences;
  const [snapshot, setSnapshot] = useState<LearnerJourneySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadLearnerJourneySnapshot(localPracticeSessionStore)
      .then((nextSnapshot) => {
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setError(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const retryProgress = useCallback(async () => {
    setLoading(true);

    try {
      const nextSnapshot = await loadLearnerJourneySnapshot(
        localPracticeSessionStore,
      );
      setSnapshot(nextSnapshot);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateText}>
          {translateAppShell(locale, 'progress.loading')}
        </Text>
      </View>
    );
  }

  if (error || snapshot === null) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.errorText}>
          {translateAppShell(locale, 'progress.error')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retryProgress()}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>
            {translateAppShell(locale, 'progress.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>
          {translateAppShell(locale, 'progress.eyebrow')}
        </Text>
        <Text style={styles.title}>
          {translateAppShell(locale, 'progress.title')}
        </Text>
        <Text style={styles.subtitle}>
          {translateAppShell(locale, 'progress.subtitle')}
        </Text>

        <View style={styles.overviewCard}>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>
              {snapshot.completedSessionCount}
            </Text>
            <Text style={styles.overviewLabel}>
              {translateAppShell(locale, 'progress.completedSessions')}
            </Text>
          </View>
          <View style={styles.overviewItem}>
            <Text style={styles.overviewValue}>{snapshot.evidenceCount}</Text>
            <Text style={styles.overviewLabel}>
              {translateAppShell(locale, 'progress.completedQuestions')}
            </Text>
          </View>
        </View>

        <View style={styles.gradeList}>
          {snapshot.grades.map((summary) => {
            const statusText = translateAppShell(
              locale,
              practiceStatusKey(summary),
            );

            return (
              <View key={summary.grade} style={styles.gradeCard}>
                <View style={styles.gradeHeader}>
                  <Text style={styles.gradeTitle}>
                    {translateAppShell(locale, 'home.gradeTitle', {
                      grade: summary.grade,
                    })}
                  </Text>
                  <Text style={styles.masteredText}>
                    {translateAppShell(locale, 'progress.masteredCount', {
                      mastered: summary.masteredSkillCount,
                      total: summary.canonicalSkillCount,
                    })}
                  </Text>
                </View>

                <View style={styles.countRow}>
                  <View style={styles.countItem}>
                    <Text style={styles.countValue}>
                      {summary.masteredSkillCount}
                    </Text>
                    <Text style={styles.countLabel}>
                      {translateAppShell(locale, 'progress.mastered')}
                    </Text>
                  </View>
                  <View style={styles.countItem}>
                    <Text style={styles.countValue}>
                      {summary.inProgressSkillCount}
                    </Text>
                    <Text style={styles.countLabel}>
                      {translateAppShell(locale, 'progress.inProgress')}
                    </Text>
                  </View>
                  <View style={styles.countItem}>
                    <Text style={styles.countValue}>
                      {summary.unseenSkillCount}
                    </Text>
                    <Text style={styles.countLabel}>
                      {translateAppShell(locale, 'progress.notStarted')}
                    </Text>
                  </View>
                </View>

                <Text
                  accessibilityLabel={statusText}
                  style={[
                    styles.practiceStatus,
                    summary.practiceAvailable
                      ? styles.practiceAvailable
                      : styles.practiceUnavailable,
                  ]}
                >
                  {statusText}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statePage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#F4F7FB',
    padding: 24,
  },
  stateText: {
    color: '#526071',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorText: {
    color: '#B44136',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#315EFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  page: {
    flexGrow: 1,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  container: {
    width: '100%',
    maxWidth: 720,
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
  overviewCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  overviewItem: {
    flex: 1,
    gap: 4,
  },
  overviewValue: {
    color: '#172033',
    fontSize: 30,
    fontWeight: '900',
  },
  overviewLabel: {
    color: '#526071',
    fontSize: 13,
    fontWeight: '700',
  },
  gradeList: {
    gap: 14,
  },
  gradeCard: {
    gap: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  gradeHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  gradeTitle: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '900',
  },
  masteredText: {
    color: '#526071',
    fontSize: 14,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countItem: {
    flex: 1,
    minWidth: 84,
    borderRadius: 16,
    backgroundColor: '#F4F7FB',
    padding: 14,
  },
  countValue: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '900',
  },
  countLabel: {
    color: '#526071',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  practiceStatus: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  practiceAvailable: {
    color: '#157A45',
  },
  practiceUnavailable: {
    color: '#7A5B15',
  },
});
