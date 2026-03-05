import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../test-utils';
import { CompetitorTracker } from '@/components/CompetitorTracker';

describe('CompetitorTracker', () => {
  it('renders Competitive Intelligence header', () => {
    render(<CompetitorTracker />);
    expect(screen.getByText('Competitive Intelligence')).toBeInTheDocument();
  });

  it('renders competitor names from evercam context', () => {
    render(<CompetitorTracker />);
    const competitors = ['OxBlue', 'EarthCam', 'TrueLook', 'Sensera'];
    let found = 0;
    competitors.forEach(name => {
      if (screen.queryByText(name)) found++;
    });
    expect(found).toBeGreaterThan(0);
  });

  it('shows win rate against competitors', () => {
    render(<CompetitorTracker />);
    const percentages = screen.getAllByText(/%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('shows battlecard content when expanded', () => {
    render(<CompetitorTracker />);
    // Cards start collapsed — click the first competitor card to expand it
    const cards = document.querySelectorAll('.glass-card .cursor-pointer');
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.click(cards[0]);
    // After expanding, battlecard sections should be visible
    expect(screen.getAllByText(/Their Strengths/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Their Weaknesses/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Battlecard/).length).toBeGreaterThan(0);
  });

  it('shows stage distribution when expanded', () => {
    render(<CompetitorTracker />);
    const cards = document.querySelectorAll('.glass-card .cursor-pointer');
    fireEvent.click(cards[0]);
    expect(screen.getAllByText(/Stage Distribution/).length).toBeGreaterThan(0);
  });

  it('renders deal counts per competitor', () => {
    render(<CompetitorTracker />);
    const dealCounts = screen.getAllByText(/deals/i);
    expect(dealCounts.length).toBeGreaterThan(0);
  });
});
