import { useState, useCallback } from 'react';
import type {
  GeometryMode,
  ConicType,
  Surface3DType,
  GeometryPoint,
  GeometryState,
} from '../types/calculator';

// ─── Conic functions ──────────────────────────────────────────────────────────

export function getConicPoints(
  type: ConicType,
  a: number,
  b: number,
  n = 200,
): GeometryPoint[] {
  const points: GeometryPoint[] = [];

  if (type === 'ellipse') {
    for (let i = 0; i <= n; i++) {
      const t = (2 * Math.PI * i) / n;
      points.push({ x: a * Math.cos(t), y: b * Math.sin(t) });
    }
  } else if (type === 'parabola') {
    const tMin = -3 * a;
    const tMax = 3 * a;
    for (let i = 0; i < n; i++) {
      const t = tMin + ((tMax - tMin) * i) / (n - 1);
      points.push({ x: t, y: (t * t) / (2 * a) });
    }
  } else {
    // hyperbola — upper branch
    for (let i = 0; i < n; i++) {
      const t = (-Math.PI / 3) + ((2 * Math.PI / 3) * i) / (n - 1);
      const cosT = Math.cos(t);
      points.push({ x: a / cosT, y: b * Math.tan(t) });
    }
    // NaN separator
    points.push({ x: NaN, y: NaN });
    // lower branch
    for (let i = 0; i < n; i++) {
      const t = (-Math.PI / 3) + ((2 * Math.PI / 3) * i) / (n - 1);
      const cosT = Math.cos(t);
      points.push({ x: -a / cosT, y: b * Math.tan(t) });
    }
  }

  return points;
}

export function getConicFoci(
  type: ConicType,
  a: number,
  b: number,
): GeometryPoint[] {
  if (type === 'ellipse') {
    const c =
      a > b ? Math.sqrt(a * a - b * b) : Math.sqrt(b * b - a * a);
    if (a > b) {
      return [{ x: -c, y: 0 }, { x: c, y: 0 }];
    }
    return [{ x: 0, y: -c }, { x: 0, y: c }];
  }

  if (type === 'parabola') {
    return [{ x: 0, y: a / 2 }];
  }

  // hyperbola
  const c = Math.sqrt(a * a + b * b);
  return [{ x: -c, y: 0 }, { x: c, y: 0 }];
}

export function conicProperties(
  type: ConicType,
  a: number,
  b: number,
): Record<string, string> {
  if (type === 'ellipse') {
    const maxAB = Math.max(a, b);
    const ecc = Math.sqrt(Math.abs(a * a - b * b)) / maxAB;
    return {
      'Semi-major axis': a.toFixed(2),
      'Semi-minor axis': b.toFixed(2),
      'Eccentricity': ecc.toFixed(4),
      'Area': (Math.PI * a * b).toFixed(4),
    };
  }

  if (type === 'parabola') {
    return {
      'Focal length': (a / 2).toFixed(4),
      'Directrix': `y = ${(-a / 2).toFixed(4)}`,
    };
  }

  // hyperbola
  const c = Math.sqrt(a * a + b * b);
  return {
    a: a.toFixed(2),
    b: b.toFixed(2),
    c: c.toFixed(4),
    'Eccentricity': (c / a).toFixed(4),
  };
}

// ─── Euclidean geometry ───────────────────────────────────────────────────────

export function computeDistances(points: GeometryPoint[]): string[] {
  const result: string[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].x - points[i].x;
      const dy = points[j].y - points[i].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      result.push(`P${i + 1}-P${j + 1}: ${d.toFixed(2)}`);
    }
  }
  return result;
}

