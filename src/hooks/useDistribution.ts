import { useState, useCallback } from 'react';
import type {
  DistributionState,
  DistributionType,
  DistributionParams,
  TailShadeMode,
  DistributionOverlay,
} from '../types/calculator';

// ─── Math utilities ───────────────────────────────────────────────────────────

function gammaLn(z: number): number {
  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaFn(a: number, b: number): number {
  return Math.exp(gammaLn(a) + gammaLn(b) - gammaLn(a + b));
}

// Regularized incomplete beta function (continued fraction)
function incompleteBeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) return NaN;
  if (x === 0) return 0;
  if (x === 1) return 1;
  if (x < (a + 1) / (a + b + 2)) {
    return betaCF(x, a, b) * Math.exp(a * Math.log(x) + b * Math.log(1 - x) - Math.log(betaFn(a, b))) / a;
  }
  return 1 - betaCF(1 - x, b, a) * Math.exp(b * Math.log(1 - x) + a * Math.log(x) - Math.log(betaFn(a, b))) / b;
}

function betaCF(x: number, a: number, b: number): number {
  const maxIter = 200;
  const eps = 3e-7;
  let h = 1;
  let qm = 0, qp = 1;
  let pm = 1, pp = 1 - (a + b) * x / (a + 1);
  if (Math.abs(pp) < 1e-30) pp = 1e-30;
  let result = 1 / pp;
  h = result;
  for (let m = 1; m <= maxIter; m++) {
    const mm = m;
    let d = mm * (b - mm) * x / ((a + 2 * mm - 1) * (a + 2 * mm));
    let p1 = pp + d * pm;
    let q1 = qp + d * qm;
    if (Math.abs(p1) < 1e-30) p1 = 1e-30;
    if (Math.abs(q1) < 1e-30) q1 = 1e-30;
    pm = pp; pp = p1; qm = qp; qp = q1;
    d = -(a + mm) * (a + b + mm) * x / ((a + 2 * mm) * (a + 2 * mm + 1));
    p1 = pp + d * pm;
    q1 = qp + d * qm;
    if (Math.abs(p1) < 1e-30) p1 = 1e-30;
    if (Math.abs(q1) < 1e-30) q1 = 1e-30;
    pm = pp; pp = p1; qm = qp; qp = q1;
    const delta = pp / qp;
    result *= delta;
    if (Math.abs(delta - 1) < eps) break;
    h = result;
  }
  return h;
}


function incompleteGammaLower(a: number, x: number): number {
  // Series expansion
  if (x < 0) return 0;
  let sum = 1 / a;
  let term = 1 / a;
  for (let n = 1; n < 200; n++) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return Math.exp(-x + a * Math.log(x) - gammaLn(a)) * sum;
}

// Normal CDF
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const e = 1 - poly * Math.exp(-x * x);
  return x >= 0 ? e : -e;
}

// ─── PDF/PMF functions ────────────────────────────────────────────────────────

export function pdfNormal(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

export function pdfT(x: number, df: number): number {
  if (df <= 0) return 0;
  const num = gammaLn((df + 1) / 2);
  const den = 0.5 * Math.log(df * Math.PI) + gammaLn(df / 2);
  return Math.exp(num - den - ((df + 1) / 2) * Math.log(1 + (x * x) / df));
}

export function pdfChiSquared(x: number, df: number): number {
  if (x <= 0 || df <= 0) return 0;
  const k = df / 2;
  return Math.exp((k - 1) * Math.log(x) - x / 2 - k * Math.log(2) - gammaLn(k));
}

export function pdfUniform(x: number, a: number, b: number): number {
  if (b <= a) return 0;
  return x >= a && x <= b ? 1 / (b - a) : 0;
}

export function pdfExponential(x: number, lambda: number): number {
  if (lambda <= 0 || x < 0) return 0;
  return lambda * Math.exp(-lambda * x);
}

export function pmfBinomial(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  const logC = gammaLn(n + 1) - gammaLn(k + 1) - gammaLn(n - k + 1);
  const logP = k * Math.log(Math.max(p, 1e-300)) + (n - k) * Math.log(Math.max(1 - p, 1e-300));
  return Math.exp(logC + logP);
}

export function pmfPoisson(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k) || lambda <= 0) return 0;
  return Math.exp(k * Math.log(lambda) - lambda - gammaLn(k + 1));
}

