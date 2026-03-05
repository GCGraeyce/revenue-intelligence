/**
 * Prompt Executor — bridges the backend CRM Prompt Library with live deal data.
 *
 * Takes a prompt ID + deal context and generates realistic AI output by
 * hydrating the prompt template with actual deal/pipeline data, then
 * producing a structured response.
 *
 * In production, this would call Claude/GPT with the hydrated prompt.
 * For hackathon demo, it generates realistic pre-computed outputs.
 */

import { Deal, pipelineDeals, DEFAULT_REP_TARGETS } from '@/data/demo-data';
import {
  BUYER_PERSONAS,
  COMPETITORS,
  ICP_PROFILES,
  SALES_PLAYBOOK,
  COMMON_OBJECTIONS,
} from '@/data/evercam-context';
import type { PromptEntry } from '@/data/prompt-library';
import { PROMPT_LIBRARY } from '@/data/prompt-library';
import { fmt } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PromptOutput {
  promptId: string;
  promptName: string;
  generatedAt: Date;
  dealContext?: { id: string; company: string };
  content: string; // markdown response
  actions: OutputAction[]; // CRM actions the user can execute
  confidence: number; // 0-1
  dataSourcesUsed: string[];
}

export interface OutputAction {
  id: string;
  label: string;
  type: 'crm-note' | 'crm-task' | 'coaching-play' | 'navigate';
  dealId?: string;
  payload: string;
}

// ---------------------------------------------------------------------------
// Deal-level prompt generators
// ---------------------------------------------------------------------------

function generateMEDDICAssessment(deal: Deal): PromptOutput {
  const playbook = SALES_PLAYBOOK.find((s) => s.stage === deal.stage);
  const hasEB = !deal.personaGaps.some((g) => g.includes('Economic Buyer'));
  const hasChampion = !deal.personaGaps.some(
    (g) => g.includes('Champion') || g.includes('Executive')
  );
  const hasPM = !deal.personaGaps.some((g) => g.includes('Project Manager'));
  const persona = BUYER_PERSONAS.find((p) => p.role === 'Economic Buyer');

  const metrics =
    deal.pqScore >= 50
      ? '✅ Metrics: ROI/business case likely discussed (PQS 50+)'
      : '⚠️ Metrics: No evidence of quantified ROI in deal data';
  const eb = hasEB
    ? '✅ Economic Buyer: Engaged'
    : `❌ Economic Buyer: NOT engaged — critical gap at ${deal.stage} stage`;
  const dc = deal.missingSteps.some((s) => s.includes('Demo'))
    ? '⚠️ Decision Criteria: Technical demo not completed'
    : '✅ Decision Criteria: Technical validation appears complete';
  const dp = deal.missingSteps.some((s) => s.includes('ROI') || s.includes('Business Case'))
    ? '⚠️ Decision Process: ROI/business case not presented'
    : '✅ Decision Process: Business case flow appears active';
  const ip =
    deal.pqScore > 0
      ? '✅ Identify Pain: Project needs documented via ICP scoring'
      : '⚠️ Identify Pain: Insufficient discovery data';
  const ch = hasChampion
    ? '✅ Champion: Executive sponsor engaged'
    : '⚠️ Champion: No champion or executive sponsor identified';

  const gaps = [
    !hasEB && 'Economic Buyer',
    !hasChampion && 'Champion',
    !hasPM && 'Project Manager',
    deal.missingSteps.length > 0 && `${deal.missingSteps.length} missing process steps`,
  ].filter(Boolean);

  const actions: OutputAction[] = [];
  if (!hasEB) {
    actions.push({
      id: `act_${deal.id}_eb`,
      label: `Schedule EB meeting for ${deal.company}`,
      type: 'crm-task',
      dealId: deal.id,
      payload: `MEDDIC gap: Schedule Economic Buyer meeting. ${persona?.engagementTips[0] || ''}`,
    });
  }
  if (deal.missingSteps.length > 0) {
    actions.push({
      id: `act_${deal.id}_steps`,
      label: `Create tasks for missing steps`,
      type: 'crm-task',
      dealId: deal.id,
      payload: `Missing: ${deal.missingSteps.join(', ')}`,
    });
  }

  return {
    promptId: 'assess-meddic-completeness',
    promptName: 'MEDDIC Assessment',
    generatedAt: new Date(),
    dealContext: { id: deal.id, company: deal.company },
    confidence: 0.85,
    dataSourcesUsed: [
      'PQS Score',
      'Persona Coverage',
      'Process Adherence',
      'Evercam Sales Playbook',
    ],
    actions,
    content: `## MEDDIC Assessment: ${deal.company}\n\n**Deal:** ${fmt(deal.acv)} · ${deal.stage} · PQS ${deal.pqScore} (${deal.grade})\n\n| Element | Status |\n|---------|--------|\n| ${metrics} |\n| ${eb} |\n| ${dc} |\n| ${dp} |\n| ${ip} |\n| ${ch} |\n\n**Overall MEDDIC Score:** ${[hasEB, hasChampion, hasPM, deal.missingSteps.length === 0, deal.pqScore >= 50, deal.missingSteps.length <= 1].filter(Boolean).length}/6 elements covered\n\n**Critical Gaps:** ${gaps.length > 0 ? gaps.join(', ') : 'None — deal appears well-qualified'}\n\n**Recommended Actions:**\n${!hasEB ? `1. **Engage Economic Buyer immediately** — ${deal.stage} stage requires CFO/Finance Director involvement per playbook. ${persona?.engagementTips[0] || ''}\n` : ''}${!hasChampion ? `2. **Identify an executive champion** — Needed to navigate internal approvals and protect the deal.\n` : ''}${deal.missingSteps.length > 0 ? `3. **Complete missing steps:** ${deal.missingSteps.join(', ')}\n` : ''}${playbook ? `\n**Stage Requirements (${deal.stage}):** ${playbook.exitCriteria.join(' · ')}` : ''}`,
  };
}

function generateRiskAssessment(deal: Deal): PromptOutput {
  const riskFactors: string[] = [];
  if (deal.pqScore < 40)
    riskFactors.push(`Low PQS (${deal.pqScore}) — below intervention threshold`);
  if (deal.daysInStage > 20)
    riskFactors.push(
      `Stalled ${deal.daysInStage} days in ${deal.stage} (typical max: ${SALES_PLAYBOOK.find((s) => s.stage === deal.stage)?.typicalDuration.maxDays || 21}d)`
    );
  if (deal.personaGaps.length >= 2)
    riskFactors.push(`${deal.personaGaps.length} persona gaps: ${deal.personaGaps.join(', ')}`);
  if (deal.probabilities.slip > 0.3)
    riskFactors.push(`High slip probability: ${Math.round(deal.probabilities.slip * 100)}%`);
  if (deal.probabilities.loss > 0.3)
    riskFactors.push(`Elevated loss probability: ${Math.round(deal.probabilities.loss * 100)}%`);
  if (deal.priceRisk > 0.6)
    riskFactors.push(`Price sensitivity: ${Math.round(deal.priceRisk * 100)}% risk`);
  if (deal.competitor) {
    const comp = COMPETITORS.find((c) =>
      c.name.toLowerCase().includes(deal.competitor!.toLowerCase())
    );
    if (comp)
      riskFactors.push(
        `Competitive threat: ${comp.name} (Evercam win rate: ${Math.round(comp.evercamWinRate * 100)}%)`
      );
  }

  const riskLevel =
    riskFactors.length >= 4
      ? 'Critical'
      : riskFactors.length >= 2
        ? 'High'
        : riskFactors.length >= 1
          ? 'Medium'
          : 'Low';
  const impactIfLost = fmt(deal.acv);

  return {
    promptId: 'flag-high-risk-deals',
    promptName: 'Risk Assessment',
    generatedAt: new Date(),
    dealContext: { id: deal.id, company: deal.company },
    confidence: 0.88,
    dataSourcesUsed: [
      'PQS Score',
      'Stage Velocity',
      'Persona Coverage',
      'Probability Model',
      'Competitor Intelligence',
    ],
    actions: [
      ...(deal.daysInStage > 20
        ? [
            {
              id: `act_${deal.id}_stall`,
              label: `Trigger Stall Breaker play`,
              type: 'coaching-play' as const,
              dealId: deal.id,
              payload: 'Stall Breaker coaching play',
            },
          ]
        : []),
      {
        id: `act_${deal.id}_risk_task`,
        label: `Create risk review task`,
        type: 'crm-task' as const,
        dealId: deal.id,
        payload: `Risk review: ${riskFactors.slice(0, 2).join('; ')}`,
      },
    ],
    content: `## Risk Assessment: ${deal.company}\n\n**Risk Level: ${riskLevel}** · Revenue Impact: ${impactIfLost}\n\n### Risk Factors (${riskFactors.length})\n\n${riskFactors.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n### Mitigation Recommendations\n\n${deal.daysInStage > 20 ? `- **Re-engage urgently** — Stall Breaker play recommended. Contact 2-3 stakeholders with new value trigger.\n` : ''}${deal.personaGaps.length >= 2 ? `- **Multi-thread** — ${deal.personaGaps.length} missing personas. Initiate multi-threading campaign targeting: ${deal.personaGaps.join(', ')}.\n` : ''}${deal.probabilities.slip > 0.3 ? `- **Forecast review** — Consider moving from ${deal.forecastCategory} to ${deal.forecastCategory === 'Commit' ? 'Best Case' : 'Pipeline'} until risks resolved.\n` : ''}${
      deal.competitor
        ? `- **Competitive counter** — Review battlecard. Lead with Evercam differentiators: ${
            COMPETITORS.find((c) => c.name.toLowerCase().includes(deal.competitor!.toLowerCase()))
              ?.battlecard.slice(0, 2)
              .join('; ') || 'unique value props'
          }.\n`
        : ''
    }${deal.priceRisk > 0.6 ? `- **Address price sensitivity** — ${COMMON_OBJECTIONS.find((o) => o.id === 'OBJ-ROI')?.response.slice(0, 120) || 'Build ROI case with dispute avoidance savings.'}...\n` : ''}\n### Probability Profile\n| Outcome | Probability |\n|---------|------------|\n| Win | ${Math.round(deal.probabilities.win * 100)}% |\n| Loss | ${Math.round(deal.probabilities.loss * 100)}% |\n| No Decision | ${Math.round(deal.probabilities.noDecision * 100)}% |\n| Slip | ${Math.round(deal.probabilities.slip * 100)}% |`,
  };
}

