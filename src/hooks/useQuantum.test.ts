import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useQuantum, simulateCircuit, computeEntanglement, generateQASM } from './useQuantum';
import type { QuantumGateApplication } from '../types/calculator';

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;

describe('simulateCircuit', () => {
  it('starts in |000⟩ with no gates', () => {
    const sv = simulateCircuit([], 2);
    expect(near(sv[0].re, 1)).toBe(true);
    expect(near(sv[0].im, 0)).toBe(true);
    for (let i = 1; i < sv.length; i++) {
      expect(near(sv[i].re, 0)).toBe(true);
      expect(near(sv[i].im, 0)).toBe(true);
    }
  });

  it('H gate on qubit 0 of 1-qubit system gives equal superposition', () => {
    const gates: QuantumGateApplication[] = [{ id: 0, gate: 'H', qubit: 0, column: 0 }];
    const sv = simulateCircuit(gates, 1);
    const S2 = 1 / Math.SQRT2;
    expect(near(sv[0].re, S2)).toBe(true);
    expect(near(sv[1].re, S2)).toBe(true);
  });

  it('X gate flips |0⟩ to |1⟩', () => {
    const gates: QuantumGateApplication[] = [{ id: 0, gate: 'X', qubit: 0, column: 0 }];
    const sv = simulateCircuit(gates, 1);
    expect(near(sv[0].re, 0)).toBe(true);
    expect(near(sv[1].re, 1)).toBe(true);
  });

  it('Bell state: H on q0 then CNOT q1 (ctrl=0)', () => {
    const gates: QuantumGateApplication[] = [
      { id: 0, gate: 'H', qubit: 0, column: 0 },
      { id: 1, gate: 'CNOT', qubit: 1, column: 1, controlQubit: 0 },
    ];
    const sv = simulateCircuit(gates, 2);
    // |00⟩ and |11⟩ each with probability 0.5
    expect(near(sv[0].re ** 2 + sv[0].im ** 2, 0.5)).toBe(true); // |00⟩
    expect(near(sv[3].re ** 2 + sv[3].im ** 2, 0.5)).toBe(true); // |11⟩
    expect(near(sv[1].re ** 2 + sv[1].im ** 2, 0)).toBe(true);   // |01⟩ = 0
    expect(near(sv[2].re ** 2 + sv[2].im ** 2, 0)).toBe(true);   // |10⟩ = 0
  });

  it('HH on same qubit returns to |0⟩', () => {
    const gates: QuantumGateApplication[] = [
      { id: 0, gate: 'H', qubit: 0, column: 0 },
      { id: 1, gate: 'H', qubit: 0, column: 1 },
    ];
    const sv = simulateCircuit(gates, 1);
    expect(near(sv[0].re, 1)).toBe(true);
    expect(near(sv[1].re, 0)).toBe(true);
  });

  it('Z gate leaves |0⟩ unchanged', () => {
    const gates: QuantumGateApplication[] = [{ id: 0, gate: 'Z', qubit: 0, column: 0 }];
    const sv = simulateCircuit(gates, 1);
    expect(near(sv[0].re, 1)).toBe(true);
  });

  it('state vector probabilities sum to 1', () => {
    const gates: QuantumGateApplication[] = [
      { id: 0, gate: 'H', qubit: 0, column: 0 },
      { id: 1, gate: 'H', qubit: 1, column: 0 },
    ];
    const sv = simulateCircuit(gates, 2);
    const total = sv.reduce((s, c) => s + c.re ** 2 + c.im ** 2, 0);
    expect(near(total, 1)).toBe(true);
  });
});

describe('computeEntanglement', () => {
  it('returns zero entropy for |00⟩', () => {
    const sv = simulateCircuit([], 2);
    const ent = computeEntanglement(sv, 2);
    expect(near(ent[0], 0)).toBe(true);
    expect(near(ent[1], 0)).toBe(true);
  });

  it('returns max entropy (1 bit) for Bell state qubit', () => {
    const gates: QuantumGateApplication[] = [
      { id: 0, gate: 'H', qubit: 0, column: 0 },
      { id: 1, gate: 'CNOT', qubit: 1, column: 1, controlQubit: 0 },
    ];
    const sv = simulateCircuit(gates, 2);
    const ent = computeEntanglement(sv, 2);
    expect(near(ent[0], 1)).toBe(true);
  });
});

describe('generateQASM', () => {
  it('generates OPENQASM header', () => {
    const qasm = generateQASM([], 2);
    expect(qasm).toContain('OPENQASM 2.0');
    expect(qasm).toContain('qreg q[2]');
  });

  it('includes H gate instruction', () => {
    const gates: QuantumGateApplication[] = [{ id: 0, gate: 'H', qubit: 0, column: 0 }];
    const qasm = generateQASM(gates, 2);
    expect(qasm).toContain('h q[0]');
  });

  it('includes CNOT instruction', () => {
    const gates: QuantumGateApplication[] = [{ id: 0, gate: 'CNOT', qubit: 1, column: 0, controlQubit: 0 }];
    const qasm = generateQASM(gates, 2);
    expect(qasm).toContain('cx q[0], q[1]');
  });
});

describe('useQuantum hook', () => {
  it('initialises with 3 qubits and no gates', () => {
    const { result } = renderHook(() => useQuantum());
    expect(result.current.state.numQubits).toBe(3);
    expect(result.current.state.gates).toHaveLength(0);
  });

  it('adds a gate', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.addGate('H', 0, 0));
    expect(result.current.state.gates).toHaveLength(1);
    expect(result.current.state.gates[0].gate).toBe('H');
  });

  it('removes a gate', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.addGate('H', 0, 0));
    const id = result.current.state.gates[0].id;
    act(() => result.current.removeGate(id));
    expect(result.current.state.gates).toHaveLength(0);
  });

  it('updates state vector after adding H gate', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.addGate('H', 0, 0));
    const sv = result.current.state.stateVector;
    // After H on qubit 0 of 3 qubits: total probability must equal 1
    const totalProb = sv.reduce((s, c) => s + c.re ** 2 + c.im ** 2, 0);
    expect(near(totalProb, 1)).toBe(true);
  });

  it('clears circuit', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.addGate('X', 0, 0));
    act(() => result.current.clearCircuit());
    expect(result.current.state.gates).toHaveLength(0);
  });

  it('sets qubit count', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.setNumQubits(4));
    expect(result.current.state.numQubits).toBe(4);
  });

  it('clamps qubit count to [1, 8]', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.setNumQubits(0));
    expect(result.current.state.numQubits).toBe(1);
    act(() => result.current.setNumQubits(10));
    expect(result.current.state.numQubits).toBe(8);
  });

  it('loads Bell state', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.loadBellState());
    expect(result.current.state.gates).toHaveLength(2);
    expect(result.current.state.gates[0].gate).toBe('H');
    expect(result.current.state.gates[1].gate).toBe('CNOT');
  });

  it('measurements sum to shot count', () => {
    const { result } = renderHook(() => useQuantum());
    act(() => result.current.loadBellState());
    const total = result.current.state.measurements.reduce((s, m) => s + m.count, 0);
    expect(total).toBe(result.current.state.shotCount);
  });

  it('entanglement entropy array length matches numQubits', () => {
    const { result } = renderHook(() => useQuantum());
    expect(result.current.state.entanglementEntropy.length).toBe(result.current.state.numQubits);
  });
});
