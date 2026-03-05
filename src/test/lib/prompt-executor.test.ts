import { describe, it, expect } from 'vitest';
import { executePrompt, getAvailablePrompts, getDealPromptSuggestions, type PromptOutput } from '@/lib/prompt-executor';
import { createMockDeal } from '../test-utils';

describe('PromptExecutor', () => {
  // ── Output shape validation ──

  function validateOutput(output: PromptOutput) {
    expect(output.promptId).toBeTruthy();
    expect(output.promptName).toBeTruthy();
    expect(output.generatedAt).toBeInstanceOf(Date);
    expect(output.content).toBeTruthy();
    expect(typeof output.confidence).toBe('number');
    expect(output.confidence).toBeGreaterThan(0);
    expect(output.confidence).toBeLessThanOrEqual(1);
    expect(Array.isArray(output.actions)).toBe(true);
    expect(Array.isArray(output.dataSourcesUsed)).toBe(true);
    expect(output.dataSourcesUsed.length).toBeGreaterThan(0);
  }

  // ── Deal-level generators ──

  describe('MEDDIC Assessment', () => {
    it('generates valid output for deal with persona gaps', async () => {
      const deal = createMockDeal({ personaGaps: ['Economic Buyer (CFO/Finance Director)', 'Champion'] });
      const output = await executePrompt('assess-meddic-completeness', deal);
      validateOutput(output);
      expect(output.promptId).toBe('assess-meddic-completeness');
      expect(output.dealContext?.company).toBe(deal.company);
      expect(output.content).toContain('MEDDIC Assessment');
      expect(output.content).toContain('Economic Buyer');
    });

    it('generates CRM task action when EB is missing', async () => {
      const deal = createMockDeal({ personaGaps: ['Economic Buyer (CFO/Finance Director)'] });
      const output = await executePrompt('assess-meddic-completeness', deal);
      const ebAction = output.actions.find(a => a.label.includes('EB meeting'));
      expect(ebAction).toBeTruthy();
      expect(ebAction!.type).toBe('crm-task');
      expect(ebAction!.dealId).toBe(deal.id);
    });

    it('generates clean output for fully-qualified deal', async () => {
      const deal = createMockDeal({ personaGaps: [], missingSteps: [], pqScore: 85 });
      const output = await executePrompt('assess-meddic-completeness', deal);
      validateOutput(output);
      expect(output.content).toContain('None');
      expect(output.actions.length).toBe(0);
    });
  });

  describe('Risk Assessment', () => {
    it('generates valid output for high-risk deal', async () => {
      const deal = createMockDeal({
        pqScore: 25, daysInStage: 30, personaGaps: ['EB', 'PM', 'Champion'],
        probabilities: { win: 0.1, loss: 0.5, noDecision: 0.2, slip: 0.2 },
        priceRisk: 0.8, competitor: 'OxBlue',
      });
      const output = await executePrompt('flag-high-risk-deals', deal);
      validateOutput(output);
      expect(output.content).toContain('Critical');
      expect(output.content).toContain('Risk Assessment');
    });

    it('includes stall-breaker coaching action for stalled deals', async () => {
      const deal = createMockDeal({ daysInStage: 25, pqScore: 30 });
      const output = await executePrompt('flag-high-risk-deals', deal);
      const stallAction = output.actions.find(a => a.label.includes('Stall Breaker'));
      expect(stallAction).toBeTruthy();
      expect(stallAction!.type).toBe('coaching-play');
    });

    it('shows low risk for healthy deal', async () => {
      const deal = createMockDeal({
        pqScore: 80, daysInStage: 5, personaGaps: [],
        probabilities: { win: 0.7, loss: 0.1, noDecision: 0.1, slip: 0.1 },
        priceRisk: 0.1, competitor: null,
      });
      const output = await executePrompt('flag-high-risk-deals', deal);
      validateOutput(output);
      expect(output.content).toContain('Low');
    });
  });

  describe('Win Strategy', () => {
    it('generates valid win strategy', async () => {
      const deal = createMockDeal({ stage: 'Proposal', competitor: 'OxBlue' });
      const output = await executePrompt('create-win-strategy-plan', deal);
      validateOutput(output);
      expect(output.content).toContain('Win Strategy');
      expect(output.content).toContain(deal.company);
    });

    it('includes competitive strategy when competitor exists', async () => {
      const deal = createMockDeal({ competitor: 'EarthCam' });
      const output = await executePrompt('create-win-strategy-plan', deal);
      expect(output.content).toContain('EarthCam');
      expect(output.content).toContain('Competitive Strategy');
    });

    it('includes CRM note push action', async () => {
      const deal = createMockDeal();
      const output = await executePrompt('create-win-strategy-plan', deal);
      expect(output.actions.length).toBeGreaterThan(0);
      expect(output.actions[0].type).toBe('crm-note');
    });
  });

  describe('Executive Summary', () => {
    it('generates valid executive summary', async () => {
      const deal = createMockDeal({ acv: 250000, stage: 'Negotiation' });
      const output = await executePrompt('prepare-executive-summary-deal', deal);
      validateOutput(output);
      expect(output.content).toContain('Executive Summary');
      expect(output.content).toContain(deal.company);
    });

    it('includes MEDDIC snapshot', async () => {
      const deal = createMockDeal();
      const output = await executePrompt('prepare-executive-summary-deal', deal);
      expect(output.content).toContain('MEDDIC Snapshot');
    });
  });

  // ── Pipeline-level generators ──

  describe('Forecast Summary', () => {
    it('generates valid forecast summary', async () => {
      const output = await executePrompt('summarize-forecast-for-execs');
      validateOutput(output);
      expect(output.promptId).toBe('summarize-forecast-for-execs');
      expect(output.content).toContain('Forecast Status');
      expect(output.content).toContain('Commit');
      expect(output.content).toContain('Best Case');
    });

    it('does not require a deal parameter', async () => {
      const output = await executePrompt('summarize-forecast-for-execs');
      expect(output.dealContext).toBeUndefined();
    });
  });

  describe('Pipeline Risk Report', () => {
    it('generates valid pipeline risk report', async () => {
      const output = await executePrompt('identify-pipeline-coverage-gaps');
      validateOutput(output);
      expect(output.content).toContain('Pipeline Risk Report');
      expect(output.content).toContain('at-risk');
    });
  });

  describe('1:1 Prep', () => {
    it('generates 1:1 prep for a specific rep', async () => {
      const output = await executePrompt('prepare-1on1-agenda-template', undefined, 'Sophie Chen');
      validateOutput(output);
      expect(output.content).toContain('Sophie Chen');
      expect(output.content).toContain('Coaching Prep');
      expect(output.content).toContain('Target');
    });

    it('defaults to Sophie Chen when no rep specified', async () => {
      const output = await executePrompt('prepare-1on1-agenda-template');
      expect(output.content).toContain('Sophie Chen');
    });
  });

  // ── Utility functions ──

  describe('getAvailablePrompts', () => {
    it('returns prompts sorted by relevance for at-risk deal', () => {
      const deal = createMockDeal({ pqScore: 30 });
      const prompts = getAvailablePrompts(deal);
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0].relevance).toBe('high');
    });

    it('returns pipeline-level prompts when no deal', () => {
      const prompts = getAvailablePrompts();
      expect(prompts.length).toBeGreaterThan(0);
      const highRelevance = prompts.filter(p => p.relevance === 'high');
      expect(highRelevance.length).toBeGreaterThan(0);
    });
  });

  describe('getDealPromptSuggestions', () => {
    it('suggests MEDDIC for deals with persona gaps', () => {
      const deal = createMockDeal({ personaGaps: ['EB'] });
      const suggestions = getDealPromptSuggestions(deal);
      expect(suggestions).toContain('assess-meddic-completeness');
    });

    it('suggests risk for low PQS deals', () => {
      const deal = createMockDeal({ pqScore: 30 });
      const suggestions = getDealPromptSuggestions(deal);
      expect(suggestions).toContain('flag-high-risk-deals');
    });

    it('suggests win strategy for proposal deals', () => {
      const deal = createMockDeal({ stage: 'Proposal' });
      const suggestions = getDealPromptSuggestions(deal);
      expect(suggestions).toContain('create-win-strategy-plan');
    });

    it('suggests exec summary for high-value deals', () => {
      const deal = createMockDeal({ acv: 200000 });
      const suggestions = getDealPromptSuggestions(deal);
      expect(suggestions).toContain('prepare-executive-summary-deal');
    });
  });

  // ── Fallback behavior ──

  describe('Fallback', () => {
    it('falls back to risk assessment for unknown deal-level prompt', async () => {
      const deal = createMockDeal();
      const output = await executePrompt('unknown-prompt-id', deal);
      validateOutput(output);
      expect(output.promptId).toBe('flag-high-risk-deals');
    });

    it('falls back to forecast summary for unknown pipeline-level prompt', async () => {
      const output = await executePrompt('unknown-prompt-id');
      validateOutput(output);
      expect(output.promptId).toBe('summarize-forecast-for-execs');
    });
  });
});
