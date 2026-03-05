import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCRM } from '@/contexts/CRMContext';
import { useRole } from '@/contexts/RoleContext';
import { pipelineDeals, Deal, SALES_MANAGERS, DEFAULT_REP_TARGETS } from '@/data/demo-data';
import { sanitizeHTML } from '@/lib/sanitize';
import { executePrompt, type PromptOutput } from '@/lib/prompt-executor';
import {
  X,
  Send,
  Sparkles,
  ArrowUpRight,
  Loader2,
  ChevronDown,
  FileText,
  CheckCircle,
  Zap,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: CopilotAction[];
}

interface CopilotAction {
  id: string;
  label: string;
  type: 'crm-note' | 'crm-task' | 'navigate' | 'coaching';
  dealId?: string;
  payload?: string;
  executed?: boolean;
}

// ---------------------------------------------------------------------------
// Context-Aware Suggested Questions — Role × Page matrix
// ---------------------------------------------------------------------------

/** Prompt access levels: who can trigger each prompt category */
type AccessLevel = 'all' | 'manager+' | 'exec+' | 'revops+';

const PROMPT_ACCESS: Record<string, AccessLevel> = {
  // Deal strategy — everyone can run these on their own deals
  'assess-meddic-completeness': 'all',
  'flag-high-risk-deals': 'all',
  'create-win-strategy-plan': 'all',
  'prepare-executive-summary-deal': 'all',
  'extract-win-loss-insights': 'all',
  'document-lost-deal-sbi': 'all',
  // Forecasting
  'summarize-forecast-for-execs': 'exec+',
  'quarter-end-closing-strategy': 'all',
  'mitigation-plan-forecast-shortfall': 'manager+',
  'find-largest-forecast-variances': 'manager+',
  'identify-historical-forecast-bias': 'manager+',
  'compare-commit-pipeline-ai-forecast': 'manager+',
  'consolidate-team-forecast': 'manager+',
  'review-commit-deals-risk-signals': 'manager+',
  'organize-forecast-call-agenda': 'manager+',
  'advise-forecast-adjustments': 'manager+',
  'share-post-forecast-call-update': 'manager+',
  'explain-week-over-week-forecast-changes': 'manager+',
  // Pipeline management
  'identify-pipeline-coverage-gaps': 'all',
  'spot-stagnant-deals': 'all',
  'request-pipeline-data-update': 'all',
  'align-marketing-pipeline-gaps': 'manager+',
  'plan-pipeline-generation-boost': 'all',
  'benchmark-team-metrics': 'manager+',
  'highlight-top-opportunities': 'all',
  'summarize-weekly-pipeline-changes': 'all',
  // Pipeline review meetings
  'set-pipeline-review-agenda': 'manager+',
  'find-stalled-deals-pipeline-call': 'manager+',
  'send-pipeline-meeting-followup': 'manager+',
  'provide-rep-pipeline-scorecards': 'manager+',
  // QBR — reps can access for their own book of business
  'outline-qbr-presentation': 'manager+',
  'recap-quarterly-performance': 'all',
  'analyze-quarterly-performance-drivers': 'all',
  'compare-team-rep-performance': 'manager+',
  'propose-next-quarter-initiatives': 'manager+',
  'draft-qbr-executive-summary': 'manager+',
  // Executive reporting
  'compile-monthly-sales-snapshot': 'exec+',
  'detect-early-warning-signals': 'manager+',
  'highlight-monthly-wins-challenges': 'exec+',
  'draft-monthly-performance-email': 'manager+',
  'provide-bi-dashboard-commentary': 'exec+',
  'update-rolling-forecast-request-support': 'exec+',
  // 1:1 Coaching — managers coach reps
  'prepare-1on1-agenda-template': 'manager+',
  'summarize-rep-performance': 'manager+',
  'analyze-rep-call-patterns': 'manager+',
  'evaluate-rep-training-progress': 'manager+',
  'plan-coaching-grow-model': 'manager+',
  'give-feedback-sbi-framework': 'manager+',
  // Onboarding
  'compare-new-rep-ramp-benchmarks': 'manager+',
  'check-new-rep-enablement-engagement': 'manager+',
  'customize-30-60-90-plan': 'manager+',
  'create-role-play-scenario': 'all',
  'request-onboarding-feedback': 'manager+',
  // Performance management
  'diagnose-underperformance-causes': 'manager+',
  'review-rep-performance-trend': 'manager+',
  'evaluate-external-factors': 'manager+',
  'plan-difficult-performance-discussion': 'manager+',
  'draft-performance-improvement-plan': 'manager+',
  'setup-pip-support-monitoring': 'manager+',
  // Churn & expansion
  'summarize-recent-churn': 'all',
  'calculate-net-retention-drivers': 'manager+',
  'review-expansion-pipeline': 'all',
  'outline-churn-reduction-plan': 'manager+',
  'integrate-renewals-forecasting': 'manager+',
  'provide-expansion-sales-playbook': 'all',
};

function canAccessPrompt(promptId: string, role: string): boolean {
  const level = PROMPT_ACCESS[promptId] || 'all';
  if (level === 'all') return true;
  if (level === 'manager+') return role !== 'rep';
  if (level === 'exec+') return role === 'exec' || role === 'revops' || role === 'admin';
  if (level === 'revops+') return role === 'revops' || role === 'admin';
  return true;
}

