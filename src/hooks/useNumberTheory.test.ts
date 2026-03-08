import { renderHook, act } from '@testing-library/react';
import {
  useNumberTheory,
  gcd,
  lcm,
  eulerTotient,
  modPow,
  isPrime,
  primeFactors,
  generateSequence,
  buildFactorTree,
  sieveOfEratosthenes,
  buildUlamSpiral,
} from './useNumberTheory';

// ─── gcd ──────────────────────────────────────────────────────────────────────

it('gcd(12, 8) = 4', () => { expect(gcd(12, 8)).toBe(4); });
it('gcd(7, 5) = 1 (coprime)', () => { expect(gcd(7, 5)).toBe(1); });
it('gcd(0, 5) = 5', () => { expect(gcd(0, 5)).toBe(5); });
it('gcd is commutative', () => { expect(gcd(36, 48)).toBe(gcd(48, 36)); });
it('gcd(100, 75) = 25', () => { expect(gcd(100, 75)).toBe(25); });

// ─── lcm ──────────────────────────────────────────────────────────────────────

it('lcm(4, 6) = 12', () => { expect(lcm(4, 6)).toBe(12); });
it('lcm(0, 5) = 0', () => { expect(lcm(0, 5)).toBe(0); });
it('lcm(7, 3) = 21', () => { expect(lcm(7, 3)).toBe(21); });

// ─── eulerTotient ─────────────────────────────────────────────────────────────

it('φ(1) = 1', () => { expect(eulerTotient(1)).toBe(1); });
it('φ(p) = p-1 for prime p', () => { expect(eulerTotient(7)).toBe(6); });
it('φ(9) = 6', () => { expect(eulerTotient(9)).toBe(6); });
it('φ(12) = 4', () => { expect(eulerTotient(12)).toBe(4); });

// ─── modPow ───────────────────────────────────────────────────────────────────

it('2^10 mod 1000 = 24', () => { expect(modPow(2, 10, 1000)).toBe(24); });
it('3^0 mod 7 = 1', () => { expect(modPow(3, 0, 7)).toBe(1); });
it('any mod 1 = 0', () => { expect(modPow(5, 3, 1)).toBe(0); });
it('5^3 mod 13 = 8', () => { expect(modPow(5, 3, 13)).toBe(8); });

// ─── isPrime ──────────────────────────────────────────────────────────────────

it('isPrime(2) is true', () => { expect(isPrime(2)).toBe(true); });
it('isPrime(1) is false', () => { expect(isPrime(1)).toBe(false); });
it('isPrime(0) is false', () => { expect(isPrime(0)).toBe(false); });
it('isPrime(17) is true', () => { expect(isPrime(17)).toBe(true); });
it('isPrime(9) is false', () => { expect(isPrime(9)).toBe(false); });
it('isPrime(97) is true', () => { expect(isPrime(97)).toBe(true); });

// ─── primeFactors ─────────────────────────────────────────────────────────────

it('factors of 12 are [2,2,3]', () => { expect(primeFactors(12)).toEqual([2, 2, 3]); });
it('factors of 7 are [7]', () => { expect(primeFactors(7)).toEqual([7]); });
it('factors multiply to original number', () => {
  const n = 360;
  const f = primeFactors(n);
  expect(f.reduce((a, b) => a * b, 1)).toBe(n);
});
it('all factors are prime', () => {
  const f = primeFactors(360);
  for (const p of f) expect(isPrime(p)).toBe(true);
});

// ─── buildFactorTree ──────────────────────────────────────────────────────────

it('factor tree root has correct value', () => {
  const tree = buildFactorTree(12);
  expect(tree.value).toBe(12);
  expect(tree.isPrime).toBe(false);
});

it('factor tree for prime has no children', () => {
  const tree = buildFactorTree(7);
  expect(tree.children.length).toBe(0);
  expect(tree.isPrime).toBe(true);
});

it('factor tree for 4 has children [2,2]', () => {
  const tree = buildFactorTree(4);
  expect(tree.children.length).toBe(2);
  const childVals = tree.children.map(c => c.value).sort((a, b) => a - b);
  expect(childVals[0]).toBe(2);
});

