import { useRef, useEffect, useCallback } from 'react';
import { useNumberTheory } from '../hooks/useNumberTheory';
import type { FactorNode } from '../hooks/useNumberTheory';
import type { NumberTheoryMode, SequenceType } from '../types/calculator';

// ─── Canvas: Factor Tree ───────────────────────────────────────────────────────

function drawFactorTree(
  ctx: CanvasRenderingContext2D,
  node: FactorNode,
  x: number,
  y: number,
  spread: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = node.isPrime ? '#2ecc71' : '#3498db';
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(node.value), x, y);

  if (node.children.length === 2) {
    const childY = y + 60;
    const lx = x - spread;
    const rx = x + spread;

    // Lines to children
    ctx.strokeStyle = '#556';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(lx, childY - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(rx, childY - 18); ctx.stroke();

    const nextSpread = Math.max(spread * 0.6, 20);
    drawFactorTree(ctx, node.children[0], lx, childY, nextSpread, w, h);
    drawFactorTree(ctx, node.children[1], rx, childY, nextSpread, w, h);
  }
}

// ─── Canvas: Ulam Spiral ──────────────────────────────────────────────────────

function drawUlamSpiral(
  ctx: CanvasRenderingContext2D,
  cells: Array<{ n: number; x: number; y: number; prime: boolean }>,
  size: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = '#0d1b2e';
  ctx.fillRect(0, 0, w, h);

  const cellSize = Math.floor(Math.min(w, h) / size);
  const offsetX = Math.floor((w - size * cellSize) / 2);
  const offsetY = Math.floor((h - size * cellSize) / 2);
  const half = Math.floor(size / 2);

  for (const cell of cells) {
    const px = offsetX + (cell.x + half) * cellSize;
    const py = offsetY + (cell.y + half) * cellSize;
    ctx.fillStyle = cell.prime ? '#f39c12' : '#1a2a3e';
    ctx.fillRect(px + 1, py + 1, cellSize - 1, cellSize - 1);
    if (cell.n === 1) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(px + 1, py + 1, cellSize - 1, cellSize - 1);
    }
  }
}

// ─── Canvas: Sieve ────────────────────────────────────────────────────────────

