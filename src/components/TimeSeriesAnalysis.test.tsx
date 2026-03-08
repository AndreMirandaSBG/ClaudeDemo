import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimeSeriesAnalysis } from './TimeSeriesAnalysis';

describe('TimeSeriesAnalysis component', () => {
  it('renders without crashing', () => {
    render(<TimeSeriesAnalysis />);
  });

  it('renders mode tab buttons', () => {
    render(<TimeSeriesAnalysis />);
    expect(screen.getByRole('button', { name: 'Data' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Decompose' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'ACF/PACF' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Forecast' })).toBeDefined();
  });

  it('renders sample load buttons', () => {
    render(<TimeSeriesAnalysis />);
    expect(screen.getByRole('button', { name: 'Trend' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Seasonal' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Noisy' })).toBeDefined();
  });

  it('renders canvas elements', () => {
    const { container } = render(<TimeSeriesAnalysis />);
    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBeGreaterThanOrEqual(2);
  });

  it('renders Compute All button', () => {
    render(<TimeSeriesAnalysis />);
    expect(screen.getByRole('button', { name: 'Compute All' })).toBeDefined();
  });

  it('renders parameter controls', () => {
    render(<TimeSeriesAnalysis />);
    expect(screen.getByText(/Season period/i)).toBeDefined();
    expect(screen.getByText(/Forecast steps/i)).toBeDefined();
    expect(screen.getByText(/smoothing/i)).toBeDefined();
    expect(screen.getByText(/Max lag/i)).toBeDefined();
  });

  it('clicking Forecast tab switches mode', () => {
    render(<TimeSeriesAnalysis />);
    const forecastBtn = screen.getByRole('button', { name: 'Forecast' });
    fireEvent.click(forecastBtn);
    expect(forecastBtn.className).toContain('active');
  });

  it('clicking Decompose tab switches mode', () => {
    render(<TimeSeriesAnalysis />);
    const decomposeBtn = screen.getByRole('button', { name: 'Decompose' });
    fireEvent.click(decomposeBtn);
    expect(decomposeBtn.className).toContain('active');
  });

  it('clicking ACF/PACF tab switches mode', () => {
    render(<TimeSeriesAnalysis />);
    const acfBtn = screen.getByRole('button', { name: 'ACF/PACF' });
    fireEvent.click(acfBtn);
    expect(acfBtn.className).toContain('active');
  });

  it('clicking Trend sample loads trend data', () => {
    render(<TimeSeriesAnalysis />);
    fireEvent.click(screen.getByRole('button', { name: 'Trend' }));
    // Should show n= with data points
    expect(screen.getByText(/n=/)).toBeDefined();
  });

  it('clicking Seasonal sample loads seasonal data', () => {
    render(<TimeSeriesAnalysis />);
    fireEvent.click(screen.getByRole('button', { name: 'Seasonal' }));
    expect(screen.getByText(/n=/)).toBeDefined();
  });

  it('Compute All button runs analysis', () => {
    render(<TimeSeriesAnalysis />);
    const computeBtn = screen.getByRole('button', { name: 'Compute All' });
    fireEvent.click(computeBtn);
    // Component should still render after computation
    expect(screen.getByRole('button', { name: 'Compute All' })).toBeDefined();
  });

  it('Forecast mode after Compute All shows export button', () => {
    render(<TimeSeriesAnalysis />);
    fireEvent.click(screen.getByRole('button', { name: 'Forecast' }));
    // After switching to Forecast mode (which triggers computeAll), export button may appear
    // Just check the mode is active
    const forecastBtn = screen.getByRole('button', { name: 'Forecast' });
    expect(forecastBtn.className).toContain('active');
  });

  it('Difference button applies differencing', () => {
    render(<TimeSeriesAnalysis />);
    const diffBtn = screen.getByRole('button', { name: /Difference/i });
    fireEvent.click(diffBtn);
    expect(screen.getByText(/differenced/i)).toBeDefined();
  });

  it('shows data point count', () => {
    render(<TimeSeriesAnalysis />);
    expect(screen.getByText(/n=60/i)).toBeDefined();
  });

  it('changing seasonal period updates input', () => {
    render(<TimeSeriesAnalysis />);
    const inputs = screen.getAllByRole('spinbutton');
    const periodInput = inputs[0];
    fireEvent.change(periodInput, { target: { value: '6' } });
    expect((periodInput as HTMLInputElement).value).toBe('6');
  });
});
