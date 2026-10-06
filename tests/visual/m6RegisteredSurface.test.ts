import assert from 'node:assert/strict';
import test from 'node:test';

import {
  generateQuestion,
  registeredQuestionGenerators,
} from '../../src/core/question-engine/registry';
import { evaluateLearnerAnswer } from '../../src/core/session/session';
import { getPracticeAnswerOptions } from '../../src/features/practice/answerInteraction';
import { supportsPracticeScreenQuestion } from '../../src/features/practice/practiceCompatibility';
import { buildVisualQuestionModel } from '../../src/features/practice/visual/visualQuestionModel';

test('every registered generator has a valid child-facing M6 practice surface', () => {
  for (const generator of registeredQuestionGenerators) {
    for (const skillId of generator.supportedSkills) {
      for (const grade of generator.supportedGrades) {
        for (const difficulty of generator.supportedDifficulties) {
          const question = generateQuestion({
            grade,
            skillId,
            difficulty,
            seed: 20261006,
          });

          assert.equal(
            supportsPracticeScreenQuestion(question),
            true,
            `${generator.id} must be supported by the practice interaction boundary`,
          );

          const options = getPracticeAnswerOptions(question);
          assert.ok(
            options,
            `${generator.id} must expose child-facing answer options`,
          );
          assert.ok(
            options.length >= 2,
            `${generator.id} must expose at least two answer choices`,
          );
          assert.equal(
            options.filter((answer) =>
              evaluateLearnerAnswer(question, answer),
            ).length,
            1,
            `${generator.id} must expose exactly one correct child-facing choice`,
          );

          const visualModel = buildVisualQuestionModel(question);
          if (
            question.representation === 'visual' ||
            question.representation === 'clock' ||
            question.representation === 'number-line' ||
            question.representation === 'table' ||
            question.representation === 'pictogram' ||
            question.representation === 'bar-chart'
          ) {
            assert.ok(
              visualModel,
              `${generator.id} must render its declared visual representation`,
            );
          } else {
            assert.equal(
              visualModel,
              null,
              `${generator.id} symbolic content should remain prompt-driven rather than use an unrelated visual`,
            );
          }
        }
      }
    }
  }
});
