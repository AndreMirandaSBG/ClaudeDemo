import { useRef, useEffect, useCallback } from 'react';
import { useGrapher, evaluateGraphExpression, findSpecialPoints } from '../hooks/useGrapher';
import type { GraphViewport, GraphFunction, GraphSpecialPoint } from '../types/calculator';

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function toCanvasX(x: number, vp: GraphViewport, w: number): number {
  return ((x - vp.xMin) / (vp.xMax - vp.xMin)) * w;
}

function toCanvasY(y: number, vp: GraphViewport, h: number): number {
  return ((vp.yMax - y) / (vp.yMax - vp.yMin)) * h;
}

function fromCanvasX(cx: number, vp: GraphViewport, w: number): number {
  return vp.xMin + (cx / w) * (vp.xMax - vp.xMin);
}

function fromCanvasY(cy: number, vp: GraphViewport, h: number): number {
  return vp.yMax - (cy / h) * (vp.yMax - vp.yMin);
}

function drawGrid(ctx: CanvasRenderingContext2D, vp: GraphViewport, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  const xRange = vp.xMax - vp.xMin;
  const yRange = vp.yMax - vp.yMin;
  const step = Math.pow(10, Math.floor(Math.log10(Math.max(xRange, yRange) / 10)));

  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const xStart = Math.ceil(vp.xMin / step) * step;
  for (let x = xStart; x <= vp.xMax; x += step) {
    const cx = toCanvasX(x, vp, w);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
  }
  const yStart = Math.ceil(vp.yMin / step) * step;
  for (let y = yStart; y <= vp.yMax; y += step) {
    const cy = toCanvasY(y, vp, h);
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
  }
  ctx.stroke();

  // Axes
  ctx.strokeStyle = '#4a4a8e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const ax0 = toCanvasX(0, vp, w);
  const ay0 = toCanvasY(0, vp, h);
  ctx.moveTo(ax0, 0); ctx.lineTo(ax0, h);
  ctx.moveTo(0, ay0); ctx.lineTo(w, ay0);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let x = xStart; x <= vp.xMax; x += step) {
    if (Math.abs(x) < step * 0.01) continue;
    const cx = toCanvasX(x, vp, w);
    ctx.fillText(String(Math.round(x * 1e6) / 1e6), cx, Math.min(Math.max(ay0 + 14, 14), h - 4));
  }
  ctx.textAlign = 'right';
  for (let y = yStart; y <= vp.yMax; y += step) {
    if (Math.abs(y) < step * 0.01) continue;
    const cy = toCanvasY(y, vp, h);
    ctx.fillText(String(Math.round(y * 1e6) / 1e6), Math.min(Math.max(ax0 - 4, 28), w - 4), cy + 4);
  }
}

function drawFunction(
  ctx: CanvasRenderingContext2D,
  fn: GraphFunction,
  vp: GraphViewport,
  w: number,
  h: number,
) {
  if (!fn.visible || !fn.expression.trim()) return;
  ctx.strokeStyle = fn.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let penDown = false;
  const samples = w * 2;
  let prevY = NaN;
  for (let i = 0; i <= samples; i++) {
    const x = vp.xMin + (i / samples) * (vp.xMax - vp.xMin);
    const y = evaluateGraphExpression(fn.expression, x);
    if (!isFinite(y) || Math.abs(y - prevY) > (vp.yMax - vp.yMin) * 10) {
      penDown = false;
      prevY = NaN;
      continue;
    }
    const cx = toCanvasX(x, vp, w);
    const cy = toCanvasY(y, vp, h);
    if (!penDown) { ctx.moveTo(cx, cy); penDown = true; }
    else ctx.lineTo(cx, cy);
    prevY = y;
  }
  ctx.stroke();
}

function drawSpecialPoints(
  ctx: CanvasRenderingContext2D,
  points: GraphSpecialPoint[],
  vp: GraphViewport,
  w: number,
  h: number,
  color: string,
) {
  const COLORS: Record<string, string> = {
    root: '#f1c40f',
    maximum: '#2ecc71',
    minimum: '#e74c3c',
  };
  for (const pt of points) {
    const cx = toCanvasX(pt.x, vp, w);
    const cy = toCanvasY(pt.y, vp, h);
    if (cx < -5 || cx > w + 5 || cy < -5 || cy > h + 5) continue;
    ctx.fillStyle = COLORS[pt.type] ?? color;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${pt.type[0].toUpperCase()} (${(Math.round(pt.x * 100) / 100)}, ${(Math.round(pt.y * 100) / 100)})`, cx + 7, cy - 4);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FunctionGrapher() {
  const {
    functions,
    viewport,
    showSpecialPoints,
    addFunction,
    removeFunction,
    updateFunction,
    toggleVisible,
    zoom,
    pan,
    resetViewport,
    toggleSpecialPoints,
  } = useGrapher();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: w, height: h } = canvas;

    drawGrid(ctx, viewport, w, h);
    for (const fn of functions) {
      drawFunction(ctx, fn, viewport, w, h);
      if (showSpecialPoints) {
        const pts = findSpecialPoints(fn.expression, viewport.xMin, viewport.xMax);
        drawSpecialPoints(ctx, pts, viewport, w, h, fn.color);
      }
    }
  }, [functions, viewport, showSpecialPoints]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pivotX = (e.clientX - rect.left) / rect.width;
    const pivotY = (e.clientY - rect.top) / rect.height;
    zoom(e.deltaY > 0 ? 1.2 : 0.833, pivotX, pivotY);
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const xScale = (viewport.xMax - viewport.xMin) / canvas.width;
    const yScale = (viewport.yMax - viewport.yMin) / canvas.height;
    pan(-dx * xScale, dy * yScale);
  }, [viewport, pan]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.png';
    a.click();
  }, []);

  return (
    <div className="grapher">
      <div className="grapher__controls">
        {functions.map((fn, idx) => (
          <div key={fn.id} className="grapher__fn-row">
            <span
              className="grapher__fn-dot"
              style={{ background: fn.color, opacity: fn.visible ? 1 : 0.3 }}
              onClick={() => toggleVisible(fn.id)}
              title="Toggle visibility"
            />
            <input
              className="grapher__fn-input"
              type="text"
              value={fn.expression}
              placeholder={`f${idx + 1}(x) = ...`}
              onChange={e => updateFunction(fn.id, e.target.value)}
            />
            {functions.length > 1 && (
              <button className="grapher__btn grapher__btn--remove" onClick={() => removeFunction(fn.id)} title="Remove">✕</button>
            )}
          </div>
        ))}
        <div className="grapher__toolbar">
          {functions.length < 4 && (
            <button className="grapher__btn" onClick={addFunction}>+ Add</button>
          )}
          <button className={`grapher__btn ${showSpecialPoints ? 'grapher__btn--active' : ''}`} onClick={toggleSpecialPoints}>
            Roots/Extrema
          </button>
          <button className="grapher__btn" onClick={resetViewport}>Reset</button>
          <button className="grapher__btn" onClick={handleExport}>Export PNG</button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="grapher__canvas"
        width={600}
        height={420}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragRef.current ? 'grabbing' : 'crosshair' }}
      />

      <div className="grapher__hint">Scroll to zoom · Drag to pan</div>
    </div>
  );
}
