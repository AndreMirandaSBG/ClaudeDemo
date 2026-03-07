import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';

function calculate(a: string, op: string, b: string) {
  const { result } = renderHook(() => useCalculator());

  act(() => {
    for (const digit of a) result.current.inputDigit(digit);
  });
  act(() => {
    result.current.inputOperator(op as '+' | '-' | '*' | '/');
  });
  act(() => {
    for (const digit of b) result.current.inputDigit(digit);
  });
  act(() => {
    result.current.calculate();
  });

  return result.current.display;
}

describe('useCalculator', () => {
  it('adds two numbers', () => {
    expect(calculate('3', '+', '4')).toBe('7');
  });

  it('subtracts two numbers', () => {
    expect(calculate('10', '-', '3')).toBe('7');
  });

  it('multiplies two numbers', () => {
    expect(calculate('6', '*', '7')).toBe('42');
  });

  it('divides two numbers', () => {
    expect(calculate('10', '/', '2')).toBe('5');
  });

  it('shows Error on division by zero', () => {
    expect(calculate('5', '/', '0')).toBe('Error');
  });

  it('clears the display', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.inputDigit('9'));
    act(() => result.current.clear());
    expect(result.current.display).toBe('0');
  });

  it('toggles sign', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.inputDigit('5'));
    act(() => result.current.toggleSign());
    expect(result.current.display).toBe('-5');
  });

  it('applies percentage', () => {
    const { result } = renderHook(() => useCalculator());
    act(() => result.current.inputDigit('5'));
    act(() => result.current.percentage());
    expect(result.current.display).toBe('0.05');
  });
});
