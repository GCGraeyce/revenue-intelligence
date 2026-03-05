import { useState, useMemo } from 'react';
import { useRole } from '@/contexts/RoleContext';
import {
  PROMPT_LIBRARY,
  FUNNEL_STAGE_LABELS,
  FUNNEL_STAGE_ORDER,
  PROMPT_ROLE_ACCESS,
  PROMPT_DASHBOARD_LINKS,
  getRolesForPrompt,
  type FunnelStage,
  type PromptCategory,
  type PromptEntry,
  type UserRole,
} from '@/data/prompt-library';
import {
  Search,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Target,
  AlertTriangle,
  Users,
  LayoutDashboard,
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  rep: 'Rep',
  manager: 'Manager',
  exec: 'Exec',
  revops: 'RevOps',
  admin: 'Admin',
};

const ROLE_COLORS: Record<UserRole, string> = {
  rep: 'bg-signal-win/10 text-signal-win',
  manager: 'bg-primary/10 text-primary',
  exec: 'bg-grade-a/10 text-grade-a',
  revops: 'bg-grade-c/10 text-grade-c',
  admin: 'bg-primary/10 text-primary',
};

const CATEGORY_CONFIG: Record<
  PromptCategory,
  { label: string; icon: typeof BookOpen; color: string }
> = {
  'deep-research': { label: 'Research', icon: BookOpen, color: 'bg-primary/10 text-primary' },
  execution: { label: 'Execution', icon: Zap, color: 'bg-signal-win/10 text-signal-win' },
};

export function PlayLibrary() {
  const { role } = useRole();
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<FunnelStage | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllRoles, setShowAllRoles] = useState(false);

  // Filter prompts based on current role, search, stage, and category
  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return PROMPT_LIBRARY.filter((p) => {
      // Role filter — if not showing all roles, only show prompts for current role
      // Admin sees everything
      if (!showAllRoles && role !== 'admin') {
        const roles = PROMPT_ROLE_ACCESS[p.id];
        if (!roles || !roles.includes(role)) return false;
      }
      // Stage filter
      if (selectedStage !== 'all' && p.funnelStage !== selectedStage) return false;
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      // Text search
      if (
        lower &&
        !p.name.toLowerCase().includes(lower) &&
        !p.description.toLowerCase().includes(lower)
      )
        return false;
      return true;
    });
  }, [role, search, selectedStage, selectedCategory, showAllRoles]);

  // Count prompts per stage for the badge
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const stage of FUNNEL_STAGE_ORDER) counts[stage] = 0;
    PROMPT_LIBRARY.forEach((p) => {
      const roles = PROMPT_ROLE_ACCESS[p.id];
      const matchesRole = showAllRoles || role === 'admin' || (roles && roles.includes(role));
      if (!matchesRole) return;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return;
      counts[p.funnelStage] = (counts[p.funnelStage] || 0) + 1;
      counts.all = (counts.all || 0) + 1;
    });
    return counts;
  }, [role, selectedCategory, showAllRoles]);

  // Count how many prompts have dashboard links (in filtered set)
  const activeInDashboard = filtered.filter((p) => PROMPT_DASHBOARD_LINKS[p.id]).length;

  return (
    <div className="glass-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="metric-label">AI Coaching Playbook</div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            {filtered.length} prompts for{' '}
            <span className="text-primary font-semibold">{ROLE_LABELS[role]}</span>
            {activeInDashboard > 0 && (
              <>
                {' '}
                · <span className="text-signal-win">{activeInDashboard} active in dashboard</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAllRoles(!showAllRoles)}
          className={`text-[10px] px-2.5 py-1 rounded-full font-mono transition-colors ${
            showAllRoles ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
          }`}
        >
          {showAllRoles ? 'All Roles' : `${ROLE_LABELS[role]} Only`}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search prompts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-secondary/50 rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 border border-border/30 focus:border-primary/40 focus:outline-none transition-colors"
        />
      </div>

      {/* Category toggle */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'deep-research', 'execution'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {cat === 'all' ? 'All Types' : CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      {/* Stage pills — horizontal scrollable */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedStage('all')}
          className={`flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full font-mono transition-colors ${
            selectedStage === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({stageCounts.all || 0})
        </button>
        {FUNNEL_STAGE_ORDER.map((stage) => {
          const count = stageCounts[stage] || 0;
          if (count === 0) return null;
          return (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full font-mono transition-colors whitespace-nowrap ${
                selectedStage === stage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {FUNNEL_STAGE_LABELS[stage]} ({count})
            </button>
          );
        })}
      </div>

      {/* Prompt cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No prompts match your filters
          </div>
        )}
        {filtered.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            expanded={expandedId === prompt.id}
            onToggle={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
            currentRole={role}
          />
        ))}
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  expanded,
  onToggle,
  currentRole,
}: {
  prompt: PromptEntry;
  expanded: boolean;
  onToggle: () => void;
  currentRole: UserRole;
}) {
  const dashboardLink = PROMPT_DASHBOARD_LINKS[prompt.id];
  const roles = getRolesForPrompt(prompt.id);
  const catConfig = CATEGORY_CONFIG[prompt.category];
  const CatIcon = catConfig.icon;

  return (
    <div
      className={`rounded-lg border transition-all ${
        expanded
          ? 'border-primary/30 bg-primary/[0.02] shadow-sm'
          : 'border-border/30 bg-card/50 hover:border-border/50'
      }`}
    >
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-3 text-left">
        <div className="mt-0.5">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{prompt.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${catConfig.color}`}>
              <CatIcon className="w-2.5 h-2.5 inline mr-0.5" />
              {catConfig.label}
            </span>
            {dashboardLink && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-signal-win/10 text-signal-win font-mono">
                <LayoutDashboard className="w-2.5 h-2.5 inline mr-0.5" />
                Live
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{prompt.description}</p>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-4 pt-0 ml-6 space-y-3">
          {/* Full description */}
          <p className="text-xs text-muted-foreground leading-relaxed">{prompt.description}</p>

          {/* Success metric */}
          <div className="flex items-start gap-2">
            <Target className="w-3 h-3 text-signal-win mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Success Metric
              </div>
              <div className="text-xs text-foreground">{prompt.successMetric}</div>
            </div>
          </div>

          {/* Warnings */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 text-grade-d mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Watch Out
              </div>
              <div className="text-xs text-muted-foreground">{prompt.warnings}</div>
            </div>
          </div>

          {/* Role access */}
          <div className="flex items-start gap-2">
            <Users className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Available To
              </div>
              <div className="flex gap-1 flex-wrap">
                {roles.map((r) => (
                  <span
                    key={r}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      r === currentRole ? 'ring-1 ring-primary/40 ' : ''
                    }${ROLE_COLORS[r]}`}
                  >
                    {ROLE_LABELS[r]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard feature link */}
          {dashboardLink && (
            <div className="rounded-lg bg-signal-win/5 border border-signal-win/15 p-3">
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard className="w-3 h-3 text-signal-win" />
                <span className="text-[10px] uppercase tracking-widest text-signal-win font-semibold">
                  Active in Dashboard
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{dashboardLink.description}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-signal-win">
                <ExternalLink className="w-2.5 h-2.5" />
                <span>{dashboardLink.pageName}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{dashboardLink.component}</span>
              </div>
            </div>
          )}

          {/* Stage context */}
          <div className="text-[10px] font-mono text-muted-foreground/60 pt-1 border-t border-border/20">
            {FUNNEL_STAGE_LABELS[prompt.funnelStage]} · {prompt.id}
          </div>
        </div>
      )}
    </div>
  );
}
