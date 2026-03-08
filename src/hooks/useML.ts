import { useState, useCallback } from 'react';
import type { MLState, MLMode, RegressionType, MLDataPoint } from '../types/calculator';

// ─── Default state ────────────────────────────────────────────────────────────

const defaultState: MLState = {
  mode: 'regression',
  regressionType: 'linear',
  polynomialDegree: 2,
  kClusters: 3,
  dataPoints: [],
};

// ─── R² computation ───────────────────────────────────────────────────────────

export function computeR2(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0;
  const mean = actual.reduce((s, v) => s + v, 0) / actual.length;
  const ssTot = actual.reduce((s, v) => s + (v - mean) ** 2, 0);
  if (ssTot === 0) return 1;
  const ssRes = actual.reduce((s, v, i) => s + (v - predicted[i]) ** 2, 0);
  return 1 - ssRes / ssTot;
}

// ─── Linear regression ────────────────────────────────────────────────────────

export function linearRegression(
  points: MLDataPoint[],
): { slope: number; intercept: number; r2: number } {
  if (points.length < 2) return { slope: 0, intercept: 0, r2: 0 };

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: 0, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const actual = points.map(p => p.y);
  const predicted = points.map(p => slope * p.x + intercept);
  const r2 = computeR2(actual, predicted);

  return { slope, intercept, r2 };
}

// ─── Polynomial regression ────────────────────────────────────────────────────

// Solve Ax = b using Gaussian elimination with partial pivoting.
function gaussianElim(A: number[][], b: number[]): number[] {
  const n = A.length;
  // Augmented matrix
  const M: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    if (Math.abs(M[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = Math.abs(M[i][i]) < 1e-12 ? 0 : sum / M[i][i];
  }
  return x;
}

export function polynomialRegression(points: MLDataPoint[], degree: number): number[] {
  const m = degree + 1;
  if (points.length < m) return [];

  // Build normal equations: (V^T V) c = V^T y
  // Vandermonde matrix rows: [1, x, x^2, ..., x^degree]

  // Compute sums of x^k for k = 0..2*degree
  const xPow: number[] = new Array(2 * degree + 1).fill(0);
  for (const p of points) {
    for (let k = 0; k <= 2 * degree; k++) {
      xPow[k] += Math.pow(p.x, k);
    }
  }

  // Compute sums of y * x^k for k = 0..degree
  const xyPow: number[] = new Array(m).fill(0);
  for (const p of points) {
    for (let k = 0; k < m; k++) {
      xyPow[k] += p.y * Math.pow(p.x, k);
    }
  }

  // Build (m x m) normal equation matrix
  const A: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < m; j++) {
      row.push(xPow[i + j]);
    }
    A.push(row);
  }

  return gaussianElim(A, xyPow);
}

// ─── Evaluate polynomial ──────────────────────────────────────────────────────

export function evalPolynomial(coeffs: number[], x: number): number {
  return coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);
}

// ─── Exponential regression ───────────────────────────────────────────────────

export function exponentialRegression(
  points: MLDataPoint[],
): { a: number; b: number; r2: number } {
  const valid = points.filter(p => p.y > 0);
  if (valid.length < 2) return { a: 1, b: 0, r2: 0 };

  const transformed: MLDataPoint[] = valid.map(p => ({ x: p.x, y: Math.log(p.y) }));
  const { slope, intercept, r2 } = linearRegression(transformed);
  const a = Math.exp(intercept);
  const b = slope;

  return { a, b, r2 };
}

// ─── K-means clustering ───────────────────────────────────────────────────────

export interface KMeansResult {
  centroids: MLDataPoint[];
  labels: number[];
  iterations: number;
}

export function kMeans(points: MLDataPoint[], k: number, maxIter = 50): KMeansResult {
  if (points.length === 0 || k <= 0) {
    return { centroids: [], labels: [], iterations: 0 };
  }

  const effectiveK = Math.min(k, points.length);

  // Initialize centroids: first k points or spread evenly
  let centroids: MLDataPoint[];
  if (points.length >= effectiveK) {
    if (points.length === effectiveK) {
      centroids = points.map(p => ({ x: p.x, y: p.y }));
    } else {
      // Spread evenly across the dataset
      centroids = Array.from({ length: effectiveK }, (_, i) => {
        const idx = Math.round((i / effectiveK) * points.length);
        const p = points[Math.min(idx, points.length - 1)];
        return { x: p.x, y: p.y };
      });
    }
  } else {
    centroids = points.map(p => ({ x: p.x, y: p.y }));
  }

  let labels: number[] = new Array(points.length).fill(0);
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations++;

    // Assignment step
    const newLabels: number[] = points.map(p => {
      let bestCluster = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dx = p.x - centroids[c].x;
        const dy = p.y - centroids[c].y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          bestCluster = c;
        }
      }
      return bestCluster;
    });

    // Check convergence
    const converged = newLabels.every((l, i) => l === labels[i]);
    labels = newLabels;
    if (converged && iter > 0) break;

    // Update step
    const newCentroids: MLDataPoint[] = centroids.map((_, c) => {
      const clusterPoints = points.filter((__, i) => labels[i] === c);
      if (clusterPoints.length === 0) return centroids[c];
      const cx = clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length;
      const cy = clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length;
      return { x: cx, y: cy };
    });

    centroids = newCentroids;
  }

  return { centroids, labels, iterations };
}

