import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { ForecastView } from '@/components/ForecastView';

describe('ForecastView', () => {
  it('renders Revenue Forecast header', () => {
    render(<ForecastView />);
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });

  it('renders forecast comparison section', () => {
    render(<ForecastView />);
    expect(screen.getByText('Bottom-Up Forecast')).toBeInTheDocument();
    expect(screen.getByText('Top-Down Target')).toBeInTheDocument();
    expect(screen.getByText('Gap')).toBeInTheDocument();
    expect(screen.getByText('Coverage Ratio')).toBeInTheDocument();
  });

  it('renders all 4 forecast categories', () => {
    render(<ForecastView />);
    expect(screen.getByText('Commit')).toBeInTheDocument();
    expect(screen.getByText('Best Case')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Omit')).toBeInTheDocument();
  });

  it('shows deal counts per category', () => {
    render(<ForecastView />);
    const dealCounts = screen.getAllByText(/deals$/);
    expect(dealCounts.length).toBeGreaterThanOrEqual(4);
  });

  it('displays EUR values', () => {
    render(<ForecastView />);
    const euroValues = screen.getAllByText(/€/);
    expect(euroValues.length).toBeGreaterThan(0);
  });

  it('renders visual comparison bars', () => {
    const { container } = render(<ForecastView />);
    const bars = container.querySelectorAll('.rounded-full');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('renders category description text', () => {
    render(<ForecastView />);
    expect(screen.getByText(/Rep-confident deals/)).toBeInTheDocument();
  });

  it('shows weighted ACV per category', () => {
    render(<ForecastView />);
    const weightedLabels = screen.getAllByText('Weighted');
    expect(weightedLabels.length).toBeGreaterThanOrEqual(4);
  });

  it('shows average PQS per category', () => {
    render(<ForecastView />);
    const pqsLabels = screen.getAllByText('Avg PQS');
    expect(pqsLabels.length).toBeGreaterThanOrEqual(4);
  });

  it('shows average win % per category', () => {
    render(<ForecastView />);
    const winLabels = screen.getAllByText('Avg Win%');
    expect(winLabels.length).toBeGreaterThanOrEqual(4);
  });
});
