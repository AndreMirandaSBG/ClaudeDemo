import { useState, useCallback } from 'react';
import type {
  GTNode, GTEdge, GTAlgorithm, GTAlgorithmResult,
  GraphTheoryState, GTCanvasMode,
} from '../types/calculator';

// ─── Pure algorithm helpers (exported for testing) ───────────────────────────

function getNeighbors(
  id: number, edges: GTEdge[], directed: boolean,
): { id: number; edgeId: number; weight: number }[] {
  const result: { id: number; edgeId: number; weight: number }[] = [];
  for (const e of edges) {
    if (e.from === id) result.push({ id: e.to, edgeId: e.id, weight: e.weight });
    else if (!directed && e.to === id) result.push({ id: e.from, edgeId: e.id, weight: e.weight });
  }
  return result;
}

export function runDijkstra(
  nodes: GTNode[], edges: GTEdge[], sourceId: number, directed: boolean,
): GTAlgorithmResult {
  const dist: Record<number, number> = {};
  const prev: Record<number, number | null> = {};
  const visited = new Set<number>();
  const animationSteps: { visitedNodes: number[]; activeEdges: number[] }[] = [];

  for (const n of nodes) { dist[n.id] = Infinity; prev[n.id] = null; }
  dist[sourceId] = 0;

  const remaining = nodes.map(n => n.id);
  while (remaining.length > 0) {
    let minId = remaining[0];
    for (const id of remaining) { if (dist[id] < dist[minId]) minId = id; }
    remaining.splice(remaining.indexOf(minId), 1);
    visited.add(minId);
    if (dist[minId] === Infinity) break;

    for (const { id, weight } of getNeighbors(minId, edges, directed)) {
      if (!visited.has(id)) {
        const alt = dist[minId] + weight;
        if (alt < dist[id]) { dist[id] = alt; prev[id] = minId; }
      }
    }
    animationSteps.push({
      visitedNodes: [...visited],
      activeEdges: Object.entries(prev)
        .filter(([, v]) => v !== null)
        .map(([k]) => {
          const nid = parseInt(k); const pid = prev[nid];
          if (pid === null) return -1;
          const e = edges.find(e =>
            (e.from === pid && e.to === nid) || (!directed && e.from === nid && e.to === pid),
          );
          return e ? e.id : -1;
        }).filter(id => id !== -1),
    });
  }
  return {
    type: 'dijkstra', distances: dist, previous: prev,
    visited: [...visited], animationSteps, currentStep: animationSteps.length - 1,
  };
}

export function runBFS(
  nodes: GTNode[], edges: GTEdge[], sourceId: number, directed: boolean,
): GTAlgorithmResult {
  const visited: number[] = [];
  const visitedSet = new Set<number>();
  const queue = [sourceId];
  visitedSet.add(sourceId);
  const animationSteps: { visitedNodes: number[]; activeEdges: number[] }[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.push(current);
    for (const { id } of getNeighbors(current, edges, directed)) {
      if (!visitedSet.has(id)) { visitedSet.add(id); queue.push(id); }
    }
    animationSteps.push({
      visitedNodes: [...visited],
      activeEdges: edges.filter(e => visitedSet.has(e.from) && visitedSet.has(e.to)).map(e => e.id),
    });
  }
  return { type: 'bfs', visited, animationSteps, currentStep: animationSteps.length - 1 };
}

export function runDFS(
  nodes: GTNode[], edges: GTEdge[], sourceId: number, directed: boolean,
): GTAlgorithmResult {
  const visited: number[] = [];
  const visitedSet = new Set<number>();
  const stack = [sourceId];
  const animationSteps: { visitedNodes: number[]; activeEdges: number[] }[] = [];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (visitedSet.has(current)) continue;
    visitedSet.add(current);
    visited.push(current);
    const nbrs = getNeighbors(current, edges, directed).reverse();
    for (const { id } of nbrs) { if (!visitedSet.has(id)) stack.push(id); }
    animationSteps.push({
      visitedNodes: [...visited],
      activeEdges: edges.filter(e => visitedSet.has(e.from) && visitedSet.has(e.to)).map(e => e.id),
    });
  }
  return { type: 'dfs', visited, animationSteps, currentStep: animationSteps.length - 1 };
}

