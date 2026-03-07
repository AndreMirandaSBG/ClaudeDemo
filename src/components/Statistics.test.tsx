import { render, screen, fireEvent } from '@testing-library/react';
import { Statistics } from './Statistics';

describe('Statistics', () => {
  it('renders the data input textarea', () => {
    render(<Statistics />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders chart type buttons', () => {
    render(<Statistics />);
    expect(screen.getByText('Histogram')).toBeInTheDocument();
    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Scatter')).toBeInTheDocument();
    expect(screen.getByText('Box Plot')).toBeInTheDocument();
  });

  it('renders a canvas', () => {
    render(<Statistics />);
    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('shows stats after entering data', () => {
    render(<Statistics />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '1, 2, 3, 4, 5' } });
    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('Mean')).toBeInTheDocument();
    expect(screen.getByText('Median')).toBeInTheDocument();
    expect(screen.getByText('Std Dev')).toBeInTheDocument();
  });

  it('shows correct mean value', () => {
    render(<Statistics />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '2, 4, 6' } });
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
  });

  it('switches chart type on button click', () => {
    render(<Statistics />);
    const barBtn = screen.getByText('Bar');
    fireEvent.click(barBtn);
    expect(barBtn.classList.contains('statistics__btn--active')).toBe(true);
  });

  it('shows regression toggle when scatter is selected', () => {
    render(<Statistics />);
    fireEvent.click(screen.getByText('Scatter'));
    expect(screen.getByText('Regression')).toBeInTheDocument();
  });

  it('clears data on Clear click', () => {
    render(<Statistics />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '1, 2, 3' } });
    fireEvent.click(screen.getByText('Clear'));
    expect(textarea.value).toBe('');
    expect(screen.queryByText('Count')).not.toBeInTheDocument();
  });

  it('shows regression line info when x,y data provided', () => {
    render(<Statistics />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '1,2;2,4;3,6' } });
    expect(screen.getByText(/Linear Regression/)).toBeInTheDocument();
  });
});
