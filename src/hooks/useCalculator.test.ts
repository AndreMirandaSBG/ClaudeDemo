import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCalc() {
  const { result } = renderHook(() => useCalculator());
  return result;
}

function enterExpression(calc: ReturnType<typeof buildCalc>, digits: string, op: string, digits2: string) {
  act(() => { for (const d of digits) calc.current.inputDigit(d); });
  act(() => calc.current.inputOperator(op));
  act(() => { for (const d of digits2) calc.current.inputDigit(d); });
  act(() => calc.current.calculate());
  return calc.current.display;
}

// ─── Basic arithmetic ────────────────────────────────────────────────────────

describe('basic arithmetic', () => {
  it('adds two numbers', () => expect(enterExpression(buildCalc(), '3', '+', '4')).toBe('7'));
  it('subtracts two numbers', () => expect(enterExpression(buildCalc(), '10', '-', '3')).toBe('7'));
  it('multiplies two numbers', () => expect(enterExpression(buildCalc(), '6', '*', '7')).toBe('42'));
  it('divides two numbers', () => expect(enterExpression(buildCalc(), '10', '/', '2')).toBe('5'));

  it('shows Division by zero on /0', () => {
    expect(enterExpression(buildCalc(), '5', '/', '0')).toBe('Division by zero');
  });

  it('clears the display', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('9'));
    act(() => h.current.allClear());
    expect(h.current.display).toBe('0');
  });

  it('toggles sign on a typed number', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('5'));
    act(() => h.current.toggleSign());
    expect(h.current.display).toBe('-5');
  });

  it('applies percentage', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('5'));
    act(() => h.current.percentage());
    expect(h.current.display).toBe('0.05');
  });

  it('handles decimal input', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('3'));
    act(() => h.current.inputDecimal());
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDigit('4'));
    expect(h.current.display).toBe('3.14');
  });

  it('ignores second decimal point', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDecimal());
    act(() => h.current.inputDigit('5'));
    act(() => h.current.inputDecimal());
    expect(h.current.display).toBe('1.5');
  });
});

// ─── Backspace ───────────────────────────────────────────────────────────────

describe('backspace', () => {
  it('removes last digit', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDigit('2'));
    act(() => h.current.backspace());
    expect(h.current.display).toBe('1');
  });

  it('resets after calculate on backspace', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('5'));
    act(() => h.current.calculate());
    act(() => h.current.backspace());
    expect(h.current.display).toBe('0');
    expect(h.current.expression).toBe('');
  });
});

// ─── Scientific functions ────────────────────────────────────────────────────

describe('scientific functions', () => {
  it('computes sin(0) = 0 in DEG', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('sin'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(parseFloat(h.current.display)).toBeCloseTo(0);
  });

  it('computes cos(0) = 1 in DEG', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('cos'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(parseFloat(h.current.display)).toBeCloseTo(1);
  });

  it('computes sin(90) = 1 in DEG', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('sin'));
    act(() => h.current.inputDigit('9'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(parseFloat(h.current.display)).toBeCloseTo(1);
  });

  it('computes sqrt(9) = 3', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('sqrt'));
    act(() => h.current.inputDigit('9'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('3');
  });

  it('shows Domain error for sqrt of negative', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('sqrt'));
    act(() => h.current.inputOperator('-'));
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('Domain error');
  });

  it('computes log(100) = 2', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('log'));
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(parseFloat(h.current.display)).toBeCloseTo(2);
  });

  it('computes ln(e) = 1', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('ln'));
    act(() => h.current.inputConstant('e'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(parseFloat(h.current.display)).toBeCloseTo(1);
  });

  it('computes 5! = 120', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('5'));
    act(() => h.current.factorial());
    act(() => h.current.calculate());
    expect(h.current.display).toBe('120');
  });

  it('computes 3^2 = 9', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('3'));
    act(() => h.current.squareValue());
    act(() => h.current.calculate());
    expect(h.current.display).toBe('9');
  });

  it('computes 2^10 via powerOf', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('2'));
    act(() => h.current.powerOf());
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('1024');
  });

  it('computes abs(-5) = 5', () => {
    const h = buildCalc();
    act(() => h.current.inputFunction('abs'));
    act(() => h.current.inputOperator('-'));
    act(() => h.current.inputDigit('5'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('5');
  });

  it('computes 10 mod 3 = 1', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.modOp());
    act(() => h.current.inputDigit('3'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('1');
  });
});

// ─── Angle modes ─────────────────────────────────────────────────────────────

