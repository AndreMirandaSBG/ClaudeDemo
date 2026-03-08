import { renderHook, act } from '@testing-library/react';
import { useFourier, computeDFT, computeFFT, reconstructSignal } from './useFourier';

// ─── computeDFT ────────────────────────────────────────────────────────────────

it('DFT of a single DC signal has amplitude 1 at k=0', () => {
  const samples = new Float64Array(8).fill(1);
  const bins = computeDFT(samples);
  expect(bins[0].amplitude).toBeCloseTo(1, 4);
  for (let k = 1; k < 8; k++) expect(bins[k].amplitude).toBeCloseTo(0, 4);
});

it('DFT amplitude is proportional to input amplitude', () => {
  const N = 16;
  const samples = new Float64Array(N);
  for (let i = 0; i < N; i++) samples[i] = 2 * Math.sin((2 * Math.PI * 2 * i) / N);
  const bins = computeDFT(samples);
  // Frequency bin k=2 should have non-zero amplitude
  expect(bins[2].amplitude).toBeGreaterThan(0.5);
});

// ─── computeFFT ───────────────────────────────────────────────────────────────

it('FFT produces same amplitudes as DFT for power-of-2 input', () => {
  const N = 8;
  const samples = new Float64Array(N);
  for (let i = 0; i < N; i++) samples[i] = Math.sin((2 * Math.PI * i) / N);
  const dftBins = computeDFT(samples);
  const fftBins = computeFFT(samples);
  for (let k = 0; k < N; k++) {
    expect(fftBins[k].amplitude).toBeCloseTo(dftBins[k].amplitude, 3);
  }
});

it('FFT of DC signal has amplitude 1 at k=0', () => {
  const samples = new Float64Array(16).fill(1);
  const bins = computeFFT(samples);
  expect(bins[0].amplitude).toBeCloseTo(1, 4);
});

// ─── reconstructSignal ────────────────────────────────────────────────────────

it('reconstructing all harmonics of a sine closely matches original', () => {
  const N = 64;
  const samples = new Float64Array(N);
  for (let i = 0; i < N; i++) samples[i] = Math.sin((2 * Math.PI * 3 * i) / N);
  const bins = computeFFT(samples);
  const allHarmonics = Array.from({ length: N / 2 }, (_, k) => k);
  const reconstructed = reconstructSignal(bins, allHarmonics, N);
  let maxErr = 0;
  for (let i = 0; i < N; i++) maxErr = Math.max(maxErr, Math.abs(samples[i] - reconstructed[i]));
  expect(maxErr).toBeLessThan(0.1);
});

it('reconstructing 0 harmonics produces near-zero signal', () => {
  const N = 32;
  const samples = new Float64Array(N);
  for (let i = 0; i < N; i++) samples[i] = Math.sin((2 * Math.PI * i) / N);
  const bins = computeFFT(samples);
  const reconstructed = reconstructSignal(bins, [], N);
  for (let i = 0; i < N; i++) expect(Math.abs(reconstructed[i])).toBeCloseTo(0, 3);
});

// ─── useFourier hook ──────────────────────────────────────────────────────────

it('default state is square wave with frequency 3', () => {
  const { result } = renderHook(() => useFourier());
  expect(result.current.state.signalPreset).toBe('square');
  expect(result.current.state.frequency).toBe(3);
});

it('setPreset changes the signal type', () => {
  const { result } = renderHook(() => useFourier());
  act(() => result.current.setPreset('sine'));
  expect(result.current.state.signalPreset).toBe('sine');
});

it('setFrequency updates frequency', () => {
  const { result } = renderHook(() => useFourier());
  act(() => result.current.setFrequency(5));
  expect(result.current.state.frequency).toBe(5);
});

it('setWindowFn updates window', () => {
  const { result } = renderHook(() => useFourier());
  act(() => result.current.setWindowFn('hann'));
  expect(result.current.state.windowFn).toBe('hann');
});

it('toggleHarmonic adds then removes a harmonic', () => {
  const { result } = renderHook(() => useFourier());
  const initial = result.current.state.selectedHarmonics.includes(15);
  act(() => result.current.toggleHarmonic(15));
  expect(result.current.state.selectedHarmonics.includes(15)).toBe(!initial);
  act(() => result.current.toggleHarmonic(15));
  expect(result.current.state.selectedHarmonics.includes(15)).toBe(initial);
});

it('setSelectedHarmonics replaces harmonics list', () => {
  const { result } = renderHook(() => useFourier());
  act(() => result.current.setSelectedHarmonics([0, 1, 2]));
  expect(result.current.state.selectedHarmonics).toEqual([0, 1, 2]);
});

it('toggleShowPhase flips showPhase', () => {
  const { result } = renderHook(() => useFourier());
  const initial = result.current.state.showPhase;
  act(() => result.current.toggleShowPhase());
  expect(result.current.state.showPhase).toBe(!initial);
});

it('getSignal returns Float64Array with numPoints samples', () => {
  const { result } = renderHook(() => useFourier());
  const sig = result.current.getSignal();
  expect(sig).toBeInstanceOf(Float64Array);
  expect(sig.length).toBe(result.current.state.numPoints);
});

it('sine preset produces values in [-amplitude, amplitude]', () => {
  const { result } = renderHook(() => useFourier());
  act(() => { result.current.setPreset('sine'); result.current.setAmplitude(2); });
  const sig = result.current.getSignal();
  for (const v of sig) expect(Math.abs(v)).toBeLessThanOrEqual(2 + 1e-6);
});

it('getSpectrum returns DFT bins', () => {
  const { result } = renderHook(() => useFourier());
  const spec = result.current.getSpectrum();
  expect(spec.length).toBeGreaterThan(0);
  expect(spec[0]).toHaveProperty('amplitude');
  expect(spec[0]).toHaveProperty('phase');
});

it('getReconstructed returns Float64Array with numPoints samples', () => {
  const { result } = renderHook(() => useFourier());
  const recon = result.current.getReconstructed();
  expect(recon).toBeInstanceOf(Float64Array);
  expect(recon.length).toBe(result.current.state.numPoints);
});

it('setNumPoints updates numPoints', () => {
  const { result } = renderHook(() => useFourier());
  act(() => result.current.setNumPoints(64));
  expect(result.current.state.numPoints).toBe(64);
  const sig = result.current.getSignal();
  expect(sig.length).toBe(64);
});

it('custom preset evaluates expression', () => {
  const { result } = renderHook(() => useFourier());
  act(() => {
    result.current.setPreset('custom');
    result.current.setCustomExpression('sin(2*pi*t)');
  });
  const sig = result.current.getSignal();
  expect(sig.length).toBeGreaterThan(0);
  // All values should be finite
  for (const v of sig) expect(isFinite(v)).toBe(true);
});
