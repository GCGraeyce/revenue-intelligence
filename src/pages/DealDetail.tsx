import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { pipelineDeals } from '@/data/demo-data';
import { COMPETITORS } from '@/data/evercam-context';
import { getCountryByCode, getDealTypeById, getPartnerById } from '@/data/company-repository';
import { GradeBadge } from '@/components/GradeBadge';
import { DealTimeline } from '@/components/DealTimeline';
import { StakeholderMap } from '@/components/StakeholderMap';
import { ScoreRadar } from '@/components/ScoreRadar';
import { TrendSparkline, generateTrendData } from '@/components/TrendSparkline';
import { DealAIAnalysis } from '@/components/DealAIAnalysis';
import { useRole } from '@/contexts/RoleContext';
import { fmt, cn } from '@/lib/utils';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Zap,
  Clock,
  Building2,
  Phone,
  Mail,
  Calendar,
  Users,
  Shield,
  TrendingUp,
  MapPin,
} from 'lucide-react';

type Tab = 'overview' | 'ai' | 'timeline' | 'activity' | 'stakeholders' | 'compete';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { explainMode, coachingMode } = useRole();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const deal = pipelineDeals.find((d) => d.id === id);

  if (!deal) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-fade-in">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Deal not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          No deal with ID <span className="font-mono">{id}</span> exists in the pipeline.
        </p>
        <Link
          to="/deals"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Deals
        </Link>
      </div>
    );
  }

  const country = getCountryByCode(deal.country);
  const dealType = getDealTypeById(deal.dealType);
  const partner = deal.channelPartner ? getPartnerById(deal.channelPartner) : null;
  const competitorData = deal.competitor
    ? COMPETITORS.find((c) => c.name.toLowerCase().includes(deal.competitor!.toLowerCase()))
    : null;

  const forecastColor =
    deal.forecastCategory === 'Commit'
      ? 'grade-a'
      : deal.forecastCategory === 'Best Case'
        ? 'grade-b'
        : deal.forecastCategory === 'Pipeline'
          ? 'grade-c'
          : 'grade-f';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI Analysis' },
    { id: 'stakeholders', label: 'Stakeholders' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'activity', label: 'Activity' },
    ...(deal.competitor ? [{ id: 'compete' as Tab, label: 'Compete' }] : []),
  ];

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => navigate('/deals')}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Deals
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{deal.company}</span>
      </div>

      {/* Hero header */}
      <div className="glass-card p-5">
        <div className="flex items-start gap-4">
          <GradeBadge grade={deal.grade} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground">{deal.company}</h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              {deal.id} · {deal.rep} · {deal.stage}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span
                className={cn(
                  'text-[9px] font-mono px-2 py-0.5 rounded-full font-semibold',
                  `bg-[hsl(var(--${forecastColor})/.1)] text-[hsl(var(--${forecastColor}))]`
                )}
              >
                {deal.forecastCategory}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {deal.segment}
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {deal.source}
              </span>
              {country && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {country.name}
                </span>
              )}
              {deal.competitor && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]">
                  vs {deal.competitor}
                </span>
              )}
            </div>
          </div>
          {/* Key metrics bar */}
          <div className="flex gap-4 text-right flex-shrink-0">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">ACV</div>
              <div className="font-mono text-xl font-bold text-foreground">{fmt(deal.acv)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">PQS</div>
              <div
                className={cn(
                  'font-mono text-xl font-bold',
                  deal.pqScore >= 60
                    ? 'text-[hsl(var(--grade-a))]'
                    : deal.pqScore >= 40
                      ? 'text-[hsl(var(--grade-c))]'
                      : 'text-[hsl(var(--grade-f))]'
                )}
              >
                {deal.pqScore}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Win%
              </div>
              <div
                className={cn(
                  'font-mono text-xl font-bold',
                  deal.probabilities.win >= 0.5
                    ? 'text-[hsl(var(--grade-a))]'
                    : 'text-[hsl(var(--grade-c))]'
                )}
              >
                {Math.round(deal.probabilities.win * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-border/40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Score metrics */}
            <div className="glass-card p-4 grid grid-cols-2 gap-3">
              {[
                {
                  label: 'PQ Score',
                  value: deal.pqScore,
                  trend: generateTrendData(deal.pqScore, 8, 0.1),
                  color:
                    deal.pqScore >= 60 ? 'grade-a' : deal.pqScore >= 40 ? 'grade-c' : 'grade-f',
                },
                {
                  label: 'ICP Score',
                  value: deal.icpScore,
                  trend: generateTrendData(deal.icpScore, 6, 0.05),
                  color: 'grade-b',
                },
                {
                  label: 'Win Prob',
                  value: `${Math.round(deal.probabilities.win * 100)}%`,
                  trend: generateTrendData(Math.round(deal.probabilities.win * 100), 8, 0.12),
                  color: deal.probabilities.win >= 0.5 ? 'grade-a' : 'grade-c',
                },
                {
                  label: 'Confidence',
                  value: deal.confidence.band,
                  trend: null,
                  color:
                    deal.confidence.band === 'High'
                      ? 'grade-a'
                      : deal.confidence.band === 'Medium'
                        ? 'grade-c'
                        : 'grade-f',
                },
              ].map((m) => (
                <div key={m.label} className="bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {m.label}
                    </div>
                    {m.trend && (
                      <TrendSparkline
                        data={m.trend}
                        width={44}
                        height={14}
                        color={
                          m.color as
                            | 'primary'
                            | 'grade-a'
                            | 'grade-b'
                            | 'grade-c'
                            | 'grade-d'
                            | 'grade-f'
                        }
                      />
                    )}
                  </div>
                  <div
                    className={cn('font-mono text-lg font-bold', `text-[hsl(var(--${m.color}))]`)}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* MEDDIC */}
            {deal.meddic && (
              <div className="glass-card p-4">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                  MEDDIC Assessment
                </h4>
                <div className="space-y-2">
                  {(
                    [
                      'metrics',
                      'economicBuyer',
                      'decisionCriteria',
                      'decisionProcess',
                      'identifyPain',
                      'champion',
                    ] as const
                  ).map((key) => {
                    const labels: Record<string, string> = {
                      metrics: 'Metrics',
                      economicBuyer: 'Economic Buyer',
                      decisionCriteria: 'Decision Criteria',
                      decisionProcess: 'Decision Process',
                      identifyPain: 'Identify Pain',
                      champion: 'Champion',
                    };
                    const val = deal.meddic![key];
                    const color = val >= 70 ? 'grade-a' : val >= 45 ? 'grade-c' : 'grade-f';
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-32">
                          {labels[key]}
                        </span>
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-[hsl(var(--${color}))] rounded-full transition-all`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-[10px] font-mono w-7 text-right',
                            `text-[hsl(var(--${color}))]`
                          )}
                        >
                          {val}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-1.5 border-t border-border/20 text-[10px]">
                    <span className="text-muted-foreground font-semibold">Overall MEDDIC</span>
                    <span
                      className={cn(
                        'font-mono font-bold',
                        deal.meddic.overall >= 60
                          ? 'text-[hsl(var(--grade-a))]'
                          : deal.meddic.overall >= 40
                            ? 'text-[hsl(var(--grade-c))]'
                            : 'text-[hsl(var(--grade-f))]'
                      )}
                    >
                      {deal.meddic.overall}/100
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Outcome probabilities */}
            <div className="glass-card p-4">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Outcome Probabilities
              </h4>
              <div className="space-y-2">
                {(['win', 'loss', 'noDecision', 'slip'] as const).map((key) => {
                  const labels = {
                    win: 'Win',
                    loss: 'Loss',
                    noDecision: 'No Decision',
                    slip: 'Slip',
                  };
                  const colors = {
                    win: 'bg-signal-win',
                    loss: 'bg-signal-loss',
                    noDecision: 'bg-signal-nodecision',
                    slip: 'bg-signal-slip',
                  };
                  const pct = Math.round(deal.probabilities[key] * 100);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20">{labels[key]}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[key]} rounded-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Deal details */}
            <div className="glass-card p-4">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Deal Details
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                {[
                  { icon: Calendar, label: 'Created', value: deal.createdDate },
                  { icon: Calendar, label: 'Close Date', value: deal.closeDate },
                  {
                    icon: Clock,
                    label: 'Days in Stage',
                    value: `${deal.daysInStage}d`,
                    highlight: deal.daysInStage > 20,
                  },
                  { icon: Building2, label: 'Product', value: deal.productBundle },
                  { icon: MapPin, label: 'Project', value: deal.projectType },
                  { icon: TrendingUp, label: 'Cameras', value: String(deal.cameraCount) },
                  ...(dealType ? [{ icon: Building2, label: 'Type', value: dealType.name }] : []),
                  ...(partner ? [{ icon: Users, label: 'Partner', value: partner.name }] : []),
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <item.icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{item.label}</span>
                    <span
                      className={cn(
                        'font-mono ml-auto truncate max-w-[130px]',
                        item.highlight ? 'text-[hsl(var(--grade-f))]' : 'text-foreground'
                      )}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commercial terms */}
            <div className="glass-card p-4">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Commercial
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract</span>
                  <span className="font-mono">
                    {deal.contractType} · {deal.contractLength}mo
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-mono">{deal.currencyCode}</span>
                </div>
                {deal.discountPct > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-mono text-[hsl(var(--grade-c))]">
                      {deal.discountPct}%
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renewal Prob</span>
                  <span className="font-mono">{Math.round(deal.renewalProbability * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={cn(
                      'font-mono',
                      deal.status === 'active'
                        ? 'text-[hsl(var(--grade-a))]'
                        : deal.status === 'won'
                          ? 'text-primary'
                          : 'text-[hsl(var(--grade-f))]'
                    )}
                  >
                    {deal.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Implementation</span>
                  <span className="font-mono">{deal.implementationStatus}</span>
                </div>
              </div>
            </div>

            {/* PQS Score radar */}
            <div className="glass-card p-4">
              <ScoreRadar deal={deal} />
            </div>

            {/* Persona gaps + missing steps */}
            {deal.personaGaps.length > 0 && (
              <div className="glass-card p-4">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-grade-d" /> Persona Gaps
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {deal.personaGaps.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2 py-1 rounded-md bg-[hsl(var(--grade-d)/.1)] text-grade-d border border-[hsl(var(--grade-d)/.2)]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deal.missingSteps.length > 0 && (
              <div className="glass-card p-4">
                <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-grade-c" /> Missing Steps
                </h4>
                <div className="space-y-1">
                  {deal.missingSteps.map((s) => (
                    <div
                      key={s}
                      className="text-xs px-2 py-1.5 rounded bg-secondary/50 text-secondary-foreground"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next actions */}
            <div className="glass-card p-4">
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" /> Next Actions
                {coachingMode === 'agentic' && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 rounded ml-1">
                    AUTO
                  </span>
                )}
              </h4>
              <div className="space-y-1">
                {deal.nextActions.map((a) => (
                  <div
                    key={a}
                    className="text-xs px-2 py-1.5 rounded bg-primary/5 text-foreground border border-primary/10 flex items-center justify-between"
                  >
                    <span>{a}</span>
                    {coachingMode === 'hitl' && (
                      <button className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded hover:bg-primary/30 transition-colors">
                        Approve
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {explainMode && (
              <div className="glass-card p-4 border border-primary/20 bg-primary/5">
                <h4 className="text-[10px] uppercase tracking-widest text-primary mb-2">
                  Scoring Breakdown
                </h4>
                <div className="text-xs text-muted-foreground space-y-1 font-mono">
                  <div>
                    Outcome Prob: 30% × {deal.probabilities.win.toFixed(2)} ={' '}
                    {(0.3 * deal.probabilities.win * 100).toFixed(1)}
                  </div>
                  <div>
                    ICP Score: 20% × {deal.icpScore} = {(0.2 * deal.icpScore).toFixed(1)}
                  </div>
                  <div>
                    Persona: 15% × {Math.max(0, 100 - deal.personaGaps.length * 25)} ={' '}
                    {(0.15 * Math.max(0, 100 - deal.personaGaps.length * 25)).toFixed(1)}
                  </div>
                  <div>
                    Process: 15% × {Math.max(0, 100 - deal.missingSteps.length * 20)} ={' '}
                    {(0.15 * Math.max(0, 100 - deal.missingSteps.length * 20)).toFixed(1)}
                  </div>
                  <div>
                    Price Risk: 5% × {Math.round((1 - deal.priceRisk) * 100)} ={' '}
                    {(0.05 * (1 - deal.priceRisk) * 100).toFixed(1)}
                  </div>
                  <div className="pt-1 border-t border-primary/20 text-primary font-bold">
                    PQS = {deal.pqScore}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="glass-card p-5">
          <DealAIAnalysis deal={deal} />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="glass-card p-5">
          <DealTimeline events={deal.timeline} />
        </div>
      )}

      {activeTab === 'stakeholders' && (
        <div className="glass-card p-5">
          <StakeholderMap deal={deal} />
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="glass-card p-5 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Phone, value: deal.activities.calls, label: 'Calls' },
              { icon: Mail, value: deal.activities.emails, label: 'Emails' },
              { icon: Calendar, value: deal.activities.meetings, label: 'Meetings' },
            ].map((m) => (
              <div key={m.label} className="bg-secondary/50 rounded-lg p-4 text-center">
                <m.icon className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
                <div className="font-mono text-2xl font-bold text-foreground">{m.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Last Activity
            </h4>
            <div className="bg-secondary/50 rounded-lg p-3">
              <div className="text-sm font-medium">{deal.activities.lastActivityType}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {deal.activities.lastActivityDate}
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Engagement Health
            </h4>
            {(() => {
              const total =
                deal.activities.calls + deal.activities.emails + deal.activities.meetings;
              const health = total > 20 ? 'High' : total > 10 ? 'Medium' : 'Low';
              const hc =
                health === 'High' ? 'grade-a' : health === 'Medium' ? 'grade-c' : 'grade-f';
              const days = Math.round(
                (Date.now() - new Date(deal.activities.lastActivityDate).getTime()) / 86400000
              );
              const rec = days <= 2 ? 'Active' : days <= 7 ? 'Recent' : 'Stale';
              const rc = rec === 'Active' ? 'grade-a' : rec === 'Recent' ? 'grade-c' : 'grade-f';
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground">Volume</div>
                    <div className={cn('font-mono font-bold', `text-[hsl(var(--${hc}))]`)}>
                      {health}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{total} total</div>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <div className="text-[10px] text-muted-foreground">Recency</div>
                    <div className={cn('font-mono font-bold', `text-[hsl(var(--${rc}))]`)}>
                      {rec}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{days}d ago</div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'compete' && competitorData && (
        <div className="glass-card p-5 space-y-5">
          {deal.competitiveIntel && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
              <h4 className="text-[10px] uppercase tracking-widest text-primary mb-2">
                Deal Intelligence
              </h4>
              <div className="grid grid-cols-3 gap-4 text-[11px]">
                {deal.competitiveIntel.theirPrice && (
                  <div>
                    <div className="text-muted-foreground">Their Quote</div>
                    <div className="font-mono font-bold">
                      {fmt(deal.competitiveIntel.theirPrice)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-muted-foreground">Our Advantage</div>
                  <div className="text-[hsl(var(--grade-a))]">
                    {deal.competitiveIntel.ourAdvantage}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Their Advantage</div>
                  <div className="text-[hsl(var(--grade-f))]">
                    {deal.competitiveIntel.theirAdvantage}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">vs {competitorData.name}</span>
                <span
                  className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded',
                    competitorData.evercamWinRate >= 60
                      ? 'bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]'
                      : 'bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]'
                  )}
                >
                  {competitorData.evercamWinRate}% win rate
                </span>
              </div>
              <h5 className="text-[10px] uppercase tracking-widest text-[hsl(var(--grade-f))] mb-1.5">
                Their Strengths
              </h5>
              {competitorData.strengths.map((s, i) => (
                <div
                  key={i}
                  className="text-[11px] text-muted-foreground py-0.5 flex items-start gap-1.5"
                >
                  <span className="text-[hsl(var(--grade-f))]">•</span> {s}
                </div>
              ))}
              <h5 className="text-[10px] uppercase tracking-widest text-[hsl(var(--grade-a))] mb-1.5 mt-3">
                Their Weaknesses
              </h5>
              {competitorData.weaknesses.map((w, i) => (
                <div
                  key={i}
                  className="text-[11px] text-muted-foreground py-0.5 flex items-start gap-1.5"
                >
                  <span className="text-[hsl(var(--grade-a))]">+</span> {w}
                </div>
              ))}
            </div>
            <div>
              <h5 className="text-[10px] uppercase tracking-widest text-primary mb-2">
                Battlecard
              </h5>
              {competitorData.battlecard.map((t, i) => (
                <div
                  key={i}
                  className="text-[11px] text-foreground py-1.5 flex items-start gap-1.5 border-b border-border/10 last:border-0"
                >
                  <span className="text-primary/60 font-mono flex-shrink-0">{i + 1}.</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