describe('angle modes', () => {
  it('cycles DEG → RAD → GRAD → DEG', () => {
    const h = buildCalc();
    expect(h.current.angleMode).toBe('DEG');
    act(() => h.current.cycleAngleMode());
    expect(h.current.angleMode).toBe('RAD');
    act(() => h.current.cycleAngleMode());
    expect(h.current.angleMode).toBe('GRAD');
    act(() => h.current.cycleAngleMode());
    expect(h.current.angleMode).toBe('DEG');
  });

  it('computes sin(π/2 rad) = 1', () => {
    const h = buildCalc();
    act(() => h.current.cycleAngleMode()); // switch to RAD
    act(() => h.current.inputFunction('sin'));
    act(() => h.current.inputConstant('π'));
    act(() => h.current.inputOperator('/'));
    act(() => h.current.inputDigit('2'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.calculate());
    expect(parseFloat(h.current.display)).toBeCloseTo(1);
  });
});

// ─── Constants ───────────────────────────────────────────────────────────────

describe('constants', () => {
  it('inserts π into expression', () => {
    const h = buildCalc();
    act(() => h.current.inputConstant('π'));
    expect(h.current.expression).toBe('π');
  });

  it('inserts e into expression', () => {
    const h = buildCalc();
    act(() => h.current.inputConstant('e'));
    expect(h.current.expression).toBe('e');
  });
});

// ─── Memory ──────────────────────────────────────────────────────────────────

describe('memory', () => {
  it('stores and recalls a value', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('7'));
    act(() => h.current.memoryStore(0));
    act(() => h.current.allClear());
    act(() => h.current.memoryRecall(0));
    expect(h.current.display).toBe('7');
  });

  it('adds to memory', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('3'));
    act(() => h.current.memoryStore(0));
    act(() => h.current.allClear());
    act(() => h.current.inputDigit('2'));
    act(() => h.current.memoryAdd(0));
    expect(h.current.memory[0]).toBe(5);
  });

  it('subtracts from memory', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('1'));
    act(() => h.current.inputDigit('0'));
    act(() => h.current.memoryStore(1));
    act(() => h.current.allClear());
    act(() => h.current.inputDigit('3'));
    act(() => h.current.memorySubtract(1));
    expect(h.current.memory[1]).toBe(7);
  });

  it('clears a memory slot', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('5'));
    act(() => h.current.memoryStore(2));
    act(() => h.current.memoryClear(2));
    expect(h.current.memory[2]).toBe(0);
  });
});

// ─── History ─────────────────────────────────────────────────────────────────

describe('history', () => {
  it('records a calculation in history', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('3'));
    act(() => h.current.inputOperator('+'));
    act(() => h.current.inputDigit('4'));
    act(() => h.current.calculate());
    expect(h.current.history).toHaveLength(1);
    expect(h.current.history[0].result).toBe('7');
  });

  it('limits history to 20 entries', () => {
    const h = buildCalc();
    for (let i = 0; i < 25; i++) {
      act(() => h.current.inputDigit('1'));
      act(() => h.current.inputOperator('+'));
      act(() => h.current.inputDigit('1'));
      act(() => h.current.calculate());
    }
    expect(h.current.history.length).toBeLessThanOrEqual(20);
  });

  it('recalls a history entry', () => {
    const h = buildCalc();
    act(() => h.current.inputDigit('9'));
    act(() => h.current.calculate());
    const entry = h.current.history[0];
    act(() => h.current.allClear());
    act(() => h.current.recallHistory(entry));
    expect(h.current.display).toBe('9');
  });
});

// ─── Parentheses ─────────────────────────────────────────────────────────────

describe('parentheses', () => {
  it('evaluates (2+3)*4 = 20', () => {
    const h = buildCalc();
    act(() => h.current.inputParen('('));
    act(() => h.current.inputDigit('2'));
    act(() => h.current.inputOperator('+'));
    act(() => h.current.inputDigit('3'));
    act(() => h.current.inputParen(')'));
    act(() => h.current.inputOperator('*'));
    act(() => h.current.inputDigit('4'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('20');
  });

  it('auto-closes unclosed parens on calculate', () => {
    const h = buildCalc();
    act(() => h.current.inputParen('('));
    act(() => h.current.inputDigit('5'));
    act(() => h.current.inputOperator('+'));
    act(() => h.current.inputDigit('3'));
    act(() => h.current.calculate());
    expect(h.current.display).toBe('8');
  });
});

// ─── Inverse toggle ──────────────────────────────────────────────────────────

describe('inverse toggle', () => {
  it('toggles isInverse', () => {
    const h = buildCalc();
    expect(h.current.isInverse).toBe(false);
    act(() => h.current.toggleInverse());
    expect(h.current.isInverse).toBe(true);
    act(() => h.current.toggleInverse());
    expect(h.current.isInverse).toBe(false);
  });
});
