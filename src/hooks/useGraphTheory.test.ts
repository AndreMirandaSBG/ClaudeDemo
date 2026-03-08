import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  useGraphTheory,
  runDijkstra, runBFS, runDFS, runKruskal, runPrim,
  runCentrality, runTarjanSCC, parseAdjMatrix,
} from './useGraphTheory';
import type { GTNode, GTEdge } from '../types/calculator';

const nodes: GTNode[] = [
  { id: 0, x: 0, y: 0, label: 'A' }, { id: 1, x: 1, y: 0, label: 'B' },
  { id: 2, x: 2, y: 0, label: 'C' }, { id: 3, x: 3, y: 0, label: 'D' },
];
const edges: GTEdge[] = [
  { id: 0, from: 0, to: 1, weight: 1 }, { id: 1, from: 1, to: 2, weight: 2 },
  { id: 2, from: 0, to: 3, weight: 10 }, { id: 3, from: 2, to: 3, weight: 1 },
];

describe('runDijkstra', () => {
  it('computes correct distances from source 0', () => {
    const result = runDijkstra(nodes, edges, 0, false);
    expect(result.distances![0]).toBe(0);
    expect(result.distances![1]).toBe(1);
    expect(result.distances![2]).toBe(3);
    expect(result.distances![3]).toBe(4); // 0→1→2→3 = 4, not 0→3 = 10
  });

  it('returns Infinity for unreachable nodes', () => {
    const isolatedEdges: GTEdge[] = [{ id: 0, from: 0, to: 1, weight: 1 }];
    const result = runDijkstra(nodes, isolatedEdges, 0, true);
    expect(result.distances![2]).toBe(Infinity);
    expect(result.distances![3]).toBe(Infinity);
  });

  it('has animationSteps', () => {
    const result = runDijkstra(nodes, edges, 0, false);
    expect(result.animationSteps!.length).toBeGreaterThan(0);
  });
});

describe('runBFS', () => {
  it('visits nodes in BFS order', () => {
    const result = runBFS(nodes, edges, 0, false);
    expect(result.visited![0]).toBe(0);
    expect(result.visited).toContain(1);
    expect(result.visited).toContain(2);
    expect(result.visited).toContain(3);
  });

  it('starts at source node', () => {
    const result = runBFS(nodes, edges, 2, false);
    expect(result.visited![0]).toBe(2);
  });
});

describe('runDFS', () => {
  it('visits all connected nodes', () => {
    const result = runDFS(nodes, edges, 0, false);
    expect(result.visited).toHaveLength(4);
  });

  it('starts at source node', () => {
    const result = runDFS(nodes, edges, 0, false);
    expect(result.visited![0]).toBe(0);
  });
});

describe('runKruskal', () => {
  it('produces MST with n-1 edges', () => {
    const result = runKruskal(nodes, edges);
    expect(result.mstEdges!.length).toBe(nodes.length - 1);
  });

  it('selects minimum weight edges', () => {
    const result = runKruskal(nodes, edges);
    // Edge id:2 (weight 10) should not be in MST since shorter path exists
    expect(result.mstEdges).not.toContain(2);
  });
});

describe('runPrim', () => {
  it('produces MST with n-1 edges', () => {
    const result = runPrim(nodes, edges, 0);
    expect(result.mstEdges!.length).toBe(nodes.length - 1);
  });
});

describe('runCentrality', () => {
  it('assigns centrality values between 0 and 1', () => {
    const result = runCentrality(nodes, edges, false);
    for (const val of Object.values(result.centrality!)) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });
});

describe('runTarjanSCC', () => {
  it('finds SCCs in directed graph', () => {
    const dirEdges: GTEdge[] = [
      { id: 0, from: 0, to: 1, weight: 1 },
      { id: 1, from: 1, to: 0, weight: 1 }, // cycle: 0↔1
      { id: 2, from: 2, to: 3, weight: 1 }, // 2→3 separate
    ];
    const result = runTarjanSCC(nodes, dirEdges);
    expect(result.sccGroups!.length).toBeGreaterThanOrEqual(2);
    // 0 and 1 should be in same SCC
    const scc01 = result.sccGroups!.find(g => g.includes(0) && g.includes(1));
    expect(scc01).toBeDefined();
  });
});

