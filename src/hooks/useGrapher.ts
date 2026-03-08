import { useState, useCallback } from 'react';
import type { GraphFunction, GraphViewport, GraphSpecialPoint } from '../types/calculator';

// ─── Expression evaluator with variable x support ────────────────────────────

type GToken =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'func'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'var' }; // x variable

function gtokenize(expr: string, xVal: number): GToken[] {
  const tokens: GToken[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

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
        tokens.push({ kind: 'num', value: xVal });
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

class GParser {
  private pos = 0;
  private tokens: GToken[];
  constructor(tokens: GToken[]) { this.tokens = tokens; }

  parse(): number {
    const v = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected token');
    return v;
  }

  private peek(): GToken | undefined { return this.tokens[this.pos]; }
  private consume(): GToken { return this.tokens[this.pos++]; }
  private isOp(...ops: string[]): boolean {
    const t = this.peek();
    return t?.kind === 'op' && ops.includes((t as { kind: 'op'; value: string }).value);
  }

  private parseExpr(): number {
    let v = this.parseTerm();
    while (this.isOp('+', '-')) {
      const op = (this.consume() as { kind: 'op'; value: string }).value;
      const r = this.parseTerm();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  private parseTerm(): number {
    let v = this.parsePower();
    while (this.isOp('*', '/')) {
      const op = (this.consume() as { kind: 'op'; value: string }).value;
      const r = this.parsePower();
      if (op === '*') v *= r;
      else {
        if (r === 0) return NaN;
        v /= r;
      }
    }
    return v;
  }

  private parsePower(): number {
    const base = this.parseUnary();
    if (this.isOp('^')) {
      this.consume();
      return Math.pow(base, this.parsePower());
    }
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

    if (t.kind === 'num') {
      this.consume();
      return (t as { kind: 'num'; value: number }).value;
    }
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
      return this.applyFunc(name, arg);
    }
    throw new Error('Unexpected token');
  }

  private applyFunc(name: string, arg: number): number {
    switch (name) {
      case 'sin':   return Math.sin(arg);
      case 'cos':   return Math.cos(arg);
      case 'tan':   return Math.tan(arg);
      case 'asin':  return Math.asin(arg);
      case 'acos':  return Math.acos(arg);
      case 'atan':  return Math.atan(arg);
      case 'sinh':  return Math.sinh(arg);
      case 'cosh':  return Math.cosh(arg);
      case 'tanh':  return Math.tanh(arg);
      case 'log':   return Math.log10(arg);
      case 'ln':    return Math.log(arg);
      case 'sqrt':  return Math.sqrt(arg);
      case 'cbrt':  return Math.cbrt(arg);
      case 'abs':   return Math.abs(arg);
      case 'exp':   return Math.exp(arg);
      default: throw new Error(`Unknown function: ${name}`);
    }
  }
}

export function evaluateGraphExpression(expr: string, x: number): number {
  try {
    const tokens = gtokenize(expr, x);
    return new GParser(tokens).parse();
  } catch {
    return NaN;
  }
}

// ─── Numerical analysis ───────────────────────────────────────────────────────

const SAMPLE_COUNT = 500;

function findRoots(expr: string, xMin: number, xMax: number): GraphSpecialPoint[] {
  const roots: GraphSpecialPoint[] = [];
  const dx = (xMax - xMin) / SAMPLE_COUNT;

  let prevY = evaluateGraphExpression(expr, xMin);
  for (let i = 1; i <= SAMPLE_COUNT; i++) {
    const x = xMin + i * dx;
    const y = evaluateGraphExpression(expr, x);
    if (!isFinite(prevY) || !isFinite(y)) { prevY = y; continue; }

    if (prevY * y < 0 || (y === 0 && prevY !== 0)) {
      // Bisection
      let lo = x - dx, hi = x;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        const fMid = evaluateGraphExpression(expr, mid);
        if (evaluateGraphExpression(expr, lo) * fMid <= 0) hi = mid;
        else lo = mid;
      }
      const rx = (lo + hi) / 2;
      // Avoid duplicate roots
      if (roots.every(r => Math.abs(r.x - rx) > 1e-6)) {
        roots.push({ type: 'root', x: rx, y: 0 });
      }
      // Skip next sample to prevent double-detection when y ≈ 0
      prevY = NaN;
      continue;
    }
    prevY = y;
  }
  return roots;
}

function findExtrema(expr: string, xMin: number, xMax: number): GraphSpecialPoint[] {
  const extrema: GraphSpecialPoint[] = [];
  const h = 1e-5;
  const dx = (xMax - xMin) / SAMPLE_COUNT;

  const deriv = (x: number) => {
    const f1 = evaluateGraphExpression(expr, x + h);
    const f0 = evaluateGraphExpression(expr, x - h);
    if (!isFinite(f1) || !isFinite(f0)) return NaN;
    return (f1 - f0) / (2 * h);
  };

  let prevD = deriv(xMin);
  for (let i = 1; i <= SAMPLE_COUNT; i++) {
    const x = xMin + i * dx;
    const d = deriv(x);
    if (!isFinite(prevD) || !isFinite(d)) { prevD = d; continue; }

    if (prevD * d <= 0) {
      // Bisection on derivative
      let lo = x - dx, hi = x;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        const dMid = deriv(mid);
        if (deriv(lo) * dMid <= 0) hi = mid;
        else lo = mid;
      }
      const ex = (lo + hi) / 2;
      const ey = evaluateGraphExpression(expr, ex);
      if (!isFinite(ey)) { prevD = d; continue; }
      if (extrema.every(e => Math.abs(e.x - ex) > 1e-6)) {
        // Second derivative test
        const d2 = (evaluateGraphExpression(expr, ex + h) - 2 * ey + evaluateGraphExpression(expr, ex - h)) / (h * h);
        const type = d2 < 0 ? 'maximum' : 'minimum';
        extrema.push({ type, x: ex, y: ey });
      }
    }
    prevD = d;
  }
  return extrema;
}

export function findSpecialPoints(expr: string, xMin: number, xMax: number): GraphSpecialPoint[] {
  if (!expr.trim()) return [];
  return [...findRoots(expr, xMin, xMax), ...findExtrema(expr, xMin, xMax)];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const GRAPH_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

const DEFAULT_VIEWPORT: GraphViewport = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

let nextId = 1;

export function useGrapher() {
  const [functions, setFunctions] = useState<GraphFunction[]>([
    { id: nextId++, expression: '', color: GRAPH_COLORS[0], visible: true },
  ]);
  const [viewport, setViewport] = useState<GraphViewport>(DEFAULT_VIEWPORT);
  const [showSpecialPoints, setShowSpecialPoints] = useState(true);

  const addFunction = useCallback(() => {
    setFunctions(prev => {
      if (prev.length >= 4) return prev;
      return [...prev, { id: nextId++, expression: '', color: GRAPH_COLORS[prev.length % GRAPH_COLORS.length], visible: true }];
    });
  }, []);

  const removeFunction = useCallback((id: number) => {
    setFunctions(prev => prev.length > 1 ? prev.filter(f => f.id !== id) : prev);
  }, []);

  const updateFunction = useCallback((id: number, expression: string) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, expression } : f));
  }, []);

  const toggleVisible = useCallback((id: number) => {
    setFunctions(prev => prev.map(f => f.id === id ? { ...f, visible: !f.visible } : f));
  }, []);

  const zoom = useCallback((factor: number, pivotX = 0, pivotY = 0) => {
    setViewport(prev => {
      const { xMin, xMax, yMin, yMax } = prev;
      const cx = xMin + (xMax - xMin) * pivotX;
      const cy = yMin + (yMax - yMin) * (1 - pivotY);
      return {
        xMin: cx + (xMin - cx) * factor,
        xMax: cx + (xMax - cx) * factor,
        yMin: cy + (yMin - cy) * factor,
        yMax: cy + (yMax - cy) * factor,
      };
    });
  }, []);

  const pan = useCallback((dx: number, dy: number) => {
    setViewport(prev => ({
      xMin: prev.xMin + dx,
      xMax: prev.xMax + dx,
      yMin: prev.yMin + dy,
      yMax: prev.yMax + dy,
    }));
  }, []);

  const resetViewport = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
  }, []);

  const toggleSpecialPoints = useCallback(() => {
    setShowSpecialPoints(prev => !prev);
  }, []);

  return {
    functions,
    viewport,
    showSpecialPoints,
    addFunction,
    removeFunction,
    updateFunction,
    toggleVisible,
    zoom,
    pan,
    resetViewport,
    toggleSpecialPoints,
  };
}