function getSuggestions(pathname: string, role: string): string[] {
  // ── Rep: focused on own deals and personal performance ──
  const repSuggestions: Record<string, string[]> = {
    '/': [
      'What should I focus on today?',
      'Run MEDDIC assessment on my top deal',
      'How is my pipeline health?',
      'Which of my deals are at risk?',
      'How do I compare to top performers?',
    ],
    '/pipeline': [
      'Show my pipeline health',
      'Which of my deals are stalled?',
      'What pipeline do I need to generate?',
      'Show my weekly pipeline changes',
      'Which deals should I advance this week?',
    ],
    '/deals': [
      'Run MEDDIC assessment on my top deal',
      'Create win strategy for my biggest deal',
      'Draft next steps for my top deal',
      'Which of my deals need EB engagement?',
      'Show my win/loss patterns',
    ],
    '/coaching': [
      'Recap my quarterly performance',
      'What coaching plays should I run on my deals?',
      'Help me multi-thread my biggest deal',
      'What are top performers doing differently?',
      'How can I improve my deal velocity?',
    ],
    '/risk': [
      'Which of my deals are most at risk?',
      'Show my stalled deals',
      'What persona gaps do I need to fill?',
      'Help me unblock my stuck deals',
      'What early warnings should I act on?',
    ],
    '/team': [
      'How do I compare to team benchmarks?',
      'What are top reps doing differently?',
      'Show team performance benchmarks',
    ],
    '/meeting-prep': [
      'Prep for my next customer meeting',
      'Create discovery call agenda',
      'Draft proposal talking points',
      'Prep for my deal review with manager',
      'Help me plan a competitive demo',
    ],
  };

  // ── Manager: team management, coaching, and pipeline oversight ──
  const managerSuggestions: Record<string, string[]> = {
    '/': [
      'Show team forecast vs target',
      'Which deals need my attention today?',
      'Detect early warning signals in my pipeline',
      'Show team pipeline health snapshot',
      'What coaching should I prioritise this week?',
    ],
    '/pipeline': [
      'Run team pipeline risk report',
      'Show stalled deals across my team',
      'Compare commit vs AI forecast',
      'Where are my coverage gaps?',
      'Show weekly pipeline changes for my team',
    ],
    '/deals': [
      'Run MEDDIC assessment on our top deal',
      'Which team deals are most at risk?',
      'Create win strategy for key deals',
      'Review commit deals with risk signals',
      'Show win/loss patterns for my team',
    ],
    '/coaching': [
      'Prep 1:1 for my lowest performer',
      "Compare my reps' performance",
      'Create coaching plan using GROW model',
      'Give SBI feedback for struggling rep',
      'Run team benchmarks',
    ],
    '/risk': [
      'Run pipeline risk report for my team',
      'Show early warning signals',
      'Which commit deals have risk signals?',
      'Review stalled deals over 20 days',
      'Run forecast shortfall mitigation plan',
    ],
    '/team': [
      'Run team benchmarks',
      'Compare rep performance side by side',
      "Who's tracking above quota?",
      'Draft monthly performance email',
      'Diagnose underperformance causes',
    ],
    '/meeting-prep': [
      'Prep for my pipeline review meeting',
      'Create forecast call agenda',
      'Prep 1:1 agenda for a rep',
      'Draft QBR talking points',
      'Prep for deal review with my VP',
    ],
  };

  // ── Exec: strategic view, forecasting, board reporting ──
  const execSuggestions: Record<string, string[]> = {
    '/': [
      'Run executive forecast summary',
      'Show monthly sales snapshot',
      'Detect early warning signals across pipeline',
      "What's the gap to target?",
      'Show competitive landscape overview',
    ],
    '/pipeline': [
      'Show pipeline coverage analysis',
      'Where are the biggest coverage gaps?',
      'Compare commit vs AI forecast',
      'Show pipeline movement trends',
      'Highlight top opportunities',
    ],
    '/deals': [
      'Prepare executive summary for key deals',
      'Which large deals are most at risk?',
      'Show win/loss pattern analysis',
      'Review commit deals with risk signals',
      'Show deal velocity trends',
    ],
    '/coaching': [
      'Compare team performance across the org',
      'Which teams need coaching attention?',
      'Review coaching effectiveness',
      'Who is ramping well vs behind?',
      'Propose next quarter initiatives',
    ],
    '/risk': [
      'Run pipeline risk report',
      'Show early warning signals across all teams',
      'Review commit deals with risk signals',
      'Run forecast shortfall mitigation plan',
      'Show competitive landscape',
    ],
    '/team': [
      'Run team benchmarks',
      'Compare rep performance across teams',
      "Who's tracking above quota?",
      'Draft monthly performance summary',
      'Propose next quarter initiatives',
    ],
    '/meeting-prep': [
      'Prep for board review',
      'Create QBR presentation outline',
      'Prep for forecast call',
      'Draft executive summary for leadership',
      'Create monthly sales snapshot',
    ],
  };

  // ── RevOps: data, model health, system config ──
  const revopsSuggestions: Record<string, string[]> = {
    '/': [
      'Show pipeline health snapshot',
      'Run forecast accuracy analysis',
      'Detect data hygiene issues',
      'Show PQS scoring distribution',
      'Compare forecast methodologies',
    ],
    '/pipeline': [
      'Run pipeline risk report',
      'Pipeline data hygiene check',
      'Show pipeline conversion rates',
      'Benchmark team metrics',
      'Identify coverage gaps',
    ],
    '/model': [
      'Show PQS model performance',
      'Review scoring accuracy',
      'Show grade distribution trends',
      'Compare actual vs predicted win rates',
      'Calibrate scoring weights',
    ],
    '/settings': [
      'Review current scoring configuration',
      'Show active feature flags',
      'Check API integration status',
    ],
    '/admin': ['Review system configuration', 'Check CRM sync status', 'Show user access overview'],
  };

  // Select the right map based on role
  let map: Record<string, string[]>;
  switch (role) {
    case 'rep':
      map = repSuggestions;
      break;
    case 'manager':
      map = managerSuggestions;
      break;
    case 'exec':
      map = execSuggestions;
      break;
    case 'revops':
    case 'admin':
      map = revopsSuggestions;
      break;
    default:
      map = managerSuggestions;
      break;
  }

  return map[pathname] || map['/'] || [];
}

// ---------------------------------------------------------------------------
// Map prompt executor output to copilot actions
// ---------------------------------------------------------------------------

function promptOutputToActions(output: PromptOutput): CopilotAction[] {
  return output.actions.map((a) => ({
    id: a.id,
    label: a.label,
    type:
      a.type === 'crm-note'
        ? ('crm-note' as const)
        : a.type === 'crm-task'
          ? ('crm-task' as const)
          : a.type === 'coaching-play'
            ? ('coaching' as const)
            : ('navigate' as const),
    dealId: a.dealId,
    payload: a.payload,
  }));
}

