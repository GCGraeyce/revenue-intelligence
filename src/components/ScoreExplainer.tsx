import { useState } from 'react';
import { Deal, Grade } from '@/data/demo-data';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/* ─── P1/P2 types (mock) ─── */
interface DimensionBreakdown {
  name: string;
  rawValue: number;
  weight: number;
  contribution: number;
  confidence: 'high' | 'medium' | 'low';
  empiricalWeight: number;
  quality: 'fresh' | 'stale' | 'missing';
  lastUpdated: string;
}

interface ScoreHistoryPoint {
  date: string;
  score: number;
  delta: number;
  reason: string;
}

export interface PQSScoreBreakdown {
  dimensions: DimensionBreakdown[];
  totalScore: number;
  history: ScoreHistoryPoint[];
}

/* ─── Mock data generator ─── */
function mockBreakdown(deal: Deal): PQSScoreBreakdown {
  const dims: DimensionBreakdown[] = [
    { name: 'Outcome Probability', rawValue: Math.round(deal.probabilities.win * 100), weight: 0.30, contribution: +(deal.probabilities.win * 30).toFixed(1), confidence: 'high', empiricalWeight: 0.28, quality: 'fresh', lastUpdated: '2h ago' },
    { name: 'ICP Fit', rawValue: deal.icpScore, weight: 0.20, contribution: +(deal.icpScore * 0.20).toFixed(1), confidence: 'medium', empiricalWeight: 0.15, quality: 'fresh', lastUpdated: '1d ago' },
    { name: 'Persona Coverage', rawValue: Math.max(0, 100 - deal.personaGaps.length * 25), weight: 0.15, contribution: +(Math.max(0, 100 - deal.personaGaps.length * 25) * 0.15).toFixed(1), confidence: deal.personaGaps.length > 2 ? 'low' : 'medium', empiricalWeight: 0.18, quality: deal.personaGaps.length > 2 ? 'stale' : 'fresh', lastUpdated: '3d ago' },
    { name: 'Process Adherence', rawValue: Math.max(0, 100 - deal.missingSteps.length * 20), weight: 0.15, contribution: +(Math.max(0, 100 - deal.missingSteps.length * 20) * 0.15).toFixed(1), confidence: 'medium', empiricalWeight: 0.17, quality: deal.missingSteps.length > 2 ? 'stale' : 'fresh', lastUpdated: '1d ago' },
    { name: 'Price Risk', rawValue: Math.round((1 - deal.priceRisk) * 100), weight: 0.05, contribution: +((1 - deal.priceRisk) * 5).toFixed(1), confidence: 'high', empiricalWeight: 0.06, quality: 'fresh', lastUpdated: '6h ago' },
    { name: 'Engagement Velocity', rawValue: Math.max(0, 100 - deal.daysInStage * 2), weight: 0.10, contribution: +(Math.max(0, 100 - deal.daysInStage * 2) * 0.10).toFixed(1), confidence: 'medium', empiricalWeight: 0.11, quality: deal.daysInStage > 30 ? 'missing' : 'fresh', lastUpdated: deal.daysInStage > 30 ? 'N/A' : '4h ago' },
    { name: 'Stage Progression', rawValue: Math.min(100, deal.daysInStage < 15 ? 80 : 50), weight: 0.05, contribution: +(Math.min(100, deal.daysInStage < 15 ? 80 : 50) * 0.05).toFixed(1), confidence: 'high', empiricalWeight: 0.05, quality: 'fresh', lastUpdated: '1h ago' },
  ];
  dims.sort((a, b) => b.contribution - a.contribution);

  const now = Date.now();
  const history: ScoreHistoryPoint[] = Array.from({ length: 30 }, (_, i) => {
    const dayOffset = 29 - i;
    const date = new Date(now - dayOffset * 86400000).toISOString().slice(0, 10);
    const jitter = Math.round((Math.random() - 0.5) * 8);
    const score = Math.max(10, Math.min(98, deal.pqScore + jitter - Math.round(dayOffset * 0.15)));
    return { date, score, delta: i === 0 ? 0 : jitter, reason: jitter > 2 ? 'EB meeting booked' : jitter < -2 ? 'Stale engagement' : 'No change' };
  });

  return { dimensions: dims, totalScore: deal.pqScore, history };
}