function generateWinStrategy(deal: Deal): PromptOutput {
  const playbook = SALES_PLAYBOOK.find((s) => s.stage === deal.stage);
  const hasEB = !deal.personaGaps.some((g) => g.includes('Economic Buyer'));
  const comp = deal.competitor
    ? COMPETITORS.find((c) => c.name.toLowerCase().includes(deal.competitor!.toLowerCase()))
    : null;
  const icp = ICP_PROFILES.find((p) => p.segment === deal.segment);

  return {
    promptId: 'create-win-strategy-plan',
    promptName: 'Win Strategy Plan',
    generatedAt: new Date(),
    dealContext: { id: deal.id, company: deal.company },
    confidence: 0.82,
    dataSourcesUsed: [
      'MEDDIC Framework',
      'Evercam Sales Playbook',
      'ICP Profiles',
      'Competitor Intelligence',
    ],
    actions: [
      {
        id: `act_${deal.id}_strategy_note`,
        label: `Push win strategy to Zoho`,
        type: 'crm-note' as const,
        dealId: deal.id,
        payload: `Win strategy plan generated by RevOS AI`,
      },
    ],
    content: `## Win Strategy: ${deal.company}\n\n**${fmt(deal.acv)}** · ${deal.stage} · Close ${deal.closeDate} · PQS ${deal.pqScore}\n\n### 1. Metrics (Quantify Value)\n${deal.pqScore >= 50 ? '- Business case appears in progress. Strengthen with project-specific ROI numbers.' : '- **Action Required:** Build ROI calculator showing dispute avoidance, travel savings, and marketing value for their project type.'}\n- Reference: ${icp ? `${icp.name} segment historically wins at ${Math.round(icp.historicalWinRate * 100)}%` : 'Use segment-appropriate case study'}\n\n### 2. Economic Buyer\n${hasEB ? '- EB is engaged. Ensure they see the ROI presentation before final approval.' : `- **Critical:** EB not engaged. Steps:\n  1. Ask champion for intro to CFO/Finance Director\n  2. Frame as "protecting the project budget"\n  3. Present ROI with dispute avoidance numbers\n  4. Timeline: Meeting within 10 business days`}\n\n### 3. Decision Criteria & Process\n- Stage requirements: ${playbook?.exitCriteria.slice(0, 3).join(', ') || 'Complete stage exit criteria'}\n- Missing steps: ${deal.missingSteps.length > 0 ? deal.missingSteps.join(', ') : 'None — process is tracking'}\n${playbook ? `- Typical duration: ${playbook.typicalDuration.minDays}-${playbook.typicalDuration.maxDays} days (currently day ${deal.daysInStage})` : ''}\n\n### 4. Champion & Pain\n${deal.personaGaps.some((g) => g.includes('Champion') || g.includes('Executive')) ? '- **No champion identified.** Identify a power user or technical advocate who benefits from Evercam.' : '- Champion is engaged. Leverage them to navigate internal blockers.'}\n- Pain reinforcement: Focus on their project type (${deal.projectType}) challenges\n\n### 5. Competitive Strategy\n${
      comp
        ? `- **vs ${comp.name}:** Lead with:\n  ${comp.battlecard
            .slice(0, 3)
            .map((b) => `- ${b}`)
            .join(
              '\n  '
            )}\n- Historical win rate against ${comp.name}: ${Math.round(comp.evercamWinRate * 100)}%`
        : '- No direct competitor identified. Watch for DIY/CCTV comparison — use construction-grade differentiation.'
    }\n\n### Next Steps (This Week)\n${deal.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
  };
}

function generateExecutiveSummary(deal: Deal): PromptOutput {
  const comp = deal.competitor
    ? COMPETITORS.find((c) => c.name.toLowerCase().includes(deal.competitor!.toLowerCase()))
    : null;

  return {
    promptId: 'prepare-executive-summary-deal',
    promptName: 'Executive Summary',
    generatedAt: new Date(),
    dealContext: { id: deal.id, company: deal.company },
    confidence: 0.9,
    dataSourcesUsed: ['Deal Data', 'MEDDIC Status', 'ICP Profile', 'Competitor Intel'],
    actions: [
      {
        id: `act_${deal.id}_exec_note`,
        label: `Push to Zoho as executive brief`,
        type: 'crm-note' as const,
        dealId: deal.id,
        payload: 'Executive Summary for leadership review',
      },
    ],
    content: `## Executive Summary: ${deal.company}\n\n**Deal Value:** ${fmt(deal.acv)} · **Stage:** ${deal.stage} · **Close Date:** ${deal.closeDate}\n**Segment:** ${deal.segment} · **Product:** ${deal.productBundle} · **Cameras:** ${deal.cameraCount}\n**PQS:** ${deal.pqScore} (${deal.grade}) · **Win Probability:** ${Math.round(deal.probabilities.win * 100)}%\n\n### Use Case\n${deal.projectType} project requiring ${deal.cameraCount} cameras for construction monitoring, progress documentation, and ${deal.segment === 'Enterprise' ? 'multi-site portfolio visibility' : 'project oversight'}.\n\n### Current Status\n- **Forecast:** ${deal.forecastCategory}\n- **Days in Stage:** ${deal.daysInStage}\n- **Persona Coverage:** ${5 - deal.personaGaps.length}/5 key personas engaged\n${deal.personaGaps.length > 0 ? `- **Gaps:** ${deal.personaGaps.join(', ')}` : '- All personas engaged'}\n${comp ? `- **Competition:** ${comp.name} (historical win rate: ${Math.round(comp.evercamWinRate * 100)}%)` : ''}\n\n### MEDDIC Snapshot\n- Pain: ${deal.pqScore >= 50 ? 'Identified' : 'Needs clarification'}\n- Champion: ${deal.personaGaps.some((g) => g.includes('Champion') || g.includes('Executive')) ? '❌ Not identified' : '✅ Engaged'}\n- Economic Buyer: ${deal.personaGaps.some((g) => g.includes('Economic')) ? '❌ Not engaged' : '✅ Involved'}\n- Metrics: ${deal.missingSteps.some((s) => s.includes('ROI')) ? '⚠️ ROI not quantified' : '✅ Business case active'}\n\n### Executive Ask\n${deal.personaGaps.some((g) => g.includes('Economic')) ? `**Needed:** Executive sponsor call to their ${deal.segment === 'Enterprise' ? 'CFO/Finance Director' : 'decision maker'} to unlock commercial discussion.` : deal.acv > 200000 ? '**Needed:** Executive endorsement for custom pricing/terms.' : 'No executive action required at this time.'}\n\n### Next Steps\n${deal.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`,
  };
}

// ---------------------------------------------------------------------------
// Pipeline-level prompt generators
// ---------------------------------------------------------------------------

function generateForecastSummary(): PromptOutput {
  const deals = pipelineDeals;
  const commits = deals.filter((d) => d.forecastCategory === 'Commit');
  const bestCase = deals.filter((d) => d.forecastCategory === 'Best Case');
  const pipeline = deals.filter((d) => d.forecastCategory === 'Pipeline');
  const commitTotal = commits.reduce((s, d) => s + d.acv, 0);
  const bestCaseTotal = bestCase.reduce((s, d) => s + d.acv, 0);
  const pipelineTotal = pipeline.reduce((s, d) => s + d.acv, 0);
  const target = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const weightedForecast =
    commits.reduce((s, d) => s + d.acv * d.probabilities.win, 0) +
    bestCase.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const gap = target - commitTotal;
  const totalPipeline = deals.reduce((s, d) => s + d.acv, 0);
  const coverage = (totalPipeline / target).toFixed(1);

  const riskyCommits = commits.filter((d) => d.probabilities.slip > 0.25 || d.pqScore < 45);

  return {
    promptId: 'summarize-forecast-for-execs',
    promptName: 'Forecast Status Summary',
    generatedAt: new Date(),
    confidence: 0.91,
    dataSourcesUsed: [
      'Pipeline Data (750 deals)',
      'Probability Model',
      'Sales Targets',
      'Historical Win Rates',
    ],
    actions: riskyCommits.slice(0, 3).map((d) => ({
      id: `act_${d.id}_forecast_review`,
      label: `Review forecast: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Forecast risk review: PQS ${d.pqScore}, slip ${Math.round(d.probabilities.slip * 100)}%`,
    })),
    content: `## Forecast Status: Executive Summary\n\n| Category | Deals | Total | Weighted |\n|----------|-------|-------|----------|\n| Commit | ${commits.length} | ${fmt(commitTotal)} | ${fmt(commits.reduce((s, d) => s + d.acv * d.probabilities.win, 0))} |\n| Best Case | ${bestCase.length} | ${fmt(bestCaseTotal)} | ${fmt(bestCase.reduce((s, d) => s + d.acv * d.probabilities.win, 0))} |\n| Pipeline | ${pipeline.length} | ${fmt(pipelineTotal)} | — |\n| **Target** | — | **${fmt(target)}** | — |\n\n**Gap:** ${gap > 0 ? `${fmt(gap)} (${Math.round((gap / target) * 100)}% shortfall)` : '✅ On target'}\n**Coverage:** ${coverage}x · **Weighted Forecast:** ${fmt(weightedForecast)}\n\n### Key Risks\n${
      riskyCommits.length > 0
        ? riskyCommits
            .slice(0, 5)
            .map(
              (d) =>
                `- **${d.company}** (${fmt(d.acv)}) — PQS ${d.pqScore}, slip risk ${Math.round(d.probabilities.slip * 100)}%`
            )
            .join('\n')
        : '- No high-risk commit deals identified'
    }\n\n### Upside Opportunities\n${bestCase
      .sort((a, b) => b.acv - a.acv)
      .slice(0, 3)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — Win probability ${Math.round(d.probabilities.win * 100)}%. ${d.personaGaps.length === 0 ? 'Well-qualified.' : `Gap: ${d.personaGaps[0]}.`}`
      )
      .join(
        '\n'
      )}\n\n### Assessment\n${gap > target * 0.15 ? `⚠️ Significant shortfall. Recommend promoting best-case deals and running pipeline generation sprint.` : gap > 0 ? `Moderate gap. Upside deals can close it with focused attention.` : `✅ Commit exceeds target. Focus on execution and avoiding slippage.`}`,
  };
}

