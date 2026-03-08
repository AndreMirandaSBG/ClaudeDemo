import { useEffect, useRef, useState } from 'react';
import { useGraphTheory } from '../hooks/useGraphTheory';
import type { GTAlgorithm, GTCanvasMode } from '../types/calculator';

const ALGORITHMS: { id: GTAlgorithm; label: string }[] = [
  { id: 'dijkstra', label: 'Dijkstra' },
  { id: 'bellman-ford', label: 'Bellman-Ford' },
  { id: 'bfs', label: 'BFS' },
  { id: 'dfs', label: 'DFS' },
  { id: 'kruskal', label: 'Kruskal MST' },
  { id: 'prim', label: 'Prim MST' },
  { id: 'centrality', label: 'Centrality' },
  { id: 'scc', label: 'SCC (Tarjan)' },
];

const CANVAS_MODES: { id: GTCanvasMode; label: string }[] = [
  { id: 'view', label: 'View' },
  { id: 'addNode', label: '+ Node' },
  { id: 'addEdge', label: '+ Edge' },
  { id: 'selectSource', label: 'Source' },
];

const NODE_R = 20;
const SCC_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

export const GraphTheory = () => {
  const {
    state, setCanvasMode, setAlgorithm, setDirected,
    handleCanvasClick, updateNodePosition, runAlgorithm, stepAlgorithm,
    parseMatrix, setInputMode, resetGraph, exportMetrics,
  } = useGraphTheory();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const [matrixText, setMatrixText] = useState('');

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { nodes, edges, directed, weighted, algorithmResult, sourceNode, selectedNode } = state;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const step = algorithmResult?.animationSteps?.[algorithmResult.currentStep];
    const visitedNodes = new Set(step?.visitedNodes ?? []);
    const activeEdges = new Set(step?.activeEdges ?? []);
    const mstEdges = new Set(algorithmResult?.mstEdges ?? []);
    const sccMap: Record<number, number> = {};
    if (algorithmResult?.sccGroups) {
      algorithmResult.sccGroups.forEach((group, gi) => group.forEach(id => { sccMap[id] = gi; }));
    }
    const centrality = algorithmResult?.centrality;
    const distances = algorithmResult?.distances;

    // Draw edges
    for (const edge of edges) {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) continue;

      ctx.beginPath();
      const isActive = activeEdges.has(edge.id) || mstEdges.has(edge.id);
      ctx.strokeStyle = isActive ? '#f39c12' : '#4a4a6a';
      ctx.lineWidth = isActive ? 3 : 1.5;

      // Arrow for directed
      if (directed) {
        const dx = to.x - from.x; const dy = to.y - from.y;
        const len = Math.hypot(dx, dy);
        const ux = dx / len; const uy = dy / len;
        const sx = from.x + ux * NODE_R; const sy = from.y + uy * NODE_R;
        const ex = to.x - ux * NODE_R; const ey = to.y - uy * NODE_R;
        ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(ey - sy, ex - sx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 10 * Math.cos(angle - 0.4), ey - 10 * Math.sin(angle - 0.4));
        ctx.lineTo(ex - 10 * Math.cos(angle + 0.4), ey - 10 * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = isActive ? '#f39c12' : '#4a4a6a';
        ctx.fill();
      } else {
        ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      }

      // Weight label
      if (weighted) {
        const mx = (from.x + to.x) / 2; const my = (from.y + to.y) / 2;
        ctx.fillStyle = '#aaa'; ctx.font = '11px monospace';
        ctx.fillText(String(edge.weight), mx + 5, my - 5);
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isSource = node.id === sourceNode;
      const isVisited = visitedNodes.has(node.id);
      const isSelected = node.id === selectedNode;
      const sccIdx = sccMap[node.id];
      const centVal = centrality?.[node.id];
      const dist = distances?.[node.id];

      // Node fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI);
      if (sccIdx !== undefined) ctx.fillStyle = SCC_COLORS[sccIdx % SCC_COLORS.length];
      else if (isSelected) ctx.fillStyle = '#f39c12';
      else if (isSource) ctx.fillStyle = '#e74c3c';
      else if (isVisited) ctx.fillStyle = '#2ecc71';
      else if (centVal !== undefined) {
        const t = centVal;
        ctx.fillStyle = `rgb(${Math.round(50 + 200 * t)},${Math.round(80 + 100 * (1 - t))},${Math.round(200 - 150 * t)})`;
      } else ctx.fillStyle = '#2c3e60';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#fff' : '#aaa'; ctx.lineWidth = isSelected ? 2.5 : 1.5; ctx.stroke();

      // Label
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);

      // Distance or centrality sub-label
      if (dist !== undefined && dist !== Infinity) {
        ctx.fillStyle = '#ffd700'; ctx.font = '10px monospace';
        ctx.fillText(`${dist}`, node.x, node.y + NODE_R + 12);
      } else if (centVal !== undefined) {
        ctx.fillStyle = '#ffd700'; ctx.font = '10px monospace';
        ctx.fillText(centVal.toFixed(2), node.x, node.y + NODE_R + 12);
      }
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }, [state]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const hit = state.nodes.find(n => Math.hypot(n.x - x, n.y - y) <= NODE_R);
    if (hit && state.canvasMode === 'view') {
      setDragging({ id: hit.id, offsetX: x - hit.x, offsetY: y - hit.y });
    } else {
      handleCanvasClick(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    updateNodePosition(dragging.id, e.clientX - rect.left - dragging.offsetX, e.clientY - rect.top - dragging.offsetY);
  };

  const handleMouseUp = () => setDragging(null);

  const currentStepData = state.algorithmResult?.animationSteps;
  const totalSteps = currentStepData?.length ?? 0;
  const currentStep = state.algorithmResult?.currentStep ?? 0;

  const renderResults = () => {
    const r = state.algorithmResult;
    if (!r) return <p className="gt__hint">Run an algorithm to see results.</p>;

    if (r.type === 'dijkstra' || r.type === 'bellman-ford') {
      return (
        <table className="gt__table">
          <thead><tr><th>Node</th><th>Distance from {state.nodes.find(n => n.id === state.sourceNode)?.label ?? state.sourceNode}</th></tr></thead>
          <tbody>
            {state.nodes.map(n => (
              <tr key={n.id}>
                <td>{n.label}</td>
                <td>{r.distances?.[n.id] === Infinity ? '∞' : r.distances?.[n.id]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (r.type === 'bfs' || r.type === 'dfs') {
      return <p className="gt__result-text">Visit order: {(r.visited ?? []).map(id => state.nodes.find(n => n.id === id)?.label ?? id).join(' → ')}</p>;
    }
    if (r.type === 'kruskal' || r.type === 'prim') {
      const mstW = (r.mstEdges ?? []).reduce((s, id) => s + (state.edges.find(e => e.id === id)?.weight ?? 0), 0);
      return (
        <>
          <p className="gt__result-text">MST edges ({r.mstEdges?.length ?? 0}): {(r.mstEdges ?? []).map(id => { const e = state.edges.find(ed => ed.id === id); return e ? `${state.nodes.find(n => n.id === e.from)?.label}-${state.nodes.find(n => n.id === e.to)?.label}` : ''; }).join(', ')}</p>
          <p className="gt__result-text">Total weight: {mstW}</p>
        </>
      );
    }
    if (r.type === 'centrality') {
      return (
        <table className="gt__table">
          <thead><tr><th>Node</th><th>Degree Centrality</th></tr></thead>
          <tbody>
            {[...state.nodes].sort((a, b) => (r.centrality?.[b.id] ?? 0) - (r.centrality?.[a.id] ?? 0)).map(n => (
              <tr key={n.id}><td>{n.label}</td><td>{r.centrality?.[n.id]?.toFixed(3)}</td></tr>
            ))}
          </tbody>
        </table>
      );
    }
    if (r.type === 'scc') {
      return (
        <>
          <p className="gt__result-text">SCCs found: {r.sccGroups?.length ?? 0}</p>
          {r.sccGroups?.map((grp, i) => (
            <p key={i} className="gt__result-text" style={{ color: SCC_COLORS[i % SCC_COLORS.length] }}>
              SCC {i + 1}: {grp.map(id => state.nodes.find(n => n.id === id)?.label ?? id).join(', ')}
            </p>
          ))}
        </>
      );
    }
    return null;
  };

  return (
    <div className="gt">
      <div className="gt__top">
        {/* Algorithm selection */}
        <div className="gt__controls">
          <div className="gt__row">
            {ALGORITHMS.map(a => (
              <button key={a.id} className={`gt__btn ${state.algorithm === a.id ? 'gt__btn--active' : ''}`}
                onClick={() => setAlgorithm(a.id)}>{a.label}</button>
            ))}
          </div>
          <div className="gt__row">
            {CANVAS_MODES.map(m => (
              <button key={m.id} className={`gt__btn ${state.canvasMode === m.id ? 'gt__btn--active' : ''}`}
                onClick={() => setCanvasMode(m.id)}>{m.label}</button>
            ))}
            <label className="gt__label">
              <input type="checkbox" checked={state.directed} onChange={e => setDirected(e.target.checked)} />
              {' '}Directed
            </label>
            <button className="gt__btn" onClick={runAlgorithm}>▶ Run</button>
            <button className="gt__btn" onClick={resetGraph}>Reset</button>
            {(state.algorithmResult?.distances || state.algorithmResult?.centrality) &&
              <button className="gt__btn" onClick={exportMetrics}>Export CSV</button>}
          </div>
          {totalSteps > 1 && (
            <div className="gt__row">
              <button className="gt__btn" onClick={() => stepAlgorithm(-1)} disabled={currentStep === 0}>◀ Prev</button>
              <span className="gt__step-label">Step {currentStep + 1}/{totalSteps}</span>
              <button className="gt__btn" onClick={() => stepAlgorithm(1)} disabled={currentStep === totalSteps - 1}>Next ▶</button>
            </div>
          )}
          <div className="gt__row">
            <button className={`gt__btn ${state.inputMode === 'visual' ? 'gt__btn--active' : ''}`}
              onClick={() => setInputMode('visual')}>Visual</button>
            <button className={`gt__btn ${state.inputMode === 'matrix' ? 'gt__btn--active' : ''}`}
              onClick={() => setInputMode('matrix')}>Matrix Input</button>
          </div>
          {state.inputMode === 'matrix' && (
            <div className="gt__matrix-input">
              <p className="gt__hint">Paste adjacency matrix (rows separated by newlines, values by spaces/commas):</p>
              <textarea
                className="gt__textarea"
                value={matrixText}
                onChange={e => setMatrixText(e.target.value)}
                rows={5}
                placeholder="0 4 0 0 2 0&#10;4 0 5 0 0 11&#10;0 5 0 3 0 2&#10;0 0 3 0 9 13&#10;2 0 0 9 0 6&#10;0 11 2 13 6 0"
              />
              <button className="gt__btn" onClick={() => parseMatrix(matrixText)}>Apply Matrix</button>
            </div>
          )}
        </div>
      </div>

      <div className="gt__main">
        <canvas
          ref={canvasRef}
          className="gt__canvas"
          width={620}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
        <div className="gt__results">
          <h3 className="gt__results-title">Results</h3>
          {renderResults()}
          <div className="gt__legend">
            <span className="gt__legend-dot" style={{ background: '#e74c3c' }} /> Source &nbsp;
            <span className="gt__legend-dot" style={{ background: '#2ecc71' }} /> Visited &nbsp;
            <span className="gt__legend-dot" style={{ background: '#f39c12' }} /> Selected/Active
          </div>
        </div>
      </div>
    </div>
  );
};
