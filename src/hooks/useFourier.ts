import { useState, useCallback } from 'react';
import type { FourierState, SignalPreset, WindowFunction } from '../types/calculator';

// ─── Signal generation ────────────────────────────────────────────────────────

function generateSignal(preset: SignalPreset, customExpr: string, N: number, freq: number, amp: number): Float64Array {
  const samples = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const phase = 2 * Math.PI * freq * t;
    switch (preset) {
      case 'sine':
        samples[i] = amp * Math.sin(phase);
        break;
      case 'square':
        samples[i] = amp * Math.sign(Math.sin(phase));
        break;
      case 'sawtooth':
        samples[i] = amp * (2 * ((freq * t) % 1) - 1);
        break;
      case 'triangle': {
        const saw = (freq * t) % 1;
        samples[i] = amp * (4 * Math.abs(saw - 0.5) - 1);
        break;
      }
      case 'custom': {
        try {
          samples[i] = evalSignalExpr(customExpr, t);
        } catch {
          samples[i] = 0;
        }
        break;
      }
    }
  }
  return samples;
}

function evalSignalExpr(expr: string, t: number): number {
  // Simple safe evaluator for t-based expressions
  const sanitized = expr
    .replace(/\bsin\b/g, 'Math.sin')
    .replace(/\bcos\b/g, 'Math.cos')
    .replace(/\btan\b/g, 'Math.tan')
    .replace(/\bsqrt\b/g, 'Math.sqrt')
    .replace(/\babs\b/g, 'Math.abs')
    .replace(/\bexp\b/g, 'Math.exp')
    .replace(/\bpi\b/g, String(Math.PI))
    .replace(/\bPI\b/g, String(Math.PI))
    .replace(/\be\b/g, String(Math.E));
  // eslint-disable-next-line no-new-func
  return new Function('t', `"use strict"; return (${sanitized})`)(t) as number;
}

// ─── Window functions ─────────────────────────────────────────────────────────

function applyWindow(samples: Float64Array, win: WindowFunction): Float64Array {
  const N = samples.length;
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let w = 1;
    switch (win) {
      case 'hann':
        w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
        break;
      case 'hamming':
        w = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
        break;
      case 'blackman':
        w = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1))
          + 0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
        break;
      default:
        w = 1;
    }
    out[i] = samples[i] * w;
  }
  return out;
}

// ─── DFT ──────────────────────────────────────────────────────────────────────

export interface DFTBin {
  k: number;
  re: number;
  im: number;
  amplitude: number;
  phase: number;
}

export function computeDFT(samples: Float64Array): DFTBin[] {
  const N = samples.length;
  const bins: DFTBin[] = [];
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += samples[n] * Math.cos(angle);
      im -= samples[n] * Math.sin(angle);
    }
    bins.push({
      k,
      re: re / N,
      im: im / N,
      amplitude: Math.sqrt(re * re + im * im) / N,
      phase: Math.atan2(im, re),
    });
  }
  return bins;
}

// ─── FFT (Cooley-Tukey radix-2) ───────────────────────────────────────────────

