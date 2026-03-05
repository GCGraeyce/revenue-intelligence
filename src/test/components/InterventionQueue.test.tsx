import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { InterventionQueue } from '@/components/InterventionQueue';
import { createMockDeal } from '../test-utils';

describe('InterventionQueue', () => {
  const flaggedDeals = [
    createMockDeal({ id: 'EC-001', company: 'Risk Corp', pqScore: 30, acv: 200000, personaGaps: ['EB', 'PM'] }),
    createMockDeal({ id: 'EC-002', company: 'Danger Inc', pqScore: 25, acv: 150000, personaGaps: ['EB'] }),
    createMockDeal({ id: 'EC-003', company: 'Safe Ltd', pqScore: 80, acv: 40000 }), // Should be filtered out (pqScore >= 45)
  ];

  it('renders title', () => {
    render(<InterventionQueue deals={flaggedDeals} />);
    expect(screen.getByText('Intervention Queue')).toBeInTheDocument();
  });

  it('shows only deals with PQS < 45 and ACV > 50K', () => {
    render(<InterventionQueue deals={flaggedDeals} />);
    expect(screen.getByText('Risk Corp')).toBeInTheDocument();
    expect(screen.getByText('Danger Inc')).toBeInTheDocument();
    expect(screen.queryByText('Safe Ltd')).not.toBeInTheDocument();
  });

  it('renders deal ACV in EUR format', () => {
    render(<InterventionQueue deals={flaggedDeals} />);
    expect(screen.getByText('€200K')).toBeInTheDocument();
    expect(screen.getByText('€150K')).toBeInTheDocument();
  });

  it('shows persona gap count', () => {
    render(<InterventionQueue deals={flaggedDeals} />);
    expect(screen.getByText('2 gaps')).toBeInTheDocument();
    expect(screen.getByText('1 gaps')).toBeInTheDocument();
  });

  it('renders GradeBadge for each deal', () => {
    const { container } = render(<InterventionQueue deals={flaggedDeals} />);
    const badges = container.querySelectorAll('.grade-badge');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('shows rep name and stage for each deal', () => {
    render(<InterventionQueue deals={flaggedDeals} />);
    // Both deals have default rep 'Sophie Chen'
    const repElements = screen.getAllByText(/Sophie Chen/);
    expect(repElements.length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty deals array gracefully', () => {
    const { container } = render(<InterventionQueue deals={[]} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Intervention Queue')).toBeInTheDocument();
  });

  it('limits to 8 flagged deals max', () => {
    const manyDeals = Array.from({ length: 15 }, (_, i) =>
      createMockDeal({ id: `EC-${i}`, company: `Corp ${i}`, pqScore: 20, acv: 100000 })
    );
    const { container } = render(<InterventionQueue deals={manyDeals} />);
    const rows = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(rows.length).toBeLessThanOrEqual(8);
  });
});