// ─── Logistic regression ──────────────────────────────────────────────────────

export function logisticRegression(
  points: MLDataPoint[],
): { w0: number; w1: number; w2: number } {
  const binary = points.filter(p => p.label === 0 || p.label === 1);
  const classes = new Set(binary.map(p => p.label));
  if (binary.length < 4 || classes.size < 2) return { w0: 0, w1: 1, w2: -1 };

  const lr = 0.1;
  const iterations = 200;
  let w0 = 0;
  let w1 = 0;
  let w2 = 0;

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

  for (let iter = 0; iter < iterations; iter++) {
    let g0 = 0;
    let g1 = 0;
    let g2 = 0;
    for (const p of binary) {
      const y = p.label as number;
      const z = w0 + w1 * p.x + w2 * p.y;
      const pred = sigmoid(z);
      const err = pred - y;
      g0 += err;
      g1 += err * p.x;
      g2 += err * p.y;
    }
    const n = binary.length;
    w0 -= lr * g0 / n;
    w1 -= lr * g1 / n;
    w2 -= lr * g2 / n;
  }

  return { w0, w1, w2 };
}

// ─── Random data generators ───────────────────────────────────────────────────

function randn(): number {
  // Box-Muller transform
  const u = Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u + 1e-15)) * Math.cos(2 * Math.PI * v);
}

export function generateLinearData(n: number, noise: number): MLDataPoint[] {
  return Array.from({ length: n }, () => {
    const x = (Math.random() * 6) - 3; // uniform in [-3, 3]
    const y = 2 * x + 1 + noise * randn();
    return { x, y };
  });
}

export function generateClusteredData(n: number, k: number): MLDataPoint[] {
  // Random cluster centers in [-2, 2]
  const centers: { x: number; y: number }[] = Array.from({ length: k }, () => ({
    x: (Math.random() * 4) - 2,
    y: (Math.random() * 4) - 2,
  }));

  return Array.from({ length: n }, (_, i) => {
    const c = centers[i % k];
    return {
      x: c.x + 0.3 * randn(),
      y: c.y + 0.3 * randn(),
      label: i % k,
    };
  });
}

export function generateClassificationData(n: number): MLDataPoint[] {
  const half = Math.floor(n / 2);
  const class0: MLDataPoint[] = Array.from({ length: half }, () => ({
    x: -1 + 0.5 * randn(),
    y: -1 + 0.5 * randn(),
    label: 0,
  }));
  const class1: MLDataPoint[] = Array.from({ length: n - half }, () => ({
    x: 1 + 0.5 * randn(),
    y: 1 + 0.5 * randn(),
    label: 1,
  }));
  return [...class0, ...class1];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useML() {
  const [state, setState] = useState<MLState>(defaultState);

  const setMode = useCallback((mode: MLMode) => {
    setState(s => ({ ...s, mode }));
  }, []);

  const setRegressionType = useCallback((regressionType: RegressionType) => {
    setState(s => ({ ...s, regressionType }));
  }, []);

  const setPolynomialDegree = useCallback((polynomialDegree: number) => {
    setState(s => ({ ...s, polynomialDegree }));
  }, []);

  const setKClusters = useCallback((kClusters: number) => {
    setState(s => ({ ...s, kClusters }));
  }, []);

  const setDataPoints = useCallback((dataPoints: MLDataPoint[]) => {
    setState(s => ({ ...s, dataPoints }));
  }, []);

  const addPoint = useCallback((point: MLDataPoint) => {
    setState(s => ({ ...s, dataPoints: [...s.dataPoints, point] }));
  }, []);

  const clearPoints = useCallback(() => {
    setState(s => ({ ...s, dataPoints: [] }));
  }, []);

  const generateData = useCallback(() => {
    setState(s => {
      let dataPoints: MLDataPoint[];
      if (s.mode === 'regression') {
        dataPoints = generateLinearData(30, 0.5);
      } else if (s.mode === 'kmeans') {
        dataPoints = generateClusteredData(60, s.kClusters);
      } else {
        dataPoints = generateClassificationData(60);
      }
      return { ...s, dataPoints };
    });
  }, []);

  return {
    state,
    setMode,
    setRegressionType,
    setPolynomialDegree,
    setKClusters,
    setDataPoints,
    addPoint,
    clearPoints,
    generateData,
  };
}
