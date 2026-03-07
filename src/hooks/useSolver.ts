import { useState, useCallback } from 'react';
import type { SolverResult, SolverComplexNumber, SolverStep, TrigFunc } from '../types/calculator';

// ─── Complex arithmetic ───────────────────────────────────────────────────────

interface Cx { re: number; im: number; }
const cadd = (a: Cx, b: Cx): Cx => ({ re: a.re + b.re, im: a.im + b.im });
const csub = (a: Cx, b: Cx): Cx => ({ re: a.re - b.re, im: a.im - b.im });
const cmul = (a: Cx, b: Cx): Cx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const cdiv = (a: Cx, b: Cx): Cx => {
  const d = b.re * b.re + b.im * b.im;
  if (d < 1e-300) return { re: NaN, im: NaN };
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
const cabs = (a: Cx): number => Math.sqrt(a.re * a.re + a.im * a.im);

// ─── Polynomial evaluation ────────────────────────────────────────────────────

function polyEvalCx(coeffs: number[], z: Cx): Cx {
  let r: Cx = { re: coeffs[0], im: 0 };
  for (let i = 1; i < coeffs.length; i++) {
    r = cadd(cmul(r, z), { re: coeffs[i], im: 0 });
  }
  return r;
}

// ─── Durand-Kerner root finder ────────────────────────────────────────────────

function durandKerner(coeffs: number[]): Cx[] {
  const n = coeffs.length - 1;
  if (n <= 0) return [];
  const lead = coeffs[0];
  const mc = coeffs.map(c => c / lead);

  // Initial guesses on a circle
  const roots: Cx[] = Array.from({ length: n }, (_, k) => {
    const ang = (2 * Math.PI * k) / n + 0.123;
    return { re: 0.4 * Math.cos(ang), im: 0.4 * Math.sin(ang) };
  });

  for (let iter = 0; iter < 300; iter++) {
    let maxDelta = 0;
    const updates: Cx[] = [];
    for (let i = 0; i < n; i++) {
      const pr = polyEvalCx(mc, roots[i]);
      let denom: Cx = { re: 1, im: 0 };
      for (let j = 0; j < n; j++) {
        if (j !== i) denom = cmul(denom, csub(roots[i], roots[j]));
      }
      const delta = cdiv(pr, denom);
      maxDelta = Math.max(maxDelta, cabs(delta));
      updates.push(csub(roots[i], delta));
    }
    for (let i = 0; i < n; i++) roots[i] = updates[i];
    if (maxDelta < 1e-12) break;
  }
  return roots;
}

function toSolverRoot(cx: Cx): SolverComplexNumber {
  return { re: cx.re, im: cx.im, isReal: Math.abs(cx.im) < 1e-8 };
}

// ─── Polynomial parser ────────────────────────────────────────────────────────

export function parsePolynomial(input: string): number[] | null {
  const s = input.trim();
  if (!s) return null;

  // Check if it's a coefficient list (numbers separated by spaces/commas)
  const parts = s.split(/[\s,]+/);
  if (parts.length >= 2) {
    const nums = parts.map(Number);
    if (nums.every(n => isFinite(n) && !isNaN(n))) return nums;
  }

  // Parse as algebraic polynomial expression
  const normalized = s.replace(/\s+/g, '').toLowerCase().replace(/=.*$/, '').replace(/\*/g, '');
  if (!normalized) return null;

  // Add leading sign for uniform parsing
  const withSign = /^[+-]/.test(normalized) ? normalized : '+' + normalized;

  // Split into signed terms
  const terms: string[] = [];
  let current = '';
  for (let i = 0; i < withSign.length; i++) {
    const c = withSign[i];
    if ((c === '+' || c === '-') && i > 0) {
      if (current) terms.push(current);
      current = c;
    } else {
      current += c;
    }
  }
  if (current) terms.push(current);

  const termMap = new Map<number, number>();

  for (const term of terms) {
    const sign = term[0] === '-' ? -1 : 1;
    const body = term.slice(1);
    const xIdx = body.indexOf('x');

    if (xIdx >= 0) {
      const coeffStr = body.slice(0, xIdx);
      const powerStr = body.slice(xIdx + 1);

      let coeff: number;
      if (coeffStr === '' || coeffStr === '+') coeff = 1;
      else { coeff = parseFloat(coeffStr); if (!isFinite(coeff)) return null; }

      let power: number;
      if (powerStr === '') power = 1;
      else if (powerStr.startsWith('^')) { power = parseInt(powerStr.slice(1)); if (!isFinite(power)) return null; }
      else return null;

      if (power < 0 || power > 6) return null;
      termMap.set(power, (termMap.get(power) ?? 0) + sign * coeff);
    } else {
      const val = parseFloat(body);
      if (!isFinite(val)) return null;
      termMap.set(0, (termMap.get(0) ?? 0) + sign * val);
    }
  }

  if (termMap.size === 0) return null;
  const maxDeg = Math.max(...termMap.keys());
  if (maxDeg > 6) return null;

  const coeffs: number[] = [];
  for (let d = maxDeg; d >= 0; d--) coeffs.push(termMap.get(d) ?? 0);
  return coeffs;
}

// ─── Step generators ──────────────────────────────────────────────────────────

function stepsForDegree1(a: number, b: number): SolverStep[] {
  const x = -b / a;
  return [
    { description: 'Linear equation: ax + b = 0', formula: `${a}x + (${b}) = 0` },
    { description: 'Isolate x by subtracting the constant', formula: `${a}x = ${-b}` },
    { description: 'Divide both sides by the leading coefficient', formula: `x = ${-b} / ${a} = ${x}` },
  ];
}

function stepsForDegree2(a: number, b: number, c: number): SolverStep[] {
  const disc = b * b - 4 * a * c;
  const steps: SolverStep[] = [
    { description: 'Quadratic equation: ax² + bx + c = 0', formula: `${a}x² + (${b})x + (${c}) = 0` },
    { description: 'Compute discriminant Δ = b² − 4ac', formula: `Δ = (${b})² − 4·(${a})·(${c}) = ${disc.toFixed(6)}` },
  ];
  if (disc > 0) {
    const sqrtDisc = Math.sqrt(disc);
    steps.push({ description: 'Two distinct real roots (Δ > 0)', formula: `x = (−b ± √Δ) / (2a) = (${-b} ± ${sqrtDisc.toFixed(6)}) / ${2 * a}` });
  } else if (Math.abs(disc) < 1e-10) {
    steps.push({ description: 'One real root — double root (Δ = 0)', formula: `x = −b / (2a) = ${(-b / (2 * a)).toFixed(6)}` });
  } else {
    const realPart = -b / (2 * a);
    const imagPart = Math.sqrt(-disc) / (2 * a);
    steps.push({ description: 'Two complex conjugate roots (Δ < 0)', formula: `x = ${realPart.toFixed(6)} ± ${imagPart.toFixed(6)}i` });
  }
  return steps;
}

function stepsForHighDegree(n: number): SolverStep[] {
  return [
    { description: `Degree-${n} polynomial detected` },
    { description: 'Applying Durand-Kerner numerical root-finding method' },
    { description: 'Iteratively refining initial guesses until convergence (tol = 1e-12)' },
    { description: 'Roots classified as real if |Im| < 1e-8' },
  ];
}

// ─── Polynomial solver ────────────────────────────────────────────────────────

export function solvePolynomial(coeffs: number[]): SolverResult {
  const n = coeffs.length - 1;
  if (n <= 0) return { roots: [], steps: [], degree: 0, error: 'No variables in equation' };

  let steps: SolverStep[];
  let roots: SolverComplexNumber[];

  if (n === 1) {
    const [a, b] = coeffs;
    steps = stepsForDegree1(a, b);
    roots = [toSolverRoot({ re: -b / a, im: 0 })];
  } else if (n === 2) {
    const [a, b, c] = coeffs;
    steps = stepsForDegree2(a, b, c);
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sqrtDisc = Math.sqrt(disc);
      roots = [
        toSolverRoot({ re: (-b + sqrtDisc) / (2 * a), im: 0 }),
        toSolverRoot({ re: (-b - sqrtDisc) / (2 * a), im: 0 }),
      ];
    } else {
      const realPart = -b / (2 * a);
      const imagPart = Math.sqrt(-disc) / (2 * a);
      roots = [
        { re: realPart, im: imagPart, isReal: false },
        { re: realPart, im: -imagPart, isReal: false },
      ];
    }
  } else {
    steps = stepsForHighDegree(n);
    roots = durandKerner(coeffs).map(toSolverRoot);
  }

  return { roots, steps, degree: n };
}

