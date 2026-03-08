import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DistributionExplorer } from './DistributionExplorer';

describe('DistributionExplorer component', () => {
  it('renders canvas', () => {
    render(<DistributionExplorer />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows distribution type buttons', () => {
    render(<DistributionExplorer />);
    expect(screen.getByRole('button', { name: /normal/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /student-t/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /binomial/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /poisson/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exponential/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /uniform/i })).toBeInTheDocument();
  });

  it('Normal is active by default', () => {
    render(<DistributionExplorer />);
    const btn = screen.getByRole('button', { name: /normal/i });
    expect(btn.className).toContain('active');
  });

  it('shows mu and sigma sliders for Normal distribution', () => {
    render(<DistributionExplorer />);
    expect(screen.getByLabelText('mu')).toBeInTheDocument();
    expect(screen.getByLabelText('sigma')).toBeInTheDocument();
  });

  it('shows df slider when Student-t is selected', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /student-t/i }));
    expect(screen.getByLabelText('df')).toBeInTheDocument();
  });

  it('shows n and p sliders for Binomial distribution', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /binomial/i }));
    expect(screen.getByLabelText('n')).toBeInTheDocument();
    expect(screen.getByLabelText('p')).toBeInTheDocument();
  });

  it('shows lambda slider for Poisson distribution', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /poisson/i }));
    expect(screen.getByLabelText('lambda')).toBeInTheDocument();
  });

  it('shows tail mode buttons', () => {
    render(<DistributionExplorer />);
    expect(screen.getByRole('button', { name: /^none$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /left tail/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /right tail/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /two-tailed/i })).toBeInTheDocument();
  });

  it('clicking Left tail shows threshold slider', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /left tail/i }));
    expect(screen.getByLabelText('tail threshold')).toBeInTheDocument();
  });

  it('shows Monte Carlo button', () => {
    render(<DistributionExplorer />);
    expect(screen.getByRole('button', { name: /monte carlo/i })).toBeInTheDocument();
  });

  it('clicking Monte Carlo reveals Run Simulation button', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /monte carlo/i }));
    expect(screen.getByRole('button', { name: /run simulation/i })).toBeInTheDocument();
  });

  it('shows Overlay button', () => {
    render(<DistributionExplorer />);
    expect(screen.getByRole('button', { name: /\+ overlay/i })).toBeInTheDocument();
  });

  it('clicking Overlay adds an overlay chip', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /\+ overlay/i }));
    expect(document.querySelector('.distribution__overlay-chip')).toBeInTheDocument();
  });

  it('shows a and b sliders for Uniform distribution', () => {
    render(<DistributionExplorer />);
    fireEvent.click(screen.getByRole('button', { name: /uniform/i }));
    expect(screen.getByLabelText('a')).toBeInTheDocument();
    expect(screen.getByLabelText('b')).toBeInTheDocument();
  });
});
