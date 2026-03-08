import { useRef, useEffect, useCallback, useState } from 'react';
import { useDistribution } from '../hooks/useDistribution';
import {
  sampleDistribution,
  sampleDiscrete,
  getXRange,
  pdfNormal,
  pdfT,
  pdfChiSquared,
  pdfUniform,
  pdfExponential,
  pmfBinomial,
  pmfPoisson,
} from '../hooks/useDistribution';
import type { DistributionType, DistributionParams, TailShadeMode } from '../types/calculator';

// ─── Canvas drawing ────────────────────────────────────────────────────────────

function evalPdf(type: DistributionType, params: DistributionParams, x: number): number {
  switch (type) {
    case 'normal': return pdfNormal(x, params.mu, params.sigma);
    case 't': return pdfT(x, params.df);
    case 'chi-squared': return pdfChiSquared(x, params.df);
    case 'uniform': return pdfUniform(x, params.a, params.b);
    case 'exponential': return pdfExponential(x, params.lambda);
    case 'binomial': return pmfBinomial(Math.round(x), params.n, params.p);
    case 'poisson': return pmfPoisson(Math.round(x), params.lambda);
  }
}

function drawDistributionCanvas(
  ctx: CanvasRenderingContext2D,
  type: DistributionType,
  params: DistributionParams,
  tailMode: TailShadeMode,
  tailThreshold: number,
  overlays: Array<{ type: DistributionType; params: DistributionParams; color: string }>,
  mcSamples: number[] | null,
  w: number,
  h: number,
) {
  const pad = { left: 40, right: 10, top: 10, bottom: 30 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const [xMin, xMax] = getXRange(type, params);
  const isDiscrete = type === 'binomial' || type === 'poisson';

  // Collect all y values to find yMax
  const allPts = isDiscrete
    ? sampleDiscrete(type as 'binomial' | 'poisson', params, Math.round(xMax))
    : sampleDistribution(type, params, xMin, xMax);

  let yMax = Math.max(...allPts.map(p => p.y), 0.01);

  // Also consider overlays
  for (const ov of overlays) {
    const [ox1, ox2] = getXRange(ov.type, ov.params);
    const ovPts = ov.type === 'binomial' || ov.type === 'poisson'
      ? sampleDiscrete(ov.type as 'binomial' | 'poisson', ov.params, Math.round(ox2))
      : sampleDistribution(ov.type, ov.params, ox1, ox2);
    const ovMax = Math.max(...ovPts.map(p => p.y));
    if (ovMax > yMax) yMax = ovMax;
  }

  const toX = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const toY = (y: number) => pad.top + plotH - (y / yMax) * plotH;

  // Background
  ctx.fillStyle = '#0d1b2e';
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = '#223';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * plotH;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y); ctx.stroke();
  }

  // Monte Carlo histogram
  if (mcSamples && mcSamples.length > 0) {
    const binCount = 30;
    const binW = (xMax - xMin) / binCount;
    const hist = new Array(binCount).fill(0);
    for (const s of mcSamples) {
      const idx = Math.floor((s - xMin) / binW);
      if (idx >= 0 && idx < binCount) hist[idx]++;
    }
    const histMax = Math.max(...hist);
    const scale = yMax / (histMax / (mcSamples.length * binW));
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
    for (let i = 0; i < binCount; i++) {
      const bx = toX(xMin + i * binW);
      const bw = (binW / (xMax - xMin)) * plotW;
      const bh = (hist[i] / (mcSamples.length * binW)) * scale / yMax * plotH;
      ctx.fillRect(bx, pad.top + plotH - bh, bw, bh);
    }
  }

  // Tail shading
  if (tailMode !== 'none') {
    ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
    if (tailMode === 'left' || tailMode === 'two-tailed') {
      const x1 = toX(xMin), x2 = toX(tailThreshold);
      ctx.beginPath();
      ctx.moveTo(x1, toY(0));
      for (let i = 0; i <= 100; i++) {
        const x = xMin + (i / 100) * (tailThreshold - xMin);
        ctx.lineTo(toX(x), toY(evalPdf(type, params, x)));
      }
      ctx.lineTo(x2, toY(0));
      ctx.closePath();
      ctx.fill();
    }
    if (tailMode === 'right' || tailMode === 'two-tailed') {
      const x1 = toX(tailThreshold), x2 = toX(xMax);
      ctx.beginPath();
      ctx.moveTo(x1, toY(0));
      for (let i = 0; i <= 100; i++) {
        const x = tailThreshold + (i / 100) * (xMax - tailThreshold);
        ctx.lineTo(toX(x), toY(evalPdf(type, params, x)));
      }
      ctx.lineTo(x2, toY(0));
      ctx.closePath();
      ctx.fill();
    }
  }

  // Draw overlays
  for (const ov of overlays) {
    const [ox1, ox2] = getXRange(ov.type, ov.params);
    const ovIsDiscrete = ov.type === 'binomial' || ov.type === 'poisson';
    ctx.strokeStyle = ov.color;
    ctx.lineWidth = 1.5;
    if (ovIsDiscrete) {
      const pts = sampleDiscrete(ov.type as 'binomial' | 'poisson', ov.params, Math.round(ox2));
      for (const pt of pts) {
        const bx = toX(Math.max(xMin, pt.x));
        ctx.beginPath(); ctx.moveTo(bx, toY(0)); ctx.lineTo(bx, toY(pt.y)); ctx.stroke();
      }
    } else {
      const pts = sampleDistribution(ov.type, ov.params, Math.max(xMin, ox1), Math.min(xMax, ox2));
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const { x, y } = pts[i];
        i === 0 ? ctx.moveTo(toX(x), toY(y)) : ctx.lineTo(toX(x), toY(y));
      }
      ctx.stroke();
    }
  }

  // Main distribution curve
  ctx.strokeStyle = '#f39c12';
  ctx.lineWidth = 2;
  if (isDiscrete) {
    const pts = allPts;
    for (const pt of pts) {
      const bx = toX(pt.x);
      ctx.beginPath();
      ctx.moveTo(bx, toY(0));
      ctx.lineTo(bx, toY(pt.y));
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    for (let i = 0; i < allPts.length; i++) {
      const { x, y } = allPts[i];
      i === 0 ? ctx.moveTo(toX(x), toY(y)) : ctx.lineTo(toX(x), toY(y));
    }
    ctx.stroke();
  }

  // Threshold line
  if (tailMode !== 'none') {
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(tailThreshold), pad.top);
    ctx.lineTo(toX(tailThreshold), pad.top + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#e74c3c';
    ctx.font = '11px monospace';
    ctx.fillText(`x=${tailThreshold.toFixed(2)}`, toX(tailThreshold) + 4, pad.top + 14);
  }

  // Axes
  ctx.strokeStyle = '#445';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top + plotH); ctx.lineTo(w - pad.right, pad.top + plotH); ctx.stroke();

  // X axis labels
  ctx.fillStyle = '#889';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 4; i++) {
    const x = xMin + (i / 4) * (xMax - xMin);
    ctx.fillText(x.toFixed(1), toX(x), h - 4);
  }

  // Y axis labels
  ctx.textAlign = 'right';
  for (let i = 0; i <= 2; i++) {
    const y = (i / 2) * yMax;
    ctx.fillText(y.toFixed(3), pad.left - 4, toY(y) + 4);
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

const DIST_TYPES: { id: DistributionType; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 't', label: 'Student-t' },
  { id: 'chi-squared', label: 'Chi²' },
  { id: 'binomial', label: 'Binomial' },
  { id: 'poisson', label: 'Poisson' },
  { id: 'exponential', label: 'Exponential' },
  { id: 'uniform', label: 'Uniform' },
];

