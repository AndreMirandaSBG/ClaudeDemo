import { useState, useCallback } from 'react';
import type { ChartType, StatResult, LinearRegression } from '../types/calculator';

// ─── Statistics computation ───────────────────────────────────────────────────

function computeMean(data: number[]): number {
  return data.reduce((s, v) => s + v, 0) / data.length;
}

function computeMedian(sorted: number[]): number {
  const n = sorted.length;
  return n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
}

function computeMode(data: number[]): number[] {
  const freq = new Map<number, number>();
  for (const v of data) freq.set(v, (freq.get(v) ?? 0) + 1);
  const max = Math.max(...freq.values());
  return [...freq.entries()].filter(([, c]) => c === max).map(([v]) => v).sort((a, b) => a - b);
}

function computeVariance(data: number[], mean: number): number {
  return data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
}

function computeLinearRegression(xs: number[], ys: number[]): LinearRegression | null {
  const n = xs.length;
  if (n < 2) return null;
  const meanX = computeMean(xs);
  const meanY = computeMean(ys);
  const num = xs.reduce((s, x, i) => s + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((s, x) => s + (x - meanX) ** 2, 0);
  if (den === 0) return null;
  const slope = num / den;
  const intercept = meanY - slope * meanX;

  const ssTot = ys.reduce((s, y) => s + (y - meanY) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

function buildResult(data: number[], xs: number[], ys: number[]): StatResult {
  const sorted = [...data].sort((a, b) => a - b);
  const mean = computeMean(data);
  const variance = computeVariance(data, mean);
  const regression = xs.length >= 2 && ys.length === xs.length
    ? computeLinearRegression(xs, ys)
    : null;
  return {
    mean,
    median: computeMedian(sorted),
    mode: computeMode(data),
    variance,
    stdDev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    count: data.length,
    regression,
  };
}

// ─── Input parsing ────────────────────────────────────────────────────────────

function parseNumbers(raw: string): number[] {
  return raw
    .split(/[\s,;]+/)
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(Number)
    .filter(n => isFinite(n));
}

function parseXYPairs(raw: string): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  // Support formats: "x1,y1;x2,y2" or "x1 y1\nx2 y2"
  const lines = raw.split(/[;\n]+/).map(s => s.trim()).filter(Boolean);
  for (const line of lines) {
    const parts = line.split(/[\s,]+/).map(Number);
    if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
      xs.push(parts[0]);
      ys.push(parts[1]);
    }
  }
  return { xs, ys };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStatistics() {
  const [rawInput, setRawInput] = useState('');
  const [data, setData] = useState<number[]>([]);
  const [xData, setXData] = useState<number[]>([]);
  const [yData, setYData] = useState<number[]>([]);
  const [result, setResult] = useState<StatResult | null>(null);
  const [chartType, setChartTypeState] = useState<ChartType>('histogram');
  const [showRegression, setShowRegression] = useState(true);
  const [parseError, setParseError] = useState('');

  const parseInput = useCallback((input: string) => {
    setRawInput(input);
    const nums = parseNumbers(input);
    if (nums.length === 0) {
      setData([]);
      setXData([]);
      setYData([]);
      setResult(null);
      setParseError('');
      return;
    }
    setParseError('');
    const { xs, ys } = parseXYPairs(input);
    setData(nums);
    setXData(xs);
    setYData(ys);
    setResult(buildResult(nums, xs, ys));
  }, []);

  const setChartType = useCallback((type: ChartType) => {
    setChartTypeState(type);
  }, []);

  const toggleRegression = useCallback(() => {
    setShowRegression(prev => !prev);
  }, []);

  const clearData = useCallback(() => {
    setRawInput('');
    setData([]);
    setXData([]);
    setYData([]);
    setResult(null);
    setParseError('');
  }, []);

  return {
    rawInput,
    data,
    xData,
    yData,
    result,
    chartType,
    showRegression,
    parseError,
    parseInput,
    setChartType,
    toggleRegression,
    clearData,
  };
}
