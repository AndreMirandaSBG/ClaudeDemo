import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EquationSolver } from './EquationSolver';

describe('EquationSolver component', () => {
  it('renders the input field', () => {
    render(<EquationSolver />);
    expect(screen.getByLabelText(/polynomial input/i)).toBeInTheDocument();
  });

  it('renders the solve button', () => {
    render(<EquationSolver />);
    expect(screen.getByRole('button', { name: /^solve$/i })).toBeInTheDocument();
  });

  it('renders mode buttons', () => {
    render(<EquationSolver />);
    expect(screen.getByRole('button', { name: /polynomial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /linear/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /trig/i })).toBeInTheDocument();
  });

  it('renders a canvas for root visualization', () => {
    render(<EquationSolver />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('solves x - 3 = 0 and displays root ≈ 3', () => {
    render(<EquationSolver />);
    fireEvent.change(screen.getByLabelText(/polynomial input/i), { target: { value: 'x - 3' } });
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    expect(screen.getByText(/3\.000000/)).toBeInTheDocument();
  });

  it('shows steps button after solving', () => {
    render(<EquationSolver />);
    fireEvent.change(screen.getByLabelText(/polynomial input/i), { target: { value: 'x - 5' } });
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    expect(screen.getByRole('button', { name: /show steps/i })).toBeInTheDocument();
  });

  it('toggles steps panel open and closed', () => {
    render(<EquationSolver />);
    fireEvent.change(screen.getByLabelText(/polynomial input/i), { target: { value: 'x - 5' } });
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    fireEvent.click(screen.getByRole('button', { name: /show steps/i }));
    expect(screen.getByRole('list')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /hide steps/i }));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows invalid error for garbage input', () => {
    render(<EquationSolver />);
    fireEvent.change(screen.getByLabelText(/polynomial input/i), { target: { value: '!!!' } });
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    expect(screen.getByText(/invalid/i)).toBeInTheDocument();
  });

  it('shows clear button after solve and clears on click', () => {
    render(<EquationSolver />);
    fireEvent.change(screen.getByLabelText(/polynomial input/i), { target: { value: 'x - 1' } });
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));
    expect(screen.queryByText(/roots/i)).not.toBeInTheDocument();
  });

  it('Enter key triggers solve', () => {
    render(<EquationSolver />);
    const input = screen.getByLabelText(/polynomial input/i);
    fireEvent.change(input, { target: { value: 'x - 7' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText(/7\.000000/)).toBeInTheDocument();
  });

  it('switches to linear mode and shows matrix inputs', () => {
    render(<EquationSolver />);
    fireEvent.click(screen.getByRole('button', { name: /linear/i }));
    expect(screen.getByLabelText('a11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /solve system/i })).toBeInTheDocument();
  });

  it('solves 2×2 linear system', () => {
    render(<EquationSolver />);
    fireEvent.click(screen.getByRole('button', { name: /linear/i }));
    fireEvent.click(screen.getByRole('button', { name: /solve system/i }));
    // Default values: 2x+y=5, x-y=1 → x=2, y=1
    expect(screen.getByText(/2\.000000/)).toBeInTheDocument();
  });

  it('switches to trig mode and shows function selector', () => {
    render(<EquationSolver />);
    fireEvent.click(screen.getByRole('button', { name: /trig/i }));
    expect(screen.getByLabelText(/trig function/i)).toBeInTheDocument();
  });

  it('solves trig equation and shows results', () => {
    render(<EquationSolver />);
    fireEvent.click(screen.getByRole('button', { name: /trig/i }));
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
  });

  it('shows degree information in results', () => {
    render(<EquationSolver />);
    fireEvent.change(screen.getByLabelText(/polynomial input/i), { target: { value: 'x^2 - 1' } });
    fireEvent.click(screen.getByRole('button', { name: /^solve$/i }));
    expect(screen.getByText(/degree 2/i)).toBeInTheDocument();
  });
});
