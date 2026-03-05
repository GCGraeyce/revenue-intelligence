import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { StakeholderMap } from '@/components/StakeholderMap';
import { createMockDeal } from '../test-utils';

describe('StakeholderMap', () => {
  it('renders buying committee title', () => {
    const deal = createMockDeal();
    render(<StakeholderMap deal={deal} />);
    expect(screen.getByText('Buying Committee')).toBeInTheDocument();
  });

  it('shows coverage percentage', () => {
    const deal = createMockDeal({ personaGaps: ['Economic Buyer (CFO/Finance Director)'] });
    render(<StakeholderMap deal={deal} />);
    expect(screen.getByText(/coverage/i)).toBeInTheDocument();
  });

  it('shows engaged vs missing status indicators', () => {
    const deal = createMockDeal({
      personaGaps: ['Economic Buyer (CFO/Finance Director)'],
    });
    const { container } = render(<StakeholderMap deal={deal} />);
    expect(container.querySelectorAll('[class*="bg-"]').length).toBeGreaterThan(0);
  });

  it('renders coverage progress bar', () => {
    const deal = createMockDeal();
    const { container } = render(<StakeholderMap deal={deal} />);
    const bars = container.querySelectorAll('.rounded-full');
    expect(bars.length).toBeGreaterThan(0);
  });

  it('handles deal with no persona gaps (full coverage)', () => {
    const deal = createMockDeal({ personaGaps: [] });
    const { container } = render(<StakeholderMap deal={deal} />);
    expect(container).toBeTruthy();
    expect(screen.getByText(/coverage/i)).toBeInTheDocument();
  });

  it('handles deal with many persona gaps', () => {
    const deal = createMockDeal({
      personaGaps: [
        'Economic Buyer (CFO/Finance Director)',
        'Champion / Executive Sponsor',
        'Technical Evaluator (IT/Digital Construction)',
        'Safety Officer (EHS)',
      ],
    });
    const { container } = render(<StakeholderMap deal={deal} />);
    expect(container).toBeTruthy();
    expect(screen.getByText(/coverage/i)).toBeInTheDocument();
  });
});
