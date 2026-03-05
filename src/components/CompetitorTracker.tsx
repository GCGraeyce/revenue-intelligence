import { useMemo, useState } from 'react';
import { pipelineDeals, getCompetitorSummary, type Deal } from '@/data/demo-data';
import { COMPETITORS as COMPETITOR_DATA } from '@/data/evercam-context';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { DealDrawer } from './DealDrawer';
import { cn, fmt } from '@/lib/utils';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface CompetitorAnalysis {
  name: string;
  dealCount: number;
  totalACV: number;
  avgPQS: number;
  winRateVs: number; // historical win rate against this competitor
  byStage: Record<string, number>;
  topDeals: Deal[];
  battlecard?: {
    strengths: string[];
    weaknesses: string[];
    talkingPoints: string[];
  };
}

function buildCompetitorAnalysis(deals: Deal[]): CompetitorAnalysis[] {
  const summary = getCompetitorSummary(deals);

  return summary.map((comp) => {
    const compDeals = deals.filter((d) => d.competitor === comp.competitor);
    const byStage: Record<string, number> = {};
    compDeals.forEach((d) => {
      byStage[d.stage] = (byStage[d.stage] || 0) + 1;
    });

    // Find battlecard data from evercam-context
    const contextData = COMPETITOR_DATA.find(
      (c) =>
        c.name.toLowerCase().includes(comp.competitor.toLowerCase()) ||
        comp.competitor.toLowerCase().includes(c.name.toLowerCase())
    );

    return {
      name: comp.competitor,
      dealCount: comp.dealCount,
      totalACV: comp.totalACV,
      avgPQS: comp.avgPQS,
      winRateVs: contextData?.evercamWinRate || 50,
      byStage,
      topDeals: compDeals.sort((a, b) => b.acv - a.acv).slice(0, 5),
      battlecard: contextData
        ? {
            strengths: contextData.strengths,
            weaknesses: contextData.weaknesses,
            talkingPoints: contextData.battlecard,
          }
        : undefined,
    };
  });
}

function CompetitorCard({
  analysis,
  onSelectDeal,
}: {
  analysis: CompetitorAnalysis;
  onSelectDeal: (deal: Deal) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const winColor =
    analysis.winRateVs >= 60 ? 'grade-a' : analysis.winRateVs >= 45 ? 'grade-c' : 'grade-f';
  const pqsColor =
    analysis.avgPQS >= 60 ? 'grade-a' : analysis.avgPQS >= 45 ? 'grade-c' : 'grade-f';

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{analysis.name}</span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {analysis.dealCount} deals
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-foreground">{fmt(analysis.totalACV)}</div>
            <div className={cn('text-[10px] font-mono', `text-[hsl(var(--${winColor}))]`)}>
              {analysis.winRateVs}% win rate
            </div>
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
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className={cn('text-lg font-mono font-bold', `text-[hsl(var(--${winColor}))]`)}>
                {analysis.winRateVs}%
              </div>
              <div className="text-[9px] text-muted-foreground">Win Rate vs</div>
            </div>
            <div className="text-center">
              <div className={cn('text-lg font-mono font-bold', `text-[hsl(var(--${pqsColor}))]`)}>
                {analysis.avgPQS}
              </div>
              <div className="text-[9px] text-muted-foreground">Avg PQS</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-foreground">
                {fmt(analysis.totalACV)}
              </div>
              <div className="text-[9px] text-muted-foreground">Total ACV</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-bold text-foreground">
                {analysis.dealCount}
              </div>
              <div className="text-[9px] text-muted-foreground">Active Deals</div>
            </div>
          </div>

          {/* Stage Distribution */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
              Stage Distribution
            </div>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden">
              {['Discovery', 'Qualification', 'Proposal', 'Negotiation'].map((stage) => {
                const count = analysis.byStage[stage] || 0;
                const pct = analysis.dealCount > 0 ? (count / analysis.dealCount) * 100 : 0;
                const colors: Record<string, string> = {
                  Discovery: 'bg-blue-400',
                  Qualification: 'bg-yellow-400',
                  Proposal: 'bg-orange-400',
                  Negotiation: 'bg-green-400',
                };
                return pct > 0 ? (
                  <div
                    key={stage}
                    className={cn('h-full', colors[stage])}
                    style={{ width: `${pct}%` }}
                    title={`${stage}: ${count}`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1 font-mono">
              {['Discovery', 'Qualification', 'Proposal', 'Negotiation'].map((stage) => (
                <span key={stage}>
                  {stage.slice(0, 4)} {analysis.byStage[stage] || 0}
                </span>
              ))}
            </div>
          </div>

          {/* Battlecard */}
          {analysis.battlecard && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Battlecard
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-medium text-[hsl(var(--grade-f))] mb-1">
                    Their Strengths
                  </div>
                  {analysis.battlecard.strengths.slice(0, 3).map((s, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-muted-foreground flex items-start gap-1"
                    >
                      <span className="text-[hsl(var(--grade-f))]">-</span> {s}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] font-medium text-[hsl(var(--grade-a))] mb-1">
                    Their Weaknesses
                  </div>
                  {analysis.battlecard.weaknesses.slice(0, 3).map((w, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-muted-foreground flex items-start gap-1"
                    >
                      <span className="text-[hsl(var(--grade-a))]">+</span> {w}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-primary mb-1">Talking Points</div>
                {analysis.battlecard.talkingPoints.slice(0, 3).map((t, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-foreground flex items-start gap-1.5 mb-1"
                  >
                    <span className="text-primary/60 font-mono">{i + 1}.</span> {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Deals */}
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">
              Top Active Deals
            </div>
            <div className="space-y-1">
              {analysis.topDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between text-[11px] cursor-pointer hover:bg-muted/30 rounded p-1 -mx-1 transition-colors"
                  onClick={() => onSelectDeal(deal)}
                >
                  <div className="truncate text-foreground">{deal.company}</div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground">{deal.stage}</span>
                    <span className="font-mono">{fmt(deal.acv)}</span>
                    <span
                      className={cn(
                        'font-mono text-[10px]',
                        deal.pqScore >= 60
                          ? 'text-[hsl(var(--grade-a))]'
                          : deal.pqScore >= 40
                            ? 'text-[hsl(var(--grade-c))]'
                            : 'text-[hsl(var(--grade-f))]'
                      )}
                    >
                      {deal.pqScore}
                    </span>
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

export function CompetitorTracker() {
  const { filteredDeals, isFiltered } = useProductFilter();
  const deals = isFiltered ? filteredDeals : pipelineDeals;
  const analyses = useMemo(() => buildCompetitorAnalysis(deals), [deals]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const totalCompetitive = analyses.reduce((s, a) => s + a.dealCount, 0);
  const totalCompetitiveACV = analyses.reduce((s, a) => s + a.totalACV, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Competitive Intelligence
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {totalCompetitive} competitive deals · {fmt(totalCompetitiveACV)}
        </div>
      </div>

      <div className="space-y-3">
        {analyses.map((analysis) => (
          <CompetitorCard key={analysis.name} analysis={analysis} onSelectDeal={setSelectedDeal} />
        ))}
      </div>

      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </div>
  );
}
