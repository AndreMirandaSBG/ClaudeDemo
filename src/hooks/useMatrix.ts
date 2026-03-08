import { useState, useCallback } from 'react';
import type { MatrixState, MatrixOp, MatrixSize } from '../types/calculator';

// ─── Matrix arithmetic ────────────────────────────────────────────────────────

export function matAdd(A: number[][], B: number[][]): number[][] {
  return A.map((row, i) => row.map((v, j) => v + B[i][j]));
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const n = A.length;
  const p = B[0].length;
  const m = B.length;
  const C: number[][] = Array.from({ length: n }, () => new Array(p).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < p; j++)
      for (let k = 0; k < m; k++)
        C[i][j] += A[i][k] * B[k][j];
  return C;
}

export function det2(A: number[][]): number {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function det3(A: number[][]): number {
  const [r0, r1, r2] = A;
  return r0[0] * (r1[1] * r2[2] - r1[2] * r2[1])
       - r0[1] * (r1[0] * r2[2] - r1[2] * r2[0])
       + r0[2] * (r1[0] * r2[1] - r1[1] * r2[0]);
}

export function inv2(A: number[][]): number[][] | null {
  const d = det2(A);
  if (Math.abs(d) < 1e-12) return null;
  return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
}

export function inv3(A: number[][]): number[][] | null {
  const d = det3(A);
  if (Math.abs(d) < 1e-12) return null;
  const [r0, r1, r2] = A;
  const cofactors = [
    [r1[1]*r2[2]-r1[2]*r2[1], -(r1[0]*r2[2]-r1[2]*r2[0]), r1[0]*r2[1]-r1[1]*r2[0]],
    [-(r0[1]*r2[2]-r0[2]*r2[1]), r0[0]*r2[2]-r0[2]*r2[0], -(r0[0]*r2[1]-r0[1]*r2[0])],
    [r0[1]*r1[2]-r0[2]*r1[1], -(r0[0]*r1[2]-r0[2]*r1[0]), r0[0]*r1[1]-r0[1]*r1[0]],
  ];
  // Return adjugate (transpose of cofactor matrix) divided by det
  return cofactors[0].map((_, j) => cofactors.map(row => row[j] / d));
}

// ─── LU decomposition (Doolittle, no pivoting) ────────────────────────────────

export interface LUResult {
  L: number[][];
  U: number[][];
  steps: string[];
}

export function luDecompose(A: number[][], n: number): LUResult {
  const L: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  const U: number[][] = A.map(row => [...row]);
  const steps: string[] = ['LU Decomposition (Doolittle, no pivoting)', 'A = L · U'];

  for (let k = 0; k < n; k++) {
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(U[k][k]) < 1e-12) { steps.push('Warning: near-zero pivot'); continue; }
      const factor = U[i][k] / U[k][k];
      L[i][k] = factor;
      steps.push(`L[${i + 1}][${k + 1}] = ${factor.toFixed(4)}`);
      for (let j = k; j < n; j++) U[i][j] -= factor * U[k][j];
    }
  }
  steps.push('Decomposition complete');
  return { L, U, steps };
}

// ─── QR decomposition (Gram-Schmidt) ─────────────────────────────────────────

export interface QRResult {
  Q: number[][];
  R: number[][];
  steps: string[];
}

export function qrDecompose(A: number[][], n: number): QRResult {
  const cols: number[][] = Array.from({ length: n }, (_, j) => A.map(row => row[j]));
  const qCols: number[][] = [];
  const R: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const steps: string[] = ['QR Decomposition (Gram-Schmidt orthogonalization)', 'A = Q · R'];

  for (let j = 0; j < n; j++) {
    let v = [...cols[j]];
    for (let i = 0; i < j; i++) {
      const dot = qCols[i].reduce((s, qi, k) => s + qi * cols[j][k], 0);
      R[i][j] = dot;
      v = v.map((vi, k) => vi - dot * qCols[i][k]);
      steps.push(`R[${i + 1}][${j + 1}] = q${i + 1}·a${j + 1} = ${dot.toFixed(4)}`);
    }
    const norm = Math.sqrt(v.reduce((s, vi) => s + vi * vi, 0));
    R[j][j] = norm;
    if (norm < 1e-12) {
      qCols.push(new Array(n).fill(0));
      steps.push(`Column ${j + 1}: linearly dependent`);
    } else {
      qCols.push(v.map(vi => vi / norm));
      steps.push(`‖v${j + 1}‖ = ${norm.toFixed(4)},  q${j + 1} = v${j + 1}/‖v${j + 1}‖`);
    }
  }

  const Q: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => qCols[j][i])
  );
  return { Q, R, steps };
}

// ─── Eigenvalues/eigenvectors for 2×2 ────────────────────────────────────────

export interface EigenResult {
  eigenvalues: { re: number; im: number }[];
  eigenvectors: number[][];
  steps: string[];
}

