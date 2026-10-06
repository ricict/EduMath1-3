import assert from 'node:assert/strict';
import test from 'node:test';

import { generateBarChartsUnitScale } from '../../src/core/question-engine/barChartsUnitScale';
import { generatePictogramsSimple } from '../../src/core/question-engine/pictogramsSimple';
import {
  generateQuestion,
  getQuestionGenerator,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { generateTallyAndSimpleTables } from '../../src/core/question-engine/tallyAndSimpleTables';
import type { Difficulty } from '../../src/core/types';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

const DIFFICULTIES = [1, 2, 3] as const satisfies readonly Difficulty[];

test('data-display generators declare the three canonical visual families', () => {
  const table = getQuestionGenerator('tally_and_simple_tables');
  const pictogram = getQuestionGenerator('pictograms_simple');
  const bar = getQuestionGenerator('bar_charts_unit_scale');

  assert.equal(table.capability, 'data-table');
  assert.deepEqual(table.supportedGrades, [1, 2]);
  assert.deepEqual(table.supportedRepresentations, ['table']);
  assert.deepEqual(table.supportedQuestionTypes, ['numeric-choice']);

  assert.equal(pictogram.capability, 'pictogram');
  assert.deepEqual(pictogram.supportedGrades, [1, 2]);
  assert.deepEqual(pictogram.supportedRepresentations, ['pictogram']);
  assert.deepEqual(pictogram.supportedQuestionTypes, ['numeric-choice']);

  assert.equal(bar.capability, 'bar-chart');
  assert.deepEqual(bar.supportedGrades, [3]);
  assert.deepEqual(bar.supportedRepresentations, ['bar-chart']);
  assert.deepEqual(bar.supportedQuestionTypes, ['numeric-choice']);

  assert.equal(
    supportsQuestionGeneration(
      'tally_and_simple_tables',
      'numeric-choice',
      'table',
    ),
    true,
  );
  assert.equal(
    supportsQuestionGeneration('pictograms_simple', 'numeric-choice', 'pictogram'),
    true,
  );
  assert.equal(
    supportsQuestionGeneration(
      'bar_charts_unit_scale',
      'numeric-choice',
      'bar-chart',
    ),
    true,
  );
});

test('data-display generators remain deterministic through registry dispatch', () => {
  const contexts = [
    {
      grade: 1 as const,
      skillId: 'tally_and_simple_tables' as const,
      difficulty: 3 as const,
      seed: 20261006,
    },
    {
      grade: 2 as const,
      skillId: 'pictograms_simple' as const,
      difficulty: 3 as const,
      seed: 20261006,
    },
    {
      grade: 3 as const,
      skillId: 'bar_charts_unit_scale' as const,
      difficulty: 3 as const,
      seed: 20261006,
    },
  ];

  for (const context of contexts) {
    assert.deepEqual(generateQuestion(context), generateQuestion(context));
  }
});

test('tally-table semantics and answer options remain valid across many seeds', () => {
  const maxByDifficulty = { 1: 5, 2: 7, 3: 10 } as const;
  const groupsByDifficulty = { 1: 2, 2: 3, 3: 3 } as const;

  for (const grade of [1, 2] as const) {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 0; seed < 512; seed += 1) {
        const question = generateTallyAndSimpleTables({
          grade,
          skillId: 'tally_and_simple_tables',
          difficulty,
          seed,
        });
        const validation = validateQuestion(question);
        const target = question.data.rows.find(
          (row) => row.label === question.data.targetLabel,
        );

        assert.equal(validation.valid, true, validation.errors.join(', '));
        assert.equal(question.data.rows.length, groupsByDifficulty[difficulty]);
        assert.ok(
          question.data.rows.every(
            (row) =>
              row.count >= 1 && row.count <= maxByDifficulty[difficulty],
          ),
        );
        assert.equal(question.expectedAnswer, target?.count);
        assert.equal(question.answerOptions.length, 4);
        assert.equal(
          question.answerOptions.filter(
            (value) => value === question.expectedAnswer,
          ).length,
          1,
        );
      }
    }
  }
});

test('pictogram semantics preserve a one-symbol-to-one-item key across many seeds', () => {
  const maxByDifficulty = { 1: 5, 2: 7, 3: 10 } as const;

  for (const grade of [1, 2] as const) {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 0; seed < 512; seed += 1) {
        const question = generatePictogramsSimple({
          grade,
          skillId: 'pictograms_simple',
          difficulty,
          seed,
        });
        const validation = validateQuestion(question);
        const target = question.data.rows.find(
          (row) => row.label === question.data.targetLabel,
        );

        assert.equal(validation.valid, true, validation.errors.join(', '));
        assert.equal(question.data.symbolValue, 1);
        assert.ok(
          question.data.rows.every(
            (row) =>
              row.count >= 1 && row.count <= maxByDifficulty[difficulty],
          ),
        );
        assert.equal(question.expectedAnswer, target?.count);
      }
    }
  }
});

test('unit bar-chart semantics preserve unit scale across many seeds', () => {
  const maxByDifficulty = { 1: 5, 2: 8, 3: 10 } as const;

  for (const difficulty of DIFFICULTIES) {
    for (let seed = 0; seed < 512; seed += 1) {
      const question = generateBarChartsUnitScale({
        grade: 3,
        skillId: 'bar_charts_unit_scale',
        difficulty,
        seed,
      });
      const validation = validateQuestion(question);
      const target = question.data.rows.find(
        (row) => row.label === question.data.targetLabel,
      );

      assert.equal(validation.valid, true, validation.errors.join(', '));
      assert.equal(question.data.scaleUnit, 1);
      assert.ok(
        question.data.rows.every(
          (row) =>
            row.count >= 0 && row.count <= maxByDifficulty[difficulty],
        ),
      );
      assert.equal(question.expectedAnswer, target?.count);
    }
  }
});

test('data-display generators enforce canonical grades and implemented representations', () => {
  assert.throws(
    () =>
      generateQuestion({
        grade: 3,
        skillId: 'tally_and_simple_tables',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 3/,
  );
  assert.throws(
    () =>
      generateQuestion({
        grade: 1,
        skillId: 'pictograms_simple',
        difficulty: 1,
        seed: 1,
        representation: 'visual',
      }),
    /does not support representation visual/,
  );
  assert.throws(
    () =>
      generateQuestion({
        grade: 2,
        skillId: 'bar_charts_unit_scale',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 2/,
  );
});

test('data-display prompts stay localized while group semantics stay unchanged', () => {
  const table = generateTallyAndSimpleTables({
    grade: 1,
    skillId: 'tally_and_simple_tables',
    difficulty: 3,
    seed: 20261006,
  });
  const pictogram = generatePictogramsSimple({
    grade: 2,
    skillId: 'pictograms_simple',
    difficulty: 3,
    seed: 20261006,
  });
  const bar = generateBarChartsUnitScale({
    grade: 3,
    skillId: 'bar_charts_unit_scale',
    difficulty: 3,
    seed: 20261006,
  });

  assert.equal(
    renderQuestionPrompt(table, 'en'),
    `How many items are in group ${table.data.targetLabel}?`,
  );
  assert.equal(
    renderQuestionPrompt(pictogram, 'id'),
    `Menurut piktogram, ada berapa benda di kelompok ${pictogram.data.targetLabel}?`,
  );
  assert.equal(
    renderQuestionPrompt(bar, 'th'),
    `จากแผนภูมิแท่ง กลุ่ม ${bar.data.targetLabel} มีสิ่งของกี่ชิ้น?`,
  );
});
