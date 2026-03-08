import { useState, useCallback } from 'react';
import type { NumberTheoryState, NumberTheoryMode, SequenceType, ChartMode } from '../types/calculator';

// ─── Prime utilities ──────────────────────────────────────────────────────────

export function sieveOfEratosthenes(limit: number): boolean[] {
  const isPrime = new Array<boolean>(limit + 1).fill(true);
  isPrime[0] = false;
  if (limit >= 1) isPrime[1] = false;
  for (let i = 2; i * i <= limit; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= limit; j += i) isPrime[j] = false;
    }
  }
  return isPrime;
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

// ─── Prime factorization ──────────────────────────────────────────────────────

export interface FactorNode {
  value: number;
  isPrime: boolean;
  children: FactorNode[];
}

export function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let d = 2;
  let remaining = n;
  while (d * d <= remaining) {
    while (remaining % d === 0) {
      factors.push(d);
      remaining = Math.floor(remaining / d);
    }
    d++;
  }
  if (remaining > 1) factors.push(remaining);
  return factors;
}

export function buildFactorTree(n: number): FactorNode {
  if (n <= 1 || isPrime(n)) {
    return { value: n, isPrime: n > 1, children: [] };
  }
  const factors = primeFactors(n);
  const smallest = factors[0];
  const quotient = Math.floor(n / smallest);
  return {
    value: n,
    isPrime: false,
    children: [buildFactorTree(smallest), buildFactorTree(quotient)],
  };
}

// ─── Number theory operations ─────────────────────────────────────────────────

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) { [a, b] = [b, a % b]; }
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
}

export function eulerTotient(n: number): number {
  let result = n;
  let temp = n;
  for (let p = 2; p * p <= temp; p++) {
    if (temp % p === 0) {
      while (temp % p === 0) temp = Math.floor(temp / p);
      result -= Math.floor(result / p);
    }
  }
  if (temp > 1) result -= Math.floor(result / temp);
  return result;
}

