import { useState, useMemo } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';
import { useRole } from '@/contexts/RoleContext';
import { fmt } from '@/lib/utils';
import {
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Undo2,
  Play,
  PauseCircle,
  RotateCcw,
  Lightbulb,
  Activity,
  ArrowRight,
} from 'lucide-react';

/* ─── Types ─── */
interface AgenticAction {
  id: string;
  type: 'coaching-play' | 'nudge' | 'alert' | 'data-update' | 'forecast-adjust';
  name: string;
  description: string;
  deal?: { company: string; rep: string; acv: number };
  confidence: number;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'undone';
  triggeredAt: string;
  executedAt?: string;
  triggerReason: string;
  expectedImpact: string;
  outcomeTracked?: boolean;
}

interface LearningInsight {
  id: string;
  pattern: string;
  confidence: number;
  source: string;
  impact: string;
  learnedAt: string;
  appliedCount: number;
}

/* ─── Generate mock agentic actions from current pipeline data ─── */
function generateAgenticActions(deals: Deal[]): AgenticAction[] {
  const actions: AgenticAction[] = [];
  let idx = 0;

  // EB Recovery plays for deals missing Economic Buyer in Proposal+
  deals
    .filter(
      (d) =>
        (d.stage === 'Proposal' || d.stage === 'Negotiation') &&
        d.personaGaps.some((g) => g.includes('Economic Buyer'))
    )
    .sort((a, b) => b.acv - a.acv)
    .slice(0, 4)
    .forEach((d) => {
      actions.push({
        id: `aa-${idx++}`,
        type: 'coaching-play',
        name: 'EB Recovery Play',
        description: `Auto-scheduled executive briefing request for ${d.company}. Economic Buyer not engaged at ${d.stage} stage.`,
        deal: { company: d.company, rep: d.rep, acv: d.acv },
        confidence: 78 + Math.floor(Math.random() * 15),
        status: idx <= 2 ? 'executed' : 'pending',
        triggeredAt: idx <= 2 ? '2h ago' : '12m ago',
        executedAt: idx <= 2 ? '1h ago' : undefined,
        triggerReason: `Economic Buyer missing + Stage=${d.stage} + ACV>€100K`,
        expectedImpact: `+35% win probability if CFO engaged within 7 days`,
      });
    });

  // Stall Breaker for deals stuck 20+ days
  deals
    .filter((d) => d.daysInStage > 20)
    .sort((a, b) => b.acv - a.acv)
    .slice(0, 3)
    .forEach((d) => {
      actions.push({
        id: `aa-${idx++}`,
        type: 'nudge',
        name: 'Stall Breaker Nudge',
        description: `Sent personalised follow-up draft to ${d.rep} for ${d.company}. Deal stalled ${d.daysInStage} days in ${d.stage}.`,
        deal: { company: d.company, rep: d.rep, acv: d.acv },
        confidence: 65 + Math.floor(Math.random() * 15),
        status: 'executed',
        triggeredAt: '4h ago',
        executedAt: '3h ago',
        triggerReason: `daysInStage=${d.daysInStage} > threshold(20) + no activity 7d`,
        expectedImpact: `61% of reps who followed up advanced within 10 days`,
      });
    });

  // Multi-thread campaign for high-value single-threaded deals
  deals
    .filter((d) => d.personaGaps.length >= 2 && d.acv > 100000)
    .sort((a, b) => b.acv - a.acv)
    .slice(0, 2)
    .forEach((d) => {
      actions.push({
        id: `aa-${idx++}`,
        type: 'coaching-play',
        name: 'Multi-Thread Campaign',
        description: `Initiated contact research for ${d.personaGaps.length} missing personas at ${d.company}.`,
        deal: { company: d.company, rep: d.rep, acv: d.acv },
        confidence: 72 + Math.floor(Math.random() * 10),
        status: 'pending',
        triggeredAt: '30m ago',
        triggerReason: `personaGaps=${d.personaGaps.length} + ACV>€100K + segment=${d.segment}`,
        expectedImpact: `67% historical success rate over 21 days`,
      });
    });

  // Forecast adjustment alerts
  const totalSlipRisk = deals
    .filter((d) => d.pqScore < 35 && d.acv > 50000)
    .reduce((s, d) => s + d.acv, 0);
  if (totalSlipRisk > 500000) {
    actions.push({
      id: `aa-${idx++}`,
      type: 'forecast-adjust',
      name: 'Forecast Risk Alert',
      description: `€${(totalSlipRisk / 1000).toFixed(0)}K in pipeline has PQS < 35 — recommending downward forecast adjustment.`,
      confidence: 85,
      status: 'pending',
      triggeredAt: '1h ago',
      triggerReason: `Aggregate slip risk exceeds €500K threshold`,
      expectedImpact: `Prevent surprise quarter-end miss. Historical accuracy: 88%`,
    });
  }

  return actions;
}

