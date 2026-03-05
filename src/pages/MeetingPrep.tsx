import { useState, useMemo, useRef } from 'react';
import { pipelineDeals, SALES_MANAGERS, type Deal } from '@/data/demo-data';
import { useCRM } from '@/contexts/CRMContext';
import { useRole } from '@/contexts/RoleContext';
import { executePrompt, type PromptOutput, type OutputAction } from '@/lib/prompt-executor';
import { sanitizeHTML } from '@/lib/sanitize';
import { fmt } from '@/lib/utils';
import {
  Calendar,
  Loader2,
  CheckCircle,
  FileText,
  Zap,
  ClipboardCopy,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Users,
  TrendingUp,
  ChevronRight,
  Phone,
  Monitor,
  FileSpreadsheet,
  HandCoins,
  Building2,
  Target,
  Search,
  X,
  ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Meeting templates
// ---------------------------------------------------------------------------

interface MeetingTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  promptId: string;
  audience: string;
  frequency: string;
  needsRepSelector: boolean;
  /** Customer meeting types require a deal selector instead */
  needsDealSelector: boolean;
  /** Which deal stages are relevant for this meeting type */
  dealStages?: string[];
  roles: string[];
}

const MEETING_TEMPLATES: MeetingTemplate[] = [
  // ---- Manager / Exec templates ----
  {
    id: 'forecast-call',
    name: 'Forecast Call Prep',
    description:
      'Executive forecast summary with commit/best-case/pipeline breakdown, risk flags, and gap analysis.',
    icon: BarChart3,
    color: 'text-blue-400',
    promptId: 'summarize-forecast-for-execs',
    audience: 'VP Sales + CRO',
    frequency: 'Weekly',
    needsRepSelector: false,
    needsDealSelector: false,
    roles: ['manager', 'exec', 'revops'],
  },
  {
    id: 'pipeline-review',
    name: 'Pipeline Risk Review',
    description:
      'Comprehensive pipeline risk report: at-risk deals, stalled opportunities, coverage gaps, and intervention priorities.',
    icon: AlertTriangle,
    color: 'text-red-400',
    promptId: 'identify-pipeline-coverage-gaps',
    audience: 'Sales Team',
    frequency: 'Weekly',
    needsRepSelector: false,
    needsDealSelector: false,
    roles: ['manager', 'exec', 'revops'],
  },
  {
    id: 'one-on-one',
    name: '1:1 Coaching Prep',
    description:
      'Performance snapshot, talking points, at-risk deals, coaching recommendations tailored for a specific rep.',
    icon: Users,
    color: 'text-green-400',
    promptId: 'prepare-1on1-agenda-template',
    audience: 'Manager + Rep',
    frequency: 'Bi-weekly',
    needsRepSelector: true,
    needsDealSelector: false,
    roles: ['manager'],
  },
  {
    id: 'qbr-outline',
    name: 'QBR Outline',
    description:
      'Quarterly business review structure: performance recap, pipeline health, competitive landscape, next-quarter priorities.',
    icon: TrendingUp,
    color: 'text-purple-400',
    promptId: 'summarize-forecast-for-execs',
    audience: 'Executive Team',
    frequency: 'Quarterly',
    needsRepSelector: false,
    needsDealSelector: false,
    roles: ['exec', 'revops'],
  },
  // ---- Rep customer meeting templates (stage-aligned) ----
  {
    id: 'discovery-call',
    name: 'Discovery Call',
    description:
      'Prepare for initial discovery: research the prospect, map stakeholders, plan qualifying questions, and set the meeting agenda.',
    icon: Phone,
    color: 'text-cyan-400',
    promptId: 'customer-meeting-prep',
    audience: 'Prospect',
    frequency: 'Per deal',
    needsRepSelector: false,
    needsDealSelector: true,
    dealStages: ['Discovery'],
    roles: ['rep'],
  },
  {
    id: 'technical-demo',
    name: 'Technical Demo',
    description:
      'Demo prep with tailored talking points, feature mapping to customer pain points, competitive positioning, and technical requirements review.',
    icon: Monitor,
    color: 'text-blue-400',
    promptId: 'customer-meeting-prep',
    audience: 'Decision Maker + Technical Evaluator',
    frequency: 'Per deal',
    needsRepSelector: false,
    needsDealSelector: true,
    dealStages: ['Qualification'],
    roles: ['rep'],
  },
  {
    id: 'proposal-review',
    name: 'Proposal & ROI Review',
    description:
      'Walk the customer through solution design, pricing, and ROI business case. Prep for objections and competitive comparisons.',
    icon: FileSpreadsheet,
    color: 'text-green-400',
    promptId: 'customer-meeting-prep',
    audience: 'Economic Buyer + Project Manager',
    frequency: 'Per deal',
    needsRepSelector: false,
    needsDealSelector: true,
    dealStages: ['Proposal'],
    roles: ['rep'],
  },
  {
    id: 'price-negotiation',
    name: 'Price Negotiation',
    description:
      'Negotiate commercial terms: discount boundaries, contract structure, deployment timeline, and closing strategy.',
    icon: HandCoins,
    color: 'text-amber-400',
    promptId: 'customer-meeting-prep',
    audience: 'Economic Buyer + Champion',
    frequency: 'Per deal',
    needsRepSelector: false,
    needsDealSelector: true,
    dealStages: ['Negotiation'],
    roles: ['rep'],
  },
  {
    id: 'stakeholder-meeting',
    name: 'Stakeholder / Executive Meeting',
    description:
      'Prep for C-suite or cross-functional stakeholder meetings: executive summary, strategic value proposition, risk mitigation, and next steps.',
    icon: Building2,
    color: 'text-purple-400',
    promptId: 'customer-meeting-prep',
    audience: 'Executive Sponsor / C-Suite',
    frequency: 'As needed',
    needsRepSelector: false,
    needsDealSelector: true,
    roles: ['rep'],
  },
];

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function renderMarkdown(text: string): string {
  const html = text
    .replace(/\|(.+)\|/g, (match) => {
      if (match.includes('---')) return '';
      const cells = match
        .split('|')
        .filter(Boolean)
        .map((c) => c.trim());
      return `<tr>${cells.map((c) => `<td style="padding:4px 10px;border-bottom:1px solid rgba(255,255,255,0.06)">${c}</td>`).join('')}</tr>`;
    })
    .replace(
      /(<tr>.*<\/tr>\s*)+/g,
      (match) =>
        `<table class="w-full text-xs font-mono border border-border/30 rounded mb-3">${match}</table>`
    )
    .replace(
      /### (.+?)(\n|$)/g,
      '<h3 class="text-sm font-semibold text-foreground mt-4 mb-2">$1</h3>'
    )
    .replace(/## (.+?)(\n|$)/g, '<h2 class="text-base font-bold text-foreground mt-3 mb-2">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    .replace(/\n/g, '<br/>')
    .replace(/[✅❌⚠️🎯🔄🧵]/g, (m) => `<span class="not-prose">${m}</span>`);
  return sanitizeHTML(html);
}

// ---------------------------------------------------------------------------
// Searchable deal selector
// ---------------------------------------------------------------------------

function DealSearchSelector({
  deals,
  selectedDealId,
  onSelect,
}: {
  deals: Deal[];
  selectedDealId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return deals;
    const q = query.toLowerCase();
    return deals.filter(
      (d) =>
        d.company.toLowerCase().includes(q) ||
        d.rep.toLowerCase().includes(q) ||
        d.stage.toLowerCase().includes(q)
    );
  }, [deals, query]);

  const selectedDeal = deals.find((d) => d.id === selectedDealId);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={
              open
                ? query
                : selectedDeal
                  ? `${selectedDeal.company} — ${fmt(selectedDeal.acv)}`
                  : ''
            }
            onChange={(e) => {
              setQuery(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => {
              setOpen(true);
              setQuery('');
            }}
            placeholder="Search deals by company, rep, or stage..."
            className="w-full text-xs bg-secondary/50 border border-border/30 rounded-lg pl-8 pr-8 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          {selectedDealId && (
            <button
              onClick={() => {
                onSelect('');
                setQuery('');
                setOpen(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border/60 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
              No deals match
            </div>
          ) : (
            filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  onSelect(d.id);
                  setOpen(false);
                  setQuery('');
                  inputRef.current?.blur();
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent/30 transition-colors flex items-center gap-3 ${
                  d.id === selectedDealId ? 'bg-primary/5 text-primary' : ''
                }`}
              >
                <span className="font-semibold text-foreground truncate flex-1">{d.company}</span>
                <span className="font-mono text-muted-foreground whitespace-nowrap">
                  {fmt(d.acv)}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground whitespace-nowrap">
                  {d.stage}
                </span>
                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                  {d.rep}
                </span>
              </button>
            ))
          )}
        </div>
      )}
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setOpen(false);
            setQuery('');
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MeetingPrep() {
  const { role, currentRep } = useRole();
  const { pushNote, pushTask } = useCRM();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string>('');
  const [output, setOutput] = useState<PromptOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [repMeetingType, setRepMeetingType] = useState<string | null>(null);

  // Rep's own deals (for rep view filtering)
  const repDeals = useMemo(() => pipelineDeals.filter((d) => d.rep === currentRep), [currentRep]);

  // Scoped deals for manager/exec views
  const scopedPipelineDeals = useMemo(() => {
    if (role === 'rep') return repDeals;
    if (role === 'manager') {
      const mgr = SALES_MANAGERS.find((m) => m.name === currentRep) || SALES_MANAGERS[0];
      return pipelineDeals.filter((d) => mgr.team.includes(d.rep));
    }
    return pipelineDeals;
  }, [role, currentRep, repDeals]);

  // Top deals for manager/exec deal drill-down (sorted by ACV, capped)
  const topDeals = useMemo(() => {
    return [...scopedPipelineDeals].sort((a, b) => b.acv - a.acv).slice(0, 20);
  }, [scopedPipelineDeals]);

  const allReps = useMemo(() => {
    const reps = new Set<string>();
    pipelineDeals.forEach((d) => reps.add(d.rep));
    return Array.from(reps).sort();
  }, []);

  const visibleTemplates = MEETING_TEMPLATES.filter((t) => t.roles.includes(role));
  const repTemplates = MEETING_TEMPLATES.filter((t) => t.roles.includes('rep'));

  async function generatePrep(template: MeetingTemplate, deal?: Deal) {
    setLoading(true);
    setSelectedTemplate(template.id);
    setExecutedActions(new Set());
    setCopied(false);
    setOutput(null);

    try {
      if (template.needsDealSelector && deal) {
        // Customer meeting — pass deal + meeting type
        const result = await executePrompt(template.promptId, deal, undefined, template.id);
        setOutput(result);
      } else {
        const repName = template.needsRepSelector ? selectedRep || allReps[0] : undefined;
        const result = await executePrompt(template.promptId, undefined, repName);
        setOutput(result);
      }
    } catch (err) {
      console.error('Meeting prep generation failed:', err);
      setOutput(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: OutputAction) {
    if (executedActions.has(action.id)) return;

    if (action.type === 'crm-note' && action.dealId) {
      await pushNote(action.dealId, `RevOS: Meeting Prep`, action.payload);
    } else if (action.type === 'crm-task' && action.dealId) {
      await pushTask(action.dealId, action.payload, 'Generated by RevOS Meeting Prep');
    }

    setExecutedActions((prev) => new Set(prev).add(action.id));
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output.content.replace(/[#*|]/g, '').replace(/\n{3,}/g, '\n\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleBack() {
    setOutput(null);
    setSelectedTemplate(null);
    setSelectedDealId('');
    setExecutedActions(new Set());
    setCopied(false);
  }

  // Pipeline stats — scoped to rep when in rep view
  const scopedDeals = role === 'rep' ? repDeals : pipelineDeals;
  const totalDeals = scopedDeals.length;

  // Auto-match deal stage to meeting template
  const stageToTemplate: Record<string, string> = {
    Discovery: 'discovery-call',
    Qualification: 'technical-demo',
    Proposal: 'proposal-review',
    Negotiation: 'price-negotiation',
  };

  // Active rep template object
  const activeRepTemplate = repMeetingType
    ? repTemplates.find((t) => t.id === repMeetingType)
    : null;

  // Filtered rep deals by selected meeting type stage
  const filteredRepDeals = useMemo(() => {
    const sorted = [...repDeals].sort((a, b) => {
      if (a.pqScore < 40 && b.pqScore >= 40) return -1;
      if (b.pqScore < 40 && a.pqScore >= 40) return 1;
      return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
    });
    if (!activeRepTemplate?.dealStages) return sorted;
    return sorted.filter((d) => activeRepTemplate.dealStages!.includes(d.stage));
  }, [repDeals, activeRepTemplate]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="animate-fade-in flex items-center gap-3">
        <Calendar className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Meeting Prep</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {role === 'rep'
              ? 'Pick a meeting type, then select a deal'
              : `AI-generated agendas powered by live pipeline data (${totalDeals} deals)`}
          </p>
        </div>
      </div>

      {/* Context bar — shown in detail view when output or loading */}
      {(output || loading) && (
        <div className="animate-fade-in flex items-center gap-3">
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          {selectedDealId && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs font-semibold text-foreground">
                {pipelineDeals.find((d) => d.id === selectedDealId)?.company}
              </span>
            </>
          )}
          {(selectedTemplate || output) && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {MEETING_TEMPLATES.find((t) => t.id === selectedTemplate)?.name ||
                  output?.promptName}
              </span>
            </>
          )}
        </div>
      )}

      {/* Rep view — meeting type selector first, then deals (hidden when output showing) */}
      {role === 'rep' && !(output || loading) && (
        <div className="animate-fade-in space-y-4">
          {/* Meeting type pills */}
          <div className="flex flex-wrap gap-2">
            {repTemplates.map((t) => {
              const Icon = t.icon;
              const isActive = repMeetingType === t.id;
              const matchCount = t.dealStages
                ? repDeals.filter((d) => t.dealStages!.includes(d.stage)).length
                : repDeals.length;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setRepMeetingType(isActive ? null : t.id);
                    setSelectedDealId('');
                  }}
                  className={`flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-primary/10 border-primary/40 text-primary font-semibold'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary' : t.color}`} />
                  {t.name}
                  {matchCount > 0 && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {matchCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Deal list */}
          <div className="glass-card divide-y divide-border/20 overflow-hidden">
            {filteredRepDeals.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                {repMeetingType ? 'No deals match this meeting type' : 'No active deals'}
              </div>
            ) : (
              filteredRepDeals.map((deal) => {
                const templateId =
                  repMeetingType || stageToTemplate[deal.stage] || 'stakeholder-meeting';
                const template = MEETING_TEMPLATES.find((t) => t.id === templateId);
                const daysToClose = Math.round(
                  (new Date(deal.closeDate).getTime() - Date.now()) / 86400000
                );
                const isAtRisk = deal.pqScore < 40;
                const isActive = selectedDealId === deal.id;

                return (
                  <button
                    key={deal.id}
                    onClick={() => {
                      setSelectedDealId(deal.id);
                      if (template) {
                        setSelectedTemplate(template.id);
                        generatePrep(template, deal);
                      }
                    }}
                    disabled={loading}
                    className={`w-full text-left flex items-center gap-4 px-4 py-3 transition-all group ${
                      isActive ? 'bg-primary/5' : 'hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {deal.company}
                        </span>
                        {isAtRisk && (
                          <span className="text-[9px] font-mono text-grade-f bg-grade-f/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            At Risk
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-foreground flex-shrink-0">
                      {fmt(deal.acv)}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground flex-shrink-0">
                      {deal.stage}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground w-16 text-right flex-shrink-0">
                      {daysToClose > 0 ? `${daysToClose}d` : 'Overdue'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Meeting Type Cards (manager/exec/revops — hidden when output showing) */}
      {role !== 'rep' && !(output || loading) && (
        <div className="animate-fade-in space-y-4">
          <div
            className={`grid grid-cols-1 ${visibleTemplates.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}
          >
            {visibleTemplates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate === template.id;

              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setSelectedDealId('');
                    if (!template.needsRepSelector && !template.needsDealSelector)
                      generatePrep(template);
                  }}
                  disabled={loading}
                  className={`w-full text-left glass-card p-5 transition-all group ${
                    isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : 'hover:bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-primary/15' : 'bg-secondary/50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : template.color}`} />
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      {template.frequency}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{template.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {template.description}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs font-medium text-primary group-hover:text-primary/80">
                    <Zap className="w-3.5 h-3.5" />
                    {template.needsRepSelector ? 'Select Rep' : 'Generate'}
                    <ChevronRight className="w-3.5 h-3.5 ml-auto transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rep selector for 1:1 prep — shown below cards when selected */}
          {(() => {
            const template = visibleTemplates.find(
              (t) => t.id === selectedTemplate && t.needsRepSelector
            );
            if (!template) return null;
            return (
              <div className="glass-card p-4 animate-fade-in flex items-center gap-3">
                <Users className="w-4 h-4 text-green-400" />
                <label className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
                  Select Rep for 1:1 Prep:
                </label>
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="flex-1 text-xs bg-secondary/50 border border-border/30 rounded-lg px-2 py-1.5 text-foreground"
                >
                  <option value="">Choose a rep...</option>
                  {allReps.map((rep) => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => generatePrep(template)}
                  disabled={loading || !selectedRep}
                  className="text-[11px] font-mono px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  Generate
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Deal Drill-Down — manager/exec/revops (hidden when output showing) */}
      {role !== 'rep' && !(output || loading) && (
        <div className="glass-card p-5 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="metric-label flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Opportunity Prep
            </div>
            <span className="text-[9px] font-mono text-muted-foreground">
              {topDeals.length} deals · sorted by ACV
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Select a deal to generate MEDDIC assessment, risk analysis, or win strategy
          </p>
          <DealSearchSelector
            deals={topDeals}
            selectedDealId={selectedDealId}
            onSelect={setSelectedDealId}
          />
          {selectedDealId && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fade-in">
              {[
                {
                  label: 'MEDDIC Assessment',
                  desc: 'Evaluate deal qualification gaps',
                  promptId: 'assess-meddic-completeness',
                  icon: FileText,
                  color: 'text-blue-400',
                },
                {
                  label: 'Risk Analysis',
                  desc: 'Identify and mitigate deal risks',
                  promptId: 'flag-high-risk-deals',
                  icon: AlertTriangle,
                  color: 'text-red-400',
                },
                {
                  label: 'Win Strategy',
                  desc: 'Build a competitive win plan',
                  promptId: 'create-win-strategy-plan',
                  icon: TrendingUp,
                  color: 'text-green-400',
                },
                {
                  label: 'Exec Summary',
                  desc: 'Deal overview for leadership',
                  promptId: 'prepare-executive-summary-deal',
                  icon: Building2,
                  color: 'text-purple-400',
                },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.promptId}
                    onClick={async () => {
                      const deal = scopedPipelineDeals.find((d) => d.id === selectedDealId);
                      if (!deal) return;
                      setLoading(true);
                      setSelectedTemplate(action.promptId);
                      setExecutedActions(new Set());
                      setCopied(false);
                      setOutput(null);
                      try {
                        const result = await executePrompt(action.promptId, deal);
                        setOutput(result);
                      } catch (err) {
                        console.error('Deal prep failed:', err);
                        setOutput(null);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="flex flex-col items-start gap-2 text-left rounded-lg border border-border/30 p-3
                      hover:border-primary/30 hover:bg-muted/10 transition-all disabled:opacity-40"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <div>
                      <div className="text-[11px] font-semibold text-foreground">
                        {action.label}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{action.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Meeting Support Tools — shown for reps only after generating prep */}
      {role === 'rep' && selectedDealId && !loading && output && (
        <div className="glass-card p-5 animate-fade-in space-y-3">
          <div className="metric-label flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Pre-Meeting Research Tools
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            Quick-fire prompts to build context before any customer meeting
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              {
                label: 'Find Case Studies',
                desc: "Search for reference customers matching this prospect's segment, project type, and size",
                icon: FileText,
                promptId: 'extract-win-loss-insights',
              },
              {
                label: 'Customer Context',
                desc: 'Company background, recent news, project portfolio, and key stakeholders to research',
                icon: Building2,
                promptId: 'prepare-executive-summary-deal',
              },
              {
                label: 'Industry Trends',
                desc: 'Construction tech adoption, market dynamics, and regulatory changes affecting this segment',
                icon: TrendingUp,
                promptId: 'evaluate-external-factors',
              },
            ].map((tool) => (
              <button
                key={tool.label}
                onClick={async () => {
                  if (!selectedDealId) return;
                  const deal = pipelineDeals.find((d) => d.id === selectedDealId);
                  if (!deal) return;
                  setLoading(true);
                  setSelectedTemplate(null);
                  setExecutedActions(new Set());
                  setCopied(false);
                  setOutput(null);
                  try {
                    const result = await executePrompt(tool.promptId, deal);
                    setOutput(result);
                  } catch (err) {
                    console.error('Research tool failed:', err);
                    setOutput(null);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={!selectedDealId || loading}
                className="flex items-start gap-2 text-left rounded-lg border border-border/30 p-3
                  hover:border-primary/30 hover:bg-muted/10 transition-all disabled:opacity-40
                  disabled:cursor-not-allowed"
              >
                <tool.icon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-foreground">{tool.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">
                    {tool.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="text-[9px] font-mono text-primary/70">
            Dig deeper on{' '}
            {pipelineDeals.find((d) => d.id === selectedDealId)?.company || 'this deal'}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="glass-card p-8 animate-fade-in flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div>
            <div className="text-sm text-foreground font-medium">Generating meeting prep...</div>
            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Analyzing pipeline, forecasts, and rep performance data
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      {output && !loading && (
        <div className="glass-card p-5 animate-fade-in space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{output.promptName}</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-primary/10 text-primary">
                {Math.round(output.confidence * 100)}% confidence
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                Generated {output.generatedAt.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/30 transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <ClipboardCopy className="w-3 h-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  const template = MEETING_TEMPLATES.find((t) => t.id === selectedTemplate);
                  if (template) {
                    const deal = template.needsDealSelector
                      ? pipelineDeals.find((d) => d.id === selectedDealId)
                      : undefined;
                    generatePrep(template, deal);
                  }
                }}
                className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted/30 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Re-generate
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-secondary/30 rounded-xl p-5 border border-border/20">
            <div
              className="text-sm text-foreground/90 prose prose-sm prose-invert max-w-none
                [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2
                [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5
                [&_table]:text-[11px] [&_table]:font-mono [&_table]:w-full [&_table]:my-2
                [&_td]:px-2 [&_td]:py-1
                [&_strong]:text-foreground
                [&_br]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(output.content) }}
            />
          </div>

          {/* Data Sources */}
          <div className="flex flex-wrap gap-1.5">
            {output.dataSourcesUsed.map((src) => (
              <span
                key={src}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground"
              >
                {src}
              </span>
            ))}
          </div>

          {/* Actions */}
          {output.actions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                CRM Actions
              </div>
              <div className="flex flex-wrap gap-1.5">
                {output.actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={executedActions.has(action.id)}
                    className={`flex items-center gap-1.5 text-[10px] font-mono px-3 py-2 rounded-lg border transition-colors ${
                      executedActions.has(action.id)
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 cursor-default'
                        : 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer'
                    }`}
                  >
                    {executedActions.has(action.id) ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : action.type === 'crm-note' ? (
                      <FileText className="w-3 h-3" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
