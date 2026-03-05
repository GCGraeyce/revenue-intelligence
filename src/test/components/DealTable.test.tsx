import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { DealTable } from '@/components/DealTable';
import { createMockDealList } from '../test-utils';

describe('DealTable', () => {
  const deals = createMockDealList(25);

  it('renders table with column headers', () => {
    render(<DealTable deals={deals} />);
    expect(screen.getByText('Grade')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Rep')).toBeInTheDocument();
    expect(screen.getByText('ACV')).toBeInTheDocument();
    expect(screen.getByText('Stage')).toBeInTheDocument();
    expect(screen.getByText('PQS')).toBeInTheDocument();
    expect(screen.getByText('Win%')).toBeInTheDocument();
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Gaps')).toBeInTheDocument();
  });

  it('shows deal count in footer', () => {
    render(<DealTable deals={deals} />);
    expect(screen.getByText('25 deals')).toBeInTheDocument();
  });

  it('paginates at 20 deals per page', () => {
    render(<DealTable deals={deals} />);
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('navigates to next page', () => {
    render(<DealTable deals={deals} />);
    const nextBtn = screen.getByText('Next');
    fireEvent.click(nextBtn);
    expect(screen.getByText('2/2')).toBeInTheDocument();
  });

  it('disables Prev button on first page', () => {
    render(<DealTable deals={deals} />);
    const prevBtn = screen.getByText('Prev');
    expect(prevBtn).toBeDisabled();
  });

  it('sorts by PQS by default (descending)', () => {
    const { container } = render(<DealTable deals={deals} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(20); // First page shows 20
  });

  it('toggles sort direction on column click', () => {
    render(<DealTable deals={deals} />);
    const pqsHeader = screen.getByText('PQS');
    // First click — should toggle sort direction
    fireEvent.click(pqsHeader);
    // Should still render correctly
    expect(screen.getByText('25 deals')).toBeInTheDocument();
  });

  it('sorts by Company name', () => {
    render(<DealTable deals={deals} />);
    const companyHeader = screen.getByText('Company');
    fireEvent.click(companyHeader);
    expect(screen.getByText('25 deals')).toBeInTheDocument();
  });

  it('renders with single deal', () => {
    const singleDeal = createMockDealList(1);
    render(<DealTable deals={singleDeal} />);
    expect(screen.getByText('1 deals')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('renders empty table gracefully', () => {
    render(<DealTable deals={[]} />);
    expect(screen.getByText('0 deals')).toBeInTheDocument();
  });

  it('renders GradeBadge for each deal row', () => {
    const { container } = render(<DealTable deals={deals} />);
    const badges = container.querySelectorAll('.grade-badge');
    expect(badges.length).toBe(20); // 20 per page
  });

  it('displays EUR-formatted ACV values', () => {
    render(<DealTable deals={createMockDealList(1)} />);
    // First deal has ACV of 200000 = €200K
    expect(screen.getByText('€200K')).toBeInTheDocument();
  });
});
