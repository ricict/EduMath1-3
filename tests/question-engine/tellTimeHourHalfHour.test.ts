import assert from 'node:assert/strict';
import test from 'node:test';

import {
  generateQuestion,
  getQuestionGenerator,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { generateTellTimeHourHalfHour } from '../../src/core/question-engine/tellTimeHourHalfHour';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(
  seed: number,
  grade: 1 | 2 = 1,
  difficulty: 1 | 2 | 3 = 3,
) {
  return generateTellTimeHourHalfHour({
    grade,
    skillId: 'tell_time_hour_half_hour',
    difficulty,
    seed,
  });
}

test('clock generator declares Grade 1-2 clock semantics', () => {
  const generator = getQuestionGenerator('tell_time_hour_half_hour');

  assert.deepEqual(generator.supportedGrades, [1, 2]);
  assert.deepEqual(generator.supportedQuestionTypes, ['time-choice']);
  assert.deepEqual(generator.supportedRepresentations, ['clock']);
  assert.equal(generator.capability, 'time');
  assert.equal(
    supportsQuestionGeneration(
      'tell_time_hour_half_hour',
      'time-choice',
      'clock',
    ),
    true,
  );
});

test('clock generator is deterministic and dispatches for both supported grades', () => {
  assert.deepEqual(generate(20261006, 1), generate(20261006, 1));
  assert.deepEqual(generate(20261006, 2), generate(20261006, 2));

  for (const grade of [1, 2] as const) {
    assert.deepEqual(
      generateQuestion({
        grade,
        skillId: 'tell_time_hour_half_hour',
        difficulty: 3,
        seed: 20261006,
      }),
      generate(20261006, grade),
    );
  }
});

test('clock questions preserve time invariants across many seeds', () => {
  for (const grade of [1, 2] as const) {
    for (let seed = 0; seed < 1000; seed += 1) {
      const question = generate(seed, grade, 3);
      const validation = validateQuestion(question);

      assert.equal(
        validation.valid,
        true,
        `grade ${grade}, seed ${seed}: ${validation.errors.join(', ')}`,
      );
      assert.ok(question.data.hour >= 1 && question.data.hour <= 12);
      assert.ok(question.data.minute === 0 || question.data.minute === 30);
      assert.deepEqual(question.expectedAnswer, {
        hour: question.data.hour,
        minute: question.data.minute,
      });
      assert.equal(question.answerOptions.length, 4);
      assert.equal(
        new Set(
          question.answerOptions.map(
            (option) => `${option.hour}:${option.minute}`,
          ),
        ).size,
        4,
      );
      assert.equal(
        question.answerOptions.filter(
          (option) =>
            option.hour === question.expectedAnswer.hour &&
            option.minute === question.expectedAnswer.minute,
        ).length,
        1,
      );
    }
  }
});

test('clock difficulty controls hour range and half-hour introduction', () => {
  for (let seed = 0; seed < 500; seed += 1) {
    const easy = generate(seed, 1, 1);
    const medium = generate(seed, 1, 2);
    const hard = generate(seed, 1, 3);

    assert.ok(easy.data.hour <= 6);
    assert.equal(easy.data.minute, 0);

    assert.ok(medium.data.hour <= 12);
    assert.equal(medium.data.minute, 0);

    assert.ok(hard.data.hour <= 12);
    assert.ok(hard.data.minute === 0 || hard.data.minute === 30);

    assert.ok(
      easy.answerOptions.every(
        (option) => option.hour <= 6 && option.minute === 0,
      ),
    );
    assert.ok(
      medium.answerOptions.every(
        (option) => option.hour <= 12 && option.minute === 0,
      ),
    );
    assert.ok(
      hard.answerOptions.every(
        (option) =>
          option.hour <= 12 &&
          (option.minute === 0 || option.minute === 30),
      ),
    );
  }
});

test('clock generator rejects Grade 3 and non-clock presentation requests', () => {
  assert.throws(
    () =>
      generateQuestion({
        grade: 3,
        skillId: 'tell_time_hour_half_hour',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 3/,
  );

  assert.throws(
    () =>
      generateQuestion({
        grade: 1,
        skillId: 'tell_time_hour_half_hour',
        difficulty: 1,
        seed: 1,
        representation: 'visual',
      }),
    /does not support representation visual/,
  );
});

test('clock answer options are deterministic semantic data rather than UI-generated distractors', () => {
  const first = generate(20261006, 1, 3);
  const second = generate(20261006, 1, 3);

  assert.deepEqual(first.answerOptions, second.answerOptions);
  assert.equal(first.answerOptions.length, 4);
  assert.equal(
    first.answerOptions.some(
      (option) =>
        option.hour === first.expectedAnswer.hour &&
        option.minute === first.expectedAnswer.minute,
    ),
    true,
  );
});

test('clock semantics render independently in all locales', () => {
  const question = generate(20261006, 1, 3);

  assert.equal(renderQuestionPrompt(question, 'en'), 'What time does the clock show?');
  assert.equal(renderQuestionPrompt(question, 'id'), 'Jam menunjukkan pukul berapa?');
  assert.equal(renderQuestionPrompt(question, 'th'), 'นาฬิกาแสดงเวลากี่โมง?');
});
