import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Canvas mock for jsdom (canvas is not implemented in jsdom)
const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  setLineDash: vi.fn(),
  getLineDash: vi.fn().mockReturnValue([]),
  measureText: vi.fn().mockReturnValue({ width: 0 }),
  createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
  createImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(300 * 300 * 4),
    width: 300,
    height: 300,
  }),
  putImageData: vi.fn(),
  canvas: { width: 300, height: 300 },
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: 'start' as CanvasTextAlign,
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');
