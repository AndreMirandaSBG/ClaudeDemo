import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useDiffEq,
  evaluateXY,
  eulerSolve,
  rk4Solve,
  generateSlopeField,
  generatePhaseField,
  findEquilibria,
} from './useDiffEq';

describe('evaluateXY', () => {
  it('evaluates x + y', () => {
    expect(evaluateXY('x + y', 2, 3)).toBeCloseTo(5);
  });

  it('evaluates x * y', () => {
    expect(evaluateXY('x * y', 3, 4)).toBeCloseTo(12);
  });

  it('evaluates -y at y=2', () => {
    expect(evaluateXY('-y', 0, 2)).toBeCloseTo(-2);
  });

  it('evaluates sin(x)', () => {
    expect(evaluateXY('sin(x)', Math.PI / 2, 0)).toBeCloseTo(1);
  });

  it('returns NaN for invalid expression', () => {
    expect(evaluateXY('!bad!', 0, 0)).toBeNaN();
  });
});

describe('eulerSolve', () => {
  it('dy/dx = 0 keeps y constant', () => {
    const pts = eulerSolve(() => 0, 0, 2, 1, 10);
    expect(pts[pts.length - 1].y).toBeCloseTo(2);
  });

  it('dy/dx = 1 gives linear growth', () => {
    const pts = eulerSolve(() => 1, 0, 0, 1, 100);
    expect(pts[pts.length - 1].y).toBeCloseTo(1, 2);
  });

  it('dy/dx = -y from y(0)=1 approximates e^-x', () => {
    const f = (_x: number, y: number) => -y;
    const pts = eulerSolve(f, 0, 1, 1, 1000);
    expect(pts[pts.length - 1].y).toBeCloseTo(Math.exp(-1), 2);
  });

  it('returns correct number of points', () => {
    const pts = eulerSolve(() => 0, 0, 1, 1, 50);
    expect(pts).toHaveLength(51);
  });

  it('first point is initial condition', () => {
    const pts = eulerSolve(() => 1, 0.5, 3, 2, 10);
    expect(pts[0].x).toBeCloseTo(0.5);
    expect(pts[0].y).toBeCloseTo(3);
  });
});

describe('rk4Solve', () => {
  it('dy/dx = -y from y(0)=1 closely approximates e^-1', () => {
    const f = (_x: number, y: number) => -y;
    const pts = rk4Solve(f, 0, 1, 1, 100);
    expect(pts[pts.length - 1].y).toBeCloseTo(Math.exp(-1), 5);
  });

  it('dy/dx = y from y(0)=1 approximates e^1', () => {
    const f = (_x: number, y: number) => y;
    const pts = rk4Solve(f, 0, 1, 1, 100);
    expect(pts[pts.length - 1].y).toBeCloseTo(Math.E, 4);
  });

  it('returns correct number of points', () => {
    const pts = rk4Solve(() => 0, 0, 1, 1, 50);
    expect(pts).toHaveLength(51);
  });

  it('RK4 is more accurate than Euler for dy/dx = y', () => {
    const f = (_x: number, y: number) => y;
    const euler = eulerSolve(f, 0, 1, 1, 10);
    const rk4 = rk4Solve(f, 0, 1, 1, 10);
    const exact = Math.E;
    const eulerErr = Math.abs(euler[euler.length - 1].y - exact);
    const rk4Err = Math.abs(rk4[rk4.length - 1].y - exact);
    expect(rk4Err).toBeLessThan(eulerErr);
  });
});

