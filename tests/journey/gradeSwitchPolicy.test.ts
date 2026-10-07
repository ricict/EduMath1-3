import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateGradeReadiness } from '../../src/features/journey/gradeSwitchPolicy';

test('Grade 1 has no previous-grade advisory', async () => {
  const readiness = await evaluateGradeReadiness(
    {
      async listCompleted() {
        return [];
      },
    },
    1,
  );

  assert.equal(readiness.previousGrade, null);
  assert.equal(readiness.previousGradeComplete, true);
});

test('Grade 2 remains available while Grade 1 completion is advisory only', async () => {
  const readiness = await evaluateGradeReadiness(
    {
      async listCompleted() {
        return [];
      },
    },
    2,
  );

  assert.equal(readiness.targetGrade, 2);
  assert.equal(readiness.previousGrade, 1);
  assert.equal(readiness.previousGradeComplete, false);
});

test('Grade 3 readiness checks Grade 2 rather than blocking navigation', async () => {
  const readiness = await evaluateGradeReadiness(
    {
      async listCompleted() {
        return [];
      },
    },
    3,
  );

  assert.equal(readiness.targetGrade, 3);
  assert.equal(readiness.previousGrade, 2);
  assert.equal(readiness.previousGradeComplete, false);
});
