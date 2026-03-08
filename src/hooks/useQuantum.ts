import { useState, useCallback } from 'react';
import type {
  QuantumCircuitState, QuantumGateApplication, QuantumGateType,
  QuantumMeasurement,
} from '../types/calculator';

// ─── Complex arithmetic ───────────────────────────────────────────────────────

interface Cx { re: number; im: number }
const add = (a: Cx, b: Cx): Cx => ({ re: a.re + b.re, im: a.im + b.im });
const mul = (a: Cx, b: Cx): Cx => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
const zero: Cx = { re: 0, im: 0 };
const one: Cx = { re: 1, im: 0 };
const S2 = 1 / Math.SQRT2;

// ─── Gate matrices ────────────────────────────────────────────────────────────

const GATE_MATRIX: Record<string, Cx[][]> = {
  H: [[{ re: S2, im: 0 }, { re: S2, im: 0 }], [{ re: S2, im: 0 }, { re: -S2, im: 0 }]],
  X: [[zero, one], [one, zero]],
  Y: [[zero, { re: 0, im: -1 }], [{ re: 0, im: 1 }, zero]],
  Z: [[one, zero], [zero, { re: -1, im: 0 }]],
  S: [[one, zero], [zero, { re: 0, im: 1 }]],
  T: [[one, zero], [zero, { re: Math.cos(Math.PI / 4), im: Math.sin(Math.PI / 4) }]],
};

function rotMatrix(axis: 'x' | 'y' | 'z', angle: number): Cx[][] {
  const c = Math.cos(angle / 2); const s = Math.sin(angle / 2);
  if (axis === 'x') return [[{ re: c, im: 0 }, { re: 0, im: -s }], [{ re: 0, im: -s }, { re: c, im: 0 }]];
  if (axis === 'y') return [[{ re: c, im: 0 }, { re: -s, im: 0 }], [{ re: s, im: 0 }, { re: c, im: 0 }]];
  return [[{ re: c, im: -s }, zero], [zero, { re: c, im: s }]];
}

// ─── State vector operations ──────────────────────────────────────────────────

function applySingleQubit(sv: Cx[], gate: Cx[][], qubit: number, nQ: number): Cx[] {
  const out: Cx[] = sv.map(() => ({ ...zero }));
  const bitPos = nQ - 1 - qubit;
  for (let i = 0; i < sv.length; i++) {
    if ((i >> bitPos) & 1) continue; // process only |...0...> half
    const j = i | (1 << bitPos);
    out[i] = add(mul(gate[0][0], sv[i]), mul(gate[0][1], sv[j]));
    out[j] = add(mul(gate[1][0], sv[i]), mul(gate[1][1], sv[j]));
  }
  return out;
}

function applyCNOT(sv: Cx[], ctrl: number, tgt: number, nQ: number): Cx[] {
  const out = [...sv];
  const cPos = nQ - 1 - ctrl; const tPos = nQ - 1 - tgt;
  for (let i = 0; i < sv.length; i++) {
    if (((i >> cPos) & 1) === 1 && ((i >> tPos) & 1) === 0) {
      const j = i | (1 << tPos);
      [out[i], out[j]] = [sv[j], sv[i]];
    }
  }
  return out;
}

function applyCZ(sv: Cx[], q1: number, q2: number, nQ: number): Cx[] {
  const out = [...sv];
  const p1 = nQ - 1 - q1; const p2 = nQ - 1 - q2;
  for (let i = 0; i < sv.length; i++) {
    if (((i >> p1) & 1) && ((i >> p2) & 1)) out[i] = { re: -sv[i].re, im: -sv[i].im };
  }
  return out;
}

function applySWAP(sv: Cx[], q1: number, q2: number, nQ: number): Cx[] {
  const out = [...sv];
  const p1 = nQ - 1 - q1; const p2 = nQ - 1 - q2;
  for (let i = 0; i < sv.length; i++) {
    const b1 = (i >> p1) & 1; const b2 = (i >> p2) & 1;
    if (b1 !== b2) {
      const j = i ^ (1 << p1) ^ (1 << p2);
      if (j > i) { [out[i], out[j]] = [sv[j], sv[i]]; }
    }
  }
  return out;
}

