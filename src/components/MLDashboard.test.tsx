import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MLDashboard } from './MLDashboard';

describe('MLDashboard', () => {
  it('renders canvas', () => {
    render(<MLDashboard />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows mode buttons', () => {
    render(<MLDashboard />);
    expect(screen.getByText('Regression')).toBeInTheDocument();
    expect(screen.getByText('K-Means')).toBeInTheDocument();
    expect(screen.getByText('Classification')).toBeInTheDocument();
  });

  it('Regression mode is active by default', () => {
    render(<MLDashboard />);
    const btn = screen.getByText('Regression');
    expect(btn.className).toContain('active');
  });

  it('shows Generate Data button', () => {
    render(<MLDashboard />);
    expect(screen.getByLabelText('Generate data')).toBeInTheDocument();
  });

  it('shows regression type buttons', () => {
    render(<MLDashboard />);
    expect(screen.getByText('Linear')).toBeInTheDocument();
    expect(screen.getByText('Polynomial')).toBeInTheDocument();
    expect(screen.getByText('Exponential')).toBeInTheDocument();
  });

  it('Linear regression is active by default', () => {
    render(<MLDashboard />);
    const btn = screen.getByText('Linear');
    expect(btn.className).toContain('active');
  });

  it('shows results panel', () => {
    render(<MLDashboard />);
    expect(document.querySelector('.ml-dashboard__results')).toBeInTheDocument();
  });

  it('shows polynomial degree input when Polynomial is selected', () => {
    render(<MLDashboard />);
    fireEvent.click(screen.getByText('Polynomial'));
    expect(screen.getByLabelText('polynomial degree')).toBeInTheDocument();
  });

  it('switching to K-Means shows k clusters input', () => {
    render(<MLDashboard />);
    fireEvent.click(screen.getByText('K-Means'));
    expect(screen.getByLabelText('k clusters')).toBeInTheDocument();
  });

  it('switching to Classification shows results panel', () => {
    render(<MLDashboard />);
    fireEvent.click(screen.getByText('Classification'));
    expect(document.querySelector('.ml-dashboard__results')).toBeInTheDocument();
  });

  it('clicking Generate Data populates results', () => {
    render(<MLDashboard />);
    fireEvent.click(screen.getByLabelText('Generate data'));
    expect(document.querySelector('.ml-dashboard__results')).toBeInTheDocument();
  });

  it('K-Means button has correct label', () => {
    render(<MLDashboard />);
    expect(screen.getByText('K-Means')).toBeInTheDocument();
  });

  it('Exponential regression button is present', () => {
    render(<MLDashboard />);
    expect(screen.getByText('Exponential')).toBeInTheDocument();
  });

  it('switching modes changes active button', () => {
    render(<MLDashboard />);
    fireEvent.click(screen.getByText('K-Means'));
    const btn = screen.getByText('K-Means');
    expect(btn.className).toContain('active');
  });

  it('results panel shows model info after generating data', () => {
    render(<MLDashboard />);
    fireEvent.click(screen.getByLabelText('Generate data'));
    const panel = document.querySelector('.ml-dashboard__results');
    expect(panel).toBeInTheDocument();
    expect(panel!.textContent).not.toBe('');
  });
});
