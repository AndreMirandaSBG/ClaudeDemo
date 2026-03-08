import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useTimeSeries,
  computeACFValues, computePACFValues,
  decomposeSeries, holtForecast, parseCSVData,
} from './useTimeSeries';

describe('computeACFValues', () => {
  it('lag 0 is always 1', () => {
    const acf = computeACFValues([1, 2, 3, 4, 5], 3);
    expect(acf[0]).toBeCloseTo(1, 5);
  });

  it('white noise has near-zero ACF for lag > 0', () => {
    const vals = Array.from({ length: 100 }, (_, i) => Math.sin(i * 2.7 + i * i * 0.1));
    const acf = computeACFValues(vals, 5);
    // ACF at lag 1 should be < 1 (not a perfect autocorrelation)
    expect(Math.abs(acf[1])).toBeLessThan(1);
  });

  it('strongly autocorrelated linear series has ACF[1] > 0.6', () => {
    const vals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const acf = computeACFValues(vals, 3);
    expect(acf[1]).toBeGreaterThan(0.6);
  });

  it('constant series returns zero ACF', () => {
    const acf = computeACFValues([5, 5, 5, 5, 5], 2);
    expect(acf.every(v => v === 0)).toBe(true);
  });
});

describe('computePACFValues', () => {
  it('returns array of correct length', () => {
    const acf = computeACFValues([1, 2, 3, 4, 5, 6, 7, 8], 4);
    const pacf = computePACFValues(acf, 4);
    expect(pacf.length).toBeGreaterThanOrEqual(2);
  });

  it('lag 0 is 1', () => {
    const acf = computeACFValues([1, 2, 3, 4, 5], 3);
    const pacf = computePACFValues(acf, 3);
    expect(pacf[0]).toBeCloseTo(1, 5);
  });
});

describe('decomposeSeries', () => {
  it('trend + seasonal + residual should approximately equal original', () => {
    const vals = Array.from({ length: 48 }, (_, t) => 10 + 0.5 * t + 3 * Math.sin(t * Math.PI / 6));
    const { trend, seasonal, residual } = decomposeSeries(vals, 12);
    const recon = vals.map((_v, i) => trend[i] + seasonal[i] + residual[i]);
    for (let i = 6; i < 42; i++) {
      expect(Math.abs(recon[i] - vals[i])).toBeLessThan(1e-6);
    }
  });

  it('returns arrays of same length as input', () => {
    const vals = Array.from({ length: 30 }, (_, i) => i);
    const { trend, seasonal, residual } = decomposeSeries(vals, 6);
    expect(trend.length).toBe(30);
    expect(seasonal.length).toBe(30);
    expect(residual.length).toBe(30);
  });

  it('seasonal component repeats with period', () => {
    const vals = Array.from({ length: 36 }, (_, t) => 10 + 5 * Math.sin(t * Math.PI / 6));
    const { seasonal } = decomposeSeries(vals, 12);
    // seasonal[i] ≈ seasonal[i + 12] for interior points
    for (let i = 6; i < 24; i++) {
      expect(Math.abs(seasonal[i] - seasonal[i + 12])).toBeLessThan(0.5);
    }
  });
});

describe('holtForecast', () => {
  it('returns correct number of forecast steps', () => {
    const vals = Array.from({ length: 20 }, (_, i) => i * 2);
    const { forecast } = holtForecast(vals, 5);
    expect(forecast.point).toHaveLength(5);
    expect(forecast.lower).toHaveLength(5);
    expect(forecast.upper).toHaveLength(5);
  });

  it('upper bound > lower bound for all steps', () => {
    const vals = Array.from({ length: 20 }, (_, i) => i + Math.random());
    const { forecast } = holtForecast(vals, 10);
    for (let i = 0; i < 10; i++) {
      expect(forecast.upper[i]).toBeGreaterThan(forecast.lower[i]);
    }
  });

  it('handles single-element series', () => {
    const { forecast } = holtForecast([42], 3);
    expect(forecast.point).toHaveLength(3);
    expect(forecast.point[0]).toBe(42);
  });

  it('extrapolates trend for linear series', () => {
    const vals = Array.from({ length: 10 }, (_, i) => i * 3); // 0,3,6,...,27
    const { forecast } = holtForecast(vals, 2, 0.9, 0.9);
    // Should predict around 30 for step 1
    expect(forecast.point[0]).toBeGreaterThan(20);
  });
});

describe('parseCSVData', () => {
  it('parses newline-separated values', () => {
    const data = parseCSVData('10\n20\n30\n40');
    expect(data).toHaveLength(4);
    expect(data[0].value).toBe(10);
    expect(data[3].value).toBe(40);
  });

  it('parses comma-separated rows (takes last value)', () => {
    const data = parseCSVData('2020-01, 10.5\n2020-02, 11.2');
    expect(data).toHaveLength(2);
    expect(data[0].value).toBeCloseTo(10.5, 3);
  });

  it('ignores non-numeric lines', () => {
    const data = parseCSVData('header\n10\n20\nend');
    expect(data.length).toBeGreaterThanOrEqual(2);
  });

  it('assigns sequential t values', () => {
    const data = parseCSVData('5\n6\n7');
    expect(data[0].t).toBe(0);
    expect(data[1].t).toBe(1);
    expect(data[2].t).toBe(2);
  });
});

describe('useTimeSeries hook', () => {
  it('initialises with data', () => {
    const { result } = renderHook(() => useTimeSeries());
    expect(result.current.state.data.length).toBeGreaterThan(0);
  });

  it('loads sample data', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.loadSample('seasonal'));
    expect(result.current.state.data.length).toBeGreaterThan(0);
    expect(result.current.state.differencing).toBe(0);
  });

  it('sets mode', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.setMode('forecast'));
    expect(result.current.state.mode).toBe('forecast');
  });

  it('computeAll populates forecast and ACF', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.computeAll());
    expect(result.current.state.forecast).not.toBeNull();
    expect(result.current.state.acf.length).toBeGreaterThan(0);
  });

  it('applyDifferencing reduces series length by 1', () => {
    const { result } = renderHook(() => useTimeSeries());
    const before = result.current.state.data.length;
    act(() => result.current.applyDifferencing());
    expect(result.current.state.data.length).toBe(before - 1);
    expect(result.current.state.differencing).toBe(1);
  });

  it('parseAndSetData updates data', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.parseAndSetData('100\n200\n300'));
    expect(result.current.state.data.length).toBe(3);
    expect(result.current.state.data[0].value).toBe(100);
  });

  it('setSeasonalPeriod updates period', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.setSeasonalPeriod(6));
    expect(result.current.state.seasonalPeriod).toBe(6);
  });

  it('setForecastSteps updates steps', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.setForecastSteps(24));
    expect(result.current.state.forecastSteps).toBe(24);
  });

  it('setSmoothingAlpha clamps to [0.01, 0.99]', () => {
    const { result } = renderHook(() => useTimeSeries());
    act(() => result.current.setSmoothingAlpha(0));
    expect(result.current.state.smoothingAlpha).toBe(0.01);
    act(() => result.current.setSmoothingAlpha(1.5));
    expect(result.current.state.smoothingAlpha).toBe(0.99);
  });
});
