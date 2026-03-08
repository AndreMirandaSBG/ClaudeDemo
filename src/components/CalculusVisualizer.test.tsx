import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CalculusVisualizer } from './CalculusVisualizer';

describe('CalculusVisualizer component', () => {
  it('renders canvas', () => {
    render(<CalculusVisualizer />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders f(x) expression input', () => {
    render(<CalculusVisualizer />);
    expect(screen.getByLabelText('f(x) expression')).toBeInTheDocument();
  });

  it('default expression is x^3 - 3*x', () => {
    render(<CalculusVisualizer />);
    const input = screen.getByLabelText('f(x) expression');
    expect(input).toHaveValue('x^3 - 3*x');
  });

  it('allows changing the expression', () => {
    render(<CalculusVisualizer />);
    const input = screen.getByLabelText('f(x) expression');
    fireEvent.change(input, { target: { value: 'x^2' } });
    expect(input).toHaveValue('x^2');
  });

  it('shows Derivative and Integral mode buttons', () => {
    render(<CalculusVisualizer />);
    expect(screen.getByRole('button', { name: /derivative/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /integral/i })).toBeInTheDocument();
  });

  it('Derivative mode is active by default', () => {
    render(<CalculusVisualizer />);
    const derivBtn = screen.getByRole('button', { name: /derivative/i });
    expect(derivBtn.className).toContain('active');
  });

  it('shows order buttons in derivative mode', () => {
    render(<CalculusVisualizer />);
    expect(screen.getByRole('button', { name: /1st/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /2nd/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3rd/i })).toBeInTheDocument();
  });

  it('shows tangent x slider in derivative mode', () => {
    render(<CalculusVisualizer />);
    expect(screen.getByLabelText('tangent x')).toBeInTheDocument();
  });

  it('switching to integral mode shows bounds inputs', () => {
    render(<CalculusVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: /integral/i }));
    expect(screen.getByLabelText('integral lower bound')).toBeInTheDocument();
    expect(screen.getByLabelText('integral upper bound')).toBeInTheDocument();
  });

  it('switching to integral mode hides derivative controls', () => {
    render(<CalculusVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: /integral/i }));
    expect(screen.queryByLabelText('tangent x')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /1st/i })).not.toBeInTheDocument();
  });

  it('clicking Compute button does not throw', () => {
    render(<CalculusVisualizer />);
    const computeBtn = screen.getByRole('button', { name: /compute/i });
    fireEvent.click(computeBtn);
  });

  it('Compute in derivative mode shows steps toggle', () => {
    render(<CalculusVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: /compute/i }));
    expect(screen.getByRole('button', { name: /steps/i })).toBeInTheDocument();
  });

  it('clicking Show Steps reveals step list', () => {
    render(<CalculusVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: /compute/i }));
    const stepsBtn = screen.getByRole('button', { name: /show steps/i });
    fireEvent.click(stepsBtn);
    const list = document.querySelector('.calculus-viz__steps-list');
    expect(list).toBeInTheDocument();
  });

  it('Compute in integral mode shows integral steps', () => {
    render(<CalculusVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: /integral/i }));
    fireEvent.click(screen.getByRole('button', { name: /compute/i }));
    fireEvent.click(screen.getByRole('button', { name: /show steps/i }));
    const list = document.querySelector('.calculus-viz__steps-list');
    expect(list).toBeInTheDocument();
  });

  it('tangent x slider changes value', () => {
    render(<CalculusVisualizer />);
    const slider = screen.getByLabelText('tangent x');
    fireEvent.change(slider, { target: { value: '1.5' } });
    expect(slider).toHaveValue('1.5');
  });

  it('changing order to 2nd updates active button', () => {
    render(<CalculusVisualizer />);
    fireEvent.click(screen.getByRole('button', { name: /2nd/i }));
    const btn2 = screen.getByRole('button', { name: /2nd/i });
    expect(btn2.className).toContain('active');
  });
});