/* ─── Generate self-learning insights ─── */
function generateLearningInsights(): LearningInsight[] {
  return [
    {
      id: 'li-1',
      pattern: 'Deals with EB engagement before Proposal close 2.3x faster',
      confidence: 91,
      source: 'Closed Won analysis (last 4 quarters, n=187)',
      impact: 'EB Recovery Play trigger moved to Qualification stage',
      learnedAt: 'Q4 2025 model retrain',
      appliedCount: 34,
    },
    {
      id: 'li-2',
      pattern: 'Competitor EarthCam mentioned in Negotiation = 28% lower win rate',
      confidence: 84,
      source: 'Win/Loss analysis (n=45 competitive deals)',
      impact: 'Auto-triggers battlecard review when competitor detected',
      learnedAt: 'Q4 2025 model retrain',
      appliedCount: 12,
    },
    {
      id: 'li-3',
      pattern: 'Deals in Data Center segment close 18 days faster than avg',
      confidence: 78,
      source: 'Segment analysis (n=62 Data Center deals)',
      impact: 'Stage duration thresholds adjusted for Specialty Contractor ICP',
      learnedAt: 'Q3 2025 model retrain',
      appliedCount: 8,
    },
    {
      id: 'li-4',
      pattern: 'ROI calculator shown in first call increases qualification rate by 41%',
      confidence: 87,
      source: 'Activity correlation (n=312 Discovery calls)',
      impact: 'ROI Calculator Assist play now triggers in Discovery stage',
      learnedAt: 'Q4 2025 model retrain',
      appliedCount: 56,
    },
    {
      id: 'li-5',
      pattern: 'Multi-threaded Enterprise deals (3+ personas) win at 2.4x rate',
      confidence: 93,
      source: 'Persona coverage analysis (all Enterprise deals, n=234)',
      impact: 'Multi-Thread Campaign confidence threshold raised to 72%',
      learnedAt: 'Q1 2026 model retrain',
      appliedCount: 18,
    },
    {
      id: 'li-6',
      pattern: 'Stall Breaker nudges sent on Tuesday AM have 23% higher response rate',
      confidence: 71,
      source: 'Activity timing analysis (n=89 nudge events)',
      impact: 'Agentic nudge scheduling optimised for Tuesday 9-11 AM',
      learnedAt: 'Q1 2026 model retrain',
      appliedCount: 7,
    },
  ];
}

/* ─── Format helpers ─── */

function confidenceColor(v: number): string {
  if (v >= 85) return 'text-grade-a';
  if (v >= 70) return 'text-grade-b';
  if (v >= 55) return 'text-grade-c';
  return 'text-grade-d';
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-grade-c',
    bg: 'bg-[hsl(var(--grade-c)/.08)]',
    label: 'Pending',
  },
  approved: { icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/8', label: 'Approved' },
  executed: {
    icon: Zap,
    color: 'text-grade-a',
    bg: 'bg-[hsl(var(--grade-a)/.08)]',
    label: 'Executed',
  },
  rejected: {
    icon: XCircle,
    color: 'text-grade-f',
    bg: 'bg-[hsl(var(--grade-f)/.08)]',
    label: 'Rejected',
  },
  undone: { icon: Undo2, color: 'text-muted-foreground', bg: 'bg-muted/30', label: 'Undone' },
};

const TYPE_LABELS = {
  'coaching-play': 'Coaching Play',
  nudge: 'Rep Nudge',
  alert: 'Alert',
  'data-update': 'Data Update',
  'forecast-adjust': 'Forecast Alert',
};