describe('generateSlopeField', () => {
  it('returns arrows array', () => {
    const f = (x: number, y: number) => x - y;
    const arrows = generateSlopeField(f, -2, 2, -2, 2, 5);
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('each arrow has x, y, dx, dy', () => {
    const f = () => 1;
    const arrows = generateSlopeField(f, 0, 2, 0, 2, 3);
    for (const a of arrows) {
      expect(a).toHaveProperty('x');
      expect(a).toHaveProperty('y');
      expect(a).toHaveProperty('dx');
      expect(a).toHaveProperty('dy');
    }
  });

  it('slope arrows are unit length (dy/dx normalized direction)', () => {
    const f = () => 0;
    const arrows = generateSlopeField(f, 0, 2, 0, 2, 3);
    for (const a of arrows) {
      const len = Math.sqrt(a.dx * a.dx + a.dy * a.dy);
      expect(len).toBeCloseTo(1, 5);
    }
  });
});

describe('generatePhaseField', () => {
  it('returns arrows for 2D system', () => {
    const f = (x: number, _y: number) => -x;
    const g = (_x: number, y: number) => -y;
    const arrows = generatePhaseField(f, g, -2, 2, -2, 2, 4);
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('equilibrium at origin gives zero arrow', () => {
    const f = (x: number, _y: number) => x;
    const g = (_x: number, y: number) => y;
    const arrows = generatePhaseField(f, g, -1, 1, -1, 1, 2);
    const origin = arrows.find(a => Math.abs(a.x) < 0.01 && Math.abs(a.y) < 0.01);
    if (origin) {
      expect(Math.sqrt(origin.dx * origin.dx + origin.dy * origin.dy)).toBeCloseTo(0, 3);
    }
  });
});

describe('findEquilibria', () => {
  it('finds equilibrium at origin for dx/dt = -x, dy/dt = -y', () => {
    const f = (x: number, _y: number) => -x;
    const g = (_x: number, y: number) => -y;
    const eqs = findEquilibria(f, g, -2, 2, -2, 2);
    expect(eqs.length).toBeGreaterThan(0);
    const origin = eqs.find(e => Math.abs(e.x) < 0.01 && Math.abs(e.y) < 0.01);
    expect(origin).toBeDefined();
  });

  it('classifies stable equilibrium correctly', () => {
    const f = (x: number, _y: number) => -x;
    const g = (_x: number, y: number) => -y;
    const eqs = findEquilibria(f, g, -2, 2, -2, 2);
    const origin = eqs.find(e => Math.abs(e.x) < 0.01 && Math.abs(e.y) < 0.01);
    expect(origin?.type).toBe('stable');
  });
});

describe('useDiffEq hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useDiffEq());
    expect(result.current.state.expression).toBe('-y');
    expect(result.current.state.expression2).toBe('x');
    expect(result.current.state.mode).toBe('firstOrder');
    expect(result.current.state.method).toBe('rk4');
    expect(result.current.state.solution).toBeNull();
  });

  it('setExpression updates expression', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => result.current.setExpression('x - y'));
    expect(result.current.state.expression).toBe('x - y');
  });

  it('setExpression2 updates second expression', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => result.current.setExpression2('-x'));
    expect(result.current.state.expression2).toBe('-x');
  });

  it('setMode clears solution', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => { result.current.solve(); result.current.setMode('system2D'); });
    expect(result.current.state.solution).toBeNull();
  });

  it('setMethod updates method', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => result.current.setMethod('euler'));
    expect(result.current.state.method).toBe('euler');
  });

  it('solve produces solution points', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => result.current.solve());
    expect(result.current.state.solution).not.toBeNull();
    expect(result.current.state.solution!.length).toBeGreaterThan(0);
  });

  it('solve with dy/dx = -y from y(0)=1 gives ~e^-6 at x=6', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => {
      result.current.setExpression('-y');
      result.current.setX0(0);
      result.current.setY0(1);
      result.current.setXEnd(6);
      result.current.solve();
    });
    const sol = result.current.state.solution;
    expect(sol).not.toBeNull();
    const last = sol![sol!.length - 1];
    expect(last.y).toBeCloseTo(Math.exp(-6), 3);
  });

  it('getSlopeField returns arrows', () => {
    const { result } = renderHook(() => useDiffEq());
    const arrows = result.current.getSlopeField();
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('getPhaseField returns arrows', () => {
    const { result } = renderHook(() => useDiffEq());
    const arrows = result.current.getPhaseField();
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('setX0/setY0/setXEnd update state', () => {
    const { result } = renderHook(() => useDiffEq());
    act(() => {
      result.current.setX0(1);
      result.current.setY0(2);
      result.current.setXEnd(5);
    });
    expect(result.current.state.x0).toBe(1);
    expect(result.current.state.y0).toBe(2);
    expect(result.current.state.xEnd).toBe(5);
  });
});
