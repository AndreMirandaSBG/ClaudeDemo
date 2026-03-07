import { renderHook, act } from '@testing-library/react';
import {
  useComplex,
  complexAdd,
  complexSub,
  complexMul,
  complexDiv,
  complexModulus,
  complexArgument,
  complexConjugate,
  complexNthRoots,
  formatRectangular,
  formatPolar,
} from './useComplex';

// ─── Pure math functions ──────────────────────────────────────────────────────

describe('complexAdd', () => {
  it('adds two complex numbers', () => {
    expect(complexAdd({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: 4, im: 6 });
  });
  it('adds with negative imaginary', () => {
    expect(complexAdd({ re: 1, im: -2 }, { re: -1, im: 2 })).toEqual({ re: 0, im: 0 });
  });
});

describe('complexSub', () => {
  it('subtracts two complex numbers', () => {
    expect(complexSub({ re: 4, im: 6 }, { re: 1, im: 2 })).toEqual({ re: 3, im: 4 });
  });
});

describe('complexMul', () => {
  it('multiplies two complex numbers', () => {
    // (1+2i)(3+4i) = 3+4i+6i+8i² = 3+10i-8 = -5+10i
    expect(complexMul({ re: 1, im: 2 }, { re: 3, im: 4 })).toEqual({ re: -5, im: 10 });
  });
  it('i*i = -1', () => {
    expect(complexMul({ re: 0, im: 1 }, { re: 0, im: 1 })).toEqual({ re: -1, im: 0 });
  });
});

describe('complexDiv', () => {
  it('divides complex numbers', () => {
    // (4+2i)/(3-i): multiply by conjugate -> (4+2i)(3+i)/((3)²+(1)²) = (12+4i+6i+2i²)/10 = (10+10i)/10 = 1+i
    const r = complexDiv({ re: 4, im: 2 }, { re: 3, im: -1 });
    expect(r.re).toBeCloseTo(1);
    expect(r.im).toBeCloseTo(1);
  });
  it('throws on division by zero', () => {
    expect(() => complexDiv({ re: 1, im: 0 }, { re: 0, im: 0 })).toThrow('Division by zero');
  });
});

describe('complexModulus', () => {
  it('computes modulus of 3+4i = 5', () => {
    expect(complexModulus({ re: 3, im: 4 })).toBe(5);
  });
  it('modulus of purely real number', () => {
    expect(complexModulus({ re: -3, im: 0 })).toBe(3);
  });
});

describe('complexArgument', () => {
  it('argument of positive real = 0', () => {
    expect(complexArgument({ re: 1, im: 0 })).toBeCloseTo(0);
  });
  it('argument of positive imaginary = π/2', () => {
    expect(complexArgument({ re: 0, im: 1 })).toBeCloseTo(Math.PI / 2);
  });
  it('argument of -1 = π', () => {
    expect(complexArgument({ re: -1, im: 0 })).toBeCloseTo(Math.PI);
  });
});

describe('complexConjugate', () => {
  it('conjugate of a+bi = a-bi', () => {
    expect(complexConjugate({ re: 3, im: 4 })).toEqual({ re: 3, im: -4 });
  });
  it('conjugate of purely real number', () => {
    const r = complexConjugate({ re: 5, im: 0 });
    expect(r.re).toBe(5);
    expect(r.im).toBeCloseTo(0);
  });
});

describe('complexNthRoots', () => {
  it('square roots of -1 are ±i', () => {
    const roots = complexNthRoots({ re: -1, im: 0 }, 2);
    expect(roots).toHaveLength(2);
    // roots are i and -i
    expect(roots.some(r => Math.abs(r.re) < 1e-9 && Math.abs(Math.abs(r.im) - 1) < 1e-9)).toBe(true);
  });
  it('cube roots of 8 has one real root = 2', () => {
    const roots = complexNthRoots({ re: 8, im: 0 }, 3);
    expect(roots).toHaveLength(3);
    const realRoot = roots.find(r => Math.abs(r.im) < 1e-9);
    expect(realRoot).toBeDefined();
    expect(realRoot!.re).toBeCloseTo(2);
  });
  it('throws for n < 1', () => {
    expect(() => complexNthRoots({ re: 1, im: 0 }, 0)).toThrow();
  });
});

describe('formatRectangular', () => {
  it('formats real number', () => {
    expect(formatRectangular({ re: 3, im: 0 })).toBe('3');
  });
  it('formats purely imaginary', () => {
    expect(formatRectangular({ re: 0, im: 2 })).toBe('2i');
  });
  it('formats a+bi', () => {
    expect(formatRectangular({ re: 1, im: 2 })).toBe('1 + 2i');
  });
  it('formats a-bi', () => {
    expect(formatRectangular({ re: 1, im: -2 })).toBe('1 - 2i');
  });
});

describe('formatPolar', () => {
  it('formats polar form', () => {
    const result = formatPolar({ re: 1, im: 0 });
    expect(result).toContain('∠');
    expect(result).toContain('rad');
  });
});

// ─── useComplex hook ──────────────────────────────────────────────────────────

describe('useComplex', () => {
  it('starts with default state', () => {
    const { result } = renderHook(() => useComplex());
    expect(result.current.inputRe).toBe('0');
    expect(result.current.inputIm).toBe('0');
    expect(result.current.result).toBeNull();
    expect(result.current.form).toBe('rectangular');
  });

  it('updates inputRe and inputIm', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('3'));
    act(() => result.current.setInputIm('4'));
    expect(result.current.inputRe).toBe('3');
    expect(result.current.inputIm).toBe('4');
  });

  it('performs addition', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('1'));
    act(() => result.current.setInputIm('2'));
    act(() => result.current.applyOperation('+'));
    act(() => result.current.setInputRe('3'));
    act(() => result.current.setInputIm('4'));
    act(() => result.current.compute());
    expect(result.current.result?.re).toBeCloseTo(4);
    expect(result.current.result?.im).toBeCloseTo(6);
  });

  it('computes conjugate', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('3'));
    act(() => result.current.setInputIm('4'));
    act(() => result.current.applyOperation('conj'));
    expect(result.current.result?.re).toBeCloseTo(3);
    expect(result.current.result?.im).toBeCloseTo(-4);
  });

  it('computes modulus', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('3'));
    act(() => result.current.setInputIm('4'));
    act(() => result.current.applyOperation('mod'));
    expect(result.current.result?.re).toBeCloseTo(5);
    expect(result.current.result?.im).toBeCloseTo(0);
  });

  it('computes argument', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('0'));
    act(() => result.current.setInputIm('1'));
    act(() => result.current.applyOperation('arg'));
    expect(result.current.result?.re).toBeCloseTo(Math.PI / 2);
  });

  it('computes square roots', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('-1'));
    act(() => result.current.setInputIm('0'));
    act(() => result.current.applyOperation('roots2'));
    expect(result.current.result).not.toBeNull();
    expect(result.current.plotPoints).toHaveLength(2);
  });

  it('adds point to plot', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('1'));
    act(() => result.current.setInputIm('1'));
    act(() => result.current.addToPlot());
    expect(result.current.plotPoints).toHaveLength(1);
  });

  it('clears plot', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.addToPlot());
    act(() => result.current.clearPlot());
    expect(result.current.plotPoints).toHaveLength(0);
  });

  it('toggles form', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.toggleForm());
    expect(result.current.form).toBe('polar');
    act(() => result.current.toggleForm());
    expect(result.current.form).toBe('rectangular');
  });

  it('clears all state', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('5'));
    act(() => result.current.clearAll());
    expect(result.current.inputRe).toBe('0');
    expect(result.current.result).toBeNull();
  });

  it('saves history on operation', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('3'));
    act(() => result.current.setInputIm('4'));
    act(() => result.current.applyOperation('mod'));
    expect(result.current.history).toHaveLength(1);
  });

  it('useResult copies result to input', () => {
    const { result } = renderHook(() => useComplex());
    act(() => result.current.setInputRe('3'));
    act(() => result.current.setInputIm('4'));
    act(() => result.current.applyOperation('conj'));
    act(() => result.current.useResult());
    expect(result.current.inputRe).toBe('3');
    expect(result.current.inputIm).toBe('-4');
    expect(result.current.result).toBeNull();
  });
});
