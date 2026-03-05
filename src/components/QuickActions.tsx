import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useRole, Role } from '@/contexts/RoleContext';
import { pipelineDeals } from '@/data/demo-data';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import {
  ArrowRight,
  AlertTriangle,
  Users,
  TrendingUp,
  Zap,
  Shield,
  BarChart3,
  Target,
} from 'lucide-react';
import { cn, fmt } from '@/lib/utils';

interface QuickAction {
  label: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  icon: React.ElementType;
  metric?: string;
  link: string;
}

function getRepActions(deals: typeof pipelineDeals, currentRep: string): QuickAction[] {
  const myDeals = deals.filter((d) => d.rep === currentRep);
  const stalled = myDeals.filter((d) => d.daysInStage > 14);
  const closeable = myDeals.filter((d) => d.stage === 'Negotiation' && d.probabilities.win > 0.4);
  const missingEB = myDeals.filter((d) => d.personaGaps.some((g) => g.includes('Economic Buyer')));
  const actions: QuickAction[] = [];

  if (closeable.length > 0) {
    actions.push({
      label: 'Close ready deals',
      description: `${closeable.length} deals in Negotiation with strong win probability — push for commitment`,
      urgency: 'high',
      icon: Target,
      metric: `${closeable.length} deals`,
      link: '/deals',
    });
  }
  if (stalled.length > 0) {
    actions.push({
      label: 'Unblock stalled deals',
      description: `${stalled.length} deals stuck >14 days — re-engage or escalate`,
      urgency: stalled.length > 3 ? 'high' : 'medium',
      icon: AlertTriangle,
      metric: `${stalled.length} stalled`,
      link: '/deals',
    });
  }
  if (missingEB.length > 0) {
    actions.push({
      label: 'Get to Economic Buyer',
      description: `${missingEB.length} deals missing EB engagement — ask champion for intro`,
      urgency: 'medium',
      icon: Users,
      metric: `${missingEB.length} gaps`,
      link: '/coaching',
    });
  }
  actions.push({
    label: 'Review coaching plays',
    description: 'Check AI-recommended actions for your pipeline',
    urgency: 'low',
    icon: Zap,
    link: '/coaching',
  });
  return actions;
}

function getManagerActions(deals: typeof pipelineDeals): QuickAction[] {
  const atRisk = deals.filter((d) => d.pqScore < 40);
  const stalled = deals.filter((d) => d.daysInStage > 20);
  const lowPQSReps = [...new Set(atRisk.map((d) => d.rep))];
  const actions: QuickAction[] = [];

  if (atRisk.length > 5) {
    actions.push({
      label: 'Review at-risk deals',
      description: `${atRisk.length} deals below PQS 40 — intervene before they slip`,
      urgency: 'high',
      icon: AlertTriangle,
      metric: `${atRisk.length} deals`,
      link: '/risk',
    });
  }
  if (lowPQSReps.length > 0) {
    actions.push({
      label: 'Coach struggling reps',
      description: `${lowPQSReps.length} reps have at-risk deals — schedule 1:1 coaching`,
      urgency: 'high',
      icon: Users,
      metric: `${lowPQSReps.length} reps`,
      link: '/coaching',
    });
  }
  if (stalled.length > 0) {
    actions.push({
      label: 'Break deal stalls',
      description: `${stalled.length} deals stalled >20 days — review and reassign`,
      urgency: 'medium',
      icon: TrendingUp,
      metric: `${stalled.length} stalled`,
      link: '/deals',
    });
  }
  actions.push({
    label: 'Update forecast',
    description: 'Review team pipeline and commit numbers before next call',
    urgency: 'medium',
    icon: BarChart3,
    link: '/pipeline',
  });
  return actions;
}

