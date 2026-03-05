import { describe, it, expect } from 'vitest';
import { render, screen } from '../test-utils';
import { PipelineVelocity } from '@/components/PipelineVelocity';

describe('PipelineVelocity', () => {
  it('renders Pipeline Velocity header', () => {
    render(<PipelineVelocity />);
    expect(screen.getByText('Pipeline Velocity')).toBeInTheDocument();
  });

  it('renders all 4 velocity KPIs', () => {
    render(<PipelineVelocity />);
    expect(screen.getByText('Velocity Score')).toBeInTheDocument();
    expect(screen.getByText('Avg Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('Created This Week')).toBeInTheDocument();
    expect(screen.getByText('Advanced This Week')).toBeInTheDocument();
  });

  it('renders all 4 stage cards', () => {
    render(<PipelineVelocity />);
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('Qualification')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
  });

  it('shows deal metrics per stage', () => {
    render(<PipelineVelocity />);
    const avgDaysLabels = screen.getAllByText('Avg days');
    expect(avgDaysLabels.length).toBe(4);
    const avgPQSLabels = screen.getAllByText('Avg PQS');
    expect(avgPQSLabels.length).toBe(4);
  });

  it('shows stalled deal counts per stage', () => {
    render(<PipelineVelocity />);
    const stalledLabels = screen.getAllByText('Stalled');
    expect(stalledLabels.length).toBe(4);
  });

  it('renders sparklines on KPI cards', () => {
    const { container } = render(<PipelineVelocity />);
    const svgs = container.querySelectorAll('svg');
    // Should have at least 4 sparkline SVGs for the KPI cards
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it('renders conversion rate per stage', () => {
    render(<PipelineVelocity />);
    const conversionLabels = screen.getAllByText('Conversion');
    expect(conversionLabels.length).toBe(4);
  });
});
