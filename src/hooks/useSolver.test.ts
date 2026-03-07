import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSolver, parsePolynomial, solvePolynomial, solveTrigEquation, solveLinear2x2 } from './useSolver';

describe('parsePolynomial', () => {
  it('parses coefficient list with spaces', () => {
    expect(parsePolynomial('1 -3 2')).toEqual([1, -3, 2]);
  });

  it('parses coefficient list with commas', () => {
    expect(parsePolynomial('1, -3, 2')).toEqual([1, -3, 2]);
  });

  it('parses coefficient list with mixed separators', () => {
    expect(parsePolynomial('2, -1, 0, 5')).toEqual([2, -1, 0, 5]);
  });

  it('parses x^2 - 3x + 2 expression', () => {
    expect(parsePolynomial('x^2 - 3x + 2')).toEqual([1, -3, 2]);
  });

  it('parses 2x^3 - x + 1 expression', () => {
    expect(parsePolynomial('2x^3 - x + 1')).toEqual([2, 0, -1, 1]);
  });

  it('parses x^6 - 1', () => {
    expect(parsePolynomial('x^6 - 1')).toEqual([1, 0, 0, 0, 0, 0, -1]);
  });

  it('parses linear: x - 5', () => {
    expect(parsePolynomial('x - 5')).toEqual([1, -5]);
  });

  it('parses 3x^2 + 2.5x - 1', () => {
    const coeffs = parsePolynomial('3x^2 + 2.5x - 1');
    expect(coeffs).not.toBeNull();
    expect(coeffs![0]).toBeCloseTo(3);
    expect(coeffs![1]).toBeCloseTo(2.5);
    expect(coeffs![2]).toBeCloseTo(-1);
  });

  it('strips = 0 suffix', () => {
    expect(parsePolynomial('x^2 - 1 = 0')).toEqual([1, 0, -1]);
  });

  it('returns null for empty string', () => {
    expect(parsePolynomial('')).toBeNull();
  });

  it('returns null for degree > 6', () => {
    expect(parsePolynomial('x^7')).toBeNull();
  });

  it('parses floating point coefficients in list', () => {
    const coeffs = parsePolynomial('1.5, -2.5, 0.75');
    expect(coeffs).not.toBeNull();
    expect(coeffs![0]).toBeCloseTo(1.5);
  });
});

describe('solvePolynomial', () => {
  it('solves degree 1: x - 5 = 0 → x = 5', () => {
    const result = solvePolynomial([1, -5]);
    expect(result.degree).toBe(1);
    expect(result.roots).toHaveLength(1);
    expect(result.roots[0].re).toBeCloseTo(5);
    expect(result.roots[0].isReal).toBe(true);
  });

  it('solves degree 1: 2x + 4 = 0 → x = -2', () => {
    const result = solvePolynomial([2, 4]);
    expect(result.roots[0].re).toBeCloseTo(-2);
  });

  it('solves degree 2 with two real roots: x^2 - 3x + 2 = (x-1)(x-2)', () => {
    const result = solvePolynomial([1, -3, 2]);
    expect(result.degree).toBe(2);
    expect(result.roots).toHaveLength(2);
    const reals = result.roots.filter(r => r.isReal).map(r => r.re).sort((a, b) => a - b);
    expect(reals[0]).toBeCloseTo(1);
    expect(reals[1]).toBeCloseTo(2);
  });

  it('solves degree 2 with complex roots: x^2 + 1 = 0', () => {
    const result = solvePolynomial([1, 0, 1]);
    expect(result.roots).toHaveLength(2);
    expect(result.roots.every(r => !r.isReal)).toBe(true);
    expect(result.roots[0].im).toBeCloseTo(1);
    expect(result.roots[1].im).toBeCloseTo(-1);
  });

  it('solves degree 2 double root: x^2 - 2x + 1 = (x-1)^2', () => {
    const result = solvePolynomial([1, -2, 1]);
    const reals = result.roots.filter(r => r.isReal);
    expect(reals.length).toBeGreaterThan(0);
    expect(reals[0].re).toBeCloseTo(1);
  });

  it('solves degree 3: x^3 - 6x^2 + 11x - 6 = (x-1)(x-2)(x-3)', () => {
    const result = solvePolynomial([1, -6, 11, -6]);
    expect(result.degree).toBe(3);
    expect(result.roots).toHaveLength(3);
    const reals = result.roots.filter(r => r.isReal).map(r => r.re).sort((a, b) => a - b);
    expect(reals[0]).toBeCloseTo(1, 4);
    expect(reals[1]).toBeCloseTo(2, 4);
    expect(reals[2]).toBeCloseTo(3, 4);
  });

  it('solves degree 4: x^4 - 1 = 0 (roots ±1, ±i)', () => {
    const result = solvePolynomial([1, 0, 0, 0, -1]);
    expect(result.degree).toBe(4);
    expect(result.roots).toHaveLength(4);
    const realRoots = result.roots.filter(r => r.isReal).map(r => r.re).sort((a, b) => a - b);
    expect(realRoots[0]).toBeCloseTo(-1, 4);
    expect(realRoots[1]).toBeCloseTo(1, 4);
  });

  it('generates steps for degree 1', () => {
    const result = solvePolynomial([1, -5]);
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps.some(s => s.description.toLowerCase().includes('linear'))).toBe(true);
  });

  it('generates steps including discriminant for degree 2', () => {
    const result = solvePolynomial([1, -3, 2]);
    expect(result.steps.some(s => s.description.toLowerCase().includes('discriminant'))).toBe(true);
  });

  it('generates numerical method steps for degree 3+', () => {
    const result = solvePolynomial([1, 0, 0, -1]);
    expect(result.steps.some(s => s.description.toLowerCase().includes('durand'))).toBe(true);
  });

  it('returns error for degree 0', () => {
    const result = solvePolynomial([5]);
    expect(result.error).toBeTruthy();
  });
});

