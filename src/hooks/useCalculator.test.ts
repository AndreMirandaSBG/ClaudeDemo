import { renderHook, act } from '@testing-library/react';
import { useCalculator } from './useCalculator';

describe('useCalculator', () => {
  describe('initial state', () => {
    it('displays 0', () => {
      const { result } = renderHook(() => useCalculator());
      expect(result.current.display).toBe('0');
    });
  });

  describe('inputDigit', () => {
    it('replaces leading zero with digit', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.inputDigit('5'));
      expect(result.current.display).toBe('5');
    });

    it('appends digits', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('1');
        result.current.inputDigit('2');
        result.current.inputDigit('3');
      });
      expect(result.current.display).toBe('123');
    });
  });

  describe('inputDecimal', () => {
    it('appends decimal point', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => result.current.inputDecimal());
      expect(result.current.display).toBe('0.');
    });

    it('ignores a second decimal point', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDecimal();
        result.current.inputDecimal();
      });
      expect(result.current.display).toBe('0.');
    });
  });

  describe('arithmetic', () => {
    it('adds two numbers', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('3');
        result.current.inputOperator('+');
        result.current.inputDigit('4');
        result.current.calculate();
      });
      expect(result.current.display).toBe('7');
    });

    it('subtracts two numbers', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('9');
        result.current.inputOperator('-');
        result.current.inputDigit('3');
        result.current.calculate();
      });
      expect(result.current.display).toBe('6');
    });

    it('multiplies two numbers', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('6');
        result.current.inputOperator('*');
        result.current.inputDigit('7');
        result.current.calculate();
      });
      expect(result.current.display).toBe('42');
    });

    it('divides two numbers', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('8');
        result.current.inputOperator('/');
        result.current.inputDigit('2');
        result.current.calculate();
      });
      expect(result.current.display).toBe('4');
    });

    it('shows Error on division by zero', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('5');
        result.current.inputOperator('/');
        result.current.inputDigit('0');
        result.current.calculate();
      });
      expect(result.current.display).toBe('Error');
    });

    it('chains operations', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('2');
        result.current.inputOperator('+');
        result.current.inputDigit('3');
        result.current.inputOperator('+'); // triggers intermediate result
        result.current.inputDigit('4');
        result.current.calculate();
      });
      expect(result.current.display).toBe('9');
    });
  });

  describe('clear', () => {
    it('resets display to 0', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('9');
        result.current.clear();
      });
      expect(result.current.display).toBe('0');
    });
  });

  describe('toggleSign', () => {
    it('negates the current value', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('5');
        result.current.toggleSign();
      });
      expect(result.current.display).toBe('-5');
    });
  });

  describe('percentage', () => {
    it('divides display by 100', () => {
      const { result } = renderHook(() => useCalculator());
      act(() => {
        result.current.inputDigit('5');
        result.current.inputDigit('0');
        result.current.percentage();
      });
      expect(result.current.display).toBe('0.5');
    });
  });
});
