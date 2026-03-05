import { describe, it, expect } from 'vitest';
import {
  pipelineDeals,
  getPipelineSummary,
  getRepSummary,
  SALES_MANAGERS,
  DEFAULT_REP_TARGETS,
} from '@/data/demo-data';

describe('demo-data', () => {
  describe('pipelineDeals', () => {
    it('contains a substantial number of deals', () => {
      expect(pipelineDeals.length).toBeGreaterThan(100);
    });

    it('all deals have required fields', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.id).toBeTruthy();
        expect(deal.company).toBeTruthy();
        expect(deal.rep).toBeTruthy();
        expect(deal.acv).toBeGreaterThanOrEqual(0);
        expect(deal.stage).toBeTruthy();
        expect(deal.segment).toBeTruthy();
        expect(deal.pqScore).toBeGreaterThanOrEqual(0);
        expect(deal.pqScore).toBeLessThanOrEqual(100);
        expect(deal.grade).toMatch(/^[ABCDF]$/);
      });
    });

    it('all deals have valid stages', () => {
      const validStages = ['Discovery', 'Qualification', 'Proposal', 'Negotiation'];
      pipelineDeals.forEach(deal => {
        expect(validStages).toContain(deal.stage);
      });
    });

    it('all deals have valid segments', () => {
      const validSegments = ['SMB', 'Mid-Market', 'Enterprise'];
      pipelineDeals.forEach(deal => {
        expect(validSegments).toContain(deal.segment);
      });
    });

    it('all deals have valid forecast categories', () => {
      const validCategories = ['Commit', 'Best Case', 'Pipeline', 'Omit'];
      pipelineDeals.forEach(deal => {
        expect(validCategories).toContain(deal.forecastCategory);
      });
    });

    it('win probability is between 0 and 1', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.probabilities.win).toBeGreaterThanOrEqual(0);
        expect(deal.probabilities.win).toBeLessThanOrEqual(1);
      });
    });

    it('grade correctly corresponds to PQS score', () => {
      const gradeMap: Record<string, [number, number]> = {
        A: [80, 100], B: [65, 79], C: [50, 64], D: [35, 49], F: [0, 34],
      };
      pipelineDeals.forEach(deal => {
        const [min, max] = gradeMap[deal.grade];
        expect(deal.pqScore).toBeGreaterThanOrEqual(min);
        expect(deal.pqScore).toBeLessThanOrEqual(max);
      });
    });

    it('all deals have activities data', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.activities).toBeDefined();
        expect(deal.activities.calls).toBeGreaterThanOrEqual(0);
        expect(deal.activities.emails).toBeGreaterThanOrEqual(0);
        expect(deal.activities.meetings).toBeGreaterThanOrEqual(0);
      });
    });

    it('all deals have timeline data', () => {
      pipelineDeals.forEach(deal => {
        expect(Array.isArray(deal.timeline)).toBe(true);
      });
    });

    it('all deals have unique IDs', () => {
      const ids = pipelineDeals.map(d => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ACV values are reasonable (not negative, not absurdly large)', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.acv).toBeGreaterThan(0);
        expect(deal.acv).toBeLessThan(10000000); // 10M cap
      });
    });

    it('daysInStage is non-negative', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.daysInStage).toBeGreaterThanOrEqual(0);
      });
    });

    it('priceRisk is between 0 and 1', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.priceRisk).toBeGreaterThanOrEqual(0);
        expect(deal.priceRisk).toBeLessThanOrEqual(1);
      });
    });

    it('icpScore is between 0 and 100', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.icpScore).toBeGreaterThanOrEqual(0);
        expect(deal.icpScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getPipelineSummary', () => {
    it('returns correct deal count', () => {
      const summary = getPipelineSummary(pipelineDeals);
      expect(summary.dealCount).toBe(pipelineDeals.length);
    });

    it('computes total ACV', () => {
      const summary = getPipelineSummary(pipelineDeals);
      expect(summary.totalACV).toBeGreaterThan(0);
    });

    it('computes quality-adjusted value', () => {
      const summary = getPipelineSummary(pipelineDeals);
      expect(summary.qualityAdjusted).toBeGreaterThan(0);
      // Quality-adjusted should be less than total
      expect(summary.qualityAdjusted).toBeLessThan(summary.totalACV);
    });

    it('computes valid grade distribution', () => {
      const summary = getPipelineSummary(pipelineDeals);
      const totalGrades = Object.values(summary.gradeDistribution).reduce((s, n) => s + n, 0);
      expect(totalGrades).toBe(pipelineDeals.length);
    });

    it('provides confidence bands', () => {
      const summary = getPipelineSummary(pipelineDeals);
      expect(summary.confidenceBand.low).toBeGreaterThan(0);
      expect(summary.confidenceBand.high).toBeGreaterThan(summary.confidenceBand.low);
    });

    it('counts at-risk deals', () => {
      const summary = getPipelineSummary(pipelineDeals);
      expect(summary.atRisk).toBeGreaterThanOrEqual(0);
    });

    it('handles empty deal array', () => {
      const summary = getPipelineSummary([]);
      expect(summary.dealCount).toBe(0);
      expect(summary.totalACV).toBe(0);
    });
  });

  describe('getRepSummary', () => {
    it('returns one entry per rep', () => {
      const reps = getRepSummary(pipelineDeals);
      const repNames = reps.map(r => r.rep);
      const uniqueNames = new Set(repNames);
      expect(uniqueNames.size).toBe(repNames.length);
    });

    it('each rep summary has correct fields', () => {
      const reps = getRepSummary(pipelineDeals);
      reps.forEach(rep => {
        expect(rep.rep).toBeTruthy();
        expect(rep.dealCount).toBeGreaterThan(0);
        expect(rep.totalACV).toBeGreaterThan(0);
        expect(rep.avgPQS).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('SALES_MANAGERS', () => {
    it('has at least 3 managers', () => {
      expect(SALES_MANAGERS.length).toBeGreaterThanOrEqual(3);
    });

    it('each manager has team members', () => {
      SALES_MANAGERS.forEach(mgr => {
        expect(mgr.team.length).toBeGreaterThan(0);
      });
    });
  });

  describe('DEFAULT_REP_TARGETS', () => {
    it('has targets for all reps', () => {
      const allReps = SALES_MANAGERS.flatMap(m => m.team);
      allReps.forEach(rep => {
        expect(DEFAULT_REP_TARGETS[rep]).toBeDefined();
        expect(DEFAULT_REP_TARGETS[rep]).toBeGreaterThan(0);
      });
    });
  });
});
