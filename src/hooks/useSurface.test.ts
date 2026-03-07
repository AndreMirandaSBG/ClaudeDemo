import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSurface, evaluateSurface, evaluateParam1 } from './useSurface';

describe('evaluateSurface', () => {
  it('evaluates x + y', () => {
    expect(evaluateSurface('x + y', 2, 3)).toBeCloseTo(5);
  });

  it('evaluates x * y', () => {
    expect(evaluateSurface('x * y', 3, 4)).toBeCloseTo(12);
  });

  it('evaluates sin(x)', () => {
    expect(evaluateSurface('sin(x)', Math.PI / 2, 0)).toBeCloseTo(1);
  });

  it('evaluates sqrt(x*x + y*y)', () => {
    expect(evaluateSurface('sqrt(x*x + y*y)', 3, 4)).toBeCloseTo(5);
  });

  it('returns NaN for invalid expression', () => {
    expect(evaluateSurface('!!bad!!', 0, 0)).toBeNaN();
  });
});

describe('evaluateParam1', () => {
  it('evaluates cos(t)', () => {
    expect(evaluateParam1('cos(t)', 0)).toBeCloseTo(1);
  });

  it('evaluates t * t', () => {
    expect(evaluateParam1('t * t', 3)).toBeCloseTo(9);
  });
});

describe('useSurface hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useSurface());
    expect(result.current.state.plotType).toBe('surface');
    expect(result.current.state.rotX).toBeCloseTo(0.5);
    expect(result.current.state.rotY).toBeCloseTo(0.3);
    expect(result.current.state.scale).toBe(1);
    expect(result.current.state.samples).toBe(25);
  });

  it('setExpression updates expression', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setExpression('x * y'));
    expect(result.current.state.expression).toBe('x * y');
  });

  it('setPlotType updates plot type', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setPlotType('parametric-curve'));
    expect(result.current.state.plotType).toBe('parametric-curve');
  });

  it('setXParam updates xParamExpr', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setXParam('t * t'));
    expect(result.current.state.xParamExpr).toBe('t * t');
  });

  it('setYParam updates yParamExpr', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setYParam('sin(t)'));
    expect(result.current.state.yParamExpr).toBe('sin(t)');
  });

  it('setZParam updates zParamExpr', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setZParam('cos(t)'));
    expect(result.current.state.zParamExpr).toBe('cos(t)');
  });

  it('rotate increases rotY when dx > 0', () => {
    const { result } = renderHook(() => useSurface());
    const initialRotY = result.current.state.rotY;
    act(() => result.current.rotate(10, 0));
    expect(result.current.state.rotY).toBeGreaterThan(initialRotY);
  });

  it('rotate increases rotX when dy > 0', () => {
    const { result } = renderHook(() => useSurface());
    const initialRotX = result.current.state.rotX;
    act(() => result.current.rotate(0, 10));
    expect(result.current.state.rotX).toBeGreaterThan(initialRotX);
  });

  it('rotX is clamped to [-PI/2, PI/2]', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.rotate(0, 10000));
    expect(result.current.state.rotX).toBeLessThanOrEqual(Math.PI / 2);
    act(() => result.current.rotate(0, -20000));
    expect(result.current.state.rotX).toBeGreaterThanOrEqual(-Math.PI / 2);
  });

  it('resetView restores defaults', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.rotate(100, 100));
    act(() => result.current.zoomIn());
    act(() => result.current.resetView());
    expect(result.current.state.scale).toBe(1);
    expect(result.current.state.rotX).toBeCloseTo(0.5);
    expect(result.current.state.rotY).toBeCloseTo(0.3);
  });

  it('zoomIn increases scale', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.zoomIn());
    expect(result.current.state.scale).toBeGreaterThan(1);
  });

  it('zoomOut decreases scale', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.zoomOut());
    expect(result.current.state.scale).toBeLessThan(1);
  });

  it('zoomIn is capped at 5', () => {
    const { result } = renderHook(() => useSurface());
    for (let i = 0; i < 30; i++) act(() => result.current.zoomIn());
    expect(result.current.state.scale).toBeLessThanOrEqual(5);
  });

  it('zoomOut is floored at 0.1', () => {
    const { result } = renderHook(() => useSurface());
    for (let i = 0; i < 30; i++) act(() => result.current.zoomOut());
    expect(result.current.state.scale).toBeGreaterThanOrEqual(0.1);
  });

  it('setSamples updates samples', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setSamples(15));
    expect(result.current.state.samples).toBe(15);
  });

  it('sampleSurface returns quads for x + y', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setExpression('x + y'));
    act(() => result.current.setSamples(10));
    const { quads } = result.current.sampleSurface();
    expect(quads.length).toBeGreaterThan(0);
    expect(quads[0].points).toHaveLength(4);
    expect(quads[0].normalizedZ).toBeGreaterThanOrEqual(0);
    expect(quads[0].normalizedZ).toBeLessThanOrEqual(1);
  });

  it('sampleSurface returns zMin <= zMax', () => {
    const { result } = renderHook(() => useSurface());
    act(() => result.current.setSamples(5));
    const { zMin, zMax } = result.current.sampleSurface();
    expect(zMin).toBeLessThanOrEqual(zMax);
  });

  it('sampleParametricCurve returns points', () => {
    const { result } = renderHook(() => useSurface());
    const pts = result.current.sampleParametricCurve();
    expect(pts.length).toBeGreaterThan(0);
    expect(pts[0]).toHaveProperty('x');
    expect(pts[0]).toHaveProperty('y');
    expect(pts[0]).toHaveProperty('z');
    expect(pts.every(p => isFinite(p.x) && isFinite(p.y) && isFinite(p.z))).toBe(true);
  });

  it('sampleParametricSurface returns quads', () => {
    const { result } = renderHook(() => useSurface());
    // Parametric surface uses u and v; set sphere expressions
    act(() => result.current.setXParam('sin(v)*cos(u)'));
    act(() => result.current.setYParam('sin(v)*sin(u)'));
    act(() => result.current.setZParam('cos(v)'));
    act(() => result.current.setSamples(5));
    const { quads } = result.current.sampleParametricSurface();
    expect(quads.length).toBeGreaterThan(0);
  });
});
