import { useState } from 'react';
import { Deal } from '@/data/demo-data';
import { GradeBadge } from './GradeBadge';
import { DealDrawer } from './DealDrawer';
import { AlertTriangle, Clock, Users, TrendingDown } from 'lucide-react';
import { fmt } from '@/lib/utils';

// Stage-specific stall thresholds (days) — aligned with sales playbook
const STALL_THRESHOLDS: Record<string, number> = {
  Discovery: 21,
  Qualification: 21,
  Proposal: 14,
  Negotiation: 10,
};

/** Build human-readable reasons why a deal is flagged */
function getReasons(
  d: Deal
): { icon: React.ElementType; text: string; severity: 'critical' | 'warning' }[] {
  const reasons: { icon: React.ElementType; text: string; severity: 'critical' | 'warning' }[] = [];

  // Low PQS
  if (d.pqScore < 30) {
    reasons.push({
      icon: TrendingDown,
      text: `PQS ${d.pqScore} — critically low quality score`,
      severity: 'critical',
    });
  } else if (d.pqScore < 45) {
    reasons.push({
      icon: TrendingDown,
      text: `PQS ${d.pqScore} — below 45 threshold`,
      severity: 'warning',
    });
  }

  // Stage stall
  const threshold = STALL_THRESHOLDS[d.stage];
  if (threshold && d.daysInStage > threshold) {
    reasons.push({
      icon: Clock,
      text: `${d.daysInStage}d in ${d.stage} — exceeds ${threshold}d benchmark`,
      severity: d.daysInStage > threshold * 1.5 ? 'critical' : 'warning',
    });
  }

  // Persona gaps
  if (d.personaGaps.length >= 3) {
    reasons.push({
      icon: Users,
      text: `Missing ${d.personaGaps.length} stakeholders: ${d.personaGaps.slice(0, 2).join(', ')}${d.personaGaps.length > 2 ? '...' : ''}`,
      severity: 'critical',
    });
  } else if (d.personaGaps.length > 0) {
    reasons.push({
      icon: Users,
      text: `Missing: ${d.personaGaps.join(', ')}`,
      severity: 'warning',
    });
  }

  // Slip risk
  if (d.probabilities.slip > 0.35) {
    reasons.push({
      icon: AlertTriangle,
      text: `${Math.round(d.probabilities.slip * 100)}% slip probability`,
      severity: 'critical',
    });
  }

  return reasons;
}

export function InterventionQueue({ deals }: { deals: Deal[] }) {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const flagged = deals
    .filter((d) => d.pqScore < 45 && d.acv > 50000)
    .sort((a, b) => b.acv - a.acv)
    .slice(0, 8);
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="metric-label">Intervention Queue</div>
        <span className="text-[9px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted/50">
          PQS &lt; 45 + ACV &gt; €50K
        </span>
      </div>
      <div className="space-y-1.5">
        {flagged.map((d, i) => {
          const reasons = getReasons(d);
          return (
            <div
              key={d.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
              onClick={() => setSelectedDeal(d)}
            >
              <GradeBadge grade={d.grade} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate text-foreground">
                    {d.company}
                  </span>
                  <span className="text-sm font-mono font-bold text-foreground">{fmt(d.acv)}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {d.rep} · {d.stage} · {d.daysInStage}d in stage
                </div>
                {/* Rationale — why this deal is flagged */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {reasons.map((r, ri) => {
                    const Icon = r.icon;
                    return (
                      <span
                        key={ri}
                        className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${
                          r.severity === 'critical'
                            ? 'bg-grade-f/10 text-grade-f'
                            : 'bg-grade-c/10 text-grade-c'
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                        {r.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