export function runKruskal(nodes: GTNode[], edges: GTEdge[]): GTAlgorithmResult {
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const parent: Record<number, number> = {};
  for (const n of nodes) parent[n.id] = n.id;
  const find = (x: number): number => { if (parent[x] !== x) parent[x] = find(parent[x]); return parent[x]; };
  const union = (x: number, y: number) => { parent[find(x)] = find(y); };

  const mstEdges: number[] = [];
  for (const e of sorted) {
    if (find(e.from) !== find(e.to)) { union(e.from, e.to); mstEdges.push(e.id); }
  }
  return {
    type: 'kruskal', mstEdges, visited: nodes.map(n => n.id),
    animationSteps: [{ visitedNodes: nodes.map(n => n.id), activeEdges: mstEdges }],
    currentStep: 0,
  };
}

export function runPrim(nodes: GTNode[], edges: GTEdge[], sourceId: number): GTAlgorithmResult {
  const inMST = new Set<number>([sourceId]);
  const mstEdges: number[] = [];

  while (inMST.size < nodes.length) {
    const candidates = edges.filter(e =>
      (inMST.has(e.from) && !inMST.has(e.to)) || (inMST.has(e.to) && !inMST.has(e.from)),
    );
    if (candidates.length === 0) break;
    const min = candidates.reduce((m, e) => e.weight < m.weight ? e : m);
    mstEdges.push(min.id);
    inMST.add(inMST.has(min.from) ? min.to : min.from);
  }
  return {
    type: 'prim', mstEdges, visited: [...inMST],
    animationSteps: [{ visitedNodes: [...inMST], activeEdges: mstEdges }],
    currentStep: 0,
  };
}

export function runCentrality(nodes: GTNode[], edges: GTEdge[], directed: boolean): GTAlgorithmResult {
  const degree: Record<number, number> = {};
  for (const n of nodes) degree[n.id] = 0;
  for (const e of edges) {
    degree[e.from] = (degree[e.from] || 0) + 1;
    degree[e.to] = (degree[e.to] || 0) + 1;
    if (directed) degree[e.to] = (degree[e.to] || 0); // already counted
  }
  const maxDeg = nodes.length > 1 ? nodes.length - 1 : 1;
  const centrality: Record<number, number> = {};
  for (const n of nodes) centrality[n.id] = degree[n.id] / maxDeg;
  return {
    type: 'centrality', centrality, visited: nodes.map(n => n.id),
    animationSteps: [{ visitedNodes: nodes.map(n => n.id), activeEdges: edges.map(e => e.id) }],
    currentStep: 0,
  };
}

export function runTarjanSCC(nodes: GTNode[], edges: GTEdge[]): GTAlgorithmResult {
  const index: Record<number, number> = {};
  const lowlink: Record<number, number> = {};
  const onStack: Record<number, boolean> = {};
  const stack: number[] = [];
  const sccs: number[][] = [];
  let counter = 0;

  const successors = (id: number) => edges.filter(e => e.from === id).map(e => e.to);

  const strongconnect = (v: number) => {
    index[v] = lowlink[v] = counter++;
    stack.push(v); onStack[v] = true;
    for (const w of successors(v)) {
      if (index[w] === undefined) {
        strongconnect(w);
        lowlink[v] = Math.min(lowlink[v], lowlink[w]);
      } else if (onStack[w]) {
        lowlink[v] = Math.min(lowlink[v], index[w]);
      }
    }
    if (lowlink[v] === index[v]) {
      const scc: number[] = [];
      let w: number;
      do { w = stack.pop()!; onStack[w] = false; scc.push(w); } while (w !== v);
      sccs.push(scc);
    }
  };

  for (const n of nodes) { if (index[n.id] === undefined) strongconnect(n.id); }
  return {
    type: 'scc', sccGroups: sccs, visited: nodes.map(n => n.id),
    animationSteps: [{ visitedNodes: nodes.map(n => n.id), activeEdges: edges.map(e => e.id) }],
    currentStep: 0,
  };
}