// ─── CDF functions ────────────────────────────────────────────────────────────

export function cdfNormal(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  return normalCDF((x - mu) / sigma);
}

export function cdfT(x: number, df: number): number {
  const p = incompleteBeta(df / (df + x * x), df / 2, 0.5) / 2;
  return x >= 0 ? 1 - p : p;
}

export function cdfChiSquared(x: number, df: number): number {
  if (x <= 0) return 0;
  return incompleteGammaLower(df / 2, x / 2);
}

export function cdfExponential(x: number, lambda: number): number {
  if (x < 0) return 0;
  return 1 - Math.exp(-lambda * x);
}

// ─── Distribution sampling (for Monte Carlo) ──────────────────────────────────

function boxMullerNormal(mu: number, sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-300))) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}

function sampleBinomial(n: number, p: number): number {
  let k = 0;
  for (let i = 0; i < n; i++) if (Math.random() < p) k++;
  return k;
}

function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let prob = 1;
  do {
    k++;
    prob *= Math.random();
  } while (prob > L);
  return k - 1;
}

function sampleChiSquared(df: number): number {
  let sum = 0;
  for (let i = 0; i < df; i++) {
    const z = boxMullerNormal(0, 1);
    sum += z * z;
  }
  return sum;
}

function sampleT(df: number): number {
  const z = boxMullerNormal(0, 1);
  const chi2 = sampleChiSquared(df);
  return z / Math.sqrt(chi2 / df);
}

function sampleExponential(lambda: number): number {
  return -Math.log(Math.max(Math.random(), 1e-300)) / lambda;
}

function sampleUniform(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export function runMonteCarlo(
  type: DistributionType,
  params: DistributionParams,
  n: number,
): number[] {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    switch (type) {
      case 'normal': samples.push(boxMullerNormal(params.mu, params.sigma)); break;
      case 'binomial': samples.push(sampleBinomial(params.n, params.p)); break;
      case 'poisson': samples.push(samplePoisson(params.lambda)); break;
      case 'chi-squared': samples.push(sampleChiSquared(Math.max(1, Math.round(params.df)))); break;
      case 't': samples.push(sampleT(Math.max(1, Math.round(params.df)))); break;
      case 'exponential': samples.push(sampleExponential(params.lambda)); break;
      case 'uniform': samples.push(sampleUniform(params.a, params.b)); break;
    }
  }
  return samples;
}

// ─── Evaluation helpers ────────────────────────────────────────────────────────

export type PlotPoint = { x: number; y: number };

export function sampleDistribution(
  type: DistributionType,
  params: DistributionParams,
  xMin: number,
  xMax: number,
  nPts = 200,
): PlotPoint[] {
  const pts: PlotPoint[] = [];
  const step = (xMax - xMin) / (nPts - 1);
  for (let i = 0; i < nPts; i++) {
    const x = xMin + i * step;
    let y = 0;
    switch (type) {
      case 'normal': y = pdfNormal(x, params.mu, params.sigma); break;
      case 't': y = pdfT(x, params.df); break;
      case 'chi-squared': y = pdfChiSquared(x, params.df); break;
      case 'uniform': y = pdfUniform(x, params.a, params.b); break;
      case 'exponential': y = pdfExponential(x, params.lambda); break;
      default: y = 0;
    }
    pts.push({ x, y });
  }
  return pts;
}

