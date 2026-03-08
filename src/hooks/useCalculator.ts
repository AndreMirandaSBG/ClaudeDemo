import { useState, useCallback, useEffect } from 'react';
import type { AngleMode, CalculatorState, HistoryEntry, InputType } from '../types/calculator';

// ─── Expression Evaluator ─────────────────────────────────────────────────────

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: string }
  | { kind: 'func'; value: string }
  | { kind: 'lparen' }
  | { kind: 'rparen' }
  | { kind: 'fact' }
  | { kind: 'const'; value: 'π' | 'e' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const isDigit = (c: string) => c >= '0' && c <= '9';
  const isAlpha = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

  while (i < expr.length) {
    const c = expr[i];
    if (c === ' ') { i++; continue; }

    if (c === 'π') { tokens.push({ kind: 'const', value: 'π' }); i++; continue; }
    if (c === '√') { tokens.push({ kind: 'func', value: 'sqrt' }); i++; continue; }
    if (c === '∛') { tokens.push({ kind: 'func', value: 'cbrt' }); i++; continue; }
    if (c === '×') { tokens.push({ kind: 'op', value: '*' }); i++; continue; }
    if (c === '÷') { tokens.push({ kind: 'op', value: '/' }); i++; continue; }
    if (c === '!') { tokens.push({ kind: 'fact' }); i++; continue; }

    if (isDigit(c) || c === '.') {
      let s = '';
      while (i < expr.length && (isDigit(expr[i]) || expr[i] === '.')) s += expr[i++];
      tokens.push({ kind: 'num', value: parseFloat(s) });
      continue;
    }

    if (isAlpha(c)) {
      let name = '';
      while (i < expr.length && (isAlpha(expr[i]) || isDigit(expr[i]))) name += expr[i++];
      if (name === 'e') {
        tokens.push({ kind: 'const', value: 'e' });
      } else if (name === 'mod') {
        tokens.push({ kind: 'op', value: 'mod' });
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

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new Error('Domain error');
  if (n > 170) throw new Error('Overflow');
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function toRadians(v: number, mode: AngleMode): number {
  if (mode === 'RAD') return v;
  if (mode === 'DEG') return (v * Math.PI) / 180;
  return (v * Math.PI) / 200;
}

function fromRadians(v: number, mode: AngleMode): number {
  if (mode === 'RAD') return v;
  if (mode === 'DEG') return (v * 180) / Math.PI;
  return (v * 200) / Math.PI;
}

class Parser {
  private pos = 0;
  private tokens: Token[];
  private mode: AngleMode;
  constructor(tokens: Token[], mode: AngleMode) {
    this.tokens = tokens;
    this.mode = mode;
  }

  parse(): number {
    const v = this.parseExpr();
    if (this.pos < this.tokens.length) throw new Error('Unexpected token');
    return v;
  }

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }
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
    while (this.isOp('*', '/', 'mod')) {
      const op = (this.consume() as { kind: 'op'; value: string }).value;
      const r = this.parsePower();
      if (op === '*') v *= r;
      else if (op === '/') {
        if (r === 0) throw new Error('Division by zero');
        v /= r;
      } else {
        v = v % r;
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
    if (this.isOp('-')) { this.consume(); return -this.parsePostfix(); }
    if (this.isOp('+')) { this.consume(); return this.parsePostfix(); }
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let v = this.parsePrimary();
    while (this.peek()?.kind === 'fact') { this.consume(); v = factorial(v); }
    return v;
  }

  private parsePrimary(): number {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end');

    if (t.kind === 'num') { this.consume(); return (t as { kind: 'num'; value: number }).value; }
    if (t.kind === 'const') {
      this.consume();
      return (t as { kind: 'const'; value: string }).value === 'π' ? Math.PI : Math.E;
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
      case 'sin':   return Math.sin(toRadians(arg, this.mode));
      case 'cos':   return Math.cos(toRadians(arg, this.mode));
      case 'tan': {
        const r = Math.tan(toRadians(arg, this.mode));
        if (!isFinite(r)) throw new Error('Domain error');
        return r;
      }
      case 'asin':  return fromRadians(Math.asin(arg), this.mode);
      case 'acos':  return fromRadians(Math.acos(arg), this.mode);
      case 'atan':  return fromRadians(Math.atan(arg), this.mode);
      case 'sinh':  return Math.sinh(arg);
      case 'cosh':  return Math.cosh(arg);
      case 'tanh':  return Math.tanh(arg);
      case 'asinh': return Math.asinh(arg);
      case 'acosh': return Math.acosh(arg);
      case 'atanh': return Math.atanh(arg);
      case 'log':   return Math.log10(arg);
      case 'ln':    return Math.log(arg);
      case 'sqrt':  if (arg < 0) throw new Error('Domain error'); return Math.sqrt(arg);
      case 'cbrt':  return Math.cbrt(arg);
      case 'abs':   return Math.abs(arg);
      case 'exp':   return Math.exp(arg);
      case 'pow10': return Math.pow(10, arg);
      case 'rec':   if (arg === 0) throw new Error('Division by zero'); return 1 / arg;
      default: throw new Error(`Unknown function: ${name}`);
    }
  }
}

function countOpenParens(expr: string): number {
  let n = 0;
  for (const c of expr) {
    if (c === '(') n++;
    else if (c === ')') n--;
  }
  return Math.max(0, n);
}

function formatResult(n: number): string {
  if (!isFinite(n)) return 'Math error';
  if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-10 && n !== 0)) {
    return n.toExponential(8).replace(/\.?0+e/, 'e');
  }
  const s = String(parseFloat(n.toPrecision(12)));
  return s;
}

function evaluate(expr: string, mode: AngleMode): number {
  const tokens = tokenize(expr);
  return new Parser(tokens, mode).parse();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const MAX_HISTORY = 20;
const MEMORY_SLOTS = 5;

const initialState: CalculatorState = {
  expression: '',
  display: '0',
  lastInputType: 'none',
  justCalculated: false,
  isError: false,
  isInverse: false,
  angleMode: 'DEG',
  memory: Array<number>(MEMORY_SLOTS).fill(0),
  history: [],
};

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(initialState);

  const inputDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.isError) return { ...initialState, memory: prev.memory, history: prev.history, display: digit, expression: digit, lastInputType: 'digit' };
      if (prev.justCalculated) {
        return { ...prev, expression: digit, display: digit, lastInputType: 'digit', justCalculated: false };
      }
      const appendToDisplay = prev.lastInputType === 'digit' || prev.lastInputType === 'decimal';
      const newDisplay = appendToDisplay ? (prev.display === '0' ? digit : prev.display + digit) : digit;
      return { ...prev, expression: prev.expression + digit, display: newDisplay, lastInputType: 'digit' };
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      if (prev.justCalculated) {
        return { ...prev, expression: '0.', display: '0.', lastInputType: 'decimal', justCalculated: false };
      }
      const appendToDisplay = prev.lastInputType === 'digit' || prev.lastInputType === 'decimal';
      if (appendToDisplay && prev.display.includes('.')) return prev;
      const newDisplay = appendToDisplay ? prev.display + '.' : '0.';
      const exprSuffix = appendToDisplay ? '.' : '0.';
      return { ...prev, expression: prev.expression + exprSuffix, display: newDisplay, lastInputType: 'decimal' };
    });
  }, []);

  const inputOperator = useCallback((op: string) => {
    setState(prev => {
      if (prev.isError) return prev;
      const expr = prev.justCalculated ? prev.display + op : prev.expression + op;
      return { ...prev, expression: expr, display: op, lastInputType: 'operator', justCalculated: false };
    });
  }, []);

  const inputFunction = useCallback((func: string) => {
    setState(prev => {
      if (prev.isError) return prev;
      const prefix = prev.justCalculated ? '' : prev.expression;
      return {
        ...prev,
        expression: prefix + func + '(',
        display: func + '(',
        lastInputType: 'function',
        justCalculated: false,
      };
    });
  }, []);

  const inputParen = useCallback((p: '(' | ')') => {
    setState(prev => {
      if (prev.isError) return prev;
      if (p === ')' && countOpenParens(prev.expression) <= 0) return prev;
      const expr = prev.justCalculated ? p : prev.expression + p;
      return { ...prev, expression: expr, display: p, lastInputType: 'paren', justCalculated: false };
    });
  }, []);

  const inputConstant = useCallback((c: 'π' | 'e') => {
    setState(prev => {
      if (prev.isError) return prev;
      const value = c === 'π' ? String(Math.PI) : String(Math.E);
      const expr = prev.justCalculated ? c : prev.expression + c;
      return { ...prev, expression: expr, display: value.slice(0, 12), lastInputType: 'constant', justCalculated: false };
    });
  }, []);

  const calculate = useCallback(() => {
    setState(prev => {
      if (prev.expression === '' || prev.isError) return prev;
      const open = countOpenParens(prev.expression);
      const fullExpr = prev.expression + ')'.repeat(open);
      try {
        const num = evaluate(fullExpr, prev.angleMode);
        if (isNaN(num)) throw new Error('Math error');
        if (!isFinite(num)) throw new Error('Math error');
        const resultStr = formatResult(num);
        const entry: HistoryEntry = { id: Date.now(), expression: fullExpr, result: resultStr };
        return {
          ...prev,
          expression: fullExpr + '=',
          display: resultStr,
          lastInputType: 'result',
          justCalculated: true,
          isError: false,
          history: [entry, ...prev.history].slice(0, MAX_HISTORY),
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error';
        return { ...prev, display: msg, isError: true, justCalculated: true };
      }
    });
  }, []);

  const allClear = useCallback(() => {
    setState(prev => ({ ...initialState, memory: prev.memory, history: prev.history }));
  }, []);

  const clear = useCallback(() => {
    setState(prev => {
      if (prev.expression === '' || prev.justCalculated) {
        return { ...initialState, memory: prev.memory, history: prev.history };
      }
      return { ...prev, expression: '', display: '0', lastInputType: 'none', isError: false };
    });
  }, []);

  const backspace = useCallback(() => {
    setState(prev => {
      if (prev.justCalculated || prev.isError) {
        return { ...initialState, memory: prev.memory, history: prev.history };
      }
      if (prev.expression === '') return prev;
      const newExpr = prev.expression.slice(0, -1);
      const newDisplay = prev.display.length > 1 ? prev.display.slice(0, -1) : '0';
      const newInputType: InputType = newDisplay === '0' ? 'none' : prev.lastInputType;
      return { ...prev, expression: newExpr, display: newDisplay, lastInputType: newInputType };
    });
  }, []);

  const toggleSign = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      if (prev.lastInputType === 'digit' || prev.lastInputType === 'decimal' || prev.lastInputType === 'result') {
        const val = parseFloat(prev.display);
        if (isNaN(val)) return prev;
        const negated = String(-val);
        const oldDisplay = prev.display;
        let newExpr = prev.expression;
        if (newExpr.endsWith(oldDisplay)) {
          newExpr = newExpr.slice(0, -oldDisplay.length) + negated;
        } else {
          newExpr = `-(${newExpr})`;
        }
        return { ...prev, expression: newExpr, display: negated, justCalculated: false };
      }
      return prev;
    });
  }, []);

  const percentage = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      const val = parseFloat(prev.display) / 100;
      const valStr = formatResult(val);
      const oldDisplay = prev.display;
      let newExpr = prev.expression;
      if (newExpr.endsWith(oldDisplay)) {
        newExpr = newExpr.slice(0, -oldDisplay.length) + valStr;
      }
      return { ...prev, expression: newExpr, display: valStr, justCalculated: false };
    });
  }, []);

  const squareValue = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      return { ...prev, expression: prev.expression + '^2', display: '^2', lastInputType: 'operator' };
    });
  }, []);

  const cubeValue = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      return { ...prev, expression: prev.expression + '^3', display: '^3', lastInputType: 'operator' };
    });
  }, []);

  const powerOf = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      return { ...prev, expression: prev.expression + '^', display: '^', lastInputType: 'operator' };
    });
  }, []);

  const factorialOp = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      return { ...prev, expression: prev.expression + '!', display: '!', lastInputType: 'operator' };
    });
  }, []);

  const reciprocal = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      return { ...prev, expression: `rec(${prev.expression})`, display: 'rec(', lastInputType: 'function' };
    });
  }, []);

  const modOp = useCallback(() => {
    setState(prev => {
      if (prev.isError) return prev;
      return { ...prev, expression: prev.expression + ' mod ', display: 'mod', lastInputType: 'operator' };
    });
  }, []);

  const memoryClear = useCallback((slot = 0) => {
    setState(prev => {
      const memory = [...prev.memory];
      memory[slot] = 0;
      return { ...prev, memory };
    });
  }, []);

  const memoryRecall = useCallback((slot = 0) => {
    setState(prev => {
      const value = prev.memory[slot];
      const valStr = String(value);
      const expr = prev.justCalculated ? valStr : prev.expression + valStr;
      return { ...prev, expression: expr, display: valStr, lastInputType: 'digit', justCalculated: false };
    });
  }, []);

  const memoryStore = useCallback((slot = 0) => {
    setState(prev => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      const memory = [...prev.memory];
      memory[slot] = value;
      return { ...prev, memory };
    });
  }, []);

  const memoryAdd = useCallback((slot = 0) => {
    setState(prev => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      const memory = [...prev.memory];
      memory[slot] += value;
      return { ...prev, memory };
    });
  }, []);

  const memorySubtract = useCallback((slot = 0) => {
    setState(prev => {
      const value = parseFloat(prev.display);
      if (isNaN(value)) return prev;
      const memory = [...prev.memory];
      memory[slot] -= value;
      return { ...prev, memory };
    });
  }, []);

  const cycleAngleMode = useCallback(() => {
    setState(prev => {
      const modes: AngleMode[] = ['DEG', 'RAD', 'GRAD'];
      const next = modes[(modes.indexOf(prev.angleMode) + 1) % 3];
      return { ...prev, angleMode: next };
    });
  }, []);

  const toggleInverse = useCallback(() => {
    setState(prev => ({ ...prev, isInverse: !prev.isInverse }));
  }, []);

  const recallHistory = useCallback((entry: HistoryEntry) => {
    setState(prev => ({
      ...prev,
      expression: entry.result,
      display: entry.result,
      lastInputType: 'result',
      justCalculated: true,
      isError: false,
    }));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key);
      else if (e.key === '.') inputDecimal();
      else if (e.key === '+') inputOperator('+');
      else if (e.key === '-') inputOperator('-');
      else if (e.key === '*') inputOperator('*');
      else if (e.key === '/') { e.preventDefault(); inputOperator('/'); }
      else if (e.key === '^') inputOperator('^');
      else if (e.key === 'Enter' || e.key === '=') calculate();
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') allClear();
      else if (e.key === '(') inputParen('(');
      else if (e.key === ')') inputParen(')');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [inputDigit, inputDecimal, inputOperator, calculate, backspace, allClear, inputParen]);

  return {
    expression: state.expression,
    display: state.display,
    angleMode: state.angleMode,
    memory: state.memory,
    history: state.history,
    isError: state.isError,
    isInverse: state.isInverse,
    inputDigit,
    inputDecimal,
    inputOperator,
    inputFunction,
    inputParen,
    inputConstant,
    calculate,
    allClear,
    clear,
    backspace,
    toggleSign,
    percentage,
    squareValue,
    cubeValue,
    powerOf,
    factorial: factorialOp,
    reciprocal,
    modOp,
    memoryClear,
    memoryRecall,
    memoryStore,
    memoryAdd,
    memorySubtract,
    cycleAngleMode,
    toggleInverse,
    recallHistory,
  };
}