export function eigen2x2(A: number[][]): EigenResult {
  const [[a, b], [c, d]] = A;
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  const steps: string[] = [
    'Characteristic equation: det(A − λI) = 0',
    `λ² − (a+d)λ + (ad−bc) = 0`,
    `λ² − ${trace}λ + ${det} = 0`,
    `Discriminant: Δ = ${trace}² − 4·${det} = ${disc.toFixed(4)}`,
  ];

  const eigenvalues: { re: number; im: number }[] = [];
  const eigenvectors: number[][] = [];

  if (disc >= 0) {
    const sqrtDisc = Math.sqrt(disc);
    const l1 = (trace + sqrtDisc) / 2;
    const l2 = (trace - sqrtDisc) / 2;
    eigenvalues.push({ re: l1, im: 0 }, { re: l2, im: 0 });
    steps.push(`λ₁ = ${l1.toFixed(6)},  λ₂ = ${l2.toFixed(6)}`);

    for (const lambda of [l1, l2]) {
      const row = [a - lambda, b];
      const ev = Math.abs(row[0]) > 1e-10 || Math.abs(row[1]) > 1e-10
        ? [-row[1], row[0]]
        : [-c, a - lambda];
      const norm = Math.sqrt(ev[0] * ev[0] + ev[1] * ev[1]);
      eigenvectors.push(norm > 1e-10 ? ev.map(v => v / norm) : [1, 0]);
    }
    steps.push(`v₁ = [${eigenvectors[0].map(v => v.toFixed(4)).join(', ')}]`);
    steps.push(`v₂ = [${eigenvectors[1].map(v => v.toFixed(4)).join(', ')}]`);
  } else {
    const re = trace / 2;
    const im = Math.sqrt(-disc) / 2;
    eigenvalues.push({ re, im }, { re, im: -im });
    steps.push(`Complex eigenvalues: λ = ${re.toFixed(4)} ± ${im.toFixed(4)}i`);
    steps.push('No real eigenvectors for complex eigenvalues');
  }

  return { eigenvalues, eigenvectors, steps };
}

// ─── Result type ──────────────────────────────────────────────────────────────

export interface MatrixResult {
  matrix?: number[][];
  scalar?: number;
  eigenvalues?: { re: number; im: number }[];
  eigenvectors?: number[][];
  L?: number[][];
  U?: number[][];
  Q?: number[][];
  R?: number[][];
  steps: string[];
  error?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface MatrixHookState extends MatrixState {
  result: MatrixResult | null;
}

const DEFAULT_STATE: MatrixHookState = {
  matrixA: [[2, 1], [1, 3]],
  matrixB: [[1, 0], [0, 1]],
  op: 'determinant',
  size: 2,
  animateT: 1,
  result: null,
};

export function useMatrix() {
  const [state, setState] = useState<MatrixHookState>(DEFAULT_STATE);

  const setCell = useCallback((matrix: 'A' | 'B', row: number, col: number, value: number) => {
    setState(s => {
      const m = (matrix === 'A' ? s.matrixA : s.matrixB).map(r => [...r]);
      m[row][col] = value;
      return matrix === 'A' ? { ...s, matrixA: m } : { ...s, matrixB: m };
    });
  }, []);

  const setOp = useCallback((op: MatrixOp) => setState(s => ({ ...s, op })), []);

  const setSize = useCallback((size: MatrixSize) => {
    setState(s => {
      const expand = (src: number[][], n: number) =>
        Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => src[i]?.[j] ?? (i === j ? 1 : 0))
        );
      return { ...s, size, matrixA: expand(s.matrixA, size), matrixB: expand(s.matrixB, size), result: null };
    });
  }, []);

  const setAnimateT = useCallback((animateT: number) => setState(s => ({ ...s, animateT })), []);

  const compute = useCallback(() => {
    setState(s => {
      const { matrixA: A, matrixB: B, op, size: n } = s;
      let result: MatrixResult;
      try {
        switch (op) {
          case 'add':
            result = { matrix: matAdd(A, B), steps: ['C = A + B', 'C[i][j] = A[i][j] + B[i][j]'] };
            break;
          case 'multiply':
            result = { matrix: matMul(A, B), steps: ['C = A × B', 'C[i][j] = Σₖ A[i][k] · B[k][j]'] };
            break;
          case 'inverse': {
            const inv = n === 2 ? inv2(A) : inv3(A);
            if (!inv) {
              result = { steps: [], error: 'Matrix is singular (det = 0), no inverse exists' };
            } else {
              const d = n === 2 ? det2(A) : det3(A);
              result = { matrix: inv, steps: [`det(A) = ${d.toFixed(6)}`, 'A⁻¹ = adj(A) / det(A)'] };
            }
            break;
          }
          case 'determinant': {
            const d = n === 2 ? det2(A) : det3(A);
            const steps = n === 2
              ? [`det(A) = a·d − b·c`, `= ${A[0][0]}·${A[1][1]} − ${A[0][1]}·${A[1][0]}`, `= ${d.toFixed(6)}`]
              : ['det(A) by cofactor expansion along row 1', `= ${d.toFixed(6)}`];
            result = { scalar: d, steps };
            break;
          }
          case 'lu': {
            const { L, U, steps } = luDecompose(A, n);
            result = { L, U, steps };
            break;
          }
          case 'qr': {
            const { Q, R, steps } = qrDecompose(A, n);
            result = { Q, R, steps };
            break;
          }
          case 'eigen': {
            if (n !== 2) {
              result = { steps: [], error: 'Eigenvalue decomposition requires a 2×2 matrix' };
            } else {
              const { eigenvalues, eigenvectors, steps } = eigen2x2(A);
              result = { eigenvalues, eigenvectors, steps };
            }
            break;
          }
          case 'transform': {
            result = {
              steps: [
                '2D Linear Transformation',
                `A·e₁ = [${A[0][0].toFixed(3)}, ${A[1][0].toFixed(3)}]`,
                `A·e₂ = [${A[0][1].toFixed(3)}, ${A[1][1].toFixed(3)}]`,
                'Canvas: blue = original, red = transformed',
              ],
            };
            break;
          }
          default:
            result = { steps: [], error: 'Unknown operation' };
        }
      } catch (err) {
        result = { steps: [], error: String(err) };
      }
      return { ...s, result };
    });
  }, []);

  return { state, setCell, setOp, setSize, setAnimateT, compute };
}
