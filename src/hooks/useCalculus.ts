import { useState, useCallback } from 'react';
import type { CalculusState, CalculusMode } from '../types/calculator';

// ─── Expression evaluator (variable: x) ───────────────────────────────────────

type CToken =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'func'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function ctokenize(expr: string, x: number): CToken[] {
  const tokens: CToken[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';

  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ') { i++; continue; }
    if (c === 'π') { tokens.push({ kind: 'num', value: Math.PI }); i++; continue; }
    if (c === '×') { tokens.push({ kind: 'op', value: '*' }); i++; continue; }
    if (c === '÷') { tokens.push({ kind: 'op', value: '/' }); i++; continue; }

    if (isDigit(c) || c === '.') {
      let s = '';
      while (i < expr.length && (isDigit(expr[i]) || expr[i] === '.')) s += expr[i++];
      tokens.push({ kind: 'num', value: parseFloat(s) });
      continue;
    }

    if (isAlpha(c)) {
      let name = '';
      while (i < expr.length && (isAlpha(expr[i]) || isDigit(expr[i]))) name += expr[i++];
      if (name === 'x') {
        tokens.push({ kind: 'num', value: x });
      } else if (name === 'e') {
        tokens.push({ kind: 'num', value: Math.E });
      } else if (name === 'pi') {
        tokens.push({ kind: 'num', value: Math.PI });
      } else {
        tokens.push({ kind: 'func', value: name });
      }
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

class CParser {
  private pos = 0;
  private tokens: CToken[];
  constructor(tokens: CToken[]) { this.tokens = tokens; }

  parse(): number {
    const v = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected token');
    return v;
  }

  private peek(): CToken | undefined { return this.tokens[this.pos]; }
  private consume(): CToken { return this.tokens[this.pos++]; }
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
      return calcApplyFunc(name, arg);
    }
    throw new Error('Unexpected token');
  }
}

function calcApplyFunc(name: string, arg: number): number {
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
    case 'cbrt': return Math.cbrt(arg);
    case 'abs': return Math.abs(arg);
    case 'exp': return Math.exp(arg);
    case 'floor': return Math.floor(arg);
    case 'ceil': return Math.ceil(arg);
    case 'round': return Math.round(arg);
    default: throw new Error(`Unknown function: ${name}`);
  }
}

export function evaluateX(expr: string, x: number): number {
  try {
    return new CParser(ctokenize(expr, x)).parse();
  } catch {
    return NaN;
  }
}

// ─── Calculus utilities ────────────────────────────────────────────────────────

export function numericalDerivative(f: (x: number) => number, x: number, order = 1): number {
  if (order <= 0) return f(x);
  const h = 1e-5;
  const f1 = (t: number): number => numericalDerivative(f, t, order - 1);
  return (f1(x + h) - f1(x - h)) / (2 * h);
}

export function simpsonIntegral(f: (x: number) => number, a: number, b: number, n = 1000): number {
  if (a >= b) return 0;
  let steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  }
  return (h / 3) * sum;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalculusPoint {
  x: number;
  y: number;
}

