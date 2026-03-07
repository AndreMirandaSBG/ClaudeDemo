import { useState, useCallback } from 'react';
import type { SurfacePlotType, SurfaceState } from '../types/calculator';

// ─── 2-variable expression evaluator ─────────────────────────────────────────

type SToken =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'func'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function stokenize(expr: string, vars: Record<string, number>): SToken[] {
  const tokens: SToken[] = [];
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
      if (name in vars) {
        tokens.push({ kind: 'num', value: vars[name] });
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

class SParser {
  private pos = 0;
  constructor(private tokens: SToken[]) {}

  parse(): number {
    const v = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected token');
    return v;
  }

  private peek(): SToken | undefined { return this.tokens[this.pos]; }
  private consume(): SToken { return this.tokens[this.pos++]; }
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
      else { if (r === 0) return NaN; v /= r; }
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
      return this.applyFunc(name, arg);
    }
    throw new Error('Unexpected token');
  }

  private applyFunc(name: string, arg: number): number {
    switch (name) {
      case 'sin':  return Math.sin(arg);
      case 'cos':  return Math.cos(arg);
      case 'tan':  return Math.tan(arg);
      case 'asin': return Math.asin(arg);
      case 'acos': return Math.acos(arg);
      case 'atan': return Math.atan(arg);
      case 'sinh': return Math.sinh(arg);
      case 'cosh': return Math.cosh(arg);
      case 'tanh': return Math.tanh(arg);
      case 'log':  return Math.log10(arg);
      case 'ln':   return Math.log(arg);
      case 'sqrt': return Math.sqrt(arg);
      case 'cbrt': return Math.cbrt(arg);
      case 'abs':  return Math.abs(arg);
      case 'exp':  return Math.exp(arg);
      case 'floor': return Math.floor(arg);
      case 'ceil': return Math.ceil(arg);
      case 'round': return Math.round(arg);
      default: throw new Error(`Unknown function: ${name}`);
    }
  }
}

function evaluateWithVars(expr: string, vars: Record<string, number>): number {
  try {
    return new SParser(stokenize(expr, vars)).parse();
  } catch {
    return NaN;
  }
}

export function evaluateSurface(expr: string, x: number, y: number): number {
  return evaluateWithVars(expr, { x, y });
}

export function evaluateParam1(expr: string, t: number): number {
  return evaluateWithVars(expr, { t });
}

