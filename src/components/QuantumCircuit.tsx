import { useEffect, useRef, useState } from 'react';
import { useQuantum } from '../hooks/useQuantum';
import type { QuantumGateType } from '../types/calculator';

const SINGLE_GATES: QuantumGateType[] = ['H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz'];
const MULTI_GATES: QuantumGateType[] = ['CNOT', 'CZ', 'SWAP', 'Toffoli'];

const GATE_COLORS: Record<string, string> = {
  H: '#3498db', X: '#e74c3c', Y: '#e67e22', Z: '#9b59b6',
  S: '#2ecc71', T: '#1abc9c', Rx: '#f39c12', Ry: '#d35400', Rz: '#c0392b',
  CNOT: '#8e44ad', CZ: '#16a085', SWAP: '#27ae60', Toffoli: '#2980b9',
};

const CELL_W = 56; const CELL_H = 40; const WIRE_COLS = 12;

export const QuantumCircuit = () => {
  const { state, addGate, removeGate, setNumQubits, setShotCount, clearCircuit, loadBellState, loadGHZ, exportQASM } = useQuantum();
  const circuitRef = useRef<HTMLCanvasElement>(null);
  const histRef = useRef<HTMLCanvasElement>(null);

  const [selectedGate, setSelectedGate] = useState<QuantumGateType>('H');
  const [controlQ, setControlQ] = useState(0);
  const [control2Q, setControl2Q] = useState(1);
  const [gateAngle, setGateAngle] = useState(Math.PI / 2);

  // Draw circuit
  useEffect(() => {
    const canvas = circuitRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { numQubits, gates, entanglementEntropy } = state;
    const W = CELL_W * WIRE_COLS + 60; const H = CELL_H * numQubits + 20;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, W, H);

    // Qubit labels and wires
    for (let q = 0; q < numQubits; q++) {
      const y = 10 + q * CELL_H + CELL_H / 2;
      ctx.fillStyle = '#ccc'; ctx.font = '12px monospace';
      ctx.fillText(`q${q} |0⟩`, 2, y + 4);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(56, y); ctx.lineTo(W - 4, y); ctx.stroke();

      // Entropy indicator
      const ent = entanglementEntropy[q] ?? 0;
      if (ent > 0.05) {
        ctx.fillStyle = `rgba(243,156,18,${Math.min(ent, 1)})`;
        ctx.fillText(`ent:${ent.toFixed(2)}`, W - 70, y - 10);
      }
    }

    // Draw gates
    for (const g of gates) {
      const x = 56 + g.column * CELL_W;
      const y = 10 + g.qubit * CELL_H;
      const cy = y + CELL_H / 2;

      if (g.gate === 'CNOT' && g.controlQubit !== undefined) {
        const ctrlY = 10 + g.controlQubit * CELL_H + CELL_H / 2;
        ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + CELL_W / 2, ctrlY); ctx.lineTo(x + CELL_W / 2, cy); ctx.stroke();
        // Control dot
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath(); ctx.arc(x + CELL_W / 2, ctrlY, 6, 0, 2 * Math.PI); ctx.fill();
        // Target circle
        ctx.strokeStyle = '#8e44ad'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + CELL_W / 2, cy, 12, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + CELL_W / 2, cy - 12); ctx.lineTo(x + CELL_W / 2, cy + 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + CELL_W / 2 - 12, cy); ctx.lineTo(x + CELL_W / 2 + 12, cy); ctx.stroke();
      } else if ((g.gate === 'CZ' || g.gate === 'SWAP') && g.controlQubit !== undefined) {
        const ctrlY = 10 + g.controlQubit * CELL_H + CELL_H / 2;
        ctx.strokeStyle = GATE_COLORS[g.gate]; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + CELL_W / 2, ctrlY); ctx.lineTo(x + CELL_W / 2, cy); ctx.stroke();
        [ctrlY, cy].forEach(gy => {
          ctx.fillStyle = GATE_COLORS[g.gate];
          ctx.beginPath(); ctx.arc(x + CELL_W / 2, gy, 7, 0, 2 * Math.PI); ctx.fill();
        });
        // Label
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(g.gate, x + CELL_W / 2, (ctrlY + cy) / 2 + 3);
        ctx.textAlign = 'start';
      } else {
        // Single qubit gate box
        ctx.fillStyle = GATE_COLORS[g.gate] ?? '#555';
        ctx.fillRect(x + 4, y + 4, CELL_W - 8, CELL_H - 8);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(g.gate, x + CELL_W / 2, cy);
        ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
      }
    }
  }, [state]);

  // Draw measurement histogram
  useEffect(() => {
    const canvas = histRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { measurements } = state;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (measurements.length === 0) {
      ctx.fillStyle = '#666'; ctx.font = '14px sans-serif';
      ctx.fillText('No measurements yet', 20, 50);
      return;
    }

    const top = measurements.slice(0, 8);
    const maxCount = Math.max(...top.map(m => m.count));
    const barW = Math.floor((canvas.width - 40) / top.length);
    const maxH = canvas.height - 50;

    top.forEach((m, i) => {
      const h = Math.round((m.count / maxCount) * maxH);
      const x = 20 + i * barW;
      const hue = Math.round(220 + i * 30);
      ctx.fillStyle = `hsl(${hue},70%,55%)`;
      ctx.fillRect(x, canvas.height - 30 - h, barW - 4, h);
      ctx.fillStyle = '#ccc'; ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`|${m.state}⟩`, x + barW / 2 - 2, canvas.height - 14);
      ctx.fillText(`${m.count}`, x + barW / 2 - 2, canvas.height - 34 - h);
    });
    ctx.textAlign = 'start';
  }, [state.measurements]);

  const handleCircuitClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = circuitRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left - 56;
    const y = e.clientY - rect.top - 10;
    if (x < 0 || y < 0) return;
    const col = Math.floor(x / CELL_W);
    const qubit = Math.floor(y / CELL_H);
    if (col < 0 || col >= WIRE_COLS || qubit < 0 || qubit >= state.numQubits) return;

    // Check if clicking existing gate → remove
    const existing = state.gates.find(g => g.column === col && g.qubit === qubit);
    if (existing) { removeGate(existing.id); return; }

    const ctrl = controlQ < state.numQubits ? controlQ : 0;
    const ctrl2 = control2Q < state.numQubits ? control2Q : 1;
    const isMulti = MULTI_GATES.includes(selectedGate);
    if (isMulti && ctrl === qubit) return;
    addGate(
      selectedGate, qubit, col,
      isMulti ? ctrl : undefined,
      selectedGate === 'Toffoli' ? ctrl2 : undefined,
      ['Rx', 'Ry', 'Rz'].includes(selectedGate) ? gateAngle : undefined,
    );
  };

  const maxProb = Math.max(...state.stateVector.map(c => c.re ** 2 + c.im ** 2));

  return (
    <div className="qc">
      <div className="qc__controls">
        <div className="qc__row">
          <label className="qc__label">Qubits:
            <input type="number" className="qc__num-input" min={1} max={8} value={state.numQubits}
              onChange={e => setNumQubits(parseInt(e.target.value))} />
          </label>
          <label className="qc__label">Shots:
            <input type="number" className="qc__num-input" min={100} max={10000} step={100} value={state.shotCount}
              onChange={e => setShotCount(parseInt(e.target.value))} />
          </label>
          <button className="qc__btn" onClick={clearCircuit}>Clear</button>
          <button className="qc__btn" onClick={loadBellState}>Bell State</button>
          <button className="qc__btn" onClick={loadGHZ}>GHZ State</button>
          <button className="qc__btn" onClick={exportQASM}>Export QASM</button>
        </div>
        <div className="qc__row">
          <span className="qc__label">Single-qubit:</span>
          {SINGLE_GATES.map(g => (
            <button key={g} className={`qc__gate-btn ${selectedGate === g ? 'qc__gate-btn--active' : ''}`}
              style={{ background: selectedGate === g ? GATE_COLORS[g] : undefined }}
              onClick={() => setSelectedGate(g)}>{g}</button>
          ))}
        </div>
        <div className="qc__row">
          <span className="qc__label">Multi-qubit:</span>
          {MULTI_GATES.map(g => (
            <button key={g} className={`qc__gate-btn ${selectedGate === g ? 'qc__gate-btn--active' : ''}`}
              style={{ background: selectedGate === g ? GATE_COLORS[g] : undefined }}
              onClick={() => setSelectedGate(g)}>{g}</button>
          ))}
          {MULTI_GATES.includes(selectedGate) && (
            <>
              <label className="qc__label">Ctrl:
                <input type="number" className="qc__num-input" min={0} max={state.numQubits - 1} value={controlQ}
                  onChange={e => setControlQ(parseInt(e.target.value))} />
              </label>
              {selectedGate === 'Toffoli' && (
                <label className="qc__label">Ctrl2:
                  <input type="number" className="qc__num-input" min={0} max={state.numQubits - 1} value={control2Q}
                    onChange={e => setControl2Q(parseInt(e.target.value))} />
                </label>
              )}
            </>
          )}
          {['Rx', 'Ry', 'Rz'].includes(selectedGate) && (
            <label className="qc__label">Angle(rad):
              <input type="number" className="qc__num-input" step={0.1} value={gateAngle}
                onChange={e => setGateAngle(parseFloat(e.target.value))} />
            </label>
          )}
        </div>
        <p className="qc__hint">Click on the circuit to add the selected gate. Click an existing gate to remove it.</p>
      </div>

      <div className="qc__main">
        <div className="qc__circuit-wrap">
          <canvas ref={circuitRef} className="qc__canvas" onClick={handleCircuitClick} />
        </div>

        <div className="qc__side">
          {/* State vector */}
          <div className="qc__sv-panel">
            <h4 className="qc__panel-title">State Vector (top amplitudes)</h4>
            <div className="qc__sv-list">
              {state.stateVector
                .map((c, i) => ({ i, prob: c.re ** 2 + c.im ** 2, re: c.re, im: c.im }))
                .filter(({ prob }) => prob > 0.001)
                .sort((a, b) => b.prob - a.prob)
                .slice(0, 12)
                .map(({ i, prob, re, im }) => {
                  const label = `|${i.toString(2).padStart(state.numQubits, '0')}⟩`;
                  const barW = maxProb > 0 ? Math.round((prob / maxProb) * 120) : 0;
                  return (
                    <div key={i} className="qc__sv-row">
                      <span className="qc__sv-ket">{label}</span>
                      <div className="qc__sv-bar" style={{ width: barW }} />
                      <span className="qc__sv-prob">{(prob * 100).toFixed(1)}%</span>
                      <span className="qc__sv-amp">{re.toFixed(3)}{im >= 0 ? '+' : ''}{im.toFixed(3)}i</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Entanglement */}
          <div className="qc__ent-panel">
            <h4 className="qc__panel-title">Entanglement Entropy (per qubit)</h4>
            {state.entanglementEntropy.map((e, i) => (
              <div key={i} className="qc__ent-row">
                <span className="qc__ent-label">q{i}</span>
                <div className="qc__ent-bar-bg">
                  <div className="qc__ent-bar" style={{ width: `${Math.min(e * 100, 100)}%` }} />
                </div>
                <span className="qc__ent-val">{e.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histogram */}
      <div className="qc__hist-wrap">
        <h4 className="qc__panel-title">Measurement Histogram ({state.shotCount} shots)</h4>
        <canvas ref={histRef} className="qc__hist" width={700} height={140} />
      </div>
    </div>
  );
};
