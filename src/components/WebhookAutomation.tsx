import { useState, useEffect, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { pipelineDeals, Deal } from '@/data/demo-data';
import {
  buildRuleNotifications,
  sendBulkNotifications,
  getNotificationLog,
} from '@/lib/notifications';
import {
  Webhook,
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Zap,
  TrendingDown,
  Users,
  RefreshCw,
  Bell,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ScheduleFrequency = 'realtime' | '15min' | 'hourly' | 'daily' | 'weekly';

interface AutomationSchedule {
  frequency: ScheduleFrequency;
  time: string; // HH:mm for daily/weekly
  dayOfWeek: string; // for weekly (e.g., 'Monday')
  nextRun: string; // human-readable next run time
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  icon: React.ElementType;
  enabled: boolean;
  matchCount: number;
  firedCount: number;
  lastFired: string | null;
  matchingDeals: Deal[];
  schedule: AutomationSchedule;
}

interface AutomationEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  dealCompany: string;
  action: string;
  timestamp: Date;
  success: boolean;
  crmId?: string;
}

// ---------------------------------------------------------------------------
// Generate rules from live pipeline data
// ---------------------------------------------------------------------------

function generateRules(deals: Deal[]): AutomationRule[] {
  const pqsThreshold = 35;
  const stallDays = 20;
  const personaGapMin = 2;
  const slipProbThreshold = 0.3;

  const lowPQS = deals.filter((d) => d.pqScore < pqsThreshold && d.acv > 50000);
  const stalled = deals.filter((d) => d.daysInStage > stallDays);
  const missingPersonas = deals.filter(
    (d) => d.personaGaps.length >= personaGapMin && d.acv > 80000
  );
  const highSlip = deals.filter(
    (d) => d.probabilities.slip > slipProbThreshold && d.forecastCategory === 'Commit'
  );

  return [
    {
      id: 'rule-pqs-alert',
      name: 'PQS Threshold Alert',
      description: `When PQS drops below ${pqsThreshold} on deals >€50K, create a Zoho task for the deal owner and notify their manager.`,
      trigger: `PQS < ${pqsThreshold} AND ACV > €50K`,
      action: 'Create Zoho Task + Manager Alert',
      icon: AlertTriangle,
      enabled: true,
      matchCount: lowPQS.length,
      firedCount: Math.min(lowPQS.length, 8),
      lastFired: lowPQS.length > 0 ? '12m ago' : null,
      matchingDeals: lowPQS.slice(0, 5),
      schedule: { frequency: 'realtime', time: '', dayOfWeek: '', nextRun: 'On every CRM sync' },
    },
    {
      id: 'rule-stall-breaker',
      name: 'Stall Detection & Nudge',
      description: `Deals stuck ${stallDays}+ days in a stage trigger an automated follow-up draft and rep nudge via CRM note.`,
      trigger: `daysInStage > ${stallDays}`,
      action: 'Create Zoho Note + Rep Nudge',
      icon: Clock,
      enabled: true,
      matchCount: stalled.length,
      firedCount: Math.min(stalled.length, 6),
      lastFired: stalled.length > 0 ? '2h ago' : null,
      matchingDeals: stalled.slice(0, 5),
      schedule: { frequency: 'daily', time: '08:00', dayOfWeek: '', nextRun: 'Tomorrow 08:00' },
    },
    {
      id: 'rule-multithread',
      name: 'Multi-Threading Campaign',
      description: `High-value deals with ${personaGapMin}+ persona gaps trigger contact research task and multi-thread coaching play.`,
      trigger: `personaGaps >= ${personaGapMin} AND ACV > €80K`,
      action: 'Create Zoho Task + Trigger Coaching Play',
      icon: Users,
      enabled: true,
      matchCount: missingPersonas.length,
      firedCount: Math.min(missingPersonas.length, 4),
      lastFired: missingPersonas.length > 0 ? '4h ago' : null,
      matchingDeals: missingPersonas.slice(0, 5),
      schedule: {
        frequency: 'weekly',
        time: '09:00',
        dayOfWeek: 'Monday',
        nextRun: 'Monday 09:00',
      },
    },
    {
      id: 'rule-forecast-risk',
      name: 'Forecast Slip Guard',
      description: `Commit-category deals with slip probability >${slipProbThreshold * 100}% trigger forecast review and downgrade recommendation.`,
      trigger: `forecastCategory = Commit AND P(slip) > ${slipProbThreshold}`,
      action: 'Downgrade Forecast + Create Review Task',
      icon: TrendingDown,
      enabled: true,
      matchCount: highSlip.length,
      firedCount: Math.min(highSlip.length, 3),
      lastFired: highSlip.length > 0 ? '1h ago' : null,
      matchingDeals: highSlip.slice(0, 5),
      schedule: { frequency: 'daily', time: '07:00', dayOfWeek: '', nextRun: 'Tomorrow 07:00' },
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WebhookAutomation() {
  const { pushNote, pushTask, status } = useCRM();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [runningRule, setRunningRule] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setRules(generateRules(pipelineDeals));
  }, []);

  const totalMatches = useMemo(() => rules.reduce((s, r) => s + r.matchCount, 0), [rules]);
  const totalFired = useMemo(() => rules.reduce((s, r) => s + r.firedCount, 0), [rules]);

  function toggleRule(ruleId: string) {
    setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)));
  }

  async function fireRule(rule: AutomationRule) {
    if (runningRule || !rule.enabled) return;
    setRunningRule(rule.id);

    for (const deal of rule.matchingDeals.slice(0, 3)) {
      let crmId = '';
      let action = '';

      if (rule.id === 'rule-pqs-alert' || rule.id === 'rule-multithread') {
        crmId = await pushTask(
          deal.id,
          `${rule.name}: ${deal.company}`,
          `Automated by RevOS — ${rule.trigger}`
        );
        action = 'Created CRM Task';
      } else if (rule.id === 'rule-stall-breaker') {
        crmId = await pushNote(
          deal.id,
          `RevOS: ${rule.name}`,
          `Deal stalled ${deal.daysInStage} days in ${deal.stage}. AI recommends: ${deal.nextActions[0] || 'Schedule follow-up'}`
        );
        action = 'Created CRM Note';
      } else if (rule.id === 'rule-forecast-risk') {
        crmId = await pushTask(
          deal.id,
          `Forecast Review: ${deal.company}`,
          `Slip probability ${(deal.probabilities.slip * 100).toFixed(0)}% — consider downgrading from ${deal.forecastCategory}`
        );
        action = 'Created Forecast Review Task';
      }

      setEvents((prev) => [
        {
          id: `evt_${Date.now()}_${deal.id}`,
          ruleId: rule.id,
          ruleName: rule.name,
          dealCompany: deal.company,
          action,
          timestamp: new Date(),
          success: !!crmId,
          crmId: crmId || undefined,
        },
        ...prev,
      ]);
    }

    // Send Slack/email notifications for fired deals
    const notifications = buildRuleNotifications(
      rule.id,
      rule.name,
      rule.matchingDeals.slice(0, 3).map((d) => ({
        id: d.id,
        company: d.company,
        acv: d.acv,
        pqScore: d.pqScore,
        stage: d.stage,
      })),
      rule.id === 'rule-pqs-alert' ? 'high' : 'medium'
    );
    await sendBulkNotifications(notifications);

    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id
          ? {
              ...r,
              firedCount: r.firedCount + Math.min(rule.matchingDeals.length, 3),
              lastFired: 'just now',
            }
          : r
      )
    );
    setRunningRule(null);
  }

  function fmt(n: number) {
    return n >= 1000000 ? `€${(n / 1000000).toFixed(1)}M` : `€${(n / 1000).toFixed(0)}K`;
  }

  return (
    <div className="space-y-4">
      {/* Header + Stats */}
      <div className="glass-card p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="metric-label flex items-center gap-2">
            <Webhook className="w-4 h-4 text-primary" />
            Webhook Automation Bridge
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            {status.connected ? (
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> CRM Connected
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Demo Mode
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-foreground">{rules.length}</div>
            <div className="text-[9px] text-muted-foreground">Active Rules</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-grade-c">{totalMatches}</div>
            <div className="text-[9px] text-muted-foreground">Matching Deals</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-grade-a">{totalFired}</div>
            <div className="text-[9px] text-muted-foreground">Actions Fired</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-primary">{events.length}</div>
            <div className="text-[9px] text-muted-foreground">This Session</div>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-lg font-mono font-bold text-grade-b flex items-center justify-center gap-1">
              <Bell className="w-3.5 h-3.5" />
              {getNotificationLog().length}
            </div>
            <div className="text-[9px] text-muted-foreground">Notifications</div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="glass-card p-5 animate-fade-in space-y-3">
        <div className="metric-label flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Automation Rules
        </div>

        {rules.map((rule) => {
          const Icon = rule.icon;
          const isExpanded = expanded === rule.id;
          return (
            <div key={rule.id} className="rounded-lg border border-border/30 overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : rule.id)}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${rule.enabled ? 'bg-primary/10' : 'bg-muted/50'}`}
                >
                  <Icon
                    className={`w-4 h-4 ${rule.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{rule.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-grade-c/10 text-grade-c">
                      {rule.matchCount} matches
                    </span>
                    {rule.lastFired && (
                      <span className="text-[9px] font-mono text-muted-foreground">
                        Last: {rule.lastFired}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {rule.trigger} → {rule.action}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRule(rule.id);
                    }}
                    className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                      rule.enabled ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/20 p-4 space-y-3 animate-fade-in bg-muted/5">
                  <p className="text-xs text-muted-foreground">{rule.description}</p>

                  {/* Schedule configuration */}
                  <div className="rounded-lg border border-border/20 bg-secondary/20 p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Schedule
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Frequency:</span>
                        <select
                          value={rule.schedule.frequency}
                          onChange={(e) => {
                            const freq = e.target.value as ScheduleFrequency;
                            const nextRun =
                              freq === 'realtime'
                                ? 'On every CRM sync'
                                : freq === '15min'
                                  ? 'Every 15 minutes'
                                  : freq === 'hourly'
                                    ? 'Next hour'
                                    : freq === 'daily'
                                      ? `Tomorrow ${rule.schedule.time || '08:00'}`
                                      : `${rule.schedule.dayOfWeek || 'Monday'} ${rule.schedule.time || '09:00'}`;
                            setRules((prev) =>
                              prev.map((r) =>
                                r.id === rule.id
                                  ? { ...r, schedule: { ...r.schedule, frequency: freq, nextRun } }
                                  : r
                              )
                            );
                          }}
                          className="text-[10px] font-mono bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                        >
                          <option value="realtime">Real-time</option>
                          <option value="15min">Every 15 min</option>
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                      {(rule.schedule.frequency === 'daily' ||
                        rule.schedule.frequency === 'weekly') && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">Time:</span>
                          <input
                            type="time"
                            value={rule.schedule.time}
                            onChange={(e) => {
                              setRules((prev) =>
                                prev.map((r) =>
                                  r.id === rule.id
                                    ? {
                                        ...r,
                                        schedule: {
                                          ...r.schedule,
                                          time: e.target.value,
                                          nextRun:
                                            rule.schedule.frequency === 'weekly'
                                              ? `${rule.schedule.dayOfWeek} ${e.target.value}`
                                              : `Tomorrow ${e.target.value}`,
                                        },
                                      }
                                    : r
                                )
                              );
                            }}
                            className="text-[10px] font-mono bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                          />
                        </div>
                      )}
                      {rule.schedule.frequency === 'weekly' && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">Day:</span>
                          <select
                            value={rule.schedule.dayOfWeek}
                            onChange={(e) => {
                              setRules((prev) =>
                                prev.map((r) =>
                                  r.id === rule.id
                                    ? {
                                        ...r,
                                        schedule: {
                                          ...r.schedule,
                                          dayOfWeek: e.target.value,
                                          nextRun: `${e.target.value} ${rule.schedule.time}`,
                                        },
                                      }
                                    : r
                                )
                              );
                            }}
                            className="text-[10px] font-mono bg-background border border-border/30 rounded px-2 py-1 text-foreground"
                          >
                            {[
                              'Monday',
                              'Tuesday',
                              'Wednesday',
                              'Thursday',
                              'Friday',
                              'Saturday',
                              'Sunday',
                            ].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <span className="text-[9px] font-mono text-muted-foreground ml-auto">
                        Next: {rule.schedule.nextRun}
                      </span>
                    </div>
                  </div>

                  {/* Matching deals preview */}
                  {rule.matchingDeals.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Matching Deals (top {Math.min(rule.matchingDeals.length, 5)})
                      </div>
                      {rule.matchingDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="flex items-center gap-3 text-xs py-1.5 px-2 rounded bg-secondary/30"
                        >
                          <span className="font-medium text-foreground flex-1">{deal.company}</span>
                          <span className="font-mono text-muted-foreground">{fmt(deal.acv)}</span>
                          <span className="font-mono text-muted-foreground">{deal.stage}</span>
                          <span
                            className={`font-mono font-bold ${deal.pqScore < 40 ? 'text-grade-f' : 'text-grade-c'}`}
                          >
                            PQS {deal.pqScore}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fire button */}
                  <button
                    onClick={() => fireRule(rule)}
                    disabled={!rule.enabled || !!runningRule || rule.matchingDeals.length === 0}
                    className="flex items-center gap-1.5 text-[10px] font-mono text-primary-foreground px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors disabled:opacity-40 shadow-sm"
                  >
                    {runningRule === rule.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" /> Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Fire Rule (
                        {Math.min(rule.matchingDeals.length, 3)} deals)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event Log */}
      {events.length > 0 && (
        <div className="glass-card p-5 animate-fade-in space-y-3">
          <div className="metric-label flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Automation Event Log
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {events.length} events
            </span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-secondary/30"
              >
                {evt.success ? (
                  <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
                )}
                <span className="text-muted-foreground font-mono">{evt.ruleName}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground flex-1">{evt.dealCompany}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{evt.action}</span>
                {evt.crmId && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                    {evt.crmId}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
