import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GraphTheory } from './GraphTheory';

describe('GraphTheory component', () => {
  it('renders without crashing', () => {
    render(<GraphTheory />);
  });

  it('renders algorithm buttons', () => {
    render(<GraphTheory />);
    expect(screen.getByText('Dijkstra')).toBeDefined();
    expect(screen.getByText('BFS')).toBeDefined();
    expect(screen.getByText('DFS')).toBeDefined();
    expect(screen.getByText('Kruskal MST')).toBeDefined();
    expect(screen.getByText('Prim MST')).toBeDefined();
    expect(screen.getByText('Centrality')).toBeDefined();
    expect(screen.getByText('SCC (Tarjan)')).toBeDefined();
  });

  it('renders canvas mode buttons', () => {
    render(<GraphTheory />);
    expect(screen.getByText('View')).toBeDefined();
    expect(screen.getByText('+ Node')).toBeDefined();
    expect(screen.getByText('+ Edge')).toBeDefined();
    expect(screen.getByText('Source')).toBeDefined();
  });

  it('renders canvas element', () => {
    const { container } = render(<GraphTheory />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('renders run and reset buttons', () => {
    render(<GraphTheory />);
    expect(screen.getByText('▶ Run')).toBeDefined();
    expect(screen.getByText('Reset')).toBeDefined();
  });

  it('clicking Run button shows results panel', () => {
    render(<GraphTheory />);
    const runBtn = screen.getByText('▶ Run');
    fireEvent.click(runBtn);
    // After running Dijkstra, a table should appear
    expect(screen.getByText('Results')).toBeDefined();
  });

  it('clicking BFS algorithm button activates it', () => {
    render(<GraphTheory />);
    const bfsBtn = screen.getByText('BFS');
    fireEvent.click(bfsBtn);
    expect(bfsBtn.className).toContain('active');
  });

  it('clicking DFS algorithm button activates it', () => {
    render(<GraphTheory />);
    const dfsBtn = screen.getByText('DFS');
    fireEvent.click(dfsBtn);
    expect(dfsBtn.className).toContain('active');
  });

  it('clicking Matrix Input shows textarea', () => {
    render(<GraphTheory />);
    const matrixBtn = screen.getByText('Matrix Input');
    fireEvent.click(matrixBtn);
    const textarea = screen.getByRole('textbox', { name: '' });
    expect(textarea).toBeTruthy();
  });

  it('directed checkbox toggles', () => {
    render(<GraphTheory />);
    const checkbox = screen.getByRole('checkbox');
    expect((checkbox as HTMLInputElement).checked).toBe(false);
    fireEvent.click(checkbox);
    expect((checkbox as HTMLInputElement).checked).toBe(true);
  });

  it('running Dijkstra shows distance table', () => {
    render(<GraphTheory />);
    fireEvent.click(screen.getByText('Dijkstra'));
    fireEvent.click(screen.getByText('▶ Run'));
    expect(screen.getByText(/Distance from/i)).toBeDefined();
  });

  it('running BFS shows visit order', () => {
    render(<GraphTheory />);
    fireEvent.click(screen.getByText('BFS'));
    fireEvent.click(screen.getByText('▶ Run'));
    expect(screen.getByText(/Visit order/i)).toBeDefined();
  });

  it('running Kruskal shows MST edges', () => {
    render(<GraphTheory />);
    fireEvent.click(screen.getByText('Kruskal MST'));
    fireEvent.click(screen.getByText('▶ Run'));
    expect(screen.getByText(/MST edges/i)).toBeDefined();
  });

  it('running Centrality shows centrality table', () => {
    render(<GraphTheory />);
    fireEvent.click(screen.getByText('Centrality'));
    fireEvent.click(screen.getByText('▶ Run'));
    expect(screen.getByText(/Degree Centrality/i)).toBeDefined();
  });

  it('running SCC shows SCC count', () => {
    render(<GraphTheory />);
    fireEvent.click(screen.getByText('SCC (Tarjan)'));
    fireEvent.click(screen.getByText('▶ Run'));
    expect(screen.getByText(/SCCs found/i)).toBeDefined();
  });

  it('reset button resets graph', () => {
    render(<GraphTheory />);
    fireEvent.click(screen.getByText('Reset'));
    // Should still render without errors
    expect(screen.getByText('▶ Run')).toBeDefined();
  });
});
