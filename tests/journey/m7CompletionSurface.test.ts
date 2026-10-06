import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { registeredQuestionGenerators } from '../../src/core/question-engine/registry';
import { generateAdditionWithin10 } from '../../src/core/question-engine/additionWithin10';
import { PRACTICE_SESSION_SCHEMA_VERSION } from '../../src/core/session/types';
import { translateAppShell } from '../../src/localization/appShell';

test('M7 child-facing practice source contains no development milestone/session/seed metadata', () => {
  const source = readFileSync(
    'src/features/practice/PracticeScreen.tsx',
    'utf8',
  );

  assert.doesNotMatch(source, /· M4/);
  assert.doesNotMatch(source, /Session:/);
  assert.doesNotMatch(source, /Seed:/);
});

test('M7 invalid practice route is localized in all app locales', () => {
  for (const locale of ['en', 'id', 'th'] as const) {
    assert.ok(translateAppShell(locale, 'practice.invalidGrade').length > 0);
    assert.ok(translateAppShell(locale, 'practice.backHome').length > 0);
  }
});

test('M7 completion preserves locked upstream contracts', () => {
  assert.equal(PRACTICE_SESSION_SCHEMA_VERSION, 1);
  assert.equal(registeredQuestionGenerators.length, 12);

  const question = generateAdditionWithin10({
    grade: 1,
    skillId: 'addition_within_10',
    difficulty: 3,
    seed: 20261006,
  });

  assert.equal(question.data.a, 4);
  assert.equal(question.data.b, 1);
  assert.equal(question.expectedAnswer, 5);
});
