import { type TimelineEvent } from '@/data/demo-data';
import { cn } from '@/lib/utils';
import { ArrowRight, TrendingUp, Activity, MessageSquare, Zap } from 'lucide-react';

const typeConfig: Record<TimelineEvent['type'], { icon: React.ElementType; color: string; label: string }> = {
  'stage-change': { icon: ArrowRight, color: 'grade-a', label: 'Stage Change' },
  'score-change': { icon: TrendingUp, color: 'grade-c', label: 'Score Update' },
  'activity': { icon: Activity, color: 'primary', label: 'Activity' },
  'action': { icon: Zap, color: 'grade-b', label: 'Action' },
  'note': { icon: MessageSquare, color: 'muted-foreground', label: 'Note' },
};

export function DealTimeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No timeline events recorded.
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-0">
      {sorted.map((event, i) => {
        const cfg = typeConfig[event.type];
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex gap-3 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors',
                `border-[hsl(var(--${cfg.color})/.4)] bg-[hsl(var(--${cfg.color})/.08)]`,
                'group-hover:border-[hsl(var(--${cfg.color})/.7)]'
              )}>
                <Icon className={cn('w-3 h-3', `text-[hsl(var(--${cfg.color}))]`)} />
              </div>
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 min-h-[24px] bg-border/30" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 pt-0.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">{event.date}</span>
                <span className={cn(
                  'text-[9px] font-mono px-1.5 py-0.5 rounded',
                  `bg-[hsl(var(--${cfg.color})/.08)] text-[hsl(var(--${cfg.color}))]`
                )}>
                  {cfg.label}
                </span>
              </div>
              <div className="text-sm font-medium text-foreground">{event.description}</div>
              {event.detail && (
                <div className="text-[11px] text-muted-foreground mt-0.5">{event.detail}</div>
              )}
              {event.actor && (
                <div className="text-[10px] text-muted-foreground/70 mt-0.5 font-mono">{event.actor}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
