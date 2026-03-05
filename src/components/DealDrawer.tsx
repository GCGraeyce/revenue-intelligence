import { useState } from 'react';
import { Deal } from '@/data/demo-data';
import { COMPETITORS } from '@/data/evercam-context';
import { getCountryByCode, getDealTypeById, getPartnerById } from '@/data/company-repository';
import { GradeBadge } from '@/components/GradeBadge';
import { DealTimeline } from '@/components/DealTimeline';
import { StakeholderMap } from '@/components/StakeholderMap';
import { ScoreRadar } from '@/components/ScoreRadar';
import { TrendSparkline, generateTrendData } from '@/components/TrendSparkline';
import { DealAIAnalysis } from '@/components/DealAIAnalysis';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, CheckCircle, Zap, Clock, MapPin, Building2,
  Phone, Mail, Calendar, Users, Shield, TrendingUp,
} from 'lucide-react';

function formatCurrency(n: number) {
  return n >= 1000000 ? `€${(n / 1000000).toFixed(2)}M` : `€${(n / 1000).toFixed(0)}K`;
}

type Tab = 'overview' | 'ai' | 'timeline' | 'activity' | 'stakeholders' | 'compete';

export function DealDrawer({ deal, onClose }: { deal: Deal | null; onClose: () => void }) {
  const { explainMode, coachingMode } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!deal) return null;

  const country = getCountryByCode(deal.country);
  const dealType = getDealTypeById(deal.dealType);
  const partner = deal.channelPartner ? getPartnerById(deal.channelPartner) : null;
  const competitorData = deal.competitor
    ? COMPETITORS.find(c => c.name.toLowerCase().includes(deal.competitor!.toLowerCase()))
    : null;

  const forecastColor = deal.forecastCategory === 'Commit' ? 'grade-a' :
    deal.forecastCategory === 'Best Case' ? 'grade-b' :
    deal.forecastCategory === 'Pipeline' ? 'grade-c' : 'grade-f';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI Analysis' },
    { id: 'stakeholders', label: 'Stakeholders' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'activity', label: 'Activity' },
    ...(deal.competitor ? [{ id: 'compete' as Tab, label: 'Compete' }] : []),
  ];

  return (
    <Sheet open={!!deal} onOpenChange={() => onClose()}>
      <SheetContent className="w-[520px] bg-card border-border/50 overflow-y-auto p-0">
        {/* Header */}
        <div className="p-5 border-b border-border/30">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <GradeBadge grade={deal.grade} />
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-foreground truncate">{deal.company}</SheetTitle>
                <p className="text-xs text-muted-foreground font-mono">{deal.id} · {deal.rep} · {deal.stage}</p>
              </div>
            </div>
          </SheetHeader>

          {/* Quick badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className={cn(
              'text-[9px] font-mono px-1.5 py-0.5 rounded',
              `bg-[hsl(var(--${forecastColor})/.1)] text-[hsl(var(--${forecastColor}))]`
            )}>
              {deal.forecastCategory}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {deal.segment}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {deal.source}
            </span>
            {country && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {country.name}
              </span>
            )}
            {deal.competitor && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]">
                vs {deal.competitor}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 text-xs font-medium py-2.5 transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-5">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Key metrics with trend sparklines */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">ACV</div>
                  <div className="font-mono text-lg font-bold">{formatCurrency(deal.acv)}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">PQ Score</div>
                    <TrendSparkline data={generateTrendData(deal.pqScore, 8, 0.1)} width={50} height={16} color={deal.pqScore >= 60 ? 'grade-a' : deal.pqScore >= 40 ? 'grade-c' : 'grade-f'} />
                  </div>
                  <div className="font-mono text-lg font-bold">{deal.pqScore}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">ICP Score</div>
                    <TrendSparkline data={generateTrendData(deal.icpScore, 6, 0.05)} width={50} height={16} color="grade-b" />
                  </div>
                  <div className="font-mono text-lg font-bold">{deal.icpScore}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Win Prob</div>
                    <TrendSparkline data={generateTrendData(Math.round(deal.probabilities.win * 100), 8, 0.12)} width={50} height={16} color={deal.probabilities.win >= 0.5 ? 'grade-a' : 'grade-c'} />
                  </div>
                  <div className="font-mono text-lg font-bold">{Math.round(deal.probabilities.win * 100)}%</div>
                </div>
              </div>

              {/* Deal Details */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Deal Details</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-mono ml-auto">{deal.createdDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Close Date</span>
                    <span className="font-mono ml-auto">{deal.closeDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Days in Stage</span>
                    <span className={cn('font-mono ml-auto', deal.daysInStage > 20 && 'text-[hsl(var(--grade-f))]')}>{deal.daysInStage}d</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-mono ml-auto">{deal.productBundle}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Project</span>
                    <span className="font-mono ml-auto truncate max-w-[120px]">{deal.projectType}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Cameras</span>
                    <span className="font-mono ml-auto">{deal.cameraCount}</span>
                  </div>
                  {dealType && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-mono ml-auto">{dealType.name}</span>
                    </div>
                  )}
                  {partner && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Partner</span>
                      <span className="font-mono ml-auto truncate max-w-[120px]">{partner.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MEDDIC Scores */}
              {deal.meddic && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">MEDDIC Assessment</h4>
                  <div className="space-y-1.5">
                    {(['metrics', 'economicBuyer', 'decisionCriteria', 'decisionProcess', 'identifyPain', 'champion'] as const).map(key => {
                      const labels: Record<string, string> = { metrics: 'Metrics', economicBuyer: 'Economic Buyer', decisionCriteria: 'Decision Criteria', decisionProcess: 'Decision Process', identifyPain: 'Identify Pain', champion: 'Champion' };
                      const val = deal.meddic[key];
                      const color = val >= 70 ? 'grade-a' : val >= 45 ? 'grade-c' : 'grade-f';
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-28">{labels[key]}</span>
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full bg-[hsl(var(--${color}))] rounded-full transition-all`} style={{ width: `${val}%` }} />
                          </div>
                          <span className={cn('text-[10px] font-mono w-7 text-right', `text-[hsl(var(--${color}))]`)}>{val}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[10px]">
                      <span className="text-muted-foreground font-semibold">Overall MEDDIC</span>
                      <span className={cn('font-mono font-bold', deal.meddic.overall >= 60 ? 'text-[hsl(var(--grade-a))]' : deal.meddic.overall >= 40 ? 'text-[hsl(var(--grade-c))]' : 'text-[hsl(var(--grade-f))]')}>
                        {deal.meddic.overall}/100
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Commercial Terms */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Commercial</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract</span>
                    <span className="font-mono text-foreground">{deal.contractType} · {deal.contractLength}mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-mono text-foreground">{deal.currencyCode}</span>
                  </div>
                  {deal.discountPct > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-mono text-[hsl(var(--grade-c))]">{deal.discountPct}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renewal Prob</span>
                    <span className="font-mono text-foreground">{Math.round(deal.renewalProbability * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn('font-mono', deal.status === 'active' ? 'text-[hsl(var(--grade-a))]' : deal.status === 'won' ? 'text-primary' : 'text-[hsl(var(--grade-f))]')}>
                      {deal.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Implementation</span>
                    <span className="font-mono text-foreground">{deal.implementationStatus}</span>
                  </div>
                </div>
              </div>

              {/* Probabilities */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Outcome Probabilities</h4>
                <div className="space-y-2">
                  {(['win', 'loss', 'noDecision', 'slip'] as const).map(key => {
                    const labels = { win: 'Win', loss: 'Loss', noDecision: 'No Decision', slip: 'Slip' };
                    const colors = { win: 'bg-signal-win', loss: 'bg-signal-loss', noDecision: 'bg-signal-nodecision', slip: 'bg-signal-slip' };
                    const pct = Math.round(deal.probabilities[key] * 100);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20">{labels[key]}</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${colors[key]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PQS Score Radar */}
              <ScoreRadar deal={deal} />

              {/* Persona gaps */}
              {deal.personaGaps.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-grade-d" /> Persona Gaps
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {deal.personaGaps.map(g => (
                      <span key={g} className="text-xs px-2 py-1 rounded-md bg-[hsl(var(--grade-d)/.1)] text-grade-d border border-[hsl(var(--grade-d)/.2)]">{g}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing steps */}
              {deal.missingSteps.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-grade-c" /> Missing Steps
                  </h4>
                  <div className="space-y-1">
                    {deal.missingSteps.map(s => (
                      <div key={s} className="text-xs px-2 py-1.5 rounded bg-secondary/50 text-secondary-foreground">{s}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next actions */}
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" /> Next Actions
                  {coachingMode === 'agentic' && <span className="text-[9px] bg-primary/20 text-primary px-1.5 rounded ml-1">AUTO</span>}
                </h4>
                <div className="space-y-1">
                  {deal.nextActions.map(a => (
                    <div key={a} className="text-xs px-2 py-1.5 rounded bg-primary/5 text-foreground border border-primary/10 flex items-center justify-between">
                      <span>{a}</span>
                      {coachingMode === 'hitl' && (
                        <button className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded hover:bg-primary/30 transition-colors">Approve</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Explain mode */}
              {explainMode && (
                <div className="border border-primary/20 rounded-lg p-3 bg-primary/5">
                  <h4 className="text-[10px] uppercase tracking-widest text-primary mb-2">Scoring Breakdown</h4>
                  <div className="text-xs text-muted-foreground space-y-1 font-mono">
                    <div>Outcome Prob: 30% × {deal.probabilities.win.toFixed(2)} = {(0.3 * deal.probabilities.win * 100).toFixed(1)}</div>
                    <div>ICP Score: 20% × {deal.icpScore} = {(0.2 * deal.icpScore).toFixed(1)}</div>
                    <div>Persona: 15% × {Math.max(0, 100 - deal.personaGaps.length * 25)} = {(0.15 * Math.max(0, 100 - deal.personaGaps.length * 25)).toFixed(1)}</div>
                    <div>Process: 15% × {Math.max(0, 100 - deal.missingSteps.length * 20)} = {(0.15 * Math.max(0, 100 - deal.missingSteps.length * 20)).toFixed(1)}</div>
                    <div>Price Risk: 5% × {Math.round((1 - deal.priceRisk) * 100)} = {(0.05 * (1 - deal.priceRisk) * 100).toFixed(1)}</div>
                    <div className="pt-1 border-t border-primary/20 text-primary font-bold">PQS = {deal.pqScore}</div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* AI ANALYSIS TAB */}
          {activeTab === 'ai' && (
            <DealAIAnalysis deal={deal} />
          )}

          {/* TIMELINE TAB */}
          {activeTab === 'timeline' && (
            <DealTimeline events={deal.timeline} />
          )}

          {/* STAKEHOLDERS TAB */}
          {activeTab === 'stakeholders' && (
            <StakeholderMap deal={deal} />
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <Phone className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-mono text-lg font-bold">{deal.activities.calls}</div>
                  <div className="text-[10px] text-muted-foreground">Calls</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <Mail className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-mono text-lg font-bold">{deal.activities.emails}</div>
                  <div className="text-[10px] text-muted-foreground">Emails</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="font-mono text-lg font-bold">{deal.activities.meetings}</div>
                  <div className="text-[10px] text-muted-foreground">Meetings</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">Last Activity</h4>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-sm font-medium text-foreground">{deal.activities.lastActivityType}</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{deal.activities.lastActivityDate}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground">Engagement Health</h4>
                <div className="space-y-1.5">
                  {(() => {
                    const totalActivity = deal.activities.calls + deal.activities.emails + deal.activities.meetings;
                    const health = totalActivity > 20 ? 'High' : totalActivity > 10 ? 'Medium' : 'Low';
                    const healthColor = health === 'High' ? 'grade-a' : health === 'Medium' ? 'grade-c' : 'grade-f';
                    const daysSinceLast = Math.round((Date.now() - new Date(deal.activities.lastActivityDate).getTime()) / 86400000);
                    const recencyHealth = daysSinceLast <= 2 ? 'Active' : daysSinceLast <= 7 ? 'Recent' : 'Stale';
                    const recencyColor = recencyHealth === 'Active' ? 'grade-a' : recencyHealth === 'Recent' ? 'grade-c' : 'grade-f';

                    return (
                      <>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Volume</span>
                          <span className={cn('font-mono', `text-[hsl(var(--${healthColor}))]`)}>{health} ({totalActivity} total)</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Recency</span>
                          <span className={cn('font-mono', `text-[hsl(var(--${recencyColor}))]`)}>{recencyHealth} ({daysSinceLast}d ago)</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* COMPETE TAB */}
          {activeTab === 'compete' && competitorData && (
            <div className="space-y-4">
              {/* Deal-specific competitive intel */}
              {deal.competitiveIntel && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <h4 className="text-[10px] uppercase tracking-widest text-primary mb-2">Deal Intelligence</h4>
                  <div className="space-y-1.5 text-[11px]">
                    {deal.competitiveIntel.theirPrice && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Their Quote</span>
                        <span className="font-mono text-foreground">{formatCurrency(deal.competitiveIntel.theirPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Our Advantage</span>
                      <span className="text-[hsl(var(--grade-a))] text-right max-w-[200px]">{deal.competitiveIntel.ourAdvantage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Their Advantage</span>
                      <span className="text-[hsl(var(--grade-f))] text-right max-w-[200px]">{deal.competitiveIntel.theirAdvantage}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">vs {competitorData.name}</span>
                <span className={cn(
                  'text-[9px] font-mono px-1.5 py-0.5 rounded',
                  competitorData.evercamWinRate >= 60
                    ? 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]'
                    : 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]'
                )}>
                  {competitorData.evercamWinRate}% historical win rate
                </span>
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-[hsl(var(--grade-f))] mb-1.5">Their Strengths</h4>
                {competitorData.strengths.map((s, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground py-0.5 flex items-start gap-1.5">
                    <span className="text-[hsl(var(--grade-f))]">•</span> {s}
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-[hsl(var(--grade-a))] mb-1.5">Their Weaknesses</h4>
                {competitorData.weaknesses.map((w, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground py-0.5 flex items-start gap-1.5">
                    <span className="text-[hsl(var(--grade-a))]">+</span> {w}
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-primary mb-1.5">Battlecard Talking Points</h4>
                {competitorData.battlecard.map((t, i) => (
                  <div key={i} className="text-[11px] text-foreground py-1 flex items-start gap-1.5 border-b border-border/10 last:border-0">
                    <span className="text-primary/60 font-mono flex-shrink-0">{i + 1}.</span>
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
