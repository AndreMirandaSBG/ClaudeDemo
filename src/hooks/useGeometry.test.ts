import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useGeometry,
  getConicPoints,
  getConicFoci,
  conicProperties,
  computeDistances,
  computeAngles,
  getSurface3DPoints,
  project3D,
} from './useGeometry';

// ─── getConicPoints ───────────────────────────────────────────────────────────

describe('getConicPoints', () => {
  it('ellipse returns 200+ points', () => {
    const pts = getConicPoints('ellipse', 3, 2);
    expect(pts.length).toBeGreaterThanOrEqual(200);
  });

  it('ellipse forms a closed curve (first and last x are close)', () => {
    const pts = getConicPoints('ellipse', 3, 2);
    expect(pts[0].x).toBeCloseTo(pts[pts.length - 1].x, 5);
  });

  it('parabola returns points', () => {
    const pts = getConicPoints('parabola', 2, 1);
    expect(pts.length).toBeGreaterThan(0);
  });

  it('parabola: all y values are >= 0 (y = t²/(2a), a > 0)', () => {
    const pts = getConicPoints('parabola', 2, 1);
    pts.forEach(p => {
      expect(p.y).toBeGreaterThanOrEqual(0);
    });
  });

  it('hyperbola returns points including NaN separator', () => {
    const pts = getConicPoints('hyperbola', 2, 1);
    expect(pts.length).toBeGreaterThan(0);
    const hasNaN = pts.some(p => isNaN(p.x) && isNaN(p.y));
    expect(hasNaN).toBe(true);
  });
});

// ─── getConicFoci ─────────────────────────────────────────────────────────────

describe('getConicFoci', () => {
  it('ellipse returns 2 foci', () => {
    const foci = getConicFoci('ellipse', 3, 2);
    expect(foci).toHaveLength(2);
  });

  it('parabola returns 1 focus', () => {
    const foci = getConicFoci('parabola', 4, 1);
    expect(foci).toHaveLength(1);
  });

  it('hyperbola returns 2 foci', () => {
    const foci = getConicFoci('hyperbola', 3, 2);
    expect(foci).toHaveLength(2);
  });
});

// ─── conicProperties ──────────────────────────────────────────────────────────

describe('conicProperties', () => {
  it('ellipse has Semi-major axis key', () => {
    const props = conicProperties('ellipse', 3, 2);
    expect(props).toHaveProperty('Semi-major axis');
  });

  it('parabola has Focal length key', () => {
    const props = conicProperties('parabola', 2, 1);
    expect(props).toHaveProperty('Focal length');
  });
});

// ─── computeDistances ─────────────────────────────────────────────────────────

describe('computeDistances', () => {
  it('returns "P1-P2: 5.00" for a 3-4-5 right triangle pair', () => {
    const result = computeDistances([{ x: 0, y: 0 }, { x: 3, y: 4 }]);
    expect(result).toContain('P1-P2: 5.00');
  });
});

// ─── computeAngles ────────────────────────────────────────────────────────────

describe('computeAngles', () => {
  it('returns angles array for 3 collinear points', () => {
    const result = computeAngles([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── getSurface3DPoints ───────────────────────────────────────────────────────

describe('getSurface3DPoints', () => {
  it('torus with n=20 returns exactly 400 items (20*20)', () => {
    const pts = getSurface3DPoints('torus', 0, 0);
    expect(pts).toHaveLength(400);
  });

  it('mobius returns non-empty array', () => {
    const pts = getSurface3DPoints('mobius', 0.3, 0.2);
    expect(pts.length).toBeGreaterThan(0);
  });
});

// ─── project3D ────────────────────────────────────────────────────────────────

describe('project3D', () => {
  it('identity rotation: {x:1, y:0, z:0} -> {px:1, py:0}', () => {
    const result = project3D({ x: 1, y: 0, z: 0 }, 0, 0);
    expect(result.px).toBeCloseTo(1);
    expect(result.py).toBeCloseTo(0);
  });
});

// ─── useGeometry hook ─────────────────────────────────────────────────────────

describe('useGeometry hook', () => {
  it('initializes with mode "conics"', () => {
    const { result } = renderHook(() => useGeometry());
    expect(result.current.state.mode).toBe('conics');
  });

  it('setMode changes mode', () => {
    const { result } = renderHook(() => useGeometry());
    act(() => result.current.setMode('surfaces'));
    expect(result.current.state.mode).toBe('surfaces');
  });

  it('setConicType changes conicType', () => {
    const { result } = renderHook(() => useGeometry());
    act(() => result.current.setConicType('hyperbola'));
    expect(result.current.state.conicType).toBe('hyperbola');
  });

  it('setConicA changes conicA', () => {
    const { result } = renderHook(() => useGeometry());
    act(() => result.current.setConicA(5));
    expect(result.current.state.conicA).toBe(5);
  });

  it('addPoint adds to points array', () => {
    const { result } = renderHook(() => useGeometry());
    act(() => result.current.addPoint({ x: 1, y: 2 }));
    expect(result.current.state.points).toHaveLength(1);
    expect(result.current.state.points[0]).toEqual({ x: 1, y: 2 });
  });

  it('clearPoints empties the points array', () => {
    const { result } = renderHook(() => useGeometry());
    act(() => result.current.addPoint({ x: 1, y: 2 }));
    act(() => result.current.addPoint({ x: 3, y: 4 }));
    act(() => result.current.clearPoints());
    expect(result.current.state.points).toHaveLength(0);
  });

  it('addPoint respects max 10 points limit', () => {
    const { result } = renderHook(() => useGeometry());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addPoint({ x: i, y: i });
      }
    });
    expect(result.current.state.points).toHaveLength(10);
  });
});