// ─── Trig equation solver ─────────────────────────────────────────────────────

export function solveTrigEquation(func: TrigFunc, rhs: number): SolverResult {
  const steps: SolverStep[] = [
    { description: `${func}(x) = ${rhs}`, formula: `${func}(x) = ${rhs}` },
  ];

  if (func === 'sin' || func === 'cos') {
    if (rhs < -1 || rhs > 1) {
      return { roots: [], steps: [...steps, { description: 'No real solution: |rhs| > 1' }], degree: 1, error: 'No real solutions' };
    }
  }

  const roots: SolverComplexNumber[] = [];

  if (func === 'sin') {
    const x0 = Math.asin(rhs);
    roots.push({ re: x0, im: 0, isReal: true }, { re: Math.PI - x0, im: 0, isReal: true });
    steps.push({ description: 'Principal solutions', formula: `x = arcsin(${rhs}) = ${x0.toFixed(6)}, x = π − arcsin(${rhs}) = ${(Math.PI - x0).toFixed(6)}` });
    steps.push({ description: 'General solution', formula: `x = ${x0.toFixed(4)} + 2kπ  or  x = ${(Math.PI - x0).toFixed(4)} + 2kπ,  k ∈ ℤ` });
  } else if (func === 'cos') {
    const x0 = Math.acos(rhs);
    roots.push({ re: x0, im: 0, isReal: true }, { re: -x0, im: 0, isReal: true });
    steps.push({ description: 'Principal solutions', formula: `x = ±arccos(${rhs}) = ±${x0.toFixed(6)}` });
    steps.push({ description: 'General solution', formula: `x = ±${x0.toFixed(4)} + 2kπ,  k ∈ ℤ` });
  } else {
    const x0 = Math.atan(rhs);
    roots.push({ re: x0, im: 0, isReal: true });
    steps.push({ description: 'Principal solution', formula: `x = arctan(${rhs}) = ${x0.toFixed(6)}` });
    steps.push({ description: 'General solution', formula: `x = ${x0.toFixed(4)} + kπ,  k ∈ ℤ` });
  }

  return { roots, steps, degree: 1 };
}

