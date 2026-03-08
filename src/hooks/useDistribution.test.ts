import { renderHook, act } from '@testing-library/react';
import {
  useDistribution,
  pdfNormal,
  pdfT,
  pdfChiSquared,
  pdfUniform,
  pdfExponential,
  pmfBinomial,
  pmfPoisson,
  cdfNormal,
  cdfExponential,
  sampleDistribution,
  sampleDiscrete,
  getXRange,
  runMonteCarlo,
} from './useDistribution';

// ─── pdfNormal ────────────────────────────────────────────────────────────────

it('normal PDF peaks at mean', () => {
  const atMean = pdfNormal(0, 0, 1);
  const offMean = pdfNormal(1, 0, 1);
  expect(atMean).toBeGreaterThan(offMean);
});

it('normal PDF is symmetric around mean', () => {
  expect(pdfNormal(1, 0, 1)).toBeCloseTo(pdfNormal(-1, 0, 1), 10);
});

it('standard normal PDF at 0 is ~0.3989', () => {
  expect(pdfNormal(0, 0, 1)).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 5);
});

it('normal PDF returns 0 for non-positive sigma', () => {
  expect(pdfNormal(0, 0, 0)).toBe(0);
  expect(pdfNormal(0, 0, -1)).toBe(0);
});

// ─── pdfT ─────────────────────────────────────────────────────────────────────

it('t-distribution PDF peaks at 0', () => {
  expect(pdfT(0, 5)).toBeGreaterThan(pdfT(1, 5));
});

it('t-distribution approaches normal as df increases', () => {
  const tAtZero = pdfT(0, 1000);
  const normAtZero = pdfNormal(0, 0, 1);
  expect(tAtZero).toBeCloseTo(normAtZero, 2);
});

// ─── pdfChiSquared ────────────────────────────────────────────────────────────

it('chi-squared PDF is 0 for x <= 0', () => {
  expect(pdfChiSquared(0, 2)).toBe(0);
  expect(pdfChiSquared(-1, 2)).toBe(0);
});

it('chi-squared PDF is positive for x > 0', () => {
  expect(pdfChiSquared(1, 2)).toBeGreaterThan(0);
});

// ─── pdfUniform ───────────────────────────────────────────────────────────────

it('uniform PDF is 1/(b-a) in range', () => {
  expect(pdfUniform(0.5, 0, 1)).toBeCloseTo(1, 5);
  expect(pdfUniform(2, 0, 4)).toBeCloseTo(0.25, 5);
});

it('uniform PDF is 0 outside range', () => {
  expect(pdfUniform(-0.1, 0, 1)).toBe(0);
  expect(pdfUniform(1.1, 0, 1)).toBe(0);
});

// ─── pdfExponential ───────────────────────────────────────────────────────────

it('exponential PDF at x=0 is lambda', () => {
  expect(pdfExponential(0, 2)).toBeCloseTo(2, 5);
});

it('exponential PDF is 0 for x < 0', () => {
  expect(pdfExponential(-1, 1)).toBe(0);
});

// ─── pmfBinomial ─────────────────────────────────────────────────────────────

it('binomial PMF sums to ~1 over all k', () => {
  let total = 0;
  for (let k = 0; k <= 10; k++) total += pmfBinomial(k, 10, 0.5);
  expect(total).toBeCloseTo(1, 5);
});

it('binomial PMF is 0 for k outside [0,n]', () => {
  expect(pmfBinomial(-1, 10, 0.5)).toBe(0);
  expect(pmfBinomial(11, 10, 0.5)).toBe(0);
});

// ─── pmfPoisson ───────────────────────────────────────────────────────────────

it('Poisson PMF sums to ~1 (first 50 terms)', () => {
  let total = 0;
  for (let k = 0; k < 50; k++) total += pmfPoisson(k, 3);
  expect(total).toBeCloseTo(1, 4);
});

it('Poisson PMF is 0 for k < 0', () => {
  expect(pmfPoisson(-1, 3)).toBe(0);
});

// ─── cdfNormal ────────────────────────────────────────────────────────────────

it('standard normal CDF at 0 is 0.5', () => {
  expect(cdfNormal(0, 0, 1)).toBeCloseTo(0.5, 5);
});

it('normal CDF at +∞ approaches 1 (large x)', () => {
  expect(cdfNormal(10, 0, 1)).toBeGreaterThan(0.9999);
});

