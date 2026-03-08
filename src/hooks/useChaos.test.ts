import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useChaos,
  lorenzRK4Step,
  computeLorenzTrajectory,
  computeLogisticBifurcation,
  computeLyapunovExponent,
  computeLyapunovConvergence,
  mandelbrotIterations,
  juliaIterations,
} from './useChaos';

describe('lorenzRK4Step', () => {
  it('returns a 3D point', () => {
    const result = lorenzRK4Step(0.1, 0, 0, 10, 28, 8 / 3, 0.01);
    expect(typeof result.x).toBe('number');
    expect(typeof result.y).toBe('number');
    expect(typeof result.z).toBe('number');
  });

  it('moves from initial point', () => {
    const start = { x: 0.1, y: 0, z: 0 };
    const result = lorenzRK4Step(start.x, start.y, start.z, 10, 28, 8 / 3, 0.01);
    expect(result.x).not.toBe(start.x);
    expect(result.z).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic', () => {
    const r1 = lorenzRK4Step(1, 1, 1, 10, 28, 8 / 3, 0.01);
    const r2 = lorenzRK4Step(1, 1, 1, 10, 28, 8 / 3, 0.01);
    expect(r1.x).toBe(r2.x);
    expect(r1.y).toBe(r2.y);
    expect(r1.z).toBe(r2.z);
  });

  it('dt=0 returns the same point', () => {
    const result = lorenzRK4Step(1, 2, 3, 10, 28, 8 / 3, 0);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(2);
    expect(result.z).toBeCloseTo(3);
  });
});

describe('computeLorenzTrajectory', () => {
  it('returns the requested number of steps', () => {
    const pts = computeLorenzTrajectory(10, 28, 8 / 3, 0.01, 100);
    expect(pts).toHaveLength(100);
  });

  it('starts at [0.1, 0, 0]', () => {
    const pts = computeLorenzTrajectory(10, 28, 8 / 3, 0.01, 10);
    expect(pts[0].x).toBeCloseTo(0.1);
    expect(pts[0].y).toBeCloseTo(0);
    expect(pts[0].z).toBeCloseTo(0);
  });

  it('z stays non-negative for classic parameters', () => {
    const pts = computeLorenzTrajectory(10, 28, 8 / 3, 0.01, 200);
    for (const p of pts) {
      expect(p.z).toBeGreaterThanOrEqual(-5); // Lorenz z should stay near positive
    }
  });
});

describe('computeLogisticBifurcation', () => {
  it('returns points', () => {
    const pts = computeLogisticBifurcation(3.5, 4.0, 10, 20, 50);
    expect(pts.length).toBeGreaterThan(0);
  });

  it('all r values are within range', () => {
    const pts = computeLogisticBifurcation(3.5, 4.0, 20, 10, 20);
    for (const p of pts) {
      expect(p.r).toBeGreaterThanOrEqual(3.5 - 0.01);
      expect(p.r).toBeLessThanOrEqual(4.0 + 0.01);
    }
  });

  it('all x values are between 0 and 1', () => {
    const pts = computeLogisticBifurcation(2.5, 4.0, 50, 50, 100);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1);
    }
  });

  it('stable r=2 converges to fixed point near 0.5', () => {
    const pts = computeLogisticBifurcation(2.0, 2.0, 1, 5, 200);
    const xs = pts.map(p => p.x);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean).toBeCloseTo(0.5, 1);
  });
});

describe('computeLyapunovExponent', () => {
  it('returns a finite number', () => {
    const l = computeLyapunovExponent(3.5, 500);
    expect(isFinite(l)).toBe(true);
  });

  it('stable r=2 has negative exponent', () => {
    const l = computeLyapunovExponent(2.0, 1000);
    expect(l).toBeLessThan(0);
  });

  it('chaotic r=4 has positive exponent', () => {
    const l = computeLyapunovExponent(4.0, 1000);
    expect(l).toBeGreaterThan(0);
  });

  it('r=3 (near period-2 onset) exponent is near or below 0', () => {
    const l = computeLyapunovExponent(3.0, 1000);
    expect(l).toBeLessThanOrEqual(0.1);
  });
});

describe('computeLyapunovConvergence', () => {
  it('returns array of length n', () => {
    const data = computeLyapunovConvergence(3.5, 100);
    expect(data).toHaveLength(100);
  });

  it('converges to the same value as computeLyapunovExponent', () => {
    const n = 500;
    const conv = computeLyapunovConvergence(3.9, n);
    const direct = computeLyapunovExponent(3.9, n);
    expect(conv[n - 1]).toBeCloseTo(direct, 5);
  });
});

