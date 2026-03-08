import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DiffEqSolver } from './DiffEqSolver';

describe('DiffEqSolver component', () => {
  it('renders canvas', () => {
    render(<DiffEqSolver />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows mode buttons', () => {
    render(<DiffEqSolver />);
    expect(screen.getByRole('button', { name: /1st order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2d system/i })).toBeInTheDocument();
  });

  it('1st order mode is active by default', () => {
    render(<DiffEqSolver />);
    const btn = screen.getByRole('button', { name: /1st order/i });
    expect(btn.className).toContain('active');
  });

  it('shows dy/dx expression input in first-order mode', () => {
    render(<DiffEqSolver />);
    expect(screen.getByLabelText('dy/dx expression')).toBeInTheDocument();
  });

  it('default expression is -y', () => {
    render(<DiffEqSolver />);
    const input = screen.getByLabelText('dy/dx expression');
    expect(input).toHaveValue('-y');
  });

  it('allows changing expression', () => {
    render(<DiffEqSolver />);
    const input = screen.getByLabelText('dy/dx expression');
    fireEvent.change(input, { target: { value: 'x - y' } });
    expect(input).toHaveValue('x - y');
  });

  it('shows Euler and RK4 method buttons', () => {
    render(<DiffEqSolver />);
    expect(screen.getByRole('button', { name: /euler/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rk4/i })).toBeInTheDocument();
  });

  it('RK4 is active by default', () => {
    render(<DiffEqSolver />);
    const btn = screen.getByRole('button', { name: /rk4/i });
    expect(btn.className).toContain('active');
  });

  it('shows initial condition inputs', () => {
    render(<DiffEqSolver />);
    expect(screen.getByLabelText('initial x')).toBeInTheDocument();
    expect(screen.getByLabelText('initial y')).toBeInTheDocument();
    expect(screen.getByLabelText('x end')).toBeInTheDocument();
  });

  it('shows Solve button in first-order mode', () => {
    render(<DiffEqSolver />);
    expect(screen.getByRole('button', { name: /solve ode/i })).toBeInTheDocument();
  });

  it('clicking Solve does not throw', () => {
    render(<DiffEqSolver />);
    fireEvent.click(screen.getByRole('button', { name: /solve ode/i }));
  });

  it('switching to 2D system shows dx/dt and dy/dt inputs', () => {
    render(<DiffEqSolver />);
    fireEvent.click(screen.getByRole('button', { name: /2d system/i }));
    expect(screen.getByLabelText('dx/dt expression')).toBeInTheDocument();
    expect(screen.getByLabelText('dy/dt expression')).toBeInTheDocument();
  });

  it('switching to 2D system hides solve button', () => {
    render(<DiffEqSolver />);
    fireEvent.click(screen.getByRole('button', { name: /2d system/i }));
    expect(screen.queryByRole('button', { name: /solve ode/i })).not.toBeInTheDocument();
  });

  it('shows legend with stability labels', () => {
    render(<DiffEqSolver />);
    expect(screen.getByText(/\bstable\b/i)).toBeInTheDocument();
    expect(screen.getByText(/unstable/i)).toBeInTheDocument();
    expect(screen.getByText(/saddle/i)).toBeInTheDocument();
  });

  it('Euler method can be selected', () => {
    render(<DiffEqSolver />);
    fireEvent.click(screen.getByRole('button', { name: /euler/i }));
    const btn = screen.getByRole('button', { name: /euler/i });
    expect(btn.className).toContain('active');
  });

  it('changing initial x input updates value', () => {
    render(<DiffEqSolver />);
    const input = screen.getByLabelText('initial x');
    fireEvent.change(input, { target: { value: '1' } });
    expect(input).toHaveValue(1);
  });

  it('canvas is present in 2D system mode too', () => {
    render(<DiffEqSolver />);
    fireEvent.click(screen.getByRole('button', { name: /2d system/i }));
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
