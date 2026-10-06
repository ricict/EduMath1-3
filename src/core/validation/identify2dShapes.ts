import type {
  Difficulty,
  Identify2DShapeQuestion,
  Question,
  Shape2D,
} from '../types';
import type { QuestionValidationResult } from './types';

const SHAPES_BY_DIFFICULTY: Readonly<
  Record<Difficulty, readonly Shape2D[]>
> = {
  1: ['circle', 'triangle'],
  2: ['circle', 'triangle', 'square'],
  3: ['circle', 'triangle', 'square', 'rectangle'],
};

export function validateIdentify2DShapes(
  question: Question,
): QuestionValidationResult {
  const errors: string[] = [];

  if (question.grade !== 1 && question.grade !== 2) {
    errors.push('identify_2d_shapes is available only for Grades 1 and 2.');
  }
  if (question.skillId !== 'identify_2d_shapes') {
    errors.push('Question skill must be identify_2d_shapes.');
  }
  if (question.questionType !== 'shape-choice') {
    errors.push('Question type must be shape-choice.');
  }
  if (question.representation !== 'visual') {
    errors.push('2D shape identification must use the visual representation.');
  }
  if (question.data.operation !== 'identify-2d-shape') {
    errors.push('Question operation must be identify-2d-shape.');
    return { valid: false, errors };
  }

  const shapeQuestion = question as Identify2DShapeQuestion;
  const permittedShapes = SHAPES_BY_DIFFICULTY[question.difficulty];
  const { shape } = shapeQuestion.data;

  if (!permittedShapes.includes(shape)) {
    errors.push('Generated shape is outside the configured difficulty set.');
  }

  if (shapeQuestion.answerOptions.length !== permittedShapes.length) {
    errors.push(
      'Shape answer options must expose the complete configured difficulty set.',
    );
  }

  if (
    new Set(shapeQuestion.answerOptions).size !==
    shapeQuestion.answerOptions.length
  ) {
    errors.push('Shape answer options must be unique.');
  }

  if (
    shapeQuestion.answerOptions.some(
      (option) => !permittedShapes.includes(option),
    )
  ) {
    errors.push(
      'Shape answer options must stay inside the configured difficulty set.',
    );
  }

  if (
    shapeQuestion.answerOptions.filter((option) => option === shape).length !== 1
  ) {
    errors.push(
      'Shape answer options must contain the correct answer exactly once.',
    );
  }

  if (shapeQuestion.expectedAnswer !== shape) {
    errors.push('Expected shape does not match the generated shape semantics.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
