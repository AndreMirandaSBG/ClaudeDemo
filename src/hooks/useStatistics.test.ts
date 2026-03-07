import { renderHook, act } from '@testing-library/react';
import { useStatistics } from './useStatistics';

describe('useStatistics', () => {
  it('starts with empty state', () => {
    const { result } = renderHook(() => useStatistics());
    expect(result.current.data).toEqual([]);
    expect(result.current.result).toBeNull();
  });

  it('parses comma-separated numbers', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1, 2, 3, 4, 5'));
    expect(result.current.data).toEqual([1, 2, 3, 4, 5]);
  });

  it('parses space-separated numbers', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('10 20 30'));
    expect(result.current.data).toEqual([10, 20, 30]);
  });

  it('computes mean', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('2, 4, 6'));
    expect(result.current.result?.mean).toBeCloseTo(4);
  });

  it('computes median (odd count)', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1, 3, 5'));
    expect(result.current.result?.median).toBe(3);
  });

  it('computes median (even count)', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1, 2, 3, 4'));
    expect(result.current.result?.median).toBe(2.5);
  });

  it('computes mode', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1, 2, 2, 3'));
    expect(result.current.result?.mode).toEqual([2]);
  });

  it('computes variance', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('2, 4, 4, 4, 5, 5, 7, 9'));
    expect(result.current.result?.variance).toBeCloseTo(4);
  });

  it('computes standard deviation', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('2, 4, 4, 4, 5, 5, 7, 9'));
    expect(result.current.result?.stdDev).toBeCloseTo(2);
  });

  it('computes min and max', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('5, 1, 8, 3'));
    expect(result.current.result?.min).toBe(1);
    expect(result.current.result?.max).toBe(8);
  });

  it('computes count', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('10, 20, 30, 40'));
    expect(result.current.result?.count).toBe(4);
  });

  it('parses x,y pairs for scatter/regression', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1,2;3,4;5,6'));
    expect(result.current.xData).toEqual([1, 3, 5]);
    expect(result.current.yData).toEqual([2, 4, 6]);
  });

  it('computes linear regression', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1,2;2,4;3,6;4,8'));
    expect(result.current.result?.regression?.slope).toBeCloseTo(2);
    expect(result.current.result?.regression?.intercept).toBeCloseTo(0);
    expect(result.current.result?.regression?.r2).toBeCloseTo(1);
  });

  it('switches chart type', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.setChartType('scatter'));
    expect(result.current.chartType).toBe('scatter');
  });

  it('toggles regression display', () => {
    const { result } = renderHook(() => useStatistics());
    expect(result.current.showRegression).toBe(true);
    act(() => result.current.toggleRegression());
    expect(result.current.showRegression).toBe(false);
  });

  it('clears data', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1, 2, 3'));
    act(() => result.current.clearData());
    expect(result.current.data).toEqual([]);
    expect(result.current.result).toBeNull();
  });

  it('ignores non-numeric values', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('1, two, 3'));
    expect(result.current.data).toEqual([1, 3]);
  });

  it('handles single value (no regression)', () => {
    const { result } = renderHook(() => useStatistics());
    act(() => result.current.parseInput('42'));
    expect(result.current.result?.mean).toBe(42);
    expect(result.current.result?.regression).toBeNull();
  });
});
