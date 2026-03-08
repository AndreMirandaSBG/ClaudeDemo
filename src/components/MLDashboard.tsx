import { useRef, useEffect, useCallback } from 'react';
import {
  useML,
  linearRegression,
  polynomialRegression,
  exponentialRegression,
  evalPolynomial,
  kMeans,
  logisticRegression,
  computeR2,
} from '../hooks/useML';
import type { RegressionType } from '../types/calculator';

// ─── Canvas constants ─────────────────────────────────────────────────────────

const CLUSTER_COLORS = [
  '#e74c3c',
  '#2ecc71',
  '#3498db',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#34495e',
];

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function dataToCanvas(
  val: number,
  dataMin: number,
  dataMax: number,
  canvasSize: number,
  padding: number,
): number {
  if (dataMax === dataMin) return canvasSize / 2;
  return padding + ((val - dataMin) / (dataMax - dataMin)) * (canvasSize - 2 * padding);
}

function dataXToCanvas(
  x: number,
  xMin: number,
  xMax: number,
  w: number,
  padding: number,
): number {
  return dataToCanvas(x, xMin, xMax, w, padding);
}

function dataYToCanvas(
  y: number,
  yMin: number,
  yMax: number,
  h: number,
  padding: number,
): number {
  // Y is flipped: higher data value = lower canvas Y
  if (yMax === yMin) return h / 2;
  return (h - padding) - ((y - yMin) / (yMax - yMin)) * (h - 2 * padding);
}

// ─── Draw regression ──────────────────────────────────────────────────────────

