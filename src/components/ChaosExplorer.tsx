import { useEffect, useRef, useCallback } from 'react';
import {
  useChaos, mandelbrotIterations, juliaIterations,
} from '../hooks/useChaos';
import type { ChaosMode, ChaosState, LorenzPoint } from '../types/calculator';

const MODES: { id: ChaosMode; label: string }[] = [
  { id: 'lorenz', label: 'Lorenz Attractor' },
  { id: 'bifurcation', label: 'Bifurcation' },
  { id: 'fractal', label: 'Fractal Explorer' },
  { id: 'lyapunov', label: 'Lyapunov Exponent' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function project3D(
  x: number, y: number, z: number,
  rotX: number, rotY: number, scale: number, cx: number, cy: number,
): { px: number; py: number } {
  const cosY = Math.cos(rotY); const sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  const cosX = Math.cos(rotX); const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  return { px: cx + x1 * scale, py: cy - y2 * scale };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

// ─── Lorenz Panel ─────────────────────────────────────────────────────────────

interface LorenzPanelProps {
  lorenz: ChaosState['lorenz'];
  lorenzPoints: LorenzPoint[];
  setLorenz: (patch: Partial<ChaosState['lorenz']>) => void;
  togglePlay: () => void;
  resetLorenz: () => void;
  recomputeLorenz: () => void;
  applyPreset: (p: 'lorenz-weather' | 'period-doubling' | 'mandelbrot-overview') => void;
}

const LorenzPanel = ({
  lorenz, lorenzPoints, setLorenz, togglePlay, resetLorenz, recomputeLorenz, applyPreset,
}: LorenzPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);

    const { currentStep, tailLength, rotX, rotY } = lorenz;
    const scale = Math.min(W, H) / 80;
    const cx = W / 2; const cy = H / 2 - 10;
    const start = Math.max(0, currentStep - tailLength);
    const end = Math.min(currentStep, lorenzPoints.length - 1);
    if (end < 1) return;

    for (let i = start + 1; i <= end; i++) {
      const p0 = lorenzPoints[i - 1]; const p1 = lorenzPoints[i];
      const pp0 = project3D(p0.x, p0.y, p0.z - 25, rotX, rotY, scale, cx, cy);
      const pp1 = project3D(p1.x, p1.y, p1.z - 25, rotX, rotY, scale, cx, cy);
      const t = (i - start) / (end - start);
      const hue = 200 + t * 160;
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${hue},80%,60%,${0.3 + t * 0.7})`;
      ctx.lineWidth = 1;
      ctx.moveTo(pp0.px, pp0.py); ctx.lineTo(pp1.px, pp1.py);
      ctx.stroke();
    }
    const pt = lorenzPoints[end];
    const pp = project3D(pt.x, pt.y, pt.z - 25, rotX, rotY, scale, cx, cy);
    ctx.beginPath(); ctx.arc(pp.px, pp.py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();

    ctx.fillStyle = '#aaa'; ctx.font = '11px monospace';
    ctx.fillText(`σ=${lorenz.sigma.toFixed(1)} ρ=${lorenz.rho.toFixed(1)} β=${lorenz.beta.toFixed(2)}  step ${currentStep}/${lorenzPoints.length}`, 8, 16);
  }, [lorenz, lorenzPoints]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    setLorenz({ rotY: lorenz.rotY + dx * 0.01, rotX: lorenz.rotX + dy * 0.01 });
    dragRef.current.lastX = e.clientX; dragRef.current.lastY = e.clientY;
  }, [lorenz.rotX, lorenz.rotY, setLorenz]);
  const onMouseUp = useCallback(() => { dragRef.current.active = false; }, []);

  return (
    <div className="chaos__panel">
      <canvas
        ref={canvasRef} width={560} height={380} className="chaos__canvas"
        aria-label="Lorenz attractor canvas"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      />
      <div className="chaos__controls">
        <button className="chaos__btn chaos__btn--play" onClick={togglePlay}
          aria-label={lorenz.playing ? 'Pause' : 'Play'}>
          {lorenz.playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button className="chaos__btn" onClick={resetLorenz} aria-label="Reset view">⟳ Reset</button>
        <button className="chaos__btn chaos__btn--preset"
          onClick={() => applyPreset('lorenz-weather')} aria-label="Lorenz Weather Model preset">
          Lorenz Weather Model
        </button>
      </div>
      <div className="chaos__sliders">
        <label aria-label="sigma parameter">
          σ (sigma): {lorenz.sigma.toFixed(1)}
          <input type="range" min={1} max={20} step={0.1} value={lorenz.sigma}
            onChange={e => setLorenz({ sigma: parseFloat(e.target.value) })} />
        </label>
        <label aria-label="rho parameter">
          ρ (rho): {lorenz.rho.toFixed(1)}
          <input type="range" min={1} max={60} step={0.5} value={lorenz.rho}
            onChange={e => setLorenz({ rho: parseFloat(e.target.value) })} />
        </label>
        <label aria-label="beta parameter">
          β (beta): {lorenz.beta.toFixed(2)}
          <input type="range" min={0.1} max={5} step={0.01} value={lorenz.beta}
            onChange={e => setLorenz({ beta: parseFloat(e.target.value) })} />
        </label>
        <label aria-label="tail length">
          Tail: {lorenz.tailLength}
          <input type="range" min={10} max={500} step={10} value={lorenz.tailLength}
            onChange={e => setLorenz({ tailLength: parseInt(e.target.value) })} />
        </label>
      </div>
      <button className="chaos__btn chaos__btn--compute" onClick={recomputeLorenz}
        aria-label="Recompute trajectory">
        Recompute Trajectory
      </button>
    </div>
  );
};

// ─── Bifurcation Panel ────────────────────────────────────────────────────────

interface BifurcationPanelProps {
  bifurcation: ChaosState['bifurcation'];
  bifurcationPoints: { r: number; x: number }[];
  setBifurcation: (patch: Partial<ChaosState['bifurcation']>) => void;
  recomputeBifurcation: () => void;
  applyPreset: (p: 'lorenz-weather' | 'period-doubling' | 'mandelbrot-overview') => void;
}

const BifurcationPanel = ({
  bifurcation, bifurcationPoints, setBifurcation, recomputeBifurcation, applyPreset,
}: BifurcationPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);

    const { rMin, rMax } = bifurcation;
    const PAD = { l: 40, r: 10, t: 15, b: 30 };
    const plotW = W - PAD.l - PAD.r; const plotH = H - PAD.t - PAD.b;
    const toX = (r: number) => PAD.l + ((r - rMin) / (rMax - rMin)) * plotW;
    const toY = (x: number) => PAD.t + (1 - x) * plotH;

    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b);
    ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke();

    ctx.fillStyle = '#888'; ctx.font = '10px monospace';
    for (let i = 0; i <= 4; i++) {
      const r = rMin + (rMax - rMin) * (i / 4);
      const px = PAD.l + (i / 4) * plotW;
      ctx.fillText(r.toFixed(2), px - 12, H - PAD.b + 12);
    }
    ctx.fillStyle = '#ccc'; ctx.font = '10px monospace';
    ctx.fillText('r →', W / 2 - 10, H - 2);

    const periods = [
      { rStart: 3.0, rEnd: 3.449, color: 'rgba(255,200,50,0.12)', label: 'Period 2' },
      { rStart: 3.449, rEnd: 3.544, color: 'rgba(50,255,100,0.12)', label: 'Period 4' },
      { rStart: 3.544, rEnd: 3.5688, color: 'rgba(200,100,255,0.12)', label: 'Period 8' },
    ];
    for (const p of periods) {
      const x0 = toX(Math.max(p.rStart, rMin));
      const x1 = toX(Math.min(p.rEnd, rMax));
      if (x1 > x0) {
        ctx.fillStyle = p.color;
        ctx.fillRect(x0, PAD.t, x1 - x0, plotH);
        ctx.fillStyle = '#ccc'; ctx.font = '9px monospace';
        ctx.fillText(p.label, (x0 + x1) / 2 - 18, PAD.t + 12);
      }
    }

    ctx.fillStyle = '#4af';
    for (const pt of bifurcationPoints) {
      ctx.fillRect(toX(pt.r), toY(pt.x), 0.8, 0.8);
    }
  }, [bifurcation, bifurcationPoints]);

  return (
    <div className="chaos__panel">
      <canvas ref={canvasRef} width={560} height={380} className="chaos__canvas"
        aria-label="Bifurcation diagram canvas" />
      <div className="chaos__controls">
        <button className="chaos__btn chaos__btn--compute" onClick={recomputeBifurcation}
          aria-label="Recompute bifurcation">Recompute</button>
        <button className="chaos__btn chaos__btn--preset"
          onClick={() => applyPreset('period-doubling')} aria-label="Period-Doubling Cascade preset">
          Period-Doubling Cascade
        </button>
      </div>
      <div className="chaos__sliders">
        <label aria-label="r minimum">
          r min: {bifurcation.rMin.toFixed(2)}
          <input type="range" min={1} max={4} step={0.01} value={bifurcation.rMin}
            onChange={e => setBifurcation({ rMin: parseFloat(e.target.value) })} />
        </label>
        <label aria-label="r maximum">
          r max: {bifurcation.rMax.toFixed(2)}
          <input type="range" min={1} max={4} step={0.01} value={bifurcation.rMax}
            onChange={e => setBifurcation({ rMax: parseFloat(e.target.value) })} />
        </label>
        <label aria-label="iterations">
          Iterations: {bifurcation.iterations}
          <input type="range" min={20} max={500} step={10} value={bifurcation.iterations}
            onChange={e => setBifurcation({ iterations: parseInt(e.target.value) })} />
        </label>
      </div>
    </div>
  );
};

// ─── Fractal Panel ────────────────────────────────────────────────────────────

interface FractalPanelProps {
  fractal: ChaosState['fractal'];
  setFractal: (patch: Partial<ChaosState['fractal']>) => void;
  applyPreset: (p: 'lorenz-weather' | 'period-doubling' | 'mandelbrot-overview') => void;
}

const FractalPanel = ({ fractal, setFractal, applyPreset }: FractalPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    const { type, centerX, centerY, zoom, maxIter, juliaC, hslShift } = fractal;
    const imgData = ctx.createImageData(W, H);
    const scale = 3.5 / (zoom * Math.min(W, H));

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const cx = centerX + (px - W / 2) * scale;
        const cy = centerY + (py - H / 2) * scale;
        const iter = type === 'mandelbrot'
          ? mandelbrotIterations(cx, cy, maxIter)
          : juliaIterations(cx, cy, juliaC.re, juliaC.im, maxIter);
        const idx = (py * W + px) * 4;
        if (iter === maxIter) {
          imgData.data[idx] = 0; imgData.data[idx + 1] = 0;
          imgData.data[idx + 2] = 0; imgData.data[idx + 3] = 255;
        } else {
          const t = iter / maxIter;
          const hue = (hslShift + t * 360) % 360;
          const [r, g, b] = hslToRgb(hue / 360, 0.8, 0.5 + t * 0.3);
          imgData.data[idx] = r; imgData.data[idx + 1] = g;
          imgData.data[idx + 2] = b; imgData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [fractal]);

  useEffect(() => { render(); }, [render]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setFractal({ zoom: fractal.zoom * (e.deltaY < 0 ? 1.3 : 0.77) });
  }, [fractal.zoom, setFractal]);

  return (
    <div className="chaos__panel">
      <canvas ref={canvasRef} width={400} height={340} className="chaos__canvas"
        aria-label="Fractal explorer canvas" onWheel={onWheel} style={{ cursor: 'crosshair' }} />
      <div className="chaos__controls">
        <button className={`chaos__btn${fractal.type === 'mandelbrot' ? ' chaos__btn--active' : ''}`}
          onClick={() => setFractal({ type: 'mandelbrot' })} aria-label="Mandelbrot set">
          Mandelbrot
        </button>
        <button className={`chaos__btn${fractal.type === 'julia' ? ' chaos__btn--active' : ''}`}
          onClick={() => setFractal({ type: 'julia' })} aria-label="Julia set">
          Julia
        </button>
        <button className="chaos__btn chaos__btn--preset"
          onClick={() => applyPreset('mandelbrot-overview')} aria-label="Mandelbrot Overview preset">
          Mandelbrot Overview
        </button>
      </div>
      <div className="chaos__sliders">
        <label aria-label="max iterations">
          Max Iter: {fractal.maxIter}
          <input type="range" min={20} max={500} step={10} value={fractal.maxIter}
            onChange={e => setFractal({ maxIter: parseInt(e.target.value) })} />
        </label>
        <label aria-label="color hue shift">
          Color Shift: {fractal.hslShift}°
          <input type="range" min={0} max={360} step={5} value={fractal.hslShift}
            onChange={e => setFractal({ hslShift: parseInt(e.target.value) })} />
        </label>
        {fractal.type === 'julia' && (
          <>
            <label aria-label="julia real part">
              Julia Re: {fractal.juliaC.re.toFixed(3)}
              <input type="range" min={-2} max={2} step={0.01} value={fractal.juliaC.re}
                onChange={e => setFractal({ juliaC: { ...fractal.juliaC, re: parseFloat(e.target.value) } })} />
            </label>
            <label aria-label="julia imaginary part">
              Julia Im: {fractal.juliaC.im.toFixed(3)}
              <input type="range" min={-2} max={2} step={0.01} value={fractal.juliaC.im}
                onChange={e => setFractal({ juliaC: { ...fractal.juliaC, im: parseFloat(e.target.value) } })} />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Lyapunov Panel ───────────────────────────────────────────────────────────

interface LyapunovPanelProps {
  lyapunov: ChaosState['lyapunov'];
  setLyapunov: (patch: Partial<ChaosState['lyapunov']>) => void;
  getLyapunovData: () => number[];
}

const LyapunovPanel = ({ lyapunov, setLyapunov, getLyapunovData }: LyapunovPanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width; const H = canvas.height;
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);

    const data = getLyapunovData();
    if (data.length === 0) return;

    const PAD = { l: 50, r: 15, t: 30, b: 30 };
    const plotW = W - PAD.l - PAD.r; const plotH = H - PAD.t - PAD.b;
    const yMin = Math.min(...data) - 0.1;
    const yMax = Math.max(...data) + 0.1;
    const toX = (i: number) => PAD.l + (i / (data.length - 1)) * plotW;
    const toY = (v: number) => PAD.t + (1 - (v - yMin) / (yMax - yMin)) * plotH;

    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, H - PAD.b);
    ctx.lineTo(W - PAD.r, H - PAD.b); ctx.stroke();

    ctx.fillStyle = '#888'; ctx.font = '10px monospace';
    for (let i = 0; i <= 4; i++) {
      const v = yMin + (yMax - yMin) * (i / 4);
      const y = PAD.t + (1 - i / 4) * plotH;
      ctx.fillText(v.toFixed(2), 2, y + 3);
    }

    if (yMin < 0 && yMax > 0) {
      const y0 = toY(0);
      ctx.beginPath(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(PAD.l, y0); ctx.lineTo(W - PAD.r, y0); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#888'; ctx.font = '9px monospace';
      ctx.fillText('λ=0', PAD.l - 30, y0 + 4);
    }

    ctx.beginPath(); ctx.strokeStyle = '#4af'; ctx.lineWidth = 1.5;
    for (let i = 0; i < data.length; i++) {
      if (i === 0) ctx.moveTo(toX(i), toY(data[i]));
      else ctx.lineTo(toX(i), toY(data[i]));
    }
    ctx.stroke();

    const lambda = data[data.length - 1];
    const col = lambda < -0.01 ? '#22ff44' : lambda > 0.01 ? '#ff4444' : '#ffdd44';
    const label = lambda < -0.01 ? 'Stable (λ<0)' : lambda > 0.01 ? 'Chaotic (λ>0)' : 'Periodic (λ≈0)';
    ctx.fillStyle = col; ctx.font = 'bold 11px monospace';
    ctx.fillText(`λ = ${lambda.toFixed(4)} — ${label}`, PAD.l + 4, PAD.t - 6);
  }, [lyapunov, getLyapunovData]);

  return (
    <div className="chaos__panel">
      <canvas ref={canvasRef} width={560} height={320} className="chaos__canvas"
        aria-label="Lyapunov exponent convergence canvas" />
      <div className="chaos__sliders">
        <label aria-label="r parameter for logistic map">
          r (logistic map): {lyapunov.r.toFixed(3)}
          <input type="range" min={1} max={4} step={0.001} value={lyapunov.r}
            onChange={e => setLyapunov({ r: parseFloat(e.target.value) })} />
        </label>
        <label aria-label="iterations for lyapunov">
          Iterations: {lyapunov.iterations}
          <input type="range" min={100} max={2000} step={100} value={lyapunov.iterations}
            onChange={e => setLyapunov({ iterations: parseInt(e.target.value) })} />
        </label>
      </div>
      <div className="chaos__info">
        <span style={{ color: '#22ff44' }}>Green = stable (λ&lt;0)</span>
        {' · '}
        <span style={{ color: '#ffdd44' }}>Yellow = periodic (λ≈0)</span>
        {' · '}
        <span style={{ color: '#ff4444' }}>Red = chaotic (λ&gt;0)</span>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ChaosExplorer = () => {
  const {
    state, setMode, setLorenz, setBifurcation, setFractal, setLyapunov,
    lorenzPoints, bifurcationPoints, getLyapunovData,
    recomputeLorenz, recomputeBifurcation, applyPreset,
    togglePlay, resetLorenz,
  } = useChaos();

  return (
    <div className="chaos">
      <div className="chaos__mode-tabs" role="tablist">
        {MODES.map(({ id, label }) => (
          <button key={id} role="tab" aria-selected={state.mode === id}
            className={`chaos__mode-btn${state.mode === id ? ' chaos__mode-btn--active' : ''}`}
            onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="chaos__content">
        {state.mode === 'lorenz' && (
          <LorenzPanel
            lorenz={state.lorenz} lorenzPoints={lorenzPoints}
            setLorenz={setLorenz} togglePlay={togglePlay}
            resetLorenz={resetLorenz} recomputeLorenz={recomputeLorenz}
            applyPreset={applyPreset}
          />
        )}
        {state.mode === 'bifurcation' && (
          <BifurcationPanel
            bifurcation={state.bifurcation} bifurcationPoints={bifurcationPoints}
            setBifurcation={setBifurcation} recomputeBifurcation={recomputeBifurcation}
            applyPreset={applyPreset}
          />
        )}
        {state.mode === 'fractal' && (
          <FractalPanel
            fractal={state.fractal} setFractal={setFractal} applyPreset={applyPreset}
          />
        )}
        {state.mode === 'lyapunov' && (
          <LyapunovPanel
            lyapunov={state.lyapunov} setLyapunov={setLyapunov}
            getLyapunovData={getLyapunovData}
          />
        )}
      </div>

      <div className="chaos__shortcuts" aria-label="Keyboard shortcuts">
        <span>⌨ Space: play/pause</span>
        <span>R: reset view</span>
        <span>+/−: zoom</span>
      </div>
    </div>
  );
};
