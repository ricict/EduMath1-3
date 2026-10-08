import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Grade } from '@/core/types';
import { useAppPreferences } from '@/features/settings/AppPreferencesContext';
import {
  renderQuestionPrompt,
  translate,
  translateNumberWord,
  translateShapeName,
  type Locale,
} from '@/localization';
import { translateAppShell } from '@/localization/appShell';

import {
  formatPracticeAnswerText,
  getCorrectPracticeAnswer,
  getPracticeAnswerOptions,
  isSamePracticeAnswer,
  practiceAnswerKey,
} from './answerInteraction';
import type { PracticeScreenAnswer } from './practiceCompatibility';
import { VisualQuestion } from './visual/VisualQuestion';
import { type PracticeUnavailableReason, usePracticeSession } from './usePracticeSession';

// Enabled only in cloud-built M8.2 physical-test APKs. Production builds
// must not expose raw local error messages or child-facing debug metadata.
const SHOW_TEST_DIAGNOSTICS =
  process.env.EXPO_PUBLIC_ENABLE_TEST_DIAGNOSTICS === '1';

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
  question: Parameters<typeof renderQuestionPrompt>[0],
): string {
  if (answer.kind === 'numeric') {
    return question.data.operation === 'number-recognition'
      ? translateNumberWord(locale, answer.value)
      : String(answer.value);
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

  if (answer.kind === 'shape') {
    return translate(locale, 'answer.shapeLabel', {
      shape: translateShapeName(locale, answer.value),
    });
  }

  return translate(locale, 'answer.timeLabel', {
    hour: answer.value.hour,
    minute: answer.value.minute.toString().padStart(2, '0'),
  });
}

export function PracticeScreen({ grade }: { grade: Grade }) {
  const { preferences } = useAppPreferences();
  const { locale } = preferences;
  const [selectedAnswer, setSelectedAnswer] =
    useState<PracticeScreenAnswer | null>(null);
  const [checked, setChecked] = useState(false);
  const [lastResult, setLastResult] = useState<boolean | null>(null);

  const practice = usePracticeSession(grade);
  const readiness = practice.gradeReadiness;
  const gradeAdvisory =
    readiness !== null &&
    readiness.previousGrade !== null &&
    !readiness.previousGradeComplete ? (
      <View style={styles.advisoryCard}>
        <Text style={styles.advisoryTitle}>
          {translate(locale, 'advisory.previousGradeTitle', {
            grade: readiness.previousGrade,
          })}
        </Text>
        <Text style={styles.advisoryMessage}>
          {translate(locale, 'advisory.previousGradeMessage', {
            grade: readiness.previousGrade,
            targetGrade: readiness.targetGrade,
          })}
        </Text>
      </View>
    ) : null;

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
      case 'shape':
        correct = await practice.submitShapeAnswer(selectedAnswer.value);
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

  const continueAfterLevel = async () => {
    resetAnswerUi();
    await practice.continueAfterLevel();
  };

  if (practice.loading) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateText}>{translate(locale, 'status.loading')}</Text>
      </View>
    );
  }

  if (practice.levelTransition !== null) {
    const advanced = practice.levelTransition.kind === 'advanced';

    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>
            {translateAppShell(locale, 'home.eyebrow')}
          </Text>
          <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
          {gradeAdvisory}
          <View style={[styles.card, styles.transitionCard]}>
            <Text style={styles.transitionTitle}>
              {translate(
                locale,
                advanced
                  ? 'feedback.levelCompleteTitle'
                  : 'feedback.levelRetryTitle',
              )}
            </Text>
            <Text style={styles.transitionMessage}>
              {translate(
                locale,
                advanced
                  ? 'feedback.levelCompleteMessage'
                  : 'feedback.levelRetryMessage',
              )}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void continueAfterLevel()}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {translate(locale, 'action.continue')}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
        {SHOW_TEST_DIAGNOSTICS ? (
          <Text selectable style={styles.diagnosticText}>
            Test diagnostic: {practice.error}
          </Text>
        ) : null}
      </View>
    );
  }

  if (practice.session?.status === 'completed') {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.container}>
          <Text style={styles.eyebrow}>
            {translateAppShell(locale, 'home.eyebrow')}
          </Text>
          <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
          {gradeAdvisory}
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

  const question = practice.question;
  const answerOptions = getPracticeAnswerOptions(question);
  if (answerOptions === null) {
    return (
      <View style={styles.statePage}>
        <Text style={styles.stateText}>
          {translate(locale, 'status.unsupportedPracticeType')}
        </Text>
      </View>
    );
  }

  const correctAnswer = getCorrectPracticeAnswer(question);
  const canFinish = checked && lastResult === true;
  const checkDisabled =
    selectedAnswer === null || (checked && lastResult === false);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>
            {translateAppShell(locale, 'home.eyebrow')}
          </Text>
        <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
        <Text style={styles.subtitle}>
          {translate(locale, 'label.practicePlan', {
            grade: practice.session.plan.grade,
            difficulty: practice.session.plan.difficulty,
          })}
        </Text>

        {gradeAdvisory}

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
            {renderQuestionPrompt(question, locale)}
          </Text>

          <VisualQuestion question={question} locale={locale} />

          <View style={styles.answerGrid}>
            {answerOptions.map((answer) => {
              const selected = isSamePracticeAnswer(selectedAnswer, answer);
              const revealCorrect =
                checked &&
                lastResult === false &&
                isSamePracticeAnswer(correctAnswer, answer);
              const revealIncorrect =
                checked && lastResult === false && selected;

              return (
                <Pressable
                  accessibilityLabel={renderAnswerAccessibilityLabel(
                    locale,
                    answer,
                    question,
                  )}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={practiceAnswerKey(answer)}
                  onPress={() => {
                    setSelectedAnswer(answer);
                    setChecked(false);
                    setLastResult(null);
                  }}
                  style={[
                    styles.answerButton,
                    selected && styles.answerButtonSelected,
                    revealCorrect && styles.answerButtonCorrect,
                    revealIncorrect && styles.answerButtonIncorrect,
                  ]}
                >
                  <Text style={styles.answerText}>
                    {formatPracticeAnswerText(
                      answer,
                      locale,
                      question,
                    )}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {checked && selectedAnswer !== null && lastResult !== null ? (
            <View style={styles.feedbackGroup}>
              <Text
                style={[
                  styles.feedback,
                  lastResult
                    ? styles.feedbackCorrect
                    : styles.feedbackIncorrect,
                ]}
              >
                {translate(
                  locale,
                  lastResult ? 'feedback.correct' : 'feedback.incorrect',
                )}
              </Text>
              {!lastResult ? (
                <Text style={styles.correctAnswer}>
                  {translate(locale, 'feedback.correctAnswer', {
                    answer: formatPracticeAnswerText(
                      correctAnswer,
                      locale,
                      question,
                    ),
                  })}
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={canFinish ? false : checkDisabled}
            onPress={() => void (canFinish ? nextQuestion() : checkAnswer())}
            style={[
              styles.primaryButton,
              !canFinish && checkDisabled && styles.primaryButtonDisabled,
            ]}
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
            <View style={styles.errorGroup}>
              <Text style={styles.validationError}>
                {translate(locale, 'status.persistenceError')}
              </Text>
              {SHOW_TEST_DIAGNOSTICS ? (
                <Text selectable style={styles.diagnosticText}>
                  Test diagnostic: {practice.error}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

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
  answerButtonCorrect: {
    borderColor: '#157A45',
    backgroundColor: '#EAF8F0',
  },
  answerButtonIncorrect: {
    borderColor: '#B44136',
    backgroundColor: '#FFF0EE',
  },
  answerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#172033',
  },
  feedbackGroup: {
    gap: 6,
    alignItems: 'center',
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
  correctAnswer: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  advisoryCard: {
    borderWidth: 1,
    borderColor: '#E2B94B',
    borderRadius: 18,
    backgroundColor: '#FFF9E7',
    padding: 16,
    gap: 6,
  },
  advisoryTitle: {
    color: '#6A4D00',
    fontSize: 16,
    fontWeight: '900',
  },
  advisoryMessage: {
    color: '#6A5A2B',
    fontSize: 14,
    lineHeight: 20,
  },
  transitionCard: {
    marginTop: 8,
  },
  transitionTitle: {
    color: '#172033',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  transitionMessage: {
    color: '#526071',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
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
  errorGroup: {
    gap: 6,
  },
  diagnosticText: {
    color: '#526071',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