describe('solveTrigEquation', () => {
  it('solves sin(x) = 0', () => {
    const result = solveTrigEquation('sin', 0);
    expect(result.roots.some(r => Math.abs(r.re) < 1e-8)).toBe(true);
  });

  it('solves cos(x) = 1 → x = 0', () => {
    const result = solveTrigEquation('cos', 1);
    expect(result.roots.some(r => Math.abs(r.re) < 1e-8)).toBe(true);
  });

  it('solves tan(x) = 1 → x ≈ π/4', () => {
    const result = solveTrigEquation('tan', 1);
    expect(result.roots[0].re).toBeCloseTo(Math.PI / 4, 4);
  });

  it('returns error for sin(x) = 2 (out of range)', () => {
    const result = solveTrigEquation('sin', 2);
    expect(result.error).toBeTruthy();
    expect(result.roots).toHaveLength(0);
  });

  it('generates steps with general solution', () => {
    const result = solveTrigEquation('sin', 0.5);
    expect(result.steps.some(s => s.description.toLowerCase().includes('general'))).toBe(true);
  });
});

describe('solveLinear2x2', () => {
  it('solves 2x + y = 5, x - y = 1 → x=2, y=1', () => {
    const result = solveLinear2x2([[2, 1], [1, -1]], [5, 1]);
    expect(result.roots[0].re).toBeCloseTo(2);
    expect(result.roots[1].re).toBeCloseTo(1);
  });

  it('returns error for singular system', () => {
    const result = solveLinear2x2([[1, 2], [2, 4]], [5, 10]);
    expect(result.error).toBeTruthy();
  });

  it('generates steps including Cramer', () => {
    const result = solveLinear2x2([[2, 1], [1, -1]], [5, 1]);
    expect(result.steps.some(s => s.description.toLowerCase().includes('cramer'))).toBe(true);
  });
});

describe('useSolver hook', () => {
  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSolver());
    expect(result.current.input).toBe('');
    expect(result.current.result).toBeNull();
    expect(result.current.stepsOpen).toBe(false);
  });

  it('setInput updates input', () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.setInput('x^2 - 1'));
    expect(result.current.input).toBe('x^2 - 1');
  });

  it('solve produces result for valid polynomial', () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.setInput('x - 3'));
    act(() => result.current.solve());
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.roots[0].re).toBeCloseTo(3);
  });

  it('solve produces error for invalid input', () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.setInput('!!!invalid!!!'));
    act(() => result.current.solve());
    expect(result.current.result!.error).toBeTruthy();
  });

  it('clearResult resets result', () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.setInput('x - 1'));
    act(() => result.current.solve());
    act(() => result.current.clearResult());
    expect(result.current.result).toBeNull();
  });

  it('toggleSteps opens and closes steps panel', () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.setInput('x - 1'));
    act(() => result.current.solve());
    act(() => result.current.toggleSteps());
    expect(result.current.stepsOpen).toBe(true);
    act(() => result.current.toggleSteps());
    expect(result.current.stepsOpen).toBe(false);
  });

  it('solve resets stepsOpen to false', () => {
    const { result } = renderHook(() => useSolver());
    act(() => result.current.setInput('x - 1'));
    act(() => result.current.solve());
    act(() => result.current.toggleSteps());
    act(() => result.current.setInput('x - 2'));
    act(() => result.current.solve());
    expect(result.current.stepsOpen).toBe(false);
  });
});
