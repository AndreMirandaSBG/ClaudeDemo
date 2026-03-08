import { useRef, useEffect, useCallback } from 'react';
import {
  useGeometry,
  getConicPoints,
  getConicFoci,
  conicProperties,
  getSurface3DPoints,
  project3D,
  computeDistances,
  computeAngles,
} from '../hooks/useGeometry';
import type { ConicType, Surface3DType } from '../types/calculator';

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODE_LABELS: { id: 'euclidean' | 'conics' | 'surfaces'; label: string }[] = [
  { id: 'euclidean', label: 'Euclidean' },
  { id: 'conics', label: 'Conics' },
  { id: 'surfaces', label: 'Surfaces' },
];

const CONIC_LABELS: { id: ConicType; label: string }[] = [
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'parabola', label: 'Parabola' },
  { id: 'hyperbola', label: 'Hyperbola' },
];

const SURFACE_LABELS: { id: Surface3DType; label: string }[] = [
  { id: 'mobius', label: 'Möbius' },
  { id: 'torus', label: 'Torus' },
  { id: 'klein', label: 'Klein' },
];

const CANVAS_W = 580;
const CANVAS_H = 400;
const SCALE = 60; // pixels per unit

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawAxes2D(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = '#444466';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(CANVAS_W, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, CANVAS_H);
  ctx.stroke();

  // Grid lines
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  const stepsX = Math.ceil(CANVAS_W / SCALE);
  const stepsY = Math.ceil(CANVAS_H / SCALE);
  for (let i = -stepsX; i <= stepsX; i++) {
    const x = cx + i * SCALE;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let j = -stepsY; j <= stepsY; j++) {
    const y = cy + j * SCALE;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }
}

