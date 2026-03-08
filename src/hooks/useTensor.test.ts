import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useTensor,
  evaluateXY,
  gradient,
  divergence,
  curl2D,
  hessian,
  jacobian,
  gradientDescentPath,
} from './useTensor';

// ─── evaluateXY ───────────────────────────────────────────────────────────────

describe('evaluateXY', () => {
  it('evaluates x^2 + y^2 at (3, 4) → 25', () => {
    expect(evaluateXY('x^2 + y^2', 3, 4)).toBeCloseTo(25, 5);
  });

  it('evaluates sin(x) * cos(y) at (0, 0) → 0', () => {
    expect(evaluateXY('sin(x) * cos(y)', 0, 0)).toBeCloseTo(0, 5);
  });

  it('evaluates x*y at (2, 3) → 6', () => {
    expect(evaluateXY('x*y', 2, 3)).toBeCloseTo(6, 5);
  });

  it('evaluates constant pi', () => {
    expect(evaluateXY('pi', 0, 0)).toBeCloseTo(Math.PI, 5);
  });

  it('evaluates constant e', () => {
    expect(evaluateXY('e', 0, 0)).toBeCloseTo(Math.E, 5);
  });

  it('evaluates unary negation', () => {
    expect(evaluateXY('-x', 3, 0)).toBeCloseTo(-3, 5);
  });

  it('returns NaN for invalid expression', () => {
    expect(evaluateXY('bad_func(x)', 1, 1)).toBeNaN();
  });

  it('evaluates ln(e) → 1', () => {
    expect(evaluateXY('ln(e)', 0, 0)).toBeCloseTo(1, 5);
  });

  it('evaluates sqrt(x) at x=4 → 2', () => {
    expect(evaluateXY('sqrt(x)', 4, 0)).toBeCloseTo(2, 5);
  });

  it('evaluates abs(-x) at x=5 → 5', () => {
    expect(evaluateXY('abs(-x)', 5, 0)).toBeCloseTo(5, 5);
  });
});

// ─── gradient ─────────────────────────────────────────────────────────────────

describe('gradient', () => {
  it('gradient of x^2 + y^2 at (1, 1) → [2, 2]', () => {
    const [gx, gy] = gradient('x^2 + y^2', 1, 1);
    expect(gx).toBeCloseTo(2, 3);
    expect(gy).toBeCloseTo(2, 3);
  });

  it('gradient of x*y at (2, 3) → [3, 2]', () => {
    const [gx, gy] = gradient('x*y', 2, 3);
    expect(gx).toBeCloseTo(3, 3);
    expect(gy).toBeCloseTo(2, 3);
  });

  it('gradient of x^2 at (3, 0) → [6, 0]', () => {
    const [gx, gy] = gradient('x^2', 3, 0);
    expect(gx).toBeCloseTo(6, 3);
    expect(gy).toBeCloseTo(0, 3);
  });
});

// ─── divergence ───────────────────────────────────────────────────────────────

describe('divergence', () => {
  it('divergence of F=(-y, x) at any point → 0', () => {
    // ∂(-y)/∂x = 0, ∂(x)/∂y = 0  ⇒  divergence = 0
    expect(divergence('-y', 'x', 1, 2)).toBeCloseTo(0, 3);
    expect(divergence('-y', 'x', 0, 0)).toBeCloseTo(0, 3);
    expect(divergence('-y', 'x', -3, 5)).toBeCloseTo(0, 3);
  });

  it('divergence of F=(x, y) at any point → 2', () => {
    // ∂x/∂x + ∂y/∂y = 1 + 1 = 2
    expect(divergence('x', 'y', 1, 1)).toBeCloseTo(2, 3);
  });
});

// ─── curl2D ───────────────────────────────────────────────────────────────────

describe('curl2D', () => {
  it('curl2D of F=(-y, x) → 2', () => {
    // ∂(x)/∂x - ∂(-y)/∂y = 1 - (-1) = 2
    expect(curl2D('-y', 'x', 1, 1)).toBeCloseTo(2, 3);
    expect(curl2D('-y', 'x', 0, 0)).toBeCloseTo(2, 3);
  });

  it('curl2D of irrotational field F=(x, y) → 0', () => {
    // ∂(y)/∂x - ∂(x)/∂y = 0 - 0 = 0
    expect(curl2D('x', 'y', 2, 3)).toBeCloseTo(0, 3);
  });
});

// ─── hessian ──────────────────────────────────────────────────────────────────

describe('hessian', () => {
  it('hessian of x^2 + y^2 at (1, 1) → [[2, 0], [0, 2]]', () => {
    const [[fxx, fxy], [fyx, fyy]] = hessian('x^2 + y^2', 1, 1);
    expect(fxx).toBeCloseTo(2, 2);
    expect(fxy).toBeCloseTo(0, 2);
    expect(fyx).toBeCloseTo(0, 2);
    expect(fyy).toBeCloseTo(2, 2);
  });

  it('hessian of x*y at (1, 1) → [[0, 1], [1, 0]]', () => {
    const [[fxx, fxy], [fyx, fyy]] = hessian('x*y', 1, 1);
    expect(fxx).toBeCloseTo(0, 2);
    expect(fxy).toBeCloseTo(1, 2);
    expect(fyx).toBeCloseTo(1, 2);
    expect(fyy).toBeCloseTo(0, 2);
  });
});

