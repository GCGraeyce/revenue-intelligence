import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { ScoreRadar } from '@/components/ScoreRadar';
import { createMockDeal } from '../test-utils';

describe('ScoreRadar', () => {
  it('renders PQS score header', () => {
    const deal = createMockDeal({ pqScore: 72 });
    render(<ScoreRadar deal={deal} />);
    expect(screen.getByText('PQS 72')).toBeInTheDocument();
    expect(screen.getByText('PQS Dimension Breakdown')).toBeInTheDocument();
  });

  it('renders all 7 scoring dimensions', () => {
    const deal = createMockDeal();
    render(<ScoreRadar deal={deal} />);
    expect(screen.getByText('Outcome Probability')).toBeInTheDocument();
    expect(screen.getByText('ICP Fit')).toBeInTheDocument();
    expect(screen.getByText('Persona Coverage')).toBeInTheDocument();
    expect(screen.getByText('Process Adherence')).toBeInTheDocument();
    expect(screen.getByText('Engagement Velocity')).toBeInTheDocument();
    expect(screen.getByText('Price Risk (Inverted)')).toBeInTheDocument();
    expect(screen.getByText('Stage Progression')).toBeInTheDocument();
  });

  it('shows weight percentages for each dimension', () => {
    const deal = createMockDeal();
    render(<ScoreRadar deal={deal} />);
    expect(screen.getByText('30%w')).toBeInTheDocument();
    expect(screen.getByText('20%w')).toBeInTheDocument();
  });

  it('renders progress bars for each dimension', () => {
    const deal = createMockDeal();
    const { container } = render(<ScoreRadar deal={deal} />);
    const progressBars = container.querySelectorAll('.rounded-full');
    // Each dimension has a container bar + fill bar
    expect(progressBars.length).toBeGreaterThanOrEqual(7);
  });

  it('shows weakest dimension callout when dimension is below 50', () => {
    const deal = createMockDeal({
      personaGaps: ['A', 'B', 'C', 'D'], // Force persona score to 0
      probabilities: { win: 0.1, loss: 0.4, noDecision: 0.3, slip: 0.2 },
    });
    render(<ScoreRadar deal={deal} />);
    expect(screen.getByText(/Weakest Dimension/)).toBeInTheDocument();
  });

  it('does not show weakest callout when all dimensions are healthy', () => {
    const deal = createMockDeal({
      pqScore: 90,
      probabilities: { win: 0.9, loss: 0.05, noDecision: 0.03, slip: 0.02 },
      icpScore: 95,
      personaGaps: [],
      missingSteps: [],
      priceRisk: 0.1,
      daysInStage: 5,
      activities: { calls: 10, emails: 20, meetings: 8, lastActivityDate: '2026-02-25', lastActivityType: 'Meeting' },
    });
    render(<ScoreRadar deal={deal} />);
    expect(screen.queryByText(/Weakest Dimension/)).not.toBeInTheDocument();
  });
});