export function modPow(base: number, exp: number, mod: number): number {
  if (mod === 1) return 0;
  let result = 1;
  base = ((base % mod) + mod) % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

// ─── Sequence generators ──────────────────────────────────────────────────────

export function generateSequence(type: SequenceType, length: number): number[] {
  const seq: number[] = [];
  switch (type) {
    case 'fibonacci': {
      let a = 0, b = 1;
      for (let i = 0; i < length; i++) {
        seq.push(a);
        [a, b] = [b, a + b];
      }
      break;
    }
    case 'triangular': {
      for (let n = 1; n <= length; n++) seq.push((n * (n + 1)) / 2);
      break;
    }
    case 'perfect': {
      let n = 2;
      while (seq.length < length) {
        let sum = 1;
        for (let d = 2; d <= Math.sqrt(n); d++) {
          if (n % d === 0) { sum += d; if (d !== n / d) sum += n / d; }
        }
        if (sum === n) seq.push(n);
        n++;
        if (n > 10_000_000) break; // safety
      }
      break;
    }
    case 'primes': {
      const limit = Math.max(length * 15, 100);
      const primeArr = sieveOfEratosthenes(limit);
      for (let i = 2; seq.length < length && i <= limit; i++) {
        if (primeArr[i]) seq.push(i);
      }
      break;
    }
    case 'squares': {
      for (let n = 1; n <= length; n++) seq.push(n * n);
      break;
    }
  }
  return seq;
}

// ─── Ulam spiral ─────────────────────────────────────────────────────────────

export interface UlamCell {
  n: number;
  x: number;
  y: number;
  prime: boolean;
}

export function buildUlamSpiral(size: number): UlamCell[] {
  // size = grid side (should be odd)
  const s = size % 2 === 0 ? size + 1 : size;
  const total = s * s;
  const isPrimeArr = sieveOfEratosthenes(total);
  const cells: UlamCell[] = [];

  let x = 0, y = 0, dx = 1, dy = 0;
  let steps = 1, stepCount = 0, turnCount = 0;

  for (let n = 1; n <= total; n++) {
    cells.push({ n, x, y, prime: isPrimeArr[n] });
    x += dx; y += dy; stepCount++;
    if (stepCount === steps) {
      stepCount = 0;
      [dx, dy] = [-dy, dx];
      turnCount++;
      if (turnCount % 2 === 0) steps++;
    }
  }
  return cells;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_STATE: NumberTheoryState = {
  mode: 'factorize',
  inputN: 360,
  modBase: 2,
  modExponent: 10,
  modModulus: 1000,
  sequenceType: 'fibonacci',
  sequenceLength: 20,
  chartMode: 'bar',
  sieveLimit: 100,
  ulamSize: 21,
};

export interface NumberTheoryHookResult {
  state: NumberTheoryState;
  setMode: (m: NumberTheoryMode) => void;
  setInputN: (n: number) => void;
  setModBase: (v: number) => void;
  setModExponent: (v: number) => void;
  setModModulus: (v: number) => void;
  setSequenceType: (t: SequenceType) => void;
  setSequenceLength: (n: number) => void;
  setChartMode: (m: ChartMode) => void;
  setSieveLimit: (n: number) => void;
  setUlamSize: (n: number) => void;
  getFactorTree: () => FactorNode;
  getPrimeFactors: () => number[];
  getGCD: (b: number) => number;
  getLCM: (b: number) => number;
  getTotient: () => number;
  getModPow: () => number;
  getSequence: () => number[];
  getSieve: () => boolean[];
  getUlam: () => UlamCell[];
}

export function useNumberTheory(): NumberTheoryHookResult {
  const [state, setState] = useState<NumberTheoryState>(DEFAULT_STATE);

  const setMode = useCallback((mode: NumberTheoryMode) => setState(s => ({ ...s, mode })), []);
  const setInputN = useCallback((inputN: number) => setState(s => ({ ...s, inputN })), []);
  const setModBase = useCallback((modBase: number) => setState(s => ({ ...s, modBase })), []);
  const setModExponent = useCallback((modExponent: number) => setState(s => ({ ...s, modExponent })), []);
  const setModModulus = useCallback((modModulus: number) => setState(s => ({ ...s, modModulus })), []);
  const setSequenceType = useCallback((sequenceType: SequenceType) => setState(s => ({ ...s, sequenceType })), []);
  const setSequenceLength = useCallback((sequenceLength: number) => setState(s => ({ ...s, sequenceLength })), []);
  const setChartMode = useCallback((chartMode: ChartMode) => setState(s => ({ ...s, chartMode })), []);
  const setSieveLimit = useCallback((sieveLimit: number) => setState(s => ({ ...s, sieveLimit })), []);
  const setUlamSize = useCallback((ulamSize: number) => setState(s => ({ ...s, ulamSize })), []);

  const getFactorTree = useCallback(() => buildFactorTree(state.inputN), [state.inputN]);
  const getPrimeFactors = useCallback(() => primeFactors(state.inputN), [state.inputN]);
  const getGCD = useCallback((b: number) => gcd(state.inputN, b), [state.inputN]);
  const getLCM = useCallback((b: number) => lcm(state.inputN, b), [state.inputN]);
  const getTotient = useCallback(() => eulerTotient(state.inputN), [state.inputN]);
  const getModPow = useCallback(() => modPow(state.modBase, state.modExponent, state.modModulus), [state]);
  const getSequence = useCallback(() => generateSequence(state.sequenceType, state.sequenceLength), [state.sequenceType, state.sequenceLength]);
  const getSieve = useCallback(() => sieveOfEratosthenes(state.sieveLimit), [state.sieveLimit]);
  const getUlam = useCallback(() => buildUlamSpiral(state.ulamSize), [state.ulamSize]);

  return {
    state,
    setMode,
    setInputN,
    setModBase,
    setModExponent,
    setModModulus,
    setSequenceType,
    setSequenceLength,
    setChartMode,
    setSieveLimit,
    setUlamSize,
    getFactorTree,
    getPrimeFactors,
    getGCD,
    getLCM,
    getTotient,
    getModPow,
    getSequence,
    getSieve,
    getUlam,
  };
}