function applyToffoli(sv: Cx[], c1: number, c2: number, tgt: number, nQ: number): Cx[] {
  const out = [...sv];
  const p1 = nQ - 1 - c1; const p2 = nQ - 1 - c2; const pt = nQ - 1 - tgt;
  for (let i = 0; i < sv.length; i++) {
    if (((i >> p1) & 1) && ((i >> p2) & 1) && !((i >> pt) & 1)) {
      const j = i | (1 << pt);
      [out[i], out[j]] = [sv[j], sv[i]];
    }
  }
  return out;
}

export function simulateCircuit(gates: QuantumGateApplication[], nQ: number): Cx[] {
  const size = 1 << nQ;
  let sv: Cx[] = Array.from({ length: size }, (_, i) => (i === 0 ? { ...one } : { ...zero }));

  const sorted = [...gates].sort((a, b) => a.column - b.column);
  for (const g of sorted) {
    switch (g.gate) {
      case 'H': case 'X': case 'Y': case 'Z': case 'S': case 'T': {
        sv = applySingleQubit(sv, GATE_MATRIX[g.gate], g.qubit, nQ); break;
      }
      case 'Rx': sv = applySingleQubit(sv, rotMatrix('x', g.angle ?? Math.PI / 2), g.qubit, nQ); break;
      case 'Ry': sv = applySingleQubit(sv, rotMatrix('y', g.angle ?? Math.PI / 2), g.qubit, nQ); break;
      case 'Rz': sv = applySingleQubit(sv, rotMatrix('z', g.angle ?? Math.PI / 2), g.qubit, nQ); break;
      case 'CNOT': sv = applyCNOT(sv, g.controlQubit ?? 0, g.qubit, nQ); break;
      case 'CZ': sv = applyCZ(sv, g.controlQubit ?? 0, g.qubit, nQ); break;
      case 'SWAP': sv = applySWAP(sv, g.qubit, g.controlQubit ?? (g.qubit + 1) % nQ, nQ); break;
      case 'Toffoli': sv = applyToffoli(sv, g.controlQubit ?? 0, g.control2Qubit ?? 1, g.qubit, nQ); break;
    }
  }
  return sv;
}

function measure(sv: Cx[], shots: number, nQ: number): QuantumMeasurement[] {
  const probs = sv.map(c => c.re * c.re + c.im * c.im);
  const counts: Record<string, number> = {};
  for (let i = 0; i < shots; i++) {
    let r = Math.random(); let idx = sv.length - 1;
    for (let j = 0; j < sv.length; j++) { r -= probs[j]; if (r <= 0) { idx = j; break; } }
    const key = idx.toString(2).padStart(nQ, '0');
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([state, count]) => ({ state, probability: probs[parseInt(state, 2)], count }))
    .sort((a, b) => b.count - a.count);
}

export function computeEntanglement(sv: Cx[], nQ: number): number[] {
  return Array.from({ length: nQ }, (_, q) => {
    const pos = nQ - 1 - q;
    let p0 = 0, p1 = 0;
    for (let i = 0; i < sv.length; i++) {
      const p = sv[i].re ** 2 + sv[i].im ** 2;
      if ((i >> pos) & 1) p1 += p; else p0 += p;
    }
    let e = 0;
    if (p0 > 1e-12) e -= p0 * Math.log2(p0);
    if (p1 > 1e-12) e -= p1 * Math.log2(p1);
    return e;
  });
}