function generatePipelineRiskReport(): PromptOutput {
  const deals = pipelineDeals;
  const atRisk = deals.filter((d) => d.pqScore < 40 && d.acv > 50000).sort((a, b) => b.acv - a.acv);
  const stalled = deals.filter((d) => d.daysInStage > 20).sort((a, b) => b.acv - a.acv);
  const totalRiskExposure = atRisk.reduce((s, d) => s + d.acv, 0);

  return {
    promptId: 'identify-pipeline-coverage-gaps',
    promptName: 'Pipeline Risk Report',
    generatedAt: new Date(),
    confidence: 0.87,
    dataSourcesUsed: ['PQS Scores', 'Stage Velocity', 'Persona Coverage', 'Pipeline Metrics'],
    actions: atRisk.slice(0, 3).map((d) => ({
      id: `act_${d.id}_pipeline_risk`,
      label: `Create intervention task: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Pipeline risk: PQS ${d.pqScore}, ${d.personaGaps.length} persona gaps`,
    })),
    content: `## Pipeline Risk Report\n\n**Total at-risk deals (PQS < 40, ACV > €50K):** ${atRisk.length}\n**Risk exposure:** ${fmt(totalRiskExposure)}\n**Stalled deals (20+ days):** ${stalled.length}\n\n### Top Risk Deals\n\n${atRisk
      .slice(0, 8)
      .map(
        (d, i) =>
          `${i + 1}. **${d.company}** — ${fmt(d.acv)} · PQS ${d.pqScore} (${d.grade}) · ${d.stage} · ${d.daysInStage}d\n   Gaps: ${d.personaGaps.join(', ') || 'None'} · Next: ${d.nextActions[0] || 'TBD'}`
      )
      .join('\n\n')}\n\n### Stalled Deals\n${stalled
      .slice(0, 5)
      .map((d) => `- **${d.company}** (${fmt(d.acv)}) — ${d.daysInStage} days in ${d.stage}`)
      .join(
        '\n'
      )}\n\n### Recommended Actions\n1. **Triage the top 5 risk deals** — Assign each to a manager for immediate review\n2. **Run Stall Breaker** on ${stalled.length} stalled deals — disqualify or re-engage within 2 weeks\n3. **Multi-thread** deals with 2+ persona gaps (${deals.filter((d) => d.personaGaps.length >= 2).length} deals)`,
  };
}

function generateOneOnOnePrep(repName: string): PromptOutput {
  const repDeals = pipelineDeals.filter((d) => d.rep === repName);
  const target = DEFAULT_REP_TARGETS[repName] || 800000;
  const totalACV = repDeals.reduce((s, d) => s + d.acv, 0);
  const weighted = repDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const attainment = Math.round((weighted / target) * 100);
  const avgPQS =
    repDeals.length > 0
      ? Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length)
      : 0;
  const atRisk = repDeals.filter((d) => d.pqScore < 40);
  const stalled = repDeals.filter((d) => d.daysInStage > 20);
  const closeable = repDeals.filter((d) => d.stage === 'Negotiation' && d.probabilities.win > 0.4);
  const ebGaps = repDeals.filter(
    (d) =>
      (d.stage === 'Proposal' || d.stage === 'Negotiation') &&
      d.personaGaps.some((g) => g.includes('Economic Buyer'))
  );

  return {
    promptId: 'prepare-1on1-agenda-template',
    promptName: `1:1 Prep — ${repName}`,
    generatedAt: new Date(),
    confidence: 0.86,
    dataSourcesUsed: [
      'Rep Pipeline',
      'PQS Scores',
      'Stage Data',
      'Activity Metrics',
      'Sales Targets',
    ],
    actions: [],
    content: `## 1:1 Coaching Prep: ${repName}\n\n### Performance Snapshot\n| Metric | Value |\n|--------|-------|\n| Pipeline | ${fmt(totalACV)} (${repDeals.length} deals) |\n| Weighted Forecast | ${fmt(weighted)} |\n| Target | ${fmt(target)} |\n| Attainment | ${attainment}% |\n| Avg PQS | ${avgPQS} |\n| Coverage | ${(totalACV / target).toFixed(1)}x |\n\n### Talking Points\n\n${closeable.length > 0 ? `**1. Closing Deals (${closeable.length})**\n${closeable.map((d) => `   - ${d.company} (${fmt(d.acv)}) — What's needed to get commitment this week?`).join('\n')}\n\n` : ''}${
      atRisk.length > 0
        ? `**${closeable.length > 0 ? '2' : '1'}. At-Risk Deals (${atRisk.length})**\n${atRisk
            .slice(0, 3)
            .map(
              (d) =>
                `   - ${d.company} (${fmt(d.acv)}, PQS ${d.pqScore}) — What's blocking? ${d.personaGaps[0] ? `Missing: ${d.personaGaps[0]}` : ''}`
            )
            .join('\n')}\n\n`
        : ''
    }${ebGaps.length > 0 ? `**${(closeable.length > 0 ? 2 : 1) + (atRisk.length > 0 ? 1 : 0)}. EB Recovery Needed (${ebGaps.length} deals)**\n   Can we map a path to CFO meetings this week?\n\n` : ''}${stalled.length > 2 ? `**Stalled (${stalled.length} deals 20+ days)**\n   Which do we double-down on vs disqualify?\n\n` : ''}### Coaching Recommendations\n${attainment < 80 ? `- **Focus:** Pipeline building needed. Coverage at ${(totalACV / target).toFixed(1)}x is below 3x target.\n` : ''}${avgPQS < 50 ? `- **Quality:** Average PQS of ${avgPQS} suggests deal qualification gaps. Review MEDDIC coverage.\n` : ''}${ebGaps.length > 0 ? `- **Skill:** ${ebGaps.length} deals missing EB engagement — practice executive outreach approach.\n` : ''}${attainment >= 100 ? `- **Celebrate:** On track at ${attainment}%! Discuss what's working to share with team.\n` : ''}`,
  };
}

// ---------------------------------------------------------------------------
// Additional pipeline-level generators
// ---------------------------------------------------------------------------

function generateQuarterEndStrategy(): PromptOutput {
  const deals = pipelineDeals;
  const commits = deals.filter((d) => d.forecastCategory === 'Commit');
  const bestCase = deals.filter((d) => d.forecastCategory === 'Best Case');
  const target = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const commitTotal = commits.reduce((s, d) => s + d.acv, 0);
  const gap = target - commitTotal;
  const closeable = commits
    .filter((d) => d.stage === 'Negotiation' || d.stage === 'Proposal')
    .sort((a, b) => b.acv - a.acv);
  const riskyCommits = commits.filter((d) => d.probabilities.slip > 0.25 || d.pqScore < 45);
  const promotable = bestCase
    .filter((d) => d.probabilities.win > 0.4 && d.pqScore >= 50)
    .sort((a, b) => b.acv - a.acv);

  return {
    promptId: 'quarter-end-closing-strategy',
    promptName: 'Quarter-End Closing Strategy',
    generatedAt: new Date(),
    confidence: 0.88,
    dataSourcesUsed: ['Pipeline Data', 'Probability Model', 'Sales Targets', 'Stage Velocity'],
    actions: closeable.slice(0, 3).map((d) => ({
      id: `act_${d.id}_close`,
      label: `Create close plan: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Quarter-end close plan: ${d.stage}, PQS ${d.pqScore}`,
    })),
    content: `## Quarter-End Closing Strategy\n\n**Commit Total:** ${fmt(commitTotal)} vs **Target:** ${fmt(target)} · **Gap:** ${gap > 0 ? fmt(gap) : '✅ On track'}\n\n### Priority 1: Protect Commit (${riskyCommits.length} at-risk)\n${
      riskyCommits.length > 0
        ? riskyCommits
            .slice(0, 5)
            .map(
              (d) =>
                `- **${d.company}** (${fmt(d.acv)}) — PQS ${d.pqScore}, slip risk ${Math.round(d.probabilities.slip * 100)}%\n  Action: ${d.nextActions[0] || 'Schedule urgent review'}`
            )
            .join('\n')
        : '- All commit deals are tracking well.'
    }\n\n### Priority 2: Close In-Flight (${closeable.length} deals in late stage)\n${closeable
      .slice(0, 5)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — ${d.stage}, ${d.daysInStage}d\n  Missing: ${d.missingSteps.length > 0 ? d.missingSteps.slice(0, 2).join(', ') : 'On track'}`
      )
      .join(
        '\n'
      )}\n\n### Priority 3: Promote Best Case (${promotable.length} promotable)\n${promotable
      .slice(0, 3)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — win prob ${Math.round(d.probabilities.win * 100)}%, PQS ${d.pqScore}`
      )
      .join(
        '\n'
      )}\n\n### Sprint Actions\n1. Daily stand-up on commit deals for remaining 2 weeks\n2. Executive engagement on top 3 deals by ACV\n3. Offer value-add (not discount) for deals needing a push\n4. Disqualify or push out anything below PQS 35`,
  };
}

