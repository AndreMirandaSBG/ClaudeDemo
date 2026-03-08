import { useState, useCallback } from 'react';
import type { DiffEqState, DiffEqMode, OdeMethod } from '../types/calculator';

// ─── Two-variable expression evaluator (variables: x, y) ─────────────────────

type DToken =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'func'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function dtokenize(expr: string, x: number, y: number): DToken[] {
  const tokens: DToken[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ') { i++; continue; }
    if (c === 'π') { tokens.push({ kind: 'num', value: Math.PI }); i++; continue; }

    if (isDigit(c) || c === '.') {
      let s = '';
      while (i < expr.length && (isDigit(expr[i]) || expr[i] === '.')) s += expr[i++];
      tokens.push({ kind: 'num', value: parseFloat(s) });
      continue;
    }

    if (isAlpha(c)) {
      let name = '';
      while (i < expr.length && (isAlpha(expr[i]) || isDigit(expr[i]))) name += expr[i++];
      if (name === 'x') { tokens.push({ kind: 'num', value: x }); continue; }
      if (name === 'y') { tokens.push({ kind: 'num', value: y }); continue; }
      if (name === 'e') { tokens.push({ kind: 'num', value: Math.E }); continue; }
      if (name === 'pi') { tokens.push({ kind: 'num', value: Math.PI }); continue; }
      tokens.push({ kind: 'func', value: name });
      continue;
    }

    if (c === '(') { tokens.push({ kind: 'lparen' }); i++; continue; }
    if (c === ')') { tokens.push({ kind: 'rparen' }); i++; continue; }
    if (c === '+') { tokens.push({ kind: 'op', value: '+' }); i++; continue; }
    if (c === '-') { tokens.push({ kind: 'op', value: '-' }); i++; continue; }
    if (c === '*') { tokens.push({ kind: 'op', value: '*' }); i++; continue; }
    if (c === '/') { tokens.push({ kind: 'op', value: '/' }); i++; continue; }
    if (c === '^') { tokens.push({ kind: 'op', value: '^' }); i++; continue; }
    i++;
  }
  return tokens;
}

class DParser {
  private pos = 0;
  constructor(private tokens: DToken[]) {}

  parse(): number {
    const v = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected token');
    return v;
  }

  private peek(): DToken | undefined { return this.tokens[this.pos]; }
  private consume(): DToken { return this.tokens[this.pos++]; }
  private isOp(...ops: string[]): boolean {
    const t = this.peek();
    return t?.kind === 'op' && ops.includes((t as { kind: 'op'; value: string }).value);
  }

  private parseExpr(): number {
    let v = this.parseTerm();
    while (this.isOp('+', '-')) {
      const op = (this.consume() as { kind: 'op'; value: string }).value;
      v = op === '+' ? v + this.parseTerm() : v - this.parseTerm();
    }
    return v;
  }

  private parseTerm(): number {
    let v = this.parsePower();
    while (this.isOp('*', '/')) {
      const op = (this.consume() as { kind: 'op'; value: string }).value;
      const r = this.parsePower();
      if (op === '*') v *= r; else { if (r === 0) return NaN; v /= r; }
    }
    return v;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    if (this.isOp('^')) { this.consume(); return Math.pow(base, this.parsePower()); }
    return base;
  }

  private parseUnary(): number {
    if (this.isOp('-')) { this.consume(); return -this.parsePower(); }
    if (this.isOp('+')) { this.consume(); return this.parsePower(); }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end');
    if (t.kind === 'num') { this.consume(); return (t as { kind: 'num'; value: number }).value; }
    if (t.kind === 'lparen') {
      this.consume();
      const v = this.parseExpr();
      if (this.peek()?.kind !== 'rparen') throw new Error('Expected )');
      this.consume();
      return v;
    }
    if (t.kind === 'func') {
      const name = (this.consume() as { kind: 'func'; value: string }).value;
      if (this.peek()?.kind !== 'lparen') throw new Error(`Expected ( after ${name}`);
      this.consume();
      const arg = this.parseExpr();
      if (this.peek()?.kind !== 'rparen') throw new Error('Expected )');
      this.consume();
      return diffApplyFunc(name, arg);
    }
    throw new Error('Unexpected token');
  }
}

