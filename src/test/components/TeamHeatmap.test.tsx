import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { TeamHeatmap } from '@/components/TeamHeatmap';

describe('TeamHeatmap', () => {
  it('renders the heatmap title', () => {
    render(<TeamHeatmap />);
    expect(screen.getByText(/Heatmap/)).toBeInTheDocument();
  });

  it('renders all pipeline stage column headers', () => {
    render(<TeamHeatmap />);
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('Qualification')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
  });

  it('renders "Total" column header', () => {
    render(<TeamHeatmap />);
    // Total may appear multiple times (header + footer row), use getAllByText
    const totals = screen.getAllByText('Total');
    expect(totals.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Rep" label in header', () => {
    render(<TeamHeatmap />);
    expect(screen.getByText('Rep')).toBeInTheDocument();
  });

  it('renders a table structure', () => {
    const { container } = render(<TeamHeatmap />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  it('renders rep names from demo data', () => {
    render(<TeamHeatmap />);
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders color-coded cells', () => {
    const { container } = render(<TeamHeatmap />);
    const coloredCells = container.querySelectorAll('[class*="bg-"]');
    expect(coloredCells.length).toBeGreaterThan(0);
  });
});
