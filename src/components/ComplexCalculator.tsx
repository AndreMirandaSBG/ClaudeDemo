import { useRef, useEffect } from 'react';
import {
  useComplex,
  formatRectangular,
  formatPolar,
  complexModulus,
  complexArgument,
  complexNthRoots,
} from '../hooks/useComplex';
import type { ComplexNumber } from '../types/calculator';

// ─── Argand diagram drawing ───────────────────────────────────────────────────

function drawArgand(
  ctx: CanvasRenderingContext2D,
  points: ComplexNumber[],
  w: number,
  h: number,
) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  const maxR = Math.max(2, ...points.map(p => Math.max(Math.abs(p.re), Math.abs(p.im)))) * 1.3;
  const cx = w / 2, cy = h / 2;
  const scale = Math.min(w, h) / 2 / maxR;
  const mapRe = (re: number) => cx + re * scale;
  const mapIm = (im: number) => cy - im * scale;

  // Grid
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let v = -Math.floor(maxR); v <= Math.ceil(maxR); v++) {
    const px = mapRe(v);
    ctx.moveTo(px, 0); ctx.lineTo(px, h);
    const py = mapIm(v);
    ctx.moveTo(0, py); ctx.lineTo(w, py);
  }
  ctx.stroke();

  // Axes
  ctx.strokeStyle = '#4a4a8e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
  ctx.moveTo(0, cy); ctx.lineTo(w, cy);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let v = -Math.floor(maxR); v <= Math.ceil(maxR); v++) {
    if (v === 0) continue;
    ctx.fillText(String(v), mapRe(v), cy + 14);
    ctx.textAlign = 'right';
    ctx.fillText(String(v) + 'i', cx - 4, mapIm(v) + 4);
    ctx.textAlign = 'center';
  }
  ctx.fillText('Re', w - 14, cy - 6);
  ctx.fillText('Im', cx + 18, 12);

  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#95a5a6'];
  points.forEach((p, i) => {
    const px = mapRe(p.re), py = mapIm(p.im);
    const color = COLORS[i % COLORS.length];

    // Line from origin
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(px, py);
    ctx.stroke();

    // Dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatRectangular(p), px + 7, py - 3);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const BINARY_OPS = [
  { op: '+', label: '+' },
  { op: '-', label: '−' },
  { op: '*', label: '×' },
  { op: '/', label: '÷' },
];

const UNARY_OPS = [
  { op: 'conj', label: 'conj' },
  { op: 'mod', label: '|z|' },
  { op: 'arg', label: 'arg' },
  { op: 'roots2', label: '√z' },
  { op: 'roots3', label: '∛z' },
];

export function ComplexCalculator() {
  const {
    form,
    inputRe,
    inputIm,
    operand,
    pendingOp,
    result,
    plotPoints,
    history,
    error,
    setInputRe,
    setInputIm,
    applyOperation,
    compute,
    addToPlot,
    clearPlot,
    toggleForm,
    clearAll,
    useResult,
  } = useComplex();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawArgand(ctx, plotPoints, canvas.width, canvas.height);
  }, [plotPoints]);

  const currentComplex = { re: parseFloat(inputRe) || 0, im: parseFloat(inputIm) || 0 };

  return (
    <div className="complex">
      <div className="complex__left">
        <div className="complex__input-section">
          <div className="complex__input-row">
            <label className="complex__label">Re</label>
            <input
              className="complex__input"
              type="number"
              value={inputRe}
              onChange={e => setInputRe(e.target.value)}
              placeholder="0"
            />
            <span className="complex__plus">+</span>
            <input
              className="complex__input"
              type="number"
              value={inputIm}
              onChange={e => setInputIm(e.target.value)}
              placeholder="0"
            />
            <label className="complex__label">i</label>
          </div>
          <div className="complex__display">
            {form === 'rectangular'
              ? formatRectangular(currentComplex)
              : formatPolar(currentComplex)}
          </div>
        </div>

        {operand && pendingOp && (
          <div className="complex__pending">
            ({formatRectangular(operand)}) {pendingOp} ?
          </div>
        )}

        <div className="complex__binary-ops">
          {BINARY_OPS.map(({ op, label }) => (
            <button
              key={op}
              className={`complex__btn ${pendingOp === op ? 'complex__btn--active' : ''}`}
              onClick={() => applyOperation(op)}
            >
              {label}
            </button>
          ))}
          <button className="complex__btn complex__btn--equals" onClick={compute} disabled={!pendingOp}>
            =
          </button>
        </div>

        <div className="complex__unary-ops">
          {UNARY_OPS.map(({ op, label }) => (
            <button key={op} className="complex__btn" onClick={() => applyOperation(op)}>
              {label}
            </button>
          ))}
        </div>

        <div className="complex__action-row">
          <button className="complex__btn" onClick={toggleForm}>
            {form === 'rectangular' ? 'Polar' : 'Rect'}
          </button>
          <button className="complex__btn" onClick={addToPlot}>Plot</button>
          <button className="complex__btn" onClick={clearAll}>Clear</button>
        </div>

        {error && <div className="complex__error">{error}</div>}

        {result && (
          <div className="complex__result">
            <div className="complex__result-label">Result</div>
            <div className="complex__result-rect">{formatRectangular(result)}</div>
            <div className="complex__result-polar">{formatPolar(result)}</div>
            <div className="complex__result-info">
              |z| = {Math.round(complexModulus(result) * 1e6) / 1e6} &nbsp;
              arg = {Math.round(complexArgument(result) * 1e6) / 1e6} rad
            </div>
            {form === 'rectangular' && (
              <button className="complex__btn" onClick={useResult}>Use as input</button>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div className="complex__history">
            <div className="complex__history-header">History</div>
            {history.map(entry => (
              <div key={entry.id} className="complex__history-item">
                <span className="complex__history-expr">{entry.expression}</span>
                <span className="complex__history-result">= {formatRectangular(entry.result)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="complex__right">
        <div className="complex__diagram-header">
          Argand Diagram
          {plotPoints.length > 0 && (
            <button className="complex__btn complex__btn--small" onClick={clearPlot}>Clear</button>
          )}
        </div>
        <canvas ref={canvasRef} className="complex__canvas" width={320} height={320} />
        <div className="complex__hint">Click "Plot" to add a point to the diagram</div>
        {plotPoints.length > 0 && (
          <div className="complex__nth-roots-info">
            <strong>Nth Roots</strong> — use √z or ∛z to compute and auto-plot roots
          </div>
        )}
      </div>
    </div>
  );
}
