import assert from 'node:assert/strict';
import test from 'node:test';

import { canonicalSkills } from '../../src/core/curriculum/canonicalSkills';
import {
  generateQuestion,
  getQuestionGenerator,
  supportsQuestionGeneration,
} from '../../src/core/question-engine/registry';
import { generateUnitFraction } from '../../src/core/question-engine/unitFractions';
import { validateQuestion } from '../../src/core/validation/validateQuestion';
import { renderQuestionPrompt } from '../../src/localization';

function generate(
  seed: number,
  grade: 2 | 3 = 2,
  difficulty: 1 | 2 | 3 = 3,
) {
  return generateUnitFraction({
    grade,
    skillId: 'unit_fractions',
    difficulty,
    seed,
  });
}

test('unit fraction generator consumes canonical allowedDenominators metadata', () => {
  const generator = getQuestionGenerator('unit_fractions');

  assert.deepEqual(generator.requiredConstraints, ['allowedDenominators']);
  assert.deepEqual(generator.supportedGrades, [2, 3]);
  assert.deepEqual(generator.supportedRepresentations, ['visual']);
  assert.equal(generator.capability, 'fraction');
  assert.deepEqual(
    canonicalSkills.unit_fractions.constraints?.allowedDenominators,
    [2, 3, 4, 5, 6, 8, 10],
  );
});

test('unit fraction generator is deterministic and registered for Grades 2 and 3', () => {
  assert.deepEqual(generate(20261006, 2), generate(20261006, 2));
  assert.deepEqual(generate(20261006, 3), generate(20261006, 3));
  assert.equal(
    supportsQuestionGeneration('unit_fractions', 'fraction-choice', 'visual'),
    true,
  );

  for (const grade of [2, 3] as const) {
    assert.deepEqual(
      generateQuestion({
        grade,
        skillId: 'unit_fractions',
        difficulty: 3,
        seed: 20261006,
      }),
      generate(20261006, grade),
    );
  }
});

test('unit fraction questions preserve canonical mathematical invariants across many seeds', () => {
  const canonicalDenominators =
    canonicalSkills.unit_fractions.constraints?.allowedDenominators ?? [];

  for (const grade of [2, 3] as const) {
    for (let seed = 0; seed < 1000; seed += 1) {
      const question = generate(seed, grade);
      const validation = validateQuestion(question);

      assert.equal(
        validation.valid,
        true,
        `grade ${grade}, seed ${seed}: ${validation.errors.join(', ')}`,
      );
      assert.equal(question.data.numerator, 1);
      assert.equal(question.data.shadedParts, 1);
      assert.equal(question.data.totalParts, question.data.denominator);
      assert.ok(canonicalDenominators.includes(question.data.denominator));
      assert.deepEqual(question.expectedAnswer, {
        numerator: 1,
        denominator: question.data.denominator,
      });
      assert.ok(question.answerOptions.length >= 2);
      assert.ok(question.answerOptions.length <= 4);
      assert.equal(
        new Set(
          question.answerOptions.map(
            (option) => `${option.numerator}/${option.denominator}`,
          ),
        ).size,
        question.answerOptions.length,
      );
      assert.equal(
        question.answerOptions.filter(
          (option) =>
            option.numerator === question.expectedAnswer.numerator &&
            option.denominator === question.expectedAnswer.denominator,
        ).length,
        1,
      );
    }
  }
});

test('unit fraction difficulty restricts denominator complexity', () => {
  const allowed = {
    1: [2, 4],
    2: [2, 3, 4, 5],
    3: [2, 3, 4, 5, 6, 8, 10],
  } as const;

  for (const difficulty of [1, 2, 3] as const) {
    for (let seed = 0; seed < 500; seed += 1) {
      const question = generate(seed, 2, difficulty);
      assert.ok(
        (allowed[difficulty] as readonly number[]).includes(
          question.data.denominator,
        ),
      );
      assert.ok(
        question.answerOptions.every((option) =>
          (allowed[difficulty] as readonly number[]).includes(
            option.denominator,
          ),
        ),
      );
    }
  }
});

test('unit fraction generator rejects unsupported grade and representation requests', () => {
  assert.throws(
    () =>
      generateQuestion({
        grade: 1,
        skillId: 'unit_fractions',
        difficulty: 1,
        seed: 1,
      }),
    /not applicable to Grade 1/,
  );

  assert.throws(
    () =>
      generateQuestion({
        grade: 2,
        skillId: 'unit_fractions',
        difficulty: 1,
        seed: 1,
        representation: 'symbolic',
      }),
    /does not support representation symbolic/,
  );
});

test('unit fraction answer options are deterministic semantic data rather than UI-generated distractors', () => {
  const first = generate(20261006, 2, 3);
  const second = generate(20261006, 2, 3);

  assert.deepEqual(first.answerOptions, second.answerOptions);
  assert.ok(first.answerOptions.length >= 2);
  assert.ok(first.answerOptions.length <= 4);
  assert.equal(
    first.answerOptions.some(
      (option) =>
        option.numerator === first.expectedAnswer.numerator &&
        option.denominator === first.expectedAnswer.denominator,
    ),
    true,
  );
});

test('unit fraction semantics render independently in all locales', () => {
  const question = generate(20261006, 2, 3);

  assert.match(
    renderQuestionPrompt(question, 'en'),
    /^One of \d+ equal parts is shaded\. Which fraction is shown\?$/,
  );
  assert.match(
    renderQuestionPrompt(question, 'id'),
    /^Satu dari \d+ bagian yang sama diarsir\. Pecahan apa yang ditunjukkan\?$/,
  );
  assert.match(
    renderQuestionPrompt(question, 'th'),
    /^ระบายสี 1 ส่วนจากทั้งหมด \d+ ส่วนที่เท่ากัน เศษส่วนที่แสดงคืออะไร\?$/,
  );
});
