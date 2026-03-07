import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UnitConverter } from './UnitConverter';

describe('UnitConverter component', () => {
  it('renders all 8 category buttons', () => {
    render(<UnitConverter />);
    // Use CSS class selector to avoid matching constant card buttons
    const catBtns = document.querySelectorAll('.converter__cat-btn');
    expect(catBtns).toHaveLength(8);
    const labels = Array.from(catBtns).map(b => b.textContent);
    expect(labels).toContain('Length');
    expect(labels).toContain('Mass');
    expect(labels).toContain('Energy');
    expect(labels).toContain('Pressure');
    expect(labels).toContain('Temp');
    expect(labels).toContain('Speed');
    expect(labels).toContain('Area');
    expect(labels).toContain('Volume');
  });

  it('renders from and to unit selects', () => {
    render(<UnitConverter />);
    expect(screen.getByLabelText(/from unit/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to unit/i)).toBeInTheDocument();
  });

  it('renders from value and converted value inputs', () => {
    render(<UnitConverter />);
    expect(screen.getByLabelText(/from value/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/converted value/i)).toBeInTheDocument();
  });

  it('renders the canvas for ratio chart', () => {
    render(<UnitConverter />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows Physical Constants section', () => {
    render(<UnitConverter />);
    expect(screen.getByText(/physical constants/i)).toBeInTheDocument();
  });

  it('shows speed of light constant', () => {
    render(<UnitConverter />);
    expect(screen.getByText(/speed of light/i)).toBeInTheDocument();
  });

  it('shows Planck constant', () => {
    render(<UnitConverter />);
    expect(screen.getByText(/planck constant/i)).toBeInTheDocument();
  });

  it('shows Avogadro number', () => {
    render(<UnitConverter />);
    expect(screen.getByText(/avogadro/i)).toBeInTheDocument();
  });

  it('has a swap button', () => {
    render(<UnitConverter />);
    expect(screen.getByRole('button', { name: /swap/i })).toBeInTheDocument();
  });

  it('swap button click does not throw', () => {
    render(<UnitConverter />);
    fireEvent.click(screen.getByRole('button', { name: /swap/i }));
  });

  it('clicking a category button switches category', () => {
    render(<UnitConverter />);
    const massCatBtn = Array.from(document.querySelectorAll('.converter__cat-btn'))
      .find(el => el.textContent === 'Mass')!;
    fireEvent.click(massCatBtn);
    const fromSelect = screen.getByLabelText(/from unit/i);
    expect((fromSelect as HTMLSelectElement).options.length).toBeGreaterThan(0);
  });

  it('changing from value updates the input', () => {
    render(<UnitConverter />);
    const fromInput = screen.getByLabelText(/from value/i);
    fireEvent.change(fromInput, { target: { value: '1000' } });
    expect(fromInput).toHaveValue(1000);
  });

  it('converted value input is read-only', () => {
    render(<UnitConverter />);
    const toInput = screen.getByLabelText(/converted value/i);
    expect(toInput).toHaveAttribute('readonly');
  });

  it('clicking a physical constant sets the from value', () => {
    render(<UnitConverter />);
    const speedOfLight = screen.getByText(/speed of light/i).closest('button');
    expect(speedOfLight).not.toBeNull();
    fireEvent.click(speedOfLight!);
    const fromInput = screen.getByLabelText(/from value/i) as HTMLInputElement;
    expect(parseFloat(fromInput.value)).toBeGreaterThan(1e8);
  });

  it('switching to temperature category shows Celsius option', () => {
    render(<UnitConverter />);
    fireEvent.click(screen.getByRole('button', { name: /temp/i }));
    const fromSelect = screen.getByLabelText(/from unit/i) as HTMLSelectElement;
    const options = Array.from(fromSelect.options).map(o => o.text);
    expect(options.some(o => o.toLowerCase().includes('celsius'))).toBe(true);
  });

  it('switching categories does not crash', () => {
    render(<UnitConverter />);
    // Click all category buttons directly by class
    const catBtns = document.querySelectorAll('.converter__cat-btn');
    catBtns.forEach(btn => fireEvent.click(btn));
  });

  it('displays the unit ratio hint', () => {
    render(<UnitConverter />);
    // Should show "1 m = ... km" or similar
    expect(screen.getByText(/1\s/)).toBeInTheDocument();
  });
});
