import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useML,
  linearRegression,
  polynomialRegression,
  exponentialRegression,
  evalPolynomial,
  kMeans,
  logisticRegression,
  computeR2,
  generateLinearData,
  generateClusteredData,
  generateClassificationData,
} from './useML';

// ─── linearRegression ─────────────────────────────────────────────────────────

describe('linearRegression', () => {
  it('fits a perfect line y=2x+1 with slope~2, intercept~1, r2~1', () => {
    const points = [-2, -1, 0, 1, 2].map(x => ({ x, y: 2 * x + 1 }));
    const { slope, intercept, r2 } = linearRegression(points);
    expect(slope).toBeCloseTo(2, 5);
    expect(intercept).toBeCloseTo(1, 5);
    expect(r2).toBeCloseTo(1, 5);
  });

  it('returns zeros for empty array', () => {
    const result = linearRegression([]);
    expect(result).toEqual({ slope: 0, intercept: 0, r2: 0 });
  });
});

// ─── polynomialRegression ─────────────────────────────────────────────────────

describe('polynomialRegression', () => {
  it('degree-1 fit on y=3x+2 returns coefficients [2, 3]', () => {
    const points = [-1, 0, 1, 2, 3].map(x => ({ x, y: 3 * x + 2 }));
    const coeffs = polynomialRegression(points, 1);
    expect(coeffs.length).toBe(2);
    expect(coeffs[0]).toBeCloseTo(2, 4); // a0 = intercept
    expect(coeffs[1]).toBeCloseTo(3, 4); // a1 = slope
  });

  it('returns empty array when fewer points than degree+1', () => {
    const points = [{ x: 1, y: 1 }];
    expect(polynomialRegression(points, 2)).toEqual([]);
  });
});

// ─── evalPolynomial ───────────────────────────────────────────────────────────

describe('evalPolynomial', () => {
  it('evalPolynomial([1,2,3], 2) returns 1 + 4 + 12 = 17', () => {
    expect(evalPolynomial([1, 2, 3], 2)).toBeCloseTo(17);
  });

  it('evalPolynomial([5], 10) returns 5', () => {
    expect(evalPolynomial([5], 10)).toBeCloseTo(5);
  });
});

// ─── exponentialRegression ────────────────────────────────────────────────────

describe('exponentialRegression', () => {
  it('fits y=exp(x) with a~1, b~1', () => {
    const points = [-1, 0, 1, 2, 3].map(x => ({ x, y: Math.exp(x) }));
    const { a, b } = exponentialRegression(points);
    expect(a).toBeCloseTo(1, 2);
    expect(b).toBeCloseTo(1, 2);
  });
});

// ─── kMeans ───────────────────────────────────────────────────────────────────

describe('kMeans', () => {
  const pts = Array.from({ length: 12 }, (_, i) => ({ x: i, y: i }));

  it('returns the correct number of centroids', () => {
    const { centroids } = kMeans(pts, 3);
    expect(centroids.length).toBe(3);
  });

  it('labels array has the same length as input', () => {
    const { labels } = kMeans(pts, 3);
    expect(labels.length).toBe(pts.length);
  });

  it('each label is in [0, k-1]', () => {
    const k = 3;
    const { labels } = kMeans(pts, k);
    for (const label of labels) {
      expect(label).toBeGreaterThanOrEqual(0);
      expect(label).toBeLessThanOrEqual(k - 1);
    }
  });
});

// ─── computeR2 ────────────────────────────────────────────────────────────────

describe('computeR2', () => {
  it('returns 1 for perfect prediction', () => {
    const values = [1, 2, 3, 4, 5];
    expect(computeR2(values, values)).toBeCloseTo(1);
  });

  it('returns 0 when predicting the mean', () => {
    const actual = [1, 2, 3, 4, 5];
    const mean = actual.reduce((s, v) => s + v, 0) / actual.length;
    const predicted = actual.map(() => mean);
    expect(computeR2(actual, predicted)).toBeCloseTo(0);
  });
});

// ─── data generators ──────────────────────────────────────────────────────────

describe('generateLinearData', () => {
  it('returns exactly 20 points', () => {
    expect(generateLinearData(20, 0).length).toBe(20);
  });
});

describe('generateClusteredData', () => {
  it('returns exactly 30 points', () => {
    expect(generateClusteredData(30, 3).length).toBe(30);
  });
});

describe('generateClassificationData', () => {
  it('returns exactly 20 points', () => {
    const pts = generateClassificationData(20);
    expect(pts.length).toBe(20);
  });

  it('all labels are 0 or 1', () => {
    const pts = generateClassificationData(20);
    for (const p of pts) {
      expect(p.label === 0 || p.label === 1).toBe(true);
    }
  });
});

// ─── logisticRegression ───────────────────────────────────────────────────────

describe('logisticRegression', () => {
  it('returns object with w0, w1, w2 properties', () => {
    const pts = generateClassificationData(20);
    const result = logisticRegression(pts);
    expect(result).toHaveProperty('w0');
    expect(result).toHaveProperty('w1');
    expect(result).toHaveProperty('w2');
  });

  it('returns default {w0:0, w1:1, w2:-1} for fewer than 4 points', () => {
    const pts = [
      { x: 0, y: 0, label: 0 },
      { x: 1, y: 1, label: 1 },
    ];
    expect(logisticRegression(pts)).toEqual({ w0: 0, w1: 1, w2: -1 });
  });
});

// ─── useML hook ───────────────────────────────────────────────────────────────

describe('useML hook', () => {
  it('initializes with mode "regression"', () => {
    const { result } = renderHook(() => useML());
    expect(result.current.state.mode).toBe('regression');
  });

  it('setMode updates mode', () => {
    const { result } = renderHook(() => useML());
    act(() => result.current.setMode('kmeans'));
    expect(result.current.state.mode).toBe('kmeans');
  });

  it('setKClusters updates kClusters', () => {
    const { result } = renderHook(() => useML());
    act(() => result.current.setKClusters(5));
    expect(result.current.state.kClusters).toBe(5);
  });

  it('addPoint adds a point to dataPoints', () => {
    const { result } = renderHook(() => useML());
    act(() => result.current.addPoint({ x: 1, y: 2 }));
    expect(result.current.state.dataPoints.length).toBe(1);
    expect(result.current.state.dataPoints[0]).toEqual({ x: 1, y: 2 });
  });

  it('clearPoints empties dataPoints', () => {
    const { result } = renderHook(() => useML());
    act(() => {
      result.current.addPoint({ x: 1, y: 2 });
      result.current.addPoint({ x: 3, y: 4 });
    });
    act(() => result.current.clearPoints());
    expect(result.current.state.dataPoints.length).toBe(0);
  });

  it('generateData in regression mode adds ~30 points', () => {
    const { result } = renderHook(() => useML());
    act(() => result.current.generateData());
    expect(result.current.state.dataPoints.length).toBe(30);
  });

  it('setRegressionType updates regressionType', () => {
    const { result } = renderHook(() => useML());
    act(() => result.current.setRegressionType('polynomial'));
    expect(result.current.state.regressionType).toBe('polynomial');
  });

  it('setPolynomialDegree updates polynomialDegree', () => {
    const { result } = renderHook(() => useML());
    act(() => result.current.setPolynomialDegree(3));
    expect(result.current.state.polynomialDegree).toBe(3);
  });
});