export function sampleDiscrete(
  type: 'binomial' | 'poisson',
  params: DistributionParams,
  kMax: number,
): PlotPoint[] {
  const pts: PlotPoint[] = [];
  for (let k = 0; k <= kMax; k++) {
    let y = 0;
    if (type === 'binomial') y = pmfBinomial(k, params.n, params.p);
    if (type === 'poisson') y = pmfPoisson(k, params.lambda);
    pts.push({ x: k, y });
  }
  return pts;
}

export function getXRange(type: DistributionType, params: DistributionParams): [number, number] {
  switch (type) {
    case 'normal': return [params.mu - 4 * params.sigma, params.mu + 4 * params.sigma];
    case 't': return [-6, 6];
    case 'chi-squared': return [0, Math.max(params.df * 3, 1)];
    case 'uniform': return [params.a - 0.5, params.b + 0.5];
    case 'exponential': return [0, 5 / Math.max(params.lambda, 0.01)];
    case 'binomial': return [0, params.n];
    case 'poisson': return [0, Math.max(params.lambda * 3, 1)];
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_PARAMS: DistributionParams = {
  mu: 0, sigma: 1, n: 10, p: 0.5, lambda: 2, df: 5, a: 0, b: 1,
};

const DEFAULT_STATE: DistributionState = {
  activeType: 'normal',
  params: DEFAULT_PARAMS,
  tailMode: 'none',
  tailThreshold: 1.96,
  showMonteCarlo: false,
  monteCarloN: 1000,
  overlays: [],
};

let _overlayId = 1;

export interface DistributionHookResult {
  state: DistributionState;
  setType: (t: DistributionType) => void;
  setParam: (key: keyof DistributionParams, value: number) => void;
  setTailMode: (m: TailShadeMode) => void;
  setTailThreshold: (v: number) => void;
  toggleMonteCarlo: () => void;
  setMonteCarloN: (n: number) => void;
  addOverlay: () => void;
  removeOverlay: (id: number) => void;
  getMonteCarloSamples: () => number[];
  overlays: DistributionOverlay[];
}

const OVERLAY_COLORS = ['#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

export function useDistribution(): DistributionHookResult {
  const [state, setState] = useState<DistributionState>(DEFAULT_STATE);

  const setType = useCallback((activeType: DistributionType) => {
    setState(s => ({ ...s, activeType }));
  }, []);

  const setParam = useCallback((key: keyof DistributionParams, value: number) => {
    setState(s => ({ ...s, params: { ...s.params, [key]: value } }));
  }, []);

  const setTailMode = useCallback((tailMode: TailShadeMode) => {
    setState(s => ({ ...s, tailMode }));
  }, []);

  const setTailThreshold = useCallback((tailThreshold: number) => {
    setState(s => ({ ...s, tailThreshold }));
  }, []);

  const toggleMonteCarlo = useCallback(() => {
    setState(s => ({ ...s, showMonteCarlo: !s.showMonteCarlo }));
  }, []);

  const setMonteCarloN = useCallback((monteCarloN: number) => {
    setState(s => ({ ...s, monteCarloN }));
  }, []);

  const addOverlay = useCallback(() => {
    setState(s => ({
      ...s,
      overlays: [
        ...s.overlays,
        {
          id: _overlayId++,
          type: s.activeType,
          params: { ...s.params },
          color: OVERLAY_COLORS[s.overlays.length % OVERLAY_COLORS.length],
        },
      ],
    }));
  }, []);

  const removeOverlay = useCallback((id: number) => {
    setState(s => ({ ...s, overlays: s.overlays.filter(o => o.id !== id) }));
  }, []);

  const getMonteCarloSamples = useCallback((): number[] => {
    return runMonteCarlo(state.activeType, state.params, state.monteCarloN);
  }, [state.activeType, state.params, state.monteCarloN]);

  return {
    state,
    setType,
    setParam,
    setTailMode,
    setTailThreshold,
    toggleMonteCarlo,
    setMonteCarloN,
    addOverlay,
    removeOverlay,
    getMonteCarloSamples,
    overlays: state.overlays,
  };
}
