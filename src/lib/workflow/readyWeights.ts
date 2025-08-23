import type { FieldKey } from './gates';

export const READY_WEIGHTS: Partial<Record<FieldKey, number>> = {
  abstract: 20,
  keywords: 10,
  nomenclature: 15,
  core_equations: 15,
  boundary_conditions: 10,
  dimensional_analysis: 10,
  limitations_risks: 5,
  preliminary_references: 5,
  identity: 5,
};

export const READY_TOTAL = Object.values(READY_WEIGHTS).reduce(
  (a, b) => a + b,
  0
);
