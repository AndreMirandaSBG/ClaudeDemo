import { useRef, useEffect, useCallback } from 'react';
import { useMatrix } from '../hooks/useMatrix';
import type { MatrixOp, MatrixSize } from '../types/calculator';

// ─── Canvas: 2D transformation visualization ─────────────────────────────────

function drawTransform(
  ctx: CanvasRenderingContext2D,
  A: number[][],
  t: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const scale = 60;

  function world(px: number, py: number) {
    return { x: cx + px * scale, y: cy - py * scale };
  }

  // Grid
  ctx.strokeStyle = '#2a2a4a';
  ctx.lineWidth = 0.5;
  for (let g = -4; g <= 4; g++) {
    const p1 = world(g, -4);
    const p2 = world(g, 4);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    const p3 = world(-4, g);
    const p4 = world(4, g);
    ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(world(-4, 0).x, world(-4, 0).y); ctx.lineTo(world(4, 0).x, world(4, 0).y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(world(0, -4).x, world(0, -4).y); ctx.lineTo(world(0, 4).x, world(0, 4).y); ctx.stroke();

  // Unit square corners (original)
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]];

  // Interpolate: corner * (identity * (1-t) + A * t)
  const transform = (px: number, py: number) => {
    const tx = (1 - t) * px + t * (A[0][0] * px + A[0][1] * py);
    const ty = (1 - t) * py + t * (A[1][0] * px + A[1][1] * py);
    return { tx, ty };
  };

  // Draw original square in blue
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  sq.forEach(([px, py], i) => {
    const { x, y } = world(px, py);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw transformed square in red
  ctx.strokeStyle = '#ef5350';
  ctx.lineWidth = 2;
  ctx.beginPath();
  sq.forEach(([px, py], i) => {
    const { tx, ty } = transform(px, py);
    const { x, y } = world(tx, ty);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  // Basis vectors
  const e1t = transform(1, 0);
  const e2t = transform(0, 1);
  const arrowHead = (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - 10 * Math.cos(angle - 0.3), to.y - 10 * Math.sin(angle - 0.3));
    ctx.lineTo(to.x - 10 * Math.cos(angle + 0.3), to.y - 10 * Math.sin(angle + 0.3));
    ctx.closePath();
    ctx.fill();
  };

  const origin = world(0, 0);
  arrowHead(origin, world(e1t.tx, e1t.ty), '#ff9800');
  arrowHead(origin, world(e2t.tx, e2t.ty), '#66bb6a');

  ctx.font = '11px monospace';
  ctx.fillStyle = '#ff9800';
  ctx.fillText('Ae₁', world(e1t.tx, e1t.ty).x + 5, world(e1t.tx, e1t.ty).y - 5);
  ctx.fillStyle = '#66bb6a';
  ctx.fillText('Ae₂', world(e2t.tx, e2t.ty).x + 5, world(e2t.tx, e2t.ty).y - 5);
}

function drawEigenVectors(
  ctx: CanvasRenderingContext2D,
  A: number[][],
  eigenvalues: { re: number; im: number }[],
  eigenvectors: number[][],
  w: number,
  h: number,
) {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2;
  const scale = 60;

  const world = (px: number, py: number) => ({ x: cx + px * scale, y: cy - py * scale });

  // Grid + axes
  ctx.strokeStyle = '#2a2a4a'; ctx.lineWidth = 0.5;
  for (let g = -4; g <= 4; g++) {
    ctx.beginPath(); ctx.moveTo(world(g, -4).x, world(g, -4).y); ctx.lineTo(world(g, 4).x, world(g, 4).y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(world(-4, g).x, world(-4, g).y); ctx.lineTo(world(4, g).x, world(4, g).y); ctx.stroke();
  }
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(world(-4, 0).x, world(-4, 0).y); ctx.lineTo(world(4, 0).x, world(4, 0).y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(world(0, -4).x, world(0, -4).y); ctx.lineTo(world(0, 4).x, world(0, 4).y); ctx.stroke();

  // Draw transformation effect on unit circle
  ctx.beginPath();
  ctx.strokeStyle = '#4fc3f7';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * 2 * Math.PI;
    const px = Math.cos(angle);
    const py = Math.sin(angle);
    const tx = A[0][0] * px + A[0][1] * py;
    const ty = A[1][0] * px + A[1][1] * py;
    const { x, y } = world(tx, ty);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  const colors = ['#ff9800', '#66bb6a'];
  const origin = world(0, 0);
  eigenvectors.forEach((ev, i) => {
    if (!ev || ev.length < 2) return;
    const lambda = eigenvalues[i];
    const color = colors[i % colors.length];
    const scale2 = lambda ? Math.min(Math.max(Math.abs(lambda.re), 0.5), 3) : 1;
    const end = world(ev[0] * scale2 * 2, ev[1] * scale2 * 2);
    const start = world(-ev[0] * scale2 * 2, -ev[1] * scale2 * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    ctx.fillStyle = color; ctx.font = '11px monospace';
    ctx.fillText(`λ=${lambda ? lambda.re.toFixed(2) : '?'}`, end.x + 4, end.y);
  });

  ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
  ctx.fillText('Blue ellipse = unit circle transformed by A', 4, 14);
  ctx.fillText('Lines = eigenvector directions', 4, 28);

  void origin;
}

// ─── Matrix editor grid ───────────────────────────────────────────────────────

function MatrixGrid({
  label,
  matrix,
  size,
  onCell,
}: {
  label: string;
  matrix: number[][];
  size: number;
  onCell: (r: number, c: number, v: number) => void;
}) {
  return (
    <div className="matrix-workspace__grid-wrap">
      <span className="matrix-workspace__grid-label">{label}</span>
      <table className="matrix-workspace__grid" aria-label={`matrix ${label}`}>
        <tbody>
          {Array.from({ length: size }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: size }, (_, c) => (
                <td key={c}>
                  <input
                    aria-label={`${label}[${r + 1}][${c + 1}]`}
                    type="number"
                    className="matrix-workspace__cell"
                    value={matrix[r]?.[c] ?? 0}
                    onChange={e => onCell(r, c, parseFloat(e.target.value) || 0)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function MatrixDisplay({ label, m }: { label: string; m: number[][] }) {
  return (
    <div className="matrix-workspace__result-matrix">
      <span className="matrix-workspace__result-label">{label}</span>
      <table className="matrix-workspace__grid">
        <tbody>
          {m.map((row, r) => (
            <tr key={r}>
              {row.map((v, c) => (
                <td key={c} className="matrix-workspace__cell matrix-workspace__cell--result">
                  {v.toFixed(3)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const OPS: { id: MatrixOp; label: string }[] = [
  { id: 'determinant', label: 'det(A)' },
  { id: 'inverse', label: 'A⁻¹' },
  { id: 'multiply', label: 'A × B' },
  { id: 'add', label: 'A + B' },
  { id: 'lu', label: 'LU' },
  { id: 'qr', label: 'QR' },
  { id: 'eigen', label: 'Eigen' },
  { id: 'transform', label: 'Transform' },
];

export function MatrixWorkspace() {
  const { state, setCell, setOp, setSize, setAnimateT, compute } = useMatrix();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 300, H = 280;
  const showCanvas = state.op === 'transform' || state.op === 'eigen';

  const handleCellA = useCallback((r: number, c: number, v: number) => setCell('A', r, c, v), [setCell]);
  const handleCellB = useCallback((r: number, c: number, v: number) => setCell('B', r, c, v), [setCell]);

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (state.op === 'transform') {
      drawTransform(ctx, state.matrixA, state.animateT, W, H);
    } else if (state.op === 'eigen' && state.result?.eigenvectors && state.result?.eigenvalues) {
      drawEigenVectors(ctx, state.matrixA, state.result.eigenvalues, state.result.eigenvectors, W, H);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#555';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press Compute to visualize', W / 2, H / 2);
      ctx.textAlign = 'left';
    }
  }, [state, showCanvas]);

  const { result, size, op } = state;
  const needsB = op === 'add' || op === 'multiply';

  return (
    <div className="matrix-workspace">
      <div className="matrix-workspace__controls">
        <div className="matrix-workspace__size-btns">
          {([2, 3] as MatrixSize[]).map(s => (
            <button
              key={s}
              className={`grapher__btn ${size === s ? 'grapher__btn--active' : ''}`}
              onClick={() => setSize(s)}
              aria-label={`${s}×${s}`}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        <div className="matrix-workspace__grids">
          <MatrixGrid label="A" matrix={state.matrixA} size={size} onCell={handleCellA} />
          {needsB && <MatrixGrid label="B" matrix={state.matrixB} size={size} onCell={handleCellB} />}
        </div>

        <div className="matrix-workspace__op-btns">
          {OPS.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${op === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setOp(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {op === 'transform' && (
          <div className="calculus-viz__row">
            <label className="calculus-viz__label" htmlFor="anim-t">
              t = {state.animateT.toFixed(2)}
            </label>
            <input
              id="anim-t"
              aria-label="animation t"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={state.animateT}
              onChange={e => setAnimateT(parseFloat(e.target.value))}
              className="calculus-viz__slider"
            />
          </div>
        )}

        <button className="grapher__btn" onClick={compute} aria-label="Compute matrix operation">
          Compute
        </button>

        {result && (
          <div className="matrix-workspace__result">
            {result.error && <p className="matrix-workspace__error">{result.error}</p>}

            {result.scalar !== undefined && (
              <p className="matrix-workspace__scalar">
                = <strong>{result.scalar.toFixed(6)}</strong>
              </p>
            )}

            {result.matrix && <MatrixDisplay label="Result" m={result.matrix} />}
            {result.L && <MatrixDisplay label="L" m={result.L} />}
            {result.U && <MatrixDisplay label="U" m={result.U} />}
            {result.Q && <MatrixDisplay label="Q" m={result.Q} />}
            {result.R && <MatrixDisplay label="R" m={result.R} />}

            {result.eigenvalues && (
              <div className="matrix-workspace__eigenvalues">
                {result.eigenvalues.map((ev, i) => (
                  <div key={i} className="matrix-workspace__ev-row">
                    λ{i + 1} = {ev.im === 0
                      ? ev.re.toFixed(6)
                      : `${ev.re.toFixed(4)} ${ev.im >= 0 ? '+' : '−'} ${Math.abs(ev.im).toFixed(4)}i`}
                  </div>
                ))}
              </div>
            )}

            {result.steps.length > 0 && (
              <ol className="calculus-viz__steps-list">
                {result.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            )}
          </div>
        )}
      </div>

      {showCanvas && (
        <canvas
          ref={canvasRef}
          className="grapher__canvas matrix-workspace__canvas"
          width={W}
          height={H}
          aria-label="matrix canvas"
        />
      )}
    </div>
  );
}