export interface TangentInfo {
  x0: number;
  y0: number;
  slope: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IntegralResult {
  value: number;
  steps: string[];
}

export interface DerivativeSteps {
  steps: string[];
  value: number;
}

export interface CalculusHookResult {
  state: CalculusState;
  setExpression: (expr: string) => void;
  setMode: (mode: CalculusMode) => void;
  setDerivativeOrder: (order: number) => void;
  setIntegralA: (a: number) => void;
  setIntegralB: (b: number) => void;
  setTangentX: (x: number) => void;
  setXMin: (x: number) => void;
  setXMax: (x: number) => void;
  sampleFunction: (n?: number) => CalculusPoint[];
  sampleDerivative: (order: number, n?: number) => CalculusPoint[];
  getTangentLine: (x0: number, order?: number) => TangentInfo;
  computeIntegral: () => IntegralResult;
  getDerivativeSteps: (x0: number, order: number) => DerivativeSteps;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_STATE: CalculusState = {
  expression: 'x^3 - 3*x',
  mode: 'derivative',
  derivativeOrder: 1,
  integralA: -1,
  integralB: 2,
  tangentX: 0,
  xMin: -4,
  xMax: 4,
};

export function useCalculus(): CalculusHookResult {
  const [state, setState] = useState<CalculusState>(DEFAULT_STATE);

  const setExpression = useCallback((expression: string) => setState(s => ({ ...s, expression })), []);
  const setMode = useCallback((mode: CalculusMode) => setState(s => ({ ...s, mode })), []);
  const setDerivativeOrder = useCallback((derivativeOrder: number) => setState(s => ({ ...s, derivativeOrder })), []);
  const setIntegralA = useCallback((integralA: number) => setState(s => ({ ...s, integralA })), []);
  const setIntegralB = useCallback((integralB: number) => setState(s => ({ ...s, integralB })), []);
  const setTangentX = useCallback((tangentX: number) => setState(s => ({ ...s, tangentX })), []);
  const setXMin = useCallback((xMin: number) => setState(s => ({ ...s, xMin })), []);
  const setXMax = useCallback((xMax: number) => setState(s => ({ ...s, xMax })), []);

  const sampleFunction = useCallback((n = 300): CalculusPoint[] => {
    const { expression, xMin, xMax } = state;
    const step = (xMax - xMin) / n;
    const pts: CalculusPoint[] = [];
    for (let i = 0; i <= n; i++) {
      const x = xMin + i * step;
      pts.push({ x, y: evaluateX(expression, x) });
    }
    return pts;
  }, [state]);

  const sampleDerivative = useCallback((order: number, n = 300): CalculusPoint[] => {
    const { expression, xMin, xMax } = state;
    const f = (x: number) => evaluateX(expression, x);
    const step = (xMax - xMin) / n;
    const pts: CalculusPoint[] = [];
    for (let i = 0; i <= n; i++) {
      const x = xMin + i * step;
      pts.push({ x, y: numericalDerivative(f, x, order) });
    }
    return pts;
  }, [state]);

  const getTangentLine = useCallback((x0: number, order = 1): TangentInfo => {
    const { expression, xMin, xMax } = state;
    const f = (x: number) => evaluateX(expression, x);
    const y0 = order === 1 ? f(x0) : numericalDerivative(f, x0, order - 1);
    const slope = numericalDerivative(f, x0, order);
    const len = (xMax - xMin) * 0.25;
    return { x0, y0, slope, x1: x0 - len, y1: y0 - slope * len, x2: x0 + len, y2: y0 + slope * len };
  }, [state]);

  const computeIntegral = useCallback((): IntegralResult => {
    const { expression, integralA: a, integralB: b } = state;
    const f = (x: number) => evaluateX(expression, x);
    const n = 1000;
    const value = simpsonIntegral(f, a, b, n);
    const h = (b - a) / n;
    const steps = [
      `Definite integral: ∫[${a}, ${b}] f(x) dx`,
      `Method: Simpson's Rule with n = ${n} subintervals`,
      `Step size: h = (${b} − ${a}) / ${n} = ${h.toFixed(6)}`,
      `Formula: (h/3) · [f(a) + 4f(a+h) + 2f(a+2h) + ... + f(b)]`,
      `f(${a}) = ${f(a).toFixed(6)},  f(${b}) = ${f(b).toFixed(6)}`,
      `Result: ≈ ${value.toFixed(8)}`,
    ];
    return { value, steps };
  }, [state]);

  const getDerivativeSteps = useCallback((x0: number, order: number): DerivativeSteps => {
    const { expression } = state;
    const f = (x: number) => evaluateX(expression, x);
    const value = numericalDerivative(f, x0, order);
    const h = 1e-5;
    const primes = ["", "'", "''", "'''"];
    const label = (n: number) => `f${primes[n] ?? `^(${n})`}`;
    const steps: string[] = [
      `Computing ${label(order)}(x₀) at x₀ = ${x0}`,
      `Using central difference: [f(x+h) − f(x−h)] / (2h), h = ${h}`,
    ];
    if (order === 1) {
      const fph = f(x0 + h);
      const fmh = f(x0 - h);
      steps.push(`f(${x0}+h) = ${fph.toFixed(8)}`);
      steps.push(`f(${x0}−h) = ${fmh.toFixed(8)}`);
      steps.push(`f'(${x0}) ≈ (${fph.toFixed(6)} − ${fmh.toFixed(6)}) / ${(2 * h).toExponential(1)}`);
    } else {
      steps.push(`Applying ${order} levels of central difference recursively`);
      for (let k = 1; k <= order; k++) {
        steps.push(`${label(k)}(${x0}) ≈ ${numericalDerivative(f, x0, k).toFixed(8)}`);
      }
    }
    steps.push(`Result: ${label(order)}(${x0}) ≈ ${value.toFixed(8)}`);
    return { steps, value };
  }, [state]);

  return {
    state,
    setExpression,
    setMode,
    setDerivativeOrder,
    setIntegralA,
    setIntegralB,
    setTangentX,
    setXMin,
    setXMax,
    sampleFunction,
    sampleDerivative,
    getTangentLine,
    computeIntegral,
    getDerivativeSteps,
  };
}
