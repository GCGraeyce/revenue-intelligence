import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { pipelineDeals } from '@/data/demo-data';
import { getRepSummary } from '@/data/demo-data';
import { fmt } from '@/lib/utils';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  TrendingUp,
  Users,
  BarChart3,
  Target,
  AlertTriangle,
  Calendar,
  Zap,
  Settings,
  Shield,
  Activity,
  Eye,
  Webhook,
} from 'lucide-react';

const PAGES = [
  { name: 'Dashboard', path: '/', icon: BarChart3, keywords: 'home command center' },
  { name: 'Pipeline', path: '/pipeline', icon: Target, keywords: 'forecast velocity funnel' },
  { name: 'Deals', path: '/deals', icon: TrendingUp, keywords: 'opportunities list table' },
  { name: 'Team Performance', path: '/team', icon: Users, keywords: 'reps heatmap benchmarks 1:1' },
  {
    name: 'Meeting Prep',
    path: '/meeting-prep',
    icon: Calendar,
    keywords: 'forecast call qbr discovery',
  },
  { name: 'Coaching', path: '/coaching', icon: Zap, keywords: 'plays interventions agentic' },
  {
    name: 'Risk Monitor',
    path: '/risk',
    icon: AlertTriangle,
    keywords: 'at-risk clusters persona',
  },
  {
    name: 'Model Health',
    path: '/model',
    icon: Activity,
    keywords: 'calibration drift retraining',
  },
  { name: 'AI Trust Center', path: '/trust', icon: Eye, keywords: 'governance transparency' },
  { name: 'Automations', path: '/automations', icon: Webhook, keywords: 'webhooks triggers' },
  {
    name: 'Settings',
    path: '/settings',
    icon: Settings,
    keywords: 'configuration weights scoring',
  },
  { name: 'Admin Console', path: '/admin', icon: Shield, keywords: 'users roles crm system' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const reps = useMemo(() => getRepSummary(pipelineDeals), []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function handleSelect(path: string) {
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border/40 hover:border-border/80 bg-secondary/30 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 text-[9px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/30 font-mono">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search deals, reps, or pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Pages">
            {PAGES.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.path}
                  value={`${page.name} ${page.keywords}`}
                  onSelect={() => handleSelect(page.path)}
                >
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span>{page.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Deals">
            {pipelineDeals.slice(0, 20).map((deal) => (
              <CommandItem
                key={deal.id}
                value={`${deal.company} ${deal.rep} ${deal.stage} ${deal.segment}`}
                onSelect={() => handleSelect('/deals')}
              >
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">{deal.company}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {fmt(deal.acv)} · {deal.stage}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Reps">
            {reps.map((rep) => (
              <CommandItem key={rep.rep} value={rep.rep} onSelect={() => handleSelect('/team')}>
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">{rep.rep}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {rep.dealCount} deals · PQS {rep.avgPQS}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
