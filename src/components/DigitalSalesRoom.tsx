import { useMemo } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';
import { fmt } from '@/lib/utils';
import {
  Eye,
  Video,
  Download,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
} from 'lucide-react';

/* ─── Types ─── */
interface DSRActivity {
  type: 'view' | 'download' | 'share' | 'video-play' | 'revisit';
  asset: string;
  persona: string;
  timestamp: string;
  durationSec?: number;
}

interface DSRDealSignals {
  deal: Deal;
  totalViews: number;
  uniqueVisitors: number;
  lastActivity: string;
  engagementScore: number;
  trend: 'hot' | 'warm' | 'cold' | 'dormant';
  recentActivities: DSRActivity[];
  topAssets: { name: string; views: number }[];
}

/* ─── Generate realistic DSR signals from deal data ─── */
function generateDSRSignals(deals: Deal[]): DSRDealSignals[] {
  const assetsByStage: Record<string, string[]> = {
    Discovery: ['Company Overview Deck', 'Product Overview Video', 'Case Study (Similar Project)'],
    Qualification: [
      'Technical Spec Sheet',
      'Integration Matrix',
      'Security Documentation',
      'Demo Recording',
    ],
    Proposal: ['Proposal Document', 'ROI Calculator', 'Pricing Summary', 'Reference Call Invite'],
    Negotiation: ['Contract Draft', 'SLA Document', 'Deployment Plan', 'Success Criteria'],
  };

  const personas = ['Project Manager', 'IT Director', 'CFO', 'Safety Officer', 'CEO/MD'];

  return deals
    .filter((d) => d.acv > 50000) // Only show DSR for meaningful deals
    .sort((a, b) => b.acv - a.acv)
    .slice(0, 15)
    .map((deal) => {
      // Derive engagement from deal health signals
      const baseEngagement = deal.pqScore;
      const personaBonus = (5 - deal.personaGaps.length) * 8;
      const stageBonus =
        ['Discovery', 'Qualification', 'Proposal', 'Negotiation'].indexOf(deal.stage) * 10;
      const engagementScore = Math.min(
        100,
        Math.max(10, baseEngagement + personaBonus + stageBonus - deal.daysInStage)
      );

      const totalViews = Math.max(5, Math.round(engagementScore * 0.8 + Math.random() * 20));
      const uniqueVisitors = Math.max(1, Math.round(totalViews * (0.3 + Math.random() * 0.3)));

      const trend: 'hot' | 'warm' | 'cold' | 'dormant' =
        deal.daysInStage <= 5 && engagementScore > 60
          ? 'hot'
          : deal.daysInStage <= 14 && engagementScore > 40
            ? 'warm'
            : deal.daysInStage <= 25
              ? 'cold'
              : 'dormant';

      const stageAssets = assetsByStage[deal.stage] || assetsByStage.Discovery;

      const activities: DSRActivity[] = [];
      const activityTypes: DSRActivity['type'][] = [
        'view',
        'download',
        'video-play',
        'revisit',
        'share',
      ];
      const times = [
        '2m ago',
        '15m ago',
        '1h ago',
        '3h ago',
        'Yesterday',
        '2 days ago',
        '4 days ago',
      ];

      for (let i = 0; i < Math.min(5, Math.round(engagementScore / 20)); i++) {
        activities.push({
          type: activityTypes[i % activityTypes.length],
          asset: stageAssets[i % stageAssets.length],
          persona: personas[i % personas.length],
          timestamp: times[i] || times[times.length - 1],
          durationSec: Math.round(30 + Math.random() * 300),
        });
      }

      const topAssets = stageAssets
        .map((a) => ({
          name: a,
          views: Math.round(Math.random() * totalViews * 0.6 + 2),
        }))
        .sort((a, b) => b.views - a.views);

      return {
        deal,
        totalViews,
        uniqueVisitors,
        lastActivity: activities.length > 0 ? activities[0].timestamp : 'No activity',
        engagementScore,
        trend,
        recentActivities: activities,
        topAssets,
      };
    });
}