function generateStagnantDeals(): PromptOutput {
  const deals = pipelineDeals;
  const stalled = deals.filter((d) => d.daysInStage > 15).sort((a, b) => b.acv - a.acv);
  const critical = stalled.filter((d) => d.daysInStage > 25);
  const totalExposure = stalled.reduce((s, d) => s + d.acv, 0);

  return {
    promptId: 'spot-stagnant-deals',
    promptName: 'Stagnant Deal Tracker',
    generatedAt: new Date(),
    confidence: 0.9,
    dataSourcesUsed: ['Stage Velocity', 'Pipeline Data', 'Sales Playbook Duration Benchmarks'],
    actions: critical.slice(0, 3).map((d) => ({
      id: `act_${d.id}_stall`,
      label: `Stall Breaker: ${d.company}`,
      type: 'coaching-play' as const,
      dealId: d.id,
      payload: `Stall Breaker play: ${d.daysInStage}d in ${d.stage}`,
    })),
    content: `## Stagnant Deal Report\n\n**${stalled.length} deals stalled** (15+ days in stage) · Exposure: ${fmt(totalExposure)}\n**${critical.length} critical** (25+ days)\n\n### Critical Stalls (Immediate Intervention)\n${critical
      .slice(0, 5)
      .map(
        (d, i) =>
          `${i + 1}. **${d.company}** — ${fmt(d.acv)} · ${d.daysInStage}d in ${d.stage} · PQS ${d.pqScore}\n   Rep: ${d.rep} · Gaps: ${d.personaGaps.join(', ') || 'None'}\n   → ${d.nextActions[0] || 'Needs action plan'}`
      )
      .join('\n\n')}\n\n### Approaching Stall (15-24 days)\n${stalled
      .filter((d) => d.daysInStage <= 24)
      .slice(0, 5)
      .map((d) => `- **${d.company}** (${fmt(d.acv)}) — ${d.daysInStage}d in ${d.stage}`)
      .join(
        '\n'
      )}\n\n### Recommendations\n1. **Triage:** Decide keep, re-engage, or disqualify for each stalled deal\n2. **Run Stall Breaker** on critical deals — contact new stakeholders with fresh value triggers\n3. **Set velocity alerts** — auto-flag deals approaching stage duration benchmarks`,
  };
}

function generateTopOpportunities(): PromptOutput {
  const deals = pipelineDeals;
  const top = [...deals].sort((a, b) => b.acv - a.acv).slice(0, 10);
  const highProb = [...deals].sort((a, b) => b.probabilities.win - a.probabilities.win).slice(0, 5);

  return {
    promptId: 'highlight-top-opportunities',
    promptName: 'Top Opportunities',
    generatedAt: new Date(),
    confidence: 0.92,
    dataSourcesUsed: ['Pipeline Data', 'PQS Scores', 'Probability Model'],
    actions: top.slice(0, 3).map((d) => ({
      id: `act_${d.id}_focus`,
      label: `Create focus plan: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Top opportunity focus plan`,
    })),
    content: `## Top Opportunities\n\n### By Deal Value (Top 10)\n${top.map((d, i) => `${i + 1}. **${d.company}** — ${fmt(d.acv)} · ${d.stage} · PQS ${d.pqScore} (${d.grade})\n   Win prob: ${Math.round(d.probabilities.win * 100)}% · Rep: ${d.rep} · Close: ${d.closeDate}`).join('\n')}\n\n### Highest Win Probability\n${highProb.map((d) => `- **${d.company}** — ${Math.round(d.probabilities.win * 100)}% win · ${fmt(d.acv)} · ${d.stage}`).join('\n')}\n\n### Quick Wins (High ACV + High Probability)\n${
      deals
        .filter((d) => d.probabilities.win > 0.5 && d.acv > 100000)
        .sort((a, b) => b.acv * b.probabilities.win - a.acv * a.probabilities.win)
        .slice(0, 3)
        .map(
          (d) =>
            `- **${d.company}** — ${fmt(d.acv)} · ${Math.round(d.probabilities.win * 100)}% win`
        )
        .join('\n') || '- No quick wins identified above thresholds'
    }`,
  };
}

function generateTeamBenchmarks(): PromptOutput {
  const deals = pipelineDeals;
  const repStats: Record<
    string,
    { total: number; count: number; weighted: number; avgPQS: number; target: number }
  > = {};
  deals.forEach((d) => {
    if (!repStats[d.rep])
      repStats[d.rep] = {
        total: 0,
        count: 0,
        weighted: 0,
        avgPQS: 0,
        target: DEFAULT_REP_TARGETS[d.rep] || 800000,
      };
    repStats[d.rep].total += d.acv;
    repStats[d.rep].count++;
    repStats[d.rep].weighted += d.acv * d.probabilities.win;
    repStats[d.rep].avgPQS += d.pqScore;
  });
  const rows = Object.entries(repStats)
    .map(([rep, s]) => ({
      rep,
      ...s,
      avgPQS: Math.round(s.avgPQS / s.count),
      attainment: Math.round((s.weighted / s.target) * 100),
    }))
    .sort((a, b) => b.attainment - a.attainment);

  return {
    promptId: 'benchmark-team-metrics',
    promptName: 'Team Benchmarks',
    generatedAt: new Date(),
    confidence: 0.91,
    dataSourcesUsed: ['Pipeline Data', 'Sales Targets', 'PQS Scores'],
    actions: [],
    content: `## Team Benchmarks\n\n| Rep | Pipeline | Deals | Weighted | Target | Attain% | Avg PQS |\n|-----|----------|-------|----------|--------|---------|--------|\n${rows.map((r) => `| ${r.rep} | ${fmt(r.total)} | ${r.count} | ${fmt(r.weighted)} | ${fmt(r.target)} | ${r.attainment}% | ${r.avgPQS} |`).join('\n')}\n\n### Key Observations\n- **Top performer:** ${rows[0]?.rep} at ${rows[0]?.attainment}% attainment\n- **Needs attention:** ${rows[rows.length - 1]?.rep} at ${rows[rows.length - 1]?.attainment}% attainment\n- **Team avg PQS:** ${Math.round(rows.reduce((s, r) => s + r.avgPQS, 0) / rows.length)}\n- **Coverage spread:** ${rows[0]?.attainment - rows[rows.length - 1]?.attainment}pp gap between best and worst`,
  };
}

function generateRepComparison(): PromptOutput {
  const deals = pipelineDeals;
  const repData: Record<
    string,
    { acv: number; count: number; pqs: number; wins: number; atRisk: number }
  > = {};
  deals.forEach((d) => {
    if (!repData[d.rep]) repData[d.rep] = { acv: 0, count: 0, pqs: 0, wins: 0, atRisk: 0 };
    repData[d.rep].acv += d.acv;
    repData[d.rep].count++;
    repData[d.rep].pqs += d.pqScore;
    if (d.probabilities.win > 0.6) repData[d.rep].wins++;
    if (d.pqScore < 40) repData[d.rep].atRisk++;
  });
  const sorted = Object.entries(repData)
    .map(([rep, d]) => ({
      rep,
      ...d,
      avgPQS: Math.round(d.pqs / d.count),
      avgDeal: d.acv / d.count,
    }))
    .sort((a, b) => b.acv - a.acv);

  return {
    promptId: 'compare-team-rep-performance',
    promptName: 'Rep Performance Comparison',
    generatedAt: new Date(),
    confidence: 0.89,
    dataSourcesUsed: ['Pipeline Data', 'PQS Scores', 'Win Probability Model'],
    actions: [],
    content: `## Rep Performance Comparison\n\n${sorted.map((r, i) => `### ${i + 1}. ${r.rep}\n- Pipeline: ${fmt(r.acv)} (${r.count} deals, avg ${fmt(r.avgDeal)})\n- Quality: PQS ${r.avgPQS} · ${r.wins} high-probability deals · ${r.atRisk} at-risk\n`).join('\n')}\n### Analysis\n- **Largest pipeline:** ${sorted[0]?.rep} (${fmt(sorted[0]?.acv)})\n- **Highest quality:** ${[...sorted].sort((a, b) => b.avgPQS - a.avgPQS)[0]?.rep} (PQS ${[...sorted].sort((a, b) => b.avgPQS - a.avgPQS)[0]?.avgPQS})\n- **Most at-risk deals:** ${[...sorted].sort((a, b) => b.atRisk - a.atRisk)[0]?.rep} (${[...sorted].sort((a, b) => b.atRisk - a.atRisk)[0]?.atRisk} deals)`,
  };
}

