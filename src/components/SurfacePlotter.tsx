import { useRef, useEffect, useCallback } from 'react';
import { useSurface } from '../hooks/useSurface';
import type { SamplePoint3D, SurfaceQuad } from '../hooks/useSurface';
import type { SurfacePlotType } from '../types/calculator';

// ─── Color gradient: blue → cyan → green → yellow → red ──────────────────────

function zColor(t: number, alpha = 1): string {
  const clamped = Math.max(0, Math.min(1, t));
  let r: number, g: number, b: number;
  if (clamped < 0.25) {
    const s = clamped / 0.25;
    r = 0; g = s; b = 1;
  } else if (clamped < 0.5) {
    const s = (clamped - 0.25) / 0.25;
    r = 0; g = 1; b = 1 - s;
  } else if (clamped < 0.75) {
    const s = (clamped - 0.5) / 0.25;
    r = s; g = 1; b = 0;
  } else {
    const s = (clamped - 0.75) / 0.25;
    r = 1; g = 1 - s; b = 0;
  }
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${alpha})`;
}

// ─── 3D projection ────────────────────────────────────────────────────────────

interface Projected {
  sx: number;
  sy: number;
  depth: number;
}

function project3D(
  p: SamplePoint3D,
  rotX: number,
  rotY: number,
  scale: number,
  cx: number,
  cy: number,
  zMin: number,
  zMax: number,
): Projected {
  const nx = p.x / 4;
  const ny = p.y / 4;
  const zRange = zMax - zMin || 1;
  const nz = ((p.z - zMin) / zRange) * 2 - 1;

  // Rotate around Y axis
  const x1 = nx * Math.cos(rotY) + nz * Math.sin(rotY);
  const z1 = -nx * Math.sin(rotY) + nz * Math.cos(rotY);

  // Rotate around X axis
  const y2 = ny * Math.cos(rotX) - z1 * Math.sin(rotX);
  const z2 = ny * Math.sin(rotX) + z1 * Math.cos(rotX);

  // Perspective projection
  const fov = 3;
  const w = fov / (fov + z2 + 0.01);
  const pixelScale = 120 * scale;

  return { sx: cx + x1 * pixelScale * w, sy: cy - y2 * pixelScale * w, depth: z2 };
}

// ─── Render surface quads ─────────────────────────────────────────────────────

function renderSurface(
  ctx: CanvasRenderingContext2D,
  quads: SurfaceQuad[],
  zMin: number,
  zMax: number,
  rotX: number,
  rotY: number,
  scale: number,
  cx: number,
  cy: number,
) {
  // Project all quad corner points and compute depths
  type ProjectedQuad = {
    pts: Projected[];
    normalizedZ: number;
    depth: number;
  };

  const projected: ProjectedQuad[] = quads.map(q => {
    const pts = q.points.map(p => project3D(p, rotX, rotY, scale, cx, cy, zMin, zMax));
    const depth = pts.reduce((sum, p) => sum + p.depth, 0) / 4;
    return { pts, normalizedZ: q.normalizedZ, depth };
  });

  // Painter's algorithm: draw back-to-front
  projected.sort((a, b) => b.depth - a.depth);

  for (const { pts, normalizedZ } of projected) {
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
    ctx.closePath();
    ctx.fillStyle = zColor(normalizedZ, 0.85);
    ctx.fill();
    ctx.strokeStyle = zColor(normalizedZ, 0.4);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

// ─── Render parametric curve ──────────────────────────────────────────────────

function renderCurve(
  ctx: CanvasRenderingContext2D,
  pts: SamplePoint3D[],
  rotX: number,
  rotY: number,
  scale: number,
  cx: number,
  cy: number,
) {
  if (pts.length === 0) return;
  let zMin = Infinity, zMax = -Infinity;
  for (const p of pts) { zMin = Math.min(zMin, p.z); zMax = Math.max(zMax, p.z); }
  if (!isFinite(zMin)) { zMin = -1; zMax = 1; }

  const projected = pts.map((p, i) => {
    const pr = project3D(p, rotX, rotY, scale, cx, cy, zMin, zMax);
    const t = (i / (pts.length - 1));
    return { ...pr, t };
  });

  for (let i = 0; i < projected.length - 1; i++) {
    const a = projected[i];
    const b = projected[i + 1];
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.strokeStyle = zColor(a.t);
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ─── Canvas draw ──────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  rotX: number,
  rotY: number,
  scale: number,
  cx: number,
  cy: number,
) {
  const zMin = -1, zMax = 1;
  const axes = [
    { from: { x: -4, y: 0, z: 0 }, to: { x: 4, y: 0, z: 0 }, label: 'x', color: '#e74c3c' },
    { from: { x: 0, y: -4, z: 0 }, to: { x: 0, y: 4, z: 0 }, label: 'y', color: '#2ecc71' },
    { from: { x: 0, y: 0, z: -1 }, to: { x: 0, y: 0, z: 1 }, label: 'z', color: '#3498db' },
  ];
  for (const axis of axes) {
    const p1 = project3D(axis.from, rotX, rotY, scale, cx, cy, zMin, zMax);
    const p2 = project3D(axis.to, rotX, rotY, scale, cx, cy, zMin, zMax);
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);
    ctx.strokeStyle = axis.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = axis.color;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(axis.label, p2.sx + 6, p2.sy - 4);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const PLOT_TYPE_LABELS: { id: SurfacePlotType; label: string }[] = [
  { id: 'surface', label: 'Surface z=f(x,y)' },
  { id: 'parametric-curve', label: 'Parametric Curve' },
  { id: 'parametric-surface', label: 'Parametric Surface' },
];

export function SurfacePlotter() {
  const {
    state,
    setExpression,
    setXParam,
    setYParam,
    setZParam,
    setPlotType,
    rotate,
    resetView,
    zoomIn,
    zoomOut,
    sampleSurface,
    sampleParametricCurve,
    sampleParametricSurface,
  } = useSurface();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;
    const cx = w / 2, cy = h / 2;

    drawBackground(ctx, w, h);
    drawAxes(ctx, state.rotX, state.rotY, state.scale, cx, cy);

    if (state.plotType === 'surface') {
      const { quads, zMin, zMax } = sampleSurface();
      renderSurface(ctx, quads, zMin, zMax, state.rotX, state.rotY, state.scale, cx, cy);
    } else if (state.plotType === 'parametric-curve') {
      const pts = sampleParametricCurve();
      renderCurve(ctx, pts, state.rotX, state.rotY, state.scale, cx, cy);
    } else {
      const { quads, zMin, zMax } = sampleParametricSurface();
      renderSurface(ctx, quads, zMin, zMax, state.rotX, state.rotY, state.scale, cx, cy);
    }
  }, [state, sampleSurface, sampleParametricCurve, sampleParametricSurface]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    rotate(dx, dy);
  }, [rotate]);

  const handleMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY > 0) zoomOut(); else zoomIn();
  }, [zoomIn, zoomOut]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'surface.png';
    a.click();
  }, []);

  const { rotX, rotY, scale, plotType, expression, xParamExpr, yParamExpr, zParamExpr } = state;

  return (
    <div className="surface-plotter">
      <div className="surface-plotter__controls">
        <div className="surface-plotter__type-btns">
          {PLOT_TYPE_LABELS.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${plotType === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setPlotType(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {plotType === 'surface' && (
          <div className="surface-plotter__input-row">
            <label htmlFor="surface-expr" className="surface-plotter__label">z = f(x,y)</label>
            <input
              id="surface-expr"
              aria-label="expression"
              className="grapher__fn-input"
              value={expression}
              onChange={e => setExpression(e.target.value)}
              placeholder="e.g. sin(sqrt(x*x + y*y))"
            />
          </div>
        )}

        {plotType === 'parametric-curve' && (
          <div className="surface-plotter__param-inputs">
            <div className="surface-plotter__input-row">
              <label htmlFor="xparam" className="surface-plotter__label">x(t)</label>
              <input id="xparam" aria-label="x(t)" className="grapher__fn-input" value={xParamExpr} onChange={e => setXParam(e.target.value)} placeholder="cos(t)" />
            </div>
            <div className="surface-plotter__input-row">
              <label htmlFor="yparam" className="surface-plotter__label">y(t)</label>
              <input id="yparam" aria-label="y(t)" className="grapher__fn-input" value={yParamExpr} onChange={e => setYParam(e.target.value)} placeholder="sin(t)" />
            </div>
            <div className="surface-plotter__input-row">
              <label htmlFor="zparam" className="surface-plotter__label">z(t)</label>
              <input id="zparam" aria-label="z(t)" className="grapher__fn-input" value={zParamExpr} onChange={e => setZParam(e.target.value)} placeholder="t / 6" />
            </div>
          </div>
        )}

        {plotType === 'parametric-surface' && (
          <div className="surface-plotter__param-inputs">
            <div className="surface-plotter__input-row">
              <label htmlFor="xparam-s" className="surface-plotter__label">x(u,v)</label>
              <input id="xparam-s" aria-label="x(u,v)" className="grapher__fn-input" value={xParamExpr} onChange={e => setXParam(e.target.value)} placeholder="sin(v)*cos(u)" />
            </div>
            <div className="surface-plotter__input-row">
              <label htmlFor="yparam-s" className="surface-plotter__label">y(u,v)</label>
              <input id="yparam-s" aria-label="y(u,v)" className="grapher__fn-input" value={yParamExpr} onChange={e => setYParam(e.target.value)} placeholder="sin(v)*sin(u)" />
            </div>
            <div className="surface-plotter__input-row">
              <label htmlFor="zparam-s" className="surface-plotter__label">z(u,v)</label>
              <input id="zparam-s" aria-label="z(u,v)" className="grapher__fn-input" value={zParamExpr} onChange={e => setZParam(e.target.value)} placeholder="cos(v)" />
            </div>
          </div>
        )}

        <div className="surface-plotter__toolbar">
          <button className="grapher__btn" onClick={zoomIn} aria-label="Zoom in">+ Zoom In</button>
          <button className="grapher__btn" onClick={zoomOut} aria-label="Zoom out">− Zoom Out</button>
          <button className="grapher__btn" onClick={resetView} aria-label="Reset view">Reset View</button>
          <button className="grapher__btn" onClick={handleExport} aria-label="Export PNG">Export PNG</button>
        </div>

        <div className="surface-plotter__info">
          <span>rotX: {rotX.toFixed(2)}</span>
          <span>rotY: {rotY.toFixed(2)}</span>
          <span>scale: {scale.toFixed(2)}</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="grapher__canvas"
        width={600}
        height={450}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
      />

      <div className="grapher__hint">Drag to rotate · Scroll to zoom</div>
    </div>
  );
}
