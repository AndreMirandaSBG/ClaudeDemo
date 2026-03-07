import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SurfacePlotter } from './SurfacePlotter';

describe('SurfacePlotter component', () => {
  it('renders with canvas', () => {
    render(<SurfacePlotter />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders expression input for surface mode', () => {
    render(<SurfacePlotter />);
    expect(screen.getByLabelText('expression')).toBeInTheDocument();
  });

  it('default plot type is surface', () => {
    render(<SurfacePlotter />);
    const activeBtn = document.querySelector('.grapher__btn--active');
    expect(activeBtn?.textContent).toContain('Surface');
  });

  it('allows changing the expression', () => {
    render(<SurfacePlotter />);
    const input = screen.getByLabelText('expression');
    fireEvent.change(input, { target: { value: 'x * y' } });
    expect(input).toHaveValue('x * y');
  });

  it('switches to parametric curve mode and shows x(t) input', () => {
    render(<SurfacePlotter />);
    fireEvent.click(screen.getByRole('button', { name: /parametric curve/i }));
    expect(screen.getByLabelText('x(t)')).toBeInTheDocument();
    expect(screen.getByLabelText('y(t)')).toBeInTheDocument();
    expect(screen.getByLabelText('z(t)')).toBeInTheDocument();
  });

  it('switches to parametric surface mode and shows x(u,v) input', () => {
    render(<SurfacePlotter />);
    fireEvent.click(screen.getByRole('button', { name: /parametric surface/i }));
    expect(screen.getByLabelText('x(u,v)')).toBeInTheDocument();
    expect(screen.getByLabelText('y(u,v)')).toBeInTheDocument();
    expect(screen.getByLabelText('z(u,v)')).toBeInTheDocument();
  });

  it('zoom in button is present', () => {
    render(<SurfacePlotter />);
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument();
  });

  it('zoom out button is present', () => {
    render(<SurfacePlotter />);
    expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument();
  });

  it('reset view button is present and clickable', () => {
    render(<SurfacePlotter />);
    const btn = screen.getByRole('button', { name: /reset view/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
  });

  it('export png button is present', () => {
    render(<SurfacePlotter />);
    expect(screen.getByRole('button', { name: /export png/i })).toBeInTheDocument();
  });

  it('clicking zoom in does not throw', () => {
    render(<SurfacePlotter />);
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
  });

  it('clicking zoom out does not throw', () => {
    render(<SurfacePlotter />);
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
  });

  it('shows hint text about drag/scroll', () => {
    render(<SurfacePlotter />);
    expect(screen.getByText(/drag to rotate/i)).toBeInTheDocument();
  });

  it('shows rotation/scale info', () => {
    render(<SurfacePlotter />);
    expect(screen.getByText(/rotX/)).toBeInTheDocument();
    expect(screen.getByText(/rotY/)).toBeInTheDocument();
    expect(screen.getByText(/scale/)).toBeInTheDocument();
  });

  it('switching back to surface mode hides parametric inputs', () => {
    render(<SurfacePlotter />);
    fireEvent.click(screen.getByRole('button', { name: /parametric curve/i }));
    fireEvent.click(screen.getByRole('button', { name: /surface z=f/i }));
    expect(screen.queryByLabelText('x(t)')).not.toBeInTheDocument();
    expect(screen.getByLabelText('expression')).toBeInTheDocument();
  });
});
