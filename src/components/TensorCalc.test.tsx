import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TensorCalc } from './TensorCalc';

describe('TensorCalc', () => {
  it('renders canvas', () => {
    render(<TensorCalc />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows mode buttons', () => {
    render(<TensorCalc />);
    expect(screen.getByText('Gradient')).toBeInTheDocument();
    expect(screen.getByText('Divergence')).toBeInTheDocument();
    expect(screen.getByText('Curl')).toBeInTheDocument();
    expect(screen.getByText('Jacobian')).toBeInTheDocument();
    expect(screen.getByText('Hessian')).toBeInTheDocument();
    expect(screen.getByText('Grad Descent')).toBeInTheDocument();
  });

  it('Gradient mode is active by default', () => {
    render(<TensorCalc />);
    const btn = screen.getByText('Gradient');
    expect(btn.className).toContain('active');
  });

  it('shows f(x,y) expression input in gradient mode', () => {
    render(<TensorCalc />);
    expect(screen.getByLabelText('f(x,y) expression')).toBeInTheDocument();
  });

  it('default expression is x^2 + y^2', () => {
    render(<TensorCalc />);
    const input = screen.getByLabelText('f(x,y) expression') as HTMLInputElement;
    expect(input.value).toBe('x^2 + y^2');
  });

  it('allows changing expression', () => {
    render(<TensorCalc />);
    const input = screen.getByLabelText('f(x,y) expression') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sin(x) + cos(y)' } });
    expect(input.value).toBe('sin(x) + cos(y)');
  });

  it('switching to Divergence shows Fx and Fy inputs', () => {
    render(<TensorCalc />);
    fireEvent.click(screen.getByText('Divergence'));
    expect(screen.getByLabelText('Fx expression')).toBeInTheDocument();
    expect(screen.getByLabelText('Fy expression')).toBeInTheDocument();
  });

  it('switching to gradient-descent shows descent controls', () => {
    render(<TensorCalc />);
    fireEvent.click(screen.getByText('Grad Descent'));
    expect(screen.getByLabelText('start x')).toBeInTheDocument();
    expect(screen.getByLabelText('learning rate')).toBeInTheDocument();
  });

  it('shows results panel', () => {
    render(<TensorCalc />);
    expect(document.querySelector('.tensor-calc__results')).toBeInTheDocument();
  });

  it('gradient result is shown', () => {
    render(<TensorCalc />);
    const panel = document.querySelector('.tensor-calc__results') as HTMLElement;
    expect(panel.textContent).not.toBe('');
  });

  it('switching to Curl mode shows curl result', () => {
    render(<TensorCalc />);
    fireEvent.click(screen.getByText('Curl'));
    const panel = document.querySelector('.tensor-calc__results') as HTMLElement;
    expect(panel.textContent).not.toBe('');
  });

  it('switching to Jacobian shows expression input', () => {
    render(<TensorCalc />);
    fireEvent.click(screen.getByText('Jacobian'));
    expect(screen.getByLabelText('f(x,y) expression')).toBeInTheDocument();
  });

  it('Hessian mode shows expression input', () => {
    render(<TensorCalc />);
    fireEvent.click(screen.getByText('Hessian'));
    expect(screen.getByLabelText('f(x,y) expression')).toBeInTheDocument();
  });
});