const TREND_CONFIG = {
  hot: { label: 'Hot', color: 'text-grade-a', bg: 'bg-grade-a/10', icon: TrendingUp },
  warm: { label: 'Warm', color: 'text-grade-b', bg: 'bg-grade-b/10', icon: TrendingUp },
  cold: { label: 'Cold', color: 'text-grade-d', bg: 'bg-grade-d/10', icon: TrendingDown },
  dormant: { label: 'Dormant', color: 'text-grade-f', bg: 'bg-grade-f/10', icon: Clock },
};

const ACTIVITY_ICONS = {
  view: Eye,
  download: Download,
  'video-play': Video,
  share: Users,
  revisit: Activity,
};

/* ─── Main Component ─── */
export function DigitalSalesRoom({ deals }: { deals?: Deal[] }) {
  const signals = useMemo(() => generateDSRSignals(deals || pipelineDeals), [deals]);

  const hotDeals = signals.filter((s) => s.trend === 'hot').length;
  const dormantDeals = signals.filter((s) => s.trend === 'dormant').length;

  return (
    <div className="glass-card p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Digital Sales Room — Buyer Intent Signals
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-grade-a bg-grade-a/5 px-2 py-1 rounded">
            <TrendingUp className="w-3 h-3" /> {hotDeals} hot
          </div>
          {dormantDeals > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-grade-f bg-grade-f/5 px-2 py-1 rounded">
              <Clock className="w-3 h-3" /> {dormantDeals} dormant
            </div>
          )}
        </div>
      </div>

      {/* Signal cards */}
      <div className="space-y-2">
        {signals.map((signal) => {
          const trendCfg = TREND_CONFIG[signal.trend];
          const TrendIcon = trendCfg.icon;
          return (
            <div
              key={signal.deal.id}
              className="rounded-lg border border-border/30 p-3 hover:border-border/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Trend indicator */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${trendCfg.bg}`}
                >
                  <TrendIcon className={`w-4 h-4 ${trendCfg.color}`} />
                </div>

                {/* Deal info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {signal.deal.company}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${trendCfg.bg} ${trendCfg.color}`}
                    >
                      {trendCfg.label}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {signal.deal.rep} · {signal.deal.stage} · {fmt(signal.deal.acv)}
                  </div>
                </div>

                {/* Key metrics */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-sm font-mono font-bold text-foreground">
                      {signal.totalViews}
                    </div>
                    <div className="text-[8px] text-muted-foreground">views</div>
                  </div>
                  <div>
                    <div className="text-sm font-mono font-bold text-foreground">
                      {signal.uniqueVisitors}
                    </div>
                    <div className="text-[8px] text-muted-foreground">visitors</div>
                  </div>
                  <div>
                    <div
                      className={`text-sm font-mono font-bold ${
                        signal.engagementScore >= 70
                          ? 'text-grade-a'
                          : signal.engagementScore >= 40
                            ? 'text-grade-c'
                            : 'text-grade-f'
                      }`}
                    >
                      {signal.engagementScore}
                    </div>
                    <div className="text-[8px] text-muted-foreground">intent</div>
                  </div>
                </div>
              </div>

              {/* Recent activities feed */}
              {signal.recentActivities.length > 0 && (
                <div className="ml-11 mt-2 flex flex-wrap gap-1.5">
                  {signal.recentActivities.slice(0, 3).map((act, i) => {
                    const ActIcon = ACTIVITY_ICONS[act.type];
                    return (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground flex items-center gap-1"
                      >
                        <ActIcon className="w-2.5 h-2.5" />
                        {act.persona}:{' '}
                        {act.asset.length > 25 ? act.asset.slice(0, 25) + '…' : act.asset}
                        <span className="text-muted-foreground/50">{act.timestamp}</span>
                      </span>
                    );
                  })}
                  {signal.recentActivities.length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 text-muted-foreground/50">
                      +{signal.recentActivities.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
