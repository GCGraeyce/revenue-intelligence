import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { GradeDistribution } from '@/components/GradeDistribution';

describe('GradeDistribution', () => {
  const distribution = { A: 50, B: 120, C: 200, D: 150, F: 80 };
  const total = 600;

  it('renders title', () => {
    render(<GradeDistribution distribution={distribution} total={total} />);
    expect(screen.getByText('Pipeline Quality Distribution')).toBeInTheDocument();
  });

  it('renders count for each grade', () => {
    render(<GradeDistribution distribution={distribution} total={total} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('renders all 5 grade labels', () => {
    render(<GradeDistribution distribution={distribution} total={total} />);
    ['A', 'B', 'C', 'D', 'F'].forEach(grade => {
      expect(screen.getAllByText(grade).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders bars with correct grade colors', () => {
    const { container } = render(<GradeDistribution distribution={distribution} total={total} />);
    expect(container.querySelector('.bg-grade-a')).toBeInTheDocument();
    expect(container.querySelector('.bg-grade-b')).toBeInTheDocument();
    expect(container.querySelector('.bg-grade-c')).toBeInTheDocument();
    expect(container.querySelector('.bg-grade-d')).toBeInTheDocument();
    expect(container.querySelector('.bg-grade-f')).toBeInTheDocument();
  });

  it('handles zero total gracefully', () => {
    const empty = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const { container } = render(<GradeDistribution distribution={empty} total={0} />);
    expect(container).toBeTruthy();
  });
});