function generateMonthlySalesSnapshot(): PromptOutput {
  const deals = pipelineDeals;
  const total = deals.reduce((s, d) => s + d.acv, 0);
  const target = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const weighted = deals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const avgPQS = Math.round(deals.reduce((s, d) => s + d.pqScore, 0) / deals.length);
  const byStage: Record<string, { count: number; acv: number }> = {};
  deals.forEach((d) => {
    if (!byStage[d.stage]) byStage[d.stage] = { count: 0, acv: 0 };
    byStage[d.stage].count++;
    byStage[d.stage].acv += d.acv;
  });
  const atRisk = deals.filter((d) => d.pqScore < 40);
  const stalled = deals.filter((d) => d.daysInStage > 20);

  return {
    promptId: 'compile-monthly-sales-snapshot',
    promptName: 'Monthly Sales Snapshot',
    generatedAt: new Date(),
    confidence: 0.92,
    dataSourcesUsed: ['Pipeline Data', 'Stage Metrics', 'PQS Scores', 'Sales Targets'],
    actions: [],
    content: `## Monthly Sales Snapshot\n\n### Pipeline Summary\n| Metric | Value |\n|--------|-------|\n| Total Pipeline | ${fmt(total)} |\n| Weighted Forecast | ${fmt(weighted)} |\n| Team Target | ${fmt(target)} |\n| Coverage | ${(total / target).toFixed(1)}x |\n| Avg PQS | ${avgPQS} |\n| Deal Count | ${deals.length} |\n\n### Stage Distribution\n${Object.entries(
      byStage
    )
      .map(([stage, d]) => `- **${stage}:** ${d.count} deals · ${fmt(d.acv)}`)
      .join(
        '\n'
      )}\n\n### Health Indicators\n- 🔴 At-risk deals (PQS < 40): **${atRisk.length}** (${fmt(atRisk.reduce((s, d) => s + d.acv, 0))} exposure)\n- ⚠️ Stalled deals (20+ days): **${stalled.length}**\n- ✅ High-probability (>60% win): **${deals.filter((d) => d.probabilities.win > 0.6).length}** deals\n\n### Trend Indicators\n- Pipeline ${total > target * 3 ? 'strong' : total > target * 2 ? 'adequate' : 'needs attention'} at ${(total / target).toFixed(1)}x coverage\n- Average deal quality is ${avgPQS > 55 ? 'healthy' : avgPQS > 40 ? 'moderate' : 'concerning'} (PQS ${avgPQS})`,
  };
}

function generateEarlyWarnings(): PromptOutput {
  const deals = pipelineDeals;
  const warnings: { severity: string; signal: string; deals: string[] }[] = [];

  const declining = deals.filter((d) => d.pqScore < 35 && d.acv > 80000);
  if (declining.length > 0)
    warnings.push({
      severity: '🔴 Critical',
      signal: `${declining.length} high-value deals below PQS 35`,
      deals: declining.map((d) => d.company),
    });

  const stalledLate = deals.filter(
    (d) => d.daysInStage > 25 && (d.stage === 'Proposal' || d.stage === 'Negotiation')
  );
  if (stalledLate.length > 0)
    warnings.push({
      severity: '🔴 Critical',
      signal: `${stalledLate.length} late-stage deals stalled 25+ days`,
      deals: stalledLate.map((d) => d.company),
    });

  const noEB = deals.filter(
    (d) =>
      d.personaGaps.some((g) => g.includes('Economic Buyer')) &&
      d.stage !== 'Discovery' &&
      d.acv > 100000
  );
  if (noEB.length > 0)
    warnings.push({
      severity: '⚠️ High',
      signal: `${noEB.length} deals past Discovery missing Economic Buyer`,
      deals: noEB.map((d) => d.company),
    });

  const highSlip = deals.filter(
    (d) => d.forecastCategory === 'Commit' && d.probabilities.slip > 0.3
  );
  if (highSlip.length > 0)
    warnings.push({
      severity: '⚠️ High',
      signal: `${highSlip.length} commit deals with >30% slip risk`,
      deals: highSlip.map((d) => d.company),
    });

  const gapDeals = deals.filter((d) => d.personaGaps.length >= 3);
  if (gapDeals.length > 0)
    warnings.push({
      severity: '🟡 Medium',
      signal: `${gapDeals.length} deals with 3+ persona gaps`,
      deals: gapDeals.map((d) => d.company),
    });

  return {
    promptId: 'detect-early-warning-signals',
    promptName: 'Early Warning Signals',
    generatedAt: new Date(),
    confidence: 0.87,
    dataSourcesUsed: ['PQS Scores', 'Stage Velocity', 'Persona Coverage', 'Probability Model'],
    actions: declining.slice(0, 2).map((d) => ({
      id: `act_${d.id}_warn`,
      label: `Escalate: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Early warning: PQS ${d.pqScore}, requires immediate attention`,
    })),
    content: `## Early Warning Signals\n\n**${warnings.length} active warnings detected**\n\n${warnings.map((w) => `### ${w.severity}: ${w.signal}\nDeals: ${w.deals.slice(0, 4).join(', ')}${w.deals.length > 4 ? ` (+${w.deals.length - 4} more)` : ''}`).join('\n\n')}\n\n### Recommended Actions\n${
      warnings.length > 0
        ? warnings
            .slice(0, 3)
            .map(
              (w, i) =>
                `${i + 1}. Address "${w.signal}" — ${w.deals.length > 2 ? 'Schedule team triage' : `Review ${w.deals[0]} directly`}`
            )
            .join('\n')
        : '- No critical warnings at this time.'
    }`,
  };
}

function generateRepPerformance(repName: string): PromptOutput {
  const repDeals = pipelineDeals.filter((d) => d.rep === repName);
  const target = DEFAULT_REP_TARGETS[repName] || 800000;
  const totalACV = repDeals.reduce((s, d) => s + d.acv, 0);
  const weighted = repDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const avgPQS =
    repDeals.length > 0
      ? Math.round(repDeals.reduce((s, d) => s + d.pqScore, 0) / repDeals.length)
      : 0;
  const atRisk = repDeals.filter((d) => d.pqScore < 40);
  const topDeals = [...repDeals].sort((a, b) => b.acv - a.acv).slice(0, 5);

  return {
    promptId: 'summarize-rep-performance',
    promptName: `Performance Summary — ${repName}`,
    generatedAt: new Date(),
    confidence: 0.88,
    dataSourcesUsed: ['Rep Pipeline', 'PQS Scores', 'Sales Targets', 'Stage Velocity'],
    actions: [],
    content: `## Performance Summary: ${repName}\n\n| Metric | Value |\n|--------|-------|\n| Pipeline | ${fmt(totalACV)} (${repDeals.length} deals) |\n| Weighted | ${fmt(weighted)} |\n| Target | ${fmt(target)} |\n| Attainment | ${Math.round((weighted / target) * 100)}% |\n| Avg PQS | ${avgPQS} |\n| At-Risk | ${atRisk.length} deals |\n\n### Top Deals\n${topDeals.map((d, i) => `${i + 1}. **${d.company}** — ${fmt(d.acv)} · ${d.stage} · PQS ${d.pqScore} (${d.grade})`).join('\n')}\n\n### Strengths\n${avgPQS > 55 ? '- Strong deal qualification (PQS ' + avgPQS + ')' : ''}${totalACV > target * 2.5 ? '\n- Excellent pipeline coverage' : ''}${atRisk.length === 0 ? '\n- No at-risk deals — clean pipeline' : ''}\n\n### Areas for Development\n${avgPQS < 50 ? '- Deal quality needs improvement (PQS ' + avgPQS + ' below 50 benchmark)' : ''}${atRisk.length > 2 ? '\n- ' + atRisk.length + ' at-risk deals requiring attention' : ''}${totalACV < target * 2 ? '\n- Pipeline coverage below 2x target — needs generation focus' : ''}`,
  };
}

function generateWinLossInsights(): PromptOutput {
  const deals = pipelineDeals;
  const highWin = deals.filter((d) => d.probabilities.win > 0.6).sort((a, b) => b.acv - a.acv);
  const highLoss = deals.filter((d) => d.probabilities.loss > 0.4).sort((a, b) => b.acv - a.acv);

  const winPatterns = [
    highWin.filter((d) => d.personaGaps.length === 0).length > 0 &&
      'Full persona coverage drives wins',
    highWin.filter((d) => d.pqScore > 60).length > 0 &&
      'High PQS (60+) correlates with win probability',
    highWin.filter((d) => d.daysInStage < 15).length > 0 &&
      'Faster stage velocity improves outcomes',
  ].filter(Boolean);

  const lossPatterns = [
    highLoss.filter((d) => d.personaGaps.some((g) => g.includes('Economic Buyer'))).length > 0 &&
      'Missing Economic Buyer is primary loss driver',
    highLoss.filter((d) => d.daysInStage > 20).length > 0 && 'Stalled deals tend to lose',
    highLoss.filter((d) => d.competitor).length > 0 &&
      'Competitive deals with incomplete coverage lose',
  ].filter(Boolean);

  return {
    promptId: 'extract-win-loss-insights',
    promptName: 'Win/Loss Pattern Analysis',
    generatedAt: new Date(),
    confidence: 0.83,
    dataSourcesUsed: [
      'Pipeline Data',
      'Win Probability Model',
      'Persona Coverage',
      'Competitor Data',
    ],
    actions: [],
    content: `## Win/Loss Pattern Analysis\n\n### Winning Patterns (${highWin.length} high-probability deals)\n${winPatterns.map((p) => `- ✅ ${p}`).join('\n')}\n\nExample wins:\n${highWin
      .slice(0, 3)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — ${Math.round(d.probabilities.win * 100)}% win, PQS ${d.pqScore}`
      )
      .join(
        '\n'
      )}\n\n### Loss Patterns (${highLoss.length} high-risk deals)\n${lossPatterns.map((p) => `- ❌ ${p}`).join('\n')}\n\nExample at-risk:\n${highLoss
      .slice(0, 3)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — ${Math.round(d.probabilities.loss * 100)}% loss risk, gaps: ${d.personaGaps.join(', ') || 'none'}`
      )
      .join(
        '\n'
      )}\n\n### Key Insight\nThe strongest predictor of deal outcome is persona coverage. Deals with full MEDDIC engagement win at significantly higher rates. Focus coaching on Economic Buyer engagement and multi-threading.`,
  };
}

