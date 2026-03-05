import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { RiskClusters } from '@/components/RiskClusters';
import { createMockDeal } from '../test-utils';

describe('RiskClusters', () => {
  const deals = [
    // Single-stakeholder: enterprise + few persona gaps not engaged
    createMockDeal({
      id: 'EC-001', company: 'Enterprise Solo', segment: 'Enterprise',
      personaGaps: ['Economic Buyer (CFO/Finance Director)', 'Champion / Executive Sponsor', 'Safety Officer (EHS)'],
      acv: 300000, pqScore: 35,
    }),
    // Post-proposal stall: proposal stage + 25 days
    createMockDeal({
      id: 'EC-002', company: 'Stalled Corp', stage: 'Proposal',
      daysInStage: 25, acv: 150000, pqScore: 45,
    }),
    // Low ICP: icpScore < 40
    createMockDeal({
      id: 'EC-003', company: 'Low Fit Inc', icpScore: 30,
      source: 'Outbound', acv: 80000, pqScore: 40,
    }),
    // High price risk
    createMockDeal({
      id: 'EC-004', company: 'Discount Seeker', priceRisk: 0.8,
      acv: 120000, pqScore: 50,
    }),
  ];

  it('renders Risk Clusters title', () => {
    render(<RiskClusters deals={deals} />);
    expect(screen.getByText('Risk Clusters')).toBeInTheDocument();
  });

  it('renders business-friendly cluster names', () => {
    render(<RiskClusters deals={deals} />);
    expect(screen.getByText('Single-Stakeholder Enterprise')).toBeInTheDocument();
    expect(screen.getByText('Stalled After Proposal')).toBeInTheDocument();
    expect(screen.getByText('Low-Fit Outbound Prospects')).toBeInTheDocument();
    expect(screen.getByText('Discount Risk Deals')).toBeInTheDocument();
  });

  it('shows deal counts per cluster', () => {
    render(<RiskClusters deals={deals} />);
    // Each cluster should show at least one deal count
    const dealCounts = screen.getAllByText(/deal/);
    expect(dealCounts.length).toBeGreaterThan(0);
  });

  it('displays EUR currency format', () => {
    render(<RiskClusters deals={deals} />);
    // Should show Euro-formatted values
    const euroValues = screen.getAllByText(/€/);
    expect(euroValues.length).toBeGreaterThan(0);
  });

  it('handles empty deals array', () => {
    const { container } = render(<RiskClusters deals={[]} />);
    expect(container).toBeTruthy();
    expect(screen.getByText('Risk Clusters')).toBeInTheDocument();
  });

  it('renders cluster descriptions', () => {
    render(<RiskClusters deals={deals} />);
    // Check for descriptive text
    expect(screen.getByText(/only one buyer contact/i)).toBeInTheDocument();
  });
});