const TAIL_MODES: { id: TailShadeMode; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'left', label: 'Left tail' },
  { id: 'right', label: 'Right tail' },
  { id: 'two-tailed', label: 'Two-tailed' },
];

export function DistributionExplorer() {
  const {
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
    overlays,
  } = useDistribution();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mcSamples, setMcSamples] = useState<number[] | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawDistributionCanvas(
      ctx,
      state.activeType,
      state.params,
      state.tailMode,
      state.tailThreshold,
      overlays,
      state.showMonteCarlo ? mcSamples : null,
      canvas.width,
      canvas.height,
    );
  }, [state, overlays, mcSamples]);

  useEffect(() => { draw(); }, [draw]);

  const handleRunMC = useCallback(() => {
    const samples = getMonteCarloSamples();
    setMcSamples(samples);
  }, [getMonteCarloSamples]);

  const { activeType, params, tailMode, tailThreshold, showMonteCarlo, monteCarloN } = state;
  const showNormal = activeType === 'normal';
  const showT = activeType === 't';
  const showChi = activeType === 'chi-squared';
  const showBinom = activeType === 'binomial';
  const showPoisson = activeType === 'poisson';
  const showExp = activeType === 'exponential';
  const showUniform = activeType === 'uniform';

  return (
    <div className="distribution">
      <div className="distribution__controls">
        <div className="distribution__row">
          {DIST_TYPES.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${activeType === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setType(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="distribution__params">
          {(showNormal) && (
            <>
              <label className="distribution__param-label">μ: {params.mu.toFixed(1)}
                <input type="range" min={-5} max={5} step={0.1} value={params.mu}
                  onChange={e => setParam('mu', Number(e.target.value))}
                  aria-label="mu" className="fourier__slider" />
              </label>
              <label className="distribution__param-label">σ: {params.sigma.toFixed(1)}
                <input type="range" min={0.1} max={5} step={0.1} value={params.sigma}
                  onChange={e => setParam('sigma', Number(e.target.value))}
                  aria-label="sigma" className="fourier__slider" />
              </label>
            </>
          )}
          {(showT || showChi) && (
            <label className="distribution__param-label">df: {params.df}
              <input type="range" min={1} max={30} step={1} value={params.df}
                onChange={e => setParam('df', Number(e.target.value))}
                aria-label="df" className="fourier__slider" />
            </label>
          )}
          {showBinom && (
            <>
              <label className="distribution__param-label">n: {params.n}
                <input type="range" min={1} max={50} step={1} value={params.n}
                  onChange={e => setParam('n', Number(e.target.value))}
                  aria-label="n" className="fourier__slider" />
              </label>
              <label className="distribution__param-label">p: {params.p.toFixed(2)}
                <input type="range" min={0} max={1} step={0.01} value={params.p}
                  onChange={e => setParam('p', Number(e.target.value))}
                  aria-label="p" className="fourier__slider" />
              </label>
            </>
          )}
          {(showPoisson || showExp) && (
            <label className="distribution__param-label">λ: {params.lambda.toFixed(1)}
              <input type="range" min={0.1} max={10} step={0.1} value={params.lambda}
                onChange={e => setParam('lambda', Number(e.target.value))}
                aria-label="lambda" className="fourier__slider" />
            </label>
          )}
          {showUniform && (
            <>
              <label className="distribution__param-label">a: {params.a.toFixed(1)}
                <input type="range" min={-5} max={0} step={0.1} value={params.a}
                  onChange={e => setParam('a', Number(e.target.value))}
                  aria-label="a" className="fourier__slider" />
              </label>
              <label className="distribution__param-label">b: {params.b.toFixed(1)}
                <input type="range" min={0} max={5} step={0.1} value={params.b}
                  onChange={e => setParam('b', Number(e.target.value))}
                  aria-label="b" className="fourier__slider" />
              </label>
            </>
          )}
        </div>

        <div className="distribution__row">
          <span className="fourier__label">Tail:</span>
          {TAIL_MODES.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${tailMode === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setTailMode(id)}
            >
              {label}
            </button>
          ))}
          {tailMode !== 'none' && (
            <label className="distribution__param-label">
              x={tailThreshold.toFixed(2)}
              <input type="range" min={-5} max={5} step={0.01} value={tailThreshold}
                onChange={e => setTailThreshold(Number(e.target.value))}
                aria-label="tail threshold" className="fourier__slider" />
            </label>
          )}
        </div>

        <div className="distribution__row">
          <button className="grapher__btn" onClick={addOverlay}>+ Overlay</button>
          {overlays.map(ov => (
            <span key={ov.id} className="distribution__overlay-chip" style={{ borderColor: ov.color }}>
              <span style={{ color: ov.color }}>{ov.type}</span>
              <button className="distribution__overlay-remove" onClick={() => removeOverlay(ov.id)} aria-label={`Remove overlay ${ov.id}`}>×</button>
            </span>
          ))}
        </div>

        <div className="distribution__row">
          <button className={`grapher__btn ${showMonteCarlo ? 'grapher__btn--active' : ''}`} onClick={toggleMonteCarlo}>
            Monte Carlo
          </button>
          {showMonteCarlo && (
            <>
              <label className="distribution__param-label">N: {monteCarloN}
                <input type="range" min={100} max={10000} step={100} value={monteCarloN}
                  onChange={e => setMonteCarloN(Number(e.target.value))}
                  aria-label="Monte Carlo N" className="fourier__slider" />
              </label>
              <button className="grapher__btn" onClick={handleRunMC}>Run Simulation</button>
            </>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={580}
        height={320}
        className="fourier__canvas"
        aria-label="distribution plot"
      />
    </div>
  );
}
