import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { generateAdditionWithin10 } from '@/core/question-engine/additionWithin10';
import { validateQuestion } from '@/core/validation/validateQuestion';
import { renderQuestionPrompt, translate, type Locale } from '@/localization';

const ANSWERS = Array.from({ length: 11 }, (_, value) => value);
const INITIAL_SEED = 20261006;

export function PracticeScreen() {
  const [locale, setLocale] = useState<Locale>('en');
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const question = useMemo(
    () =>
      generateAdditionWithin10({
        grade: 1,
        skillId: 'addition_within_10',
        difficulty: 3,
        seed,
      }),
    [seed],
  );

  const validation = validateQuestion(question);
  const isCorrect = selectedAnswer === question.expectedAnswer;

  const nextQuestion = () => {
    setSeed((current) => current + 1);
    setSelectedAnswer(null);
    setChecked(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>EduMath Grade 1–3 · M1</Text>
        <Text style={styles.title}>{translate(locale, 'app.title')}</Text>
        <Text style={styles.subtitle}>{translate(locale, 'app.subtitle')}</Text>

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

        <View style={styles.card}>
          <Text style={styles.question}>{renderQuestionPrompt(question, locale)}</Text>

          <View style={styles.answerGrid}>
            {ANSWERS.map((answer) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedAnswer === answer }}
                key={answer}
                onPress={() => {
                  setSelectedAnswer(answer);
                  setChecked(false);
                }}
                style={[styles.answerButton, selectedAnswer === answer && styles.answerButtonSelected]}
              >
                <Text style={styles.answerText}>{answer}</Text>
              </Pressable>
            ))}
          </View>

          {checked && selectedAnswer !== null ? (
            <Text style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
              {translate(locale, isCorrect ? 'feedback.correct' : 'feedback.incorrect')}
            </Text>
          ) : null}

          {validation.valid ? (
            <Pressable
              accessibilityRole="button"
              disabled={selectedAnswer === null}
              onPress={isCorrect && checked ? nextQuestion : () => setChecked(true)}
              style={[styles.primaryButton, selectedAnswer === null && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {translate(locale, isCorrect && checked ? 'action.next' : 'action.check')}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.validationError}>Question validation failed.</Text>
          )}
        </View>

        <Text style={styles.seed}>Seed: {seed}</Text>
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
    width: 56,
    height: 56,
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