/* ─── Sub-components ─── */
function QualityDot({ quality }: { quality: 'fresh' | 'stale' | 'missing' }) {
  const colors = { fresh: 'bg-[hsl(var(--grade-a))]', stale: 'bg-[hsl(var(--grade-c))]', missing: 'bg-[hsl(var(--grade-f))]' };
  return <span className={cn('inline-block w-2 h-2 rounded-full', colors[quality])} />;
}

function ConfidenceDot({ level }: { level: 'high' | 'medium' | 'low' }) {
  const colors = { high: 'bg-[hsl(var(--grade-a))]', medium: 'bg-[hsl(var(--grade-c))]', low: 'bg-[hsl(var(--grade-f))]' };
  return <span className={cn('inline-block w-2 h-2 rounded-full', colors[level])} />;
}

function gradeColor(contribution: number, maxContribution: number): string {
  const ratio = contribution / Math.max(maxContribution, 1);
  if (ratio > 0.6) return 'bg-[hsl(var(--grade-a))]';
  if (ratio > 0.4) return 'bg-[hsl(var(--grade-b))]';
  if (ratio > 0.2) return 'bg-[hsl(var(--grade-c))]';
  if (ratio > 0.1) return 'bg-[hsl(var(--grade-d))]';
  return 'bg-[hsl(var(--grade-f))]';
}

function scoreToGrade(score: number): Grade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

function TrendLabel({ history }: { history: ScoreHistoryPoint[] }) {
  if (history.length < 7) return null;
  const recent = history.slice(-7);
  const first = recent[0].score;
  const last = recent[recent.length - 1].score;
  const diff = last - first;
  if (diff > 3) return <span className="text-[10px] font-mono text-[hsl(var(--grade-a))] flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Improving</span>;
  if (diff < -3) return <span className="text-[10px] font-mono text-[hsl(var(--grade-f))] flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> Declining</span>;
  return <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" /> Stable</span>;
}

