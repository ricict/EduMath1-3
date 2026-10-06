import assert from 'node:assert/strict';
import test from 'node:test';

import { parsePracticeGradeParam } from '../../src/features/journey/gradeRoute';

test('grade route accepts only canonical Grade 1–3 values', () => {
  assert.equal(parsePracticeGradeParam('1'), 1);
  assert.equal(parsePracticeGradeParam('2'), 2);
  assert.equal(parsePracticeGradeParam('3'), 3);
  assert.equal(parsePracticeGradeParam(['2']), 2);
});

test('grade route rejects missing, duplicated, or non-canonical values', () => {
  for (const value of [
    undefined,
    '0',
    '4',
    '01',
    '1.0',
    'grade-1',
    ['1', '2'],
    [],
  ] as const) {
    assert.equal(parsePracticeGradeParam(value), null);
  }
});
