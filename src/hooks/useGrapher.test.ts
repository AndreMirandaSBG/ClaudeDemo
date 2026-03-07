import { renderHook, act } from '@testing-library/react';
import { useGrapher, evaluateGraphExpression, findSpecialPoints } from './useGrapher';

// ─── evaluateGraphExpression ──────────────────────────────────────────────────

describe('evaluateGraphExpression', () => {
  it('evaluates basic arithmetic', () => {
    expect(evaluateGraphExpression('2+3', 0)).toBe(5);
    expect(evaluateGraphExpression('10-4', 0)).toBe(6);
    expect(evaluateGraphExpression('3*4', 0)).toBe(12);
    expect(evaluateGraphExpression('8/2', 0)).toBe(4);
  });

  it('evaluates x variable', () => {
    expect(evaluateGraphExpression('x', 5)).toBe(5);
    expect(evaluateGraphExpression('x*2', 3)).toBe(6);
    expect(evaluateGraphExpression('x+1', -4)).toBe(-3);
  });

  it('evaluates power', () => {
    expect(evaluateGraphExpression('x^2', 3)).toBe(9);
    expect(evaluateGraphExpression('2^x', 3)).toBe(8);
  });

  it('evaluates trig functions (radians)', () => {
    expect(evaluateGraphExpression('sin(0)', 0)).toBeCloseTo(0);
    expect(evaluateGraphExpression('cos(0)', 0)).toBeCloseTo(1);
    expect(evaluateGraphExpression('sin(x)', Math.PI / 2)).toBeCloseTo(1);
  });

  it('evaluates log and sqrt', () => {
    expect(evaluateGraphExpression('sqrt(4)', 0)).toBe(2);
    expect(evaluateGraphExpression('log(100)', 0)).toBeCloseTo(2);
    expect(evaluateGraphExpression('ln(1)', 0)).toBeCloseTo(0);
  });

  it('supports pi constant', () => {
    expect(evaluateGraphExpression('π', 0)).toBeCloseTo(Math.PI);
  });

  it('returns NaN for invalid expressions', () => {
    expect(evaluateGraphExpression('', 0)).toBeNaN();
    expect(evaluateGraphExpression('unknown(x)', 1)).toBeNaN();
  });

  it('returns NaN for division by zero', () => {
    expect(isFinite(evaluateGraphExpression('1/0', 0))).toBe(false);
  });

  it('evaluates nested expressions', () => {
    expect(evaluateGraphExpression('2*(x+3)', 2)).toBe(10);
    expect(evaluateGraphExpression('sin(x^2)', 0)).toBeCloseTo(0);
  });
});

// ─── findSpecialPoints ────────────────────────────────────────────────────────

describe('findSpecialPoints', () => {
  it('finds root of x at x=0', () => {
    const pts = findSpecialPoints('x', -5, 5);
    const root = pts.find(p => p.type === 'root');
    expect(root).toBeDefined();
    expect(root!.x).toBeCloseTo(0, 3);
  });

  it('finds root of x^2-1 at x=1 and x=-1', () => {
    const pts = findSpecialPoints('x^2-1', -5, 5);
    const roots = pts.filter(p => p.type === 'root');
    expect(roots.length).toBe(2);
    const xs = roots.map(r => Math.round(r.x * 10) / 10).sort((a, b) => a - b);
    expect(xs[0]).toBeCloseTo(-1, 1);
    expect(xs[1]).toBeCloseTo(1, 1);
  });

  it('finds minimum of x^2 at x=0', () => {
    const pts = findSpecialPoints('x^2', -5, 5);
    const minPt = pts.find(p => p.type === 'minimum');
    expect(minPt).toBeDefined();
    expect(minPt!.x).toBeCloseTo(0, 2);
    expect(minPt!.y).toBeCloseTo(0, 2);
  });

  it('finds maximum of -x^2 at x=0', () => {
    const pts = findSpecialPoints('-x^2', -5, 5);
    const maxPt = pts.find(p => p.type === 'maximum');
    expect(maxPt).toBeDefined();
    expect(maxPt!.x).toBeCloseTo(0, 2);
  });

  it('returns empty array for empty expression', () => {
    expect(findSpecialPoints('', -5, 5)).toEqual([]);
  });
});

// ─── useGrapher hook ──────────────────────────────────────────────────────────

describe('useGrapher', () => {
  it('starts with one function and default viewport', () => {
    const { result } = renderHook(() => useGrapher());
    expect(result.current.functions).toHaveLength(1);
    expect(result.current.viewport).toEqual({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
  });

  it('adds a function', () => {
    const { result } = renderHook(() => useGrapher());
    act(() => result.current.addFunction());
    expect(result.current.functions).toHaveLength(2);
  });

  it('does not add more than 4 functions', () => {
    const { result } = renderHook(() => useGrapher());
    act(() => result.current.addFunction());
    act(() => result.current.addFunction());
    act(() => result.current.addFunction());
    act(() => result.current.addFunction());
    expect(result.current.functions).toHaveLength(4);
  });

  it('removes a function (keeps at least 1)', () => {
    const { result } = renderHook(() => useGrapher());
    const id = result.current.functions[0].id;
    act(() => result.current.removeFunction(id));
    expect(result.current.functions).toHaveLength(1); // cannot go below 1
  });

  it('removes one of two functions', () => {
    const { result } = renderHook(() => useGrapher());
    act(() => result.current.addFunction());
    const id = result.current.functions[0].id;
    act(() => result.current.removeFunction(id));
    expect(result.current.functions).toHaveLength(1);
  });

  it('updates function expression', () => {
    const { result } = renderHook(() => useGrapher());
    const id = result.current.functions[0].id;
    act(() => result.current.updateFunction(id, 'x^2'));
    expect(result.current.functions[0].expression).toBe('x^2');
  });

  it('toggles function visibility', () => {
    const { result } = renderHook(() => useGrapher());
    const id = result.current.functions[0].id;
    expect(result.current.functions[0].visible).toBe(true);
    act(() => result.current.toggleVisible(id));
    expect(result.current.functions[0].visible).toBe(false);
  });

  it('zooms viewport', () => {
    const { result } = renderHook(() => useGrapher());
    act(() => result.current.zoom(2));
    expect(result.current.viewport.xMax).toBeGreaterThan(10);
  });

  it('pans viewport', () => {
    const { result } = renderHook(() => useGrapher());
    act(() => result.current.pan(5, 0));
    expect(result.current.viewport.xMin).toBeCloseTo(-5);
    expect(result.current.viewport.xMax).toBeCloseTo(15);
  });

  it('resets viewport', () => {
    const { result } = renderHook(() => useGrapher());
    act(() => result.current.pan(5, 5));
    act(() => result.current.resetViewport());
    expect(result.current.viewport).toEqual({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
  });

  it('toggles special points', () => {
    const { result } = renderHook(() => useGrapher());
    expect(result.current.showSpecialPoints).toBe(true);
    act(() => result.current.toggleSpecialPoints());
    expect(result.current.showSpecialPoints).toBe(false);
  });
});
