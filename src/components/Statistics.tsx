import { useRef, useEffect } from 'react';
import { useStatistics } from '../hooks/useStatistics';
import type { ChartType, StatResult } from '../types/calculator';

// ─── Canvas chart drawing ─────────────────────────────────────────────────────

const CHART_BG = '#1a1a2e';
const CHART_BAR = '#3498db';
const CHART_LINE = '#e74c3c';
const CHART_DOT = '#2ecc71';
const AXIS_COLOR = '#555';
const TEXT_COLOR = '#aaa';
const PAD = 40;

function drawHistogram(ctx: CanvasRenderingContext2D, data: number[], w: number, h: number) {
  ctx.fillStyle = CHART_BG;
  ctx.fillRect(0, 0, w, h);
  if (data.length === 0) return;

  const bins = Math.min(20, Math.ceil(Math.sqrt(data.length)));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const binWidth = range / bins;
  const counts = Array<number>(bins).fill(0);
  for (const v of data) {
    const i = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[i]++;
  }
  const maxCount = Math.max(...counts);
  const gw = w - PAD * 2;
  const gh = h - PAD * 2;

  // axes
  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, h - PAD); ctx.lineTo(w - PAD, h - PAD);
  ctx.stroke();

  for (let i = 0; i < bins; i++) {
    const bx = PAD + (i / bins) * gw;
    const bw = gw / bins - 2;
    const bh = (counts[i] / maxCount) * gh;
    ctx.fillStyle = CHART_BAR;
    ctx.fillRect(bx, h - PAD - bh, bw, bh);
  }

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(min * 100) / 100), PAD, h - PAD + 12);
  ctx.fillText(String(Math.round(max * 100) / 100), w - PAD, h - PAD + 12);
}

function drawBarChart(ctx: CanvasRenderingContext2D, data: number[], w: number, h: number) {
  ctx.fillStyle = CHART_BG;
  ctx.fillRect(0, 0, w, h);
  if (data.length === 0) return;

  const labels = [...new Set(data)].sort((a, b) => a - b);
  const counts = labels.map(l => data.filter(v => v === l).length);
  const maxCount = Math.max(...counts);
  const gw = w - PAD * 2;
  const gh = h - PAD * 2;
  const barW = Math.min(40, gw / labels.length - 4);

  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, h - PAD); ctx.lineTo(w - PAD, h - PAD);
  ctx.stroke();

  labels.forEach((label, i) => {
    const bx = PAD + ((i + 0.5) / labels.length) * gw - barW / 2;
    const bh = (counts[i] / maxCount) * gh;
    ctx.fillStyle = CHART_BAR;
    ctx.fillRect(bx, h - PAD - bh, barW, bh);
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(label), bx + barW / 2, h - PAD + 12);
  });
}

function drawScatter(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  ys: number[],
  w: number,
  h: number,
  showReg: boolean,
  result: StatResult,
) {
  ctx.fillStyle = CHART_BG;
  ctx.fillRect(0, 0, w, h);
  if (xs.length === 0) return;

  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
  const gw = w - PAD * 2, gh = h - PAD * 2;
  const mapX = (x: number) => PAD + ((x - minX) / rangeX) * gw;
  const mapY = (y: number) => h - PAD - ((y - minY) / rangeY) * gh;

  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, h - PAD); ctx.lineTo(w - PAD, h - PAD);
  ctx.stroke();

  ctx.fillStyle = CHART_DOT;
  for (let i = 0; i < xs.length; i++) {
    ctx.beginPath();
    ctx.arc(mapX(xs[i]), mapY(ys[i]), 4, 0, Math.PI * 2);
    ctx.fill();
  }

  if (showReg && result.regression) {
    const { slope, intercept } = result.regression;
    ctx.strokeStyle = CHART_LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mapX(minX), mapY(slope * minX + intercept));
    ctx.lineTo(mapX(maxX), mapY(slope * maxX + intercept));
    ctx.stroke();
  }
}

