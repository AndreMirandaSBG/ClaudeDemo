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

// ─── Surface plot types ───────────────────────────────────────────────────────

export type SurfacePlotType = 'surface' | 'parametric-curve' | 'parametric-surface';

export interface SurfaceState {
  expression: string;
  xParamExpr: string;
  yParamExpr: string;
  zParamExpr: string;
  plotType: SurfacePlotType;
  rotX: number;
  rotY: number;
  scale: number;
  samples: number;
}

// ─── Solver types ─────────────────────────────────────────────────────────────

export type SolverMode = 'polynomial' | 'linear2x2' | 'trig' | 'exponential';
export type TrigFunc = 'sin' | 'cos' | 'tan';

export interface SolverComplexNumber {
  re: number;
  im: number;
  isReal: boolean;
}

export interface SolverStep {
  description: string;
  formula?: string;
}

export interface SolverResult {
  roots: SolverComplexNumber[];
  steps: SolverStep[];
  degree: number;
  error?: string;
}

// ─── Unit converter types ─────────────────────────────────────────────────────

export type UnitCategory = 'length' | 'mass' | 'energy' | 'pressure' | 'temperature' | 'speed' | 'area' | 'volume';

export interface PhysicalConstant {
  name: string;
  symbol: string;
  value: number;
  unit: string;
}

// ─── Calculus types ───────────────────────────────────────────────────────────

export type CalculusMode = 'derivative' | 'integral';

export interface CalculusState {
  expression: string;
  mode: CalculusMode;
  derivativeOrder: number;
  integralA: number;
  integralB: number;
  tangentX: number;
  xMin: number;
  xMax: number;
}

// ─── Matrix types ─────────────────────────────────────────────────────────────

export type MatrixOp = 'add' | 'multiply' | 'inverse' | 'determinant' | 'lu' | 'qr' | 'eigen' | 'transform';
export type MatrixSize = 2 | 3;

export interface MatrixState {
  matrixA: number[][];
  matrixB: number[][];
  op: MatrixOp;
  size: MatrixSize;
  animateT: number;
}

// ─── Fourier types ────────────────────────────────────────────────────────────

export type SignalPreset = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';
export type WindowFunction = 'none' | 'hann' | 'hamming' | 'blackman';

export interface FourierState {
  signalPreset: SignalPreset;
  customExpression: string;
  numPoints: number;
  frequency: number;
  amplitude: number;
  windowFn: WindowFunction;
  selectedHarmonics: number[];
  showPhase: boolean;
}

// ─── Distribution types ────────────────────────────────────────────────────────

export type DistributionType = 'normal' | 'binomial' | 'poisson' | 'chi-squared' | 't' | 'uniform' | 'exponential';
export type TailShadeMode = 'none' | 'left' | 'right' | 'two-tailed';

export interface DistributionParams {
  mu: number;      // mean (normal, t)
  sigma: number;   // std dev (normal)
  n: number;       // trials (binomial)
  p: number;       // probability (binomial)
  lambda: number;  // rate (poisson, exponential)
  df: number;      // degrees of freedom (chi-squared, t)
  a: number;       // lower bound (uniform)
  b: number;       // upper bound (uniform)
}

export interface DistributionOverlay {
  id: number;
  type: DistributionType;
  params: DistributionParams;
  color: string;
}

export interface DistributionState {
  activeType: DistributionType;
  params: DistributionParams;
  tailMode: TailShadeMode;
  tailThreshold: number;
  showMonteCarlo: boolean;
  monteCarloN: number;
  overlays: DistributionOverlay[];
}

// ─── Number theory types ───────────────────────────────────────────────────────

export type NumberTheoryMode = 'factorize' | 'sieve' | 'ulam' | 'sequences' | 'modular';
export type SequenceType = 'fibonacci' | 'triangular' | 'perfect' | 'primes' | 'squares';
export type ChartMode = 'bar' | 'scatter';

export interface NumberTheoryState {
  mode: NumberTheoryMode;
  inputN: number;
  modBase: number;
  modExponent: number;
  modModulus: number;
  sequenceType: SequenceType;
  sequenceLength: number;
  chartMode: ChartMode;
  sieveLimit: number;
  ulamSize: number;
}

// ─── DiffEq types ─────────────────────────────────────────────────────────────

export type DiffEqMode = 'firstOrder' | 'system2D';
export type OdeMethod = 'euler' | 'rk4';

export interface DiffEqState {
  expression: string;
  expression2: string;
  mode: DiffEqMode;
  method: OdeMethod;
  x0: number;
  y0: number;
  xEnd: number;
  steps: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