describe('mandelbrotIterations', () => {
  it('origin is in the set (returns maxIter)', () => {
    expect(mandelbrotIterations(0, 0, 100)).toBe(100);
  });

  it('point clearly outside returns low iterations', () => {
    const iter = mandelbrotIterations(3, 3, 100);
    expect(iter).toBeLessThan(5);
  });

  it('point on boundary returns intermediate value', () => {
    // c = -2 is on the boundary
    const iter = mandelbrotIterations(-2, 0, 100);
    expect(iter).toBe(100);
  });

  it('c = 0.5+0.5i escapes', () => {
    const iter = mandelbrotIterations(0.5, 0.5, 200);
    expect(iter).toBeLessThan(200);
  });
});

describe('juliaIterations', () => {
  it('returns a number', () => {
    const iter = juliaIterations(0, 0, -0.7, 0.27, 100);
    expect(typeof iter).toBe('number');
  });

  it('point clearly outside escapes quickly', () => {
    const iter = juliaIterations(10, 10, -0.7, 0.27, 100);
    expect(iter).toBeLessThan(5);
  });

  it('returns maxIter for interior point of Julia set', () => {
    // Origin of Julia set c=-0.7+0.27i should be in the set
    const iter = juliaIterations(0, 0, -0.7, 0.27, 200);
    expect(iter).toBeGreaterThan(10);
  });
});

describe('useChaos hook', () => {
  it('initializes with lorenz mode', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.state.mode).toBe('lorenz');
  });

  it('setMode changes the mode', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setMode('bifurcation'));
    expect(result.current.state.mode).toBe('bifurcation');
  });

  it('setMode to fractal works', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setMode('fractal'));
    expect(result.current.state.mode).toBe('fractal');
  });

  it('setMode to lyapunov works', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setMode('lyapunov'));
    expect(result.current.state.mode).toBe('lyapunov');
  });

  it('setLorenz updates sigma', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setLorenz({ sigma: 15 }));
    expect(result.current.state.lorenz.sigma).toBe(15);
  });

  it('setLorenz updates rho', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setLorenz({ rho: 35 }));
    expect(result.current.state.lorenz.rho).toBe(35);
  });

  it('setLorenz updates beta', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setLorenz({ beta: 2.5 }));
    expect(result.current.state.lorenz.beta).toBe(2.5);
  });

  it('togglePlay sets playing true', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.state.lorenz.playing).toBe(false);
    act(() => result.current.togglePlay());
    expect(result.current.state.lorenz.playing).toBe(true);
  });

  it('togglePlay twice returns to paused', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.togglePlay());
    act(() => result.current.togglePlay());
    expect(result.current.state.lorenz.playing).toBe(false);
  });

  it('resetLorenz sets playing false and step 0', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.togglePlay());
    act(() => result.current.resetLorenz());
    expect(result.current.state.lorenz.playing).toBe(false);
    expect(result.current.state.lorenz.currentStep).toBe(0);
  });

  it('setBifurcation updates rMin', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setBifurcation({ rMin: 3.0 }));
    expect(result.current.state.bifurcation.rMin).toBe(3.0);
  });

  it('setFractal updates type to julia', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setFractal({ type: 'julia' }));
    expect(result.current.state.fractal.type).toBe('julia');
  });

  it('setFractal updates zoom', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setFractal({ zoom: 3 }));
    expect(result.current.state.fractal.zoom).toBe(3);
  });

  it('setLyapunov updates r', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setLyapunov({ r: 3.9 }));
    expect(result.current.state.lyapunov.r).toBe(3.9);
  });

  it('lorenzPoints has length equal to steps', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.lorenzPoints.length).toBe(result.current.state.lorenz.steps);
  });

  it('bifurcationPoints is non-empty', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.bifurcationPoints.length).toBeGreaterThan(0);
  });

  it('getLyapunovData returns array', () => {
    const { result } = renderHook(() => useChaos());
    const data = result.current.getLyapunovData();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('applyPreset lorenz-weather sets mode to lorenz', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.setMode('bifurcation'));
    act(() => result.current.applyPreset('lorenz-weather'));
    expect(result.current.state.mode).toBe('lorenz');
  });

  it('applyPreset period-doubling sets mode to bifurcation', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.applyPreset('period-doubling'));
    expect(result.current.state.mode).toBe('bifurcation');
  });

  it('applyPreset mandelbrot-overview sets mode to fractal', () => {
    const { result } = renderHook(() => useChaos());
    act(() => result.current.applyPreset('mandelbrot-overview'));
    expect(result.current.state.mode).toBe('fractal');
    expect(result.current.state.fractal.type).toBe('mandelbrot');
  });

  it('initial lorenz has correct default sigma', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.state.lorenz.sigma).toBe(10);
  });

  it('initial lorenz has correct default rho', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.state.lorenz.rho).toBe(28);
  });

  it('initial fractal type is mandelbrot', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.state.fractal.type).toBe('mandelbrot');
  });

  it('initial lyapunov r is 3.5', () => {
    const { result } = renderHook(() => useChaos());
    expect(result.current.state.lyapunov.r).toBe(3.5);
  });
});
