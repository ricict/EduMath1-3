import { StyleSheet, Text, View } from 'react-native';

import type { DataDisplayRow, Question, Shape2D } from '@/core/types';
import {
  translate,
  translateShapeName,
  type Locale,
} from '@/localization';

import {
  buildVisualQuestionModel,
  type AdditionCombineVisualModel,
} from './visualQuestionModel';

interface VisualQuestionProps {
  question: Question;
  locale: Locale;
}

const CLOCK_SIZE = 240;
const CLOCK_CENTER = CLOCK_SIZE / 2;
const CLOCK_NUMBER_RADIUS = 92;

function getClockNumberPosition(value: number) {
  const radians = ((value * 30 - 90) * Math.PI) / 180;

  return {
    left: CLOCK_CENTER + CLOCK_NUMBER_RADIUS * Math.cos(radians) - 14,
    top: CLOCK_CENTER + CLOCK_NUMBER_RADIUS * Math.sin(radians) - 14,
  };
}

function dataRowsAccessibilityText(
  locale: Locale,
  rows: readonly DataDisplayRow[],
): string {
  return rows
    .map((row) =>
      translate(locale, 'visual.dataRowLabel', {
        group: row.label,
        count: row.count,
      }),
    )
    .join('; ');
}

function tallyText(count: number): string {
  const groupsOfFive = Math.floor(count / 5);
  const remainder = count % 5;
  return [
    ...Array.from({ length: groupsOfFive }, () => '||||/'),
    '|'.repeat(remainder),
  ]
    .filter(Boolean)
    .join(' ');
}