// ─── sieveOfEratosthenes ──────────────────────────────────────────────────────

it('sieve correctly marks first 20 numbers', () => {
  const sieve = sieveOfEratosthenes(20);
  const primes = [2, 3, 5, 7, 11, 13, 17, 19];
  for (let i = 0; i <= 20; i++) {
    expect(sieve[i]).toBe(primes.includes(i));
  }
});

it('sieve 0 and 1 are not prime', () => {
  const sieve = sieveOfEratosthenes(10);
  expect(sieve[0]).toBe(false);
  expect(sieve[1]).toBe(false);
});

// ─── generateSequence ─────────────────────────────────────────────────────────

it('fibonacci sequence starts with 0,1,1,2,3,5', () => {
  const seq = generateSequence('fibonacci', 6);
  expect(seq).toEqual([0, 1, 1, 2, 3, 5]);
});

it('triangular numbers: 1,3,6,10,15', () => {
  const seq = generateSequence('triangular', 5);
  expect(seq).toEqual([1, 3, 6, 10, 15]);
});

it('square numbers: 1,4,9,16,25', () => {
  const seq = generateSequence('squares', 5);
  expect(seq).toEqual([1, 4, 9, 16, 25]);
});

it('primes sequence is all prime', () => {
  const seq = generateSequence('primes', 10);
  for (const p of seq) expect(isPrime(p)).toBe(true);
  expect(seq.length).toBe(10);
});

it('perfect numbers: 6,28', () => {
  const seq = generateSequence('perfect', 2);
  expect(seq[0]).toBe(6);
  expect(seq[1]).toBe(28);
});

// ─── buildUlamSpiral ──────────────────────────────────────────────────────────

it('Ulam spiral has size^2 cells', () => {
  const cells = buildUlamSpiral(7);
  expect(cells.length).toBe(49);
});

it('Ulam spiral has n=1 at some cell', () => {
  const cells = buildUlamSpiral(7);
  const one = cells.find(c => c.n === 1);
  expect(one).toBeDefined();
});

it('Ulam spiral marks primes correctly', () => {
  const cells = buildUlamSpiral(7);
  for (const c of cells) {
    if (c.n >= 2) expect(c.prime).toBe(isPrime(c.n));
  }
});

// ─── useNumberTheory hook ─────────────────────────────────────────────────────

it('default mode is factorize', () => {
  const { result } = renderHook(() => useNumberTheory());
  expect(result.current.state.mode).toBe('factorize');
});

it('setMode changes mode', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setMode('sieve'));
  expect(result.current.state.mode).toBe('sieve');
});

it('setInputN updates input number', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setInputN(12));
  expect(result.current.state.inputN).toBe(12);
  expect(result.current.getPrimeFactors()).toEqual([2, 2, 3]);
});

it('getGCD uses current inputN', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setInputN(12));
  expect(result.current.getGCD(8)).toBe(4);
});

it('getLCM uses current inputN', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setInputN(4));
  expect(result.current.getLCM(6)).toBe(12);
});

it('getTotient uses current inputN', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setInputN(7));
  expect(result.current.getTotient()).toBe(6);
});

it('getModPow uses modBase/Exp/Modulus', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => {
    result.current.setModBase(2);
    result.current.setModExponent(10);
    result.current.setModModulus(1000);
  });
  expect(result.current.getModPow()).toBe(24);
});

it('setSequenceType and getSequence', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => {
    result.current.setSequenceType('triangular');
    result.current.setSequenceLength(5);
  });
  expect(result.current.getSequence()).toEqual([1, 3, 6, 10, 15]);
});

it('getSieve returns array', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setSieveLimit(20));
  const sieve = result.current.getSieve();
  expect(Array.isArray(sieve)).toBe(true);
  expect(sieve.length).toBe(21);
});

it('getUlam returns cells array', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setUlamSize(7));
  const cells = result.current.getUlam();
  expect(cells.length).toBe(49);
});

it('setChartMode updates chartMode', () => {
  const { result } = renderHook(() => useNumberTheory());
  act(() => result.current.setChartMode('scatter'));
  expect(result.current.state.chartMode).toBe('scatter');
});