export function computeFFT(input: Float64Array): DFTBin[] {
  const N = input.length;
  // Pad to next power of 2
  const len = nextPow2(N);
  const re = new Float64Array(len);
  const im = new Float64Array(len);
  for (let i = 0; i < N; i++) re[i] = input[i];

  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < len; i++) {
    let bit = len >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // FFT butterfly
  for (let size = 2; size <= len; size <<= 1) {
    const halfSize = size >> 1;
    const step = (2 * Math.PI) / size;
    for (let start = 0; start < len; start += size) {
      for (let k = 0; k < halfSize; k++) {
        const angle = -step * k;
        const wr = Math.cos(angle);
        const wi = Math.sin(angle);
        const ur = re[start + k + halfSize] * wr - im[start + k + halfSize] * wi;
        const ui = re[start + k + halfSize] * wi + im[start + k + halfSize] * wr;
        re[start + k + halfSize] = re[start + k] - ur;
        im[start + k + halfSize] = im[start + k] - ui;
        re[start + k] += ur;
        im[start + k] += ui;
      }
    }
  }

  const bins: DFTBin[] = [];
  for (let k = 0; k < len; k++) {
    const r = re[k] / len;
    const i2 = im[k] / len;
    bins.push({
      k,
      re: r,
      im: i2,
      amplitude: Math.sqrt(r * r + i2 * i2),
      phase: Math.atan2(i2, r),
    });
  }
  return bins;
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// ─── Signal reconstruction ────────────────────────────────────────────────────

export function reconstructSignal(bins: DFTBin[], selectedHarmonics: number[], N: number): Float64Array {
  const out = new Float64Array(N);
  for (const k of selectedHarmonics) {
    if (k >= bins.length) continue;
    const { re, im } = bins[k];
    const scale = k === 0 ? 1 : 2; // account for negative frequencies
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      out[n] += scale * (re * Math.cos(angle) - im * Math.sin(angle));
    }
  }
  return out;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_STATE: FourierState = {
  signalPreset: 'square',
  customExpression: 'sin(2*pi*t) + 0.5*sin(6*pi*t)',
  numPoints: 128,
  frequency: 3,
  amplitude: 1,
  windowFn: 'none',
  selectedHarmonics: [0, 1, 2, 3, 4, 5, 6, 7],
  showPhase: false,
};

export interface FourierHookResult {
  state: FourierState;
  setPreset: (preset: SignalPreset) => void;
  setCustomExpression: (expr: string) => void;
  setNumPoints: (n: number) => void;
  setFrequency: (f: number) => void;
  setAmplitude: (a: number) => void;
  setWindowFn: (w: WindowFunction) => void;
  toggleHarmonic: (k: number) => void;
  setSelectedHarmonics: (ks: number[]) => void;
  toggleShowPhase: () => void;
  getSignal: () => Float64Array;
  getSpectrum: () => DFTBin[];
  getReconstructed: () => Float64Array;
}

export function useFourier(): FourierHookResult {
  const [state, setState] = useState<FourierState>(DEFAULT_STATE);

  const setPreset = useCallback((signalPreset: SignalPreset) => setState(s => ({ ...s, signalPreset })), []);
  const setCustomExpression = useCallback((customExpression: string) => setState(s => ({ ...s, customExpression })), []);
  const setNumPoints = useCallback((numPoints: number) => setState(s => ({ ...s, numPoints })), []);
  const setFrequency = useCallback((frequency: number) => setState(s => ({ ...s, frequency })), []);
  const setAmplitude = useCallback((amplitude: number) => setState(s => ({ ...s, amplitude })), []);
  const setWindowFn = useCallback((windowFn: WindowFunction) => setState(s => ({ ...s, windowFn })), []);

  const toggleHarmonic = useCallback((k: number) => {
    setState(s => {
      const selected = s.selectedHarmonics;
      const idx = selected.indexOf(k);
      return {
        ...s,
        selectedHarmonics: idx >= 0
          ? selected.filter(h => h !== k)
          : [...selected, k].sort((a, b) => a - b),
      };
    });
  }, []);

  const setSelectedHarmonics = useCallback((selectedHarmonics: number[]) => {
    setState(s => ({ ...s, selectedHarmonics }));
  }, []);

  const toggleShowPhase = useCallback(() => {
    setState(s => ({ ...s, showPhase: !s.showPhase }));
  }, []);

  const getSignal = useCallback((): Float64Array => {
    return generateSignal(state.signalPreset, state.customExpression, state.numPoints, state.frequency, state.amplitude);
  }, [state]);

  const getSpectrum = useCallback((): DFTBin[] => {
    const raw = generateSignal(state.signalPreset, state.customExpression, state.numPoints, state.frequency, state.amplitude);
    const windowed = applyWindow(raw, state.windowFn);
    return computeFFT(windowed);
  }, [state]);

  const getReconstructed = useCallback((): Float64Array => {
    const bins = getSpectrum();
    return reconstructSignal(bins, state.selectedHarmonics, state.numPoints);
  }, [getSpectrum, state.selectedHarmonics, state.numPoints]);

  return {
    state,
    setPreset,
    setCustomExpression,
    setNumPoints,
    setFrequency,
    setAmplitude,
    setWindowFn,
    toggleHarmonic,
    setSelectedHarmonics,
    toggleShowPhase,
    getSignal,
    getSpectrum,
    getReconstructed,
  };
}
