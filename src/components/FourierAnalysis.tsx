import { useRef, useEffect, useCallback } from 'react';
import { useFourier } from '../hooks/useFourier';
import type { SignalPreset, WindowFunction } from '../types/calculator';
import type { DFTBin } from '../hooks/useFourier';

// ─── Canvas drawing helpers ────────────────────────────────────────────────────

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  samples: Float64Array,
  color: string,
  w: number,
  h: number,
  label: string,
) {
  const N = samples.length;
  let yMin = Infinity, yMax = -Infinity;
  for (const v of samples) {
    if (isFinite(v)) { yMin = Math.min(yMin, v); yMax = Math.max(yMax, v); }
  }
  if (!isFinite(yMin)) { yMin = -1; yMax = 1; }
  const yRange = yMax - yMin || 1;
  const pad = 20;

  ctx.fillStyle = '#0d1b2e';
  ctx.fillRect(0, 0, w, h);

  // Draw zero line
  const zeroY = pad + ((yMax / yRange)) * (h - 2 * pad);
  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, zeroY);
  ctx.lineTo(w, zeroY);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * w;
    const y = pad + ((yMax - samples[i]) / yRange) * (h - 2 * pad);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#99a';
  ctx.font = '11px monospace';
  ctx.fillText(label, 6, 14);
}

function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  bins: DFTBin[],
  showPhase: boolean,
  w: number,
  h: number,
  highlightIndices: number[],
) {
  const halfN = Math.floor(bins.length / 2);
  const displayBins = bins.slice(0, halfN);

  const highlight = new Set(highlightIndices);
  const amps = displayBins.map(b => b.amplitude);
  const maxAmp = Math.max(...amps, 1e-10);
  const pad = 20;
  const barW = (w / halfN) * 0.8;

  ctx.fillStyle = '#0d1b2e';
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < displayBins.length; i++) {
    const x = (i / halfN) * w;
    const val = showPhase
      ? (displayBins[i].phase / Math.PI + 1) / 2
      : displayBins[i].amplitude / maxAmp;
    const barH = val * (h - 2 * pad);
    const isSelected = highlight.has(i);
    ctx.fillStyle = isSelected ? '#f39c12' : '#3498db';
    ctx.fillRect(x, h - pad - barH, barW, barH);
  }

  ctx.fillStyle = '#99a';
  ctx.font = '11px monospace';
  ctx.fillText(showPhase ? 'Phase Spectrum' : 'Amplitude Spectrum', 6, 14);
}

// ─── Component ─────────────────────────────────────────────────────────────────

const PRESETS: { id: SignalPreset; label: string }[] = [
  { id: 'sine', label: 'Sine' },
  { id: 'square', label: 'Square' },
  { id: 'sawtooth', label: 'Sawtooth' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'custom', label: 'Custom' },
];

const WINDOWS: { id: WindowFunction; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'hann', label: 'Hann' },
  { id: 'hamming', label: 'Hamming' },
  { id: 'blackman', label: 'Blackman' },
];

export function FourierAnalysis() {
  const {
    state,
    setPreset,
    setCustomExpression,
    setFrequency,
    setWindowFn,
    toggleHarmonic,
    setSelectedHarmonics,
    toggleShowPhase,
    getSignal,
    getSpectrum,
    getReconstructed,
  } = useFourier();

  const signalRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const reconRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const signal = getSignal();
    const spectrum = getSpectrum();
    const reconstructed = getReconstructed();

    const W = 560, H = 120;

    if (signalRef.current) {
      const ctx = signalRef.current.getContext('2d');
      if (ctx) drawWaveform(ctx, signal, '#3498db', W, H, 'Original Signal');
    }

    if (specRef.current) {
      const ctx = specRef.current.getContext('2d');
      if (ctx) drawSpectrum(ctx, spectrum, state.showPhase, W, H, state.selectedHarmonics);
    }

    if (reconRef.current) {
      const ctx = reconRef.current.getContext('2d');
      if (ctx) drawWaveform(ctx, reconstructed, '#2ecc71', W, H, 'Reconstructed Signal');
    }
  }, [state, getSignal, getSpectrum, getReconstructed]);

  useEffect(() => { draw(); }, [draw]);

  const halfN = Math.floor(state.numPoints / 2);
  const visibleHarmonics = Math.min(halfN, 32);

  return (
    <div className="fourier">
      <div className="fourier__controls">
        <div className="fourier__row">
          <span className="fourier__label">Signal:</span>
          {PRESETS.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${state.signalPreset === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setPreset(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {state.signalPreset === 'custom' && (
          <div className="fourier__row">
            <label htmlFor="fourier-expr" className="fourier__label">f(t) =</label>
            <input
              id="fourier-expr"
              className="grapher__fn-input"
              value={state.customExpression}
              onChange={e => setCustomExpression(e.target.value)}
              placeholder="e.g. sin(2*pi*t) + 0.5*sin(6*pi*t)"
              aria-label="Custom expression"
            />
          </div>
        )}

        <div className="fourier__row">
          <span className="fourier__label">Freq: {state.frequency}</span>
          <input
            type="range" min={1} max={10} step={1}
            value={state.frequency}
            onChange={e => setFrequency(Number(e.target.value))}
            aria-label="Frequency"
            className="fourier__slider"
          />
          <span className="fourier__label">Window:</span>
          {WINDOWS.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${state.windowFn === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setWindowFn(id)}
            >
              {label}
            </button>
          ))}
          <button className="grapher__btn" onClick={toggleShowPhase}>
            {state.showPhase ? 'Show Amplitude' : 'Show Phase'}
          </button>
        </div>

        <div className="fourier__row">
          <span className="fourier__label">Harmonics:</span>
          <button
            className="grapher__btn"
            onClick={() => setSelectedHarmonics(Array.from({ length: visibleHarmonics }, (_, i) => i))}
          >
            All
          </button>
          <button
            className="grapher__btn"
            onClick={() => setSelectedHarmonics([])}
          >
            None
          </button>
        </div>

        <div className="fourier__harmonics">
          {Array.from({ length: visibleHarmonics }, (_, k) => (
            <button
              key={k}
              className={`fourier__harm-btn ${state.selectedHarmonics.includes(k) ? 'fourier__harm-btn--active' : ''}`}
              onClick={() => toggleHarmonic(k)}
              aria-label={`Harmonic ${k}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="fourier__plots">
        <canvas ref={signalRef} width={560} height={120} className="fourier__canvas" aria-label="signal" />
        <canvas ref={specRef} width={560} height={120} className="fourier__canvas" aria-label="spectrum" />
        <canvas ref={reconRef} width={560} height={120} className="fourier__canvas" aria-label="reconstructed" />
      </div>
    </div>
  );
}
