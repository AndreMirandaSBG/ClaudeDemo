import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MatrixWorkspace } from './MatrixWorkspace';

describe('MatrixWorkspace component', () => {
  it('renders without crashing', () => {
    render(<MatrixWorkspace />);
    expect(screen.getByRole('button', { name: /compute matrix operation/i })).toBeInTheDocument();
  });

  it('shows 2x2 and 3x3 size buttons', () => {
    render(<MatrixWorkspace />);
    expect(screen.getByRole('button', { name: /2×2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /3×3/i })).toBeInTheDocument();
  });

  it('2x2 is active by default', () => {
    render(<MatrixWorkspace />);
    const btn = screen.getByRole('button', { name: /2×2/i });
    expect(btn.className).toContain('active');
  });

  it('renders matrix A editor', () => {
    render(<MatrixWorkspace />);
    expect(screen.getByLabelText('matrix A')).toBeInTheDocument();
  });

  it('matrix A cells are editable', () => {
    render(<MatrixWorkspace />);
    const cell = screen.getByLabelText('A[1][1]');
    expect(cell).toBeInTheDocument();
    fireEvent.change(cell, { target: { value: '5' } });
    expect(cell).toHaveValue(5);
  });

  it('shows operation buttons', () => {
    render(<MatrixWorkspace />);
    expect(screen.getByRole('button', { name: /det\(A\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inverse|A⁻¹/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /multiply|A × B/i })).toBeInTheDocument();
  });

  it('det(A) is active by default', () => {
    render(<MatrixWorkspace />);
    const detBtn = screen.getByRole('button', { name: /det\(A\)/i });
    expect(detBtn.className).toContain('active');
  });

  it('compute produces a result', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /compute matrix operation/i }));
    expect(document.querySelector('.matrix-workspace__result')).toBeInTheDocument();
  });

  it('determinant result shows scalar', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /compute matrix operation/i }));
    expect(document.querySelector('.matrix-workspace__scalar')).toBeInTheDocument();
  });

  it('switching to multiply shows matrix B editor', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /multiply|A × B/i }));
    expect(screen.getByLabelText('matrix B')).toBeInTheDocument();
  });

  it('multiply result shows result matrix', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /multiply|A × B/i }));
    fireEvent.click(screen.getByRole('button', { name: /compute matrix operation/i }));
    expect(document.querySelector('.matrix-workspace__result-matrix')).toBeInTheDocument();
  });

  it('LU operation shows L and U labels', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /^LU$/i }));
    fireEvent.click(screen.getByRole('button', { name: /compute matrix operation/i }));
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('switching to 3x3 updates matrix size', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /3×3/i }));
    expect(screen.getAllByLabelText(/A\[/i)).toHaveLength(9);
  });

  it('switching to eigen op shows Eigen button as active', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /eigen/i }));
    const eigenBtn = screen.getByRole('button', { name: /eigen/i });
    expect(eigenBtn.className).toContain('active');
  });

  it('compute eigen for 2x2 shows eigenvalues', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /eigen/i }));
    fireEvent.click(screen.getByRole('button', { name: /compute matrix operation/i }));
    expect(document.querySelector('.matrix-workspace__eigenvalues')).toBeInTheDocument();
  });

  it('transform op shows animation t slider', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /transform/i }));
    expect(screen.getByLabelText('animation t')).toBeInTheDocument();
  });

  it('transform op shows canvas', () => {
    render(<MatrixWorkspace />);
    fireEvent.click(screen.getByRole('button', { name: /transform/i }));
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });
});
