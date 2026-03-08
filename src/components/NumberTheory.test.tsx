import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NumberTheory } from './NumberTheory';

describe('NumberTheory component', () => {
  it('renders canvas', () => {
    render(<NumberTheory />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows mode buttons', () => {
    render(<NumberTheory />);
    expect(screen.getByRole('button', { name: /factorize/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sieve/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ulam spiral/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sequences/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /modular/i })).toBeInTheDocument();
  });

  it('Factorize mode is active by default', () => {
    render(<NumberTheory />);
    const btn = screen.getByRole('button', { name: /factorize/i });
    expect(btn.className).toContain('active');
  });

  it('shows N input in factorize mode', () => {
    render(<NumberTheory />);
    expect(screen.getByLabelText('N')).toBeInTheDocument();
  });

  it('shows factor info in factorize mode', () => {
    render(<NumberTheory />);
    expect(screen.getByText(/factors:/i)).toBeInTheDocument();
  });

  it('switching to Sieve shows limit input', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /sieve/i }));
    expect(screen.getByLabelText('sieve limit')).toBeInTheDocument();
  });

  it('switching to Ulam shows size input', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /ulam spiral/i }));
    expect(screen.getByLabelText('Ulam size')).toBeInTheDocument();
  });

  it('switching to Sequences shows sequence type buttons', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /sequences/i }));
    expect(screen.getByRole('button', { name: /fibonacci/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /triangular/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /primes/i })).toBeInTheDocument();
  });

  it('switching to Sequences shows length slider', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /sequences/i }));
    expect(screen.getByLabelText('sequence length')).toBeInTheDocument();
  });

  it('switching to Sequences shows Bar and Scatter buttons', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /sequences/i }));
    expect(screen.getByRole('button', { name: /^bar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^scatter$/i })).toBeInTheDocument();
  });

  it('switching to Modular shows base, exp, mod inputs', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /modular/i }));
    expect(screen.getByLabelText('base')).toBeInTheDocument();
    expect(screen.getByLabelText('exponent')).toBeInTheDocument();
    expect(screen.getByLabelText('modulus')).toBeInTheDocument();
  });

  it('switching to Modular shows result display', () => {
    render(<NumberTheory />);
    fireEvent.click(screen.getByRole('button', { name: /modular/i }));
    expect(screen.getByText(/mod/)).toBeInTheDocument();
  });

  it('changing N input updates value', () => {
    render(<NumberTheory />);
    const input = screen.getByLabelText('N');
    fireEvent.change(input, { target: { value: '42' } });
    expect(input).toHaveValue(42);
  });
});