function getExecActions(deals: typeof pipelineDeals): QuickAction[] {
  const summary = {
    totalACV: deals.reduce((s, d) => s + d.acv, 0),
    atRisk: deals.filter((d) => d.pqScore < 40).length,
    slipExposure: deals.filter((d) => d.probabilities.slip > 0.25).reduce((s, d) => s + d.acv, 0),
  };
  const actions: QuickAction[] = [];

  actions.push({
    label: 'Review revenue forecast',
    description: `${fmt(summary.totalACV)} total pipeline — check confidence band and segment mix`,
    urgency: 'high',
    icon: BarChart3,
    metric: fmt(summary.totalACV),
    link: '/pipeline',
  });
  if (summary.slipExposure > 500000) {
    actions.push({
      label: 'Address slip risk',
      description: `${fmt(summary.slipExposure)} exposure from deals likely to slip — escalate`,
      urgency: 'high',
      icon: AlertTriangle,
      metric: fmt(summary.slipExposure),
      link: '/risk',
    });
  }
  actions.push({
    label: 'Check team capacity',
    description: 'Review manager performance and target attainment',
    urgency: 'medium',
    icon: Users,
    link: '/team',
  });
  actions.push({
    label: 'Pipeline coverage',
    description: 'Ensure 3x+ coverage ratio for confident forecasting',
    urgency: 'medium',
    icon: Target,
    link: '/pipeline',
  });
  return actions;
}

function getRevOpsActions(deals: typeof pipelineDeals): QuickAction[] {
  const withGaps = deals.filter((d) => d.missingSteps.length > 0).length;
  const wrongStage = deals.filter((d) => {
    if (d.stage === 'Negotiation' && d.personaGaps.some((g) => g.includes('Economic Buyer')))
      return true;
    if (d.stage === 'Proposal' && d.personaGaps.length >= 3) return true;
    return false;
  }).length;

  return [
    {
      label: 'Fix stage compliance',
      description: `${withGaps} deals have missing process steps — review and enforce`,
      urgency: withGaps > deals.length * 0.3 ? 'high' : 'medium',
      icon: Shield,
      metric: `${withGaps} gaps`,
      link: '/risk',
    },
    {
      label: 'Validate deal stages',
      description: `${wrongStage} deals appear at wrong stage — check stakeholder requirements`,
      urgency: wrongStage > 10 ? 'high' : 'medium',
      icon: AlertTriangle,
      metric: `${wrongStage} misplaced`,
      link: '/risk',
    },
    {
      label: 'Review model health',
      description: 'Check calibration, drift, and feature importance',
      urgency: 'medium',
      icon: BarChart3,
      link: '/model',
    },
    {
      label: 'Configure scoring weights',
      description: 'Align PQS weights with empirical outcomes',
      urgency: 'low',
      icon: TrendingUp,
      link: '/settings',
    },
  ];
}

function ActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  const urgencyColor =
    action.urgency === 'high' ? 'grade-f' : action.urgency === 'medium' ? 'grade-c' : 'grade-b';

  return (
    <Link
      to={action.link}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border transition-all group',
        'border-border/30 hover:border-border/60 hover:bg-accent/30',
        action.urgency === 'high' && 'bg-[hsl(var(--grade-f)/.03)]'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          `bg-[hsl(var(--${urgencyColor})/.1)]`
        )}
      >
        <Icon className={cn('w-4 h-4', `text-[hsl(var(--${urgencyColor}))]`)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{action.label}</span>
          {action.metric && (
            <span
              className={cn(
                'text-[9px] font-mono px-1.5 py-0.5 rounded',
                `bg-[hsl(var(--${urgencyColor})/.1)] text-[hsl(var(--${urgencyColor}))]`
              )}
            >
              {action.metric}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          {action.description}
        </div>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors mt-1 flex-shrink-0" />
    </Link>
  );
}

export function QuickActions() {
  const { role, currentRep } = useRole();
  const { filteredDeals, isFiltered } = useProductFilter();
  const deals = isFiltered ? filteredDeals : pipelineDeals;

  const actions = useMemo(() => {
    switch (role) {
      case 'rep':
        return getRepActions(deals, currentRep);
      case 'manager':
        return getManagerActions(deals);
      case 'exec':
      case 'admin':
        return getExecActions(deals);
      case 'revops':
        return getRevOpsActions(deals);
    }
  }, [role, deals, currentRep]);

  const roleLabel: Record<Role, string> = {
    rep: 'Your Next Steps',
    manager: 'Manager Actions',
    exec: 'Executive Priorities',
    revops: 'Ops Actions',
    admin: 'Admin Actions',
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-primary" />
        {roleLabel[role]}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {actions.map((a) => (
          <ActionCard key={a.label} action={a} />
        ))}
      </div>
    </div>
  );
}
