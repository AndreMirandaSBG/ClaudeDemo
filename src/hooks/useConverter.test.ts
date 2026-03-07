import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useConverter, PHYSICAL_CONSTANTS, UNIT_CATEGORIES } from './useConverter';

describe('UNIT_CATEGORIES structure', () => {
  it('contains all 8 categories', () => {
    const cats = Object.keys(UNIT_CATEGORIES);
    expect(cats).toContain('length');
    expect(cats).toContain('mass');
    expect(cats).toContain('energy');
    expect(cats).toContain('pressure');
    expect(cats).toContain('temperature');
    expect(cats).toContain('speed');
    expect(cats).toContain('area');
    expect(cats).toContain('volume');
  });

  it('each category has at least 2 units', () => {
    for (const cat of Object.values(UNIT_CATEGORIES)) {
      expect(cat.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('all units have id, name, symbol, toBase, fromBase', () => {
    for (const units of Object.values(UNIT_CATEGORIES)) {
      for (const u of units) {
        expect(typeof u.id).toBe('string');
        expect(typeof u.name).toBe('string');
        expect(typeof u.symbol).toBe('string');
        expect(typeof u.toBase).toBe('function');
        expect(typeof u.fromBase).toBe('function');
      }
    }
  });

  it('length base unit (meter) converts to/from correctly', () => {
    const meter = UNIT_CATEGORIES.length.find(u => u.id === 'meter')!;
    expect(meter.toBase(1)).toBeCloseTo(1);
    expect(meter.fromBase(1)).toBeCloseTo(1);
  });

  it('kilometer toBase converts 1 km to 1000 m', () => {
    const km = UNIT_CATEGORIES.length.find(u => u.id === 'kilometer')!;
    expect(km.toBase(1)).toBeCloseTo(1000);
  });

  it('kilometer fromBase converts 1000 m to 1 km', () => {
    const km = UNIT_CATEGORIES.length.find(u => u.id === 'kilometer')!;
    expect(km.fromBase(1000)).toBeCloseTo(1);
  });

  it('temperature: celsius 0 → kelvin 273.15', () => {
    const c = UNIT_CATEGORIES.temperature.find(u => u.id === 'celsius')!;
    expect(c.toBase(0)).toBeCloseTo(273.15);
  });

  it('temperature: fahrenheit 32 → kelvin 273.15', () => {
    const f = UNIT_CATEGORIES.temperature.find(u => u.id === 'fahrenheit')!;
    expect(f.toBase(32)).toBeCloseTo(273.15, 3);
  });
});

describe('PHYSICAL_CONSTANTS', () => {
  it('contains speed of light', () => {
    expect(PHYSICAL_CONSTANTS.find(c => c.symbol === 'c')).toBeTruthy();
  });

  it('speed of light value is ~3e8', () => {
    const c = PHYSICAL_CONSTANTS.find(c => c.symbol === 'c')!;
    expect(c.value).toBeCloseTo(2.99792458e8, -3);
  });

  it('contains Planck constant', () => {
    expect(PHYSICAL_CONSTANTS.find(c => c.symbol === 'h')).toBeTruthy();
  });

  it('contains Avogadro number', () => {
    expect(PHYSICAL_CONSTANTS.find(c => c.symbol === 'Nₐ')).toBeTruthy();
  });

  it('all constants have positive values', () => {
    expect(PHYSICAL_CONSTANTS.every(c => c.value > 0)).toBe(true);
  });

  it('all constants have a unit string', () => {
    expect(PHYSICAL_CONSTANTS.every(c => typeof c.unit === 'string' && c.unit.length > 0)).toBe(true);
  });

  it('has at least 10 constants', () => {
    expect(PHYSICAL_CONSTANTS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('useConverter hook', () => {
  it('initializes with length category', () => {
    const { result } = renderHook(() => useConverter());
    expect(result.current.category).toBe('length');
    expect(result.current.fromValue).toBe(1);
  });

  it('converts 1000 meters to 1 kilometer', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setFromUnit('meter'));
    act(() => result.current.setToUnit('kilometer'));
    act(() => result.current.setFromValue(1000));
    expect(result.current.toValue).toBeCloseTo(1);
  });

  it('converts 1 kilometer to 1000 meters', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setFromUnit('kilometer'));
    act(() => result.current.setToUnit('meter'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(1000);
  });

  it('converts 1 kg to ~2.20462 pounds', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('mass'));
    act(() => result.current.setFromUnit('kilogram'));
    act(() => result.current.setToUnit('pound'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(2.20462, 3);
  });

  it('converts 100°C to 212°F', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('temperature'));
    act(() => result.current.setFromUnit('celsius'));
    act(() => result.current.setToUnit('fahrenheit'));
    act(() => result.current.setFromValue(100));
    expect(result.current.toValue).toBeCloseTo(212);
  });

  it('converts 0°C to 273.15 K', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('temperature'));
    act(() => result.current.setFromUnit('celsius'));
    act(() => result.current.setToUnit('kelvin'));
    act(() => result.current.setFromValue(0));
    expect(result.current.toValue).toBeCloseTo(273.15);
  });

  it('converts 1 joule to ~0.239 calories', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('energy'));
    act(() => result.current.setFromUnit('joule'));
    act(() => result.current.setToUnit('calorie'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(0.239006, 4);
  });

  it('converts 1 atm to ~101325 Pa', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('pressure'));
    act(() => result.current.setFromUnit('atmosphere'));
    act(() => result.current.setToUnit('pascal'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(101325);
  });

  it('converts 1 m/s to 3.6 km/h', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('speed'));
    act(() => result.current.setFromUnit('ms'));
    act(() => result.current.setToUnit('kmh'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(3.6);
  });

  it('converts 1 hectare to 10000 sq meters', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('area'));
    act(() => result.current.setFromUnit('hectare'));
    act(() => result.current.setToUnit('sq_meter'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(10000);
  });

  it('converts 1 liter to 1000 milliliters', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('volume'));
    act(() => result.current.setFromUnit('liter'));
    act(() => result.current.setToUnit('milliliter'));
    act(() => result.current.setFromValue(1));
    expect(result.current.toValue).toBeCloseTo(1000);
  });

  it('swapUnits reverses from and to', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setFromUnit('meter'));
    act(() => result.current.setToUnit('kilometer'));
    act(() => result.current.swapUnits());
    expect(result.current.fromUnit).toBe('kilometer');
    expect(result.current.toUnit).toBe('meter');
  });

  it('setCategory resets to first two units of new category', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setCategory('mass'));
    const massUnits = UNIT_CATEGORIES['mass'];
    expect(result.current.fromUnit).toBe(massUnits[0].id);
    expect(result.current.toUnit).toBe(massUnits[1].id);
  });

  it('same-to-same unit conversion returns original value', () => {
    const { result } = renderHook(() => useConverter());
    act(() => result.current.setFromUnit('meter'));
    act(() => result.current.setToUnit('meter'));
    act(() => result.current.setFromValue(42));
    expect(result.current.toValue).toBeCloseTo(42);
  });

  it('categoryOrder contains all 8 categories', () => {
    const { result } = renderHook(() => useConverter());
    expect(result.current.categoryOrder).toHaveLength(8);
  });
});