export function parseAdjMatrix(
  text: string, directed: boolean,
): { nodes: GTNode[]; edges: GTEdge[] } {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
  const n = lines.length;
  const nodes: GTNode[] = [];
  const edges: GTEdge[] = [];
  let edgeId = 0;
  const angle = (2 * Math.PI) / Math.max(n, 1);
  for (let i = 0; i < n; i++) {
    nodes.push({
      id: i,
      x: 290 + 200 * Math.cos(i * angle - Math.PI / 2),
      y: 190 + 200 * Math.sin(i * angle - Math.PI / 2),
      label: String.fromCharCode(65 + (i % 26)),
    });
  }
  for (let i = 0; i < n; i++) {
    const row = lines[i].split(/[\s,]+/).map(Number);
    for (let j = 0; j < n; j++) {
      if (row[j] && row[j] !== 0) {
        if (!directed && j < i) continue;
        edges.push({ id: edgeId++, from: i, to: j, weight: row[j] });
      }
    }
  }
  return { nodes, edges };
}

function defaultGraph(): { nodes: GTNode[]; edges: GTEdge[] } {
  return {
    nodes: [
      { id: 0, x: 150, y: 150, label: 'A' }, { id: 1, x: 350, y: 80, label: 'B' },
      { id: 2, x: 500, y: 180, label: 'C' }, { id: 3, x: 420, y: 320, label: 'D' },
      { id: 4, x: 200, y: 330, label: 'E' }, { id: 5, x: 330, y: 210, label: 'F' },
    ],
    edges: [
      { id: 0, from: 0, to: 1, weight: 4 }, { id: 1, from: 0, to: 4, weight: 2 },
      { id: 2, from: 1, to: 2, weight: 5 }, { id: 3, from: 1, to: 5, weight: 11 },
      { id: 4, from: 2, to: 3, weight: 3 }, { id: 5, from: 2, to: 5, weight: 2 },
      { id: 6, from: 3, to: 4, weight: 9 }, { id: 7, from: 3, to: 5, weight: 13 },
      { id: 8, from: 4, to: 5, weight: 6 },
    ],
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useGraphTheory = () => {
  const { nodes: initNodes, edges: initEdges } = defaultGraph();
  const [state, setState] = useState<GraphTheoryState>({
    nodes: initNodes, edges: initEdges,
    directed: false, weighted: true,
    algorithm: 'dijkstra', sourceNode: 0,
    algorithmResult: null,
    inputMode: 'visual', adjMatrixText: '',
    canvasMode: 'view', selectedNode: null,
  });

  const setCanvasMode = useCallback((canvasMode: GTCanvasMode) => {
    setState(s => ({ ...s, canvasMode, selectedNode: null }));
  }, []);

  const setAlgorithm = useCallback((algorithm: GTAlgorithm) => {
    setState(s => ({ ...s, algorithm, algorithmResult: null }));
  }, []);

  const setSourceNode = useCallback((id: number) => {
    setState(s => ({ ...s, sourceNode: id }));
  }, []);

  const setDirected = useCallback((directed: boolean) => {
    setState(s => ({ ...s, directed, algorithmResult: null }));
  }, []);

  const addNode = useCallback((x: number, y: number) => {
    setState(s => {
      const id = s.nodes.length > 0 ? Math.max(...s.nodes.map(n => n.id)) + 1 : 0;
      const label = String.fromCharCode(65 + (id % 26));
      return { ...s, nodes: [...s.nodes, { id, x, y, label }] };
    });
  }, []);

  const addEdge = useCallback((from: number, to: number, weight = 1) => {
    setState(s => {
      if (s.edges.some(e => e.from === from && e.to === to)) return s;
      const id = s.edges.length > 0 ? Math.max(...s.edges.map(e => e.id)) + 1 : 0;
      return { ...s, edges: [...s.edges, { id, from, to, weight }], selectedNode: null };
    });
  }, []);

  const removeNode = useCallback((id: number) => {
    setState(s => ({
      ...s,
      nodes: s.nodes.filter(n => n.id !== id),
      edges: s.edges.filter(e => e.from !== id && e.to !== id),
      selectedNode: null,
    }));
  }, []);

  const removeEdge = useCallback((id: number) => {
    setState(s => ({ ...s, edges: s.edges.filter(e => e.id !== id) }));
  }, []);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    setState(s => {
      const NODE_RADIUS = 20;
      const hitNode = s.nodes.find(n => Math.hypot(n.x - x, n.y - y) <= NODE_RADIUS);

      if (s.canvasMode === 'addNode') {
        if (!hitNode) {
          const id = s.nodes.length > 0 ? Math.max(...s.nodes.map(n => n.id)) + 1 : 0;
          const label = String.fromCharCode(65 + (id % 26));
          return { ...s, nodes: [...s.nodes, { id, x, y, label }] };
        }
        return s;
      }

      if (s.canvasMode === 'addEdge') {
        if (hitNode) {
          if (s.selectedNode === null) return { ...s, selectedNode: hitNode.id };
          if (s.selectedNode !== hitNode.id) {
            const from = s.selectedNode; const to = hitNode.id;
            if (s.edges.some(e => e.from === from && e.to === to)) return { ...s, selectedNode: null };
            const id = s.edges.length > 0 ? Math.max(...s.edges.map(e => e.id)) + 1 : 0;
            return { ...s, edges: [...s.edges, { id, from, to, weight: 1 }], selectedNode: null };
          }
          return { ...s, selectedNode: null };
        }
        return { ...s, selectedNode: null };
      }

      if (s.canvasMode === 'selectSource') {
        if (hitNode) return { ...s, sourceNode: hitNode.id, selectedNode: hitNode.id };
        return s;
      }

      return s;
    });
  }, []);

  const updateNodePosition = useCallback((id: number, x: number, y: number) => {
    setState(s => ({ ...s, nodes: s.nodes.map(n => n.id === id ? { ...n, x, y } : n) }));
  }, []);

  const runAlgorithm = useCallback(() => {
    setState(s => {
      let result: GTAlgorithmResult | null = null;
      switch (s.algorithm) {
        case 'dijkstra': case 'bellman-ford':
          result = runDijkstra(s.nodes, s.edges, s.sourceNode, s.directed); break;
        case 'bfs': result = runBFS(s.nodes, s.edges, s.sourceNode, s.directed); break;
        case 'dfs': result = runDFS(s.nodes, s.edges, s.sourceNode, s.directed); break;
        case 'kruskal': result = runKruskal(s.nodes, s.edges); break;
        case 'prim': result = runPrim(s.nodes, s.edges, s.sourceNode); break;
        case 'centrality': result = runCentrality(s.nodes, s.edges, s.directed); break;
        case 'scc': result = runTarjanSCC(s.nodes, s.edges); break;
      }
      return { ...s, algorithmResult: result };
    });
  }, []);

  const stepAlgorithm = useCallback((delta: number) => {
    setState(s => {
      if (!s.algorithmResult?.animationSteps) return s;
      const steps = s.algorithmResult.animationSteps;
      const newStep = Math.max(0, Math.min(steps.length - 1, s.algorithmResult.currentStep + delta));
      return { ...s, algorithmResult: { ...s.algorithmResult, currentStep: newStep } };
    });
  }, []);

  const parseMatrix = useCallback((text: string) => {
    setState(s => {
      const { nodes, edges } = parseAdjMatrix(text, s.directed);
      return { ...s, nodes, edges, adjMatrixText: text, algorithmResult: null };
    });
  }, []);

  const setInputMode = useCallback((inputMode: 'visual' | 'matrix') => {
    setState(s => ({ ...s, inputMode }));
  }, []);

  const resetGraph = useCallback(() => {
    const { nodes, edges } = defaultGraph();
    setState(s => ({ ...s, nodes, edges, algorithmResult: null, selectedNode: null }));
  }, []);

  const exportMetrics = useCallback(() => {
    setState(s => {
      const result = s.algorithmResult;
      if (!result) return s;
      let csv = 'Node,Value\n';
      if (result.distances) {
        for (const [id, dist] of Object.entries(result.distances)) {
          const node = s.nodes.find(n => n.id === parseInt(id));
          csv += `${node?.label ?? id},${dist === Infinity ? 'Inf' : dist}\n`;
        }
      } else if (result.centrality) {
        for (const [id, val] of Object.entries(result.centrality)) {
          const node = s.nodes.find(n => n.id === parseInt(id));
          csv += `${node?.label ?? id},${val.toFixed(4)}\n`;
        }
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'graph-metrics.csv'; a.click();
      URL.revokeObjectURL(url);
      return s;
    });
  }, []);

  return {
    state,
    setCanvasMode, setAlgorithm, setSourceNode, setDirected,
    addNode, addEdge, removeNode, removeEdge,
    handleCanvasClick, updateNodePosition,
    runAlgorithm, stepAlgorithm,
    parseMatrix, setInputMode,
    resetGraph, exportMetrics,
  };
};