function drawSieve(
  ctx: CanvasRenderingContext2D,
  isPrime: boolean[],
  w: number,
  h: number,
) {
  ctx.fillStyle = '#0d1b2e';
  ctx.fillRect(0, 0, w, h);

  const N = isPrime.length;
  const cols = Math.ceil(Math.sqrt(N));
  const cellSize = Math.max(Math.floor(Math.min(w / cols, 22)), 8);
  const rows = Math.ceil(N / cols);

  for (let i = 0; i < N; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = col * cellSize;
    const py = row * cellSize;
    if (py + cellSize > h) break;
    ctx.fillStyle = isPrime[i] ? '#2ecc71' : '#1a2a3e';
    ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);
    if (cellSize >= 14) {
      ctx.fillStyle = isPrime[i] ? '#fff' : '#445';
      ctx.font = `${cellSize - 4}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i), px + cellSize / 2, py + cellSize / 2);
    }
  }
  void rows;
}

// ─── Canvas: Sequence chart ───────────────────────────────────────────────────

function drawSequenceChart(
  ctx: CanvasRenderingContext2D,
  sequence: number[],
  chartMode: string,
  w: number,
  h: number,
) {
  const pad = { left: 40, right: 10, top: 10, bottom: 30 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  ctx.fillStyle = '#0d1b2e';
  ctx.fillRect(0, 0, w, h);

  if (sequence.length === 0) return;

  const maxVal = Math.max(...sequence, 1);
  const N = sequence.length;

  const toX = (i: number) => pad.left + (i / (N - 1)) * plotW;
  const toY = (v: number) => pad.top + plotH - (v / maxVal) * plotH;

  ctx.strokeStyle = '#334';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top + plotH); ctx.lineTo(w - pad.right, pad.top + plotH); ctx.stroke();

  if (chartMode === 'bar') {
    const barW = Math.max(plotW / N - 2, 2);
    for (let i = 0; i < N; i++) {
      const bx = toX(i);
      const by = toY(sequence[i]);
      const bh = pad.top + plotH - by;
      const t = i / (N - 1);
      const r = Math.round(52 + t * 200);
      const g = Math.round(152 - t * 100);
      const b = 219;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(bx - barW / 2, by, barW, bh);
    }
  } else {
    ctx.fillStyle = '#f39c12';
    for (let i = 0; i < N; i++) {
      ctx.beginPath();
      ctx.arc(toX(i), toY(sequence[i]), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      i === 0 ? ctx.moveTo(toX(i), toY(sequence[i])) : ctx.lineTo(toX(i), toY(sequence[i]));
    }
    ctx.stroke();
  }

  ctx.fillStyle = '#889';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < Math.min(N, 10); i++) {
    const step = Math.floor(N / 10) || 1;
    if (i * step >= N) break;
    ctx.fillText(String(i * step + 1), toX(i * step), h - 5);
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

const MODES: { id: NumberTheoryMode; label: string }[] = [
  { id: 'factorize', label: 'Factorize' },
  { id: 'sieve', label: 'Sieve' },
  { id: 'ulam', label: 'Ulam Spiral' },
  { id: 'sequences', label: 'Sequences' },
  { id: 'modular', label: 'Modular' },
];

const SEQ_TYPES: { id: SequenceType; label: string }[] = [
  { id: 'fibonacci', label: 'Fibonacci' },
  { id: 'triangular', label: 'Triangular' },
  { id: 'perfect', label: 'Perfect' },
  { id: 'primes', label: 'Primes' },
  { id: 'squares', label: 'Squares' },
];

export function NumberTheory() {
  const {
    state,
    setMode,
    setInputN,
    setModBase,
    setModExponent,
    setModModulus,
    setSequenceType,
    setSequenceLength,
    setChartMode,
    setSieveLimit,
    setUlamSize,
    getFactorTree,
    getPrimeFactors,
    getGCD,
    getLCM,
    getTotient,
    getModPow,
    getSequence,
    getSieve,
    getUlam,
  } = useNumberTheory();

  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawMode = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#0d1b2e';
    ctx.fillRect(0, 0, W, H);

    if (state.mode === 'factorize') {
      const tree = getFactorTree();
      drawFactorTree(ctx, tree, W / 2, 30, W / 4, W, H);
    } else if (state.mode === 'sieve') {
      const sieve = getSieve();
      drawSieve(ctx, sieve, W, H);
    } else if (state.mode === 'ulam') {
      const cells = getUlam();
      drawUlamSpiral(ctx, cells, state.ulamSize, W, H);
    } else if (state.mode === 'sequences') {
      const seq = getSequence();
      drawSequenceChart(ctx, seq, state.chartMode, W, H);
    }
  }, [state, getFactorTree, getSieve, getUlam, getSequence]);

  useEffect(() => { drawMode(); }, [drawMode]);

  const factors = state.mode === 'factorize' ? getPrimeFactors() : [];
  const totient = state.mode === 'factorize' ? getTotient() : 0;
  const gcdVal = state.mode === 'factorize' ? getGCD(state.modBase) : 0;
  const lcmVal = state.mode === 'factorize' ? getLCM(state.modBase) : 0;
  const modResult = state.mode === 'modular' ? getModPow() : 0;

  return (
    <div className="number-theory">
      <div className="number-theory__controls">
        <div className="number-theory__row">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              className={`grapher__btn ${state.mode === id ? 'grapher__btn--active' : ''}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {(state.mode === 'factorize' || state.mode === 'modular') && (
          <div className="number-theory__row">
            <label className="fourier__label">N:</label>
            <input
              type="number"
              min={2} max={100000}
              value={state.inputN}
              onChange={e => setInputN(Number(e.target.value))}
              className="number-theory__input"
              aria-label="N"
            />
            {state.mode === 'factorize' && (
              <span className="number-theory__info">
                Factors: {factors.join(' × ')} | φ({state.inputN}) = {totient} | gcd({state.inputN},{state.modBase}) = {gcdVal} | lcm = {lcmVal}
              </span>
            )}
          </div>
        )}

        {state.mode === 'sieve' && (
          <div className="number-theory__row">
            <label className="fourier__label">Limit:</label>
            <input
              type="number" min={10} max={500}
              value={state.sieveLimit}
              onChange={e => setSieveLimit(Number(e.target.value))}
              className="number-theory__input"
              aria-label="sieve limit"
            />
          </div>
        )}

        {state.mode === 'ulam' && (
          <div className="number-theory__row">
            <label className="fourier__label">Size:</label>
            <input
              type="number" min={7} max={51} step={2}
              value={state.ulamSize}
              onChange={e => setUlamSize(Number(e.target.value))}
              className="number-theory__input"
              aria-label="Ulam size"
            />
          </div>
        )}

        {state.mode === 'modular' && (
          <div className="number-theory__row">
            <label className="fourier__label">
              Base:
              <input type="number" min={0} max={9999} value={state.modBase}
                onChange={e => setModBase(Number(e.target.value))}
                className="number-theory__input" aria-label="base" />
            </label>
            <label className="fourier__label">
              Exp:
              <input type="number" min={0} max={999} value={state.modExponent}
                onChange={e => setModExponent(Number(e.target.value))}
                className="number-theory__input" aria-label="exponent" />
            </label>
            <label className="fourier__label">
              Mod:
              <input type="number" min={1} max={99999} value={state.modModulus}
                onChange={e => setModModulus(Number(e.target.value))}
                className="number-theory__input" aria-label="modulus" />
            </label>
            <span className="number-theory__info">
              {state.modBase}^{state.modExponent} mod {state.modModulus} = <strong>{modResult}</strong>
            </span>
          </div>
        )}

        {state.mode === 'sequences' && (
          <div className="number-theory__row">
            {SEQ_TYPES.map(({ id, label }) => (
              <button
                key={id}
                className={`grapher__btn ${state.sequenceType === id ? 'grapher__btn--active' : ''}`}
                onClick={() => setSequenceType(id)}
              >
                {label}
              </button>
            ))}
            <label className="fourier__label">Length: {state.sequenceLength}
              <input type="range" min={5} max={40} step={1} value={state.sequenceLength}
                onChange={e => setSequenceLength(Number(e.target.value))}
                aria-label="sequence length" className="fourier__slider" />
            </label>
            <button
              className={`grapher__btn ${state.chartMode === 'bar' ? 'grapher__btn--active' : ''}`}
              onClick={() => setChartMode('bar')}
            >Bar</button>
            <button
              className={`grapher__btn ${state.chartMode === 'scatter' ? 'grapher__btn--active' : ''}`}
              onClick={() => setChartMode('scatter')}
            >Scatter</button>
          </div>
        )}
      </div>

      <canvas
        ref={mainCanvasRef}
        width={580}
        height={360}
        className="fourier__canvas"
        aria-label="number theory visualization"
      />
    </div>
  );
}
