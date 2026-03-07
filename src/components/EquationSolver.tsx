import { useRef, useEffect, useCallback, useState } from 'react';
import { useSolver, solveTrigEquation, solveLinear2x2 } from '../hooks/useSolver';
import type { SolverResult, TrigFunc } from '../types/calculator';

// ─── Root canvas visualizer ───────────────────────────────────────────────────

function drawRoots(canvas: HTMLCanvasElement, result: SolverResult) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  const hasComplex = result.roots.some(r => !r.isReal);

  if (hasComplex) {
    // Complex plane
    const cx = w / 2, cy = h / 2;
    const allRe = result.roots.map(r => Math.abs(r.re));
    const allIm = result.roots.map(r => Math.abs(r.im));
    const maxVal = Math.max(1, ...allRe, ...allIm) * 1.3;
    const scale = Math.min(cx, cy) / maxVal * 0.85;

    // Axes
    ctx.strokeStyle = '#4a4a8e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Re', w - 14, cy - 4);
    ctx.fillText('Im', cx + 4, 12);

    // Roots
    for (const root of result.roots) {
      const sx = cx + root.re * scale;
      const sy = cy - root.im * scale;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = root.isReal ? '#f1c40f' : '#e74c3c';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      const label = root.isReal
        ? root.re.toFixed(3)
        : `${root.re.toFixed(2)}${root.im >= 0 ? '+' : ''}${root.im.toFixed(2)}i`;
      ctx.fillText(label, sx + 7, sy + 4);
    }

    // Legend
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath(); ctx.arc(12, h - 20, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('real', 20, h - 16);

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.arc(62, h - 20, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('complex', 70, h - 16);
  } else {
    // Number line (real roots only)
    const cy = h / 2;
    const allX = result.roots.map(r => r.re);
    const maxX = Math.max(1, ...allX.map(Math.abs)) * 1.3;
    const scaleX = (w * 0.9) / (2 * maxX);
    const cx = w / 2;

    ctx.strokeStyle = '#4a4a8e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, cy); ctx.lineTo(w - 20, cy);
    ctx.stroke();

    // Tick marks
    const step = Math.pow(10, Math.floor(Math.log10(maxX)));
    for (let x = -maxX; x <= maxX; x += step) {
      const sx = cx + x * scaleX;
      ctx.beginPath();
      ctx.moveTo(sx, cy - 4); ctx.lineTo(sx, cy + 4);
      ctx.strokeStyle = '#4a4a8e';
      ctx.stroke();
      if (Math.abs(x) > step * 0.01) {
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(x.toFixed(1), sx, cy + 16);
      }
    }

    // Plot real roots
    for (const root of result.roots) {
      const sx = cx + root.re * scaleX;
      ctx.beginPath();
      ctx.arc(sx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f1c40f';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(root.re.toFixed(3), sx, cy - 14);
    }
  }
}

// ─── Linear system 2×2 input ─────────────────────────────────────────────────

function LinearSystemPanel({ onSolve }: { onSolve: (res: SolverResult) => void }) {
  const [a11, setA11] = useState('2');
  const [a12, setA12] = useState('1');
  const [a21, setA21] = useState('1');
  const [a22, setA22] = useState('-1');
  const [b1, setB1] = useState('5');
  const [b2, setB2] = useState('1');

  const handleSolve = () => {
    const nums = [a11, a12, a21, a22, b1, b2].map(Number);
    if (nums.some(n => !isFinite(n))) return;
    const result = solveLinear2x2([[nums[0], nums[1]], [nums[2], nums[3]]], [nums[4], nums[5]]);
    onSolve(result);
  };

  const inputClass = 'solver__matrix-input';
  return (
    <div className="solver__linear">
      <p className="solver__linear-hint">Enter coefficients for: a₁₁x + a₁₂y = b₁ and a₂₁x + a₂₂y = b₂</p>
      <div className="solver__matrix-row">
        <input className={inputClass} value={a11} onChange={e => setA11(e.target.value)} aria-label="a11" placeholder="a₁₁" />
        <span>x +</span>
        <input className={inputClass} value={a12} onChange={e => setA12(e.target.value)} aria-label="a12" placeholder="a₁₂" />
        <span>y =</span>
        <input className={inputClass} value={b1} onChange={e => setB1(e.target.value)} aria-label="b1" placeholder="b₁" />
      </div>
      <div className="solver__matrix-row">
        <input className={inputClass} value={a21} onChange={e => setA21(e.target.value)} aria-label="a21" placeholder="a₂₁" />
        <span>x +</span>
        <input className={inputClass} value={a22} onChange={e => setA22(e.target.value)} aria-label="a22" placeholder="a₂₂" />
        <span>y =</span>
        <input className={inputClass} value={b2} onChange={e => setB2(e.target.value)} aria-label="b2" placeholder="b₂" />
      </div>
      <button className="grapher__btn grapher__btn--active" onClick={handleSolve}>Solve System</button>
    </div>
  );
}

// ─── Trig equation panel ──────────────────────────────────────────────────────

function TrigPanel({ onSolve }: { onSolve: (res: SolverResult) => void }) {
  const [func, setFunc] = useState<TrigFunc>('sin');
  const [rhs, setRhs] = useState('0.5');

  const handleSolve = () => {
    const rhsVal = parseFloat(rhs);
    if (!isFinite(rhsVal)) return;
    onSolve(solveTrigEquation(func, rhsVal));
  };

  return (
    <div className="solver__trig">
      <div className="solver__trig-row">
        <select
          className="solver__select"
          value={func}
          onChange={e => setFunc(e.target.value as TrigFunc)}
          aria-label="trig function"
        >
          <option value="sin">sin(x)</option>
          <option value="cos">cos(x)</option>
          <option value="tan">tan(x)</option>
        </select>
        <span>=</span>
        <input
          type="number"
          step="0.1"
          className="solver__matrix-input"
          value={rhs}
          onChange={e => setRhs(e.target.value)}
          aria-label="right-hand side"
        />
      </div>
      <button className="grapher__btn grapher__btn--active" onClick={handleSolve}>Solve</button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type SolverMode = 'polynomial' | 'linear' | 'trig';

export function EquationSolver() {
  const { input, result, stepsOpen, setInput, solve, clearResult, toggleSteps } = useSolver();
  const [mode, setMode] = useState<SolverMode>('polynomial');
  const [externalResult, setExternalResult] = useState<SolverResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeResult = mode === 'polynomial' ? result : externalResult;

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') solve();
  }, [solve]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeResult || activeResult.error) return;
    drawRoots(canvas, activeResult);
  }, [activeResult]);

  return (
    <div className="solver">
      <div className="solver__controls">
        <div className="solver__mode-btns">
          {(['polynomial', 'linear', 'trig'] as SolverMode[]).map(m => (
            <button
              key={m}
              className={`grapher__btn ${mode === m ? 'grapher__btn--active' : ''}`}
              onClick={() => { setMode(m); setExternalResult(null); clearResult(); }}
            >
              {m === 'polynomial' ? 'Polynomial' : m === 'linear' ? '2×2 Linear' : 'Trig'}
            </button>
          ))}
        </div>

        {mode === 'polynomial' && (
          <div className="solver__poly-input">
            <input
              className="grapher__fn-input solver__input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "x^2 - 3x + 2" or "1 -3 2"'
              aria-label="polynomial input"
            />
            <div className="solver__btns">
              <button className="grapher__btn grapher__btn--active" onClick={solve}>Solve</button>
              {result && <button className="grapher__btn" onClick={clearResult}>Clear</button>}
            </div>
          </div>
        )}

        {mode === 'linear' && (
          <LinearSystemPanel onSolve={res => setExternalResult(res)} />
        )}

        {mode === 'trig' && (
          <TrigPanel onSolve={res => setExternalResult(res)} />
        )}

        {activeResult?.error && (
          <div className="solver__error">Invalid input: {activeResult.error}</div>
        )}

        {activeResult && !activeResult.error && (
          <div className="solver__results">
            <div className="solver__roots-header">
              <span className="solver__roots-title">
                {mode === 'linear'
                  ? `Solutions (x, y):`
                  : `Roots (degree ${activeResult.degree}):`}
              </span>
              <button className="grapher__btn" onClick={toggleSteps}>
                {stepsOpen ? 'Hide Steps' : 'Show Steps'}
              </button>
            </div>

            <div className="solver__roots-list">
              {activeResult.roots.map((root, i) => {
                if (mode === 'linear') {
                  const varName = i === 0 ? 'x' : 'y';
                  return (
                    <div key={i} className="solver__root">
                      <span className="solver__root-label">{varName} =</span>
                      <span className="solver__root-value">{root.re.toFixed(6)}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} className={`solver__root ${root.isReal ? '' : 'solver__root--complex'}`}>
                    <span className="solver__root-label">x{i + 1} =</span>
                    <span className="solver__root-value">
                      {root.isReal
                        ? root.re.toFixed(6)
                        : `${root.re.toFixed(4)} ${root.im >= 0 ? '+' : '−'} ${Math.abs(root.im).toFixed(4)}i`}
                    </span>
                    <span className="solver__root-type">{root.isReal ? '' : '(complex)'}</span>
                  </div>
                );
              })}
            </div>

            {stepsOpen && (
              <ol className="solver__steps">
                {activeResult.steps.map((step, i) => (
                  <li key={i} className="solver__step">
                    <span>{step.description}</span>
                    {step.formula && <code className="solver__formula">{step.formula}</code>}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="solver__canvas"
        width={540}
        height={200}
      />
      {activeResult && !activeResult.error && (
        <div className="grapher__hint">
          {activeResult.roots.some(r => !r.isReal)
            ? 'Complex plane: yellow = real roots, red = complex roots'
            : 'Number line: yellow dots = real roots'}
        </div>
      )}
    </div>
  );
}
