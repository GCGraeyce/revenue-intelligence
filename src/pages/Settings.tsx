import { useState, useCallback } from 'react';
import { pipelineDeals } from '@/data/demo-data';
import { useRole } from '@/contexts/RoleContext';
import {
  getAppSettings,
  updateAppSettings,
  getScoringConfigHistory,
  type AppSettings,
  type CRMProvider,
  type AIProvider,
  type CoachingModeType,
} from '@/data/settings-config';
import { AlertThresholdEditor } from '@/components/AlertThresholdEditor';
import { SalesTargetEditor } from '@/components/SalesTargetEditor';
import { ScoringConfig } from '@/components/ScoringConfig';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  Scale,
  RefreshCw,
  Database,
  Bell,
  ToggleLeft,
  Key,
  Check,
  Plug,
} from 'lucide-react';
import type { Role } from '@/contexts/RoleContext';

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
        checked ? 'bg-primary' : 'bg-muted',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
      disabled={disabled}
    >
      <span
        className={cn(
          'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Select Dropdown
// ---------------------------------------------------------------------------

function SelectField({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'text-sm font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-1.5 text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Number Input
// ---------------------------------------------------------------------------

function NumberField({
  value,
  onChange,
  min,
  max,
  suffix,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        disabled={disabled}
        className={cn(
          'w-20 text-sm font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-1.5 text-foreground text-right',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
      {suffix && <span className="text-[10px] font-mono text-muted-foreground">{suffix}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PQS Weight Configuration
// ---------------------------------------------------------------------------

interface WeightDimension {
  name: string;
  weight: number;
  empiricalWeight: number;
  rationale: string;
  lastAdjusted: string;
}

const weightDimensions: WeightDimension[] = [
  {
    name: 'Outcome Probability',
    weight: 0.3,
    empiricalWeight: 0.28,
    rationale:
      'Strongest single predictor of close. Combines ML probability signals across win/loss/slip/no-decision.',
    lastAdjusted: 'v2.4.1 — Feb 23',
  },
  {
    name: 'ICP Fit',
    weight: 0.2,
    empiricalWeight: 0.15,
    rationale:
      'Firmographic and technographic alignment score. Overweighted vs empirical by design to reward ideal customer targeting.',
    lastAdjusted: 'v2.4.1 — Feb 23',
  },
  {
    name: 'Persona Coverage',
    weight: 0.15,
    empiricalWeight: 0.18,
    rationale:
      'Multi-threading coverage across buying committee. Empirical impact is higher — consider raising weight.',
    lastAdjusted: 'v2.4.0 — Feb 16',
  },
  {
    name: 'Process Adherence',
    weight: 0.15,
    empiricalWeight: 0.17,
    rationale: 'MEDDPICC process completion. Tracks required milestones per stage.',
    lastAdjusted: 'v2.3.2 — Feb 9',
  },
  {
    name: 'Engagement Velocity',
    weight: 0.1,
    empiricalWeight: 0.11,
    rationale:
      'Recency and frequency of buyer engagement signals. Includes email, meeting, product usage.',
    lastAdjusted: 'v2.4.1 — Feb 23',
  },
  {
    name: 'Price Risk',
    weight: 0.05,
    empiricalWeight: 0.06,
    rationale:
      'Probability of excessive discounting or deal compression. Lower weight as it is partially captured in outcome model.',
    lastAdjusted: 'v2.4.0 — Feb 16',
  },
  {
    name: 'Stage Progression',
    weight: 0.05,
    empiricalWeight: 0.05,
    rationale: 'Velocity through pipeline stages vs expected cadence. Aligned with empirical.',
    lastAdjusted: 'v2.3.0 — Jan 30',
  },
];

function WeightRow({ dim }: { dim: WeightDimension }) {
  const [expanded, setExpanded] = useState(false);
  const configPct = Math.round(dim.weight * 100);
  const empiricalPct = Math.round(dim.empiricalWeight * 100);
  const misaligned = Math.abs(configPct - empiricalPct) > 3;

  return (
    <div className="rounded-lg border border-border/30 overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-foreground flex-1">{dim.name}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-foreground">{configPct}%</span>
          {misaligned && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--grade-c)/.1)] text-[hsl(var(--grade-c))]">
              Empirical: {empiricalPct}%
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-3 border-t border-border/20 pt-3 space-y-3 animate-fade-in">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground w-16">Configured</span>
              <div className="flex-1 h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${configPct * 3}%` }}
                />
              </div>
              <span className="text-[9px] font-mono w-6 text-right">{configPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground w-16">Empirical</span>
              <div className="flex-1 h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--grade-b))] rounded-full"
                  style={{ width: `${empiricalPct * 3}%` }}
                />
              </div>
              <span className="text-[9px] font-mono w-6 text-right">{empiricalPct}%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">
              Rationale
            </div>
            <div className="text-xs text-foreground leading-relaxed">{dim.rationale}</div>
          </div>
          <div className="text-[9px] font-mono text-muted-foreground">
            Last adjusted: {dim.lastAdjusted}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Configuration Section
// ---------------------------------------------------------------------------

interface APIConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  status: 'active' | 'inactive' | 'error';
  rateLimit: number;
  timeout: number;
  retries: number;
  description: string;
}

const DEFAULT_API_CONFIGS: APIConfig[] = [
  {
    name: 'Zoho CRM API',
    baseUrl: 'https://www.zohoapis.eu/crm/v5',
    apiKey: 'zoho_crm_****_8f3a',
    status: 'active',
    rateLimit: 100,
    timeout: 30000,
    retries: 3,
    description: 'Primary CRM data source for deals, contacts, and activities',
  },
  {
    name: 'Claude AI API',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-****_c7e2',
    status: 'active',
    rateLimit: 60,
    timeout: 120000,
    retries: 2,
    description: 'AI engine for scoring, coaching, and deal analysis',
  },
  {
    name: 'Webhook Endpoint',
    baseUrl: 'https://hooks.evercam.com/revos',
    apiKey: 'whk_****_9d41',
    status: 'active',
    rateLimit: 200,
    timeout: 10000,
    retries: 5,
    description: 'Outbound webhooks for CRM write-back and notifications',
  },
  {
    name: 'Slack Integration',
    baseUrl: 'https://hooks.slack.com/services',
    apiKey: 'xoxb-****-4f82',
    status: 'inactive',
    rateLimit: 30,
    timeout: 5000,
    retries: 2,
    description: 'Slack bot for deal alerts, coaching notifications, and team updates',
  },
  {
    name: 'Email Service (SendGrid)',
    baseUrl: 'https://api.sendgrid.com/v3',
    apiKey: 'SG.****_b291',
    status: 'active',
    rateLimit: 50,
    timeout: 15000,
    retries: 3,
    description: 'Email delivery for pipeline digest reports and alert escalations',
  },
];

function APIConfigSection() {
  const [apis, setApis] = useState(DEFAULT_API_CONFIGS);
  const [expandedApi, setExpandedApi] = useState<string | null>(null);
  const [editingApi, setEditingApi] = useState<string | null>(null);

  const updateApi = useCallback((name: string, updates: Partial<APIConfig>) => {
    setApis((prev) => prev.map((a) => (a.name === name ? { ...a, ...updates } : a)));
  }, []);

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="metric-label flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Key className="w-3 h-3 text-primary" />
        </div>
        API Configuration
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-1">
          {apis.filter((a) => a.status === 'active').length}/{apis.length} active
        </span>
      </div>

      <div className="space-y-2">
        {apis.map((api) => {
          const isExpanded = expandedApi === api.name;
          const isEditing = editingApi === api.name;

          return (
            <div key={api.name} className="rounded-lg border border-border/30 overflow-hidden">
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpandedApi(isExpanded ? null : api.name)}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    api.status === 'active'
                      ? 'bg-grade-a'
                      : api.status === 'error'
                        ? 'bg-grade-f'
                        : 'bg-muted-foreground/30'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{api.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">
                    {api.baseUrl}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded',
                    api.status === 'active'
                      ? 'bg-grade-a/10 text-grade-a'
                      : api.status === 'error'
                        ? 'bg-grade-f/10 text-grade-f'
                        : 'bg-muted/50 text-muted-foreground'
                  )}
                >
                  {api.status}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-border/20 p-4 space-y-3 animate-fade-in bg-muted/5">
                  <div className="text-[10px] text-muted-foreground">{api.description}</div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Base URL
                      </label>
                      <input
                        type="text"
                        value={api.baseUrl}
                        onChange={(e) => updateApi(api.name, { baseUrl: e.target.value })}
                        disabled={!isEditing}
                        className={cn(
                          'w-full mt-1 text-xs font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-foreground',
                          !isEditing && 'opacity-70'
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={api.apiKey}
                        onChange={(e) => updateApi(api.name, { apiKey: e.target.value })}
                        disabled={!isEditing}
                        className={cn(
                          'w-full mt-1 text-xs font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-foreground',
                          !isEditing && 'opacity-70'
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Rate Limit
                      </label>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={api.rateLimit}
                          onChange={(e) =>
                            updateApi(api.name, { rateLimit: Number(e.target.value) })
                          }
                          disabled={!isEditing}
                          className={cn(
                            'w-full text-xs font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-foreground',
                            !isEditing && 'opacity-70'
                          )}
                        />
                        <span className="text-[9px] text-muted-foreground">/min</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Timeout
                      </label>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={api.timeout / 1000}
                          onChange={(e) =>
                            updateApi(api.name, { timeout: Number(e.target.value) * 1000 })
                          }
                          disabled={!isEditing}
                          className={cn(
                            'w-full text-xs font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-foreground',
                            !isEditing && 'opacity-70'
                          )}
                        />
                        <span className="text-[9px] text-muted-foreground">sec</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Retries
                      </label>
                      <input
                        type="number"
                        value={api.retries}
                        onChange={(e) => updateApi(api.name, { retries: Number(e.target.value) })}
                        disabled={!isEditing}
                        min={0}
                        max={10}
                        className={cn(
                          'w-full mt-1 text-xs font-mono bg-secondary/50 border border-border/30 rounded-lg px-3 py-2 text-foreground',
                          !isEditing && 'opacity-70'
                        )}
                      />
                    </div>
                  </div>

                  {/* Status Toggle + Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <div className="flex items-center gap-3">
                      <Toggle
                        checked={api.status === 'active'}
                        onChange={(v) => updateApi(api.name, { status: v ? 'active' : 'inactive' })}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {api.status === 'active' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingApi(null);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono text-grade-a px-3 py-1.5 rounded-lg border border-grade-a/30 bg-grade-a/5 hover:bg-grade-a/10 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingApi(api.name);
                          }}
                          className="flex items-center gap-1 text-[10px] font-mono text-primary px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                        >
                          <SettingsIcon className="w-3 h-3" /> Edit
                        </button>
                      )}
                      <button className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground px-3 py-1.5 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
                        <Plug className="w-3 h-3" /> Test
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

export default function Settings() {
  const { role } = useRole();
  const isRevOps = role === 'revops';
  const canEdit = role === 'exec' || role === 'revops' || role === 'admin';

  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [saved, setSaved] = useState(false);
  const configHistory = getScoringConfigHistory();

  const update = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      updateAppSettings(updates);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            System configuration &mdash; all changes auto-save
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-grade-a px-3 py-1.5 rounded-lg bg-grade-a/10 animate-fade-in">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      {/* General Configuration — editable */}
      <div className="glass-card p-5 animate-fade-in space-y-4">
        <div className="metric-label flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
            <SettingsIcon className="w-3 h-3 text-muted-foreground" />
          </div>
          General Configuration
          <span className="text-[9px] font-mono text-muted-foreground ml-auto">
            Updated: {settings.updatedAt} · by {settings.updatedBy}
          </span>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">Default Role View</span>
              <div className="text-[10px] text-muted-foreground">
                Role selected when a new user first opens the dashboard
              </div>
            </div>
            <SelectField
              value={settings.defaultRole}
              options={[
                { value: 'exec', label: 'Executive' },
                { value: 'manager', label: 'Manager' },
                { value: 'rep', label: 'Sales Rep' },
                { value: 'revops', label: 'Revenue Ops' },
                { value: 'admin', label: 'Admin' },
              ]}
              onChange={(v) => update({ defaultRole: v as Role })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">Coaching Mode</span>
              <div className="text-[10px] text-muted-foreground">
                HITL requires human approval; Agentic runs autonomously
              </div>
            </div>
            <SelectField
              value={settings.defaultCoachingMode}
              options={[
                { value: 'hitl', label: 'Human-in-the-Loop' },
                { value: 'agentic', label: 'Agentic' },
              ]}
              onChange={(v) => update({ defaultCoachingMode: v as CoachingModeType })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">CRM Provider</span>
              <div className="text-[10px] text-muted-foreground">
                Primary CRM for deal sync and pipeline data
              </div>
            </div>
            <SelectField
              value={settings.crmProvider}
              options={[
                { value: 'zoho', label: 'Zoho CRM' },
                { value: 'salesforce', label: 'Salesforce' },
                { value: 'hubspot', label: 'HubSpot' },
                { value: 'demo', label: 'Demo Mode' },
              ]}
              onChange={(v) => update({ crmProvider: v as CRMProvider })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">AI Provider</span>
              <div className="text-[10px] text-muted-foreground">
                AI model for scoring, coaching, and analysis
              </div>
            </div>
            <SelectField
              value={settings.aiProvider}
              options={[
                { value: 'claude', label: 'Claude (Anthropic)' },
                { value: 'openai', label: 'OpenAI' },
                { value: 'demo', label: 'Demo Mode' },
              ]}
              onChange={(v) => update({ aiProvider: v as AIProvider })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">Explain Scoring</span>
              <div className="text-[10px] text-muted-foreground">
                Show PQS score breakdown explanations to users
              </div>
            </div>
            <Toggle
              checked={settings.defaultExplainMode}
              onChange={(v) => update({ defaultExplainMode: v })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">Currency</span>
              <div className="text-[10px] text-muted-foreground">
                Display currency for all pipeline values
              </div>
            </div>
            <SelectField
              value={settings.currency}
              options={[
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'AUD', label: 'AUD (A$)' },
              ]}
              onChange={(v) => update({ currency: v })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div>
              <span className="text-sm text-foreground">Date Format</span>
              <div className="text-[10px] text-muted-foreground">
                Date display format across the application
              </div>
            </div>
            <SelectField
              value={settings.dateFormat}
              options={[
                { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' },
                { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' },
                { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' },
              ]}
              onChange={(v) => update({ dateFormat: v })}
              disabled={!canEdit}
            />
          </div>

          <div className="flex items-center justify-between py-2.5">
            <div>
              <span className="text-sm text-foreground">Timezone</span>
              <div className="text-[10px] text-muted-foreground">
                Timezone for all date/time calculations
              </div>
            </div>
            <SelectField
              value={settings.timezone}
              options={[
                { value: 'Europe/Dublin', label: 'Europe/Dublin (GMT)' },
                { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
                { value: 'America/New_York', label: 'US Eastern' },
                { value: 'America/Los_Angeles', label: 'US Pacific' },
                { value: 'Australia/Sydney', label: 'Australia/Sydney' },
                { value: 'Asia/Singapore', label: 'Asia/Singapore' },
              ]}
              onChange={(v) => update({ timezone: v })}
              disabled={!canEdit}
            />
          </div>
        </div>
      </div>

      {/* Fiscal Calendar & Pilot Settings — exec/revops/admin only */}
      {canEdit && (
        <div className="glass-card p-5 animate-fade-in space-y-4">
          <div className="metric-label flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
              <Scale className="w-3 h-3 text-muted-foreground" />
            </div>
            Fiscal Calendar & Pilot
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center justify-between py-2.5 border-b border-border/30">
              <div>
                <span className="text-sm text-foreground">Fiscal Year Start Month</span>
                <div className="text-[10px] text-muted-foreground">
                  First month of your reporting fiscal year
                </div>
              </div>
              <SelectField
                value={String(settings.fiscalYearStartMonth)}
                options={[
                  { value: '1', label: 'January' },
                  { value: '2', label: 'February' },
                  { value: '3', label: 'March' },
                  { value: '4', label: 'April' },
                  { value: '5', label: 'May' },
                  { value: '6', label: 'June' },
                  { value: '7', label: 'July' },
                  { value: '8', label: 'August' },
                  { value: '9', label: 'September' },
                  { value: '10', label: 'October' },
                  { value: '11', label: 'November' },
                  { value: '12', label: 'December' },
                ]}
                onChange={(v) => update({ fiscalYearStartMonth: Number(v) })}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-border/30">
              <div>
                <span className="text-sm text-foreground">Fiscal Year Start Day</span>
                <div className="text-[10px] text-muted-foreground">
                  Start day within the month (usually 1)
                </div>
              </div>
              <NumberField
                value={settings.fiscalYearStartDay}
                onChange={(v) => update({ fiscalYearStartDay: v })}
                min={1}
                max={28}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-border/30">
              <div>
                <span className="text-sm text-foreground">Pilot Status</span>
                <div className="text-[10px] text-muted-foreground">Current deployment phase</div>
              </div>
              <SelectField
                value={settings.pilotStatus}
                options={[
                  { value: 'not-started', label: 'Not Started' },
                  { value: 'active', label: 'Active Pilot' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'extended', label: 'Extended' },
                ]}
                onChange={(v) => update({ pilotStatus: v as AppSettings['pilotStatus'] })}
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between py-2.5 border-b border-border/30">
              <div>
                <span className="text-sm text-foreground">Data Retention</span>
                <div className="text-[10px] text-muted-foreground">
                  How long to retain historical deal data
                </div>
              </div>
              <NumberField
                value={settings.dataRetentionDays}
                onChange={(v) => update({ dataRetentionDays: v })}
                min={30}
                max={3650}
                suffix="days"
                disabled={!canEdit}
              />
            </div>

            <div className="flex items-center justify-between py-2.5">
              <div>
                <span className="text-sm text-foreground">Require Approval for CRM Push</span>
                <div className="text-[10px] text-muted-foreground">
                  Gate automated CRM writes behind manager approval
                </div>
              </div>
              <Toggle
                checked={settings.requireApprovalForPush}
                onChange={(v) => update({ requireApprovalForPush: v })}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings — editable */}
      <div className="glass-card p-5 animate-fade-in space-y-4">
        <div className="metric-label flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
            <Bell className="w-3 h-3 text-muted-foreground" />
          </div>
          Notification Settings
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-border/30">
          <div>
            <span className="text-sm text-foreground">Alert on Deal Stall</span>
            <div className="text-[10px] text-muted-foreground">
              Notify when a deal hasn't progressed beyond threshold
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Toggle
              checked={settings.alertOnStall}
              onChange={(v) => update({ alertOnStall: v })}
              disabled={!canEdit}
            />
            {settings.alertOnStall && (
              <NumberField
                value={settings.stallThresholdDays}
                onChange={(v) => update({ stallThresholdDays: v })}
                min={1}
                max={90}
                suffix="days"
                disabled={!canEdit}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <span className="text-sm text-foreground">Alert on PQS Drop</span>
            <div className="text-[10px] text-muted-foreground">
              Notify when a deal's quality score drops by threshold
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Toggle
              checked={settings.alertOnPQSdrop}
              onChange={(v) => update({ alertOnPQSdrop: v })}
              disabled={!canEdit}
            />
            {settings.alertOnPQSdrop && (
              <NumberField
                value={settings.pqsDropThreshold}
                onChange={(v) => update({ pqsDropThreshold: v })}
                min={1}
                max={50}
                suffix="pts"
                disabled={!canEdit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Feature Flags — toggleable */}
      <div className="glass-card p-5 animate-fade-in space-y-4">
        <div className="metric-label flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
            <ToggleLeft className="w-3 h-3 text-muted-foreground" />
          </div>
          Feature Flags
        </div>
        {[
          {
            key: 'enableAICopilot' as const,
            label: 'AI Copilot',
            desc: 'Floating AI assistant panel for deal analysis and coaching',
          },
          {
            key: 'enablePlayLibrary' as const,
            label: 'Play Library',
            desc: 'Browsable library of 55 AI coaching prompts',
          },
          {
            key: 'enableAgenticMode' as const,
            label: 'Agentic Mode',
            desc: 'Allow AI to take autonomous coaching actions',
          },
          {
            key: 'enableCompetitiveIntel' as const,
            label: 'Competitive Intel',
            desc: 'Competitive analysis and win/loss insights per deal',
          },
          {
            key: 'enableMEDDIC' as const,
            label: 'MEDDIC Scoring',
            desc: 'MEDDPICC methodology scoring on all deals',
          },
        ].map((flag) => (
          <div
            key={flag.key}
            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
          >
            <div>
              <span className="text-sm text-foreground">{flag.label}</span>
              <div className="text-[10px] text-muted-foreground">{flag.desc}</div>
            </div>
            <Toggle
              checked={settings[flag.key]}
              onChange={(v) => update({ [flag.key]: v })}
              disabled={!canEdit}
            />
          </div>
        ))}
      </div>

      {/* API Configuration — exec/revops/admin only */}
      {canEdit && <APIConfigSection />}

      {/* Scoring Config Version History — exec/revops/admin only */}
      {canEdit && (
        <div className="glass-card p-5 animate-fade-in space-y-4">
          <div className="metric-label flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center">
              <Database className="w-3 h-3 text-muted-foreground" />
            </div>
            Scoring Model History
          </div>
          {configHistory.map((cfg) => (
            <div
              key={cfg.id}
              className={cn(
                'rounded-lg border p-3 space-y-1',
                cfg.isActive ? 'border-primary/30 bg-primary/5' : 'border-border/30'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{cfg.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-muted-foreground">v{cfg.version}</span>
                  {cfg.isActive && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[hsl(var(--grade-a)/.1)] text-[hsl(var(--grade-a))]">
                      Active
                    </span>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">{cfg.changelog}</div>
              <div className="text-[9px] font-mono text-muted-foreground">
                Updated: {cfg.updatedAt} by {cfg.updatedBy}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sales Target Editor — managers and above */}
      {role !== 'rep' && <SalesTargetEditor />}

      {/* Alert Threshold Editor */}
      <AlertThresholdEditor deals={pipelineDeals} />

      {/* PQS Weight Configuration — exec/revops/admin only */}
      {canEdit && (
        <div className="glass-card p-6 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="metric-label flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
                <Scale className="w-3 h-3 text-primary" />
              </div>
              PQS Weight Configuration
            </div>
            {isRevOps && (
              <button className="flex items-center gap-1.5 text-[10px] font-mono text-primary px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                <RefreshCw className="w-3 h-3" />
                Suggest Recalibration
              </button>
            )}
          </div>

          <div className="space-y-2">
            {weightDimensions.map((dim) => (
              <WeightRow key={dim.name} dim={dim} />
            ))}
          </div>

          <div className="border-t border-border/30 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Total Weight</span>
              <span
                className={cn(
                  'text-sm font-mono font-bold',
                  Math.round(weightDimensions.reduce((s, d) => s + d.weight, 0) * 100) === 100
                    ? 'text-[hsl(var(--grade-a))]'
                    : 'text-[hsl(var(--grade-f))]'
                )}
              >
                {Math.round(weightDimensions.reduce((s, d) => s + d.weight, 0) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Scoring Configuration — exec/revops/admin only */}
      {canEdit && <ScoringConfig />}
    </div>
  );
}
