import { useEffect, useRef } from 'react';
import { useTimeSeries } from '../hooks/useTimeSeries';
import type { TimeSeriesMode } from '../types/calculator';

const MODES: { id: TimeSeriesMode; label: string }[] = [
  { id: 'data', label: 'Data' },
  { id: 'decompose', label: 'Decompose' },
  { id: 'acf', label: 'ACF/PACF' },
  { id: 'forecast', label: 'Forecast' },
];

const PAD = { t: 15, r: 15, b: 30, l: 50 };

function drawLine(ctx: CanvasRenderingContext2D, vals: (number | null)[], color: string, xMin: number, xMax: number, yMin: number, yMax: number, W: number, H: number, dashed = false) {
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const toX = (t: number) => PAD.l + ((t - xMin) / xRange) * (W - PAD.l - PAD.r);
  const toY = (v: number) => PAD.t + (1 - (v - yMin) / yRange) * (H - PAD.t - PAD.b);

  ctx.beginPath();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  if (dashed) ctx.setLineDash([5, 3]); else ctx.setLineDash([]);
  let first = true;
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v === null || isNaN(v)) { first = true; continue; }
    if (first) { ctx.moveTo(toX(xMin + i), toY(v)); first = false; }
    else ctx.lineTo(toX(xMin + i), toY(v));
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawAxes(ctx: CanvasRenderingContext2D, W: number, H: number, xMin: number, xMax: number, yMin: number, yMax: number, title: string) {
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b);
  ctx.lineTo(W - PAD.r, H - PAD.b);
  ctx.stroke();

  ctx.fillStyle = '#999'; ctx.font = '10px monospace';
  // Y labels
  for (let i = 0; i <= 4; i++) {
    const v = yMin + (yMax - yMin) * (i / 4);
    const y = PAD.t + (1 - i / 4) * (H - PAD.t - PAD.b);
    ctx.fillText(v.toFixed(1), 2, y + 3);
  }
  // X labels
  const ticks = Math.min(8, xMax - xMin + 1);
  for (let i = 0; i <= ticks; i++) {
    const t = Math.round(xMin + (xMax - xMin) * (i / ticks));
    const x = PAD.l + (i / ticks) * (W - PAD.l - PAD.r);
    ctx.fillText(String(t), x - 5, H - PAD.b + 12);
  }
  // Title
  ctx.fillStyle = '#ccc'; ctx.font = '11px sans-serif';
  ctx.fillText(title, PAD.l + 4, PAD.t - 2);
}

function canvasBg(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H);
}