function drawBoxPlot(ctx: CanvasRenderingContext2D, data: number[], w: number, h: number) {
  ctx.fillStyle = CHART_BG;
  ctx.fillRect(0, 0, w, h);
  if (data.length < 2) return;

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n / 4)];
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q3 = sorted[Math.floor(3 * n / 4)];
  const minV = sorted[0], maxV = sorted[n - 1];
  const range = maxV - minV || 1;

  const mapX = (v: number) => PAD + ((v - minV) / range) * (w - PAD * 2);
  const cy = h / 2;
  const bh = h / 4;

  ctx.strokeStyle = AXIS_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, h - PAD); ctx.lineTo(w - PAD, h - PAD);
  ctx.stroke();

  // whiskers
  ctx.strokeStyle = CHART_BAR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mapX(minV), cy); ctx.lineTo(mapX(q1), cy);
  ctx.moveTo(mapX(q3), cy); ctx.lineTo(mapX(maxV), cy);
  ctx.moveTo(mapX(minV), cy - bh / 2); ctx.lineTo(mapX(minV), cy + bh / 2);
  ctx.moveTo(mapX(maxV), cy - bh / 2); ctx.lineTo(mapX(maxV), cy + bh / 2);
  ctx.stroke();

  // box
  ctx.fillStyle = 'rgba(52,152,219,0.3)';
  ctx.fillRect(mapX(q1), cy - bh / 2, mapX(q3) - mapX(q1), bh);
  ctx.strokeStyle = CHART_BAR;
  ctx.strokeRect(mapX(q1), cy - bh / 2, mapX(q3) - mapX(q1), bh);

  // median
  ctx.strokeStyle = CHART_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(mapX(median), cy - bh / 2); ctx.lineTo(mapX(median), cy + bh / 2);
  ctx.stroke();

  ctx.fillStyle = TEXT_COLOR;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (const [label, val] of [['min', minV], ['Q1', q1], ['med', median], ['Q3', q3], ['max', maxV]] as [string, number][]) {
    ctx.fillText(`${label}=${Math.round(val * 100) / 100}`, mapX(val), cy + bh / 2 + 16);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: 'histogram', label: 'Histogram' },
  { type: 'bar', label: 'Bar' },
  { type: 'scatter', label: 'Scatter' },
  { type: 'boxplot', label: 'Box Plot' },
];

export function Statistics() {
  const {
    rawInput,
    data,
    xData,
    yData,
    result,
    chartType,
    showRegression,
    parseError,
    parseInput,
    setChartType,
    toggleRegression,
    clearData,
  } = useStatistics();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;

    if (chartType === 'histogram') drawHistogram(ctx, data, w, h);
    else if (chartType === 'bar') drawBarChart(ctx, data, w, h);
    else if (chartType === 'scatter' && result) drawScatter(ctx, xData, yData, w, h, showRegression, result);
    else if (chartType === 'boxplot') drawBoxPlot(ctx, data, w, h);
    else {
      ctx.fillStyle = CHART_BG;
      ctx.fillRect(0, 0, w, h);
    }
  }, [data, xData, yData, chartType, showRegression, result]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    parseInput(text);
  };

  return (
    <div className="statistics">
      <div className="statistics__input-area">
        <textarea
          className="statistics__input"
          value={rawInput}
          placeholder={
            'Enter numbers separated by commas or spaces.\nFor scatter/regression use pairs: x1,y1;x2,y2\nOr paste data from clipboard.'
          }
          onChange={e => parseInput(e.target.value)}
          onPaste={handlePaste}
          rows={4}
        />
        <button className="statistics__btn" onClick={clearData}>Clear</button>
        {parseError && <span className="statistics__error">{parseError}</span>}
      </div>

      <div className="statistics__chart-types">
        {CHART_TYPES.map(({ type, label }) => (
          <button
            key={type}
            className={`statistics__btn ${chartType === type ? 'statistics__btn--active' : ''}`}
            onClick={() => setChartType(type)}
          >
            {label}
          </button>
        ))}
        {chartType === 'scatter' && (
          <button
            className={`statistics__btn ${showRegression ? 'statistics__btn--active' : ''}`}
            onClick={toggleRegression}
          >
            Regression
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="statistics__canvas" width={600} height={300} />

      {result && (
        <div className="statistics__results">
          <div className="statistics__results-grid">
            <div className="statistics__stat"><span>Count</span><strong>{result.count}</strong></div>
            <div className="statistics__stat"><span>Mean</span><strong>{round4(result.mean)}</strong></div>
            <div className="statistics__stat"><span>Median</span><strong>{round4(result.median)}</strong></div>
            <div className="statistics__stat"><span>Mode</span><strong>{result.mode.map(round4).join(', ')}</strong></div>
            <div className="statistics__stat"><span>Variance</span><strong>{round4(result.variance)}</strong></div>
            <div className="statistics__stat"><span>Std Dev</span><strong>{round4(result.stdDev)}</strong></div>
            <div className="statistics__stat"><span>Min</span><strong>{round4(result.min)}</strong></div>
            <div className="statistics__stat"><span>Max</span><strong>{round4(result.max)}</strong></div>
          </div>
          {result.regression && (
            <div className="statistics__regression">
              <strong>Linear Regression:</strong>{' '}
              y = {round4(result.regression.slope)}x + {round4(result.regression.intercept)}{' '}
              (R² = {round4(result.regression.r2)})
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function round4(n: number): number | string {
  return Math.round(n * 10000) / 10000;
}
