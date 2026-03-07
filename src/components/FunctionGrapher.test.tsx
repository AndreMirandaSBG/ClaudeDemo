import { render, screen, fireEvent } from '@testing-library/react';
import { FunctionGrapher } from './FunctionGrapher';

describe('FunctionGrapher', () => {
  it('renders the canvas', () => {
    render(<FunctionGrapher />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('renders an expression input', () => {
    render(<FunctionGrapher />);
    expect(screen.getByPlaceholderText(/f1\(x\)/)).toBeInTheDocument();
  });

  it('renders toolbar buttons', () => {
    render(<FunctionGrapher />);
    expect(screen.getByText('+ Add')).toBeInTheDocument();
    expect(screen.getByText('Roots/Extrema')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Export PNG')).toBeInTheDocument();
  });

  it('adds a function when Add is clicked', () => {
    render(<FunctionGrapher />);
    fireEvent.click(screen.getByText('+ Add'));
    expect(screen.getByPlaceholderText(/f2\(x\)/)).toBeInTheDocument();
  });

  it('shows remove button when there are multiple functions', () => {
    render(<FunctionGrapher />);
    fireEvent.click(screen.getByText('+ Add'));
    const removeBtns = document.querySelectorAll('.grapher__btn--remove');
    expect(removeBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('updates function expression on input', () => {
    render(<FunctionGrapher />);
    const input = screen.getByPlaceholderText(/f1\(x\)/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'x^2' } });
    expect(input.value).toBe('x^2');
  });

  it('toggles special points button style on click', () => {
    render(<FunctionGrapher />);
    const btn = screen.getByText('Roots/Extrema');
    expect(btn.classList.contains('grapher__btn--active')).toBe(true); // starts active
    fireEvent.click(btn);
    expect(btn.classList.contains('grapher__btn--active')).toBe(false);
  });

  it('renders hint text', () => {
    render(<FunctionGrapher />);
    expect(screen.getByText(/Scroll to zoom/)).toBeInTheDocument();
  });
});
