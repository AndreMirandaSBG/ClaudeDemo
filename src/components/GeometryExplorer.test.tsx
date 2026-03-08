import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GeometryExplorer } from './GeometryExplorer';

describe('GeometryExplorer', () => {
  it('renders canvas', () => {
    render(<GeometryExplorer />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows mode buttons', () => {
    render(<GeometryExplorer />);
    expect(screen.getByText('Euclidean')).toBeInTheDocument();
    expect(screen.getByText('Conics')).toBeInTheDocument();
    expect(screen.getByText('Surfaces')).toBeInTheDocument();
  });

  it('Conics mode is active by default', () => {
    render(<GeometryExplorer />);
    const btn = screen.getByText('Conics');
    expect(btn.className).toContain('active');
  });

  it('shows conic type buttons in conics mode', () => {
    render(<GeometryExplorer />);
    expect(screen.getByText('Ellipse')).toBeInTheDocument();
    expect(screen.getByText('Parabola')).toBeInTheDocument();
    expect(screen.getByText('Hyperbola')).toBeInTheDocument();
  });

  it('Ellipse is active by default', () => {
    render(<GeometryExplorer />);
    const btn = screen.getByText('Ellipse');
    expect(btn.className).toContain('active');
  });

  it('shows conic a slider', () => {
    render(<GeometryExplorer />);
    expect(screen.getByLabelText('conic a')).toBeInTheDocument();
  });

  it('shows conic b slider for ellipse', () => {
    render(<GeometryExplorer />);
    expect(screen.getByLabelText('conic b')).toBeInTheDocument();
  });

  it('shows conic properties', () => {
    render(<GeometryExplorer />);
    expect(document.querySelector('.geometry-explorer__props')).toBeInTheDocument();
  });

  it('switching to Parabola hides b slider', () => {
    render(<GeometryExplorer />);
    fireEvent.click(screen.getByText('Parabola'));
    expect(screen.queryByLabelText('conic b')).toBeNull();
  });

  it('switching to Surfaces shows surface type buttons', () => {
    render(<GeometryExplorer />);
    fireEvent.click(screen.getByText('Surfaces'));
    expect(screen.getByText('Möbius')).toBeInTheDocument();
    expect(screen.getByText('Torus')).toBeInTheDocument();
    expect(screen.getByText('Klein')).toBeInTheDocument();
  });

  it('switching to Surfaces shows rotation sliders', () => {
    render(<GeometryExplorer />);
    fireEvent.click(screen.getByText('Surfaces'));
    expect(screen.getByLabelText('rotation x')).toBeInTheDocument();
  });

  it('switching to Euclidean shows Clear Points button', () => {
    render(<GeometryExplorer />);
    fireEvent.click(screen.getByText('Euclidean'));
    expect(screen.getByLabelText('Clear points')).toBeInTheDocument();
  });

  it('clicking canvas in Euclidean mode adds a point metric', () => {
    render(<GeometryExplorer />);
    fireEvent.click(screen.getByText('Euclidean'));
    const canvas = screen.getByLabelText('geometry visualization');
    fireEvent.click(canvas);
    expect(document.querySelector('.geometry-explorer__metrics')).toBeInTheDocument();
  });

  it('Torus is active by default in surfaces mode', () => {
    render(<GeometryExplorer />);
    fireEvent.click(screen.getByText('Surfaces'));
    const btn = screen.getByText('Torus');
    expect(btn.className).toContain('active');
  });
});