function diffApplyFunc(name: string, arg: number): number {
  switch (name) {
    case 'sin': return Math.sin(arg);
    case 'cos': return Math.cos(arg);
    case 'tan': return Math.tan(arg);
    case 'asin': return Math.asin(arg);
    case 'acos': return Math.acos(arg);
    case 'atan': return Math.atan(arg);
    case 'sinh': return Math.sinh(arg);
    case 'cosh': return Math.cosh(arg);
    case 'tanh': return Math.tanh(arg);
    case 'log': return Math.log10(arg);
    case 'ln': return Math.log(arg);
    case 'sqrt': return Math.sqrt(arg);
    case 'abs': return Math.abs(arg);
    case 'exp': return Math.exp(arg);
    default: throw new Error(`Unknown function: ${name}`);
  }
}

export function evaluateXY(expr: string, x: number, y: number): number {
  try {
    return new DParser(dtokenize(expr, x, y)).parse();
  } catch {
    return NaN;
  }
}

// ─── ODE solvers ──────────────────────────────────────────────────────────────

export interface OdePoint {
  x: number;
  y: number;
}

export function eulerSolve(
  f: (x: number, y: number) => number,
  x0: number,
  y0: number,
  xEnd: number,
  steps: number,
): OdePoint[] {
  const pts: OdePoint[] = [{ x: x0, y: y0 }];
  const h = (xEnd - x0) / steps;
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    y += h * f(x, y);
    x += h;
    pts.push({ x, y });
  }
  return pts;
}

export function rk4Solve(
  f: (x: number, y: number) => number,
  x0: number,
  y0: number,
  xEnd: number,
  steps: number,
): OdePoint[] {
  const pts: OdePoint[] = [{ x: x0, y: y0 }];
  const h = (xEnd - x0) / steps;
  let x = x0;
  let y = y0;
  for (let i = 0; i < steps; i++) {
    const k1 = f(x, y);
    const k2 = f(x + h / 2, y + (h / 2) * k1);
    const k3 = f(x + h / 2, y + (h / 2) * k2);
    const k4 = f(x + h, y + h * k3);
    y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    x += h;
    pts.push({ x, y });
  }
  return pts;
}

// ─── Slope field / phase portrait ────────────────────────────────────────────