/* ─── Sparkline ─── */
function Sparkline({ history }: { history: ScoreHistoryPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const scores = history.map(h => h.score);
  const min = Math.min(...scores) - 5;
  const max = Math.max(...scores) + 5;
  const w = 280;
  const h = 48;
  const points = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * w;
    const y = h - ((s - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');

  const grade = scoreToGrade(scores[scores.length - 1]);
  const strokeColor = grade === 'A' ? 'hsl(var(--grade-a))' : grade === 'B' ? 'hsl(var(--grade-b))' : grade === 'C' ? 'hsl(var(--grade-c))' : grade === 'D' ? 'hsl(var(--grade-d))' : 'hsl(var(--grade-f))';

  return (
    <div className="relative">
      <svg width={w} height={h} className="overflow-visible" onMouseLeave={() => setHoveredIdx(null)}>
        <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" points={points} strokeLinejoin="round" strokeLinecap="round" />
        {scores.map((s, i) => {
          const x = (i / (scores.length - 1)) * w;
          const y = h - ((s - min) / (max - min)) * h;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={hoveredIdx === i ? 3 : 1.5}
              fill={strokeColor}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          );
        })}
      </svg>
      {hoveredIdx !== null && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card border border-border/60 rounded-lg px-2.5 py-1.5 shadow-lg z-10 whitespace-nowrap">
          <div className="text-[10px] font-mono text-muted-foreground">{history[hoveredIdx].date}</div>
          <div className="text-xs font-mono font-bold text-foreground">PQS: {history[hoveredIdx].score} ({history[hoveredIdx].delta >= 0 ? '+' : ''}{history[hoveredIdx].delta})</div>
          <div className="text-[10px] text-muted-foreground">{history[hoveredIdx].reason}</div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export function ScoreExplainer({ deal, breakdown: externalBreakdown }: { deal: Deal; breakdown?: PQSScoreBreakdown }) {
  const breakdown = externalBreakdown ?? mockBreakdown(deal);
  const [showFeatureImportance, setShowFeatureImportance] = useState(false);
  const maxContribution = Math.max(...breakdown.dimensions.map(d => d.contribution));
  const maxBarWidth = 100; // percentage

  return (
    <div className="glass-card p-5 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <Info className="w-3 h-3 text-primary" />
          </div>
          PQS Score Breakdown
        </div>
        <div className="font-mono text-lg font-bold text-foreground">{breakdown.totalScore}</div>
      </div>

      {/* Waterfall chart */}
      <div className="space-y-1.5">
        {breakdown.dimensions.map(dim => {
          const barPct = Math.min(maxBarWidth, (dim.contribution / maxContribution) * maxBarWidth);
          return (
            <div key={dim.name} className="flex items-center gap-2 group">
              <span className="text-[10px] text-muted-foreground w-28 truncate flex-shrink-0">{dim.name}</span>
              <div className="flex-1 h-5 bg-secondary/50 rounded overflow-hidden relative">
                <div
                  className={cn('h-full rounded transition-all', gradeColor(dim.contribution, maxContribution))}
                  style={{ width: `${barPct}%`, opacity: 0.8 }}
                />
                <span className="absolute inset-y-0 right-1 flex items-center text-[9px] font-mono text-muted-foreground">
                  {dim.contribution}
                </span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground w-8 text-right flex-shrink-0">{dim.rawValue}</span>
              <span className="text-[9px] font-mono text-muted-foreground w-8 text-right flex-shrink-0">{Math.round(dim.weight * 100)}%</span>
              <ConfidenceDot level={dim.confidence} />
            </div>
          );
        })}
        {/* Legend */}
        <div className="flex items-center gap-4 pt-1 text-[9px] text-muted-foreground">
          <span>Dimension</span>
          <span className="flex-1" />
          <span>Contribution</span>
          <span className="w-8 text-right">Raw</span>
          <span className="w-8 text-right">Wt</span>
          <span className="w-2">Cf</span>
        </div>
      </div>

      {/* Feature importance toggle */}
      <div>
        <button
          onClick={() => setShowFeatureImportance(!showFeatureImportance)}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {showFeatureImportance ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Why these weights?
        </button>
        {showFeatureImportance && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {breakdown.dimensions.map(dim => {
              const configPct = Math.round(dim.weight * 100);
              const empiricalPct = Math.round(dim.empiricalWeight * 100);
              const misaligned = Math.abs(configPct - empiricalPct) > 3;
              return (
                <div key={dim.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{dim.name}</span>
                    {misaligned && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]">
                        Configured {configPct}% but empirical impact is {empiricalPct}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground w-16">Config</span>
                    <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${configPct}%` }} />
                    </div>
                    <span className="text-[9px] font-mono w-6 text-right">{configPct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-muted-foreground w-16">Empirical</span>
                    <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
                      <div className="h-full bg-[hsl(var(--grade-b))] rounded-full" style={{ width: `${empiricalPct}%` }} />
                    </div>
                    <span className="text-[9px] font-mono w-6 text-right">{empiricalPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data quality row */}
      <div>
        <div className="metric-label mb-2">Data Quality</div>
        <div className="flex flex-wrap gap-2">
          {breakdown.dimensions.map(dim => (
            <div
              key={dim.name}
              className="group relative flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-[10px] text-muted-foreground cursor-default"
            >
              <QualityDot quality={dim.quality} />
              <span className="truncate max-w-[80px]">{dim.name}</span>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-card border border-border/60 rounded-lg px-2.5 py-1.5 shadow-lg z-20 whitespace-nowrap">
                <div className="text-[10px] font-mono text-foreground">Last updated {dim.lastUpdated}</div>
                <div className="text-[9px] text-muted-foreground capitalize">Status: {dim.quality}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score history sparkline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="metric-label">30-Day Score Trend</div>
          <TrendLabel history={breakdown.history} />
        </div>
        <Sparkline history={breakdown.history} />
      </div>
    </div>
  );
}
