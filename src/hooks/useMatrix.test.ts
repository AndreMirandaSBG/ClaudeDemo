import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMatrix, det2, det3, inv2, inv3, matAdd, matMul, luDecompose, qrDecompose, eigen2x2 } from './useMatrix';

describe('det2', () => {
  it('computes determinant of identity as 1', () => {
    expect(det2([[1, 0], [0, 1]])).toBeCloseTo(1);
  });

  it('computes det([[2,1],[1,3]]) = 5', () => {
    expect(det2([[2, 1], [1, 3]])).toBeCloseTo(5);
  });

  it('det of singular matrix is 0', () => {
    expect(det2([[2, 4], [1, 2]])).toBeCloseTo(0);
  });
});

describe('det3', () => {
  it('computes determinant of 3x3 identity as 1', () => {
    expect(det3([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toBeCloseTo(1);
  });

  it('computes a known 3x3 determinant', () => {
    expect(det3([[1, 2, 3], [4, 5, 6], [7, 8, 10]])).toBeCloseTo(-3);
  });
});

describe('inv2', () => {
  it('inverse of identity is identity', () => {
    const I = [[1, 0], [0, 1]];
    const inv = inv2(I);
    expect(inv).not.toBeNull();
    expect(inv![0][0]).toBeCloseTo(1);
    expect(inv![1][1]).toBeCloseTo(1);
    expect(inv![0][1]).toBeCloseTo(0);
  });

  it('A * A^-1 = I', () => {
    const A = [[2, 1], [1, 3]];
    const invA = inv2(A);
    expect(invA).not.toBeNull();
    const product = matMul(A, invA!);
    expect(product[0][0]).toBeCloseTo(1);
    expect(product[0][1]).toBeCloseTo(0);
    expect(product[1][0]).toBeCloseTo(0);
    expect(product[1][1]).toBeCloseTo(1);
  });

  it('returns null for singular matrix', () => {
    expect(inv2([[2, 4], [1, 2]])).toBeNull();
  });
});

describe('inv3', () => {
  it('returns null for singular 3x3', () => {
    expect(inv3([[1, 2, 3], [4, 5, 6], [7, 8, 9]])).toBeNull();
  });

  it('A * A^-1 = I for 3x3', () => {
    const A = [[2, 1, 0], [0, 3, 1], [1, 0, 2]];
    const invA = inv3(A);
    expect(invA).not.toBeNull();
    const product = matMul(A, invA!);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        expect(product[i][j]).toBeCloseTo(i === j ? 1 : 0, 5);
  });
});

describe('matAdd', () => {
  it('adds two 2x2 matrices element-wise', () => {
    const A = [[1, 2], [3, 4]];
    const B = [[5, 6], [7, 8]];
    const C = matAdd(A, B);
    expect(C[0][0]).toBeCloseTo(6);
    expect(C[0][1]).toBeCloseTo(8);
    expect(C[1][0]).toBeCloseTo(10);
    expect(C[1][1]).toBeCloseTo(12);
  });
});

describe('matMul', () => {
  it('I * A = A', () => {
    const I = [[1, 0], [0, 1]];
    const A = [[3, 4], [5, 6]];
    const result = matMul(I, A);
    expect(result[0][0]).toBeCloseTo(3);
    expect(result[1][1]).toBeCloseTo(6);
  });

  it('multiplies two 2x2 matrices', () => {
    const A = [[1, 2], [3, 4]];
    const B = [[5, 6], [7, 8]];
    const C = matMul(A, B);
    expect(C[0][0]).toBeCloseTo(19);
    expect(C[0][1]).toBeCloseTo(22);
    expect(C[1][0]).toBeCloseTo(43);
    expect(C[1][1]).toBeCloseTo(50);
  });
});

describe('luDecompose', () => {
  it('L * U = A for 2x2', () => {
    const A = [[4, 3], [6, 3]];
    const { L, U } = luDecompose(A, 2);
    const product = matMul(L, U);
    expect(product[0][0]).toBeCloseTo(4);
    expect(product[0][1]).toBeCloseTo(3);
    expect(product[1][0]).toBeCloseTo(6);
    expect(product[1][1]).toBeCloseTo(3);
  });

  it('L is lower triangular', () => {
    const A = [[2, 1], [4, 3]];
    const { L } = luDecompose(A, 2);
    expect(L[0][1]).toBeCloseTo(0);
  });

  it('returns steps array', () => {
    const { steps } = luDecompose([[1, 2], [3, 4]], 2);
    expect(steps.length).toBeGreaterThan(0);
  });
});

describe('qrDecompose', () => {
  it('Q * R = A for 2x2', () => {
    const A = [[1, 2], [3, 4]];
    const { Q, R } = qrDecompose(A, 2);
    const product = matMul(Q, R);
    expect(product[0][0]).toBeCloseTo(1, 4);
    expect(product[0][1]).toBeCloseTo(2, 4);
    expect(product[1][0]).toBeCloseTo(3, 4);
    expect(product[1][1]).toBeCloseTo(4, 4);
  });

  it('Q is approximately orthogonal (Q^T * Q = I)', () => {
    const A = [[1, 2], [3, 4]];
    const { Q } = qrDecompose(A, 2);
    const Qt = [[Q[0][0], Q[1][0]], [Q[0][1], Q[1][1]]];
    const I = matMul(Qt, Q);
    expect(I[0][0]).toBeCloseTo(1, 4);
    expect(I[0][1]).toBeCloseTo(0, 4);
    expect(I[1][0]).toBeCloseTo(0, 4);
    expect(I[1][1]).toBeCloseTo(1, 4);
  });
});

describe('eigen2x2', () => {
  it('identity has eigenvalues 1, 1', () => {
    const { eigenvalues } = eigen2x2([[1, 0], [0, 1]]);
    expect(eigenvalues[0].re).toBeCloseTo(1);
    expect(eigenvalues[1].re).toBeCloseTo(1);
  });

  it('diagonal matrix has eigenvalues equal to diagonal', () => {
    const { eigenvalues } = eigen2x2([[3, 0], [0, 5]]);
    const evs = eigenvalues.map(e => e.re).sort((a, b) => a - b);
    expect(evs[0]).toBeCloseTo(3);
    expect(evs[1]).toBeCloseTo(5);
  });

  it('rotation matrix has complex eigenvalues', () => {
    const angle = Math.PI / 4;
    const R = [[Math.cos(angle), -Math.sin(angle)], [Math.sin(angle), Math.cos(angle)]];
    const { eigenvalues } = eigen2x2(R);
    expect(Math.abs(eigenvalues[0].im)).toBeGreaterThan(0);
  });

  it('returns steps array', () => {
    const { steps } = eigen2x2([[2, 1], [1, 3]]);
    expect(steps.length).toBeGreaterThan(2);
  });
});

describe('useMatrix hook', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useMatrix());
    expect(result.current.state.size).toBe(2);
    expect(result.current.state.op).toBe('determinant');
    expect(result.current.state.result).toBeNull();
  });

  it('setOp updates operation', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => result.current.setOp('multiply'));
    expect(result.current.state.op).toBe('multiply');
  });

  it('setSize updates size and expands matrices', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => result.current.setSize(3));
    expect(result.current.state.size).toBe(3);
    expect(result.current.state.matrixA).toHaveLength(3);
  });

  it('setCell updates a matrix cell', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => result.current.setCell('A', 0, 0, 99));
    expect(result.current.state.matrixA[0][0]).toBe(99);
  });

  it('compute determinant produces scalar result', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setCell('A', 0, 0, 2);
      result.current.setCell('A', 0, 1, 1);
      result.current.setCell('A', 1, 0, 1);
      result.current.setCell('A', 1, 1, 3);
      result.current.compute();
    });
    expect(result.current.state.result?.scalar).toBeCloseTo(5);
  });

  it('compute inverse produces matrix result', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setOp('inverse');
      result.current.compute();
    });
    expect(result.current.state.result?.matrix).toBeDefined();
  });

  it('compute multiply produces matrix result', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setOp('multiply');
      result.current.compute();
    });
    expect(result.current.state.result?.matrix).toBeDefined();
  });

  it('compute LU produces L and U', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setOp('lu');
      result.current.compute();
    });
    expect(result.current.state.result?.L).toBeDefined();
    expect(result.current.state.result?.U).toBeDefined();
  });

  it('compute QR produces Q and R', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setOp('qr');
      result.current.compute();
    });
    expect(result.current.state.result?.Q).toBeDefined();
    expect(result.current.state.result?.R).toBeDefined();
  });

  it('compute eigen produces eigenvalues', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setOp('eigen');
      result.current.compute();
    });
    expect(result.current.state.result?.eigenvalues).toBeDefined();
  });

  it('eigen for 3x3 returns error', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => {
      result.current.setSize(3);
      result.current.setOp('eigen');
      result.current.compute();
    });
    expect(result.current.state.result?.error).toBeDefined();
  });

  it('setAnimateT updates animateT', () => {
    const { result } = renderHook(() => useMatrix());
    act(() => result.current.setAnimateT(0.5));
    expect(result.current.state.animateT).toBe(0.5);
  });
});
