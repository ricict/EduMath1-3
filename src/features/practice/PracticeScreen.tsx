import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { renderQuestionPrompt, translate, type Locale } from '@/localization';

import {
  formatPracticeAnswerText,
  getPracticeAnswerOptions,
  isSamePracticeAnswer,
  practiceAnswerKey,
} from './answerInteraction';
import type { PracticeScreenAnswer } from './practiceCompatibility';
import { VisualQuestion } from './visual/VisualQuestion';
import { type PracticeUnavailableReason, usePracticeSession } from './usePracticeSession';

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function renderUnavailableMessage(
  locale: Locale,
  reason: PracticeUnavailableReason,
): string {
  if (reason.kind === 'question-type') {
    return translate(locale, 'status.unsupportedPracticeType');
  }

  switch (reason.code) {
    case 'ALL_GRADE_SKILLS_MASTERED':
      return translate(locale, 'status.allGradeSkillsMastered');
    case 'NO_CURRICULUM_ELIGIBLE_UNMASTERED_SKILL':
      return translate(locale, 'status.noCurriculumEligiblePractice');
    case 'NO_PRACTICABLE_CURRICULUM_ELIGIBLE_SKILL':
      return translate(locale, 'status.noPracticableSkill');
  }
}

function renderAnswerAccessibilityLabel(
  locale: Locale,
  answer: PracticeScreenAnswer,
): string {
  if (answer.kind === 'numeric') {
    return String(answer.value);
  }

  if (answer.kind === 'relation') {
    const key =
      answer.value === 'less-than'
        ? 'answer.relationLessThan'
        : answer.value === 'equal'
          ? 'answer.relationEqual'
          : 'answer.relationGreaterThan';

    return translate(locale, key);
  }

  if (answer.kind === 'fraction') {
    return translate(locale, 'answer.fractionLabel', {
      numerator: answer.value.numerator,
      denominator: answer.value.denominator,
    });
  }

  return translate(locale, 'answer.timeLabel', {
    hour: answer.value.hour,
    minute: answer.value.minute.toString().padStart(2, '0'),
  });
}