// ─── jacobian ─────────────────────────────────────────────────────────────────

describe('jacobian', () => {
  it('jacobian of (x+y, x-y) at (1, 1) → [[1, 1], [1, -1]]', () => {
    const [[j00, j01], [j10, j11]] = jacobian('x+y', 'x-y', 1, 1);
    expect(j00).toBeCloseTo(1, 3);
    expect(j01).toBeCloseTo(1, 3);
    expect(j10).toBeCloseTo(1, 3);
    expect(j11).toBeCloseTo(-1, 3);
  });

  it('jacobian of (x^2, y^2) at (2, 3) → [[4, 0], [0, 6]]', () => {
    const [[j00, j01], [j10, j11]] = jacobian('x^2', 'y^2', 2, 3);
    expect(j00).toBeCloseTo(4, 3);
    expect(j01).toBeCloseTo(0, 3);
    expect(j10).toBeCloseTo(0, 3);
    expect(j11).toBeCloseTo(6, 3);
  });
});

// ─── gradientDescentPath ──────────────────────────────────────────────────────

describe('gradientDescentPath', () => {
  it('returns array with length = steps + 1', () => {
    const path = gradientDescentPath('x^2 + y^2', 2, 2, 0.1, 20);
    expect(path).toHaveLength(21);
  });

  it('first point has correct starting coordinates and z value', () => {
    const path = gradientDescentPath('x^2 + y^2', 2, 2, 0.1, 20);
    expect(path[0].x).toBeCloseTo(2, 5);
    expect(path[0].y).toBeCloseTo(2, 5);
    expect(path[0].z).toBeCloseTo(8, 5); // 2^2 + 2^2
  });

  it('z-values decrease initially for f(x,y)=x^2+y^2 starting at (2,2)', () => {
    const path = gradientDescentPath('x^2 + y^2', 2, 2, 0.1, 20);
    // The function is convex; gradient descent should decrease z at each step
    for (let i = 1; i < path.length; i++) {
      expect(path[i].z).toBeLessThan(path[i - 1].z);
    }
  });

  it('converges near origin for quadratic bowl', () => {
    const path = gradientDescentPath('x^2 + y^2', 2, 2, 0.1, 100);
    const last = path[path.length - 1];
    expect(Math.abs(last.x)).toBeLessThan(0.1);
    expect(Math.abs(last.y)).toBeLessThan(0.1);
  });

  it('handles steps=0 by returning just the starting point', () => {
    const path = gradientDescentPath('x^2 + y^2', 1, 1, 0.1, 0);
    expect(path).toHaveLength(1);
    expect(path[0].x).toBeCloseTo(1, 5);
  });
});

// ─── useTensor hook ───────────────────────────────────────────────────────────

describe('useTensor hook', () => {
  it('initializes with default mode "gradient"', () => {
    const { result } = renderHook(() => useTensor());
    expect(result.current.state.mode).toBe('gradient');
  });

  it('initializes with default fExpr "x^2 + y^2"', () => {
    const { result } = renderHook(() => useTensor());
    expect(result.current.state.fExpr).toBe('x^2 + y^2');
  });

  it('initializes with default learningRate 0.1', () => {
    const { result } = renderHook(() => useTensor());
    expect(result.current.state.learningRate).toBe(0.1);
  });

  it('setMode changes mode', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setMode('hessian');
    });
    expect(result.current.state.mode).toBe('hessian');
  });

  it('setFExpr updates fExpr', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setFExpr('x^3 + y^3');
    });
    expect(result.current.state.fExpr).toBe('x^3 + y^3');
  });

  it('setLearningRate updates learningRate', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setLearningRate(0.01);
    });
    expect(result.current.state.learningRate).toBe(0.01);
  });

  it('setFxExpr updates fxExpr', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setFxExpr('x*y');
    });
    expect(result.current.state.fxExpr).toBe('x*y');
  });

  it('setFyExpr updates fyExpr', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setFyExpr('x+y');
    });
    expect(result.current.state.fyExpr).toBe('x+y');
  });

  it('setGdSteps updates gdSteps', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setGdSteps(50);
    });
    expect(result.current.state.gdSteps).toBe(50);
  });

  it('setStartX updates startX', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setStartX(5);
    });
    expect(result.current.state.startX).toBe(5);
  });

  it('setStartY updates startY', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setStartY(-3);
    });
    expect(result.current.state.startY).toBe(-3);
  });

  it('multiple state updates are independent', () => {
    const { result } = renderHook(() => useTensor());
    act(() => {
      result.current.setMode('curl');
      result.current.setLearningRate(0.05);
    });
    expect(result.current.state.mode).toBe('curl');
    expect(result.current.state.learningRate).toBe(0.05);
    // Unchanged fields should retain defaults
    expect(result.current.state.fExpr).toBe('x^2 + y^2');
  });
});