function drawConics(
  ctx: CanvasRenderingContext2D,
  type: ConicType,
  a: number,
  b: number,
) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  drawBackground(ctx);
  drawAxes2D(ctx, cx, cy);

  const pts = getConicPoints(type, a, b);

  // Draw conic curve
  ctx.beginPath();
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 2;
  let penDown = false;
  for (const p of pts) {
    if (isNaN(p.x) || isNaN(p.y)) {
      penDown = false;
      continue;
    }
    const sx = cx + p.x * SCALE;
    const sy = cy - p.y * SCALE;
    if (!penDown) {
      ctx.moveTo(sx, sy);
      penDown = true;
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();

  // Draw foci
  const foci = getConicFoci(type, a, b);
  ctx.fillStyle = '#ff9800';
  for (const f of foci) {
    const fx = cx + f.x * SCALE;
    const fy = cy - f.y * SCALE;
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSurfaces(
  ctx: CanvasRenderingContext2D,
  type: Surface3DType,
  rotX: number,
  rotY: number,
) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  drawBackground(ctx);

  const n = 20;
  const pts3D = getSurface3DPoints(type, rotX, rotY, n);
  const scale = 80;

  // Draw grid lines along i-direction
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)';
    ctx.lineWidth = 0.8;
    let started = false;
    for (let j = 0; j < n; j++) {
      const p = pts3D[i * n + j];
      const { px, py } = project3D(p, rotX, rotY);
      const sx = cx + px * scale;
      const sy = cy - py * scale;
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }

  // Draw grid lines along j-direction
  for (let j = 0; j < n; j++) {
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(129, 212, 250, 0.35)';
    ctx.lineWidth = 0.5;
    let started = false;
    for (let i = 0; i < n; i++) {
      const p = pts3D[i * n + j];
      const { px, py } = project3D(p, rotX, rotY);
      const sx = cx + px * scale;
      const sy = cy - py * scale;
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }
}

function drawEuclidean(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;

  drawBackground(ctx);
  drawAxes2D(ctx, cx, cy);

  if (points.length === 0) return;

  // Draw connecting lines
  if (points.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 1.5;
    const first = points[0];
    ctx.moveTo(cx + first.x * SCALE, cy - first.y * SCALE);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(cx + points[i].x * SCALE, cy - points[i].y * SCALE);
    }
    ctx.stroke();
  }

  // Draw point dots and labels
  for (let i = 0; i < points.length; i++) {
    const sx = cx + points[i].x * SCALE;
    const sy = cy - points[i].y * SCALE;

    ctx.beginPath();
    ctx.fillStyle = '#4fc3f7';
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`P${i + 1}`, sx, sy - 10);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GeometryExplorer() {
  const {
    state,
    setMode,
    setConicType,
    setConicA,
    setConicB,
    setSurface3D,
    setRotX,
    setRotY,
    addPoint,
    clearPoints,
  } = useGeometry();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw on canvas whenever state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.mode === 'conics') {
      drawConics(ctx, state.conicType, state.conicA, state.conicB);
    } else if (state.mode === 'surfaces') {
      drawSurfaces(ctx, state.surface3D, state.rotX, state.rotY);
    } else {
      drawEuclidean(ctx, state.points);
    }
  }, [state]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (state.mode !== 'euclidean') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;
      const mathX = (px - cx) / SCALE;
      const mathY = (cy - py) / SCALE;
      addPoint({ x: mathX, y: mathY });
    },
    [state.mode, addPoint],
  );

  const props = conicProperties(state.conicType, state.conicA, state.conicB);
  const distances = computeDistances(state.points);
  const angles = computeAngles(state.points);

  return (
    <div className="geometry-explorer">
      <div className="geometry-explorer__controls">
        {/* Mode buttons */}
        <div className="geometry-explorer__mode-btns">
          {MODE_LABELS.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn${state.mode === id ? ' grapher__btn--active' : ''}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conics controls */}
        {state.mode === 'conics' && (
          <div className="geometry-explorer__conic-controls">
            <div className="geometry-explorer__conic-btns">
              {CONIC_LABELS.map(({ id, label }) => (
                <button
                  key={id}
                  className={`grapher__btn${state.conicType === id ? ' grapher__btn--active' : ''}`}
                  onClick={() => setConicType(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="geometry-explorer__sliders">
              <label>
                a
                <input
                  type="range"
                  aria-label="conic a"
                  min={0.5}
                  max={6}
                  step={0.1}
                  value={state.conicA}
                  onChange={e => setConicA(Number(e.target.value))}
                />
                <span>{state.conicA.toFixed(1)}</span>
              </label>

              {state.conicType !== 'parabola' && (
                <label>
                  b
                  <input
                    type="range"
                    aria-label="conic b"
                    min={0.5}
                    max={6}
                    step={0.1}
                    value={state.conicB}
                    onChange={e => setConicB(Number(e.target.value))}
                  />
                  <span>{state.conicB.toFixed(1)}</span>
                </label>
              )}
            </div>

            <div className="geometry-explorer__props">
              {Object.entries(props).map(([key, val]) => (
                <div key={key} className="geometry-explorer__prop-row">
                  <span className="geometry-explorer__prop-key">{key}:</span>
                  <span className="geometry-explorer__prop-val">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Surfaces controls */}
        {state.mode === 'surfaces' && (
          <div className="geometry-explorer__surface-controls">
            <div className="geometry-explorer__surface-btns">
              {SURFACE_LABELS.map(({ id, label }) => (
                <button
                  key={id}
                  className={`grapher__btn${state.surface3D === id ? ' grapher__btn--active' : ''}`}
                  onClick={() => setSurface3D(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="geometry-explorer__sliders">
              <label>
                Rot X
                <input
                  type="range"
                  aria-label="rotation x"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.05}
                  value={state.rotX}
                  onChange={e => setRotX(Number(e.target.value))}
                />
                <span>{state.rotX.toFixed(2)}</span>
              </label>

              <label>
                Rot Y
                <input
                  type="range"
                  aria-label="rotation y"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.05}
                  value={state.rotY}
                  onChange={e => setRotY(Number(e.target.value))}
                />
                <span>{state.rotY.toFixed(2)}</span>
              </label>
            </div>
          </div>
        )}

        {/* Euclidean controls */}
        {state.mode === 'euclidean' && (
          <div className="geometry-explorer__euclidean-controls">
            <button
              aria-label="Clear points"
              className="grapher__btn"
              onClick={clearPoints}
            >
              Clear Points
            </button>

            {state.points.length > 0 && (
              <div className="geometry-explorer__metrics">
                {distances.length > 0 && (
                  <div className="geometry-explorer__metrics-section">
                    <strong>Distances</strong>
                    {distances.map((d, i) => (
                      <div key={i}>{d}</div>
                    ))}
                  </div>
                )}
                {angles.length > 0 && (
                  <div className="geometry-explorer__metrics-section">
                    <strong>Angles</strong>
                    {angles.map((a, i) => (
                      <div key={i}>{a}</div>
                    ))}
                  </div>
                )}
                {distances.length === 0 && angles.length === 0 && (
                  <div className="geometry-explorer__metrics-hint">
                    {`${state.points.length} point(s) placed`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-label="geometry visualization"
        onClick={handleCanvasClick}
        style={{ cursor: state.mode === 'euclidean' ? 'crosshair' : 'default' }}
      />
    </div>
  );
}
