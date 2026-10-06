export function validateNumericAnswerOptions(
  answerOptions: readonly number[],
  expectedAnswer: number,
  isAllowed: (value: number) => boolean,
): readonly string[] {
  const errors: string[] = [];

  if (answerOptions.length !== 4) {
    errors.push('Numeric answer options must contain exactly four choices.');
  }
  if (answerOptions.some((value) => !Number.isInteger(value))) {
    errors.push('Numeric answer options must be integers.');
  }
  if (new Set(answerOptions).size !== answerOptions.length) {
    errors.push('Numeric answer options must be unique.');
  }
  if (answerOptions.filter((value) => value === expectedAnswer).length !== 1) {
    errors.push('Numeric answer options must contain the correct answer exactly once.');
  }
  if (answerOptions.some((value) => !isAllowed(value))) {
    errors.push('Numeric answer options contain a value outside the allowed domain.');
  }

  return errors;
}