// Detect if a query should route to the prompt executor (role-filtered)
function matchPromptQuery(
  q: string,
  deals: Deal[],
  role: string
): { promptId: string; repName?: string; deal?: Deal } | null {
  const lower = q.toLowerCase();

  // Role-guarded helper: returns null if the user can't access this prompt
  function guard(
    promptId: string,
    result: Omit<{ promptId: string; repName?: string; deal?: Deal }, 'promptId'>
  ): { promptId: string; repName?: string; deal?: Deal } | null {
    if (!canAccessPrompt(promptId, role)) return null;
    return { promptId, ...result };
  }

  // ── Helper: find rep by name or attribute ──
  function findRep(): string | undefined {
    for (const mgr of SALES_MANAGERS) {
      for (const rep of mgr.team) {
        if (lower.includes(rep.toLowerCase())) return rep;
      }
    }
    if (
      lower.includes('lowest') ||
      lower.includes('weakest') ||
      lower.includes('struggling') ||
      lower.includes('worst')
    ) {
      const repScores: Record<string, { total: number; count: number }> = {};
      pipelineDeals.forEach((d) => {
        if (!repScores[d.rep]) repScores[d.rep] = { total: 0, count: 0 };
        repScores[d.rep].total += d.pqScore;
        repScores[d.rep].count++;
      });
      const sorted = Object.entries(repScores)
        .map(([rep, s]) => ({ rep, avg: s.total / s.count }))
        .sort((a, b) => a.avg - b.avg);
      return sorted[0]?.rep;
    }
    if (lower.includes('best') || lower.includes('top performer') || lower.includes('strongest')) {
      const repScores: Record<string, { total: number; count: number }> = {};
      pipelineDeals.forEach((d) => {
        if (!repScores[d.rep]) repScores[d.rep] = { total: 0, count: 0 };
        repScores[d.rep].total += d.pqScore;
        repScores[d.rep].count++;
      });
      const sorted = Object.entries(repScores)
        .map(([rep, s]) => ({ rep, avg: s.total / s.count }))
        .sort((a, b) => b.avg - a.avg);
      return sorted[0]?.rep;
    }
    return undefined;
  }

  // ── Helper: pick a deal by context ──
  function pickDeal(): Deal | undefined {
    // Try to match a company name in the query
    for (const d of deals) {
      if (lower.includes(d.company.toLowerCase())) return d;
    }
    // Highest-value deal
    if (
      lower.includes('biggest') ||
      lower.includes('largest') ||
      lower.includes('highest value') ||
      lower.includes('top deal')
    )
      return [...deals].sort((a, b) => b.acv - a.acv)[0];
    // Most at-risk deal
    if (lower.includes('risk') || lower.includes('danger') || lower.includes('trouble'))
      return [...deals].filter((d) => d.pqScore < 45).sort((a, b) => b.acv - a.acv)[0];
    // Default: highest-ACV deal for deal-level prompts
    return [...deals].sort((a, b) => b.acv - a.acv)[0];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Deal Strategy & Review
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('meddic') ||
    lower.includes('meddpicc') ||
    lower.includes('qualification check') ||
    lower.includes('deal qualification')
  )
    return guard('assess-meddic-completeness', { deal: pickDeal() });

  if (
    (lower.includes('risk') && lower.includes('deal')) ||
    lower.includes('high-risk') ||
    lower.includes('high risk') ||
    lower.includes('shaky deal')
  )
    return guard('flag-high-risk-deals', { deal: pickDeal() });

  if (
    lower.includes('win strategy') ||
    lower.includes('battle plan') ||
    lower.includes('win plan') ||
    lower.includes('how to win')
  )
    return guard('create-win-strategy-plan', { deal: pickDeal() });

  if (
    lower.includes('executive summary') &&
    (lower.includes('deal') || lower.includes('for leadership'))
  )
    return guard('prepare-executive-summary-deal', { deal: pickDeal() });

  if (
    lower.includes('win/loss') ||
    lower.includes('win loss') ||
    lower.includes('why we lost') ||
    lower.includes('why we won')
  )
    return guard('extract-win-loss-insights', {});

  if (
    lower.includes('lost deal') ||
    lower.includes('loss review') ||
    lower.includes('deal post-mortem')
  )
    return guard('document-lost-deal-sbi', { deal: pickDeal() });

  // SBI for reps = deal post-mortem; for managers = feedback framework
  if (lower.includes('sbi'))
    return role === 'rep'
      ? guard('document-lost-deal-sbi', { deal: pickDeal() })
      : guard('give-feedback-sbi-framework', { repName: findRep() });

  // ═══════════════════════════════════════════════════════════════════════════
  // Forecasting
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('forecast summary') ||
    lower.includes('executive forecast') ||
    lower.includes('forecast report') ||
    lower.includes('forecast status')
  )
    return guard('summarize-forecast-for-execs', {});

  if (
    lower.includes('quarter end') ||
    lower.includes('quarter-end') ||
    lower.includes('closing strategy') ||
    lower.includes('close plan')
  )
    return guard('quarter-end-closing-strategy', {});

  if (
    lower.includes('forecast shortfall') ||
    lower.includes('shortfall') ||
    lower.includes('mitigation plan') ||
    lower.includes('close the gap')
  )
    return guard('mitigation-plan-forecast-shortfall', {});

  if (
    lower.includes('forecast variance') ||
    lower.includes('forecast accuracy') ||
    lower.includes('who is sandbagging')
  )
    return guard('find-largest-forecast-variances', {});

  if (
    lower.includes('forecast bias') ||
    lower.includes('over-forecasting') ||
    lower.includes('under-forecasting') ||
    lower.includes('sandbagging')
  )
    return guard('identify-historical-forecast-bias', {});

  if (
    (lower.includes('compare') && lower.includes('forecast')) ||
    lower.includes('ai forecast') ||
    lower.includes('commit vs pipeline')
  )
    return guard('compare-commit-pipeline-ai-forecast', {});

  if (
    (lower.includes('consolidate') && lower.includes('forecast')) ||
    lower.includes('team forecast')
  )
    return guard('consolidate-team-forecast', {});

  if (lower.includes('commit') && (lower.includes('risk') || lower.includes('signal')))
    return guard('review-commit-deals-risk-signals', {});

  if (lower.includes('forecast call') && (lower.includes('agenda') || lower.includes('prep')))
    return guard('organize-forecast-call-agenda', {});

  if (lower.includes('forecast') && (lower.includes('adjust') || lower.includes('recommend')))
    return guard('advise-forecast-adjustments', {});

  if (lower.includes('forecast') && lower.includes('update'))
    return guard('share-post-forecast-call-update', {});

  if (
    lower.includes('week over week') ||
    lower.includes('week-over-week') ||
    (lower.includes('wow') && lower.includes('forecast'))
  )
    return guard('explain-week-over-week-forecast-changes', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // Pipeline Management
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('pipeline risk') ||
    lower.includes('risk report') ||
    lower.includes('coverage gap')
  )
    return guard('identify-pipeline-coverage-gaps', {});

  if (
    lower.includes('stagnant') ||
    lower.includes('stalled deal') ||
    lower.includes('stuck deal') ||
    (lower.includes('deal') && lower.includes('stall'))
  )
    return guard('spot-stagnant-deals', {});

  if (
    lower.includes('pipeline hygiene') ||
    lower.includes('update crm') ||
    lower.includes('data hygiene')
  )
    return guard('request-pipeline-data-update', {});

  if (lower.includes('marketing') && lower.includes('pipeline'))
    return guard('align-marketing-pipeline-gaps', {});

  if (
    lower.includes('boost pipeline') ||
    lower.includes('pipeline generation') ||
    lower.includes('more pipeline') ||
    lower.includes('gen more')
  )
    return guard('plan-pipeline-generation-boost', {});

  if (lower.includes('benchmark') || lower.includes('team metric') || lower.includes('team kpi'))
    return guard('benchmark-team-metrics', {});

  if (
    lower.includes('top opportunit') ||
    lower.includes('best deal') ||
    lower.includes('highlight deals')
  )
    return guard('highlight-top-opportunities', {});

  if (
    lower.includes('weekly pipeline') ||
    lower.includes('pipeline changes') ||
    lower.includes('pipeline movement')
  )
    return guard('summarize-weekly-pipeline-changes', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // Pipeline Review Meetings
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.includes('pipeline review') && (lower.includes('agenda') || lower.includes('prep')))
    return guard('set-pipeline-review-agenda', {});

  if (lower.includes('pipeline call') && lower.includes('stalled'))
    return guard('find-stalled-deals-pipeline-call', {});

  if (lower.includes('pipeline meeting') && lower.includes('follow'))
    return guard('send-pipeline-meeting-followup', {});

  if (lower.includes('pipeline scorecard') || lower.includes('rep scorecard'))
    return guard('provide-rep-pipeline-scorecards', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // QBR
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('qbr') &&
    (lower.includes('presentation') || lower.includes('outline') || lower.includes('slide'))
  )
    return guard('outline-qbr-presentation', {});

  if (
    lower.includes('quarterly performance') ||
    lower.includes('quarter recap') ||
    lower.includes('quarterly review')
  )
    return guard('recap-quarterly-performance', {});

  if (lower.includes('performance driver') || lower.includes('what drove'))
    return guard('analyze-quarterly-performance-drivers', {});

  if (
    (lower.includes('compare') && lower.includes('rep')) ||
    lower.includes('rep comparison') ||
    lower.includes('team comparison')
  )
    return guard('compare-team-rep-performance', {});

  if (lower.includes('next quarter') && (lower.includes('initiative') || lower.includes('plan')))
    return guard('propose-next-quarter-initiatives', {});

  if (lower.includes('qbr') && lower.includes('summary'))
    return guard('draft-qbr-executive-summary', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // Executive Reporting
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('monthly snapshot') ||
    lower.includes('monthly sales') ||
    lower.includes('monthly report')
  )
    return guard('compile-monthly-sales-snapshot', {});

  if (
    lower.includes('early warning') ||
    lower.includes('warning signal') ||
    lower.includes('red flag')
  )
    return guard('detect-early-warning-signals', {});

  if (
    lower.includes('monthly win') ||
    lower.includes('monthly challenge') ||
    lower.includes('monthly highlight')
  )
    return guard('highlight-monthly-wins-challenges', {});

  if (lower.includes('performance email') || lower.includes('monthly email'))
    return guard('draft-monthly-performance-email', {});

  if (
    lower.includes('dashboard commentary') ||
    lower.includes('bi dashboard') ||
    lower.includes('dashboard insight')
  )
    return guard('provide-bi-dashboard-commentary', {});

  if (lower.includes('rolling forecast') || lower.includes('re-forecast'))
    return guard('update-rolling-forecast-request-support', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // 1:1 Coaching
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('1:1') ||
    lower.includes('1-on-1') ||
    lower.includes('one on one') ||
    lower.includes('prep 1:1') ||
    lower.includes('prep my 1')
  )
    return guard('prepare-1on1-agenda-template', { repName: findRep() });

  if (lower.includes('rep performance') || (lower.includes('how is') && lower.includes('doing')))
    return guard('summarize-rep-performance', { repName: findRep() });

  if (
    lower.includes('call pattern') ||
    lower.includes('call analysis') ||
    lower.includes('call metric')
  )
    return guard('analyze-rep-call-patterns', { repName: findRep() });

  if (
    lower.includes('training progress') ||
    lower.includes('enablement progress') ||
    lower.includes('learning progress')
  )
    return guard('evaluate-rep-training-progress', { repName: findRep() });

  if (
    lower.includes('grow model') ||
    lower.includes('coaching plan') ||
    lower.includes('coaching session')
  )
    return guard('plan-coaching-grow-model', { repName: findRep() });

  if (lower.includes('feedback') && (lower.includes('give') || lower.includes('constructive')))
    return guard('give-feedback-sbi-framework', { repName: findRep() });

  // ═══════════════════════════════════════════════════════════════════════════
  // Onboarding & Ramp
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.includes('ramp') && lower.includes('benchmark'))
    return guard('compare-new-rep-ramp-benchmarks', {});

  if (lower.includes('enablement') && lower.includes('engagement'))
    return guard('check-new-rep-enablement-engagement', {});

  if (lower.includes('30-60-90') || lower.includes('30 60 90') || lower.includes('onboarding plan'))
    return guard('customize-30-60-90-plan', { repName: findRep() });

  if (
    lower.includes('role play') ||
    lower.includes('role-play') ||
    lower.includes('practice scenario')
  )
    return guard('create-role-play-scenario', {});

  if (lower.includes('onboarding feedback') || lower.includes('onboarding survey'))
    return guard('request-onboarding-feedback', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // Performance Management
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('underperform') ||
    lower.includes('under-perform') ||
    lower.includes('diagnose performance')
  )
    return guard('diagnose-underperformance-causes', { repName: findRep() });

  if (
    lower.includes('performance trend') ||
    lower.includes('trending down') ||
    lower.includes('performance trajectory')
  )
    return guard('review-rep-performance-trend', { repName: findRep() });

  if (
    lower.includes('external factor') ||
    lower.includes('market factor') ||
    lower.includes('macro')
  )
    return guard('evaluate-external-factors', {});

  if (
    lower.includes('difficult conversation') ||
    lower.includes('tough conversation') ||
    lower.includes('performance discussion')
  )
    return guard('plan-difficult-performance-discussion', { repName: findRep() });

  if (
    lower.includes('pip') ||
    lower.includes('improvement plan') ||
    lower.includes('performance plan')
  )
    return guard('draft-performance-improvement-plan', { repName: findRep() });

  if (lower.includes('pip monitor') || lower.includes('pip support') || lower.includes('pip check'))
    return guard('setup-pip-support-monitoring', { repName: findRep() });

  // ═══════════════════════════════════════════════════════════════════════════
  // Churn & Expansion
  // ═══════════════════════════════════════════════════════════════════════════

  if (
    lower.includes('churn') &&
    (lower.includes('summary') || lower.includes('recent') || lower.includes('review'))
  )
    return guard('summarize-recent-churn', {});

  if (
    lower.includes('net retention') ||
    lower.includes('nrr') ||
    lower.includes('retention driver')
  )
    return guard('calculate-net-retention-drivers', {});

  if (
    lower.includes('expansion') &&
    (lower.includes('pipeline') || lower.includes('upsell') || lower.includes('cross-sell'))
  )
    return guard('review-expansion-pipeline', {});

  if (
    lower.includes('churn reduction') ||
    lower.includes('reduce churn') ||
    lower.includes('churn plan')
  )
    return guard('outline-churn-reduction-plan', {});

  if (lower.includes('renewal') && lower.includes('forecast'))
    return guard('integrate-renewals-forecasting', {});

  if (lower.includes('expansion playbook') || lower.includes('expansion play'))
    return guard('provide-expansion-sales-playbook', {});

  // ═══════════════════════════════════════════════════════════════════════════
  // Generic catch-alls (broad patterns)
  // ═══════════════════════════════════════════════════════════════════════════

  if (lower.includes('coaching play') || lower.includes('coaching this week'))
    return guard('plan-coaching-grow-model', { repName: findRep() });

  if (lower.includes('forecast') && !lower.includes('summary'))
    return guard('summarize-forecast-for-execs', {});

  return null;
}