export function generateQASM(gates: QuantumGateApplication[], nQ: number): string {
  let s = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[${nQ}];\ncreg c[${nQ}];\n\n`;
  const sorted = [...gates].sort((a, b) => a.column - b.column);
  for (const g of sorted) {
    const q = `q[${g.qubit}]`;
    const c0 = `q[${g.controlQubit ?? 0}]`;
    switch (g.gate) {
      case 'H': s += `h ${q};\n`; break;
      case 'X': s += `x ${q};\n`; break;
      case 'Y': s += `y ${q};\n`; break;
      case 'Z': s += `z ${q};\n`; break;
      case 'S': s += `s ${q};\n`; break;
      case 'T': s += `t ${q};\n`; break;
      case 'Rx': s += `rx(${g.angle ?? Math.PI / 2}) ${q};\n`; break;
      case 'Ry': s += `ry(${g.angle ?? Math.PI / 2}) ${q};\n`; break;
      case 'Rz': s += `rz(${g.angle ?? Math.PI / 2}) ${q};\n`; break;
      case 'CNOT': s += `cx ${c0}, ${q};\n`; break;
      case 'CZ': s += `cz ${c0}, ${q};\n`; break;
      case 'SWAP': s += `swap ${q}, q[${g.controlQubit ?? (g.qubit + 1) % nQ}];\n`; break;
      case 'Toffoli': s += `ccx ${c0}, q[${g.control2Qubit ?? 1}], ${q};\n`; break;
    }
  }
  return s + `\nmeasure q -> c;\n`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const initialSV = (nQ: number): Cx[] =>
  Array.from({ length: 1 << nQ }, (_, i) => (i === 0 ? { ...one } : { ...zero }));

export const useQuantum = () => {
  const [state, setState] = useState<QuantumCircuitState>({
    numQubits: 3,
    gates: [],
    shotCount: 1000,
    measurements: [],
    stateVector: initialSV(3),
    entanglementEntropy: [0, 0, 0],
  });

  const refresh = (gates: QuantumGateApplication[], nQ: number, shots: number): Partial<QuantumCircuitState> => {
    const sv = simulateCircuit(gates, nQ);
    return { gates, stateVector: sv, measurements: measure(sv, shots, nQ), entanglementEntropy: computeEntanglement(sv, nQ) };
  };

  const addGate = useCallback((
    gate: QuantumGateType, qubit: number, column: number,
    controlQubit?: number, control2Qubit?: number, angle?: number,
  ) => {
    setState(s => {
      const id = s.gates.length > 0 ? Math.max(...s.gates.map(g => g.id)) + 1 : 0;
      const newGate: QuantumGateApplication = { id, gate, qubit, column, controlQubit, control2Qubit, angle };
      const newGates = [...s.gates, newGate];
      return { ...s, ...refresh(newGates, s.numQubits, s.shotCount) };
    });
  }, []);

  const removeGate = useCallback((id: number) => {
    setState(s => {
      const newGates = s.gates.filter(g => g.id !== id);
      return { ...s, ...refresh(newGates, s.numQubits, s.shotCount) };
    });
  }, []);

  const setNumQubits = useCallback((n: number) => {
    const nQ = Math.max(1, Math.min(8, n));
    setState(s => {
      const newGates = s.gates.filter(g =>
        g.qubit < nQ &&
        (g.controlQubit === undefined || g.controlQubit < nQ) &&
        (g.control2Qubit === undefined || g.control2Qubit < nQ),
      );
      return { ...s, numQubits: nQ, ...refresh(newGates, nQ, s.shotCount) };
    });
  }, []);

  const setShotCount = useCallback((shots: number) => {
    setState(s => {
      const m = measure(s.stateVector, shots, s.numQubits);
      return { ...s, shotCount: shots, measurements: m };
    });
  }, []);

  const clearCircuit = useCallback(() => {
    setState(s => ({
      ...s, gates: [], stateVector: initialSV(s.numQubits),
      measurements: [], entanglementEntropy: Array(s.numQubits).fill(0),
    }));
  }, []);

  const loadBellState = useCallback(() => {
    setState(s => {
      const gates: QuantumGateApplication[] = [
        { id: 0, gate: 'H', qubit: 0, column: 0 },
        { id: 1, gate: 'CNOT', qubit: 1, column: 1, controlQubit: 0 },
      ];
      return { ...s, ...refresh(gates, s.numQubits, s.shotCount) };
    });
  }, []);

  const loadGHZ = useCallback(() => {
    setState(s => {
      const gates: QuantumGateApplication[] = [
        { id: 0, gate: 'H', qubit: 0, column: 0 },
        ...Array.from({ length: s.numQubits - 1 }, (_, i) => ({
          id: i + 1, gate: 'CNOT' as QuantumGateType, qubit: i + 1, column: i + 1, controlQubit: 0,
        })),
      ];
      return { ...s, ...refresh(gates, s.numQubits, s.shotCount) };
    });
  }, []);

  const exportQASM = useCallback(() => {
    setState(s => {
      const qasm = generateQASM(s.gates, s.numQubits);
      const blob = new Blob([qasm], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'circuit.qasm'; a.click();
      URL.revokeObjectURL(url);
      return s;
    });
  }, []);

  return {
    state,
    addGate, removeGate, setNumQubits, setShotCount,
    clearCircuit, loadBellState, loadGHZ, exportQASM,
  };
};
