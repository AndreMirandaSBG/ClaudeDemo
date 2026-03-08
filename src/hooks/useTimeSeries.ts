import { useState, useCallback } from 'react';
import type {
  TimeSeriesState, TimeSeriesPoint, TimeSeriesMode,
  TimeSeriesDecomposition, TimeSeriesForecast, ACFPoint,
} from '../types/calculator';

// ─── Pure helpers (exported for testing) ─────────────────────────────────────

export function computeACFValues(values: number[], maxLag: number): number[] {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  if (variance < 1e-12) return Array(maxLag + 1).fill(0);
  const acf = [1];
  for (let lag = 1; lag <= maxLag; lag++) {
    let cov = 0;
    for (let i = lag; i < n; i++) cov += (values[i] - mean) * (values[i - lag] - mean);
    acf.push(cov / (n * variance));
  }
  return acf;
}

// Durbin-Levinson recursion for PACF
export function computePACFValues(acf: number[], maxLag: number): number[] {
  const pacf = [1];
  if (maxLag < 1 || acf.length < 2) return pacf;

  let phi = [acf[1]];
  pacf.push(acf[1]);

  for (let k = 2; k <= maxLag; k++) {
    if (k >= acf.length) break;
    let num = acf[k];
    let den = 1;
    for (let j = 0; j < phi.length; j++) {
      num -= phi[j] * acf[k - 1 - j];
      den -= phi[j] * acf[j + 1];
    }
    const phiKK = Math.abs(den) < 1e-12 ? 0 : num / den;
    pacf.push(phiKK);
    const newPhi = phi.map((p, j) => p - phiKK * phi[phi.length - 1 - j]);
    newPhi.push(phiKK);
    phi = newPhi;
  }
  return pacf;
}

function movingAverage(values: number[], period: number): (number | null)[] {
  const half = Math.floor(period / 2);
  return values.map((_, i) => {
    if (i < half || i >= values.length - half) return null;
    let sum = 0;
    for (let j = i - half; j <= i + half; j++) sum += values[j];
    return sum / period;
  });
}

export function decomposeSeries(values: number[], period: number): TimeSeriesDecomposition {
  const n = values.length;
  const trendRaw = movingAverage(values, period);
  const trend = trendRaw.map(v => v ?? 0);

  const seasAvg = Array(period).fill(0);
  const seasCount = Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    if (trendRaw[i] !== null) {
      seasAvg[i % period] += values[i] - (trendRaw[i] as number);
      seasCount[i % period]++;
    }
  }
  for (let i = 0; i < period; i++) {
    if (seasCount[i] > 0) seasAvg[i] /= seasCount[i];
  }
  const seasMean = seasAvg.reduce((a, b) => a + b, 0) / period;
  const seasNorm = seasAvg.map(v => v - seasMean);
  const seasonal = Array.from({ length: n }, (_, i) => seasNorm[i % period]);
  const residual = values.map((v, i) => v - trend[i] - seasonal[i]);
  return { trend, seasonal, residual };
}

// Holt's double exponential smoothing with forecasting
export function holtForecast(
  values: number[], forecastSteps: number, alpha = 0.3, beta = 0.1,
): { fitted: number[]; forecast: TimeSeriesForecast } {
  const n = values.length;
  if (n === 0) return { fitted: [], forecast: { point: [], lower: [], upper: [] } };
  if (n === 1) {
    const f = values[0];
    return { fitted: [f], forecast: { point: Array(forecastSteps).fill(f), lower: Array(forecastSteps).fill(f), upper: Array(forecastSteps).fill(f) } };
  }

  let level = values[0];
  let trend = values[1] - values[0];
  const fitted = [level + trend];

  for (let i = 1; i < n; i++) {
    const prevL = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevL) + (1 - beta) * trend;
    fitted.push(level + trend);
  }

  const residuals = values.map((v, i) => v - fitted[i]);
  const mse = residuals.reduce((a, b) => a + b * b, 0) / n;
  const rmse = Math.sqrt(mse);

  const point: number[] = [];
  const lower: number[] = [];
  const upper: number[] = [];
  for (let h = 1; h <= forecastSteps; h++) {
    const f = level + h * trend;
    const ci = 1.96 * rmse * Math.sqrt(h);
    point.push(f); lower.push(f - ci); upper.push(f + ci);
  }
  return { fitted, forecast: { point, lower, upper } };
}

export function parseCSVData(text: string): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  for (const line of text.trim().split('\n')) {
    const parts = line.split(/[,\t;]/).map(s => s.trim());
    const value = parseFloat(parts[parts.length - 1]);
    if (!isNaN(value)) points.push({ t: points.length, value });
  }
  return points;
}

