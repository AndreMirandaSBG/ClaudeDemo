import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ChaosState, LorenzPoint,
} from '../types/calculator';

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

export function lorenzRK4Step(
  x: number, y: number, z: number,
  sigma: number, rho: number, beta: number, dt: number,
): LorenzPoint {
  const dx = (x1: number, y1: number, _z1: number) => sigma * (y1 - x1);
  const dy = (x1: number, y1: number, z1: number) => x1 * (rho - z1) - y1;
  const dz = (x1: number, y1: number, z1: number) => x1 * y1 - beta * z1;

  const k1x = dx(x, y, z); const k1y = dy(x, y, z); const k1z = dz(x, y, z);
  const k2x = dx(x + dt / 2 * k1x, y + dt / 2 * k1y, z + dt / 2 * k1z);
  const k2y = dy(x + dt / 2 * k1x, y + dt / 2 * k1y, z + dt / 2 * k1z);
  const k2z = dz(x + dt / 2 * k1x, y + dt / 2 * k1y, z + dt / 2 * k1z);
  const k3x = dx(x + dt / 2 * k2x, y + dt / 2 * k2y, z + dt / 2 * k2z);
  const k3y = dy(x + dt / 2 * k2x, y + dt / 2 * k2y, z + dt / 2 * k2z);
  const k3z = dz(x + dt / 2 * k2x, y + dt / 2 * k2y, z + dt / 2 * k2z);
  const k4x = dx(x + dt * k3x, y + dt * k3y, z + dt * k3z);
  const k4y = dy(x + dt * k3x, y + dt * k3y, z + dt * k3z);
  const k4z = dz(x + dt * k3x, y + dt * k3y, z + dt * k3z);

  return {
    x: x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    y: y + (dt / 6) * (k1y + 2 * k2y + 2 * k3y + k4y),
    z: z + (dt / 6) * (k1z + 2 * k2z + 2 * k3z + k4z),
  };
}

export function computeLorenzTrajectory(
  sigma: number, rho: number, beta: number,
  dt: number, totalSteps: number,
): LorenzPoint[] {
  const points: LorenzPoint[] = [{ x: 0.1, y: 0, z: 0 }];
  for (let i = 1; i < totalSteps; i++) {
    const p = points[i - 1];
    points.push(lorenzRK4Step(p.x, p.y, p.z, sigma, rho, beta, dt));
  }
  return points;
}

export function computeLogisticBifurcation(
  rMin: number, rMax: number, rSteps: number, iters: number, burnin: number,
): { r: number; x: number }[] {
  const points: { r: number; x: number }[] = [];
  for (let i = 0; i <= rSteps; i++) {
    const r = rMin + (i / rSteps) * (rMax - rMin);
    let x = 0.5;
    for (let j = 0; j < burnin; j++) x = r * x * (1 - x);
    for (let j = 0; j < iters; j++) {
      x = r * x * (1 - x);
      points.push({ r, x });
    }
  }
  return points;
}

export function computeLyapunovExponent(r: number, n: number): number {
  let x = 0.4;
  let lyap = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const deriv = Math.abs(r * (1 - 2 * x));
    if (deriv > 0) { lyap += Math.log(deriv); count++; }
    x = r * x * (1 - x);
  }
  return count > 0 ? lyap / count : 0;
}

export function mandelbrotIterations(cx: number, cy: number, maxIter: number): number {
  let zx = 0; let zy = 0;
  for (let i = 0; i < maxIter; i++) {
    const zx2 = zx * zx; const zy2 = zy * zy;
    if (zx2 + zy2 > 4) return i;
    zy = 2 * zx * zy + cy;
    zx = zx2 - zy2 + cx;
  }
  return maxIter;
}

export function juliaIterations(
  zx: number, zy: number, cx: number, cy: number, maxIter: number,
): number {
  for (let i = 0; i < maxIter; i++) {
    const zx2 = zx * zx; const zy2 = zy * zy;
    if (zx2 + zy2 > 4) return i;
    zy = 2 * zx * zy + cy;
    zx = zx2 - zy2 + cx;
  }
  return maxIter;
}

