import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { MetricCard } from '@/components/MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="Pipeline" value="€2.5M" />);
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('€2.5M')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    render(<MetricCard label="PQS Score" value={72} />);
    expect(screen.getByText('72')).toBeInTheDocument();
  });

  it('renders subValue when provided', () => {
    render(<MetricCard label="Total" value="€5M" subValue="250 deals" />);
    expect(screen.getByText('250 deals')).toBeInTheDocument();
  });

  it('does not render subValue when not provided', () => {
    render(<MetricCard label="Total" value="€5M" />);
    const subValues = screen.queryByText('deals');
    expect(subValues).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <MetricCard
        label="Risk"
        value={12}
        icon={<span data-testid="test-icon">icon</span>}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies variant-specific styling', () => {
    const { container } = render(
      <MetricCard label="Risk" value={3} variant="danger" />
    );
    const card = container.querySelector('[class*="border-destructive"]');
    expect(card).toBeInTheDocument();
  });

  it('renders sparkline when sparklineValue is provided', () => {
    const { container } = render(
      <MetricCard label="Pipeline" value="€2M" sparklineValue={2000} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not render sparkline when sparklineValue is 0', () => {
    const { container } = render(
      <MetricCard label="At Risk" value={0} sparklineValue={0} />
    );
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('renders all variants without crashing', () => {
    const variants = ['default', 'primary', 'warning', 'danger', 'success'] as const;
    variants.forEach(variant => {
      const { unmount } = render(
        <MetricCard label={`Test ${variant}`} value={42} variant={variant} />
      );
      expect(screen.getByText(`Test ${variant}`)).toBeInTheDocument();
      unmount();
    });
  });
});
