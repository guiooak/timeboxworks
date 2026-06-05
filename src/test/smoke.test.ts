import { describe, it, expect } from 'vitest';

// Phase-1 smoke test that keeps the CI `test` job green until the real
// unit + integration suites land (plan 2).
describe('smoke', () => {
  it('runs the test toolchain', () => {
    expect(1 + 1).toBe(2);
  });
});