function drawRegression(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: { x: number; y: number }[],
  regressionType: RegressionType,
  polynomialDegree: number,
) {
  const padding = 40;

  if (points.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generate data to visualize', w / 2, h / 2);
    return;
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);

  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const xPad = xRange * 0.1;
  const yPad = yRange * 0.1;

  const dataXMin = xMin - xPad;
  const dataXMax = xMax + xPad;
  const dataYMin = yMin - yPad;
  const dataYMax = yMax + yPad;

  // Draw scatter points
  ctx.fillStyle = '#4fc3f7';
  for (const p of points) {
    const cx = dataXToCanvas(p.x, dataXMin, dataXMax, w, padding);
    const cy = dataYToCanvas(p.y, dataYMin, dataYMax, h, padding);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw fit line/curve
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 2;
  ctx.beginPath();

  let r2 = 0;
  const steps = 200;

  if (regressionType === 'linear') {
    const result = linearRegression(points);
    r2 = result.r2;
    for (let i = 0; i <= steps; i++) {
      const x = dataXMin + (i / steps) * (dataXMax - dataXMin);
      const y = result.slope * x + result.intercept;
      const cx = dataXToCanvas(x, dataXMin, dataXMax, w, padding);
      const cy = dataYToCanvas(y, dataYMin, dataYMax, h, padding);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
  } else if (regressionType === 'polynomial') {
    const coeffs = polynomialRegression(points, polynomialDegree);
    if (coeffs.length > 0) {
      const actual = points.map(p => p.y);
      const predicted = points.map(p => evalPolynomial(coeffs, p.x));
      r2 = computeR2(actual, predicted);
      for (let i = 0; i <= steps; i++) {
        const x = dataXMin + (i / steps) * (dataXMax - dataXMin);
        const y = evalPolynomial(coeffs, x);
        const cx = dataXToCanvas(x, dataXMin, dataXMax, w, padding);
        const cy = dataYToCanvas(y, dataYMin, dataYMax, h, padding);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
    }
  } else if (regressionType === 'exponential') {
    const result = exponentialRegression(points);
    r2 = result.r2;
    for (let i = 0; i <= steps; i++) {
      const x = dataXMin + (i / steps) * (dataXMax - dataXMin);
      const y = result.a * Math.exp(result.b * x);
      if (!isFinite(y)) continue;
      const cx = dataXToCanvas(x, dataXMin, dataXMax, w, padding);
      const cy = dataYToCanvas(y, dataYMin, dataYMax, h, padding);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
  }

  ctx.stroke();

  // R² label
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`R² = ${r2.toFixed(4)}`, padding + 4, padding + 16);
}

// ─── Draw k-means ─────────────────────────────────────────────────────────────

function drawKMeans(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: { x: number; y: number; label?: number }[],
  kClusters: number,
) {
  const padding = 40;

  if (points.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generate data to visualize', w / 2, h / 2);
    return;
  }

  const result = kMeans(points, kClusters);
  const { centroids, labels } = result;

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const dataXMin = xMin - xRange * 0.1;
  const dataXMax = xMax + xRange * 0.1;
  const dataYMin = yMin - yRange * 0.1;
  const dataYMax = yMax + yRange * 0.1;

  // Draw points by cluster
  for (let i = 0; i < points.length; i++) {
    const cluster = labels[i] ?? 0;
    ctx.fillStyle = CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
    const cx = dataXToCanvas(points[i].x, dataXMin, dataXMax, w, padding);
    const cy = dataYToCanvas(points[i].y, dataYMin, dataYMax, h, padding);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw centroids as X marks
  for (let c = 0; c < centroids.length; c++) {
    const color = CLUSTER_COLORS[c % CLUSTER_COLORS.length];
    const cx = dataXToCanvas(centroids[c].x, dataXMin, dataXMax, w, padding);
    const cy = dataYToCanvas(centroids[c].y, dataYMin, dataYMax, h, padding);
    const size = 8;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size);
    ctx.lineTo(cx + size, cy + size);
    ctx.moveTo(cx + size, cy - size);
    ctx.lineTo(cx - size, cy + size);
    ctx.stroke();
  }
}

// ─── Draw classification ──────────────────────────────────────────────────────

function drawClassification(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  points: { x: number; y: number; label?: number }[],
) {
  const padding = 40;

  if (points.length === 0) {
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Generate data to visualize', w / 2, h / 2);
    return;
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;

  const dataXMin = xMin - xRange * 0.1;
  const dataXMax = xMax + xRange * 0.1;
  const dataYMin = yMin - yRange * 0.1;
  const dataYMax = yMax + yRange * 0.1;

  // Draw scatter points colored by class
  for (const p of points) {
    ctx.fillStyle = p.label === 1 ? '#2ecc71' : '#e74c3c';
    const cx = dataXToCanvas(p.x, dataXMin, dataXMax, w, padding);
    const cy = dataYToCanvas(p.y, dataYMin, dataYMax, h, padding);
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw decision boundary
  const model = logisticRegression(points);
  if (model.w2 !== 0) {
    // w0 + w1*x + w2*y = 0 => y = -(w0 + w1*x) / w2
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const x0 = dataXMin;
    const x1 = dataXMax;
    const y0 = -(model.w0 + model.w1 * x0) / model.w2;
    const y1 = -(model.w0 + model.w1 * x1) / model.w2;
    const cx0 = dataXToCanvas(x0, dataXMin, dataXMax, w, padding);
    const cy0 = dataYToCanvas(y0, dataYMin, dataYMax, h, padding);
    const cx1 = dataXToCanvas(x1, dataXMin, dataXMax, w, padding);
    const cy1 = dataYToCanvas(y1, dataYMin, dataYMax, h, padding);
    ctx.moveTo(cx0, cy0);
    ctx.lineTo(cx1, cy1);
    ctx.stroke();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MLDashboard() {
  const {
    state,
    setMode,
    setRegressionType,
    setPolynomialDegree,
    setKClusters,
    generateData,
  } = useML();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Canvas drawing ──────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    if (state.mode === 'regression') {
      drawRegression(ctx, w, h, state.dataPoints, state.regressionType, state.polynomialDegree);
    } else if (state.mode === 'kmeans') {
      drawKMeans(ctx, w, h, state.dataPoints, state.kClusters);
    } else {
      drawClassification(ctx, w, h, state.dataPoints);
    }
  }, [state]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ─── Results panel content ───────────────────────────────────────────────

  const renderResults = () => {
    if (state.mode === 'regression') {
      if (state.dataPoints.length === 0) {
        return <p>Generate data to see model results.</p>;
      }
      if (state.regressionType === 'linear') {
        const result = linearRegression(state.dataPoints);
        return (
          <>
            <p>Model: y = {result.slope.toFixed(4)}x + {result.intercept.toFixed(4)}</p>
            <p>R² = {result.r2.toFixed(4)}</p>
          </>
        );
      }
      if (state.regressionType === 'polynomial') {
        const coeffs = polynomialRegression(state.dataPoints, state.polynomialDegree);
        if (coeffs.length === 0) return <p>Not enough data for degree {state.polynomialDegree}.</p>;
        const actual = state.dataPoints.map(p => p.y);
        const predicted = state.dataPoints.map(p => evalPolynomial(coeffs, p.x));
        const r2 = computeR2(actual, predicted);
        return (
          <>
            <p>Model: Polynomial (degree {state.polynomialDegree})</p>
            <p>R² = {r2.toFixed(4)}</p>
          </>
        );
      }
      if (state.regressionType === 'exponential') {
        const result = exponentialRegression(state.dataPoints);
        return (
          <>
            <p>Model: y = {result.a.toFixed(4)} · e^({result.b.toFixed(4)}x)</p>
            <p>R² = {result.r2.toFixed(4)}</p>
          </>
        );
      }
    }

    if (state.mode === 'kmeans') {
      if (state.dataPoints.length === 0) return <p>Generate data to see clustering results.</p>;
      const result = kMeans(state.dataPoints, state.kClusters);
      return (
        <>
          <p>Clusters: {state.kClusters}</p>
          <p>Converged in {result.iterations} iteration{result.iterations !== 1 ? 's' : ''}.</p>
          <p>Points: {state.dataPoints.length}</p>
        </>
      );
    }

    if (state.mode === 'classification') {
      if (state.dataPoints.length === 0) return <p>Generate data to see classification results.</p>;
      const model = logisticRegression(state.dataPoints);
      return (
        <>
          <p>Decision boundary (logistic regression)</p>
          <p>w0={model.w0.toFixed(4)}, w1={model.w1.toFixed(4)}, w2={model.w2.toFixed(4)}</p>
          <p>Points: {state.dataPoints.length}</p>
        </>
      );
    }

    return null;
  };

  // ─── Mode labels ─────────────────────────────────────────────────────────

  const modes: { value: 'regression' | 'kmeans' | 'classification'; label: string }[] = [
    { value: 'regression', label: 'Regression' },
    { value: 'kmeans', label: 'K-Means' },
    { value: 'classification', label: 'Classification' },
  ];

  const regressionTypes: { value: RegressionType; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'polynomial', label: 'Polynomial' },
    { value: 'exponential', label: 'Exponential' },
  ];

  return (
    <div className="ml-dashboard">
      <div className="ml-dashboard__controls">
        {/* Mode buttons */}
        <div className="grapher__toolbar">
          {modes.map(m => (
            <button
              key={m.value}
              className={`grapher__btn${state.mode === m.value ? ' grapher__btn--active' : ''}`}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Generate data button */}
        <div className="grapher__toolbar">
          <button
            className="grapher__btn"
            aria-label="Generate data"
            onClick={generateData}
          >
            Generate Data
          </button>
        </div>

        {/* Regression type buttons */}
        {state.mode === 'regression' && (
          <div className="grapher__toolbar">
            {regressionTypes.map(rt => (
              <button
                key={rt.value}
                className={`grapher__btn${state.regressionType === rt.value ? ' grapher__btn--active' : ''}`}
                onClick={() => setRegressionType(rt.value)}
              >
                {rt.label}
              </button>
            ))}
            {state.regressionType === 'polynomial' && (
              <input
                type="number"
                aria-label="polynomial degree"
                min={1}
                max={6}
                step={1}
                value={state.polynomialDegree}
                onChange={e => setPolynomialDegree(Number(e.target.value))}
              />
            )}
          </div>
        )}

        {/* K-Means clusters input */}
        {state.mode === 'kmeans' && (
          <div className="grapher__toolbar">
            <label>
              K clusters:
              <input
                type="number"
                aria-label="k clusters"
                min={1}
                max={8}
                step={1}
                value={state.kClusters}
                onChange={e => setKClusters(Number(e.target.value))}
              />
            </label>
          </div>
        )}

        {/* Results panel */}
        <div className="ml-dashboard__results">
          {renderResults()}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        aria-label="ml visualization"
        width={580}
        height={360}
      />
    </div>
  );
}