describe('parseAdjMatrix', () => {
  it('parses adjacency matrix text into nodes and edges', () => {
    const text = '0 1 0\n1 0 2\n0 2 0';
    const { nodes: ns, edges: es } = parseAdjMatrix(text, false);
    expect(ns).toHaveLength(3);
    expect(es.length).toBeGreaterThan(0);
  });

  it('creates correct number of nodes', () => {
    const text = '0 1\n1 0';
    const { nodes: ns } = parseAdjMatrix(text, false);
    expect(ns).toHaveLength(2);
  });
});

describe('useGraphTheory hook', () => {
  it('initialises with default graph', () => {
    const { result } = renderHook(() => useGraphTheory());
    expect(result.current.state.nodes.length).toBeGreaterThan(0);
    expect(result.current.state.edges.length).toBeGreaterThan(0);
  });

  it('sets algorithm', () => {
    const { result } = renderHook(() => useGraphTheory());
    act(() => result.current.setAlgorithm('bfs'));
    expect(result.current.state.algorithm).toBe('bfs');
  });

  it('runs algorithm and sets result', () => {
    const { result } = renderHook(() => useGraphTheory());
    act(() => { result.current.setAlgorithm('dijkstra'); result.current.runAlgorithm(); });
    expect(result.current.state.algorithmResult).not.toBeNull();
    expect(result.current.state.algorithmResult?.type).toBe('dijkstra');
  });

  it('adds a node via addNode', () => {
    const { result } = renderHook(() => useGraphTheory());
    const before = result.current.state.nodes.length;
    act(() => result.current.addNode(100, 100));
    expect(result.current.state.nodes.length).toBe(before + 1);
  });

  it('removes a node and its edges', () => {
    const { result } = renderHook(() => useGraphTheory());
    const nodeId = result.current.state.nodes[0].id;
    const edgesBefore = result.current.state.edges.filter(e => e.from === nodeId || e.to === nodeId).length;
    act(() => result.current.removeNode(nodeId));
    expect(result.current.state.nodes.find(n => n.id === nodeId)).toBeUndefined();
    const edgesAfter = result.current.state.edges.filter(e => e.from === nodeId || e.to === nodeId).length;
    expect(edgesAfter).toBe(0);
    expect(edgesBefore).toBeGreaterThan(0); // sanity check
  });

  it('sets directed flag', () => {
    const { result } = renderHook(() => useGraphTheory());
    act(() => result.current.setDirected(true));
    expect(result.current.state.directed).toBe(true);
  });

  it('resets graph to default', () => {
    const { result } = renderHook(() => useGraphTheory());
    act(() => result.current.addNode(999, 999));
    const before = result.current.state.nodes.length;
    act(() => result.current.resetGraph());
    expect(result.current.state.nodes.length).toBeLessThan(before);
  });

  it('steps algorithm animation', () => {
    const { result } = renderHook(() => useGraphTheory());
    act(() => { result.current.setAlgorithm('bfs'); result.current.runAlgorithm(); });
    const initial = result.current.state.algorithmResult?.currentStep ?? 0;
    act(() => result.current.stepAlgorithm(1));
    const after = result.current.state.algorithmResult?.currentStep ?? 0;
    expect(after).toBeGreaterThanOrEqual(initial);
  });

  it('parses adjacency matrix and updates graph', () => {
    const { result } = renderHook(() => useGraphTheory());
    act(() => result.current.parseMatrix('0 1 0\n1 0 1\n0 1 0'));
    expect(result.current.state.nodes).toHaveLength(3);
  });
});
