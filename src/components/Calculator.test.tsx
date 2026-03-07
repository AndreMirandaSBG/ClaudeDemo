import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calculator } from './Calculator';

const click = (label: string) => userEvent.click(screen.getByRole('button', { name: label }));
const display = () => within(screen.getByTestId('display'));

describe('Calculator', () => {
  it('renders with 0 on the display', () => {
    render(<Calculator />);
    expect(display().getByText('0')).toBeInTheDocument();
  });

  it('shows digit after clicking a number button', async () => {
    render(<Calculator />);
    await click('7');
    expect(display().getByText('7')).toBeInTheDocument();
  });

  it('computes addition', async () => {
    render(<Calculator />);
    await click('3');
    await click('+');
    await click('4');
    await click('=');
    expect(display().getByText('7')).toBeInTheDocument();
  });

  it('computes multiplication', async () => {
    render(<Calculator />);
    await click('6');
    await click('×');
    await click('7');
    await click('=');
    expect(display().getByText('42')).toBeInTheDocument();
  });

  it('clears on AC', async () => {
    render(<Calculator />);
    await click('9');
    await click('AC');
    expect(display().getByText('0')).toBeInTheDocument();
  });

  it('shows Error on division by zero', async () => {
    render(<Calculator />);
    await click('5');
    await click('÷');
    await click('0');
    await click('=');
    expect(display().getByText('Error')).toBeInTheDocument();
  });
});