export function computeLyapunovConvergence(r: number, n: number): number[] {
  const data: number[] = [];
  let x = 0.4;
  let cumSum = 0;
  let count = 0;
  for (let i = 1; i <= n; i++) {
    const deriv = Math.abs(r * (1 - 2 * x));
    if (deriv > 0) { cumSum += Math.log(deriv); count++; }
    x = r * x * (1 - x);
    data.push(count > 0 ? cumSum / count : 0);
  }
  return data;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULTS: ChaosState = {
  mode: 'lorenz',
  lorenz: {
    sigma: 10, rho: 28, beta: 8 / 3,
    dt: 0.01, steps: 5000, tailLength: 200,
    playing: false, currentStep: 0, rotX: 0.4, rotY: 0.6,
  },
  bifurcation: {
    rMin: 2.5, rMax: 4.0, iterations: 100, burnin: 200, zoomBox: null,
  },
  fractal: {
    type: 'mandelbrot', centerX: -0.5, centerY: 0, zoom: 1,
    maxIter: 100, juliaC: { re: -0.7, im: 0.27 }, hslShift: 0,
  },
  lyapunov: { r: 3.5, iterations: 500 },
};

export const useChaos = () => {
  const [state, setState] = useState<ChaosState>(DEFAULTS);
  const animFrameRef = useRef<number>(0);

  const [lorenzPoints, setLorenzPoints] = useState<LorenzPoint[]>(() =>
    computeLorenzTrajectory(
      DEFAULTS.lorenz.sigma, DEFAULTS.lorenz.rho, DEFAULTS.lorenz.beta,
      DEFAULTS.lorenz.dt, DEFAULTS.lorenz.steps,
    ),
  );

  const [bifurcationPoints, setBifurcationPoints] = useState<{ r: number; x: number }[]>(() =>
    computeLogisticBifurcation(
      DEFAULTS.bifurcation.rMin, DEFAULTS.bifurcation.rMax,
      400, DEFAULTS.bifurcation.iterations, DEFAULTS.bifurcation.burnin,
    ),
  );

  const setMode = useCallback((mode: ChaosState['mode']) => {
    setState(s => ({ ...s, mode }));
  }, []);

  const setLorenz = useCallback((patch: Partial<ChaosState['lorenz']>) => {
    setState(s => ({ ...s, lorenz: { ...s.lorenz, ...patch } }));
  }, []);

  const setBifurcation = useCallback((patch: Partial<ChaosState['bifurcation']>) => {
    setState(s => ({ ...s, bifurcation: { ...s.bifurcation, ...patch } }));
  }, []);

  const setFractal = useCallback((patch: Partial<ChaosState['fractal']>) => {
    setState(s => ({ ...s, fractal: { ...s.fractal, ...patch } }));
  }, []);

  const setLyapunov = useCallback((patch: Partial<ChaosState['lyapunov']>) => {
    setState(s => ({ ...s, lyapunov: { ...s.lyapunov, ...patch } }));
  }, []);

  const togglePlay = useCallback(() => {
    setState(s => ({
      ...s,
      lorenz: {
        ...s.lorenz,
        playing: !s.lorenz.playing,
        currentStep: s.lorenz.playing ? s.lorenz.currentStep : 0,
      },
    }));
  }, []);

  const resetLorenz = useCallback(() => {
    setState(s => ({
      ...s,
      lorenz: { ...s.lorenz, playing: false, currentStep: 0, rotX: 0.4, rotY: 0.6 },
    }));
  }, []);

  const recomputeLorenz = useCallback(() => {
    setState(s => {
      const { sigma, rho, beta, dt, steps } = s.lorenz;
      const pts = computeLorenzTrajectory(sigma, rho, beta, dt, steps);
      setLorenzPoints(pts);
      return { ...s, lorenz: { ...s.lorenz, currentStep: 0, playing: false } };
    });
  }, []);

  const recomputeBifurcation = useCallback(() => {
    setState(s => {
      const { rMin, rMax, iterations, burnin } = s.bifurcation;
      const pts = computeLogisticBifurcation(rMin, rMax, 400, iterations, burnin);
      setBifurcationPoints(pts);
      return s;
    });
  }, []);

  const applyPreset = useCallback((preset: 'lorenz-weather' | 'period-doubling' | 'mandelbrot-overview') => {
    if (preset === 'lorenz-weather') {
      setState(s => ({
        ...s, mode: 'lorenz',
        lorenz: { ...s.lorenz, sigma: 10, rho: 28, beta: 8 / 3, playing: false, currentStep: 0 },
      }));
    } else if (preset === 'period-doubling') {
      setState(s => ({
        ...s, mode: 'bifurcation',
        bifurcation: { ...s.bifurcation, rMin: 2.5, rMax: 4.0, zoomBox: null },
      }));
    } else if (preset === 'mandelbrot-overview') {
      setState(s => ({
        ...s, mode: 'fractal',
        fractal: { ...s.fractal, type: 'mandelbrot', centerX: -0.5, centerY: 0, zoom: 1 },
      }));
    }
  }, []);

  // Animation loop for Lorenz
  useEffect(() => {
    if (!state.lorenz.playing) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const animate = () => {
      setState(s => {
        const next = s.lorenz.currentStep + 5;
        if (next >= lorenzPoints.length) {
          return { ...s, lorenz: { ...s.lorenz, playing: false } };
        }
        return { ...s, lorenz: { ...s.lorenz, currentStep: next } };
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [state.lorenz.playing, lorenzPoints.length]);

  const getLyapunovData = useCallback((): number[] => {
    return computeLyapunovConvergence(state.lyapunov.r, state.lyapunov.iterations);
  }, [state.lyapunov]);

  return {
    state, setMode, setLorenz, setBifurcation, setFractal, setLyapunov,
    lorenzPoints, bifurcationPoints, getLyapunovData,
    recomputeLorenz, recomputeBifurcation, applyPreset,
    togglePlay, resetLorenz,
  };
};
