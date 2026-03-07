import type { AngleMode } from '../types/calculator';

interface DisplayProps {
  expression: string;
  value: string;
  angleMode: AngleMode;
  memoryActive: boolean;
}

export function Display({ expression, value, angleMode, memoryActive }: DisplayProps) {
  const valueFontSize = value.length > 14 ? '1.2rem' : value.length > 10 ? '1.6rem' : '2rem';

  return (
    <div className="display" data-testid="display">
      <div className="display__meta">
        <span className="display__mode">{angleMode}</span>
        {memoryActive && <span className="display__mem">M</span>}
      </div>
      <div className="display__expression" data-testid="expression">
        {expression || <span className="display__placeholder">0</span>}
      </div>
      <div className="display__value" style={{ fontSize: valueFontSize }} data-testid="value">
        {value}
      </div>
    </div>
  );
}
