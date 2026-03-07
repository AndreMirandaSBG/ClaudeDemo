import { useState, useCallback } from 'react';
import type { ComplexNumber, ComplexForm, ComplexHistoryEntry } from '../types/calculator';

// ─── Complex arithmetic ───────────────────────────────────────────────────────

export function complexAdd(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexSub(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function complexMul(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function complexDiv(a: ComplexNumber, b: ComplexNumber): ComplexNumber {
  const denom = b.re * b.re + b.im * b.im;
  if (denom === 0) throw new Error('Division by zero');
  return {
    re: (a.re * b.re + a.im * b.im) / denom,
    im: (a.im * b.re - a.re * b.im) / denom,
  };
}

export function complexModulus(a: ComplexNumber): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function complexArgument(a: ComplexNumber): number {
  return Math.atan2(a.im, a.re);
}

export function complexConjugate(a: ComplexNumber): ComplexNumber {
  return { re: a.re, im: -a.im };
}

export function complexNthRoots(a: ComplexNumber, n: number): ComplexNumber[] {
  if (n < 1 || !Number.isInteger(n)) throw new Error('n must be a positive integer');
  const r = complexModulus(a);
  const theta = complexArgument(a);
  const rn = Math.pow(r, 1 / n);
  const roots: ComplexNumber[] = [];
  for (let k = 0; k < n; k++) {
    const angle = (theta + 2 * Math.PI * k) / n;
    roots.push({ re: rn * Math.cos(angle), im: rn * Math.sin(angle) });
  }
  return roots;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function formatRectangular(c: ComplexNumber): string {
  const re = round6(c.re);
  const im = round6(c.im);
  if (im === 0) return String(re);
  if (re === 0) return `${im}i`;
  const sign = im < 0 ? ' - ' : ' + ';
  return `${re}${sign}${Math.abs(im)}i`;
}

export function formatPolar(c: ComplexNumber): string {
  const r = round6(complexModulus(c));
  const theta = round6(complexArgument(c));
  return `${r}∠${theta} rad`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComplex() {
  const [form, setFormState] = useState<ComplexForm>('rectangular');
  const [inputRe, setInputRe] = useState('0');
  const [inputIm, setInputIm] = useState('0');
  const [operand, setOperand] = useState<ComplexNumber | null>(null);
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [result, setResult] = useState<ComplexNumber | null>(null);
  const [plotPoints, setPlotPoints] = useState<ComplexNumber[]>([]);
  const [history, setHistory] = useState<ComplexHistoryEntry[]>([]);
  const [error, setError] = useState('');

  const current = useCallback((): ComplexNumber => {
    return { re: parseFloat(inputRe) || 0, im: parseFloat(inputIm) || 0 };
  }, [inputRe, inputIm]);

  const applyOperation = useCallback((op: string) => {
    setError('');
    const c = current();
    if (op === 'conj') {
      const res = complexConjugate(c);
      setResult(res);
      setHistory(prev => [
        { id: Date.now(), expression: `conj(${formatRectangular(c)})`, result: res },
        ...prev,
      ].slice(0, 20));
      return;
    }
    if (op === 'mod') {
      const mod = complexModulus(c);
      setResult({ re: mod, im: 0 });
      setHistory(prev => [
        { id: Date.now(), expression: `|${formatRectangular(c)}|`, result: { re: mod, im: 0 } },
        ...prev,
      ].slice(0, 20));
      return;
    }
    if (op === 'arg') {
      const arg = complexArgument(c);
      setResult({ re: arg, im: 0 });
      setHistory(prev => [
        { id: Date.now(), expression: `arg(${formatRectangular(c)})`, result: { re: arg, im: 0 } },
        ...prev,
      ].slice(0, 20));
      return;
    }
    if (op === 'roots2' || op === 'roots3') {
      const n = op === 'roots2' ? 2 : 3;
      try {
        const roots = complexNthRoots(c, n);
        const res = roots[0];
        setResult(res);
        setPlotPoints(prev => [...prev, ...roots].slice(-20));
        setHistory(prev => [
          { id: Date.now(), expression: `${n}√(${formatRectangular(c)})`, result: res },
          ...prev,
        ].slice(0, 20));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      }
      return;
    }
    // Binary operations: save operand and op
    setOperand(c);
    setPendingOp(op);
  }, [current]);

  const compute = useCallback(() => {
    if (!pendingOp || !operand) return;
    setError('');
    const c = current();
    try {
      let res: ComplexNumber;
      const opStr = pendingOp;
      if (opStr === '+') res = complexAdd(operand, c);
      else if (opStr === '-') res = complexSub(operand, c);
      else if (opStr === '*') res = complexMul(operand, c);
      else if (opStr === '/') res = complexDiv(operand, c);
      else return;

      const expr = `(${formatRectangular(operand)}) ${opStr} (${formatRectangular(c)})`;
      setResult(res);
      setHistory(prev => [{ id: Date.now(), expression: expr, result: res }, ...prev].slice(0, 20));
      setOperand(null);
      setPendingOp(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [pendingOp, operand, current]);

  const addToPlot = useCallback(() => {
    const c = current();
    setPlotPoints(prev => [...prev, c].slice(-20));
  }, [current]);

  const clearPlot = useCallback(() => {
    setPlotPoints([]);
  }, []);

  const toggleForm = useCallback(() => {
    setFormState(prev => prev === 'rectangular' ? 'polar' : 'rectangular');
  }, []);

  const clearAll = useCallback(() => {
    setInputRe('0');
    setInputIm('0');
    setOperand(null);
    setPendingOp(null);
    setResult(null);
    setError('');
  }, []);

  const useResult = useCallback(() => {
    if (!result) return;
    setInputRe(String(round6(result.re)));
    setInputIm(String(round6(result.im)));
    setResult(null);
  }, [result]);

  return {
    form,
    inputRe,
    inputIm,
    operand,
    pendingOp,
    result,
    plotPoints,
    history,
    error,
    setInputRe,
    setInputIm,
    applyOperation,
    compute,
    addToPlot,
    clearPlot,
    toggleForm,
    clearAll,
    useResult,
  };
}