export function evaluateParam2(expr: string, u: number, v: number): number {
  return evaluateWithVars(expr, { u, v });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SamplePoint3D {
  x: number;
  y: number;
  z: number;
}

export interface SurfaceQuad {
  points: [SamplePoint3D, SamplePoint3D, SamplePoint3D, SamplePoint3D];
  avgZ: number;
  normalizedZ: number;
}

export interface SurfaceSampleResult {
  quads: SurfaceQuad[];
  zMin: number;
  zMax: number;
}

export interface SurfaceHookResult {
  state: SurfaceState;
  setExpression: (expr: string) => void;
  setXParam: (expr: string) => void;
  setYParam: (expr: string) => void;
  setZParam: (expr: string) => void;
  setPlotType: (type: SurfacePlotType) => void;
  rotate: (dx: number, dy: number) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setSamples: (n: number) => void;
  sampleSurface: () => SurfaceSampleResult;
  sampleParametricCurve: () => SamplePoint3D[];
  sampleParametricSurface: () => SurfaceSampleResult;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_STATE: SurfaceState = {
  expression: 'sin(sqrt(x*x + y*y))',
  xParamExpr: 'cos(t)',
  yParamExpr: 'sin(t)',
  zParamExpr: 't / 6',
  plotType: 'surface',
  rotX: 0.5,
  rotY: 0.3,
  scale: 1,
  samples: 25,
};

function buildQuads(grid: SamplePoint3D[][], n: number): SurfaceSampleResult {
  let zMin = Infinity, zMax = -Infinity;
  for (const row of grid) {
    for (const pt of row) {
      if (isFinite(pt.z)) { zMin = Math.min(zMin, pt.z); zMax = Math.max(zMax, pt.z); }
    }
  }
  if (!isFinite(zMin)) { zMin = -1; zMax = 1; }
  const zRange = zMax - zMin || 1;

  const quads: SurfaceQuad[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const p00 = grid[i][j];
      const p01 = grid[i][j + 1];
      const p10 = grid[i + 1][j];
      const p11 = grid[i + 1][j + 1];
      if (!isFinite(p00.z) || !isFinite(p01.z) || !isFinite(p10.z) || !isFinite(p11.z)) continue;
      const avgZ = (p00.z + p01.z + p10.z + p11.z) / 4;
      quads.push({ points: [p00, p01, p11, p10], avgZ, normalizedZ: (avgZ - zMin) / zRange });
    }
  }
  return { quads, zMin, zMax };
}

export function useSurface(): SurfaceHookResult {
  const [state, setState] = useState<SurfaceState>(DEFAULT_STATE);

  const setExpression = useCallback((expression: string) => setState(s => ({ ...s, expression })), []);
  const setXParam = useCallback((xParamExpr: string) => setState(s => ({ ...s, xParamExpr })), []);
  const setYParam = useCallback((yParamExpr: string) => setState(s => ({ ...s, yParamExpr })), []);
  const setZParam = useCallback((zParamExpr: string) => setState(s => ({ ...s, zParamExpr })), []);
  const setPlotType = useCallback((plotType: SurfacePlotType) => setState(s => ({ ...s, plotType })), []);

  const rotate = useCallback((dx: number, dy: number) => {
    setState(s => ({
      ...s,
      rotY: s.rotY + dx * 0.01,
      rotX: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.rotX + dy * 0.01)),
    }));
  }, []);

  const resetView = useCallback(() => {
    setState(s => ({ ...s, rotX: DEFAULT_STATE.rotX, rotY: DEFAULT_STATE.rotY, scale: 1 }));
  }, []);

  const zoomIn = useCallback(() => setState(s => ({ ...s, scale: Math.min(s.scale * 1.25, 5) })), []);
  const zoomOut = useCallback(() => setState(s => ({ ...s, scale: Math.max(s.scale * 0.8, 0.1) })), []);
  const setSamples = useCallback((samples: number) => setState(s => ({ ...s, samples })), []);

  const sampleSurface = useCallback((): SurfaceSampleResult => {
    const { expression, samples } = state;
    const range = 4;
    const step = (range * 2) / samples;
    const grid: SamplePoint3D[][] = [];
    for (let i = 0; i <= samples; i++) {
      const row: SamplePoint3D[] = [];
      for (let j = 0; j <= samples; j++) {
        const x = -range + j * step;
        const y = -range + i * step;
        row.push({ x, y, z: evaluateSurface(expression, x, y) });
      }
      grid.push(row);
    }
    return buildQuads(grid, samples);
  }, [state]);

  const sampleParametricCurve = useCallback((): SamplePoint3D[] => {
    const { xParamExpr, yParamExpr, zParamExpr, samples } = state;
    const tMin = -Math.PI * 2, tMax = Math.PI * 2;
    const steps = samples * 5;
    const pts: SamplePoint3D[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = tMin + (i / steps) * (tMax - tMin);
      const x = evaluateParam1(xParamExpr, t);
      const y = evaluateParam1(yParamExpr, t);
      const z = evaluateParam1(zParamExpr, t);
      if (isFinite(x) && isFinite(y) && isFinite(z)) pts.push({ x, y, z });
    }
    return pts;
  }, [state]);

  const sampleParametricSurface = useCallback((): SurfaceSampleResult => {
    const { xParamExpr, yParamExpr, zParamExpr, samples } = state;
    const n = Math.min(samples, 20);
    const grid: SamplePoint3D[][] = [];
    for (let i = 0; i <= n; i++) {
      const row: SamplePoint3D[] = [];
      for (let j = 0; j <= n; j++) {
        const u = (i / n) * Math.PI * 2;
        const v = (j / n) * Math.PI;
        const x = evaluateParam2(xParamExpr, u, v);
        const y = evaluateParam2(yParamExpr, u, v);
        const z = evaluateParam2(zParamExpr, u, v);
        row.push({ x: isFinite(x) ? x : NaN, y: isFinite(y) ? y : NaN, z: isFinite(z) ? z : NaN });
      }
      grid.push(row);
    }
    return buildQuads(grid, n);
  }, [state]);

  return {
    state,
    setExpression,
    setXParam,
    setYParam,
    setZParam,
    setPlotType,
    rotate,
    resetView,
    zoomIn,
    zoomOut,
    setSamples,
    sampleSurface,
    sampleParametricCurve,
    sampleParametricSurface,
  };
}