function generateChurnSummary(): PromptOutput {
  const deals = pipelineDeals;
  const churning = deals.filter(
    (d) => d.probabilities.loss > 0.5 && d.forecastCategory !== 'Pipeline'
  );
  const expansion = deals.filter((d) => d.probabilities.win > 0.6 && d.segment === 'Enterprise');

  return {
    promptId: 'summarize-recent-churn',
    promptName: 'Churn & Retention Summary',
    generatedAt: new Date(),
    confidence: 0.84,
    dataSourcesUsed: ['Pipeline Data', 'Loss Probability Model', 'Segment Data'],
    actions: churning.slice(0, 2).map((d) => ({
      id: `act_${d.id}_save`,
      label: `Save plan: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Churn risk intervention: ${Math.round(d.probabilities.loss * 100)}% loss probability`,
    })),
    content: `## Churn & Retention Summary\n\n**At-risk of loss:** ${churning.length} deals (${fmt(churning.reduce((s, d) => s + d.acv, 0))})\n**Expansion potential:** ${expansion.length} Enterprise deals with high win prob\n\n### Highest Churn Risk\n${churning
      .slice(0, 5)
      .map(
        (d, i) =>
          `${i + 1}. **${d.company}** — ${fmt(d.acv)} · ${Math.round(d.probabilities.loss * 100)}% loss risk\n   Issues: ${d.personaGaps.length > 0 ? d.personaGaps.join(', ') : 'PQS ' + d.pqScore}`
      )
      .join('\n')}\n\n### Expansion Opportunities\n${expansion
      .slice(0, 3)
      .map(
        (d) => `- **${d.company}** — ${fmt(d.acv)} · ${Math.round(d.probabilities.win * 100)}% win`
      )
      .join(
        '\n'
      )}\n\n### Retention Actions\n1. Intervene on top 3 churn-risk deals immediately\n2. Schedule QBRs with at-risk accounts\n3. Accelerate expansion conversations with healthy Enterprise accounts`,
  };
}

function generateForecastShortfallMitigation(): PromptOutput {
  const deals = pipelineDeals;
  const target = Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0);
  const commitTotal = deals
    .filter((d) => d.forecastCategory === 'Commit')
    .reduce((s, d) => s + d.acv, 0);
  const gap = target - commitTotal;
  const bestCase = deals
    .filter((d) => d.forecastCategory === 'Best Case')
    .sort((a, b) => b.acv * b.probabilities.win - a.acv * a.probabilities.win);
  const pullForward = deals
    .filter((d) => d.forecastCategory === 'Pipeline' && d.probabilities.win > 0.35 && d.acv > 80000)
    .sort((a, b) => b.acv - a.acv);

  return {
    promptId: 'mitigation-plan-forecast-shortfall',
    promptName: 'Forecast Shortfall Mitigation',
    generatedAt: new Date(),
    confidence: 0.85,
    dataSourcesUsed: ['Pipeline Data', 'Probability Model', 'Sales Targets'],
    actions: bestCase.slice(0, 2).map((d) => ({
      id: `act_${d.id}_promote`,
      label: `Promote: ${d.company}`,
      type: 'crm-task' as const,
      dealId: d.id,
      payload: `Review for promotion from Best Case to Commit`,
    })),
    content: `## Forecast Shortfall Mitigation Plan\n\n**Gap:** ${gap > 0 ? fmt(gap) : '✅ No gap — target covered'} · **Target:** ${fmt(target)} · **Commit:** ${fmt(commitTotal)}\n\n### Strategy 1: Promote Best Case → Commit\n${bestCase
      .slice(0, 5)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — ${Math.round(d.probabilities.win * 100)}% win · What's needed: ${d.missingSteps[0] || d.personaGaps[0] || 'Final approval'}`
      )
      .join(
        '\n'
      )}\nPotential uplift: ${fmt(bestCase.slice(0, 5).reduce((s, d) => s + d.acv, 0))}\n\n### Strategy 2: Accelerate Pipeline Deals\n${pullForward
      .slice(0, 3)
      .map(
        (d) =>
          `- **${d.company}** (${fmt(d.acv)}) — Fast-track by resolving: ${d.missingSteps[0] || 'stage exit criteria'}`
      )
      .join(
        '\n'
      )}\n\n### Strategy 3: Protect Existing Commits\n- Review all commits with slip risk > 25% (${deals.filter((d) => d.forecastCategory === 'Commit' && d.probabilities.slip > 0.25).length} deals)\n- Assign executive sponsors to top 3 deals by value\n- Daily check-ins on deals closing this week\n\n### 2-Week Sprint Plan\nWeek 1: Focus on Best Case promotions + protect commits\nWeek 2: Pipeline acceleration + close execution`,
  };
}

function generateWeeklyPipelineChanges(): PromptOutput {
  const deals = pipelineDeals;
  const total = deals.reduce((s, d) => s + d.acv, 0);
  const byStage: Record<string, { count: number; acv: number }> = {};
  deals.forEach((d) => {
    if (!byStage[d.stage]) byStage[d.stage] = { count: 0, acv: 0 };
    byStage[d.stage].count++;
    byStage[d.stage].acv += d.acv;
  });
  const newInStage = deals.filter((d) => d.daysInStage <= 7);
  const stalled = deals.filter((d) => d.daysInStage > 20);

  return {
    promptId: 'summarize-weekly-pipeline-changes',
    promptName: 'Weekly Pipeline Changes',
    generatedAt: new Date(),
    confidence: 0.86,
    dataSourcesUsed: ['Pipeline Data', 'Stage Velocity'],
    actions: [],
    content: `## Weekly Pipeline Summary\n\n**Total Pipeline:** ${fmt(total)} · **${deals.length} deals**\n\n### Stage Distribution\n${Object.entries(
      byStage
    )
      .map(([stage, d]) => `- **${stage}:** ${d.count} deals · ${fmt(d.acv)}`)
      .join('\n')}\n\n### Recent Movement (entered current stage ≤7 days ago)\n${
      newInStage
        .slice(0, 5)
        .map((d) => `- **${d.company}** → ${d.stage} (${fmt(d.acv)}) — Day ${d.daysInStage}`)
        .join('\n') || '- No recent stage movements detected'
    }\n\n### Attention Needed\n- **Stalled (20+ days):** ${stalled.length} deals (${fmt(stalled.reduce((s, d) => s + d.acv, 0))})\n- **At-risk (PQS < 40):** ${deals.filter((d) => d.pqScore < 40).length} deals\n\n### Pipeline Health\n- Coverage: ${(total / Object.values(DEFAULT_REP_TARGETS).reduce((s, t) => s + t, 0)).toFixed(1)}x target\n- Avg PQS: ${Math.round(deals.reduce((s, d) => s + d.pqScore, 0) / deals.length)}`,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getAvailablePrompts(
  deal?: Deal
): { prompt: PromptEntry; relevance: 'high' | 'medium' | 'low' }[] {
  return PROMPT_LIBRARY.map((prompt) => {
    let relevance: 'high' | 'medium' | 'low' = 'medium';

    if (!deal) {
      // Pipeline-level relevance
      if (
        [
          'flag-high-risk-deals',
          'summarize-forecast-for-execs',
          'identify-pipeline-coverage-gaps',
          'spot-stagnant-deals',
        ].includes(prompt.id)
      ) {
        relevance = 'high';
      }
    } else {
      // Deal-level relevance
      if (prompt.id === 'assess-meddic-completeness' && deal.personaGaps.length > 0)
        relevance = 'high';
      if (prompt.id === 'flag-high-risk-deals' && deal.pqScore < 45) relevance = 'high';
      if (
        prompt.id === 'create-win-strategy-plan' &&
        (deal.stage === 'Proposal' || deal.stage === 'Negotiation')
      )
        relevance = 'high';
      if (prompt.id === 'prepare-executive-summary-deal' && deal.acv > 100000) relevance = 'high';
      if (prompt.id === 'spot-stagnant-deals' && deal.daysInStage > 15) relevance = 'high';
    }

    return { prompt, relevance };
  }).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.relevance] - order[b.relevance];
  });
}

// ---------------------------------------------------------------------------
// Customer meeting prep (rep-facing, stage-aligned)
// ---------------------------------------------------------------------------

const MEETING_TYPE_LABELS: Record<string, string> = {
  'discovery-call': 'Discovery Call',
  'technical-demo': 'Technical Demo',
  'proposal-review': 'Proposal & ROI Review',
  'price-negotiation': 'Price Negotiation',
  'stakeholder-meeting': 'Stakeholder / Executive Meeting',
};