export interface FieldArrow {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export function generateSlopeField(
  f: (x: number, y: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridN = 20,
): FieldArrow[] {
  const arrows: FieldArrow[] = [];
  const dx = (xMax - xMin) / gridN;
  const dy = (yMax - yMin) / gridN;
  for (let i = 0; i <= gridN; i++) {
    for (let j = 0; j <= gridN; j++) {
      const x = xMin + i * dx;
      const y = yMin + j * dy;
      const slope = f(x, y);
      if (!isFinite(slope)) continue;
      const len = Math.sqrt(1 + slope * slope);
      arrows.push({ x, y, dx: 1 / len, dy: slope / len });
    }
  }
  return arrows;
}

export function generatePhaseField(
  f: (x: number, y: number) => number,
  g: (x: number, y: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridN = 18,
): FieldArrow[] {
  const arrows: FieldArrow[] = [];
  const dx = (xMax - xMin) / gridN;
  const dy = (yMax - yMin) / gridN;
  for (let i = 0; i <= gridN; i++) {
    for (let j = 0; j <= gridN; j++) {
      const x = xMin + i * dx;
      const y = yMin + j * dy;
      const fx = f(x, y);
      const gy = g(x, y);
      if (!isFinite(fx) || !isFinite(gy)) continue;
      const len = Math.sqrt(fx * fx + gy * gy);
      if (len < 1e-10) {
        arrows.push({ x, y, dx: 0, dy: 0 });
      } else {
        arrows.push({ x, y, dx: fx / len, dy: gy / len });
      }
    }
  }
  return arrows;
}

// ─── Equilibrium finder ───────────────────────────────────────────────────────

export type EquilibriumType = 'stable' | 'unstable' | 'saddle' | 'center' | 'spiral-stable' | 'spiral-unstable';

export interface EquilibriumPoint {
  x: number;
  y: number;
  type: EquilibriumType;
}

function classifyEquilibrium(
  f: (x: number, y: number) => number,
  g: (x: number, y: number) => number,
  x0: number,
  y0: number,
): EquilibriumType {
  const h = 1e-4;
  const jfx = (f(x0 + h, y0) - f(x0 - h, y0)) / (2 * h);
  const jfy = (f(x0, y0 + h) - f(x0, y0 - h)) / (2 * h);
  const jgx = (g(x0 + h, y0) - g(x0 - h, y0)) / (2 * h);
  const jgy = (g(x0, y0 + h) - g(x0, y0 - h)) / (2 * h);
  const trace = jfx + jgy;
  const det = jfx * jgy - jfy * jgx;
  const disc = trace * trace - 4 * det;

  if (det < 0) return 'saddle';
  if (disc >= 0) {
    return trace < 0 ? 'stable' : 'unstable';
  }
  if (Math.abs(trace) < 1e-6) return 'center';
  return trace < 0 ? 'spiral-stable' : 'spiral-unstable';
}

export function findEquilibria(
  f: (x: number, y: number) => number,
  g: (x: number, y: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridN = 10,
): EquilibriumPoint[] {
  const results: EquilibriumPoint[] = [];
  const dx = (xMax - xMin) / gridN;
  const dy = (yMax - yMin) / gridN;
  const tol = 1e-6;
  const minDist = (xMax - xMin) * 0.05;

  for (let i = 0; i < gridN; i++) {
    for (let j = 0; j < gridN; j++) {
      let x = xMin + (i + 0.5) * dx;
      let y = yMin + (j + 0.5) * dy;

      // Newton-Raphson refinement
      for (let iter = 0; iter < 30; iter++) {
        const fx = f(x, y);
        const gy = g(x, y);
        if (!isFinite(fx) || !isFinite(gy)) break;
        if (Math.abs(fx) + Math.abs(gy) < tol) break;
        const h = 1e-5;
        const jfx = (f(x + h, y) - f(x - h, y)) / (2 * h);
        const jfy = (f(x, y + h) - f(x, y - h)) / (2 * h);
        const jgx = (g(x + h, y) - g(x - h, y)) / (2 * h);
        const jgy = (g(x, y + h) - g(x, y - h)) / (2 * h);
        const det = jfx * jgy - jfy * jgx;
        if (Math.abs(det) < 1e-10) break;
        x -= (fx * jgy - gy * jfy) / det;
        y -= (gy * jfx - fx * jgx) / det;
      }

      const fval = f(x, y);
      const gval = g(x, y);
      if (!isFinite(x) || !isFinite(y)) continue;
      if (Math.abs(fval) + Math.abs(gval) > tol * 100) continue;
      if (x < xMin || x > xMax || y < yMin || y > yMax) continue;

      const duplicate = results.some(p => Math.hypot(p.x - x, p.y - y) < minDist);
      if (!duplicate) {
        results.push({ x, y, type: classifyEquilibrium(f, g, x, y) });
      }
    }
  }
  return results;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface DiffEqHookState extends DiffEqState {
  solution: OdePoint[] | null;
  error: string | null;
}

const DEFAULT_STATE: DiffEqHookState = {
  expression: '-y',
  expression2: 'x',
  mode: 'firstOrder',
  method: 'rk4',
  x0: 0,
  y0: 1,
  xEnd: 6,
  steps: 200,
  xMin: -4,
  xMax: 4,
  yMin: -4,
  yMax: 4,
  solution: null,
  error: null,
};

export interface DiffEqHookResult {
  state: DiffEqHookState;
  setExpression: (expr: string) => void;
  setExpression2: (expr: string) => void;
  setMode: (mode: DiffEqMode) => void;
  setMethod: (method: OdeMethod) => void;
  setX0: (v: number) => void;
  setY0: (v: number) => void;
  setXEnd: (v: number) => void;
  setSteps: (v: number) => void;
  setXMin: (v: number) => void;
  setXMax: (v: number) => void;
  setYMin: (v: number) => void;
  setYMax: (v: number) => void;
  solve: () => void;
  getSlopeField: () => FieldArrow[];
  getPhaseField: () => FieldArrow[];
  getEquilibria: () => EquilibriumPoint[];
}

export function useDiffEq(): DiffEqHookResult {
  const [state, setState] = useState<DiffEqHookState>(DEFAULT_STATE);

  const setExpression = useCallback((expression: string) => setState(s => ({ ...s, expression })), []);
  const setExpression2 = useCallback((expression2: string) => setState(s => ({ ...s, expression2 })), []);
  const setMode = useCallback((mode: DiffEqMode) => setState(s => ({ ...s, mode, solution: null })), []);
  const setMethod = useCallback((method: OdeMethod) => setState(s => ({ ...s, method })), []);
  const setX0 = useCallback((x0: number) => setState(s => ({ ...s, x0 })), []);
  const setY0 = useCallback((y0: number) => setState(s => ({ ...s, y0 })), []);
  const setXEnd = useCallback((xEnd: number) => setState(s => ({ ...s, xEnd })), []);
  const setSteps = useCallback((steps: number) => setState(s => ({ ...s, steps })), []);
  const setXMin = useCallback((xMin: number) => setState(s => ({ ...s, xMin })), []);
  const setXMax = useCallback((xMax: number) => setState(s => ({ ...s, xMax })), []);
  const setYMin = useCallback((yMin: number) => setState(s => ({ ...s, yMin })), []);
  const setYMax = useCallback((yMax: number) => setState(s => ({ ...s, yMax })), []);

  const solve = useCallback(() => {
    setState(s => {
      try {
        const f = (x: number, y: number) => evaluateXY(s.expression, x, y);
        const solver = s.method === 'euler' ? eulerSolve : rk4Solve;
        const solution = solver(f, s.x0, s.y0, s.xEnd, s.steps);
        return { ...s, solution, error: null };
      } catch (err) {
        return { ...s, solution: null, error: String(err) };
      }
    });
  }, []);

  const getSlopeField = useCallback((): FieldArrow[] => {
    const { expression, xMin, xMax, yMin, yMax } = state;
    const f = (x: number, y: number) => evaluateXY(expression, x, y);
    return generateSlopeField(f, xMin, xMax, yMin, yMax);
  }, [state]);

  const getPhaseField = useCallback((): FieldArrow[] => {
    const { expression, expression2, xMin, xMax, yMin, yMax } = state;
    const f = (x: number, y: number) => evaluateXY(expression, x, y);
    const g = (x: number, y: number) => evaluateXY(expression2, x, y);
    return generatePhaseField(f, g, xMin, xMax, yMin, yMax);
  }, [state]);

  const getEquilibria = useCallback((): EquilibriumPoint[] => {
    const { expression, expression2, xMin, xMax, yMin, yMax } = state;
    const f = (x: number, y: number) => evaluateXY(expression, x, y);
    const g = (x: number, y: number) => evaluateXY(expression2, x, y);
    return findEquilibria(f, g, xMin, xMax, yMin, yMax);
  }, [state]);

  return {
    state,
    setExpression,
    setExpression2,
    setMode,
    setMethod,
    setX0,
    setY0,
    setXEnd,
    setSteps,
    setXMin,
    setXMax,
    setYMin,
    setYMax,
    solve,
    getSlopeField,
    getPhaseField,
    getEquilibria,
  };
}
