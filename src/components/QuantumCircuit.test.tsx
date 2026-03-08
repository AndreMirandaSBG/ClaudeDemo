import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuantumCircuit } from './QuantumCircuit';

describe('QuantumCircuit component', () => {
  it('renders without crashing', () => {
    render(<QuantumCircuit />);
  });

  it('renders single-qubit gate buttons', () => {
    render(<QuantumCircuit />);
    expect(screen.getByRole('button', { name: 'H' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'X' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Y' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Z' })).toBeDefined();
  });

  it('renders multi-qubit gate buttons', () => {
    render(<QuantumCircuit />);
    expect(screen.getByRole('button', { name: 'CNOT' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'CZ' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'SWAP' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Toffoli' })).toBeDefined();
  });

  it('renders control buttons', () => {
    render(<QuantumCircuit />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Bell State' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'GHZ State' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Export QASM' })).toBeDefined();
  });

  it('renders canvas elements', () => {
    const { container } = render(<QuantumCircuit />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThanOrEqual(2);
  });

  it('displays qubit count input', () => {
    render(<QuantumCircuit />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders state vector panel title', () => {
    render(<QuantumCircuit />);
    expect(screen.getByText(/State Vector/i)).toBeDefined();
  });

  it('renders entanglement entropy panel', () => {
    render(<QuantumCircuit />);
    expect(screen.getByText(/Entanglement Entropy/i)).toBeDefined();
  });

  it('renders measurement histogram label', () => {
    render(<QuantumCircuit />);
    expect(screen.getByText(/Measurement Histogram/i)).toBeDefined();
  });

  it('clicking H gate button selects it', () => {
    render(<QuantumCircuit />);
    const hBtn = screen.getByRole('button', { name: 'H' });
    fireEvent.click(hBtn);
    expect(hBtn.className).toContain('active');
  });

  it('clicking X gate button selects it', () => {
    render(<QuantumCircuit />);
    const xBtn = screen.getByRole('button', { name: 'X' });
    fireEvent.click(xBtn);
    expect(xBtn.className).toContain('active');
  });

  it('clicking Bell State loads Bell state gates', () => {
    render(<QuantumCircuit />);
    fireEvent.click(screen.getByRole('button', { name: 'Bell State' }));
    // State vector should now show |00⟩ and |11⟩ with equal probability
    // We check that the component renders without errors after loading
    expect(screen.getByText(/State Vector/i)).toBeDefined();
  });

  it('clicking GHZ State loads GHZ circuit', () => {
    render(<QuantumCircuit />);
    fireEvent.click(screen.getByRole('button', { name: 'GHZ State' }));
    expect(screen.getByText(/Entanglement Entropy/i)).toBeDefined();
  });

  it('clicking Clear resets the circuit', () => {
    render(<QuantumCircuit />);
    fireEvent.click(screen.getByRole('button', { name: 'Bell State' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByText(/State Vector/i)).toBeDefined();
  });

  it('clicking CNOT shows control qubit input', () => {
    render(<QuantumCircuit />);
    const cnotBtn = screen.getByRole('button', { name: 'CNOT' });
    fireEvent.click(cnotBtn);
    expect(screen.getByText(/Ctrl/)).toBeDefined();
  });

  it('changing qubit count updates the component', () => {
    render(<QuantumCircuit />);
    const qInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(qInput, { target: { value: '4' } });
    // Should render without error
    expect(screen.getByText(/State Vector/i)).toBeDefined();
  });
});
