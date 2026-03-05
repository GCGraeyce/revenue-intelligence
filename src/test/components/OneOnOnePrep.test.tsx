import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { OneOnOnePrep } from '@/components/OneOnOnePrep';

describe('OneOnOnePrep', () => {
  it('renders 1:1 Meeting Prep header', () => {
    render(<OneOnOnePrep />);
    expect(screen.getByText('1:1 Meeting Prep')).toBeInTheDocument();
  });

  it('shows rep count', () => {
    render(<OneOnOnePrep />);
    expect(screen.getByText(/reps$/)).toBeInTheDocument();
  });

  it('renders priority indicators', () => {
    render(<OneOnOnePrep />);
    // Should show priority labels
    const priorities = screen.getAllByText(/PRIORITY/);
    expect(priorities.length).toBeGreaterThan(0);
  });

  it('shows coaching briefs for reps', () => {
    render(<OneOnOnePrep />);
    // Should render rep names from SALES_MANAGERS teams
    const { container } = render(<OneOnOnePrep />);
    const cards = container.querySelectorAll('.glass-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows attainment percentages', () => {
    render(<OneOnOnePrep />);
    const percentages = screen.getAllByText(/%$/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('renders talking points for each rep', () => {
    render(<OneOnOnePrep />);
    expect(screen.getAllByText('Talking Points').length).toBeGreaterThan(0);
  });

  it('shows deals to discuss section', () => {
    render(<OneOnOnePrep />);
    const dealSections = screen.getAllByText('Deals to Discuss');
    expect(dealSections.length).toBeGreaterThan(0);
  });

  it('renders with managerId filter', () => {
    render(<OneOnOnePrep managerId="mgr-001" />);
    // Should still render without errors
    expect(screen.getByText('1:1 Meeting Prep')).toBeInTheDocument();
  });
});
