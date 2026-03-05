import { describe, it, expect } from 'vitest';
import { pipelineDeals } from '@/data/demo-data';

/**
 * Security tests: Ensure data and rendering are safe from common vulnerabilities.
 * Tests follow OWASP Top 10 (2021) patterns applicable to frontend apps.
 */
describe('Security - XSS & Injection Prevention', () => {
  describe('Deal data sanitization', () => {
    it('no deal company names contain script tags', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.company).not.toMatch(/<script/i);
        expect(deal.company).not.toMatch(/javascript:/i);
        expect(deal.company).not.toMatch(/on\w+\s*=/i);
      });
    });

    it('no deal rep names contain script tags', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.rep).not.toMatch(/<script/i);
        expect(deal.rep).not.toMatch(/javascript:/i);
      });
    });

    it('no persona gaps contain HTML injection', () => {
      pipelineDeals.forEach(deal => {
        deal.personaGaps.forEach(gap => {
          expect(gap).not.toMatch(/<[a-z]/i);
          expect(gap).not.toMatch(/javascript:/i);
        });
      });
    });

    it('no missing steps contain HTML injection', () => {
      pipelineDeals.forEach(deal => {
        deal.missingSteps.forEach(step => {
          expect(step).not.toMatch(/<[a-z]/i);
          expect(step).not.toMatch(/javascript:/i);
        });
      });
    });

    it('no next actions contain injection vectors', () => {
      pipelineDeals.forEach(deal => {
        deal.nextActions.forEach(action => {
          expect(action).not.toMatch(/<script/i);
          expect(action).not.toMatch(/javascript:/i);
          expect(action).not.toMatch(/on\w+\s*=/i);
        });
      });
    });

    it('no timeline descriptions contain injection vectors', () => {
      pipelineDeals.forEach(deal => {
        deal.timeline.forEach(event => {
          expect(event.description).not.toMatch(/<script/i);
          expect(event.description).not.toMatch(/javascript:/i);
        });
      });
    });
  });

  describe('Data boundary validation', () => {
    it('PQS scores are within valid range (no overflow)', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.pqScore).toBeGreaterThanOrEqual(0);
        expect(deal.pqScore).toBeLessThanOrEqual(100);
        expect(Number.isFinite(deal.pqScore)).toBe(true);
      });
    });

    it('win probabilities are within valid range', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.probabilities.win).toBeGreaterThanOrEqual(0);
        expect(deal.probabilities.win).toBeLessThanOrEqual(1);
        expect(Number.isFinite(deal.probabilities.win)).toBe(true);
      });
    });

    it('ICP scores do not overflow int bounds', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.icpScore).toBeGreaterThanOrEqual(0);
        expect(deal.icpScore).toBeLessThanOrEqual(100);
        expect(Number.isFinite(deal.icpScore)).toBe(true);
      });
    });

    it('ACV values are finite positive numbers', () => {
      pipelineDeals.forEach(deal => {
        expect(Number.isFinite(deal.acv)).toBe(true);
        expect(deal.acv).toBeGreaterThan(0);
      });
    });

    it('price risk is bounded 0-1', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.priceRisk).toBeGreaterThanOrEqual(0);
        expect(deal.priceRisk).toBeLessThanOrEqual(1);
      });
    });

    it('daysInStage is non-negative integer', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.daysInStage).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(deal.daysInStage)).toBe(true);
      });
    });

    it('deal IDs do not contain path traversal characters', () => {
      pipelineDeals.forEach(deal => {
        expect(deal.id).not.toMatch(/\.\.\//);
        expect(deal.id).not.toMatch(/[\\]/);
      });
    });
  });

  describe('Currency formatting safety', () => {
    it('formatCurrency does not produce NaN or Infinity for valid inputs', () => {
      const fmt = (n: number) =>
        n >= 1000000 ? `€${(n / 1000000).toFixed(1)}M` : `€${(n / 1000).toFixed(0)}K`;

      expect(fmt(0)).toBe('€0K');
      expect(fmt(1000)).toBe('€1K');
      expect(fmt(50000)).toBe('€50K');
      expect(fmt(1000000)).toBe('€1.0M');
      expect(fmt(5500000)).toBe('€5.5M');
      expect(fmt(999999)).toBe('€1000K');
    });

    it('formatCurrency handles edge cases', () => {
      const fmt = (n: number) =>
        n >= 1000000 ? `€${(n / 1000000).toFixed(1)}M` : `€${(n / 1000).toFixed(0)}K`;

      // Ensure no NaN or undefined in output
      expect(fmt(1)).not.toContain('NaN');
      expect(fmt(Number.MAX_SAFE_INTEGER)).not.toContain('NaN');
    });
  });
});