function generateSample(type: 'trend' | 'seasonal' | 'noisy'): TimeSeriesPoint[] {
  return Array.from({ length: 60 }, (_, t) => {
    let value: number;
    if (type === 'trend') value = 10 + 0.4 * t + 4 * Math.sin(t * Math.PI / 6) + (Math.random() - 0.5) * 3;
    else if (type === 'seasonal') value = 20 + 10 * Math.sin(t * Math.PI / 6) + 5 * Math.cos(t * Math.PI / 3) + (Math.random() - 0.5) * 3;
    else value = 15 + (Math.random() - 0.5) * 20;
    return { t, value };
  });
}

function buildACF(values: number[], maxLag: number): ACFPoint[] {
  const lag = Math.min(maxLag, Math.max(1, Math.floor(values.length / 2) - 1));
  const acf = computeACFValues(values, lag);
  const pacf = computePACFValues(acf, lag);
  return acf.map((a, i) => ({ lag: i, acf: a, pacf: pacf[i] ?? 0 }));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useTimeSeries = () => {
  const [state, setState] = useState<TimeSeriesState>({
    data: generateSample('trend'),
    mode: 'data',
    seasonalPeriod: 12,
    forecastSteps: 12,
    differencing: 0,
    decomposition: null,
    acf: [],
    forecast: null,
    maxLag: 20,
    smoothingAlpha: 0.3,
  });

  const computeAnalysis = useCallback((
    values: number[], period: number, forecastSteps: number, alpha: number, maxLag: number,
  ): Pick<TimeSeriesState, 'decomposition' | 'acf' | 'forecast'> => {
    const decomposition = values.length >= period * 2 ? decomposeSeries(values, period) : null;
    const acf = values.length > 2 ? buildACF(values, maxLag) : [];
    const { forecast } = holtForecast(values, forecastSteps, alpha);
    return { decomposition, acf, forecast };
  }, []);

  const setMode = useCallback((mode: TimeSeriesMode) => {
    setState(s => {
      const values = s.data.map(d => d.value);
      if (values.length === 0) return { ...s, mode };
      const analysis = computeAnalysis(values, s.seasonalPeriod, s.forecastSteps, s.smoothingAlpha, s.maxLag);
      return { ...s, mode, ...analysis };
    });
  }, [computeAnalysis]);

  const setData = useCallback((data: TimeSeriesPoint[]) => {
    setState(s => ({ ...s, data, decomposition: null, acf: [], forecast: null, differencing: 0 }));
  }, []);

  const parseAndSetData = useCallback((text: string) => {
    const data = parseCSVData(text);
    if (data.length > 0) setState(s => ({ ...s, data, decomposition: null, acf: [], forecast: null, differencing: 0 }));
  }, []);

  const loadSample = useCallback((type: 'trend' | 'seasonal' | 'noisy') => {
    const data = generateSample(type);
    setState(s => ({ ...s, data, decomposition: null, acf: [], forecast: null, differencing: 0 }));
  }, []);

  const computeAll = useCallback(() => {
    setState(s => {
      const values = s.data.map(d => d.value);
      if (values.length === 0) return s;
      const analysis = computeAnalysis(values, s.seasonalPeriod, s.forecastSteps, s.smoothingAlpha, s.maxLag);
      return { ...s, ...analysis };
    });
  }, [computeAnalysis]);

  const applyDifferencing = useCallback(() => {
    setState(s => {
      if (s.data.length < 2) return s;
      const diffed: TimeSeriesPoint[] = s.data.slice(1).map((pt, i) => ({
        t: i, value: pt.value - s.data[i].value,
      }));
      return { ...s, data: diffed, differencing: s.differencing + 1, decomposition: null, acf: [], forecast: null };
    });
  }, []);

  const setSeasonalPeriod = useCallback((p: number) => {
    setState(s => ({ ...s, seasonalPeriod: Math.max(2, p) }));
  }, []);

  const setForecastSteps = useCallback((n: number) => {
    setState(s => ({ ...s, forecastSteps: Math.max(1, n) }));
  }, []);

  const setSmoothingAlpha = useCallback((a: number) => {
    setState(s => ({ ...s, smoothingAlpha: Math.max(0.01, Math.min(0.99, a)) }));
  }, []);

  const setMaxLag = useCallback((lag: number) => {
    setState(s => ({ ...s, maxLag: Math.max(1, lag) }));
  }, []);

  const exportForecast = useCallback(() => {
    setState(s => {
      if (!s.forecast) return s;
      let csv = 't,observed,forecast,lower,upper\n';
      for (const pt of s.data) csv += `${pt.t},${pt.value},,\n`;
      for (let i = 0; i < s.forecast.point.length; i++) {
        const t = s.data.length + i;
        csv += `${t},,${s.forecast.point[i].toFixed(4)},${s.forecast.lower[i].toFixed(4)},${s.forecast.upper[i].toFixed(4)}\n`;
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'forecast.csv'; a.click();
      URL.revokeObjectURL(url);
      return s;
    });
  }, []);

  return {
    state,
    setMode, setData, parseAndSetData, loadSample,
    computeAll, applyDifferencing,
    setSeasonalPeriod, setForecastSteps, setSmoothingAlpha, setMaxLag,
    exportForecast,
  };
};
