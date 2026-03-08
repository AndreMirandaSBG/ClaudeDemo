import { useRef, useEffect, useState, useCallback } from 'react';
import { useCalculus } from '../hooks/useCalculus';

// ─── Canvas utilities ─────────────────────────────────────────────────────────

function toCanvas(x: number, y: number, xMin: number, xMax: number, yMin: number, yMax: number, w: number, h: number) {
  return {
    cx: ((x - xMin) / (xMax - xMin)) * w,
    cy: h - ((y - yMin) / (yMax - yMin)) * h,
  };
}

function drawGrid(ctx: CanvasRenderingContext2D, xMin: number, xMax: number, yMin: number, yMax: number, w: number, h: number) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    const { cx } = toCanvas(x, 0, xMin, xMax, yMin, yMax, w, h);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    const { cy } = toCanvas(0, y, xMin, xMax, yMin, yMax, w, h);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
  }

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  const { cx: ox, cy: oy } = toCanvas(0, 0, xMin, xMax, yMin, yMax, w, h);
  ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  color: string,
  xMin: number, xMax: number, yMin: number, yMax: number,
  w: number, h: number,
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  let penDown = false;
  for (const p of pts) {
    if (!isFinite(p.y) || p.y < yMin * 4 || p.y > yMax * 4) { penDown = false; continue; }
    const { cx, cy } = toCanvas(p.x, p.y, xMin, xMax, yMin, yMax, w, h);
    if (!penDown) { ctx.moveTo(cx, cy); penDown = true; } else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalculusVisualizer() {
  const hook = useCalculus();
  const { state, setExpression, setMode, setDerivativeOrder, setIntegralA, setIntegralB, setTangentX } = hook;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [integralResult, setIntegralResult] = useState<{ value: number; steps: string[] } | null>(null);
  const [derivSteps, setDerivSteps] = useState<{ steps: string[]; value: number } | null>(null);

  const W = 580, H = 380;
  const yMin = -8, yMax = 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { xMin, xMax, mode, derivativeOrder, integralA, integralB, tangentX } = state;

    drawGrid(ctx, xMin, xMax, yMin, yMax, W, H);

    const fnPts = hook.sampleFunction();
    drawCurve(ctx, fnPts, '#4fc3f7', xMin, xMax, yMin, yMax, W, H);

    if (mode === 'derivative') {
      const colors = ['', '#ff9800', '#66bb6a', '#ce93d8'];
      for (let o = 1; o <= derivativeOrder; o++) {
        const dPts = hook.sampleDerivative(o);
        drawCurve(ctx, dPts, colors[o] ?? '#fff', xMin, xMax, yMin, yMax, W, H);
      }

      const tangent = hook.getTangentLine(tangentX, derivativeOrder);
      if (isFinite(tangent.slope)) {
        const { cx: cx1, cy: cy1 } = toCanvas(tangent.x1, tangent.y1, xMin, xMax, yMin, yMax, W, H);
        const { cx: cx2, cy: cy2 } = toCanvas(tangent.x2, tangent.y2, xMin, xMax, yMin, yMax, W, H);
        ctx.beginPath();
        ctx.strokeStyle = '#ef5350';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.moveTo(cx1, cy1);
        ctx.lineTo(cx2, cy2);
        ctx.stroke();
        ctx.setLineDash([]);

        const { cx: dotX, cy: dotY } = toCanvas(tangent.x0, tangent.y0, xMin, xMax, yMin, yMax, W, H);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ef5350';
        ctx.fill();
      }
    } else {
      const f = (x: number) => {
        const pts = hook.sampleFunction(1);
        return pts.length > 0 ? 0 : x;
      };
      // Shade integral region
      const n = 200;
      const step = (integralB - integralA) / n;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(79, 195, 247, 0.2)';
      const { cx: startX, cy: baseY } = toCanvas(integralA, 0, xMin, xMax, yMin, yMax, W, H);
      ctx.moveTo(startX, baseY);
      void f;

      const fnSamples = hook.sampleFunction(n);
      const aIdx = Math.round(((integralA - xMin) / (xMax - xMin)) * n);
      const bIdx = Math.round(((integralB - xMin) / (xMax - xMin)) * n);

      let shadesStarted = false;
      for (let i = Math.max(0, aIdx); i <= Math.min(fnSamples.length - 1, bIdx); i++) {
        const p = fnSamples[i];
        if (!isFinite(p.y)) continue;
        const { cx, cy } = toCanvas(p.x, p.y, xMin, xMax, yMin, yMax, W, H);
        if (!shadesStarted) { ctx.moveTo(cx, baseY); ctx.lineTo(cx, cy); shadesStarted = true; }
        else ctx.lineTo(cx, cy);
      }
      if (shadesStarted) {
        const lastIdx = Math.min(fnSamples.length - 1, bIdx);
        const { cx: endX } = toCanvas(fnSamples[lastIdx].x, 0, xMin, xMax, yMin, yMax, W, H);
        ctx.lineTo(endX, baseY);
        ctx.closePath();
        ctx.fill();
      }

      // Draw integral bounds
      for (const xBound of [integralA, integralB]) {
        const { cx: bx } = toCanvas(xBound, 0, xMin, xMax, yMin, yMax, W, H);
        ctx.beginPath();
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx, H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff9800';
        ctx.font = '11px monospace';
        ctx.fillText(xBound.toFixed(1), bx + 3, H - 5);
      }

      // Label integral value
      if (integralResult) {
        ctx.fillStyle = '#fff';
        ctx.font = '13px monospace';
        ctx.fillText(`∫ ≈ ${integralResult.value.toFixed(6)}`, 8, 20);
      }

      void step;
    }

    // Legend
    ctx.fillStyle = '#4fc3f7';
    ctx.font = '11px monospace';
    ctx.fillText('f(x)', 8, H - 30);
    if (mode === 'derivative') {
      ctx.fillStyle = '#ff9800';
      ctx.fillText("f'(x)", 40, H - 30);
      if (derivativeOrder >= 2) { ctx.fillStyle = '#66bb6a'; ctx.fillText("f''(x)", 76, H - 30); }
      if (derivativeOrder >= 3) { ctx.fillStyle = '#ce93d8'; ctx.fillText("f'''(x)", 116, H - 30); }
      ctx.fillStyle = '#ef5350';
      ctx.fillText('tangent', 160, H - 30);
    }
  }, [state, hook, integralResult]);

  const handleCompute = useCallback(() => {
    if (state.mode === 'integral') {
      const result = hook.computeIntegral();
      setIntegralResult(result);
      setDerivSteps(null);
    } else {
      const steps = hook.getDerivativeSteps(state.tangentX, state.derivativeOrder);
      setDerivSteps(steps);
      setIntegralResult(null);
    }
    setStepsOpen(false);
  }, [state, hook]);

  const activeSteps = state.mode === 'integral' ? integralResult?.steps : derivSteps?.steps;

  return (
    <div className="calculus-viz">
      <div className="calculus-viz__controls">
        <div className="calculus-viz__row">
          <label className="calculus-viz__label" htmlFor="calc-expr">f(x) =</label>
          <input
            id="calc-expr"
            aria-label="f(x) expression"
            className="grapher__fn-input"
            value={state.expression}
            onChange={e => setExpression(e.target.value)}
            placeholder="e.g. x^3 - 3*x"
          />
        </div>

        <div className="calculus-viz__mode-btns">
          {(['derivative', 'integral'] as const).map(m => (
            <button
              key={m}
              className={`grapher__btn ${state.mode === m ? 'grapher__btn--active' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'derivative' ? 'Derivative' : 'Integral'}
            </button>
          ))}
        </div>

        {state.mode === 'derivative' && (
          <div className="calculus-viz__row">
            <label className="calculus-viz__label">Order</label>
            <div className="calculus-viz__order-btns">
              {[1, 2, 3].map(o => (
                <button
                  key={o}
                  className={`grapher__btn ${state.derivativeOrder === o ? 'grapher__btn--active' : ''}`}
                  onClick={() => setDerivativeOrder(o)}
                >
                  {o}{o === 1 ? 'st' : o === 2 ? 'nd' : 'rd'}
                </button>
              ))}
            </div>
          </div>
        )}

        {state.mode === 'derivative' && (
          <div className="calculus-viz__row">
            <label className="calculus-viz__label" htmlFor="tangent-x">
              x₀ = {state.tangentX.toFixed(2)}
            </label>
            <input
              id="tangent-x"
              aria-label="tangent x"
              type="range"
              min={state.xMin}
              max={state.xMax}
              step={0.05}
              value={state.tangentX}
              onChange={e => setTangentX(parseFloat(e.target.value))}
              className="calculus-viz__slider"
            />
          </div>
        )}

        {state.mode === 'integral' && (
          <div className="calculus-viz__integral-inputs">
            <div className="calculus-viz__row">
              <label className="calculus-viz__label" htmlFor="integ-a">a =</label>
              <input
                id="integ-a"
                aria-label="integral lower bound"
                type="number"
                className="calculus-viz__num-input"
                value={state.integralA}
                onChange={e => setIntegralA(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="calculus-viz__row">
              <label className="calculus-viz__label" htmlFor="integ-b">b =</label>
              <input
                id="integ-b"
                aria-label="integral upper bound"
                type="number"
                className="calculus-viz__num-input"
                value={state.integralB}
                onChange={e => setIntegralB(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        )}

        <button className="grapher__btn" onClick={handleCompute} aria-label="Compute">
          Compute
        </button>

        {activeSteps && activeSteps.length > 0 && (
          <div className="calculus-viz__steps">
            <button
              className="grapher__btn"
              onClick={() => setStepsOpen(o => !o)}
            >
              {stepsOpen ? 'Hide' : 'Show'} Steps
            </button>
            {stepsOpen && (
              <ol className="calculus-viz__steps-list">
                {activeSteps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            )}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="grapher__canvas"
        width={W}
        height={H}
        aria-label="calculus canvas"
      />
    </div>
  );
}
