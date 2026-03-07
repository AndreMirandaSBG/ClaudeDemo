import { useCalculator } from '../hooks/useCalculator';
import type { Operator } from '../types/calculator';
import { Display } from './Display';
import { Button } from './Button';

export function Calculator() {
  const calc = useCalculator();

  return (
    <div className="calculator">
      <Display value={calc.display} />
      <div className="keypad">
        {/* Row 1 */}
        <Button label="AC"  onClick={calc.clear}                                variant="function" />
        <Button label="+/-" onClick={calc.toggleSign}                           variant="function" />
        <Button label="%"   onClick={calc.percentage}                           variant="function" />
        <Button label="÷"   onClick={() => calc.inputOperator('/')}             variant="operator" active={calc.operator === '/'} />

        {/* Row 2 */}
        <Button label="7" onClick={() => calc.inputDigit('7')} />
        <Button label="8" onClick={() => calc.inputDigit('8')} />
        <Button label="9" onClick={() => calc.inputDigit('9')} />
        <Button label="×" onClick={() => calc.inputOperator('*' as Operator)}  variant="operator" active={calc.operator === '*'} />

        {/* Row 3 */}
        <Button label="4" onClick={() => calc.inputDigit('4')} />
        <Button label="5" onClick={() => calc.inputDigit('5')} />
        <Button label="6" onClick={() => calc.inputDigit('6')} />
        <Button label="−" onClick={() => calc.inputOperator('-')}              variant="operator" active={calc.operator === '-'} />

        {/* Row 4 */}
        <Button label="1" onClick={() => calc.inputDigit('1')} />
        <Button label="2" onClick={() => calc.inputDigit('2')} />
        <Button label="3" onClick={() => calc.inputDigit('3')} />
        <Button label="+" onClick={() => calc.inputOperator('+')}              variant="operator" active={calc.operator === '+'} />

        {/* Row 5 */}
        <Button label="0" onClick={() => calc.inputDigit('0')} wide />
        <Button label="." onClick={calc.inputDecimal} />
        <Button label="=" onClick={calc.calculate}                             variant="equals" />
      </div>
    </div>
  );
}