// ---------------------------------------------------------------------------
// AI Response Generator (simulated — replace with real API call)
// ---------------------------------------------------------------------------

function generateResponse(
  query: string,
  deals: Deal[],
  role: string,
  currentRep: string
): { content: string; actions: CopilotAction[] } {
  const q = query.toLowerCase();
  const actions: CopilotAction[] = [];

  // Dynamic target calculation based on role
  function getTarget(): number {
    if (role === 'rep') return DEFAULT_REP_TARGETS[currentRep] || 2_000_000;
    // Manager/exec: sum of all visible rep targets
    const targetSum = Object.entries(DEFAULT_REP_TARGETS)
      .filter(([rep]) => deals.some((d) => d.rep === rep))
      .reduce((s, [, t]) => s + t, 0);
    return targetSum || 20_000_000;
  }

  const scopeLabel = role === 'rep' ? 'your' : role === 'manager' ? "your team's" : "the org's";

  // Risk / at-risk queries
  if (q.includes('risk') || q.includes('at risk') || q.includes('danger')) {
    const atRisk = deals
      .filter((d) => d.pqScore < 40)
      .sort((a, b) => b.acv - a.acv)
      .slice(0, 5);
    const totalExposure = atRisk.reduce((s, d) => s + d.acv, 0);
    const content = `**${atRisk.length} deals at risk** in ${scopeLabel} pipeline with €${(totalExposure / 1000).toFixed(0)}K exposure:\n\n${atRisk
      .map(
        (d, i) =>
          `${i + 1}. **${d.company}** — €${(d.acv / 1000).toFixed(0)}K · PQS ${d.pqScore} (${d.grade}) · ${d.stage}${role !== 'rep' ? ` · ${d.rep}` : ''}\n   Missing: ${d.personaGaps.join(', ') || 'None'}`
      )
      .join(
        '\n'
      )}\n\n**Recommended action:** Focus on the top 3 by ACV. I can create follow-up tasks in your CRM for each.`;

    atRisk.slice(0, 3).forEach((d) => {
      actions.push({
        id: `act_${d.id}_task`,
        label: `Create task → ${d.company}`,
        type: 'crm-task',
        dealId: d.id,
        payload: `Review at-risk deal: PQS ${d.pqScore}, missing ${d.personaGaps.join(', ')}`,
      });
    });

    return { content, actions };
  }

  // Focus / priority queries
  if (
    q.includes('focus') ||
    q.includes('today') ||
    q.includes('priority') ||
    q.includes('should i')
  ) {
    const urgent = deals
      .filter((d) => d.daysInStage > 15 || d.pqScore < 50)
      .sort((a, b) => b.acv - a.acv)
      .slice(0, 3);

    const content = `Here's ${scopeLabel} priority stack for today:\n\n${urgent
      .map(
        (d, i) =>
          `**${i + 1}. ${d.company}** (€${(d.acv / 1000).toFixed(0)}K)${role !== 'rep' ? ` — ${d.rep}` : ''}\n   ${d.daysInStage > 15 ? `⚠️ Stalled ${d.daysInStage} days in ${d.stage}` : `PQS ${d.pqScore} — needs attention`}\n   → ${d.nextActions[0] || 'Schedule follow-up'}`
      )
      .join('\n\n')}\n\nWant me to log these as next steps in Zoho?`;

    urgent.forEach((d) => {
      actions.push({
        id: `act_${d.id}_note`,
        label: `Push next steps → ${d.company}`,
        type: 'crm-note',
        dealId: d.id,
        payload: `Priority action: ${d.nextActions[0] || 'Schedule follow-up call'}`,
      });
    });

    return { content, actions };
  }

  // Pipeline / summary queries
  if (q.includes('pipeline') || q.includes('summary') || q.includes('health')) {
    const total = deals.reduce((s, d) => s + d.acv, 0);
    const weighted = deals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
    const avgPQS = Math.round(deals.reduce((s, d) => s + d.pqScore, 0) / deals.length);
    const byGrade = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    deals.forEach((d) => byGrade[d.grade]++);
    const target = getTarget();
    const coverage = target > 0 ? (total / target).toFixed(1) : 'N/A';

    return {
      content: `**${role === 'rep' ? 'Your' : role === 'manager' ? 'Team' : 'Org'} Pipeline Health Snapshot**\n\n| Metric | Value |\n|--------|-------|\n| Total Pipeline | €${(total / 1_000_000).toFixed(1)}M |\n| Weighted Value | €${(weighted / 1_000_000).toFixed(1)}M |\n| Target | €${(target / 1_000_000).toFixed(1)}M |\n| Coverage Ratio | ${coverage}x |\n| Deal Count | ${deals.length} |\n| Avg PQS | ${avgPQS} |\n| Grade Distribution | A:${byGrade.A} B:${byGrade.B} C:${byGrade.C} D:${byGrade.D} F:${byGrade.F} |\n\n**Assessment:** ${avgPQS > 55 ? 'Pipeline quality is strong.' : avgPQS > 40 ? 'Pipeline quality is moderate — focus on advancing B-grade deals.' : 'Pipeline quality needs attention — too many low-scoring deals.'}`,
      actions: [
        {
          id: 'act_batch_pqs',
          label: 'Sync all PQS scores to Zoho',
          type: 'crm-note',
          payload: 'batch-pqs',
        },
      ],
    };
  }

  // Commit / forecast queries
  if (q.includes('commit') || q.includes('forecast') || q.includes('target') || q.includes('gap')) {
    const commits = deals.filter((d) => d.forecastCategory === 'Commit');
    const bestCase = deals.filter((d) => d.forecastCategory === 'Best Case');
    const commitTotal = commits.reduce((s, d) => s + d.acv, 0);
    const bestTotal = bestCase.reduce((s, d) => s + d.acv, 0);
    const target = getTarget();
    const gap = target - commitTotal;

    return {
      content: `**${role === 'rep' ? 'Your' : role === 'manager' ? 'Team' : 'Org'} Forecast Analysis**\n\n- **Commit:** €${(commitTotal / 1_000_000).toFixed(1)}M (${commits.length} deals)\n- **Best Case:** €${(bestTotal / 1_000_000).toFixed(1)}M (${bestCase.length} deals)\n- **Target:** €${(target / 1_000_000).toFixed(1)}M\n- **Gap:** €${(Math.abs(gap) / 1_000_000).toFixed(1)}M ${gap > 0 ? 'short' : 'over'}\n\n${
        gap > 0
          ? `**⚠️ €${(gap / 1_000_000).toFixed(1)}M gap.** Consider promoting these Best Case deals:\n${bestCase
              .sort((a, b) => b.acv - a.acv)
              .slice(0, 3)
              .map((d) => `- ${d.company} (€${(d.acv / 1000).toFixed(0)}K, PQS ${d.pqScore})`)
              .join('\n')}`
          : '**✅ On track to hit target.**'
      }`,
      actions: [],
    };
  }

  // Coaching / plays — role-aware response
  if (
    q.includes('coaching') ||
    q.includes('play') ||
    q.includes('eb recovery') ||
    q.includes('playbook')
  ) {
    if (role === 'rep') {
      // Rep sees coaching for their own deals
      const needsEB = deals
        .filter(
          (d) => d.personaGaps.some((g) => g.includes('Economic Buyer')) && d.stage !== 'Discovery'
        )
        .slice(0, 3);
      const stalled = deals.filter((d) => d.daysInStage > 20);
      const multiThread = deals.filter((d) => d.personaGaps.length >= 2);

      return {
        content: `**Coaching Plays for Your Deals**\n\n🎯 **Get to the EB** — ${needsEB.length} of your deals are missing Economic Buyer access:\n${needsEB.map((d) => `- ${d.company} (${d.stage}, €${(d.acv / 1000).toFixed(0)}K)`).join('\n')}\n\n🔄 **Unblock Stalls** — ${stalled.length} deals stalled 20+ days\n\n🧵 **Multi-Thread** — ${multiThread.length} deals with 2+ persona gaps\n\nTry: "Create win strategy for [company name]" for a deal-specific action plan.`,
        actions: needsEB.map((d) => ({
          id: `act_${d.id}_coach`,
          label: `EB Recovery → ${d.company}`,
          type: 'coaching' as const,
          dealId: d.id,
          payload: 'EB Recovery Play',
        })),
      };
    }

    // Manager/exec sees team coaching view
    const needsEB = deals
      .filter(
        (d) => d.personaGaps.some((g) => g.includes('Economic Buyer')) && d.stage !== 'Discovery'
      )
      .slice(0, 3);
    return {
      content: `**Active Coaching Opportunities**\n\n🎯 **EB Recovery** — ${needsEB.length} deals need Economic Buyer engagement:\n${needsEB.map((d) => `- ${d.company} (${d.rep}, ${d.stage}, €${(d.acv / 1000).toFixed(0)}K)`).join('\n')}\n\n🔄 **Stall Breakers** — ${deals.filter((d) => d.daysInStage > 20).length} deals stalled 20+ days\n\n🧵 **Multi-Threading** — ${deals.filter((d) => d.personaGaps.length >= 2).length} deals with 2+ persona gaps\n\nI can trigger any of these plays and log the actions to your CRM.`,
      actions: needsEB.map((d) => ({
        id: `act_${d.id}_coach`,
        label: `Run EB Recovery → ${d.company}`,
        type: 'coaching' as const,
        dealId: d.id,
        payload: 'EB Recovery Play',
      })),
    };
  }

  // Competitor queries
  if (
    q.includes('competitor') ||
    q.includes('winning') ||
    q.includes('losing') ||
    q.includes('battlecard')
  ) {
    const competitive = deals.filter((d) => d.competitor);
    const byCompetitor: Record<string, number> = {};
    competitive.forEach((d) => {
      byCompetitor[d.competitor!] = (byCompetitor[d.competitor!] || 0) + 1;
    });
    const sorted = Object.entries(byCompetitor).sort((a, b) => b[1] - a[1]);

    return {
      content: `**Competitive Landscape** (${competitive.length} competitive deals in ${scopeLabel} pipeline)\n\n${sorted.map(([comp, count]) => `- **${comp}**: ${count} deals`).join('\n')}\n\n${sorted[0] ? `**Top threat:** ${sorted[0][0]} appears in ${sorted[0][1]} deals. Review battlecards on the Risk Monitor page.` : 'No competitive pressure detected.'}`,
      actions: [
        { id: 'act_nav_risk', label: 'Go to Risk Monitor', type: 'navigate', payload: '/risk' },
      ],
    };
  }

  // Next steps / draft
  if (
    q.includes('next step') ||
    q.includes('draft') ||
    q.includes('follow-up') ||
    q.includes('follow up')
  ) {
    const topDeal = [...deals].sort((a, b) => b.acv - a.acv)[0];
    if (topDeal) {
      const content = `**Next Steps for ${topDeal.company}** (€${(topDeal.acv / 1000).toFixed(0)}K, ${topDeal.stage})\n\n${topDeal.nextActions
        .map((a, i) => `${i + 1}. ${a}`)
        .join(
          '\n'
        )}\n\n**Suggested email draft:**\n> Hi [Champion],\n>\n> Following our ${topDeal.stage.toLowerCase()} discussion, I wanted to confirm our next steps:\n> ${topDeal.nextActions
        .slice(0, 2)
        .map((a) => `\n> - ${a}`)
        .join(
          ''
        )}\n>\n> Could we schedule 30 minutes this week to align?\n\nWant me to push these next steps to Zoho?`;

      actions.push({
        id: `act_${topDeal.id}_next`,
        label: `Push to Zoho → ${topDeal.company}`,
        type: 'crm-note',
        dealId: topDeal.id,
        payload: `Next steps: ${topDeal.nextActions.join('; ')}`,
      });

      return { content, actions };
    }
  }

  // Performance / benchmark queries (rep-appropriate)
  if (
    q.includes('compare') ||
    q.includes('benchmark') ||
    q.includes('top performer') ||
    q.includes('how do i')
  ) {
    const avgPQS = Math.round(deals.reduce((s, d) => s + d.pqScore, 0) / deals.length);
    const total = deals.reduce((s, d) => s + d.acv, 0);

    if (role === 'rep') {
      return {
        content: `**Your Performance Snapshot**\n\n| Metric | You | Benchmark |\n|--------|-----|----------|\n| Pipeline | €${(total / 1_000_000).toFixed(1)}M | Check benchmarks tab |\n| Avg PQS | ${avgPQS} | 55+ is strong |\n| Deal Count | ${deals.length} | — |\n\nFor detailed benchmarking, visit your **Command Center** where the RepBenchmark component compares you against the leader and top 10% average.`,
        actions: [
          { id: 'act_nav_home', label: 'Go to Command Center', type: 'navigate', payload: '/' },
        ],
      };
    }
    return {
      content: `**Team Performance Overview**\n\nPipeline: €${(total / 1_000_000).toFixed(1)}M across ${deals.length} deals\nAvg PQS: ${avgPQS}\n\nFor detailed rep-by-rep benchmarks, visit the **Team** page or use: "Compare rep performance side by side"`,
      actions: [{ id: 'act_nav_team', label: 'Go to Team', type: 'navigate', payload: '/team' }],
    };
  }

  // Default / generic — role-aware help text
  const repHelp = `I can help you with:\n\n- **My deals** — "Run MEDDIC on my top deal"\n- **Risk check** — "Which of my deals are at risk?"\n- **Priorities** — "What should I focus on today?"\n- **Pipeline** — "How is my pipeline health?"\n- **Win planning** — "Create win strategy for my biggest deal"\n- **CRM actions** — "Draft next steps for my top deal"\n\nAll answers are scoped to your deals and I can push actions directly to Zoho CRM.`;

  const mgrHelp = `I can help you with:\n\n- **Team pipeline** — "Show team pipeline health"\n- **Risk assessment** — "Which deals need my attention?"\n- **Coaching** — "Prep 1:1 for my lowest performer"\n- **Forecasting** — "Compare commit vs AI forecast"\n- **Performance** — "Compare rep performance side by side"\n- **CRM actions** — "Push next steps to Zoho"\n\nAll answers are powered by your team's live pipeline data.`;

  const execHelp = `I can help you with:\n\n- **Forecast** — "Run executive forecast summary"\n- **Early warnings** — "Detect early warning signals"\n- **Pipeline** — "Show pipeline coverage analysis"\n- **Competitive** — "Show competitive landscape"\n- **Reporting** — "Create monthly sales snapshot"\n- **QBR prep** — "Create QBR presentation outline"\n\nAll answers cover the full org pipeline.`;

  return {
    content: role === 'rep' ? repHelp : role === 'manager' ? mgrHelp : execHelp,
    actions: [],
  };
}

