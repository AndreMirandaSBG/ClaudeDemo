import { useState } from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { Display } from './Display';
import { Button } from './Button';

export function Calculator() {
  const calc = useCalculator();
  const [activeMemSlot, setActiveMemSlot] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const inv = calc.isInverse;

  const memHasValue = calc.memory.some(v => v !== 0);

  return (
    <div className="calculator">
      <Display
        expression={calc.expression}
        value={calc.display}
        angleMode={calc.angleMode}
        memoryActive={memHasValue}
      />

      {/* Scientific panel */}
      <div className="keypad keypad--sci">
        {/* Row 1: inverse + trig */}
        <Button label="2nd" onClick={calc.toggleInverse} variant={inv ? 'active-sci' : 'sci'} />
        <Button label={inv ? 'asin' : 'sin'} onClick={() => calc.inputFunction(inv ? 'asin' : 'sin')} variant="sci" />
        <Button label={inv ? 'acos' : 'cos'} onClick={() => calc.inputFunction(inv ? 'acos' : 'cos')} variant="sci" />
        <Button label={inv ? 'atan' : 'tan'} onClick={() => calc.inputFunction(inv ? 'atan' : 'tan')} variant="sci" />
        <Button label="π" onClick={() => calc.inputConstant('π')} variant="sci" />

        {/* Row 2: hyp + e */}
        <Button label={inv ? 'asinh' : 'sinh'} onClick={() => calc.inputFunction(inv ? 'asinh' : 'sinh')} variant="sci" />
        <Button label={inv ? 'acosh' : 'cosh'} onClick={() => calc.inputFunction(inv ? 'acosh' : 'cosh')} variant="sci" />
        <Button label={inv ? 'atanh' : 'tanh'} onClick={() => calc.inputFunction(inv ? 'atanh' : 'tanh')} variant="sci" />
        <Button label="e" onClick={() => calc.inputConstant('e')} variant="sci" />
        <Button label={calc.angleMode} onClick={calc.cycleAngleMode} variant="sci" />

        {/* Row 3: powers + roots */}
        <Button label="x²" onClick={calc.squareValue} variant="sci" />
        <Button label="x³" onClick={calc.cubeValue} variant="sci" />
        <Button label="xʸ" onClick={calc.powerOf} variant="sci" />
        <Button label="√x" onClick={() => calc.inputFunction('sqrt')} variant="sci" />
        <Button label="∛x" onClick={() => calc.inputFunction('cbrt')} variant="sci" />

        {/* Row 4: log + exp */}
        <Button label={inv ? '10ˣ' : 'log'} onClick={() => inv ? calc.inputFunction('pow10') : calc.inputFunction('log')} variant="sci" />
        <Button label={inv ? 'eˣ' : 'ln'} onClick={() => inv ? calc.inputFunction('exp') : calc.inputFunction('ln')} variant="sci" />
        <Button label="n!" onClick={calc.factorial} variant="sci" />
        <Button label="|x|" onClick={() => calc.inputFunction('abs')} variant="sci" />
        <Button label="1/x" onClick={calc.reciprocal} variant="sci" />

        {/* Row 5: parens + mod */}
        <Button label="(" onClick={() => calc.inputParen('(')} variant="sci" />
        <Button label=")" onClick={() => calc.inputParen(')')} variant="sci" />
        <Button label="mod" onClick={calc.modOp} variant="sci" />
        <Button
          label={`M${activeMemSlot + 1}`}
          onClick={() => setActiveMemSlot(s => (s + 1) % 5)}
          variant="sci"
        />
        <Button label="📋" onClick={() => setShowHistory(h => !h)} variant="sci" />
      </div>

      {/* Memory row */}
      <div className="keypad keypad--mem">
        <Button label="MC" onClick={() => calc.memoryClear(activeMemSlot)} variant="function" />
        <Button label="MR" onClick={() => calc.memoryRecall(activeMemSlot)} variant="function" />
        <Button label="MS" onClick={() => calc.memoryStore(activeMemSlot)} variant="function" />
        <Button label="M+" onClick={() => calc.memoryAdd(activeMemSlot)} variant="function" />
        <Button label="M−" onClick={() => calc.memorySubtract(activeMemSlot)} variant="function" />
      </div>

      {/* Standard numpad */}
      <div className="keypad keypad--std">
        <Button label={calc.expression === '' ? 'AC' : 'C'} onClick={calc.clear} variant="function" />
        <Button label="⌫" onClick={calc.backspace} variant="function" />
        <Button label="%" onClick={calc.percentage} variant="function" />
        <Button label="÷" onClick={() => calc.inputOperator('/')} variant="operator" />

        <Button label="7" onClick={() => calc.inputDigit('7')} />
        <Button label="8" onClick={() => calc.inputDigit('8')} />
        <Button label="9" onClick={() => calc.inputDigit('9')} />
        <Button label="×" onClick={() => calc.inputOperator('*')} variant="operator" />

        <Button label="4" onClick={() => calc.inputDigit('4')} />
        <Button label="5" onClick={() => calc.inputDigit('5')} />
        <Button label="6" onClick={() => calc.inputDigit('6')} />
        <Button label="−" onClick={() => calc.inputOperator('-')} variant="operator" />

        <Button label="1" onClick={() => calc.inputDigit('1')} />
        <Button label="2" onClick={() => calc.inputDigit('2')} />
        <Button label="3" onClick={() => calc.inputDigit('3')} />
        <Button label="+" onClick={() => calc.inputOperator('+')} variant="operator" />

        <Button label="+/−" onClick={calc.toggleSign} variant="function" />
        <Button label="0" onClick={() => calc.inputDigit('0')} />
        <Button label="." onClick={calc.inputDecimal} />
        <Button label="=" onClick={calc.calculate} variant="equals" />
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="history">
          <div className="history__header">
            <span>History</span>
            <button className="history__close" onClick={() => setShowHistory(false)}>✕</button>
          </div>
          {calc.history.length === 0 ? (
            <p className="history__empty">No calculations yet</p>
          ) : (
            <ul className="history__list">
              {calc.history.map(entry => (
                <li
                  key={entry.id}
                  className="history__item"
                  onClick={() => { calc.recallHistory(entry); setShowHistory(false); }}
                >
                  <span className="history__expr">{entry.expression}</span>
                  <span className="history__result">= {entry.result}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
