import { useRef, useEffect } from 'react';
import {
  useTensor,
  gradient,
  divergence,
  curl2D,
  hessian,
  jacobian,
  gradientDescentPath,
} from '../hooks/useTensor';
import type { TensorMode } from '../types/calculator';

// ─── Mode metadata ─────────────────────────────────────────────────────────────

const MODES: { id: TensorMode; label: string }[] = [
  { id: 'gradient', label: 'Gradient' },
  { id: 'divergence', label: 'Divergence' },
  { id: 'curl', label: 'Curl' },
  { id: 'jacobian', label: 'Jacobian' },
  { id: 'hessian', label: 'Hessian' },
  { id: 'gradient-descent', label: 'Grad Descent' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmt(v: number): string {
  if (!isFinite(v)) return 'N/A';
  return (Math.round(v * 1e6) / 1e6).toString();
}

function mapToCanvas(
  val: number,
  domainMin: number,
  domainMax: number,
  canvasSize: number,
): number {
  return ((val - domainMin) / (domainMax - domainMin)) * canvasSize;
}

function heatColor(
  value: number,
  minVal: number,
  maxVal: number,
): string {
  const range = maxVal - minVal || 1;
  const t = Math.max(0, Math.min(1, (value - minVal) / range));
  // blue (0,0,255) -> white (255,255,255) -> red (255,0,0)
  if (t < 0.5) {
    const s = t * 2;
    const r = Math.round(s * 255);
    const g = Math.round(s * 255);
    return `rgb(${r},${g},255)`;
  }
  const s = (t - 0.5) * 2;
  const g = Math.round((1 - s) * 255);
  const b = Math.round((1 - s) * 255);
  return `rgb(255,${g},${b})`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TensorCalc() {
  const {
    state,
    setMode,
    setFExpr,
    setFxExpr,
    setFyExpr,
    setLearningRate,
    setGdSteps,
    setStartX,
    setStartY,
  } = useTensor();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Compute results inline ────────────────────────────────────────────────

  let resultText = '';

  if (state.mode === 'gradient') {
    const [gx, gy] = gradient(state.fExpr, 0, 0);
    resultText = `∇f(0,0) = [${fmt(gx)}, ${fmt(gy)}]`;
  } else if (state.mode === 'divergence') {
    const div = divergence(state.fxExpr, state.fyExpr, 0, 0);
    resultText = `div F(0,0) = ${fmt(div)}`;
  } else if (state.mode === 'curl') {
    const c = curl2D(state.fxExpr, state.fyExpr, 0, 0);
    resultText = `curl F(0,0) = ${fmt(c)}`;
  } else if (state.mode === 'jacobian') {
    const J = jacobian(state.fExpr, state.fExpr, 1, 1);
    resultText =
      `J(1,1) = [[${fmt(J[0][0])}, ${fmt(J[0][1])}], [${fmt(J[1][0])}, ${fmt(J[1][1])}]]`;
  } else if (state.mode === 'hessian') {
    const H = hessian(state.fExpr, 0, 0);
    resultText =
      `H(0,0) = [[${fmt(H[0][0])}, ${fmt(H[0][1])}], [${fmt(H[1][0])}, ${fmt(H[1][1])}]]`;
  } else if (state.mode === 'gradient-descent') {
    const path = gradientDescentPath(
      state.fExpr,
      state.startX,
      state.startY,
      state.learningRate,
      state.gdSteps,
    );
    const last = path[path.length - 1];
    resultText =
      `Path length: ${path.length} steps | Final: (${fmt(last.x)}, ${fmt(last.y)}) z=${fmt(last.z)}`;
  }

  // ─── Canvas drawing ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const domainMin = -3;
    const domainMax = 3;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    if (state.mode === 'gradient') {
      // Draw grid of gradient arrows
      const gridN = 15;
      const cellW = W / gridN;
      const cellH = H / gridN;

      for (let row = 0; row < gridN; row++) {
        for (let col = 0; col < gridN; col++) {
          const x = domainMin + ((col + 0.5) / gridN) * (domainMax - domainMin);
          const y = domainMax - ((row + 0.5) / gridN) * (domainMax - domainMin);
          const [gx, gy] = gradient(state.fExpr, x, y);
          const mag = Math.sqrt(gx * gx + gy * gy);
          if (!isFinite(mag) || mag === 0) continue;

          const nx = gx / mag;
          const ny = gy / mag;
          const arrowLen = Math.min(cellW, cellH) * 0.4;

          const cx = (col + 0.5) * cellW;
          const cy = (row + 0.5) * cellH;

          // Color by magnitude (blue → red)
          const maxMag = 6;
          const t = Math.min(mag / maxMag, 1);
          const r = Math.round(t * 255);
          const b = Math.round((1 - t) * 255);
          ctx.strokeStyle = `rgb(${r},0,${b})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);

          const ex = cx + nx * arrowLen;
          const ey = cy - ny * arrowLen; // canvas y is flipped

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // Arrowhead
          const headLen = 4;
          const angle = Math.atan2(ey - cy, ex - cx);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(
            ex - headLen * Math.cos(angle - Math.PI / 6),
            ey - headLen * Math.sin(angle - Math.PI / 6),
          );
          ctx.moveTo(ex, ey);
          ctx.lineTo(
            ex - headLen * Math.cos(angle + Math.PI / 6),
            ey - headLen * Math.sin(angle + Math.PI / 6),
          );
          ctx.stroke();
        }
      }

      // Label at origin
      const [gx0, gy0] = gradient(state.fExpr, 0, 0);
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`∇f at (0,0) = [${fmt(gx0)}, ${fmt(gy0)}]`, 8, 20);

    } else if (state.mode === 'divergence' || state.mode === 'curl') {
      // Heat map
      const gridN = 40;
      const cellW = W / gridN;
      const cellH = H / gridN;
      const values: number[] = [];

      for (let row = 0; row < gridN; row++) {
        for (let col = 0; col < gridN; col++) {
          const x = domainMin + ((col + 0.5) / gridN) * (domainMax - domainMin);
          const y = domainMax - ((row + 0.5) / gridN) * (domainMax - domainMin);
          const v =
            state.mode === 'divergence'
              ? divergence(state.fxExpr, state.fyExpr, x, y)
              : curl2D(state.fxExpr, state.fyExpr, x, y);
          values.push(isFinite(v) ? v : 0);
        }
      }

      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);

      for (let row = 0; row < gridN; row++) {
        for (let col = 0; col < gridN; col++) {
          const val = values[row * gridN + col];
          ctx.fillStyle = heatColor(val, minVal, maxVal);
          ctx.fillRect(col * cellW, row * cellH, cellW + 1, cellH + 1);
        }
      }

    } else if (state.mode === 'jacobian') {
      // Draw 2x2 Jacobian heat map cells
      const J = jacobian(state.fExpr, state.fExpr, 1, 1);
      const labels = [
        { label: '∂f₁/∂x', val: J[0][0] },
        { label: '∂f₁/∂y', val: J[0][1] },
        { label: '∂f₂/∂x', val: J[1][0] },
        { label: '∂f₂/∂y', val: J[1][1] },
      ];
      const allVals = labels.map(l => l.val);
      const minVal = Math.min(...allVals);
      const maxVal = Math.max(...allVals);
      const cw = W / 2;
      const ch = H / 2;

      labels.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        ctx.fillStyle = heatColor(item.val, minVal, maxVal);
        ctx.fillRect(col * cw, row * ch, cw, ch);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, col * cw + cw / 2, row * ch + ch / 2 - 10);
        ctx.fillText(fmt(item.val), col * cw + cw / 2, row * ch + ch / 2 + 14);
      });

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(0, 0, W, H);
      ctx.beginPath();
      ctx.moveTo(cw, 0); ctx.lineTo(cw, H);
      ctx.moveTo(0, ch); ctx.lineTo(W, ch);
      ctx.stroke();

    } else if (state.mode === 'hessian') {
      // Draw 2x2 Hessian heat map cells
      const Hess = hessian(state.fExpr, 0, 0);
      const labels = [
        { label: 'f_xx', val: Hess[0][0] },
        { label: 'f_xy', val: Hess[0][1] },
        { label: 'f_yx', val: Hess[1][0] },
        { label: 'f_yy', val: Hess[1][1] },
      ];
      const allVals = labels.map(l => l.val);
      const minVal = Math.min(...allVals);
      const maxVal = Math.max(...allVals);
      const cw = W / 2;
      const ch = H / 2;

      labels.forEach((item, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        // Warm = positive, cool = negative, white = near zero
        const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal), 1e-9);
        const t = item.val / absMax; // [-1, 1]
        let r: number, g: number, b: number;
        if (t >= 0) {
          r = 255;
          g = Math.round((1 - t) * 255);
          b = Math.round((1 - t) * 255);
        } else {
          r = Math.round((1 + t) * 255);
          g = Math.round((1 + t) * 255);
          b = 255;
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(col * cw, row * ch, cw, ch);
        ctx.fillStyle = '#111';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, col * cw + cw / 2, row * ch + ch / 2 - 10);
        ctx.fillText(fmt(item.val), col * cw + cw / 2, row * ch + ch / 2 + 14);
      });

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(0, 0, W, H);
      ctx.beginPath();
      ctx.moveTo(cw, 0); ctx.lineTo(cw, H);
      ctx.moveTo(0, ch); ctx.lineTo(W, ch);
      ctx.stroke();

    } else if (state.mode === 'gradient-descent') {
      // Heat map background
      const gridN = 40;
      const cellW = W / gridN;
      const cellH = H / gridN;
      const values: number[] = [];

      for (let row = 0; row < gridN; row++) {
        for (let col = 0; col < gridN; col++) {
          const x = domainMin + ((col + 0.5) / gridN) * (domainMax - domainMin);
          const y = domainMax - ((row + 0.5) / gridN) * (domainMax - domainMin);
          const v = isFinite(x) && isFinite(y)
            ? (() => { try { return Number(eval(`(${state.fExpr.replace(/\^/g, '**').replace(/x/g, `(${x})`).replace(/y/g, `(${y})`)})`)); } catch { return 0; } })()
            : 0;
          values.push(isFinite(v) ? v : 0);
        }
      }

      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);

      for (let row = 0; row < gridN; row++) {
        for (let col = 0; col < gridN; col++) {
          const val = values[row * gridN + col];
          ctx.fillStyle = heatColor(val, minVal, maxVal);
          ctx.fillRect(col * cellW, row * cellH, cellW + 1, cellH + 1);
        }
      }

      // Descent path
      const path = gradientDescentPath(
        state.fExpr,
        state.startX,
        state.startY,
        state.learningRate,
        state.gdSteps,
      );

      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();

      path.forEach((pt, i) => {
        const cx = mapToCanvas(pt.x, domainMin, domainMax, W);
        const cy = mapToCanvas(-pt.y, -domainMax, -domainMin, H);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Dots along path
      path.forEach(pt => {
        const cx = mapToCanvas(pt.x, domainMin, domainMax, W);
        const cy = mapToCanvas(-pt.y, -domainMax, -domainMin, H);
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [
    state.mode,
    state.fExpr,
    state.fxExpr,
    state.fyExpr,
    state.startX,
    state.startY,
    state.learningRate,
    state.gdSteps,
  ]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const showFExpr =
    state.mode === 'gradient' ||
    state.mode === 'jacobian' ||
    state.mode === 'hessian' ||
    state.mode === 'gradient-descent';

  const showVectorInputs =
    state.mode === 'divergence' || state.mode === 'curl';

  return (
    <div className="tensor-calc">
      <div className="tensor-calc__controls">
        <div className="tensor-calc__mode-btns">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`grapher__btn${state.mode === m.id ? ' grapher__btn--active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="tensor-calc__inputs">
          {showFExpr && (
            <div className="tensor-calc__row">
              <label htmlFor="tensor-f-expr">f(x,y) =</label>
              <input
                id="tensor-f-expr"
                type="text"
                aria-label="f(x,y) expression"
                value={state.fExpr}
                onChange={e => setFExpr(e.target.value)}
              />
            </div>
          )}

          {showVectorInputs && (
            <>
              <div className="tensor-calc__row">
                <label htmlFor="tensor-fx-expr">Fx =</label>
                <input
                  id="tensor-fx-expr"
                  type="text"
                  aria-label="Fx expression"
                  value={state.fxExpr}
                  onChange={e => setFxExpr(e.target.value)}
                />
              </div>
              <div className="tensor-calc__row">
                <label htmlFor="tensor-fy-expr">Fy =</label>
                <input
                  id="tensor-fy-expr"
                  type="text"
                  aria-label="Fy expression"
                  value={state.fyExpr}
                  onChange={e => setFyExpr(e.target.value)}
                />
              </div>
            </>
          )}

          {state.mode === 'gradient-descent' && (
            <>
              <div className="tensor-calc__row">
                <label htmlFor="tensor-start-x">Start X:</label>
                <input
                  id="tensor-start-x"
                  type="number"
                  aria-label="start x"
                  value={state.startX}
                  onChange={e => setStartX(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="tensor-calc__row">
                <label htmlFor="tensor-start-y">Start Y:</label>
                <input
                  id="tensor-start-y"
                  type="number"
                  aria-label="start y"
                  value={state.startY}
                  onChange={e => setStartY(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="tensor-calc__row">
                <label htmlFor="tensor-lr">Learning Rate:</label>
                <input
                  id="tensor-lr"
                  type="number"
                  aria-label="learning rate"
                  value={state.learningRate}
                  step={0.01}
                  onChange={e => setLearningRate(parseFloat(e.target.value) || 0.01)}
                />
              </div>
              <div className="tensor-calc__row">
                <label htmlFor="tensor-steps">Steps:</label>
                <input
                  id="tensor-steps"
                  type="number"
                  aria-label="steps"
                  value={state.gdSteps}
                  onChange={e => setGdSteps(parseInt(e.target.value, 10) || 1)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        aria-label="tensor visualization"
        width={580}
        height={380}
      />

      <div className="tensor-calc__results">
        <span>{resultText}</span>
      </div>
    </div>
  );
}