/* ─── Main Component ─── */
export function AgenticPanel({ scopedDeals }: { scopedDeals?: Deal[] }) {
  const { coachingMode, setCoachingMode } = useRole();
  const dealSource = scopedDeals || pipelineDeals;
  const [actions, setActions] = useState(() => generateAgenticActions(dealSource));
  const insights = useMemo(() => generateLearningInsights(), []);

  const isAgentic = coachingMode === 'agentic';
  const executed = actions.filter((a) => a.status === 'executed').length;
  const pending = actions.filter((a) => a.status === 'pending').length;

  function updateStatus(id: string, status: AgenticAction['status']) {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status, executedAt: status === 'executed' ? 'just now' : a.executedAt }
          : a
      )
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle + stats */}
      <div className="glass-card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="metric-label flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            AI Coaching Engine
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCoachingMode('hitl')}
              className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-mono transition-colors ${
                !isAgentic
                  ? 'bg-grade-c/10 text-grade-c border border-grade-c/30'
                  : 'bg-muted/50 text-muted-foreground border border-border/30'
              }`}
            >
              <PauseCircle className="w-3 h-3" /> HITL
            </button>
            <button
              onClick={() => setCoachingMode('agentic')}
              className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-mono transition-colors ${
                isAgentic
                  ? 'bg-grade-a/10 text-grade-a border border-grade-a/30'
                  : 'bg-muted/50 text-muted-foreground border border-border/30'
              }`}
            >
              <Play className="w-3 h-3" /> Agentic
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-grade-a">{executed}</div>
            <div className="text-[9px] text-muted-foreground">Executed</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-grade-c">{pending}</div>
            <div className="text-[9px] text-muted-foreground">Pending</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-primary">{insights.length}</div>
            <div className="text-[9px] text-muted-foreground">Patterns Learned</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-foreground">
              {insights.reduce((s, i) => s + i.appliedCount, 0)}
            </div>
            <div className="text-[9px] text-muted-foreground">Times Applied</div>
          </div>
        </div>

        {!isAgentic && (
          <div className="mt-3 flex items-center gap-2 text-xs text-grade-c bg-grade-c/5 rounded-lg p-2.5 border border-grade-c/15">
            <PauseCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              HITL mode: All AI actions require your approval before executing. Switch to Agentic
              for autonomous operation.
            </span>
          </div>
        )}
      </div>

      {/* Action queue */}
      <div className="glass-card p-5 animate-fade-in space-y-3">
        <div className="metric-label flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Action Queue
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-1">
            {actions.length} actions
          </span>
        </div>
        <div className="space-y-2">
          {actions.map((action) => {
            const statusCfg = STATUS_CONFIG[action.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={action.id}
                className="rounded-lg border border-border/30 p-3 hover:border-border/50 transition-colors space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${statusCfg.bg}`}
                  >
                    <StatusIcon className={`w-3.5 h-3.5 ${statusCfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{action.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground font-mono">
                        {TYPE_LABELS[action.type]}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${statusCfg.bg} ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                    {action.deal && (
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">
                        {action.deal.company} · {action.deal.rep} · {fmt(action.deal.acv)}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-sm font-mono font-bold ${confidenceColor(action.confidence)}`}
                    >
                      {action.confidence}%
                    </div>
                    <div className="text-[9px] text-muted-foreground">{action.triggeredAt}</div>
                  </div>
                </div>

                {/* Trigger reason + impact */}
                <div className="ml-10 grid grid-cols-2 gap-2">
                  <div className="text-[10px]">
                    <span className="text-muted-foreground">Trigger: </span>
                    <span className="font-mono text-foreground">{action.triggerReason}</span>
                  </div>
                  <div className="text-[10px]">
                    <span className="text-muted-foreground">Impact: </span>
                    <span className="font-mono text-foreground">{action.expectedImpact}</span>
                  </div>
                </div>

                {/* Action buttons */}
                {action.status === 'pending' && (
                  <div className="ml-10 flex gap-2">
                    <button
                      onClick={() => updateStatus(action.id, isAgentic ? 'executed' : 'approved')}
                      className="flex items-center gap-1 text-[10px] font-mono text-primary px-3 py-1 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> {isAgentic ? 'Execute Now' : 'Approve'}
                    </button>
                    <button
                      onClick={() => updateStatus(action.id, 'rejected')}
                      className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground px-3 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
                {action.status === 'executed' && (
                  <div className="ml-10 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-grade-a flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Executed {action.executedAt}
                    </span>
                    <button
                      onClick={() => updateStatus(action.id, 'undone')}
                      className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Undo2 className="w-3 h-3" /> Undo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Self-Learning Insights */}
      <div className="glass-card p-5 animate-fade-in space-y-3">
        <div className="metric-label flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Self-Learning Patterns
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-1">
            {insights.length} patterns · auto-retrained quarterly
          </span>
        </div>
        <div className="space-y-2">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="rounded-lg border border-border/30 p-3 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-foreground font-medium">{insight.pattern}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{insight.source}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-sm font-mono font-bold ${confidenceColor(insight.confidence)}`}
                  >
                    {insight.confidence}%
                  </div>
                  <div className="text-[9px] text-muted-foreground">confidence</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[10px]">
                <span className="flex items-center gap-1 text-primary">
                  <ArrowRight className="w-3 h-3" />
                  {insight.impact}
                </span>
                <span className="text-muted-foreground font-mono">
                  Applied {insight.appliedCount}× · {insight.learnedAt}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Model calibration status */}
        <div className="border-t border-border/30 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              Next model retrain: <span className="text-foreground font-mono">Q2 2026</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Training data:</span>
            <span className="text-foreground font-mono">2,847 closed deals</span>
          </div>
        </div>
      </div>
    </div>
  );
}
