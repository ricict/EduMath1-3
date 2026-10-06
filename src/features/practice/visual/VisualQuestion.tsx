import { StyleSheet, Text, View } from 'react-native';

import type { Question } from '@/core/types';
import { translate, type Locale } from '@/localization';

import {
  buildVisualQuestionModel,
  type AdditionCombineVisualModel,
} from './visualQuestionModel';

interface VisualQuestionProps {
  question: Question;
  locale: Locale;
}

interface CounterGroupProps {
  group: AdditionCombineVisualModel['groups'][number];
  locale: Locale;
}

function CounterGroup({ group, locale }: CounterGroupProps) {
  const labelKey =
    group.position === 'first'
      ? 'visual.additionFirstGroupLabel'
      : 'visual.additionSecondGroupLabel';

  return (
    <View
      accessible
      accessibilityLabel={translate(locale, labelKey, { count: group.count })}
      style={styles.groupCard}
    >
      <View accessible={false} style={styles.counterGrid}>
        {Array.from({ length: group.count }, (_, index) => (
          <View
            accessible={false}
            key={index}
            style={styles.counter}
          />
        ))}
      </View>
    </View>
  );
}

export function VisualQuestion({ question, locale }: VisualQuestionProps) {
  const model = buildVisualQuestionModel(question);

  if (model === null) {
    return null;
  }

  if (model.kind === 'number-recognition') {
    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.numberRecognitionLabel', {
          target: model.target,
        })}
        style={styles.numberTile}
      >
        <Text style={styles.numberText}>{model.target}</Text>
      </View>
    );
  }

  return (
    <View style={styles.groupRow}>
      {model.groups.map((group) => (
        <CounterGroup
          group={group}
          key={group.position}
          locale={locale}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  numberTile: {
    minHeight: 156,
    borderWidth: 2,
    borderColor: '#D7DFE8',
    borderRadius: 24,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  numberText: {
    color: '#172033',
    fontSize: 88,
    lineHeight: 104,
    fontWeight: '800',
    textAlign: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  groupCard: {
    flexBasis: 180,
    flexGrow: 1,
    minHeight: 132,
    borderWidth: 2,
    borderColor: '#D7DFE8',
    borderRadius: 20,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  counterGrid: {
    maxWidth: 190,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#315EFB',
  },
});