it('normal CDF at -∞ approaches 0 (very negative x)', () => {
  expect(cdfNormal(-10, 0, 1)).toBeLessThan(0.0001);
});

// ─── cdfExponential ───────────────────────────────────────────────────────────

it('exponential CDF at x=0 is 0', () => {
  expect(cdfExponential(0, 1)).toBe(0);
});

it('exponential CDF increases with x', () => {
  expect(cdfExponential(2, 1)).toBeGreaterThan(cdfExponential(1, 1));
});

// ─── sampleDistribution ───────────────────────────────────────────────────────

it('sampleDistribution returns array of points', () => {
  const params = { mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 1, df: 5, a: 0, b: 1 };
  const pts = sampleDistribution('normal', params, -3, 3);
  expect(pts.length).toBeGreaterThan(0);
  expect(pts[0]).toHaveProperty('x');
  expect(pts[0]).toHaveProperty('y');
});

// ─── sampleDiscrete ───────────────────────────────────────────────────────────

it('sampleDiscrete returns points for binomial', () => {
  const params = { mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 1, df: 5, a: 0, b: 1 };
  const pts = sampleDiscrete('binomial', params, 10);
  expect(pts.length).toBe(11);
});

// ─── getXRange ────────────────────────────────────────────────────────────────

it('getXRange returns sensible range for normal', () => {
  const params = { mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 1, df: 5, a: 0, b: 1 };
  const [xMin, xMax] = getXRange('normal', params);
  expect(xMin).toBeLessThan(0);
  expect(xMax).toBeGreaterThan(0);
});

// ─── runMonteCarlo ────────────────────────────────────────────────────────────

it('Monte Carlo generates correct sample count', () => {
  const params = { mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 1, df: 5, a: 0, b: 1 };
  const samples = runMonteCarlo('normal', params, 100);
  expect(samples.length).toBe(100);
});

it('binomial samples are integers in [0, n]', () => {
  const params = { mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 1, df: 5, a: 0, b: 1 };
  const samples = runMonteCarlo('binomial', params, 50);
  for (const s of samples) {
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
    expect(Number.isInteger(s)).toBe(true);
  }
});

it('exponential samples are non-negative', () => {
  const params = { mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 2, df: 5, a: 0, b: 1 };
  const samples = runMonteCarlo('exponential', params, 100);
  for (const s of samples) expect(s).toBeGreaterThanOrEqual(0);
});

// ─── useDistribution hook ─────────────────────────────────────────────────────

it('default type is normal', () => {
  const { result } = renderHook(() => useDistribution());
  expect(result.current.state.activeType).toBe('normal');
});

it('setType changes distribution type', () => {
  const { result } = renderHook(() => useDistribution());
  act(() => result.current.setType('poisson'));
  expect(result.current.state.activeType).toBe('poisson');
});

it('setParam updates parameter', () => {
  const { result } = renderHook(() => useDistribution());
  act(() => result.current.setParam('mu', 2));
  expect(result.current.state.params.mu).toBe(2);
});

it('setTailMode updates tail mode', () => {
  const { result } = renderHook(() => useDistribution());
  act(() => result.current.setTailMode('right'));
  expect(result.current.state.tailMode).toBe('right');
});

it('setTailThreshold updates threshold', () => {
  const { result } = renderHook(() => useDistribution());
  act(() => result.current.setTailThreshold(2.5));
  expect(result.current.state.tailThreshold).toBe(2.5);
});

it('toggleMonteCarlo flips showMonteCarlo', () => {
  const { result } = renderHook(() => useDistribution());
  expect(result.current.state.showMonteCarlo).toBe(false);
  act(() => result.current.toggleMonteCarlo());
  expect(result.current.state.showMonteCarlo).toBe(true);
});

it('addOverlay increases overlays count', () => {
  const { result } = renderHook(() => useDistribution());
  expect(result.current.overlays.length).toBe(0);
  act(() => result.current.addOverlay());
  expect(result.current.overlays.length).toBe(1);
});

it('removeOverlay decreases overlays count', () => {
  const { result } = renderHook(() => useDistribution());
  act(() => result.current.addOverlay());
  const id = result.current.overlays[0].id;
  act(() => result.current.removeOverlay(id));
  expect(result.current.overlays.length).toBe(0);
});

it('getMonteCarloSamples returns array of correct size', () => {
  const { result } = renderHook(() => useDistribution());
  act(() => result.current.setMonteCarloN(50));
  const samples = result.current.getMonteCarloSamples();
  expect(samples.length).toBe(50);
});
