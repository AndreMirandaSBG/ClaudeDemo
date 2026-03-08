import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCalculus, evaluateX, numericalDerivative, simpsonIntegral } from './useCalculus';

describe('evaluateX', () => {
  it('evaluates a constant', () => {
    expect(evaluateX('3', 0)).toBeCloseTo(3);
  });

  it('evaluates x', () => {
    expect(evaluateX('x', 5)).toBeCloseTo(5);
  });

  it('evaluates x^2', () => {
    expect(evaluateX('x^2', 3)).toBeCloseTo(9);
  });

  it('evaluates x^3 - 3*x at x=1', () => {
    expect(evaluateX('x^3 - 3*x', 1)).toBeCloseTo(-2);
  });

  it('evaluates sin(x) at π/2', () => {
    expect(evaluateX('sin(x)', Math.PI / 2)).toBeCloseTo(1);
  });

  it('evaluates sqrt(x) at 4', () => {
    expect(evaluateX('sqrt(x)', 4)).toBeCloseTo(2);
  });

  it('evaluates ln(x) at e', () => {
    expect(evaluateX('ln(x)', Math.E)).toBeCloseTo(1);
  });

  it('returns NaN for invalid expression', () => {
    expect(evaluateX('!bad!', 0)).toBeNaN();
  });
});

describe('numericalDerivative', () => {
  it('first derivative of x^2 is approximately 2x at x=3', () => {
    const f = (x: number) => x * x;
    expect(numericalDerivative(f, 3, 1)).toBeCloseTo(6, 3);
  });

  it('first derivative of x^3 is approximately 3x^2 at x=2', () => {
    const f = (x: number) => x * x * x;
    expect(numericalDerivative(f, 2, 1)).toBeCloseTo(12, 3);
  });

  it('second derivative of x^3 is approximately 6x at x=2', () => {
    const f = (x: number) => x * x * x;
    expect(numericalDerivative(f, 2, 2)).toBeCloseTo(12, 1);
  });

  it('derivative of constant is 0', () => {
    const f = (_x: number) => 5;
    expect(numericalDerivative(f, 1, 1)).toBeCloseTo(0, 3);
  });

  it('order 0 returns f(x)', () => {
    const f = (x: number) => x * x;
    expect(numericalDerivative(f, 3, 0)).toBeCloseTo(9);
  });

  it('derivative of sin(x) is cos(x)', () => {
    const f = Math.sin;
    expect(numericalDerivative(f, 0, 1)).toBeCloseTo(1, 3);
  });
});

describe('simpsonIntegral', () => {
  it('integral of 1 from 0 to 1 is 1', () => {
    expect(simpsonIntegral(() => 1, 0, 1)).toBeCloseTo(1, 5);
  });

  it('integral of x^2 from 0 to 1 is 1/3', () => {
    expect(simpsonIntegral(x => x * x, 0, 1)).toBeCloseTo(1 / 3, 4);
  });

  it('integral of sin(x) from 0 to π is 2', () => {
    expect(simpsonIntegral(Math.sin, 0, Math.PI)).toBeCloseTo(2, 4);
  });

  it('returns 0 when a >= b', () => {
    expect(simpsonIntegral(() => 1, 2, 1)).toBe(0);
    expect(simpsonIntegral(() => 1, 1, 1)).toBe(0);
  });
});

describe('useCalculus hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useCalculus());
    expect(result.current.state.expression).toBe('x^3 - 3*x');
    expect(result.current.state.mode).toBe('derivative');
    expect(result.current.state.derivativeOrder).toBe(1);
    expect(result.current.state.integralA).toBe(-1);
    expect(result.current.state.integralB).toBe(2);
    expect(result.current.state.tangentX).toBe(0);
  });

  it('setExpression updates expression', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setExpression('x^2'));
    expect(result.current.state.expression).toBe('x^2');
  });

  it('setMode toggles between derivative and integral', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setMode('integral'));
    expect(result.current.state.mode).toBe('integral');
    act(() => result.current.setMode('derivative'));
    expect(result.current.state.mode).toBe('derivative');
  });

  it('setDerivativeOrder updates order', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setDerivativeOrder(2));
    expect(result.current.state.derivativeOrder).toBe(2);
  });

  it('setIntegralA and setIntegralB update bounds', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => { result.current.setIntegralA(0); result.current.setIntegralB(3); });
    expect(result.current.state.integralA).toBe(0);
    expect(result.current.state.integralB).toBe(3);
  });

  it('setTangentX updates tangentX', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setTangentX(1.5));
    expect(result.current.state.tangentX).toBe(1.5);
  });

  it('sampleFunction returns 301 points', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setExpression('x'));
    const pts = result.current.sampleFunction(300);
    expect(pts).toHaveLength(301);
    expect(pts[0]).toHaveProperty('x');
    expect(pts[0]).toHaveProperty('y');
  });

  it('sampleFunction f(x)=x has y=x', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setExpression('x'));
    const pts = result.current.sampleFunction(10);
    for (const p of pts) {
      expect(p.y).toBeCloseTo(p.x, 5);
    }
  });

  it('sampleDerivative of x^2 is approximately 2x', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setExpression('x^2'));
    const pts = result.current.sampleDerivative(1, 10);
    expect(pts.length).toBeGreaterThan(0);
    for (const p of pts) {
      if (isFinite(p.y)) expect(p.y).toBeCloseTo(2 * p.x, 1);
    }
  });

  it('getTangentLine returns correct slope for x^2 at x=3', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setExpression('x^2'));
    const tangent = result.current.getTangentLine(3, 1);
    expect(tangent.slope).toBeCloseTo(6, 2);
    expect(tangent.y0).toBeCloseTo(9, 2);
    expect(tangent.x0).toBe(3);
  });

  it('computeIntegral returns value and steps for x^2 from 0 to 1', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => {
      result.current.setExpression('x^2');
      result.current.setIntegralA(0);
      result.current.setIntegralB(1);
    });
    const { value, steps } = result.current.computeIntegral();
    expect(value).toBeCloseTo(1 / 3, 4);
    expect(steps.length).toBeGreaterThan(3);
    expect(steps[0]).toContain('∫');
  });

  it('getDerivativeSteps returns steps and value', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => result.current.setExpression('x^2'));
    const { steps, value } = result.current.getDerivativeSteps(3, 1);
    expect(value).toBeCloseTo(6, 2);
    expect(steps.length).toBeGreaterThan(2);
  });

  it('setXMin and setXMax update viewport', () => {
    const { result } = renderHook(() => useCalculus());
    act(() => { result.current.setXMin(-10); result.current.setXMax(10); });
    expect(result.current.state.xMin).toBe(-10);
    expect(result.current.state.xMax).toBe(10);
  });
});
