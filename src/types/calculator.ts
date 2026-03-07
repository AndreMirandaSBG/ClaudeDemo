export type Operator = '+' | '-' | '*' | '/';
export type AngleMode = 'DEG' | 'RAD' | 'GRAD';
export type InputType = 'digit' | 'decimal' | 'operator' | 'function' | 'paren' | 'constant' | 'result' | 'none';

export interface HistoryEntry {
  id: number;
  expression: string;
  result: string;
}

export interface CalculatorState {
  expression: string;
  display: string;
  lastInputType: InputType;
  justCalculated: boolean;
  isError: boolean;
  isInverse: boolean;
  angleMode: AngleMode;
  memory: number[];
  history: HistoryEntry[];
}

// ─── Graph types ─────────────────────────────────────────────────────────────

export interface GraphFunction {
  id: number;
  expression: string;
  color: string;
  visible: boolean;
}

export interface GraphViewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type SpecialPointType = 'root' | 'maximum' | 'minimum';

export interface GraphSpecialPoint {
  type: SpecialPointType;
  x: number;
  y: number;
}

// ─── Statistics types ─────────────────────────────────────────────────────────

export type ChartType = 'histogram' | 'bar' | 'scatter' | 'boxplot';

export interface LinearRegression {
  slope: number;
  intercept: number;
  r2: number;
}

export interface StatResult {
  mean: number;
  median: number;
  mode: number[];
  variance: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
  regression: LinearRegression | null;
}

// ─── Complex types ────────────────────────────────────────────────────────────

export interface ComplexNumber {
  re: number;
  im: number;
}

export type ComplexForm = 'rectangular' | 'polar';

export interface ComplexHistoryEntry {
  id: number;
  expression: string;
  result: ComplexNumber;
}