// ---------------------------------------------------------------------------
// Copilot Component
// ---------------------------------------------------------------------------

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();
  const { role, currentRep } = useRole();
  const { pushNote, pushTask, batchSync, status } = useCRM();

  const suggestions = useMemo(() => getSuggestions(pathname, role), [pathname, role]);

  const deals = useMemo(() => {
    if (role === 'rep') return pipelineDeals.filter((d) => d.rep === currentRep);
    return pipelineDeals;
  }, [role, currentRep]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !minimized) inputRef.current?.focus();
  }, [isOpen, minimized]);

  async function handleSend(text?: string) {
    const query = text || input.trim();
    if (!query) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Check if this query maps to a prompt library template (role-filtered)
    const promptMatch = matchPromptQuery(query, deals, role);
    if (promptMatch) {
      const output = await executePrompt(
        promptMatch.promptId,
        promptMatch.deal,
        promptMatch.repName
      );
      const actions = promptOutputToActions(output);
      const header = `*Powered by Prompt Library: ${output.promptName}*\n*${Math.round(output.confidence * 100)}% confidence · Sources: ${output.dataSourcesUsed.join(', ')}*\n\n`;
      const assistantMsg: Message = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: header + output.content,
        timestamp: new Date(),
        actions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
      return;
    }

    // Standard response generation
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

    const { content, actions } = generateResponse(query, deals, role, currentRep);
    const assistantMsg: Message = {
      id: `msg_${Date.now()}_a`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      actions,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }

  async function executeAction(action: CopilotAction) {
    if (action.executed) return;

    let resultMsg = '';
    if (action.type === 'crm-note' && action.dealId) {
      const noteId = await pushNote(
        action.dealId,
        'RevOS AI: Copilot Action',
        action.payload || ''
      );
      resultMsg = noteId ? `✅ Note pushed to Zoho (${noteId})` : '❌ Failed to push note';
    } else if (action.type === 'crm-note' && action.payload === 'batch-pqs') {
      const result = await batchSync();
      resultMsg = `✅ Batch sync: ${result.success} deals updated, ${result.failed} failed`;
    } else if (action.type === 'crm-task' && action.dealId) {
      const taskId = await pushTask(
        action.dealId,
        action.payload || 'Follow up',
        'Created by RevOS AI Copilot'
      );
      resultMsg = taskId ? `✅ Task created in Zoho (${taskId})` : '❌ Failed to create task';
    } else if (action.type === 'navigate' && action.payload) {
      window.location.hash = action.payload;
      resultMsg = `Navigated to ${action.payload}`;
    }

    // Mark action as executed
    setMessages((prev) =>
      prev.map((m) => ({
        ...m,
        actions: m.actions?.map((a) => (a.id === action.id ? { ...a, executed: true } : a)),
      }))
    );

    // Add system message with result
    if (resultMsg) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_s`,
          role: 'system',
          content: resultMsg,
          timestamp: new Date(),
        },
      ]);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        {status.connected && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </button>
    );
  }

  if (minimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 bg-card border border-border/60 rounded-2xl shadow-xl cursor-pointer hover:shadow-2xl transition-all flex items-center gap-3 px-4 py-3"
        onClick={() => setMinimized(false)}
      >
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-foreground">AI Copilot</span>
        {messages.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {messages.length}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">AI Copilot</div>
            <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              {status.connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Zoho CRM
                  connected
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" /> Demo mode
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3 animate-fade-in">
            <div className="text-center py-4">
              <Sparkles className="w-8 h-8 text-primary/30 mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground">Ask your pipeline anything</div>
              <div className="text-xs text-muted-foreground mt-1">
                Context-aware AI with live CRM write-back
              </div>
            </div>
            <div className="space-y-1.5">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-colors flex items-center gap-2 group"
                >
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {s}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}
          >
            {msg.role === 'user' ? (
              <div className="max-w-[85%] bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 text-sm">
                {msg.content}
              </div>
            ) : msg.role === 'system' ? (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-1.5 font-mono">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[95%] space-y-2">
                <div className="bg-secondary/50 rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm text-foreground prose prose-sm prose-invert max-w-none [&_table]:text-xs [&_table]:font-mono [&_strong]:text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-1">
                    {msg.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => executeAction(action)}
                        disabled={action.executed}
                        className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-colors ${
                          action.executed
                            ? 'bg-green-500/10 border-green-500/30 text-green-400 cursor-default'
                            : 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer'
                        }`}
                      >
                        {action.executed ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : action.type === 'crm-note' ? (
                          <FileText className="w-3 h-3" />
                        ) : action.type === 'crm-task' ? (
                          <Zap className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Analyzing pipeline data...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/40 px-3 py-2.5 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your pipeline anything..."
            className="flex-1 bg-secondary/50 border border-border/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simple markdown formatter
// ---------------------------------------------------------------------------

function formatMarkdown(text: string): string {
  const html = text
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      if (match.includes('---')) return '';
      const cells = match
        .split('|')
        .filter(Boolean)
        .map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td style="padding:2px 8px">${c}</td>`).join('')}</tr>`;
    })
    .replace(
      /(<tr>.*<\/tr>\s*)+/g,
      (match) => `<table class="border border-border/30 rounded">${match}</table>`
    )
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n/g, '<br/>')
    // Blockquotes
    .replace(
      /&gt; (.+?)(<br\/>|$)/g,
      '<span class="text-muted-foreground italic border-l-2 border-primary/30 pl-2 block my-1">$1</span>'
    )
    // Emoji indicators
    .replace(/[✅❌⚠️🎯🔄🧵]/g, (m) => `<span class="not-prose">${m}</span>`);
  return sanitizeHTML(html);
}