export function PracticeScreen() {
  const [locale, setLocale] = useState<Locale>('en');
  const [selectedAnswer, setSelectedAnswer] =
    useState<PracticeScreenAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const practice = usePracticeSession();

  const resetAnswerUi = () => {
    setSelectedAnswer(null);
    setChecked(false);
    setLastResult(null);
  };

  const checkAnswer = async () => {
    if (selectedAnswer === null) {
      return;
    }

    let correct: boolean;

    switch (selectedAnswer.kind) {
      case 'numeric':
        correct = await practice.submitNumericAnswer(selectedAnswer.value);
        break;
      case 'relation':
        correct = await practice.submitRelationAnswer(selectedAnswer.value);
        break;
      case 'fraction':
        correct = await practice.submitFractionAnswer(selectedAnswer.value);
        break;
      case 'time':
        correct = await practice.submitTimeAnswer(selectedAnswer.value);
        break;
    }

    setChecked(true);
    setLastResult(correct);
  };

  const nextQuestion = async () => {
    await practice.nextQuestion();
    resetAnswerUi();
  };

  const finishSession = async () => {
    await practice.finishSession();
    resetAnswerUi();
  };

  const startNewSession = async () => {
    await practice.startNewSession();
    resetAnswerUi();
  };

  if (practice.loading) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateText}>{translate(locale, 'status.loading')}</Text>
      </View>
    );
  }

  if (practice.unavailable) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateText}>
          {renderUnavailableMessage(locale, practice.unavailable)}
        </Text>
      </View>
    );
  }

  if (practice.error && !practice.session) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.validationError}>
          {translate(locale, 'status.persistenceError')}
        </Text>
      </View>
    );
  }

  if (practice.session?.status === 'completed') {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>EduMath Grade 1–3 · M4</Text>
          <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
          <View style={styles.card}>
            <Text style={styles.completedTitle}>
              {translate(locale, 'feedback.sessionComplete')}
            </Text>
            <Text style={styles.progress}>
              {translate(locale, 'label.activePractice', {
                elapsed: formatDuration(practice.activeDurationMs),
                target: formatDuration(practice.session.plan.targetDurationMs),
              })}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void startNewSession()}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {translate(locale, 'action.startNew')}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (!practice.session || !practice.question) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.validationError}>
          {translate(locale, 'status.persistenceError')}
        </Text>
      </View>
    );
  }

  const answerOptions = getPracticeAnswerOptions(practice.question);
  if (answerOptions === null) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateText}>
          {translate(locale, 'status.unsupportedPracticeType')}
        </Text>
      </View>
    );
  }

  const canFinish = checked && lastResult === true;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>EduMath Grade 1–3 · M4</Text>
        <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
        <Text style={styles.subtitle}>
          {translate(locale, 'label.practicePlan', {
            grade: practice.session.plan.grade,
            difficulty: practice.session.plan.difficulty,
          })}
        </Text>

        <View style={styles.languageRow}>
          <Text style={styles.languageLabel}>{translate(locale, 'label.language')}</Text>
          {(['en', 'id', 'th'] as const).map((option) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: locale === option }}
              key={option}
              onPress={() => setLocale(option)}
              style={[styles.languageButton, locale === option && styles.languageButtonSelected]}
            >
              <Text style={styles.languageButtonText}>{option.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sessionMeta}>
          <Text style={styles.progress}>
            {translate(locale, 'label.questionCount', {
              count: practice.session.attempts.length,
            })}
          </Text>
          <Text style={styles.progress}>
            {translate(locale, 'label.activePractice', {
              elapsed: formatDuration(practice.activeDurationMs),
              target: formatDuration(practice.session.plan.targetDurationMs),
            })}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.question}>
            {renderQuestionPrompt(practice.question, locale)}
          </Text>

          <VisualQuestion question={practice.question} locale={locale} />

          <View style={styles.answerGrid}>
            {answerOptions.map((answer) => {
              const selected = isSamePracticeAnswer(selectedAnswer, answer);

              return (
                <Pressable
                  accessibilityLabel={renderAnswerAccessibilityLabel(locale, answer)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={practiceAnswerKey(answer)}
                  onPress={() => {
                    setSelectedAnswer(answer);
                    setChecked(false);
                    setLastResult(null);
                  }}
                  style={[styles.answerButton, selected && styles.answerButtonSelected]}
                >
                  <Text style={styles.answerText}>
                    {formatPracticeAnswerText(answer)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {checked && selectedAnswer !== null && lastResult !== null ? (
            <Text style={[styles.feedback, lastResult ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
              {translate(locale, lastResult ? 'feedback.correct' : 'feedback.incorrect')}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={selectedAnswer === null}
            onPress={() => void (canFinish ? nextQuestion() : checkAnswer())}
            style={[styles.primaryButton, selectedAnswer === null && styles.primaryButtonDisabled]}
          >
            <Text style={styles.primaryButtonText}>
              {translate(locale, canFinish ? 'action.next' : 'action.check')}
            </Text>
          </Pressable>

          {canFinish ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void finishSession()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {translate(locale, 'action.finish')}
              </Text>
            </Pressable>
          ) : null}

          {practice.error ? (
            <Text style={styles.validationError}>
              {translate(locale, 'status.persistenceError')}
            </Text>
          ) : null}
        </View>

        <Text style={styles.seed}>
          Session: {practice.session.id} · Seed: {practice.session.sessionSeed}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statePage: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    color: '#526071',
    fontSize: 16,
    fontWeight: '700',
  },
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
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    color: '#526071',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#172033',
  },
  subtitle: {
    fontSize: 16,
    color: '#526071',
    marginBottom: 14,
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  languageLabel: {
    color: '#526071',
    fontWeight: '600',
    marginRight: 4,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#C7D0DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  languageButtonSelected: {
    borderColor: '#315EFB',
    backgroundColor: '#EAF0FF',
  },
  languageButtonText: {
    color: '#172033',
    fontWeight: '700',
  },
  sessionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  progress: {
    color: '#526071',
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    gap: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  completedTitle: {
    color: '#157A45',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  question: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
    fontWeight: '800',
    color: '#172033',
  },
  answerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  answerButton: {
    minWidth: 56,
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D7DFE8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  answerButtonSelected: {
    borderColor: '#315EFB',
    backgroundColor: '#EAF0FF',
  },
  answerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
  },
  feedback: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  feedbackCorrect: {
    color: '#157A45',
  },
  feedbackIncorrect: {
    color: '#B44136',
  },
  primaryButton: {
    backgroundColor: '#315EFB',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#C7D0DC',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#526071',
    fontSize: 16,
    fontWeight: '800',
  },
  validationError: {
    color: '#B44136',
    fontWeight: '700',
    textAlign: 'center',
  },
  seed: {
    textAlign: 'center',
    marginTop: 4,
    color: '#738094',
    fontSize: 12,
  },
});
