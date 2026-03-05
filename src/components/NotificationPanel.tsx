import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pipelineDeals } from '@/data/demo-data';
import { fmt, cn } from '@/lib/utils';
import { Bell, AlertTriangle, Clock, Calendar, TrendingDown, X, CheckCheck } from 'lucide-react';

interface AppNotification {
  id: string;
  type: 'risk' | 'stall' | 'closing' | 'alert';
  title: string;
  body: string;
  urgency: 'high' | 'medium' | 'low';
  dealId?: string;
  time: string;
}

const REF_DATE = new Date('2026-03-03');

function generateNotifications(): AppNotification[] {
  const notifications: AppNotification[] = [];

  // At-risk deals: pqScore < 40, high ACV
  pipelineDeals
    .filter((d) => d.pqScore < 40 && d.acv > 40000 && d.status === 'active')
    .slice(0, 4)
    .forEach((d) => {
      notifications.push({
        id: `risk-${d.id}`,
        type: 'risk',
        title: 'Deal at risk',
        body: `${d.company} · PQS ${d.pqScore} · ${fmt(d.acv)} — review urgently`,
        urgency: d.pqScore < 25 ? 'high' : 'medium',
        dealId: d.id,
        time: '2h ago',
      });
    });

  // Stalled > 21 days
  pipelineDeals
    .filter((d) => d.daysInStage > 21 && d.acv > 25000 && d.status === 'active')
    .slice(0, 3)
    .forEach((d) => {
      notifications.push({
        id: `stall-${d.id}`,
        type: 'stall',
        title: 'Deal stalled',
        body: `${d.company} stuck in ${d.stage} for ${d.daysInStage}d — re-engage`,
        urgency: d.daysInStage > 35 ? 'high' : 'medium',
        dealId: d.id,
        time: '5h ago',
      });
    });

  // Closing this week (within 7 days)
  pipelineDeals
    .filter((d) => {
      const diff = (new Date(d.closeDate).getTime() - REF_DATE.getTime()) / 86400000;
      return diff >= 0 && diff <= 7 && d.status === 'active';
    })
    .slice(0, 3)
    .forEach((d) => {
      const diff = Math.round((new Date(d.closeDate).getTime() - REF_DATE.getTime()) / 86400000);
      notifications.push({
        id: `closing-${d.id}`,
        type: 'closing',
        title: diff === 0 ? 'Closing today' : `Closing in ${diff}d`,
        body: `${d.company} · ${fmt(d.acv)} · Win ${Math.round(d.probabilities.win * 100)}%`,
        urgency: d.probabilities.win > 0.5 ? 'low' : 'medium',
        dealId: d.id,
        time: '1d ago',
      });
    });

  // Large deals with persona gaps
  pipelineDeals
    .filter((d) => d.personaGaps.length >= 3 && d.acv > 80000)
    .slice(0, 2)
    .forEach((d) => {
      notifications.push({
        id: `gap-${d.id}`,
        type: 'alert',
        title: 'Stakeholder gaps',
        body: `${d.company} · ${d.personaGaps.length} missing personas — ${fmt(d.acv)} at risk`,
        urgency: 'medium',
        dealId: d.id,
        time: '1d ago',
      });
    });

  const order = { high: 0, medium: 1, low: 2 };
  return notifications.sort((a, b) => order[a.urgency] - order[b.urgency]).slice(0, 10);
}

const TYPE_ICON = {
  risk: TrendingDown,
  stall: Clock,
  closing: Calendar,
  alert: AlertTriangle,
};

const URGENCY_COLOR = {
  high: 'grade-f',
  medium: 'grade-c',
  low: 'grade-b',
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const allNotifications = useMemo(() => generateNotifications(), []);
  const visible = allNotifications.filter((n) => !dismissed.has(n.id));
  const highCount = visible.filter((n) => n.urgency === 'high').length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function dismissAll() {
    setDismissed(new Set(allNotifications.map((n) => n.id)));
  }

  function handleClick(n: AppNotification) {
    setOpen(false);
    if (n.dealId) navigate(`/deals/${n.dealId}`);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {visible.length > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center px-1',
              highCount > 0
                ? 'bg-[hsl(var(--grade-f))] text-white'
                : 'bg-[hsl(var(--grade-c))] text-white'
            )}
          >
            {visible.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[360px] bg-card border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">Notifications</span>
              {visible.length > 0 && (
                <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  {visible.length}
                </span>
              )}
            </div>
            {visible.length > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Dismiss all
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {visible.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCheck className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">All caught up</p>
              </div>
            ) : (
              visible.map((n) => {
                const Icon = TYPE_ICON[n.type];
                const color = URGENCY_COLOR[n.urgency];
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-0 group hover:bg-accent/30 transition-colors',
                      n.urgency === 'high' && 'bg-[hsl(var(--grade-f)/.03)]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        `bg-[hsl(var(--${color})/.12)]`
                      )}
                    >
                      <Icon className={cn('w-3.5 h-3.5', `text-[hsl(var(--${color}))]`)} />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClick(n)}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{n.title}</span>
                        <span
                          className={cn(
                            'text-[9px] font-mono px-1 py-0.5 rounded',
                            `bg-[hsl(var(--${color})/.1)] text-[hsl(var(--${color}))]`
                          )}
                        >
                          {n.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {n.body}
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 font-mono">
                        {n.time}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mt-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