// ─── Linear 2×2 solver ────────────────────────────────────────────────────────

export function solveLinear2x2(a: number[][], b: number[]): SolverResult {
  const [[a11, a12], [a21, a22]] = a;
  const [b1, b2] = b;
  const D = a11 * a22 - a12 * a21;
  const steps: SolverStep[] = [
    { description: '2×2 Linear system using Cramer\'s rule' },
    { description: 'Compute determinant', formula: `D = a11·a22 − a12·a21 = ${a11}·${a22} − ${a12}·${a21} = ${D}` },
  ];

  if (Math.abs(D) < 1e-12) {
    return { roots: [], steps: [...steps, { description: 'D = 0 → system has no unique solution' }], degree: 1, error: 'Singular system' };
  }

  const x = (b1 * a22 - a12 * b2) / D;
  const y = (a11 * b2 - b1 * a21) / D;
  steps.push({ description: 'Solve for x', formula: `x = (b1·a22 − a12·b2) / D = ${x.toFixed(6)}` });
  steps.push({ description: 'Solve for y', formula: `y = (a11·b2 − b1·a21) / D = ${y.toFixed(6)}` });

  return {
    roots: [
      { re: x, im: 0, isReal: true },
      { re: y, im: 0, isReal: true },
    ],
    steps,
    degree: 1,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface SolverState {
  input: string;
  result: SolverResult | null;
  stepsOpen: boolean;
}

export function useSolver() {
  const [state, setState] = useState<SolverState>({ input: '', result: null, stepsOpen: false });

  const setInput = useCallback((input: string) => {
    setState(s => ({ ...s, input }));
  }, []);

  const solve = useCallback(() => {
    setState(s => {
      const coeffs = parsePolynomial(s.input);
      if (!coeffs) {
        return { ...s, result: { roots: [], steps: [], degree: 0, error: 'Invalid polynomial. Enter coefficients (e.g. "1 -3 2") or an expression (e.g. "x^2 - 3x + 2").' } };
      }
      return { ...s, result: solvePolynomial(coeffs), stepsOpen: false };
    });
  }, []);

  const clearResult = useCallback(() => {
    setState(s => ({ ...s, result: null, stepsOpen: false }));
  }, []);

  const toggleSteps = useCallback(() => {
    setState(s => ({ ...s, stepsOpen: !s.stepsOpen }));
  }, []);

  return { ...state, setInput, solve, clearResult, toggleSteps };
}
