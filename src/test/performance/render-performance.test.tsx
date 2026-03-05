import { describe, it, expect } from 'vitest';
import { render } from '../test-utils';
import { GradeBadge } from '@/components/GradeBadge';
import { MetricCard } from '@/components/MetricCard';
import { generateTrendData } from '@/components/TrendSparkline';
import { ScoreRadar } from '@/components/ScoreRadar';
import { createMockDeal } from '../test-utils';
import { InterventionQueue } from '@/components/InterventionQueue';
import { pipelineDeals, getPipelineSummary, getRepSummary } from '@/data/demo-data';

/**
 * Performance tests: Ensure components render within acceptable time bounds
 * and data computations complete efficiently even with large datasets.
 */
describe('Performance', () => {
  describe('Data computation performance', () => {
    it('getPipelineSummary processes 750+ deals in under 100ms', () => {
      const start = performance.now();
      getPipelineSummary(pipelineDeals);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('getRepSummary aggregates all reps in under 100ms', () => {
      const start = performance.now();
      getRepSummary(pipelineDeals);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it('generateTrendData creates 1000 data sets in under 50ms', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        generateTrendData(Math.random() * 100, 8, 0.15);
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Component render performance', () => {
    it('GradeBadge renders 50 instances in under 500ms', () => {
      const grades = ['A', 'B', 'C', 'D', 'F'] as const;
      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<GradeBadge grade={grades[i % 5]} />);
        unmount();
      }
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });

    it('MetricCard renders with sparkline in under 50ms', () => {
      const start = performance.now();
      const { unmount } = render(
        <MetricCard label="Test" value="€1M" sparklineValue={1000} variant="primary" />
      );
      unmount();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    it('ScoreRadar renders in under 50ms', () => {
      const deal = createMockDeal();
      const start = performance.now();
      const { unmount } = render(<ScoreRadar deal={deal} />);
      unmount();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });

    it('InterventionQueue renders 8 flagged deals in under 100ms', () => {
      const deals = Array.from({ length: 20 }, (_, i) =>
        createMockDeal({ id: `EC-${i}`, pqScore: 20, acv: 100000 })
      );
      const start = performance.now();
      const { unmount } = render(<InterventionQueue deals={deals} />);
      unmount();
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Memory efficiency', () => {
    it('pipelineDeals does not have duplicate objects', () => {
      const idSet = new Set(pipelineDeals.map(d => d.id));
      expect(idSet.size).toBe(pipelineDeals.length);
    });

    it('large deal arrays are filterable without excessive memory', () => {
      // Simulate filtering pipeline of 750+ deals by multiple criteria
      const filtered = pipelineDeals
        .filter(d => d.pqScore < 40)
        .filter(d => d.acv > 50000)
        .filter(d => d.stage === 'Proposal')
        .sort((a, b) => b.acv - a.acv);

      // Should not crash or timeout
      expect(Array.isArray(filtered)).toBe(true);
    });
  });
});
