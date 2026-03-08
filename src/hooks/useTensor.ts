import { useState, useCallback } from 'react';
import type { TensorMode, TensorState } from '../types/calculator';

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type TokenKind =
  | 'number'
  | 'ident'
  | 'plus'
  | 'minus'
  | 'star'
  | 'slash'
  | 'caret'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'end';

interface Token {
  kind: TokenKind;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.trim();

  while (i < src.length) {
    const ch = src[i];

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }

    if (ch >= '0' && ch <= '9' || ch === '.') {
      let num = '';
      while (i < src.length && (src[i] >= '0' && src[i] <= '9' || src[i] === '.')) {
        num += src[i++];
      }
      tokens.push({ kind: 'number', value: num });
      continue;
    }

    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let ident = '';
      while (i < src.length && ((src[i] >= 'a' && src[i] <= 'z') || (src[i] >= 'A' && src[i] <= 'Z') || src[i] === '_' || (src[i] >= '0' && src[i] <= '9'))) {
        ident += src[i++];
      }
      tokens.push({ kind: 'ident', value: ident });
      continue;
    }

    switch (ch) {
      case '+': tokens.push({ kind: 'plus', value: ch }); break;
      case '-': tokens.push({ kind: 'minus', value: ch }); break;
      case '*': tokens.push({ kind: 'star', value: ch }); break;
      case '/': tokens.push({ kind: 'slash', value: ch }); break;
      case '^': tokens.push({ kind: 'caret', value: ch }); break;
      case '(': tokens.push({ kind: 'lparen', value: ch }); break;
      case ')': tokens.push({ kind: 'rparen', value: ch }); break;
      case ',': tokens.push({ kind: 'comma', value: ch }); break;
      default:
        // Unknown character — treat as error marker
        tokens.push({ kind: 'end', value: '' });
        return tokens;
    }
    i++;
  }

  tokens.push({ kind: 'end', value: '' });
  return tokens;
}

// ─── Recursive-descent parser ─────────────────────────────────────────────────

class Parser {
  private tokens: Token[];
  private pos: number;
  private xVal: number;
  private yVal: number;

