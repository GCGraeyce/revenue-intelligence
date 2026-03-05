import { useState, useMemo, useEffect, useCallback } from 'react';
import { pipelineDeals, type Deal } from '@/data/demo-data';
// Coaching plays derived from evercam-context.ts sales playbook
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { loadPlayProgress, savePlayProgress } from '@/lib/coaching-persistence';
import { cn } from '@/lib/utils';
import {
  Zap,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Play Definitions — executable coaching workflows
// ---------------------------------------------------------------------------

interface PlayStep {
  id: string;
  label: string;
  description: string;
  owner: 'rep' | 'manager' | 'system';
  estimatedMinutes: number;
}

interface CoachingPlay {
  id: string;
  name: string;
  trigger: string;
  icon: React.ElementType;
  color: string;
  targetDeals: (deals: Deal[]) => Deal[];
  steps: PlayStep[];
  expectedOutcome: string;
  successMetric: string;
}

const COACHING_PLAYS: CoachingPlay[] = [
  {
    id: 'eb-recovery',
    name: 'Economic Buyer Recovery',
    trigger: 'Proposal/Negotiation deal missing Economic Buyer engagement',
    icon: Users,
    color: 'grade-f',
    targetDeals: (deals) =>
      deals.filter(
        (d) =>
          (d.stage === 'Proposal' || d.stage === 'Negotiation') &&
          d.personaGaps.some((g) => g.includes('Economic Buyer'))
      ),
    steps: [
      {
        id: 'eb-1',
        label: 'Identify the EB',
        description:
          'Research org chart to find CFO/Finance Director. Check LinkedIn, company website, annual reports.',
        owner: 'rep',
        estimatedMinutes: 15,
      },
      {
        id: 'eb-2',
        label: 'Coach champion access',
        description:
          'Prep champion with talking points for why EB meeting benefits them. Frame as "protecting the project budget".',
        owner: 'manager',
        estimatedMinutes: 20,
      },
      {
        id: 'eb-3',
        label: 'Build ROI case',
        description:
          'Generate ROI calculator with dispute avoidance, insurance reduction, and time-lapse marketing value.',
        owner: 'rep',
        estimatedMinutes: 30,
      },
      {
        id: 'eb-4',
        label: 'Request EB meeting',
        description:
          "Send personalized email via champion introducing Evercam's financial impact on similar projects.",
        owner: 'rep',
        estimatedMinutes: 10,
      },
      {
        id: 'eb-5',
        label: 'Deliver EB presentation',
        description:
          'Present ROI case focused on CFO priorities: cost avoidance, risk reduction, project visibility.',
        owner: 'rep',
        estimatedMinutes: 45,
      },
      {
        id: 'eb-6',
        label: 'Log outcome',
        description: 'Record EB meeting outcome, next steps, and updated deal score in CRM.',
        owner: 'system',
        estimatedMinutes: 5,
      },
    ],
    expectedOutcome: 'EB engaged with ROI understanding, deal PQS increases 15-25 points',
    successMetric: 'EB meeting held within 10 business days',
  },
  {
    id: 'stall-breaker',
    name: 'Stall Breaker',
    trigger: 'Deal stuck in current stage beyond typical duration',
    icon: Clock,
    color: 'grade-c',
    targetDeals: (deals) => deals.filter((d) => d.daysInStage > 20),
    steps: [
      {
        id: 'sb-1',
        label: 'Diagnose the stall',
        description:
          'Review activity history — when was last meaningful interaction? Is it us or them?',
        owner: 'rep',
        estimatedMinutes: 10,
      },
      {
        id: 'sb-2',
        label: 'Manager review',
        description:
          'Discuss deal with manager. Decision: escalate, re-engage with new value, or deprioritise.',
        owner: 'manager',
        estimatedMinutes: 15,
      },
      {
        id: 'sb-3',
        label: 'New value trigger',
        description:
          'Prepare a new reason to re-engage: case study, product update, industry insight, or competitive intelligence.',
        owner: 'rep',
        estimatedMinutes: 20,
      },
      {
        id: 'sb-4',
        label: 'Multi-thread outreach',
        description:
          "Contact 2-3 stakeholders simultaneously with personalized messages. Don't rely on single thread.",
        owner: 'rep',
        estimatedMinutes: 25,
      },
      {
        id: 'sb-5',
        label: 'Set deadline',
        description:
          'Create a mutual action plan with specific dates. If no response in 5 days, move to disqualification review.',
        owner: 'rep',
        estimatedMinutes: 10,
      },
      {
        id: 'sb-6',
        label: 'Update pipeline',
        description: 'Based on response, either advance deal or move to Omit forecast category.',
        owner: 'system',
        estimatedMinutes: 5,
      },
    ],
    expectedOutcome: 'Deal unstalled or cleanly disqualified within 2 weeks',
    successMetric: 'Response within 5 business days OR deal re-categorized',
  },
  {
    id: 'multi-thread',
    name: 'Multi-Threading Campaign',
    trigger: 'Enterprise deal with only 1-2 stakeholder contacts',
    icon: Target,
    color: 'grade-b',
    targetDeals: (deals) =>
      deals.filter((d) => d.segment === 'Enterprise' && d.personaGaps.length >= 2),
    steps: [
      {
        id: 'mt-1',
        label: 'Map the buying committee',
        description:
          'Identify all 5 buyer personas for this account. Use LinkedIn Sales Nav + champion intel.',
        owner: 'rep',
        estimatedMinutes: 20,
      },
      {
        id: 'mt-2',
        label: 'Prioritize contacts',
        description:
          'Rank by influence × accessibility. Focus on Safety Officer (quick win) and Technical Evaluator.',
        owner: 'manager',
        estimatedMinutes: 10,
      },
      {
        id: 'mt-3',
        label: 'Personalize outreach',
        description:
          'Draft persona-specific messages. Safety → compliance value. IT → integration ease. CFO → ROI.',
        owner: 'rep',
        estimatedMinutes: 30,
      },
      {
        id: 'mt-4',
        label: 'Leverage champion',
        description: 'Ask champion to make warm introductions to prioritized contacts.',
        owner: 'rep',
        estimatedMinutes: 15,
      },
      {
        id: 'mt-5',
        label: 'Track engagement',
        description: 'Log each new contact added, meetings held, and persona gap closures.',
        owner: 'system',
        estimatedMinutes: 5,
      },
    ],
    expectedOutcome: '2+ new stakeholders engaged, persona gaps reduced to 0-1',
    successMetric: 'At least 2 new personas engaged within 15 business days',
  },
  {
    id: 'objection-handler',
    name: 'Objection Resolution',
    trigger: 'Deal facing known objection pattern that can be overcome',
    icon: AlertTriangle,
    color: 'grade-c',
    targetDeals: (deals) =>
      deals.filter((d) => d.stage === 'Proposal' && d.competitor !== null && d.pqScore < 55),
    steps: [
      {
        id: 'oh-1',
        label: 'Identify objection type',
        description:
          'Classify: ROI doubt, CCTV comparison, connectivity concern, timing, privacy, or integration worry.',
        owner: 'rep',
        estimatedMinutes: 5,
      },
      {
        id: 'oh-2',
        label: 'Review playbook response',
        description:
          'Pull the standard objection response and supporting assets from the sales playbook.',
        owner: 'system',
        estimatedMinutes: 2,
      },
      {
        id: 'oh-3',
        label: 'Customize response',
        description:
          "Tailor the response to this specific prospect's situation and industry vertical.",
        owner: 'rep',
        estimatedMinutes: 15,
      },
      {
        id: 'oh-4',
        label: 'Deliver with proof',
        description:
          'Present response with case study, ROI data, or reference call to back up claims.',
        owner: 'rep',
        estimatedMinutes: 20,
      },
      {
        id: 'oh-5',
        label: 'Confirm resolution',
        description:
          'Ask directly if concern is addressed. If not, escalate to manager for support.',
        owner: 'rep',
        estimatedMinutes: 5,
      },
    ],
    expectedOutcome: 'Objection resolved, deal advances to next stage',
    successMetric: 'Objection marked as resolved within 7 business days',
  },
];

// ---------------------------------------------------------------------------
// Step Progress Tracking (in-memory state)
// ---------------------------------------------------------------------------

type StepStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';

function PlayCard({
  play,
  dealCount,
  totalACV,
  topDeals,
}: {
  play: CoachingPlay;
  dealCount: number;
  totalACV: number;
  topDeals: Deal[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>(() => {
    const saved = loadPlayProgress(play.id);
    if (saved) return saved;
    return Object.fromEntries(play.steps.map((s) => [s.id, 'pending' as StepStatus]));
  });

  // Persist to localStorage on every change
  useEffect(() => {
    savePlayProgress(play.id, stepStatuses);
  }, [play.id, stepStatuses]);

  const completedSteps = Object.values(stepStatuses).filter((s) => s === 'completed').length;
  const progressPct = Math.round((completedSteps / play.steps.length) * 100);

  const Icon = play.icon;

  const toggleStep = useCallback((stepId: string) => {
    setStepStatuses((prev) => {
      const current = prev[stepId];
      const next =
        current === 'pending' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'pending';
      return { ...prev, [stepId]: next };
    });
  }, []);

  const fmt = (n: number) =>
    n >= 1000000 ? `€${(n / 1000000).toFixed(1)}M` : `€${(n / 1000).toFixed(0)}K`;

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              `bg-[hsl(var(--${play.color})/.1)]`
            )}
          >
            <Icon className={cn('w-4 h-4', `text-[hsl(var(--${play.color}))]`)} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{play.name}</div>
            <div className="text-[10px] text-muted-foreground">{play.trigger}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-foreground">
              {dealCount} deals · {fmt(totalACV)}
            </div>
            {completedSteps > 0 && (
              <div className="text-[10px] font-mono text-[hsl(var(--grade-a))]">
                {completedSteps}/{play.steps.length} steps done
              </div>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Progress bar */}
          <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', `bg-[hsl(var(--${play.color}))]`)}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Playbook Steps
            </div>
            {play.steps.map((step) => {
              const status = stepStatuses[step.id];
              const StatusIcon =
                status === 'completed' ? CheckCircle2 : status === 'in-progress' ? Clock : Circle;
              const statusColor =
                status === 'completed'
                  ? 'text-[hsl(var(--grade-a))]'
                  : status === 'in-progress'
                    ? 'text-primary'
                    : 'text-muted-foreground/40';

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                    status === 'in-progress' && 'bg-primary/5',
                    status === 'completed' && 'bg-[hsl(var(--grade-a)/.03)]',
                    'hover:bg-accent/30'
                  )}
                  onClick={() => toggleStep(step.id)}
                >
                  <StatusIcon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', statusColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          status === 'completed' && 'line-through text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {step.owner === 'rep' ? 'REP' : step.owner === 'manager' ? 'MGR' : 'AUTO'}
                      </span>
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {step.estimatedMinutes}min
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expected Outcome */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5">
            <Zap className="w-3.5 h-3.5 text-primary mt-0.5" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-0.5">
                Expected Outcome
              </div>
              <div className="text-[11px] text-foreground">{play.expectedOutcome}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Success metric: {play.successMetric}
              </div>
            </div>
          </div>

          {/* Target Deals */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
              Target Deals ({dealCount})
            </div>
            <div className="space-y-1">
              {topDeals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between text-[11px]">
                  <div className="truncate text-foreground">{deal.company}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-muted-foreground">{deal.rep}</span>
                    <span className="font-mono">{fmt(deal.acv)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExecutableCoachingPlays({ scopedDeals }: { scopedDeals?: Deal[] }) {
  const { filteredDeals, isFiltered } = useProductFilter();
  const baseLine = scopedDeals || pipelineDeals;
  const deals = isFiltered ? filteredDeals.filter((d) => baseLine.includes(d)) : baseLine;

  const playData = useMemo(() => {
    return COACHING_PLAYS.map((play) => {
      const targetDeals = play.targetDeals(deals).sort((a, b) => b.acv - a.acv);
      return {
        play,
        dealCount: targetDeals.length,
        totalACV: targetDeals.reduce((s, d) => s + d.acv, 0),
        topDeals: targetDeals,
      };
    })
      .filter((p) => p.dealCount > 0)
      .sort((a, b) => b.totalACV - a.totalACV);
  }, [deals]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Executable Coaching Plays
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {playData.length} active plays · {playData.reduce((s, p) => s + p.dealCount, 0)} deals
          targeted
        </div>
      </div>

      <div className="space-y-3">
        {playData.map(({ play, dealCount, totalACV, topDeals }) => (
          <PlayCard
            key={play.id}
            play={play}
            dealCount={dealCount}
            totalACV={totalACV}
            topDeals={topDeals}
          />
        ))}
      </div>
    </div>
  );
}
