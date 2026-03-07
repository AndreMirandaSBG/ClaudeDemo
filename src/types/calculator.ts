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
