import { describe, it, expect } from 'vitest';
import { render } from '../test-utils';
import { TrendSparkline, generateTrendData } from '@/components/TrendSparkline';

describe('TrendSparkline', () => {
  it('renders SVG element with correct dimensions', () => {
    const { container } = render(
      <TrendSparkline data={[10, 20, 30, 40, 50]} width={100} height={30} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('width')).toBe('100');
    expect(svg?.getAttribute('height')).toBe('30');
  });

  it('renders polyline for data points', () => {
    const { container } = render(
      <TrendSparkline data={[10, 20, 30, 40]} />
    );
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeInTheDocument();
  });

  it('renders end dot by default', () => {
    const { container } = render(
      <TrendSparkline data={[10, 20, 30]} />
    );
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
  });

  it('hides end dot when showEndDot is false', () => {
    const { container } = render(
      <TrendSparkline data={[10, 20, 30]} showEndDot={false} />
    );
    const circle = container.querySelector('circle');
    expect(circle).not.toBeInTheDocument();
  });

  it('returns null for fewer than 2 data points', () => {
    const { container } = render(<TrendSparkline data={[10]} />);
    // Component returns null but wrapper div from providers still exists
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('uses default dimensions when not specified', () => {
    const { container } = render(<TrendSparkline data={[1, 2, 3]} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('60');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('applies color via stroke attribute', () => {
    const { container } = render(
      <TrendSparkline data={[10, 20, 30]} color="grade-a" />
    );
    const polyline = container.querySelector('polyline');
    expect(polyline?.getAttribute('stroke')).toContain('hsl(var(--grade-a))');
  });
});

describe('generateTrendData', () => {
  it('returns array of correct length', () => {
    const data = generateTrendData(50, 8);
    expect(data).toHaveLength(8);
  });

  it('ends with (approximately) the current value', () => {
    const data = generateTrendData(100, 6);
    // Last value should be the current value (no perturbation)
    expect(data[data.length - 1]).toBe(100);
  });

  it('all values are non-negative', () => {
    const data = generateTrendData(10, 12, 0.3);
    data.forEach(val => expect(val).toBeGreaterThanOrEqual(0));
  });

  it('respects custom weeks parameter', () => {
    expect(generateTrendData(50, 4)).toHaveLength(4);
    expect(generateTrendData(50, 12)).toHaveLength(12);
  });

  it('returns integers (rounded values)', () => {
    const data = generateTrendData(42, 8);
    data.forEach(val => expect(Number.isInteger(val)).toBe(true));
  });
});
