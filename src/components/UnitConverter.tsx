import { useRef, useEffect, useCallback } from 'react';
import { useConverter, PHYSICAL_CONSTANTS } from '../hooks/useConverter';
import type { UnitCategory } from '../types/calculator';

// ─── Ratio bar chart ──────────────────────────────────────────────────────────

function drawRatioChart(
  canvas: HTMLCanvasElement,
  fromLabel: string,
  toLabel: string,
  fromValue: number,
  toValue: number,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, w, h);

  if (!isFinite(fromValue) || !isFinite(toValue)) return;

  const absFrom = Math.abs(fromValue);
  const absTo = Math.abs(toValue);
  if (absFrom === 0 && absTo === 0) return;

  // Use log scale for very different magnitudes
  const logFrom = absFrom > 0 ? Math.log10(absFrom) : 0;
  const logTo = absTo > 0 ? Math.log10(absTo) : 0;
  const maxLog = Math.max(Math.abs(logFrom), Math.abs(logTo), 1);

  const barH = 22;
  const labelW = 100;
  const barMaxW = w - labelW - 20;
  const padding = 10;

  const drawBar = (y: number, label: string, value: number, logVal: number, color: string) => {
    const ratio = (logVal + maxLog) / (2 * maxLog);
    const barW = Math.max(4, ratio * barMaxW);

    ctx.fillStyle = '#333';
    ctx.fillRect(labelW, y, barMaxW, barH);

    ctx.fillStyle = color;
    ctx.fillRect(labelW, y, barW, barH);

    ctx.fillStyle = '#ccc';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(label, labelW - 6, y + barH / 2 + 4);

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    const valStr = Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-4 && value !== 0)
      ? value.toExponential(3)
      : value.toPrecision(6).replace(/\.?0+$/, '');
    ctx.fillText(valStr, labelW + barW + 4, y + barH / 2 + 4);
  };

  drawBar(padding, fromLabel, fromValue, logFrom, '#3498db');
  drawBar(padding + barH + 8, toLabel, toValue, logTo, '#2ecc71');

  // Ratio label
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  const ratio = absFrom > 0 ? absTo / absFrom : 0;
  const ratioStr = ratio >= 1e4 || (ratio < 1e-4 && ratio > 0)
    ? ratio.toExponential(3)
    : ratio.toPrecision(4);
  ctx.fillText(`ratio: 1 ${fromLabel} = ${ratioStr} ${toLabel}`, w / 2, h - 6);
}

// ─── Format constant value ────────────────────────────────────────────────────

function formatConstant(value: number): string {
  if (Math.abs(value) >= 1e6 || (Math.abs(value) < 1e-3 && value !== 0)) {
    return value.toExponential(4);
  }
  return value.toPrecision(7).replace(/\.?0+$/, '');
}

// ─── Component ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<UnitCategory, string> = {
  length: 'Length',
  mass: 'Mass',
  energy: 'Energy',
  pressure: 'Pressure',
  temperature: 'Temp',
  speed: 'Speed',
  area: 'Area',
  volume: 'Volume',
};

export function UnitConverter() {
  const {
    category,
    fromUnit,
    toUnit,
    fromValue,
    toValue,
    units,
    categoryOrder,
    setCategory,
    setFromUnit,
    setToUnit,
    setFromValue,
    swapUnits,
  } = useConverter();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fromDef = units.find(u => u.id === fromUnit);
    const toDef = units.find(u => u.id === toUnit);
    drawRatioChart(
      canvas,
      fromDef?.symbol ?? fromUnit,
      toDef?.symbol ?? toUnit,
      fromValue,
      toValue,
    );
  }, [fromUnit, toUnit, fromValue, toValue, units]);

  const handleFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (isFinite(v)) setFromValue(v);
  }, [setFromValue]);

  const insertConstant = useCallback((value: number) => {
    setFromValue(value);
  }, [setFromValue]);

  return (
    <div className="converter">
      {/* Category tabs */}
      <div className="converter__cats">
        {categoryOrder.map(cat => (
          <button
            key={cat}
            className={`converter__cat-btn ${category === cat ? 'converter__cat-btn--active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Conversion panel */}
      <div className="converter__panel">
        <div className="converter__row">
          <select
            className="converter__select"
            value={fromUnit}
            onChange={e => setFromUnit(e.target.value)}
            aria-label="from unit"
          >
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
            ))}
          </select>
          <input
            type="number"
            className="converter__value-input"
            value={fromValue}
            onChange={handleFromChange}
            aria-label="from value"
            step="any"
          />
        </div>

        <div className="converter__swap-row">
          <button className="grapher__btn" onClick={swapUnits} aria-label="swap units">⇅ Swap</button>
        </div>

        <div className="converter__row">
          <select
            className="converter__select"
            value={toUnit}
            onChange={e => setToUnit(e.target.value)}
            aria-label="to unit"
          >
            {units.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
            ))}
          </select>
          <input
            type="number"
            className="converter__value-input converter__value-input--result"
            value={isFinite(toValue) ? toValue : ''}
            readOnly
            aria-label="converted value"
            step="any"
          />
        </div>

        {/* Dimensional analysis hint */}
        <div className="converter__dim-hint">
          {(() => {
            const fromDef = units.find(u => u.id === fromUnit);
            const toDef = units.find(u => u.id === toUnit);
            if (!fromDef || !toDef) return null;
            const ratio = isFinite(toValue) && fromValue !== 0 ? toValue / fromValue : null;
            return ratio !== null && <span>1 {fromDef.symbol} = {formatConstant(ratio)} {toDef.symbol}</span>;
          })()}
        </div>
      </div>

      {/* Ratio bar chart */}
      <canvas ref={canvasRef} className="converter__chart" width={540} height={80} />

      {/* Physical constants */}
      <div className="converter__constants">
        <h3 className="converter__constants-title">Physical Constants</h3>
        <div className="converter__constants-grid">
          {PHYSICAL_CONSTANTS.map(c => (
            <button
              key={c.symbol}
              className="converter__constant-card"
              onClick={() => insertConstant(c.value)}
              title={`Insert ${c.name} value`}
            >
              <span className="converter__constant-symbol">{c.symbol}</span>
              <span className="converter__constant-name">{c.name}</span>
              <span className="converter__constant-value">{formatConstant(c.value)}</span>
              <span className="converter__constant-unit">{c.unit}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