  constructor(tokens: Token[], x: number, y: number) {
    this.tokens = tokens;
    this.pos = 0;
    this.xVal = x;
    this.yVal = y;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(kind: TokenKind): void {
    const tok = this.consume();
    if (tok.kind !== kind) throw new Error(`Expected ${kind}, got ${tok.kind}`);
  }

  // expr ::= additive
  parse(): number {
    const val = this.parseAdditive();
    if (this.peek().kind !== 'end') throw new Error('Unexpected token after expression');
    return val;
  }

  // additive ::= multiplicative (('+' | '-') multiplicative)*
  private parseAdditive(): number {
    let left = this.parseMultiplicative();
    while (this.peek().kind === 'plus' || this.peek().kind === 'minus') {
      const op = this.consume().kind;
      const right = this.parseMultiplicative();
      left = op === 'plus' ? left + right : left - right;
    }
    return left;
  }

  // multiplicative ::= power (('*' | '/') power)*
  private parseMultiplicative(): number {
    let left = this.parsePower();
    while (this.peek().kind === 'star' || this.peek().kind === 'slash') {
      const op = this.consume().kind;
      const right = this.parsePower();
      if (op === 'slash') {
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  // power ::= unary ('^' unary)*   (right-associative)
  private parsePower(): number {
    const base = this.parseUnary();
    if (this.peek().kind === 'caret') {
      this.consume();
      const exp = this.parsePower(); // right-associative
      return Math.pow(base, exp);
    }
    return base;
  }

  // unary ::= '-' unary | primary
  private parseUnary(): number {
    if (this.peek().kind === 'minus') {
      this.consume();
      return -this.parseUnary();
    }
    if (this.peek().kind === 'plus') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  // primary ::= number | constant | variable | func '(' args ')' | '(' expr ')'
  private parsePrimary(): number {
    const tok = this.peek();

    if (tok.kind === 'number') {
      this.consume();
      return parseFloat(tok.value);
    }

    if (tok.kind === 'ident') {
      this.consume();
      const name = tok.value.toLowerCase();

      // Constants
      if (name === 'pi' || name === 'π') return Math.PI;
      if (name === 'e') return Math.E;

      // Variables
      if (name === 'x') return this.xVal;
      if (name === 'y') return this.yVal;

      // Functions — expect '(' arg ')'
      const oneArgFuncs: Record<string, (a: number) => number> = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        sqrt: Math.sqrt,
        exp: Math.exp,
        ln: Math.log,
        log: Math.log10,
        abs: Math.abs,
        floor: Math.floor,
        ceil: Math.ceil,
        round: Math.round,
      };

      if (name in oneArgFuncs) {
        this.expect('lparen');
        const arg = this.parseAdditive();
        this.expect('rparen');
        return oneArgFuncs[name](arg);
      }

      // pow(base, exp)
      if (name === 'pow') {
        this.expect('lparen');
        const base = this.parseAdditive();
        this.expect('comma');
        const exp = this.parseAdditive();
        this.expect('rparen');
        return Math.pow(base, exp);
      }

      throw new Error(`Unknown identifier: ${name}`);
    }

    if (tok.kind === 'lparen') {
      this.consume();
      const val = this.parseAdditive();
      this.expect('rparen');
      return val;
    }

    throw new Error(`Unexpected token: ${tok.kind}`);
  }
}

// ─── Public exported pure functions ──────────────────────────────────────────

export function evaluateXY(expr: string, x: number, y: number): number {
  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens, x, y);
    return parser.parse();
  } catch {
    return NaN;
  }
}

const H = 1e-5;

export function partialX(expr: string, x: number, y: number): number {
  return (evaluateXY(expr, x + H, y) - evaluateXY(expr, x - H, y)) / (2 * H);
}

export function partialY(expr: string, x: number, y: number): number {
  return (evaluateXY(expr, x, y + H) - evaluateXY(expr, x, y - H)) / (2 * H);
}

export function gradient(expr: string, x: number, y: number): [number, number] {
  return [partialX(expr, x, y), partialY(expr, x, y)];
}

export function divergence(fxExpr: string, fyExpr: string, x: number, y: number): number {
  const dFxdx = partialX(fxExpr, x, y);
  const dFydy = partialY(fyExpr, x, y);
  return dFxdx + dFydy;
}

export function curl2D(fxExpr: string, fyExpr: string, x: number, y: number): number {
  const dFydx = partialX(fyExpr, x, y);
  const dFxdy = partialY(fxExpr, x, y);
  return dFydx - dFxdy;
}

export function hessian(
  expr: string,
  x: number,
  y: number,
): [[number, number], [number, number]] {
  // fxx = (f(x+h,y) - 2f(x,y) + f(x-h,y)) / h^2
  const fxx =
    (evaluateXY(expr, x + H, y) - 2 * evaluateXY(expr, x, y) + evaluateXY(expr, x - H, y)) /
    (H * H);
  // fyy = (f(x,y+h) - 2f(x,y) + f(x,y-h)) / h^2
  const fyy =
    (evaluateXY(expr, x, y + H) - 2 * evaluateXY(expr, x, y) + evaluateXY(expr, x, y - H)) /
    (H * H);
  // fxy = (f(x+h,y+h) - f(x+h,y-h) - f(x-h,y+h) + f(x-h,y-h)) / (4*h^2)
  const fxy =
    (evaluateXY(expr, x + H, y + H) -
      evaluateXY(expr, x + H, y - H) -
      evaluateXY(expr, x - H, y + H) +
      evaluateXY(expr, x - H, y - H)) /
    (4 * H * H);
  return [
    [fxx, fxy],
    [fxy, fyy],
  ];
}

export function jacobian(
  f1Expr: string,
  f2Expr: string,
  x: number,
  y: number,
): [[number, number], [number, number]] {
  return [
    [partialX(f1Expr, x, y), partialY(f1Expr, x, y)],
    [partialX(f2Expr, x, y), partialY(f2Expr, x, y)],
  ];
}

export function gradientDescentPath(
  expr: string,
  startX: number,
  startY: number,
  lr: number,
  steps: number,
): Array<{ x: number; y: number; z: number }> {
  const path: Array<{ x: number; y: number; z: number }> = [];
  let cx = startX;
  let cy = startY;

  for (let i = 0; i <= steps; i++) {
    path.push({ x: cx, y: cy, z: evaluateXY(expr, cx, cy) });
    if (i < steps) {
      const [gx, gy] = gradient(expr, cx, cy);
      cx = cx - lr * gx;
      cy = cy - lr * gy;
    }
  }

  return path;
}

// ─── Default state ────────────────────────────────────────────────────────────

const DEFAULT_STATE: TensorState = {
  mode: 'gradient',
  fExpr: 'x^2 + y^2',
  fxExpr: '-y',
  fyExpr: 'x',
  learningRate: 0.1,
  gdSteps: 20,
  startX: 2,
  startY: 2,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTensorReturn {
  state: TensorState;
  setMode: (mode: TensorMode) => void;
  setFExpr: (expr: string) => void;
  setFxExpr: (expr: string) => void;
  setFyExpr: (expr: string) => void;
  setLearningRate: (lr: number) => void;
  setGdSteps: (steps: number) => void;
  setStartX: (x: number) => void;
  setStartY: (y: number) => void;
}

export const useTensor = (): UseTensorReturn => {
  const [state, setState] = useState<TensorState>(DEFAULT_STATE);

  const setMode = useCallback((mode: TensorMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setFExpr = useCallback((fExpr: string) => {
    setState(prev => ({ ...prev, fExpr }));
  }, []);

  const setFxExpr = useCallback((fxExpr: string) => {
    setState(prev => ({ ...prev, fxExpr }));
  }, []);

  const setFyExpr = useCallback((fyExpr: string) => {
    setState(prev => ({ ...prev, fyExpr }));
  }, []);

  const setLearningRate = useCallback((learningRate: number) => {
    setState(prev => ({ ...prev, learningRate }));
  }, []);

  const setGdSteps = useCallback((gdSteps: number) => {
    setState(prev => ({ ...prev, gdSteps }));
  }, []);

  const setStartX = useCallback((startX: number) => {
    setState(prev => ({ ...prev, startX }));
  }, []);

  const setStartY = useCallback((startY: number) => {
    setState(prev => ({ ...prev, startY }));
  }, []);

  return {
    state,
    setMode,
    setFExpr,
    setFxExpr,
    setFyExpr,
    setLearningRate,
    setGdSteps,
    setStartX,
    setStartY,
  };
};
