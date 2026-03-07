import { useState } from 'react';
import type { CalculatorState, Operator } from '../types/calculator';

const initialState: CalculatorState = {
  display: '0',
  previousValue: null,
  operator: null,
  waitingForOperand: false,
};

function calculate(a: number, b: number, op: Operator): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return b !== 0 ? a / b : NaN;
  }
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(initialState);

  const inputDigit = (digit: string) => {
    setState(prev => {
      if (prev.waitingForOperand) {
        return { ...prev, display: digit, waitingForOperand: false };
      }
      return {
        ...prev,
        display: prev.display === '0' ? digit : prev.display + digit,
      };
    });
  };

  const inputDecimal = () => {
    setState(prev => {
      if (prev.waitingForOperand) {
        return { ...prev, display: '0.', waitingForOperand: false };
      }
      if (!prev.display.includes('.')) {
        return { ...prev, display: prev.display + '.' };
      }
      return prev;
    });
  };

  const inputOperator = (op: Operator) => {
    setState(prev => {
      const current = parseFloat(prev.display);
      if (prev.previousValue !== null && !prev.waitingForOperand) {
        const result = calculate(prev.previousValue, current, prev.operator!);
        return {
          display: String(result),
          previousValue: result,
          operator: op,
          waitingForOperand: true,
        };
      }
      return {
        ...prev,
        previousValue: current,
        operator: op,
        waitingForOperand: true,
      };
    });
  };

  const calculate_result = () => {
    setState(prev => {
      if (prev.previousValue === null || prev.operator === null) return prev;
      const current = parseFloat(prev.display);
      const result = calculate(prev.previousValue, current, prev.operator);
      return {
        display: isNaN(result) ? 'Error' : String(result),
        previousValue: null,
        operator: null,
        waitingForOperand: true,
      };
    });
  };

  const clear = () => setState(initialState);

  const toggleSign = () => {
    setState(prev => ({
      ...prev,
      display: String(parseFloat(prev.display) * -1),
    }));
  };

  const percentage = () => {
    setState(prev => ({
      ...prev,
      display: String(parseFloat(prev.display) / 100),
    }));
  };

  return {
    display: state.display,
    operator: state.operator,
    inputDigit,
    inputDecimal,
    inputOperator,
    calculate: calculate_result,
    clear,
    toggleSign,
    percentage,
  };
}
