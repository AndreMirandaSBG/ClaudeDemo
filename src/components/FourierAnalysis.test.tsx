import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FourierAnalysis } from './FourierAnalysis';

describe('FourierAnalysis component', () => {
  it('renders three canvases', () => {
    render(<FourierAnalysis />);
    expect(document.querySelectorAll('canvas')).toHaveLength(3);
  });

  it('renders signal, spectrum and reconstructed canvases', () => {
    render(<FourierAnalysis />);
    expect(screen.getByLabelText('signal')).toBeInTheDocument();
    expect(screen.getByLabelText('spectrum')).toBeInTheDocument();
    expect(screen.getByLabelText('reconstructed')).toBeInTheDocument();
  });

  it('shows signal preset buttons', () => {
    render(<FourierAnalysis />);
    expect(screen.getByRole('button', { name: /sine/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /square/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sawtooth/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /triangle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument();
  });

  it('Square preset is active by default', () => {
    render(<FourierAnalysis />);
    const squareBtn = screen.getByRole('button', { name: /^square$/i });
    expect(squareBtn.className).toContain('active');
  });

  it('shows window function buttons', () => {
    render(<FourierAnalysis />);
    // There are two "None" buttons (window + harmonics), so use getAllByRole
    expect(screen.getAllByRole('button', { name: /^none$/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /hann/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hamming/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /blackman/i })).toBeInTheDocument();
  });

  it('shows frequency slider', () => {
    render(<FourierAnalysis />);
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
  });

  it('shows All and None harmonic buttons', () => {
    render(<FourierAnalysis />);
    expect(screen.getByRole('button', { name: /^all$/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^none$/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('shows Show Phase / Show Amplitude toggle', () => {
    render(<FourierAnalysis />);
    expect(screen.getByRole('button', { name: /show phase|show amplitude/i })).toBeInTheDocument();
  });

  it('clicking Square preset makes it active', () => {
    render(<FourierAnalysis />);
    fireEvent.click(screen.getByRole('button', { name: /^square$/i }));
    const squareBtn = screen.getByRole('button', { name: /^square$/i });
    expect(squareBtn.className).toContain('active');
  });

  it('clicking Custom preset shows expression input', () => {
    render(<FourierAnalysis />);
    fireEvent.click(screen.getByRole('button', { name: /custom/i }));
    expect(screen.getByLabelText('Custom expression')).toBeInTheDocument();
  });

  it('clicking Show Phase changes button text', () => {
    render(<FourierAnalysis />);
    const phaseBtn = screen.getByRole('button', { name: /show phase/i });
    fireEvent.click(phaseBtn);
    expect(screen.getByRole('button', { name: /show amplitude/i })).toBeInTheDocument();
  });

  it('harmonic buttons are rendered', () => {
    render(<FourierAnalysis />);
    expect(screen.getByLabelText('Harmonic 0')).toBeInTheDocument();
  });

  it('clicking a window function makes it active', () => {
    render(<FourierAnalysis />);
    fireEvent.click(screen.getByRole('button', { name: /hann/i }));
    const hannBtn = screen.getByRole('button', { name: /hann/i });
    expect(hannBtn.className).toContain('active');
  });
});