export const TimeSeriesAnalysis = () => {
  const {
    state, setMode, loadSample, parseAndSetData, computeAll,
    applyDifferencing, setSeasonalPeriod, setForecastSteps,
    setSmoothingAlpha, setMaxLag, exportForecast,
  } = useTimeSeries();

  const mainRef = useRef<HTMLCanvasElement>(null);
  const subRef = useRef<HTMLCanvasElement>(null);

  // Main canvas: raw data or forecast
  useEffect(() => {
    const canvas = mainRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    canvasBg(ctx, W, H);

    const { data, forecast, mode } = state;
    if (data.length === 0) { ctx.fillStyle = '#666'; ctx.fillText('No data', 20, 50); return; }

    const vals = data.map(d => d.value);
    const xMin = 0; const xMax = data.length + (mode === 'forecast' && forecast ? forecast.point.length : 0) - 1;
    const allVals = [...vals, ...(mode === 'forecast' && forecast ? [...forecast.upper, ...forecast.lower] : [])];
    const yMin = Math.min(...allVals) - 1;
    const yMax = Math.max(...allVals) + 1;

    drawAxes(ctx, W, H, xMin, xMax, yMin, yMax, mode === 'forecast' ? 'Time Series + Forecast' : 'Time Series');

    // Observed data
    drawLine(ctx, vals, '#5dade2', xMin, xMax, yMin, yMax, W, H);

    // Dots
    const toX = (t: number) => PAD.l + ((t - xMin) / Math.max(xMax - xMin, 1)) * (W - PAD.l - PAD.r);
    const toY = (v: number) => PAD.t + (1 - (v - yMin) / Math.max(yMax - yMin, 1)) * (H - PAD.t - PAD.b);
    ctx.fillStyle = '#5dade2';
    for (const pt of data) {
      ctx.beginPath(); ctx.arc(toX(pt.t), toY(pt.value), 2.5, 0, 2 * Math.PI); ctx.fill();
    }

    // Forecast overlay
    if (mode === 'forecast' && forecast && forecast.point.length > 0) {
      const n = data.length;
      // Confidence band
      ctx.fillStyle = 'rgba(241,196,15,0.15)';
      ctx.beginPath();
      ctx.moveTo(toX(n), toY(forecast.upper[0]));
      for (let i = 0; i < forecast.upper.length; i++) ctx.lineTo(toX(n + i), toY(forecast.upper[i]));
      for (let i = forecast.lower.length - 1; i >= 0; i--) ctx.lineTo(toX(n + i), toY(forecast.lower[i]));
      ctx.closePath(); ctx.fill();

      // Point forecast
      ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(toX(n - 1), toY(vals[n - 1]));
      for (let i = 0; i < forecast.point.length; i++) ctx.lineTo(toX(n + i), toY(forecast.point[i]));
      ctx.stroke(); ctx.setLineDash([]);

      // Vertical separator
      ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(toX(n), PAD.t); ctx.lineTo(toX(n), H - PAD.b); ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [state]);

  // Sub canvas: decompose, ACF/PACF, or nothing
  useEffect(() => {
    const canvas = subRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    canvasBg(ctx, W, H);

    const { mode, decomposition, acf, data } = state;

    if (mode === 'decompose' && decomposition) {
      // Three panels: trend, seasonal, residual
      const panelH = Math.floor((H - 10) / 3);
      const panels = [
        { vals: decomposition.trend, label: 'Trend', color: '#e67e22' },
        { vals: decomposition.seasonal, label: 'Seasonal', color: '#2ecc71' },
        { vals: decomposition.residual, label: 'Residual', color: '#e74c3c' },
      ];
      panels.forEach((p, i) => {
        const offsetY = i * panelH;
        const subCtx = ctx;
        subCtx.save();
        subCtx.translate(0, offsetY);
        const yMin = Math.min(...p.vals) - 0.1;
        const yMax = Math.max(...p.vals) + 0.1;
        drawAxes(subCtx, W, panelH, 0, p.vals.length - 1, yMin, yMax, p.label);
        drawLine(subCtx, p.vals, p.color, 0, p.vals.length - 1, yMin, yMax, W, panelH);
        subCtx.restore();
      });
    } else if (mode === 'acf' && acf.length > 1) {
      // ACF on top half, PACF on bottom half
      const halfH = Math.floor(H / 2);
      const n = data.length;
      const ci = 1.96 / Math.sqrt(n);
      const bars = acf.slice(1); // skip lag 0
      const maxLag = bars.length;

      [{ vals: bars.map(a => a.acf), label: 'ACF', color: '#3498db', offset: 0 },
       { vals: bars.map(a => a.pacf), label: 'PACF', color: '#9b59b6', offset: halfH }].forEach(({ vals, label, color, offset }) => {
        ctx.save(); ctx.translate(0, offset);
        const yMin = Math.min(-1, ...vals) - 0.05;
        const yMax = Math.max(1, ...vals) + 0.05;
        drawAxes(ctx, W, halfH, 1, maxLag, yMin, yMax, label);

        const toX = (lag: number) => PAD.l + ((lag - 1) / Math.max(maxLag - 1, 1)) * (W - PAD.l - PAD.r);
        const toY = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * (halfH - PAD.t - PAD.b);
        const zeroY = toY(0);

        // Confidence interval bands
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(PAD.l, toY(ci), W - PAD.l - PAD.r, toY(-ci) - toY(ci));
        // CI lines
        ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
        [ci, -ci].forEach(v => {
          ctx.beginPath(); ctx.moveTo(PAD.l, toY(v)); ctx.lineTo(W - PAD.r, toY(v)); ctx.stroke();
        });
        ctx.setLineDash([]);

        // Bars
        vals.forEach((v, i) => {
          const lag = i + 1;
          const x = toX(lag);
          const barTop = v >= 0 ? toY(v) : zeroY;
          const barBot = v >= 0 ? zeroY : toY(v);
          ctx.fillStyle = Math.abs(v) > ci ? color : `${color}88`;
          ctx.fillRect(x - 3, barTop, 6, barBot - barTop);
        });
        ctx.restore();
      });
    } else {
      ctx.fillStyle = '#555'; ctx.font = '13px sans-serif';
      ctx.fillText(mode === 'data' ? 'Select Decompose, ACF/PACF, or Forecast for more analysis' : 'Click "Compute" to run analysis', 20, H / 2);
    }
  }, [state]);

  return (
    <div className="ts">
      <div className="ts__controls">
        <div className="ts__row">
          {MODES.map(m => (
            <button key={m.id} className={`ts__btn ${state.mode === m.id ? 'ts__btn--active' : ''}`}
              onClick={() => setMode(m.id)}>{m.label}</button>
          ))}
          <button className="ts__btn" onClick={computeAll}>Compute All</button>
          {state.forecast && <button className="ts__btn" onClick={exportForecast}>Export CSV</button>}
        </div>

        <div className="ts__row">
          <span className="ts__label">Load sample:</span>
          <button className="ts__btn" onClick={() => loadSample('trend')}>Trend</button>
          <button className="ts__btn" onClick={() => loadSample('seasonal')}>Seasonal</button>
          <button className="ts__btn" onClick={() => loadSample('noisy')}>Noisy</button>
          <button className="ts__btn" onClick={applyDifferencing}>Difference (d={state.differencing})</button>
        </div>

        <div className="ts__row">
          <label className="ts__label">Season period:
            <input type="number" className="ts__num" min={2} max={60} value={state.seasonalPeriod}
              onChange={e => setSeasonalPeriod(parseInt(e.target.value))} />
          </label>
          <label className="ts__label">Forecast steps:
            <input type="number" className="ts__num" min={1} max={100} value={state.forecastSteps}
              onChange={e => setForecastSteps(parseInt(e.target.value))} />
          </label>
          <label className="ts__label">α (smoothing):
            <input type="number" className="ts__num" min={0.01} max={0.99} step={0.05} value={state.smoothingAlpha}
              onChange={e => setSmoothingAlpha(parseFloat(e.target.value))} />
          </label>
          <label className="ts__label">Max lag:
            <input type="number" className="ts__num" min={1} max={50} value={state.maxLag}
              onChange={e => setMaxLag(parseInt(e.target.value))} />
          </label>
        </div>

        <div className="ts__row">
          <span className="ts__label">Paste CSV (values, one per line):</span>
          <textarea className="ts__textarea" rows={2} placeholder="10.5&#10;11.2&#10;12.1&#10;..."
            onChange={e => parseAndSetData(e.target.value)} />
          <span className="ts__label">n={state.data.length} points{state.differencing > 0 ? ` · differenced ×${state.differencing}` : ''}</span>
        </div>
      </div>

      <canvas ref={mainRef} className="ts__canvas" width={780} height={220} />
      <canvas ref={subRef} className="ts__canvas ts__canvas--sub" width={780} height={240} />

      {state.forecast && state.mode === 'forecast' && (
        <div className="ts__summary">
          <p>Forecast ({state.forecastSteps} steps) · α={state.smoothingAlpha} · Next: {state.forecast.point[0]?.toFixed(3)} [{state.forecast.lower[0]?.toFixed(3)}, {state.forecast.upper[0]?.toFixed(3)}]</p>
          {state.decomposition && (
            <p>Decomposition period={state.seasonalPeriod} · Trend range: [{Math.min(...state.decomposition.trend).toFixed(2)}, {Math.max(...state.decomposition.trend).toFixed(2)}]</p>
          )}
        </div>
      )}
    </div>
  );
};
