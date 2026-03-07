import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calculator } from './Calculator';

const click = (label: string) => userEvent.click(screen.getByRole('button', { name: label }));
const valueDisplay = () => within(screen.getByTestId('value'));
const expressionDisplay = () => within(screen.getByTestId('expression'));

describe('Calculator', () => {
  it('renders with 0 on the value display', () => {
    render(<Calculator />);
    expect(valueDisplay().getByText('0')).toBeInTheDocument();
  });

  it('shows digit after clicking a number button', async () => {
    render(<Calculator />);
    await click('7');
    expect(valueDisplay().getByText('7')).toBeInTheDocument();
  });

  it('computes addition', async () => {
    render(<Calculator />);
    await click('3');
    await click('+');
    await click('4');
    await click('=');
    expect(valueDisplay().getByText('7')).toBeInTheDocument();
  });

  it('computes multiplication', async () => {
    render(<Calculator />);
    await click('6');
    await click('×');
    await click('7');
    await click('=');
    expect(valueDisplay().getByText('42')).toBeInTheDocument();
  });

  it('clears on C', async () => {
    render(<Calculator />);
    await click('9');
    await click('C');
    expect(valueDisplay().getByText('0')).toBeInTheDocument();
  });

  it('shows Division by zero on division by zero', async () => {
    render(<Calculator />);
    await click('5');
    await click('÷');
    await click('0');
    await click('=');
    expect(valueDisplay().getByText('Division by zero')).toBeInTheDocument();
  });

  it('shows expression in top line', async () => {
    render(<Calculator />);
    await click('3');
    await click('+');
    expect(expressionDisplay().getByText(/3\+/)).toBeInTheDocument();
  });

  it('shows angle mode indicator', () => {
    render(<Calculator />);
    expect(screen.getAllByText('DEG').length).toBeGreaterThan(0);
  });

  it('cycles angle mode on DEG/RAD button click', async () => {
    render(<Calculator />);
    const modeBtn = screen.getByRole('button', { name: 'DEG' });
    await userEvent.click(modeBtn);
    expect(screen.getByRole('button', { name: 'RAD' })).toBeInTheDocument();
  });

  it('toggles 2nd button appearance', async () => {
    render(<Calculator />);
    expect(screen.getByRole('button', { name: 'sin' })).toBeInTheDocument();
    await click('2nd');
    expect(screen.getByRole('button', { name: 'asin' })).toBeInTheDocument();
    await click('2nd');
    expect(screen.getByRole('button', { name: 'sin' })).toBeInTheDocument();
  });

  it('computes sin(0) = 0 in DEG mode', async () => {
    render(<Calculator />);
    await click('sin');
    await click('0');
    await click(')');
    await click('=');
    expect(valueDisplay().getByText('0')).toBeInTheDocument();
  });

  it('shows history panel on history button click', async () => {
    render(<Calculator />);
    await click('📋');
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('backspace removes last digit', async () => {
    render(<Calculator />);
    await click('1');
    await click('2');
    await click('⌫');
    expect(valueDisplay().getByText('1')).toBeInTheDocument();
  });

  it('shows M indicator when memory is non-zero', async () => {
    render(<Calculator />);
    await click('5');
    await click('MS');
    expect(screen.getByText('M')).toBeInTheDocument();
  });
});
