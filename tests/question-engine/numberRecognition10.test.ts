import assert from 'node:assert/strict';
import test from 'node:test';

import { generateNumberRecognition10 } from '../../src/core/question-engine/numberRecognition10';
import {
  generateQuestion,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(seed: number, difficulty: 1 | 2 | 3 = 3) {
  return generateNumberRecognition10({
    grade: 1,
    skillId: 'number_recognition_10',
    difficulty,
    seed,
  });
}

test('number recognition generator is deterministic and registered', () => {
  assert.deepEqual(generate(20261006), generate(20261006));
  assert.equal(supportsQuestionGeneration('number_recognition_10'), true);
  assert.deepEqual(
    generateQuestion({
      grade: 1,
      skillId: 'number_recognition_10',
      difficulty: 3,
      seed: 20261006,
    }),
    generate(20261006),
  );
});

test('number recognition questions stay within canonical 0 to 10', () => {
  for (let seed = 0; seed < 1000; seed += 1) {
    const question = generate(seed);
    const validation = validateQuestion(question);

    assert.equal(validation.valid, true, `seed ${seed}: ${validation.errors.join(', ')}`);
    assert.ok(question.data.target >= 0);
    assert.ok(question.data.target <= 10);
    assert.equal(question.expectedAnswer, question.data.target);
    assert.equal(question.representation, 'visual');
  }
});

test('number recognition difficulty caps are explicit', () => {
  const caps = { 1: 5, 2: 7, 3: 10 } as const;

  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 0; seed < 250; seed += 1) {
      assert.ok(generate(seed, difficulty).data.target <= caps[difficulty]);
    }
  }
});

test('number recognition semantics remain language-independent', () => {
  const question = generate(20261006);

  assert.equal(renderQuestionPrompt(question, 'en'), 'Which number is shown?');
  assert.equal(renderQuestionPrompt(question, 'id'), 'Angka berapa yang ditunjukkan?');
  assert.equal(renderQuestionPrompt(question, 'th'), 'ตัวเลขที่แสดงคือเลขอะไร?');
});