function generateCustomerMeetingPrep(deal: Deal, meetingType: string): PromptOutput {
  const playbook = SALES_PLAYBOOK.find((s) => s.stage === deal.stage);
  const comp = deal.competitor
    ? COMPETITORS.find((c) => c.name.toLowerCase().includes(deal.competitor!.toLowerCase()))
    : null;
  const icp = ICP_PROFILES.find((p) => p.segment === deal.segment);
  const hasEB = !deal.personaGaps.some((g) => g.includes('Economic Buyer'));
  const hasChamp = !deal.personaGaps.some((g) => g.includes('Champion') || g.includes('Executive'));
  const objections = COMMON_OBJECTIONS.slice(0, 3);
  const mtLabel = MEETING_TYPE_LABELS[meetingType] || 'Customer Meeting';

  let content = `## ${mtLabel}: ${deal.company}\n\n`;
  content += `**${fmt(deal.acv)}** · ${deal.stage} · ${deal.segment} · ${deal.productBundle} · ${deal.cameraCount} cameras\n`;
  content += `**Close Date:** ${deal.closeDate} · **PQS:** ${deal.pqScore} (${deal.grade}) · **Days in Stage:** ${deal.daysInStage}\n\n`;

  // Stage-specific sections
  switch (meetingType) {
    case 'discovery-call': {
      const personas = BUYER_PERSONAS.slice(0, 4);
      content += `### Meeting Objective\nValidate project scope, identify stakeholders, and confirm Evercam can add value to their ${deal.projectType} project.\n\n`;
      content += `### Research Summary\n`;
      content += `- **Company:** ${deal.company} (${deal.segment})\n`;
      content += `- **Project Type:** ${deal.projectType}\n`;
      content += `- **ICP Fit:** ${icp ? `${icp.name} — ${Math.round(icp.historicalWinRate * 100)}% historical win rate` : 'Standard fit'}\n`;
      content += `- **Source:** ${deal.source}${deal.channelPartner ? ` via ${deal.channelPartner}` : ''}\n\n`;
      content += `### Qualifying Questions\n`;
      content += `1. How many active project sites do you currently manage?\n`;
      content += `2. What's your current approach to site monitoring and progress documentation?\n`;
      content += `3. Who are the key stakeholders involved in technology decisions for this project?\n`;
      content += `4. What's the project timeline and when would you need cameras deployed?\n`;
      content += `5. Have you budgeted for site monitoring technology this year?\n\n`;
      content += `### Stakeholders to Identify\n`;
      content += personas.map((p) => `- **${p.title}** — ${p.priorities[0]}`).join('\n');
      content += `\n\n### Exit Criteria (Before Moving to Qualification)\n`;
      content += playbook
        ? playbook.exitCriteria.map((c) => `- ${c}`).join('\n')
        : '- Complete discovery assessment';
      break;
    }
    case 'technical-demo': {
      content += `### Demo Objective\nShowcase Evercam's solution mapped to ${deal.company}'s specific ${deal.projectType} requirements. Get decision-maker buy-in.\n\n`;
      content += `### Tailored Demo Script\n`;
      content += `1. **Open (5 min):** Recap discovery findings — confirm their pain: "${deal.projectType} monitoring"\n`;
      content += `2. **Live Demo (20 min):** Show ${deal.productBundle} features:\n`;
      content += `   - Camera placement for ${deal.cameraCount} units on ${deal.projectType} site\n`;
      content += `   - AI-powered progress tracking and time-lapse\n`;
      content += `   - Safety monitoring and incident detection\n`;
      content += `   - Mobile app and stakeholder sharing\n`;
      content += `3. **ROI (10 min):** Frame value in their terms:\n`;
      content += `   - Dispute avoidance: Show documented progress evidence\n`;
      content += `   - Travel reduction: Remote site monitoring saves site visits\n`;
      content += `   - Marketing value: Time-lapse content for stakeholders\n`;
      content += `4. **Close (5 min):** Agree next steps and timeline for proposal\n\n`;
      content += `### Competitive Positioning\n`;
      if (comp) {
        content += `- **vs ${comp.name}:** ${comp.battlecard
          .slice(0, 3)
          .map((b) => b)
          .join('; ')}\n`;
        content += `- Win rate: ${Math.round(comp.evercamWinRate * 100)}% against ${comp.name}\n\n`;
      } else {
        content += `- No direct competitor flagged. Watch for DIY CCTV comparison — differentiate on construction-grade features.\n\n`;
      }
      content += `### MEDDIC Gaps to Address in This Meeting\n`;
      content +=
        deal.personaGaps.length > 0
          ? deal.personaGaps.map((g) => `- ⚠️ ${g} — not yet engaged`).join('\n')
          : '- All key personas engaged';
      content += `\n\n### Required Attendees\n`;
      content += playbook
        ? playbook.requiredPersonas.map((p) => `- ${p}`).join('\n')
        : '- Decision maker + technical evaluator';
      break;
    }
    case 'proposal-review': {
      content += `### Meeting Objective\nPresent formal proposal, walk through pricing and ROI business case, and address commercial objections.\n\n`;
      content += `### Proposal Summary\n`;
      content += `| Item | Detail |\n|------|--------|\n`;
      content += `| Product | ${deal.productBundle} |\n`;
      content += `| Cameras | ${deal.cameraCount} units |\n`;
      content += `| ACV | ${fmt(deal.acv)} |\n`;
      content += `| Contract | ${deal.contractType} (${deal.contractLength} months) |\n`;
      content += `| Discount | ${deal.discountPct > 0 ? `${deal.discountPct}%${deal.discountApprover ? ` (approved by ${deal.discountApprover})` : ' (needs approval)'}` : 'None'} |\n\n`;
      content += `### ROI Talking Points\n`;
      content += `1. **Dispute Avoidance:** Documented visual evidence prevents claims — typical saving ${deal.segment === 'Enterprise' ? '€50-200K' : '€10-50K'} per project\n`;
      content += `2. **Travel Reduction:** Remote monitoring reduces site visits by 40-60% — ${deal.cameraCount} cameras across the project\n`;
      content += `3. **Progress Accountability:** AI time-lapse provides stakeholder transparency without manual reporting\n`;
      content += `4. **Safety Compliance:** Real-time monitoring supports ISO 45001 / H&S obligations\n\n`;
      content += `### Economic Buyer Strategy\n`;
      content += hasEB
        ? `- EB is engaged. Ensure ROI calculator is reviewed with them before this meeting.\n- Frame as investment protection, not expense.\n`
        : `- ⚠️ **EB not yet engaged.** Before this meeting:\n  1. Ask champion for intro to finance/CFO\n  2. Position as "protecting the project budget"\n  3. Bring project-specific ROI numbers\n`;
      content += `\n### Objection Prep\n`;
      content += objections
        .map((o) => `- **"${o.objection}"**\n  Response: ${o.response}`)
        .join('\n');
      break;
    }
    case 'price-negotiation': {
      content += `### Negotiation Objective\nFinalize commercial terms, protect margins, and secure commitment with a clear deployment date.\n\n`;
      content += `### Commercial Position\n`;
      content += `| Parameter | Value |\n|-----------|-------|\n`;
      content += `| List Price | ${fmt(deal.acv)} |\n`;
      content += `| Current Discount | ${deal.discountPct}% |\n`;
      content += `| Contract Type | ${deal.contractType} (${deal.contractLength}mo) |\n`;
      content += `| Price Risk Score | ${Math.round(deal.priceRisk * 100)}% |\n`;
      content += `| Renewal Probability | ${Math.round(deal.renewalProbability * 100)}% |\n\n`;
      content += `### Negotiation Strategy\n`;
      content += `**Anchoring:** Start from list price. Frame discount only as value exchange:\n`;
      content += `- Multi-year commitment → additional discount authority\n`;
      content += `- Volume (${deal.cameraCount}+ cameras) → volume pricing tier\n`;
      content += `- Reference case study agreement → marketing discount\n\n`;
      content += `**Walk-Away Boundaries:**\n`;
      content += `- Max discount: ${deal.segment === 'Enterprise' ? '15%' : deal.segment === 'Mid-Market' ? '10%' : '5%'} (requires ${deal.segment === 'Enterprise' ? 'VP' : 'Manager'} approval above this)\n`;
      content += `- Contract minimum: ${deal.segment === 'Enterprise' ? '24' : '12'} months\n`;
      content += `- Payment terms: Net 30 standard, Net 60 for Enterprise only\n\n`;
      content += `**Value Levers (Instead of Discount):**\n`;
      content += `1. Extended onboarding support (2 extra weeks)\n`;
      content += `2. Additional camera deployment for pilot site\n`;
      content += `3. Priority technical support tier\n`;
      content += `4. Custom time-lapse production for stakeholders\n\n`;
      content += `### Closing Checklist\n`;
      content += `- [ ] Commercial terms agreed\n`;
      content += `- [ ] Deployment date confirmed\n`;
      content += `- [ ] Contract reviewed by their legal (if required)\n`;
      content += `- [ ] PO / signature timeline agreed\n`;
      content += `- [ ] Onboarding kickoff scheduled`;
      break;
    }
    case 'stakeholder-meeting': {
      content += `### Meeting Objective\nSecure executive-level sponsorship and remove escalation blockers. Frame Evercam as a strategic investment, not a line-item expense.\n\n`;
      content += `### Executive Briefing\n`;
      content += `**Company:** ${deal.company} · **Segment:** ${deal.segment}\n`;
      content += `**Project:** ${deal.projectType} · **Investment:** ${fmt(deal.acv)}\n`;
      content += `**Current Stage:** ${deal.stage} · **Win Probability:** ${Math.round(deal.probabilities.win * 100)}%\n\n`;
      content += `### Strategic Value Proposition\n`;
      content += `Frame for the executive audience — focus on business outcomes, not features:\n\n`;
      content += `1. **Risk Mitigation:** Visual documentation protects against disputes and claims\n`;
      content += `2. **Operational Efficiency:** Remote monitoring reduces travel and manual reporting\n`;
      content += `3. **Stakeholder Transparency:** Real-time project visibility for investors, planners, and regulators\n`;
      content += `4. **Compliance:** Supports health & safety obligations with continuous monitoring\n\n`;
      content += `### Stakeholder Map\n`;
      content += `| Persona | Status | Action Needed |\n|---------|--------|---------------|\n`;
      content += hasChamp
        ? `| Champion | ✅ Engaged | Leverage for executive intro |\n`
        : `| Champion | ⚠️ Not identified | Find internal advocate |\n`;
      content += hasEB
        ? `| Economic Buyer | ✅ Engaged | Present ROI in this meeting |\n`
        : `| Economic Buyer | ❌ Not engaged | **Primary goal of this meeting** |\n`;
      content += deal.personaGaps
        .filter(
          (g) => !g.includes('Economic') && !g.includes('Champion') && !g.includes('Executive')
        )
        .map((g) => `| ${g} | ⚠️ Gap | Plan engagement |\n`)
        .join('');
      content += `\n### Conversation Framework\n`;
      content += `1. **Open:** "We've been working with your ${deal.projectType} team on [project]. I wanted to share how this fits your broader portfolio strategy."\n`;
      content += `2. **Value:** Share 2-3 reference customers in similar ${deal.segment} projects\n`;
      content += `3. **Ask:** Confirm executive sponsorship + timeline for decision\n`;
      content += `4. **Close:** Agree next steps with specific dates\n\n`;
      content += `### Risk Mitigation\n`;
      content += `- **Slip Risk:** ${Math.round(deal.probabilities.slip * 100)}%${deal.probabilities.slip > 0.25 ? ' ⚠️ Address timeline concerns proactively' : ''}\n`;
      content += `- **No-Decision Risk:** ${Math.round(deal.probabilities.noDecision * 100)}%${deal.probabilities.noDecision > 0.2 ? ' — Create urgency with project timeline alignment' : ''}\n`;
      content += `- **Missing Steps:** ${deal.missingSteps.length > 0 ? deal.missingSteps.join(', ') : 'On track'}`;
      break;
    }
    default:
      content += `Meeting prep for ${deal.company}. Select a specific meeting type for tailored guidance.`;
  }

  content += `\n\n### Next Actions\n${deal.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

  return {
    promptId: 'customer-meeting-prep',
    promptName: `${mtLabel} — ${deal.company}`,
    generatedAt: new Date(),
    dealContext: { id: deal.id, company: deal.company },
    confidence: 0.87,
    dataSourcesUsed: [
      'Deal Data',
      'MEDDIC Framework',
      'Sales Playbook',
      'Competitor Intel',
      'ICP Profiles',
      'Objection Library',
    ],
    actions: [
      {
        id: `act_${deal.id}_meeting_note`,
        label: `Log meeting prep to Zoho`,
        type: 'crm-note' as const,
        dealId: deal.id,
        payload: `${mtLabel} prep generated by RevOS AI`,
      },
      {
        id: `act_${deal.id}_meeting_task`,
        label: `Create follow-up task`,
        type: 'crm-task' as const,
        dealId: deal.id,
        payload: `Follow up after ${mtLabel} with ${deal.company}`,
      },
    ],
    content,
  };
}

export async function executePrompt(
  promptId: string,
  deal?: Deal,
  repName?: string,
  meetingType?: string
): Promise<PromptOutput> {
  // Simulate AI processing time
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 1200));

  // Customer meeting prep (deal + meeting type)
  if (deal && promptId === 'customer-meeting-prep' && meetingType) {
    return generateCustomerMeetingPrep(deal, meetingType);
  }

  // Deal-level prompts
  if (deal) {
    switch (promptId) {
      case 'assess-meddic-completeness':
        return generateMEDDICAssessment(deal);
      case 'flag-high-risk-deals':
        return generateRiskAssessment(deal);
      case 'create-win-strategy-plan':
        return generateWinStrategy(deal);
      case 'prepare-executive-summary-deal':
        return generateExecutiveSummary(deal);
      default:
        return generateRiskAssessment(deal); // fallback
    }
  }

  // Rep-level prompts (need a rep name)
  if (
    repName ||
    [
      'summarize-rep-performance',
      'analyze-rep-call-patterns',
      'evaluate-rep-training-progress',
      'plan-coaching-grow-model',
      'give-feedback-sbi-framework',
      'prepare-1on1-agenda-template',
      'diagnose-underperformance-causes',
      'review-rep-performance-trend',
      'plan-difficult-performance-discussion',
      'draft-performance-improvement-plan',
      'setup-pip-support-monitoring',
      'customize-30-60-90-plan',
    ].includes(promptId)
  ) {
    const rep = repName || 'Conor Murphy';
    switch (promptId) {
      case 'prepare-1on1-agenda-template':
        return generateOneOnOnePrep(rep);
      case 'summarize-rep-performance':
      case 'analyze-rep-call-patterns':
      case 'evaluate-rep-training-progress':
      case 'diagnose-underperformance-causes':
      case 'review-rep-performance-trend':
      case 'plan-difficult-performance-discussion':
      case 'draft-performance-improvement-plan':
      case 'setup-pip-support-monitoring':
      case 'customize-30-60-90-plan':
        return generateRepPerformance(rep);
      case 'plan-coaching-grow-model':
      case 'give-feedback-sbi-framework':
        return generateOneOnOnePrep(rep);
      default:
        return generateRepPerformance(rep);
    }
  }

  // Pipeline-level prompts
  switch (promptId) {
    case 'summarize-forecast-for-execs':
      return generateForecastSummary();
    case 'identify-pipeline-coverage-gaps':
      return generatePipelineRiskReport();
    case 'quarter-end-closing-strategy':
      return generateQuarterEndStrategy();
    case 'mitigation-plan-forecast-shortfall':
      return generateForecastShortfallMitigation();
    case 'spot-stagnant-deals':
      return generateStagnantDeals();
    case 'highlight-top-opportunities':
      return generateTopOpportunities();
    case 'benchmark-team-metrics':
      return generateTeamBenchmarks();
    case 'compare-team-rep-performance':
      return generateRepComparison();
    case 'compile-monthly-sales-snapshot':
      return generateMonthlySalesSnapshot();
    case 'detect-early-warning-signals':
      return generateEarlyWarnings();
    case 'extract-win-loss-insights':
      return generateWinLossInsights();
    case 'summarize-recent-churn':
      return generateChurnSummary();
    case 'summarize-weekly-pipeline-changes':
      return generateWeeklyPipelineChanges();
    // Prompts that map well to existing generators
    case 'find-largest-forecast-variances':
    case 'identify-historical-forecast-bias':
    case 'compare-commit-pipeline-ai-forecast':
    case 'consolidate-team-forecast':
    case 'review-commit-deals-risk-signals':
    case 'organize-forecast-call-agenda':
    case 'advise-forecast-adjustments':
    case 'share-post-forecast-call-update':
    case 'explain-week-over-week-forecast-changes':
      return generateForecastSummary();
    case 'calculate-net-retention-drivers':
    case 'review-expansion-pipeline':
    case 'outline-churn-reduction-plan':
    case 'integrate-renewals-forecasting':
    case 'provide-expansion-sales-playbook':
      return generateChurnSummary();
    case 'recap-quarterly-performance':
    case 'analyze-quarterly-performance-drivers':
    case 'outline-qbr-presentation':
    case 'propose-next-quarter-initiatives':
    case 'draft-qbr-executive-summary':
      return generateTeamBenchmarks();
    case 'highlight-monthly-wins-challenges':
    case 'draft-monthly-performance-email':
    case 'provide-bi-dashboard-commentary':
    case 'update-rolling-forecast-request-support':
      return generateMonthlySalesSnapshot();
    case 'request-pipeline-data-update':
    case 'align-marketing-pipeline-gaps':
    case 'plan-pipeline-generation-boost':
    case 'set-pipeline-review-agenda':
    case 'find-stalled-deals-pipeline-call':
    case 'send-pipeline-meeting-followup':
    case 'provide-rep-pipeline-scorecards':
      return generatePipelineRiskReport();
    case 'compare-new-rep-ramp-benchmarks':
    case 'check-new-rep-enablement-engagement':
    case 'create-role-play-scenario':
    case 'request-onboarding-feedback':
    case 'evaluate-external-factors':
    case 'document-lost-deal-sbi':
      return generateWinLossInsights();
    default:
      return generateForecastSummary();
  }
}

export function getDealPromptSuggestions(deal: Deal): string[] {
  const suggestions: string[] = [];
  if (deal.personaGaps.length > 0) suggestions.push('assess-meddic-completeness');
  if (deal.pqScore < 45) suggestions.push('flag-high-risk-deals');
  if (deal.stage === 'Proposal' || deal.stage === 'Negotiation')
    suggestions.push('create-win-strategy-plan');
  if (deal.acv > 100000) suggestions.push('prepare-executive-summary-deal');
  return suggestions;
}
