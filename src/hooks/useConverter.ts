import { useState, useCallback, useMemo } from 'react';
import type { UnitCategory, PhysicalConstant } from '../types/calculator';

// ─── Unit definitions ─────────────────────────────────────────────────────────

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export const UNIT_CATEGORIES: Record<UnitCategory, UnitDef[]> = {
  length: [
    { id: 'meter',        name: 'Meter',          symbol: 'm',   toBase: v => v,          fromBase: v => v },
    { id: 'kilometer',    name: 'Kilometer',       symbol: 'km',  toBase: v => v * 1e3,    fromBase: v => v * 1e-3 },
    { id: 'centimeter',   name: 'Centimeter',      symbol: 'cm',  toBase: v => v * 1e-2,   fromBase: v => v * 1e2 },
    { id: 'millimeter',   name: 'Millimeter',      symbol: 'mm',  toBase: v => v * 1e-3,   fromBase: v => v * 1e3 },
    { id: 'micrometer',   name: 'Micrometer',      symbol: 'μm',  toBase: v => v * 1e-6,   fromBase: v => v * 1e6 },
    { id: 'nanometer',    name: 'Nanometer',       symbol: 'nm',  toBase: v => v * 1e-9,   fromBase: v => v * 1e9 },
    { id: 'mile',         name: 'Mile',            symbol: 'mi',  toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
    { id: 'yard',         name: 'Yard',            symbol: 'yd',  toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
    { id: 'foot',         name: 'Foot',            symbol: 'ft',  toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
    { id: 'inch',         name: 'Inch',            symbol: 'in',  toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
    { id: 'nautical_mile', name: 'Nautical Mile',  symbol: 'nmi', toBase: v => v * 1852,   fromBase: v => v / 1852 },
    { id: 'angstrom',     name: 'Ångström',        symbol: 'Å',   toBase: v => v * 1e-10,  fromBase: v => v * 1e10 },
  ],
  mass: [
    { id: 'kilogram',  name: 'Kilogram',  symbol: 'kg',  toBase: v => v,          fromBase: v => v },
    { id: 'gram',      name: 'Gram',      symbol: 'g',   toBase: v => v * 1e-3,   fromBase: v => v * 1e3 },
    { id: 'milligram', name: 'Milligram', symbol: 'mg',  toBase: v => v * 1e-6,   fromBase: v => v * 1e6 },
    { id: 'microgram', name: 'Microgram', symbol: 'μg',  toBase: v => v * 1e-9,   fromBase: v => v * 1e9 },
    { id: 'tonne',     name: 'Metric Ton',symbol: 't',   toBase: v => v * 1e3,    fromBase: v => v * 1e-3 },
    { id: 'pound',     name: 'Pound',     symbol: 'lb',  toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
    { id: 'ounce',     name: 'Ounce',     symbol: 'oz',  toBase: v => v * 0.028350, fromBase: v => v / 0.028350 },
    { id: 'stone',     name: 'Stone',     symbol: 'st',  toBase: v => v * 6.35029, fromBase: v => v / 6.35029 },
  ],
  energy: [
    { id: 'joule',       name: 'Joule',         symbol: 'J',    toBase: v => v,           fromBase: v => v },
    { id: 'kilojoule',   name: 'Kilojoule',     symbol: 'kJ',   toBase: v => v * 1e3,     fromBase: v => v * 1e-3 },
    { id: 'megajoule',   name: 'Megajoule',     symbol: 'MJ',   toBase: v => v * 1e6,     fromBase: v => v * 1e-6 },
    { id: 'calorie',     name: 'Calorie',       symbol: 'cal',  toBase: v => v * 4.184,   fromBase: v => v / 4.184 },
    { id: 'kilocalorie', name: 'Kilocalorie',   symbol: 'kcal', toBase: v => v * 4184,    fromBase: v => v / 4184 },
    { id: 'watt_hour',   name: 'Watt-hour',     symbol: 'Wh',   toBase: v => v * 3600,    fromBase: v => v / 3600 },
    { id: 'kwh',         name: 'Kilowatt-hour', symbol: 'kWh',  toBase: v => v * 3.6e6,   fromBase: v => v / 3.6e6 },
    { id: 'electronvolt',name: 'Electronvolt',  symbol: 'eV',   toBase: v => v * 1.602176634e-19, fromBase: v => v / 1.602176634e-19 },
    { id: 'btu',         name: 'BTU',           symbol: 'BTU',  toBase: v => v * 1055.06, fromBase: v => v / 1055.06 },
  ],
  pressure: [
    { id: 'pascal',     name: 'Pascal',      symbol: 'Pa',   toBase: v => v,         fromBase: v => v },
    { id: 'kilopascal', name: 'Kilopascal',  symbol: 'kPa',  toBase: v => v * 1e3,   fromBase: v => v * 1e-3 },
    { id: 'megapascal', name: 'Megapascal',  symbol: 'MPa',  toBase: v => v * 1e6,   fromBase: v => v * 1e-6 },
    { id: 'bar',        name: 'Bar',         symbol: 'bar',  toBase: v => v * 1e5,   fromBase: v => v * 1e-5 },
    { id: 'millibar',   name: 'Millibar',    symbol: 'mbar', toBase: v => v * 100,   fromBase: v => v / 100 },
    { id: 'atmosphere', name: 'Atmosphere',  symbol: 'atm',  toBase: v => v * 101325, fromBase: v => v / 101325 },
    { id: 'psi',        name: 'PSI',         symbol: 'psi',  toBase: v => v * 6894.76, fromBase: v => v / 6894.76 },
    { id: 'torr',       name: 'Torr',        symbol: 'Torr', toBase: v => v * 133.322, fromBase: v => v / 133.322 },
    { id: 'mmhg',       name: 'mmHg',        symbol: 'mmHg', toBase: v => v * 133.322, fromBase: v => v / 133.322 },
  ],
  temperature: [
    { id: 'kelvin',     name: 'Kelvin',     symbol: 'K',  toBase: v => v,                   fromBase: v => v },
    { id: 'celsius',    name: 'Celsius',    symbol: '°C', toBase: v => v + 273.15,           fromBase: v => v - 273.15 },
    { id: 'fahrenheit', name: 'Fahrenheit', symbol: '°F', toBase: v => (v + 459.67) * 5 / 9, fromBase: v => v * 9 / 5 - 459.67 },
    { id: 'rankine',    name: 'Rankine',    symbol: '°R', toBase: v => v * 5 / 9,            fromBase: v => v * 9 / 5 },
  ],
  speed: [
    { id: 'ms',   name: 'Meter/second',  symbol: 'm/s',  toBase: v => v,              fromBase: v => v },
    { id: 'kmh',  name: 'Kilometer/hour',symbol: 'km/h', toBase: v => v / 3.6,        fromBase: v => v * 3.6 },
    { id: 'mph',  name: 'Mile/hour',     symbol: 'mph',  toBase: v => v * 0.44704,    fromBase: v => v / 0.44704 },
    { id: 'knot', name: 'Knot',          symbol: 'kn',   toBase: v => v * 0.514444,   fromBase: v => v / 0.514444 },
    { id: 'fts',  name: 'Foot/second',   symbol: 'ft/s', toBase: v => v * 0.3048,     fromBase: v => v / 0.3048 },
    { id: 'mach', name: 'Mach (sea lvl)',symbol: 'Ma',   toBase: v => v * 340.29,     fromBase: v => v / 340.29 },
  ],
  area: [
    { id: 'sq_meter',  name: 'Sq. Meter',    symbol: 'm²',  toBase: v => v,         fromBase: v => v },
    { id: 'sq_km',     name: 'Sq. Kilometer',symbol: 'km²', toBase: v => v * 1e6,   fromBase: v => v * 1e-6 },
    { id: 'sq_cm',     name: 'Sq. Centimeter',symbol:'cm²', toBase: v => v * 1e-4,  fromBase: v => v * 1e4 },
    { id: 'sq_mm',     name: 'Sq. Millimeter',symbol:'mm²', toBase: v => v * 1e-6,  fromBase: v => v * 1e6 },
    { id: 'hectare',   name: 'Hectare',      symbol: 'ha',  toBase: v => v * 1e4,   fromBase: v => v * 1e-4 },
    { id: 'acre',      name: 'Acre',         symbol: 'ac',  toBase: v => v * 4046.856, fromBase: v => v / 4046.856 },
    { id: 'sq_foot',   name: 'Sq. Foot',     symbol: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
    { id: 'sq_inch',   name: 'Sq. Inch',     symbol: 'in²', toBase: v => v * 6.4516e-4, fromBase: v => v / 6.4516e-4 },
    { id: 'sq_mile',   name: 'Sq. Mile',     symbol: 'mi²', toBase: v => v * 2.58999e6, fromBase: v => v / 2.58999e6 },
  ],
  volume: [
    { id: 'cubic_meter', name: 'Cubic Meter', symbol: 'm³',  toBase: v => v,         fromBase: v => v },
    { id: 'liter',       name: 'Liter',       symbol: 'L',   toBase: v => v * 1e-3,  fromBase: v => v * 1e3 },
    { id: 'milliliter',  name: 'Milliliter',  symbol: 'mL',  toBase: v => v * 1e-6,  fromBase: v => v * 1e6 },
    { id: 'cubic_cm',    name: 'Cubic Centimeter', symbol: 'cm³', toBase: v => v * 1e-6, fromBase: v => v * 1e6 },
    { id: 'gallon_us',   name: 'Gallon (US)', symbol: 'gal', toBase: v => v * 3.78541e-3, fromBase: v => v / 3.78541e-3 },
    { id: 'gallon_uk',   name: 'Gallon (UK)', symbol: 'gal(UK)', toBase: v => v * 4.54609e-3, fromBase: v => v / 4.54609e-3 },
    { id: 'fluid_oz',    name: 'Fluid Ounce (US)', symbol: 'fl oz', toBase: v => v * 2.95735e-5, fromBase: v => v / 2.95735e-5 },
    { id: 'cup',         name: 'Cup (US)',     symbol: 'cup', toBase: v => v * 2.36588e-4, fromBase: v => v / 2.36588e-4 },
    { id: 'cubic_foot',  name: 'Cubic Foot',  symbol: 'ft³', toBase: v => v * 0.028317, fromBase: v => v / 0.028317 },
    { id: 'cubic_inch',  name: 'Cubic Inch',  symbol: 'in³', toBase: v => v * 1.63871e-5, fromBase: v => v / 1.63871e-5 },
  ],
};

// ─── Physical constants ───────────────────────────────────────────────────────

export const PHYSICAL_CONSTANTS: PhysicalConstant[] = [
  { name: 'Speed of light',         symbol: 'c',   value: 2.99792458e8,   unit: 'm/s' },
  { name: 'Planck constant',        symbol: 'h',   value: 6.62607015e-34, unit: 'J·s' },
  { name: 'Reduced Planck (ℏ)',     symbol: 'ℏ',   value: 1.054571817e-34,unit: 'J·s' },
  { name: 'Avogadro number',        symbol: 'Nₐ',  value: 6.02214076e23,  unit: 'mol⁻¹' },
  { name: 'Boltzmann constant',     symbol: 'k_B', value: 1.380649e-23,   unit: 'J/K' },
  { name: 'Gravitational constant', symbol: 'G',   value: 6.67430e-11,    unit: 'N·m²/kg²' },
  { name: 'Elementary charge',      symbol: 'e',   value: 1.602176634e-19,unit: 'C' },
  { name: 'Electron mass',          symbol: 'mₑ',  value: 9.1093837015e-31,unit: 'kg' },
  { name: 'Proton mass',            symbol: 'mₚ',  value: 1.67262192369e-27, unit: 'kg' },
  { name: 'Neutron mass',           symbol: 'mₙ',  value: 1.67492749804e-27, unit: 'kg' },
  { name: 'Fine-structure constant',symbol: 'α',   value: 7.2973525693e-3, unit: '(dimensionless)' },
  { name: 'Rydberg constant',       symbol: 'R∞',  value: 1.0973731568160e7, unit: 'm⁻¹' },
  { name: 'Stefan-Boltzmann',       symbol: 'σ',   value: 5.670374419e-8,  unit: 'W/(m²·K⁴)' },
  { name: 'Gas constant',           symbol: 'R',   value: 8.314462618,     unit: 'J/(mol·K)' },
  { name: 'Vacuum permittivity',    symbol: 'ε₀',  value: 8.8541878128e-12, unit: 'F/m' },
  { name: 'Vacuum permeability',    symbol: 'μ₀',  value: 1.25663706212e-6, unit: 'N/A²' },
];

// ─── Hook ─────────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: UnitCategory[] = ['length', 'mass', 'energy', 'pressure', 'temperature', 'speed', 'area', 'volume'];

interface ConverterState {
  category: UnitCategory;
  fromUnit: string;
  toUnit: string;
  fromValue: number;
}

function defaultUnits(cat: UnitCategory): { fromUnit: string; toUnit: string } {
  const units = UNIT_CATEGORIES[cat];
  return { fromUnit: units[0].id, toUnit: units[1]?.id ?? units[0].id };
}

function convert(fromId: string, toId: string, cat: UnitCategory, value: number): number {
  const units = UNIT_CATEGORIES[cat];
  const fromDef = units.find(u => u.id === fromId);
  const toDef = units.find(u => u.id === toId);
  if (!fromDef || !toDef) return NaN;
  return toDef.fromBase(fromDef.toBase(value));
}

export function useConverter() {
  const [state, setState] = useState<ConverterState>(() => {
    const cat: UnitCategory = 'length';
    return { category: cat, fromValue: 1, ...defaultUnits(cat) };
  });

  const setCategory = useCallback((category: UnitCategory) => {
    setState(() => ({ category, fromValue: 1, ...defaultUnits(category) }));
  }, []);

  const setFromUnit = useCallback((fromUnit: string) => setState(s => ({ ...s, fromUnit })), []);
  const setToUnit = useCallback((toUnit: string) => setState(s => ({ ...s, toUnit })), []);
  const setFromValue = useCallback((fromValue: number) => setState(s => ({ ...s, fromValue })), []);

  const swapUnits = useCallback(() => {
    setState(s => ({
      ...s,
      fromUnit: s.toUnit,
      toUnit: s.fromUnit,
      fromValue: convert(s.fromUnit, s.toUnit, s.category, s.fromValue),
    }));
  }, []);

  const toValue = useMemo(
    () => convert(state.fromUnit, state.toUnit, state.category, state.fromValue),
    [state],
  );

  return {
    ...state,
    toValue,
    setCategory,
    setFromUnit,
    setToUnit,
    setFromValue,
    swapUnits,
    categoryOrder: CATEGORY_ORDER,
    units: UNIT_CATEGORIES[state.category],
  };
}
