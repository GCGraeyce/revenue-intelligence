import { useState, useMemo } from 'react';
import { Deal } from '@/data/demo-data';
import { useRole } from '@/contexts/RoleContext';
import { cn, fmt } from '@/lib/utils';
import { Settings, AlertTriangle, Bell, TrendingDown, MinusCircle, Clock } from 'lucide-react';

/* ─── Types ─── */
interface AlertType {
  id: string;
  name: string;
  description: string;
  icon: typeof AlertTriangle;
  defaultThreshold: number;
  min: number;
  max: number;
  unit: string;
  filterFn: (deal: Deal, threshold: number) => boolean;
}

/* ─── Alert definitions ─── */
const alertTypes: AlertType[] = [
  {
    id: 'intervention',
    name: 'Intervention Queue',
    description: 'PQS score below threshold for high-value deals',
    icon: AlertTriangle,
    defaultThreshold: 45,
    min: 10,
    max: 80,
    unit: 'PQS',
    filterFn: (deal, threshold) => deal.pqScore < threshold && deal.acv > 50000,
  },
  {
    id: 'at-risk',
    name: 'At-Risk',
    description: 'Deals with PQS below threshold',
    icon: Bell,
    defaultThreshold: 40,
    min: 10,
    max: 70,
    unit: 'PQS',
    filterFn: (deal, threshold) => deal.pqScore < threshold,
  },
  {
    id: 'slip-risk',
    name: 'Slip Risk',
    description: 'Slip probability above threshold',
    icon: TrendingDown,
    defaultThreshold: 25,
    min: 5,
    max: 60,
    unit: '%',
    filterFn: (deal, threshold) => deal.probabilities.slip > threshold / 100,
  },
  {
    id: 'no-decision',
    name: 'No-Decision Risk',
    description: 'No-decision probability above threshold',
    icon: MinusCircle,
    defaultThreshold: 30,
    min: 5,
    max: 60,
    unit: '%',
    filterFn: (deal, threshold) => deal.probabilities.noDecision > threshold / 100,
  },
];

/* ─── Threshold indicator color ─── */
function thresholdColor(count: number): string {
  if (count > 50) return 'text-[hsl(var(--grade-c))]';
  if (count < 5) return 'text-[hsl(var(--grade-f))]';
  return 'text-[hsl(var(--grade-a))]';
}

function thresholdBg(count: number): string {
  if (count > 50) return 'bg-[hsl(var(--grade-c)/.06)]';
  if (count < 5) return 'bg-[hsl(var(--grade-f)/.06)]';
  return 'bg-[hsl(var(--grade-a)/.06)]';
}

/* ─── Single Alert Row ─── */
function AlertRow({
  alert,
  deals,
  isEditable,
}: {
  alert: AlertType;
  deals: Deal[];
  isEditable: boolean;
}) {
  const [threshold, setThreshold] = useState(alert.defaultThreshold);

  const { matchCount, matchACV } = useMemo(() => {
    const matched = deals.filter((d) => alert.filterFn(d, threshold));
    return {
      matchCount: matched.length,
      matchACV: matched.reduce((s, d) => s + d.acv, 0),
    };
  }, [deals, threshold, alert]);

  const Icon = alert.icon;

  return (
    <div className="p-4 rounded-lg bg-secondary/30 border border-border/30 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-destructive" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">{alert.name}</div>
            <div className="text-[10px] text-muted-foreground">{alert.description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold text-foreground">
            {threshold}
            {alert.unit === '%' ? '%' : ''}
          </div>
          <div className="text-[9px] font-mono text-muted-foreground">{alert.unit} threshold</div>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={alert.min}
          max={alert.max}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          disabled={!isEditable}
          className={cn(
            'w-full h-1.5 rounded-full appearance-none cursor-pointer',
            'bg-secondary/80 accent-primary',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-card',
            !isEditable && 'opacity-50 cursor-not-allowed'
          )}
        />
        <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
          <span>
            {alert.min}
            {alert.unit === '%' ? '%' : ''}
          </span>
          <span>
            {alert.max}
            {alert.unit === '%' ? '%' : ''}
          </span>
        </div>
      </div>

      {/* Real-time preview */}
      <div className={cn('rounded-md px-3 py-2', thresholdBg(matchCount))}>
        <div className={cn('text-xs font-mono', thresholdColor(matchCount))}>
          At this threshold: <span className="font-bold">{matchCount} deals</span> ({fmt(matchACV)}{' '}
          ACV) would trigger
        </div>
        {matchCount > 50 && (
          <div className="text-[9px] font-mono text-[hsl(var(--grade-c))] mt-0.5">
            Warning: Too many alerts may cause notification fatigue
          </div>
        )}
        {matchCount < 5 && (
          <div className="text-[9px] font-mono text-[hsl(var(--grade-f))] mt-0.5">
            Warning: Too few alerts may miss at-risk deals
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export function AlertThresholdEditor({ deals }: { deals: Deal[] }) {
  const { role } = useRole();
  const isEditable = role === 'revops';

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Settings className="w-3 h-3 text-primary" />
        </div>
        <span className="metric-label">Alert Thresholds</span>
        {!isEditable && (
          <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-secondary/50 ml-auto">
            Read Only — RevOps role required
          </span>
        )}
      </div>

      {/* Alert rows */}
      <div className="space-y-3">
        {alertTypes.map((alert) => (
          <AlertRow key={alert.id} alert={alert} deals={deals} isEditable={isEditable} />
        ))}
      </div>

      {/* Audit trail */}
      <div className="border-t border-border/30 pt-3">
        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          Last changed by admin@acmecorp.com on Feb 26, 2026
        </div>
      </div>
    </div>
  );
}
