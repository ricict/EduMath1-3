import type { MathDomain, MathTopic } from '../types';

export const TOPICS_BY_DOMAIN = {
  number: ['number-sense', 'counting', 'comparison', 'place-value', 'fractions'],
  operations: ['addition', 'subtraction', 'multiplication', 'division', 'operation-relations'],
  algebra: ['equality', 'patterns'],
  geometry: ['2d-shapes', '3d-shapes', 'position'],
  measurement: ['length', 'mass', 'time', 'money'],
  data: ['classification', 'tables', 'pictograms', 'bar-charts'],
} as const satisfies Readonly<Record<MathDomain, readonly MathTopic[]>>;

export function isTopicAllowedForDomain(domain: MathDomain, topic: MathTopic): boolean {
  return (TOPICS_BY_DOMAIN[domain] as readonly MathTopic[]).includes(topic);
}
