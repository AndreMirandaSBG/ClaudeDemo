import { useRef, useEffect, useCallback } from 'react';
import { useDiffEq } from '../hooks/useDiffEq';
import type { EquilibriumPoint } from '../hooks/useDiffEq';
import type { DiffEqMode, OdeMethod } from '../types/calculator';

// ─── Canvas utilities ─────────────────────────────────────────────────────────

function toCanv(
  wx: number, wy: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
  w: number, h: number,
) {
  return {
    cx: ((wx - xMin) / (xMax - xMin)) * w,
    cy: h - ((wy - yMin) / (yMax - yMin)) * h,
  };
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  xMin: number, xMax: number, yMin: number, yMax: number,
  w: number, h: number,
) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    const { cx } = toCanv(x, 0, xMin, xMax, yMin, yMax, w, h);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    const { cy } = toCanv(0, y, xMin, xMax, yMin, yMax, w, h);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  }

  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  const { cx: ax } = toCanv(0, 0, xMin, xMax, yMin, yMax, w, h);
  const { cy: ay } = toCanv(0, 0, xMin, xMax, yMin, yMax, w, h);
  ctx.beginPath(); ctx.moveTo(ax, 0); ctx.lineTo(ax, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(w, ay); ctx.stroke();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  dx: number, dy: number,
  len: number,
  color: string,
) {
  if (!isFinite(dx) || !isFinite(dy)) return;
  const ex = cx + dx * len;
  const ey = cy - dy * len;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - dx * len * 0.4, cy + dy * len * 0.4);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  const angle = Math.atan2(ey - cy, ex - cx);
  const aLen = len * 0.35;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - aLen * Math.cos(angle - 0.4), ey - aLen * Math.sin(angle - 0.4));
  ctx.lineTo(ex - aLen * Math.cos(angle + 0.4), ey - aLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

const EQ_COLORS: Record<string, string> = {
  stable: '#66bb6a',
  unstable: '#ef5350',
  saddle: '#ff9800',
  center: '#4fc3f7',
  'spiral-stable': '#66bb6a',
  'spiral-unstable': '#ef5350',
};

function drawEquilibria(
  ctx: CanvasRenderingContext2D,
  pts: EquilibriumPoint[],
  xMin: number, xMax: number, yMin: number, yMax: number,
  w: number, h: number,
) {
  for (const eq of pts) {
    const { cx, cy } = toCanv(eq.x, eq.y, xMin, xMax, yMin, yMax, w, h);
    const color = EQ_COLORS[eq.type] ?? '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.fillText(eq.type, cx + 8, cy + 3);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DiffEqSolver() {
  const hook = useDiffEq();
  const { state, setExpression, setExpression2, setMode, setMethod, setX0, setY0, setXEnd, solve } = hook;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 580, H = 380;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { xMin, xMax, yMin, yMax, mode } = state;

    drawBackground(ctx, xMin, xMax, yMin, yMax, W, H);

    const arrowLen = (W / (xMax - xMin)) * 0.35;

    if (mode === 'firstOrder') {
      const arrows = hook.getSlopeField();
      for (const a of arrows) {
        const { cx, cy } = toCanv(a.x, a.y, xMin, xMax, yMin, yMax, W, H);
        drawArrow(ctx, cx, cy, a.dx, a.dy, arrowLen, '#4a6fa5');
      }

      if (state.solution) {
        ctx.beginPath();
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 2.5;
        let pen = false;
        for (const p of state.solution) {
          if (!isFinite(p.y) || p.y < yMin - 10 || p.y > yMax + 10) { pen = false; continue; }
          const { cx, cy } = toCanv(p.x, p.y, xMin, xMax, yMin, yMax, W, H);
          pen ? ctx.lineTo(cx, cy) : ctx.moveTo(cx, cy);
          pen = true;
        }
        ctx.stroke();

        const { cx: startX, cy: startY } = toCanv(state.x0, state.y0, xMin, xMax, yMin, yMax, W, H);
        ctx.beginPath();
        ctx.arc(startX, startY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff9800';
        ctx.fill();
      }

      ctx.fillStyle = '#4a6fa5';
      ctx.font = '11px monospace';
      ctx.fillText("Slope field: dy/dx = f(x,y)", 6, 16);
      if (state.solution) {
        ctx.fillStyle = '#ff9800';
        ctx.fillText(`Solution (${state.method.toUpperCase()})`, 6, 30);
      }
    } else {
      const arrows = hook.getPhaseField();
      for (const a of arrows) {
        const { cx, cy } = toCanv(a.x, a.y, xMin, xMax, yMin, yMax, W, H);
        const mag = Math.sqrt(a.dx * a.dx + a.dy * a.dy);
        if (mag < 0.01) {
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#4a6fa5';
          ctx.fill();
        } else {
          drawArrow(ctx, cx, cy, a.dx, a.dy, arrowLen, '#4a6fa5');
        }
      }

      const equilibria = hook.getEquilibria();
      drawEquilibria(ctx, equilibria, xMin, xMax, yMin, yMax, W, H);

      ctx.fillStyle = '#4a6fa5';
      ctx.font = '11px monospace';
      ctx.fillText("Phase portrait: dx/dt = f, dy/dt = g", 6, 16);
      if (equilibria.length > 0) {
        ctx.fillStyle = '#fff';
        ctx.fillText(`${equilibria.length} equilibrium point(s) found`, 6, 30);
      }
    }
  }, [state, hook]);

  const handleSolve = useCallback(() => solve(), [solve]);

  return (
    <div className="diffeq-solver">
      <div className="diffeq-solver__controls">
        <div className="calculus-viz__mode-btns">
          {([
            { id: 'firstOrder', label: '1st Order' },
            { id: 'system2D', label: '2D System' },
          ] as { id: DiffEqMode; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${state.mode === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {state.mode === 'firstOrder' ? (
          <div className="calculus-viz__row">
            <label className="calculus-viz__label" htmlFor="de-expr">dy/dx =</label>
            <input
              id="de-expr"
              aria-label="dy/dx expression"
              className="grapher__fn-input"
              value={state.expression}
              onChange={e => setExpression(e.target.value)}
              placeholder="e.g. -y, x*y, sin(x) - y"
            />
          </div>
        ) : (
          <>
            <div className="calculus-viz__row">
              <label className="calculus-viz__label" htmlFor="de-fx">dx/dt =</label>
              <input
                id="de-fx"
                aria-label="dx/dt expression"
                className="grapher__fn-input"
                value={state.expression}
                onChange={e => setExpression(e.target.value)}
                placeholder="e.g. -y, x*(1-x)"
              />
            </div>
            <div className="calculus-viz__row">
              <label className="calculus-viz__label" htmlFor="de-gx">dy/dt =</label>
              <input
                id="de-gx"
                aria-label="dy/dt expression"
                className="grapher__fn-input"
                value={state.expression2}
                onChange={e => setExpression2(e.target.value)}
                placeholder="e.g. x, y*(1-y)"
              />
            </div>
          </>
        )}

        <div className="calculus-viz__mode-btns">
          {([
            { id: 'euler', label: 'Euler' },
            { id: 'rk4', label: 'RK4' },
          ] as { id: OdeMethod; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${state.method === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setMethod(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="diffeq-solver__ic">
          <div className="calculus-viz__row">
            <label className="calculus-viz__label" htmlFor="de-x0">x₀ =</label>
            <input
              id="de-x0"
              aria-label="initial x"
              type="number"
              step={0.1}
              className="calculus-viz__num-input"
              value={state.x0}
              onChange={e => setX0(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="calculus-viz__row">
            <label className="calculus-viz__label" htmlFor="de-y0">y₀ =</label>
            <input
              id="de-y0"
              aria-label="initial y"
              type="number"
              step={0.1}
              className="calculus-viz__num-input"
              value={state.y0}
              onChange={e => setY0(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="calculus-viz__row">
            <label className="calculus-viz__label" htmlFor="de-xend">x_end =</label>
            <input
              id="de-xend"
              aria-label="x end"
              type="number"
              step={0.5}
              className="calculus-viz__num-input"
              value={state.xEnd}
              onChange={e => setXEnd(parseFloat(e.target.value) || 6)}
            />
          </div>
        </div>

        {state.mode === 'firstOrder' && (
          <button className="grapher__btn" onClick={handleSolve} aria-label="Solve ODE">
            Solve
          </button>
        )}

        <div className="diffeq-solver__legend">
          <div className="diffeq-solver__legend-item">
            <span style={{ color: '#66bb6a' }}>●</span> Stable
          </div>
          <div className="diffeq-solver__legend-item">
            <span style={{ color: '#ef5350' }}>●</span> Unstable
          </div>
          <div className="diffeq-solver__legend-item">
            <span style={{ color: '#ff9800' }}>●</span> Saddle
          </div>
          <div className="diffeq-solver__legend-item">
            <span style={{ color: '#4fc3f7' }}>●</span> Center
          </div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="grapher__canvas"
        width={W}
        height={H}
        aria-label="diffeq canvas"
      />
    </div>
  );
}