export function computeAngles(points: GeometryPoint[]): string[] {
  if (points.length < 3) return [];
  const result: string[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const A = points[i - 1];
    const B = points[i];
    const C = points[i + 1];
    const bax = A.x - B.x;
    const bay = A.y - B.y;
    const bcx = C.x - B.x;
    const bcy = C.y - B.y;
    const dot = bax * bcx + bay * bcy;
    const magBA = Math.sqrt(bax * bax + bay * bay);
    const magBC = Math.sqrt(bcx * bcx + bcy * bcy);
    if (magBA === 0 || magBC === 0) {
      result.push(`Angle at P${i + 1}: undefined`);
    } else {
      const cosTheta = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
      const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;
      result.push(`Angle at P${i + 1}: ${angleDeg.toFixed(2)}°`);
    }
  }
  return result;
}

// ─── 3D surface generation ────────────────────────────────────────────────────

export function getSurface3DPoints(
  type: Surface3DType,
  _rotX: number,
  _rotY: number,
  n = 20,
): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let x: number, y: number, z: number;

      if (type === 'mobius') {
        const u = (2 * Math.PI * i) / (n - 1);
        const v = -0.5 + (1.0 * j) / (n - 1);
        x = (1 + (v / 2) * Math.cos(u / 2)) * Math.cos(u);
        y = (1 + (v / 2) * Math.cos(u / 2)) * Math.sin(u);
        z = (v / 2) * Math.sin(u / 2);
      } else if (type === 'torus') {
        const R = 1.5;
        const r = 0.5;
        const u = (2 * Math.PI * i) / (n - 1);
        const v = (2 * Math.PI * j) / (n - 1);
        x = (R + r * Math.cos(v)) * Math.cos(u);
        y = (R + r * Math.cos(v)) * Math.sin(u);
        z = r * Math.sin(v);
      } else {
        // klein
        const u = (2 * Math.PI * i) / (n - 1);
        const v = (2 * Math.PI * j) / (n - 1);
        const factor = 2 + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
        x = factor * Math.cos(u);
        y = factor * Math.sin(u);
        z = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);
      }

      points.push({ x, y, z });
    }
  }

  return points;
}

export function project3D(
  p: { x: number; y: number; z: number },
  rotX: number,
  rotY: number,
): { px: number; py: number } {
  // Rotate around X axis
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  // y1 is discarded in orthographic projection (not used in final x, z)
  const z1 = p.y * sinX + p.z * cosX;

  // Rotate around Y axis
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const px = p.x * cosY + z1 * sinY;
  const py = -p.x * sinY + z1 * cosY;

  // Orthographic projection: (x', z')
  return { px, py };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const DEFAULT_STATE: GeometryState = {
  mode: 'conics',
  conicType: 'ellipse',
  conicA: 3,
  conicB: 2,
  surface3D: 'torus',
  rotX: 0.4,
  rotY: 0.3,
  points: [],
};

const MAX_POINTS = 10;

export function useGeometry() {
  const [state, setState] = useState<GeometryState>(DEFAULT_STATE);

  const setMode = useCallback((mode: GeometryMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setConicType = useCallback((conicType: ConicType) => {
    setState(prev => ({ ...prev, conicType }));
  }, []);

  const setConicA = useCallback((conicA: number) => {
    setState(prev => ({ ...prev, conicA }));
  }, []);

  const setConicB = useCallback((conicB: number) => {
    setState(prev => ({ ...prev, conicB }));
  }, []);

  const setSurface3D = useCallback((surface3D: Surface3DType) => {
    setState(prev => ({ ...prev, surface3D }));
  }, []);

  const setRotX = useCallback((rotX: number) => {
    setState(prev => ({ ...prev, rotX }));
  }, []);

  const setRotY = useCallback((rotY: number) => {
    setState(prev => ({ ...prev, rotY }));
  }, []);

  const addPoint = useCallback((p: GeometryPoint) => {
    setState(prev => {
      if (prev.points.length >= MAX_POINTS) return prev;
      return { ...prev, points: [...prev.points, p] };
    });
  }, []);

  const clearPoints = useCallback(() => {
    setState(prev => ({ ...prev, points: [] }));
  }, []);

  return {
    state,
    setMode,
    setConicType,
    setConicA,
    setConicB,
    setSurface3D,
    setRotX,
    setRotY,
    addPoint,
    clearPoints,
  };
}