function ShapeFigure({ shape }: { shape: Shape2D }) {
  switch (shape) {
    case 'circle':
      return <View accessible={false} style={styles.shapeCircle} />;
    case 'triangle':
      return <View accessible={false} style={styles.shapeTriangle} />;
    case 'square':
      return <View accessible={false} style={styles.shapeSquare} />;
    case 'rectangle':
      return <View accessible={false} style={styles.shapeRectangle} />;
  }
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

  if (model.kind === 'unit-fraction') {
    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.unitFractionLabel', {
          shaded: model.shadedParts,
          total: model.totalParts,
        })}
        style={styles.fractionStrip}
      >
        {Array.from({ length: model.totalParts }, (_, index) => (
          <View
            accessible={false}
            key={index}
            style={[
              styles.fractionPart,
              index < model.shadedParts && styles.fractionPartShaded,
              index < model.totalParts - 1 && styles.fractionPartDivider,
            ]}
          />
        ))}
      </View>
    );
  }

  if (model.kind === 'read-clock') {
    const minuteText = model.minute.toString().padStart(2, '0');

    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.clockLabel', {
          hour: model.hour,
          minute: minuteText,
        })}
        style={styles.clockFace}
      >
        {Array.from({ length: 12 }, (_, index) =>
          index === 0 ? 12 : index,
        ).map((value) => (
          <Text
            accessible={false}
            key={value}
            style={[styles.clockNumber, getClockNumberPosition(value)]}
          >
            {value}
          </Text>
        ))}

        <View
          accessible={false}
          style={[
            styles.clockHandLayer,
            { transform: [{ rotate: `${model.hourHandDegrees}deg` }] },
          ]}
        >
          <View style={styles.hourHand} />
        </View>

        <View
          accessible={false}
          style={[
            styles.clockHandLayer,
            { transform: [{ rotate: `${model.minuteHandDegrees}deg` }] },
          ]}
        >
          <View style={styles.minuteHand} />
        </View>

        <View accessible={false} style={styles.clockCenter} />
      </View>
    );
  }

  if (model.kind === 'identify-2d-shape') {
    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.shapeLabel', {
          shape: translateShapeName(locale, model.shape),
        })}
        style={styles.shapeCard}
      >
        <ShapeFigure shape={model.shape} />
      </View>
    );
  }

  if (model.kind === 'tally-table') {
    const rowsText = dataRowsAccessibilityText(locale, model.rows);

    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.tallyTableLabel', {
          rows: rowsText,
        })}
        style={styles.dataCard}
      >
        <View accessible={false} style={styles.tableHeaderRow}>
          <Text style={styles.tableHeaderCell}>
            {translate(locale, 'visual.dataGroupHeader')}
          </Text>
          <Text style={[styles.tableHeaderCell, styles.tableValueCell]}>
            {translate(locale, 'visual.tallyHeader')}
          </Text>
        </View>
        {model.rows.map((row) => (
          <View accessible={false} key={row.label} style={styles.dataRow}>
            <Text style={styles.dataGroupLabel}>{row.label}</Text>
            <Text style={[styles.tallyMarks, styles.tableValueCell]}>
              {tallyText(row.count)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (model.kind === 'pictogram') {
    const rowsText = dataRowsAccessibilityText(locale, model.rows);

    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.pictogramLabel', {
          rows: rowsText,
        })}
        style={styles.dataCard}
      >
        <Text accessible={false} style={styles.pictogramKey}>
          {translate(locale, 'visual.pictogramKey')}
        </Text>
        {model.rows.map((row) => (
          <View accessible={false} key={row.label} style={styles.dataRow}>
            <Text style={styles.dataGroupLabel}>{row.label}</Text>
            <View style={styles.pictogramSymbols}>
              {Array.from({ length: row.count }, (_, index) => (
                <Text key={index} style={styles.pictogramSymbol}>
                  ●
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (model.kind === 'unit-bar-chart') {
    const rowsText = dataRowsAccessibilityText(locale, model.rows);

    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.barChartLabel', {
          rows: rowsText,
        })}
        style={styles.dataCard}
      >
        {model.rows.map((row) => (
          <View accessible={false} key={row.label} style={styles.dataRow}>
            <Text style={styles.dataGroupLabel}>{row.label}</Text>
            <View style={styles.barTrack}>
              {Array.from({ length: row.count }, (_, index) => (
                <View key={index} style={styles.barUnit} />
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (model.kind === 'number-line-comparison') {
    const values = Array.from(
      { length: model.scaleMax - model.scaleMin + 1 },
      (_, index) => model.scaleMin + index,
    );

    return (
      <View
        accessible
        accessibilityLabel={translate(locale, 'visual.numberLineComparisonLabel', {
          min: model.scaleMin,
          max: model.scaleMax,
          left: model.left,
          right: model.right,
        })}
        style={styles.numberLineCard}
      >
        <View accessible={false} style={styles.numberLineTicks}>
          {values.map((value) => {
            const highlighted = value === model.left || value === model.right;
            return (
              <View key={value} style={styles.numberLineTickCell}>
                <Text
                  style={[
                    styles.numberLineLabel,
                    highlighted && styles.numberLineLabelHighlighted,
                  ]}
                >
                  {value}
                </Text>
                <View
                  style={[
                    styles.numberLineTick,
                    highlighted && styles.numberLineTickHighlighted,
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View accessible={false} style={styles.numberLineRule} />
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
  fractionStrip: {
    width: '100%',
    maxWidth: 360,
    height: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#526071',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  fractionPart: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  fractionPartShaded: {
    backgroundColor: '#315EFB',
  },
  fractionPartDivider: {
    borderRightWidth: 2,
    borderRightColor: '#526071',
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    alignSelf: 'center',
    borderWidth: 4,
    borderColor: '#526071',
    borderRadius: CLOCK_SIZE / 2,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  clockNumber: {
    position: 'absolute',
    width: 28,
    height: 28,
    color: '#172033',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  clockHandLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
  },
  hourHand: {
    position: 'absolute',
    left: CLOCK_CENTER - 3,
    top: CLOCK_CENTER - 58,
    width: 6,
    height: 58,
    borderRadius: 3,
    backgroundColor: '#172033',
  },
  minuteHand: {
    position: 'absolute',
    left: CLOCK_CENTER - 2,
    top: CLOCK_CENTER - 84,
    width: 4,
    height: 84,
    borderRadius: 2,
    backgroundColor: '#315EFB',
  },
  clockCenter: {
    position: 'absolute',
    left: CLOCK_CENTER - 7,
    top: CLOCK_CENTER - 7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#172033',
  },
  shapeCard: {
    width: '100%',
    maxWidth: 360,
    minHeight: 190,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D7DFE8',
    borderRadius: 24,
    backgroundColor: '#F8FAFD',
    padding: 24,
  },
  shapeCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#315EFB',
  },
  shapeTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 70,
    borderRightWidth: 70,
    borderBottomWidth: 120,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#315EFB',
  },
  shapeSquare: {
    width: 132,
    height: 132,
    backgroundColor: '#315EFB',
  },
  shapeRectangle: {
    width: 176,
    height: 112,
    backgroundColor: '#315EFB',
  },
  dataCard: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#D7DFE8',
    borderRadius: 20,
    backgroundColor: '#F8FAFD',
    padding: 16,
    gap: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D7DFE8',
    paddingBottom: 8,
  },
  tableHeaderCell: {
    width: 72,
    color: '#526071',
    fontSize: 14,
    fontWeight: '800',
  },
  tableValueCell: {
    flex: 1,
  },
  dataRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dataGroupLabel: {
    width: 48,
    color: '#172033',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  tallyMarks: {
    color: '#172033',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  pictogramKey: {
    color: '#526071',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  pictogramSymbols: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  pictogramSymbol: {
    color: '#315EFB',
    fontSize: 24,
    lineHeight: 28,
  },
  barTrack: {
    flex: 1,
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 2,
    borderBottomColor: '#526071',
  },
  barUnit: {
    width: 24,
    minHeight: 24,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#315EFB',
  },
  numberLineCard: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingTop: 18,
    paddingBottom: 12,
  },
  numberLineTicks: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  numberLineTickCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  numberLineLabel: {
    color: '#526071',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
  numberLineLabelHighlighted: {
    color: '#172033',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
  },
  numberLineTick: {
    width: 1,
    height: 10,
    marginTop: 3,
    backgroundColor: '#7D8A9A',
  },
  numberLineTickHighlighted: {
    width: 4,
    height: 18,
    backgroundColor: '#315EFB',
  },
  numberLineRule: {
    height: 2,
    marginTop: -1,
    backgroundColor: '#526071',
  },
});
