import { describe, it, expect } from '@jest/globals';
import { evaluateQN21, QN21_CRITERIA, summarizeQN21 } from '../src/lib/q21';

describe('QN21 utilities', () => {
  it('evaluateQN21 returns scores and gaps based on keywords', () => {
    const text = 'The equation F = ma was derived with rigorous analysis and ethical oversight.';
    const result = evaluateQN21(text);

    expect(result.length).toBe(QN21_CRITERIA.length);

    const sigma = result.find((r) => r.code === 'Σ');
    expect(sigma).toBeTruthy();
    expect(sigma?.score).toBe(8);
    expect(sigma?.gap).toBe(0);

    const delta = result.find((r) => r.code === 'Δ');
    expect(delta).toBeTruthy();
    expect(delta?.score).toBe(6);
    expect(delta?.gap).toBe(0);

    const theta = result.find((r) => r.code === 'Θ');
    expect(theta).toBeTruthy();
    expect(theta?.score).toBe(8);
    expect(theta?.gap).toBe(0);

    const phi = result.find((r) => r.code === 'Φ');
    expect(phi).toBeTruthy();
    expect(phi?.score).toBe(0);
    expect(phi?.gap).toBe(5);
  });

  it('evaluateQN21 handles partial criteria in text', () => {
    const text =
      'Calibration ensures precision, but reproducibility was not discussed. Community engagement was strong.';
    const result = evaluateQN21(text);

    const kappa = result.find((r) => r.code === 'Κ');
    expect(kappa).toBeTruthy();
    expect(kappa?.score).toBe(3);

    const rho = result.find((r) => r.code === 'Ρ');
    expect(rho).toBeTruthy();
    expect(rho?.score).toBe(0);

    const beta = result.find((r) => r.code === 'Β');
    expect(beta).toBeTruthy();
    expect(beta?.score).toBe(5);
  });

  it('summarizeQN21 computes percentage and classification', () => {
    const text = QN21_CRITERIA.slice(0, 17)
      .map((c) => c.keywords[0])
      .join(' ');
    const result = evaluateQN21(text);
    const summary = summarizeQN21(result);
    expect(summary.total).toBe(17);
    expect(summary.max).toBe(QN21_CRITERIA.length);
    expect(summary.percentage).toBeGreaterThan(80);
    expect(summary.classification).toBe('accepted');
  });
});
