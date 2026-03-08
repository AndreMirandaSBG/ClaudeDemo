import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChaosExplorer } from './ChaosExplorer';

describe('ChaosExplorer component', () => {
  it('renders without crashing', () => {
    render(<ChaosExplorer />);
  });

  it('renders mode tabs', () => {
    render(<ChaosExplorer />);
    expect(screen.getByText('Lorenz Attractor')).toBeDefined();
    expect(screen.getByText('Bifurcation')).toBeDefined();
    expect(screen.getByText('Fractal Explorer')).toBeDefined();
    expect(screen.getByText('Lyapunov Exponent')).toBeDefined();
  });

  it('Lorenz tab is active by default', () => {
    render(<ChaosExplorer />);
    const lorenzBtn = screen.getByText('Lorenz Attractor');
    expect(lorenzBtn.className).toContain('active');
  });

  it('renders canvas in Lorenz mode', () => {
    const { container } = render(<ChaosExplorer />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('renders Play button in Lorenz mode', () => {
    render(<ChaosExplorer />);
    expect(screen.getByText('▶ Play')).toBeDefined();
  });

  it('renders Reset button in Lorenz mode', () => {
    render(<ChaosExplorer />);
    expect(screen.getByText('⟳ Reset')).toBeDefined();
  });

  it('renders Lorenz Weather Model preset button', () => {
    render(<ChaosExplorer />);
    expect(screen.getByText('Lorenz Weather Model')).toBeDefined();
  });

  it('renders Recompute Trajectory button', () => {
    render(<ChaosExplorer />);
    expect(screen.getByText('Recompute Trajectory')).toBeDefined();
  });

  it('Play button toggles to Pause on click', () => {
    render(<ChaosExplorer />);
    const playBtn = screen.getByText('▶ Play');
    fireEvent.click(playBtn);
    expect(screen.getByText('⏸ Pause')).toBeDefined();
  });

  it('clicking Bifurcation tab switches mode', () => {
    render(<ChaosExplorer />);
    const bifBtn = screen.getByText('Bifurcation');
    fireEvent.click(bifBtn);
    expect(bifBtn.className).toContain('active');
  });

  it('Bifurcation mode shows Recompute button', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Bifurcation'));
    expect(screen.getByText('Recompute')).toBeDefined();
  });

  it('Bifurcation mode shows Period-Doubling Cascade preset', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Bifurcation'));
    expect(screen.getByText('Period-Doubling Cascade')).toBeDefined();
  });

  it('clicking Fractal Explorer tab switches mode', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Fractal Explorer'));
    const fractalBtn = screen.getByText('Fractal Explorer');
    expect(fractalBtn.className).toContain('active');
  });

  it('Fractal mode shows Mandelbrot and Julia buttons', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Fractal Explorer'));
    expect(screen.getByText('Mandelbrot')).toBeDefined();
    expect(screen.getByText('Julia')).toBeDefined();
  });

  it('Fractal mode Mandelbrot button is active initially', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Fractal Explorer'));
    const mandBtn = screen.getByText('Mandelbrot');
    expect(mandBtn.className).toContain('active');
  });

  it('clicking Julia in Fractal mode activates Julia', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Fractal Explorer'));
    fireEvent.click(screen.getByText('Julia'));
    const juliaBtn = screen.getByText('Julia');
    expect(juliaBtn.className).toContain('active');
  });

  it('clicking Lyapunov tab switches mode', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Lyapunov Exponent'));
    const lyapBtn = screen.getByText('Lyapunov Exponent');
    expect(lyapBtn.className).toContain('active');
  });

  it('Lorenz mode shows sigma slider', () => {
    render(<ChaosExplorer />);
    expect(screen.getByLabelText('sigma parameter')).toBeDefined();
  });

  it('Lorenz mode shows rho slider', () => {
    render(<ChaosExplorer />);
    expect(screen.getByLabelText('rho parameter')).toBeDefined();
  });

  it('Lorenz mode shows beta slider', () => {
    render(<ChaosExplorer />);
    expect(screen.getByLabelText('beta parameter')).toBeDefined();
  });

  it('Lorenz mode shows tail length slider', () => {
    render(<ChaosExplorer />);
    expect(screen.getByLabelText('tail length')).toBeDefined();
  });

  it('Lyapunov mode shows r slider', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Lyapunov Exponent'));
    expect(screen.getByLabelText('r parameter for logistic map')).toBeDefined();
  });

  it('Lorenz Weather Model preset button is clickable', () => {
    render(<ChaosExplorer />);
    const preset = screen.getByText('Lorenz Weather Model');
    fireEvent.click(preset);
    // Should remain in Lorenz mode
    expect(screen.getByText('Lorenz Attractor').className).toContain('active');
  });

  it('Mandelbrot Overview preset switches to fractal mode', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Fractal Explorer'));
    fireEvent.click(screen.getByText('Mandelbrot Overview'));
    expect(screen.getByText('Fractal Explorer').className).toContain('active');
  });

  it('renders keyboard shortcuts hint', () => {
    render(<ChaosExplorer />);
    expect(screen.getByText('⌨ Space: play/pause')).toBeDefined();
  });

  it('Fractal mode shows Mandelbrot Overview preset', () => {
    render(<ChaosExplorer />);
    fireEvent.click(screen.getByText('Fractal Explorer'));
    expect(screen.getByText('Mandelbrot Overview')).toBeDefined();
  });

  it('Reset button resets Lorenz view', () => {
    render(<ChaosExplorer />);
    const playBtn = screen.getByText('▶ Play');
    fireEvent.click(playBtn); // play
    const resetBtn = screen.getByText('⟳ Reset');
    fireEvent.click(resetBtn);
    // After reset, should show Play again
    expect(screen.getByText('▶ Play')).toBeDefined();
  });
});
