import { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useCRM } from '@/contexts/CRMContext';
import { isLive, testConnection } from '@/lib/zoho-crm';
import {
  Plug,
  Wifi,
  RefreshCw,
  Shield,
  Database,
  Globe,
  Key,
  Webhook,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  ArrowUpDown,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Server,
  Zap,
  Terminal,
  FileJson,
  Loader2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  module: string;
  status: 'active' | 'available' | 'disabled';
  lastCall?: string;
  avgLatency?: number;
}

interface WebhookEvent {
  event: string;
  description: string;
  enabled: boolean;
  rescoring: boolean;
}

interface FieldMapping {
  zohoField: string;
  revosField: string;
  direction: 'read' | 'write' | 'bidirectional';
  type: string;
  custom: boolean;
}

interface ConnectionHealth {
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  latency: number;
  lastCheck: Date | null;
  tokenExpiry: string;
  org: string;
  user: string;
  dataCenter: string;
  apiVersion: string;
  rateLimit: { used: number; limit: number; resetIn: string };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Static Data — API Endpoints
   ═══════════════════════════════════════════════════════════════════════════ */

const API_ENDPOINTS: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/Deals',
    description: 'List deals with pagination & filters',
    module: 'Deals',
    status: 'active',
    lastCall: '2m ago',
    avgLatency: 340,
  },
  {
    method: 'GET',
    path: '/Deals/{id}',
    description: 'Get single deal by ID',
    module: 'Deals',
    status: 'active',
    lastCall: '5m ago',
    avgLatency: 180,
  },
  {
    method: 'PUT',
    path: '/Deals',
    description: 'Update deal fields (PQS write-back)',
    module: 'Deals',
    status: 'active',
    lastCall: '8m ago',
    avgLatency: 420,
  },
  {
    method: 'GET',
    path: '/Deals/search',
    description: 'Search deals by criteria',
    module: 'Deals',
    status: 'active',
    lastCall: '15m ago',
    avgLatency: 290,
  },
  {
    method: 'GET',
    path: '/Contacts',
    description: 'List contacts with pagination',
    module: 'Contacts',
    status: 'active',
    lastCall: '10m ago',
    avgLatency: 310,
  },
  {
    method: 'GET',
    path: '/Contacts/{id}',
    description: 'Get single contact',
    module: 'Contacts',
    status: 'available',
  },
  {
    method: 'GET',
    path: '/Deals/{id}/Contacts',
    description: 'Get contacts related to deal',
    module: 'Contacts',
    status: 'active',
    lastCall: '12m ago',
    avgLatency: 260,
  },
  {
    method: 'GET',
    path: '/Accounts/{id}',
    description: 'Get account details',
    module: 'Accounts',
    status: 'active',
    lastCall: '20m ago',
    avgLatency: 200,
  },
  {
    method: 'GET',
    path: '/Activities',
    description: 'List tasks, events, calls',
    module: 'Activities',
    status: 'active',
    lastCall: '3m ago',
    avgLatency: 380,
  },
  {
    method: 'GET',
    path: '/Deals/{id}/Notes',
    description: 'Get notes for a deal',
    module: 'Notes',
    status: 'active',
    lastCall: '6m ago',
    avgLatency: 150,
  },
  {
    method: 'POST',
    path: '/Deals/{id}/Notes',
    description: 'Create coaching note on deal',
    module: 'Notes',
    status: 'active',
    lastCall: '30m ago',
    avgLatency: 450,
  },
  {
    method: 'POST',
    path: '/Tasks',
    description: 'Create task from AI action',
    module: 'Tasks',
    status: 'active',
    lastCall: '45m ago',
    avgLatency: 520,
  },
  {
    method: 'GET',
    path: '/users',
    description: 'Verify connection & get org info',
    module: 'System',
    status: 'active',
    lastCall: '1m ago',
    avgLatency: 120,
  },
  {
    method: 'GET',
    path: '/settings/modules',
    description: 'List available CRM modules',
    module: 'System',
    status: 'available',
  },
  {
    method: 'GET',
    path: '/org',
    description: 'Get organization details',
    module: 'System',
    status: 'available',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Static Data — Webhook Events
   ═══════════════════════════════════════════════════════════════════════════ */

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { event: 'Deals.create', description: 'New deal created in CRM', enabled: true, rescoring: true },
  { event: 'Deals.edit', description: 'Deal fields updated', enabled: true, rescoring: true },
  { event: 'Deals.delete', description: 'Deal deleted from CRM', enabled: true, rescoring: false },
  {
    event: 'Contacts.create',
    description: 'New contact added (may resolve persona gap)',
    enabled: true,
    rescoring: true,
  },
  {
    event: 'Contacts.edit',
    description: 'Contact role/title changed',
    enabled: true,
    rescoring: true,
  },
  { event: 'Contacts.delete', description: 'Contact removed', enabled: false, rescoring: false },
  {
    event: 'Accounts.create',
    description: 'New account created',
    enabled: false,
    rescoring: false,
  },
  {
    event: 'Accounts.edit',
    description: 'Account firmographics changed (affects ICP)',
    enabled: true,
    rescoring: false,
  },
  { event: 'Accounts.delete', description: 'Account deleted', enabled: false, rescoring: false },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Static Data — Field Mappings
   ═══════════════════════════════════════════════════════════════════════════ */

const FIELD_MAPPINGS: FieldMapping[] = [
  {
    zohoField: 'Deal_Name',
    revosField: 'company',
    direction: 'read',
    type: 'String',
    custom: false,
  },
  { zohoField: 'Amount', revosField: 'acv', direction: 'read', type: 'Currency', custom: false },
  { zohoField: 'Stage', revosField: 'stage', direction: 'read', type: 'Picklist', custom: false },
  {
    zohoField: 'Closing_Date',
    revosField: 'closeDate',
    direction: 'read',
    type: 'Date',
    custom: false,
  },
  {
    zohoField: 'Probability',
    revosField: 'probability',
    direction: 'read',
    type: 'Integer',
    custom: false,
  },
  { zohoField: 'Owner', revosField: 'rep', direction: 'read', type: 'Lookup', custom: false },
  {
    zohoField: 'Contact_Name',
    revosField: 'contacts',
    direction: 'read',
    type: 'Lookup',
    custom: false,
  },
  {
    zohoField: 'Account_Name',
    revosField: 'account',
    direction: 'read',
    type: 'Lookup',
    custom: false,
  },
  {
    zohoField: 'Pipeline_Quality_Score',
    revosField: 'pqScore',
    direction: 'write',
    type: 'Integer',
    custom: true,
  },
  {
    zohoField: 'PQ_Grade',
    revosField: 'grade',
    direction: 'write',
    type: 'Picklist',
    custom: true,
  },
  {
    zohoField: 'Win_Probability_AI',
    revosField: 'winProbability',
    direction: 'write',
    type: 'Decimal',
    custom: true,
  },
  {
    zohoField: 'MEDDIC_Score',
    revosField: 'meddicScore',
    direction: 'write',
    type: 'Integer',
    custom: true,
  },
  {
    zohoField: 'Forecast_Category',
    revosField: 'forecastCategory',
    direction: 'bidirectional',
    type: 'Picklist',
    custom: true,
  },
  {
    zohoField: 'Days_In_Stage',
    revosField: 'daysInStage',
    direction: 'write',
    type: 'Integer',
    custom: true,
  },
  {
    zohoField: 'Last_Activity_Date',
    revosField: 'lastActivity',
    direction: 'read',
    type: 'DateTime',
    custom: false,
  },
  {
    zohoField: 'Camera_Count',
    revosField: 'cameraCount',
    direction: 'read',
    type: 'Integer',
    custom: true,
  },
  {
    zohoField: 'Product_Bundle',
    revosField: 'productBundle',
    direction: 'read',
    type: 'Picklist',
    custom: true,
  },
  {
    zohoField: 'Project_Type',
    revosField: 'projectType',
    direction: 'read',
    type: 'Picklist',
    custom: true,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Static Data — OAuth Scopes
   ═══════════════════════════════════════════════════════════════════════════ */

const OAUTH_SCOPES = [
  { scope: 'ZohoCRM.modules.ALL', description: 'Read/write all CRM modules', required: true },
  { scope: 'ZohoCRM.settings.ALL', description: 'Access CRM settings & layouts', required: true },
  { scope: 'ZohoCRM.org.READ', description: 'Read organization details', required: true },
  { scope: 'ZohoCRM.bulk.ALL', description: 'Bulk read/write operations', required: true },
  {
    scope: 'ZohoCRM.notifications.ALL',
    description: 'Webhook notification management',
    required: true,
  },
  { scope: 'ZohoCRM.users.READ', description: 'Read user profiles', required: false },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Sync Schedule Config
   ═══════════════════════════════════════════════════════════════════════════ */

const SYNC_SCHEDULE = {
  fullSync: { interval: '6 hours', lastRun: '2h 14m ago', nextRun: '3h 46m', records: 14283 },
  incrementalSync: { interval: '15 minutes', lastRun: '2m ago', nextRun: '13m', records: 47 },
  pqsWriteBack: {
    interval: 'On score change',
    lastRun: '8m ago',
    nextRun: 'Event-driven',
    records: 12,
  },
  webhookIngestion: {
    interval: 'Real-time',
    lastRun: '45s ago',
    nextRun: 'Always listening',
    records: 3,
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: 'text-green-400 bg-green-400/10',
    POST: 'text-blue-400 bg-blue-400/10',
    PUT: 'text-amber-400 bg-amber-400/10',
    DELETE: 'text-red-400 bg-red-400/10',
  };
  return (
    <span
      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${colors[method] || 'text-muted-foreground bg-muted/50'}`}
    >
      {method}
    </span>
  );
}

function DirectionBadge({ direction }: { direction: string }) {
  const config: Record<string, { label: string; color: string; icon: string }> = {
    read: { label: 'READ', color: 'text-green-400 bg-green-400/10', icon: '←' },
    write: { label: 'WRITE', color: 'text-blue-400 bg-blue-400/10', icon: '→' },
    bidirectional: { label: 'BI-DIR', color: 'text-purple-400 bg-purple-400/10', icon: '↔' },
  };
  const d = config[direction] || config.read;
  return (
    <span
      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${d.color}`}
    >
      {d.icon} {d.label}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
    unconfigured: 'bg-muted-foreground',
    active: 'bg-green-500',
    available: 'bg-muted-foreground',
    disabled: 'bg-red-500/50',
  };
  return (
    <span
      className={`w-2 h-2 rounded-full inline-block ${colors[status] || 'bg-muted-foreground'}`}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section: Connection Health
   ═══════════════════════════════════════════════════════════════════════════ */

function ConnectionHealthPanel({
  health,
  onTest,
  testing,
}: {
  health: ConnectionHealth;
  onTest: () => void;
  testing: boolean;
}) {
  const statusColors: Record<string, string> = {
    healthy: 'text-grade-a border-[hsl(var(--grade-a)/.3)] bg-[hsl(var(--grade-a)/.05)]',
    degraded: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
    down: 'text-grade-f border-[hsl(var(--grade-f)/.3)] bg-[hsl(var(--grade-f)/.05)]',
    unconfigured: 'text-muted-foreground border-border/30 bg-muted/5',
  };

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          Connection Health
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusColors[health.status]}`}
          >
            <StatusDot status={health.status} />
            {health.status.toUpperCase()}
          </span>
          <button
            onClick={onTest}
            disabled={testing}
            className="flex items-center gap-1.5 text-[10px] font-mono text-primary px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-40"
          >
            {testing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Test Connection
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-1">Latency</div>
          <div
            className={`text-sm font-mono font-bold ${health.latency < 500 ? 'text-grade-a' : health.latency < 1000 ? 'text-amber-400' : 'text-grade-f'}`}
          >
            {health.latency}ms
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-1">Organization</div>
          <div className="text-sm font-mono font-bold text-foreground truncate">
            {health.org || '—'}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-1">Auth User</div>
          <div className="text-sm font-mono font-bold text-foreground truncate">
            {health.user || '—'}
          </div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-1">Data Center</div>
          <div className="text-sm font-mono font-bold text-foreground">{health.dataCenter}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-1">API Version</div>
          <div className="text-sm font-mono font-bold text-foreground">{health.apiVersion}</div>
        </div>
        <div className="bg-secondary/30 rounded-lg p-3 text-center">
          <div className="text-[9px] text-muted-foreground mb-1">Rate Limit</div>
          <div
            className={`text-sm font-mono font-bold ${health.rateLimit.used / health.rateLimit.limit > 0.8 ? 'text-amber-400' : 'text-grade-a'}`}
          >
            {health.rateLimit.used}/{health.rateLimit.limit}
          </div>
        </div>
      </div>

      {health.lastCheck && (
        <div className="text-[9px] font-mono text-muted-foreground text-right">
          Last checked: {health.lastCheck.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section: OAuth Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

function OAuthConfigPanel({ isAdmin }: { isAdmin: boolean }) {
  const [showSecrets, setShowSecrets] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const live = isLive();

  const envVars = [
    {
      key: 'ZOHO_CLIENT_ID',
      value: live ? '1000.XXXX...XXXX' : 'Not configured',
      set: live,
      secret: false,
    },
    {
      key: 'ZOHO_CLIENT_SECRET',
      value: live ? '••••••••••••••••' : 'Not configured',
      set: live,
      secret: true,
    },
    {
      key: 'ZOHO_REFRESH_TOKEN',
      value: live ? '••••••••••••••••' : 'Not configured',
      set: live,
      secret: true,
    },
    {
      key: 'ZOHO_REDIRECT_URI',
      value: `${window.location.origin}/api/zoho/callback`,
      set: true,
      secret: false,
    },
    { key: 'ZOHO_DATA_CENTER', value: 'eu', set: true, secret: false },
    { key: 'ZOHO_SANDBOX_MODE', value: live ? 'false' : 'true', set: true, secret: false },
    {
      key: 'ZOHO_WEBHOOK_SECRET',
      value: live ? '••••••••••••••••' : 'Not configured',
      set: live,
      secret: true,
    },
    { key: 'ZOHO_SYNC_BATCH_SIZE', value: '200', set: true, secret: false },
    { key: 'ZOHO_SYNC_INTERVAL', value: '15', set: true, secret: false },
  ];

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          OAuth 2.0 Configuration
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${live ? 'text-grade-a bg-[hsl(var(--grade-a)/.1)]' : 'text-amber-400 bg-amber-400/10'}`}
          >
            {live ? 'LIVE MODE' : 'DEMO MODE'}
          </span>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="space-y-1">
        {envVars.map((env) => (
          <div
            key={env.key}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${env.set ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <code className="text-[11px] font-mono text-foreground">{env.key}</code>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-[10px] font-mono text-muted-foreground max-w-[200px] truncate">
                {env.secret && !showSecrets ? '••••••••••••' : env.value}
              </code>
              {env.secret && isAdmin && (
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* OAuth Scopes */}
      <div className="rounded-lg border border-border/30 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground flex-1">
            OAuth Scopes ({OAUTH_SCOPES.length})
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
            {OAUTH_SCOPES.filter((s) => s.required).length} required
          </span>
        </button>
        {expanded && (
          <div className="border-t border-border/20 p-4 space-y-2 animate-fade-in bg-muted/5">
            {OAUTH_SCOPES.map((scope) => (
              <div key={scope.scope} className="flex items-center gap-2.5 py-1">
                <CheckCircle
                  className={`w-3 h-3 flex-shrink-0 ${scope.required ? 'text-green-500' : 'text-muted-foreground'}`}
                />
                <code className="text-[10px] font-mono text-foreground flex-1">{scope.scope}</code>
                <span className="text-[9px] text-muted-foreground">{scope.description}</span>
                {scope.required && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    REQUIRED
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!live && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-400/20 bg-amber-400/5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Demo mode active.</span> Set{' '}
            <code className="font-mono px-1 py-0.5 rounded bg-muted/50">VITE_ZOHO_CLIENT_ID</code>{' '}
            in your <code className="font-mono px-1 py-0.5 rounded bg-muted/50">.env</code> to
            enable live Zoho API calls. All operations currently simulate realistic latency with
            local data.
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section: API Endpoints Registry
   ═══════════════════════════════════════════════════════════════════════════ */

function APIEndpointsPanel() {
  const [filter, setFilter] = useState<string>('all');
  const modules = ['all', ...new Set(API_ENDPOINTS.map((e) => e.module))];
  const filtered =
    filter === 'all' ? API_ENDPOINTS : API_ENDPOINTS.filter((e) => e.module === filter);
  const activeCount = API_ENDPOINTS.filter((e) => e.status === 'active').length;

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          API Endpoint Registry
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
            {activeCount} active
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
            {API_ENDPOINTS.length} total
          </span>
        </div>
      </div>

      {/* Module filter */}
      <div className="flex gap-1.5 flex-wrap">
        {modules.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full transition-colors ${
              filter === m
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {m === 'all' ? 'All' : m}
          </button>
        ))}
      </div>

      {/* Endpoint list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {filtered.map((ep, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors group"
          >
            <StatusDot status={ep.status} />
            <MethodBadge method={ep.method} />
            <code className="text-[11px] font-mono text-foreground flex-shrink-0">{ep.path}</code>
            <span className="text-[10px] text-muted-foreground flex-1 truncate">
              {ep.description}
            </span>
            {ep.avgLatency && (
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  ep.avgLatency < 300
                    ? 'bg-green-500/10 text-green-400'
                    : ep.avgLatency < 500
                      ? 'bg-amber-400/10 text-amber-400'
                      : 'bg-red-400/10 text-red-400'
                }`}
              >
                {ep.avgLatency}ms
              </span>
            )}
            {ep.lastCall && (
              <span className="text-[9px] font-mono text-muted-foreground">{ep.lastCall}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-2 rounded bg-secondary/20">
        <Server className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground">
          Base URL: <code className="text-foreground">https://www.zohoapis.eu/crm/v6</code>
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section: Webhook Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

function WebhookConfigPanel({ isAdmin }: { isAdmin: boolean }) {
  const [events, setEvents] = useState(WEBHOOK_EVENTS);
  const [expanded, setExpanded] = useState(false);

  function toggleEvent(eventName: string) {
    if (!isAdmin) return;
    setEvents((prev) =>
      prev.map((e) => (e.event === eventName ? { ...e, enabled: !e.enabled } : e))
    );
  }

  const enabledCount = events.filter((e) => e.enabled).length;
  const webhookUrl = `${window.location.origin}/api/webhooks/zoho-crm`;

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <Webhook className="w-4 h-4 text-primary" />
          Webhook Configuration
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          {enabledCount}/{events.length} enabled
        </span>
      </div>

      {/* Webhook endpoint */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border/30 bg-muted/5">
        <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-muted-foreground mb-0.5">Webhook Endpoint URL</div>
          <code className="text-[11px] font-mono text-foreground truncate block">{webhookUrl}</code>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(webhookUrl)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
          title="Copy URL"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Security settings */}
      <div className="rounded-lg border border-border/30 overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground flex-1">
            Security & Rate Limiting
          </span>
        </button>
        {expanded && (
          <div className="border-t border-border/20 p-4 space-y-2 animate-fade-in bg-muted/5">
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-foreground">Shared secret verification</span>
              <span className="text-[10px] font-mono text-grade-a">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-foreground">Replay protection</span>
              <span className="text-[10px] font-mono text-foreground">5 minute window</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-foreground">Rate limit</span>
              <span className="text-[10px] font-mono text-foreground">100 events/minute</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-foreground">Auto-rescore on deal update</span>
              <span className="text-[10px] font-mono text-grade-a">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-foreground">Rescore stages</span>
              <span className="text-[10px] font-mono text-foreground">
                Discovery, Qualification, Proposal, Negotiation
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Event subscriptions */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          Event Subscriptions
        </div>
        {events.map((evt) => (
          <div
            key={evt.event}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <StatusDot status={evt.enabled ? 'active' : 'disabled'} />
              <code className="text-[11px] font-mono text-foreground">{evt.event}</code>
              <span className="text-[10px] text-muted-foreground truncate">{evt.description}</span>
            </div>
            <div className="flex items-center gap-2">
              {evt.rescoring && evt.enabled && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  PQS RESCORE
                </span>
              )}
              <button
                onClick={() => toggleEvent(evt.event)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                  evt.enabled ? 'bg-primary' : 'bg-muted'
                } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                disabled={!isAdmin}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    evt.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section: Field Mapping
   ═══════════════════════════════════════════════════════════════════════════ */

function FieldMappingPanel() {
  const [showCustomOnly, setShowCustomOnly] = useState(false);
  const filtered = showCustomOnly ? FIELD_MAPPINGS.filter((f) => f.custom) : FIELD_MAPPINGS;

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <FileJson className="w-4 h-4 text-primary" />
          Field Mapping
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomOnly(!showCustomOnly)}
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full transition-colors ${
              showCustomOnly
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            Custom fields only
          </button>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
            {FIELD_MAPPINGS.length} mapped · {FIELD_MAPPINGS.filter((f) => f.custom).length} custom
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2.5 py-1.5 px-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold border-b border-border/20">
        <span className="w-[180px]">Zoho CRM Field</span>
        <span className="w-[60px] text-center">Direction</span>
        <span className="w-[140px]">RevOS Field</span>
        <span className="w-[70px]">Type</span>
        <span className="flex-1 text-right">Source</span>
      </div>

      {/* Field rows */}
      <div className="space-y-0.5 max-h-[350px] overflow-y-auto">
        {filtered.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 py-1.5 px-3 rounded hover:bg-muted/20 transition-colors"
          >
            <code className="text-[11px] font-mono text-foreground w-[180px] truncate">
              {f.zohoField}
            </code>
            <span className="w-[60px] flex justify-center">
              <DirectionBadge direction={f.direction} />
            </span>
            <code className="text-[11px] font-mono text-primary w-[140px] truncate">
              {f.revosField}
            </code>
            <span className="text-[10px] text-muted-foreground w-[70px]">{f.type}</span>
            <span className="flex-1 text-right">
              {f.custom ? (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400">
                  CUSTOM
                </span>
              ) : (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground">
                  STANDARD
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section: Sync Schedule
   ═══════════════════════════════════════════════════════════════════════════ */

function SyncSchedulePanel() {
  const entries = Object.entries(SYNC_SCHEDULE) as [string, (typeof SYNC_SCHEDULE)['fullSync']][];
  const labels: Record<string, { label: string; icon: React.ElementType }> = {
    fullSync: { label: 'Full Sync', icon: Database },
    incrementalSync: { label: 'Incremental Sync', icon: RefreshCw },
    pqsWriteBack: { label: 'PQS Write-Back', icon: ArrowUpDown },
    webhookIngestion: { label: 'Webhook Ingestion', icon: Zap },
  };

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="metric-label flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Sync Schedule
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([key, val]) => {
          const cfg = labels[key] || { label: key, icon: Activity };
          const Icon = cfg.icon;
          return (
            <div key={key} className="rounded-lg border border-border/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{cfg.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    Every {val.interval}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-[9px] text-muted-foreground">Last Run</div>
                  <div className="text-[11px] font-mono text-foreground">{val.lastRun}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-muted-foreground">Next Run</div>
                  <div className="text-[11px] font-mono text-foreground">{val.nextRun}</div>
                </div>
                <div className="text-center">
                  <div className="text-[9px] text-muted-foreground">Records</div>
                  <div className="text-[11px] font-mono text-foreground">
                    {val.records.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ZohoAdmin() {
  const { role } = useRole();
  const { status: crmStatus } = useCRM();
  const isAdmin = role === 'exec' || role === 'revops' || role === 'admin';

  // Block rep/manager from seeing CRM internals
  if (role === 'rep' || role === 'manager') {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="glass-card p-8 text-center animate-fade-in">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Zoho CRM Configuration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            CRM API configuration is managed by Revenue Operations.
          </p>
        </div>
      </div>
    );
  }
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState<ConnectionHealth>({
    status: 'unconfigured',
    latency: 0,
    lastCheck: null,
    tokenExpiry: '—',
    org: '',
    user: '',
    dataCenter: 'EU (zohoapis.eu)',
    apiVersion: 'v6',
    rateLimit: { used: 0, limit: 5000, resetIn: '—' },
  });

  // Run connection test
  const runTest = useCallback(async () => {
    setTesting(true);
    const start = Date.now();
    try {
      const result = await testConnection();
      const latency = Date.now() - start;
      setHealth((prev) => ({
        ...prev,
        status: result.ok ? 'healthy' : 'down',
        latency,
        lastCheck: new Date(),
        org: result.org || 'Evercam Ltd',
        user: result.user || 'Unknown',
        rateLimit: { used: 142, limit: 5000, resetIn: '47m' },
      }));
    } catch {
      setHealth((prev) => ({
        ...prev,
        status: 'down',
        latency: Date.now() - start,
        lastCheck: new Date(),
      }));
    } finally {
      setTesting(false);
    }
  }, []);

  // Auto-test on mount
  useEffect(() => {
    runTest();
  }, [runTest]);

  // Update health when CRM status changes
  useEffect(() => {
    if (crmStatus.connected) {
      setHealth((prev) => ({
        ...prev,
        status: 'healthy',
        org: prev.org || 'Evercam Ltd',
        user: prev.user || 'Gavin Daly',
      }));
    }
  }, [crmStatus.connected]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
          <Plug className="w-6 h-6 text-primary" />
          Zoho CRM API Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          OAuth configuration, API endpoints, webhooks, field mapping & sync schedule
        </p>
      </div>

      {!isAdmin && (
        <div className="glass-card p-5 flex items-center gap-3 animate-fade-in">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium text-foreground">Admin access required</div>
            <div className="text-xs text-muted-foreground">
              Switch to Executive or RevOps role to modify API settings. Read-only view available.
            </div>
          </div>
        </div>
      )}

      <ConnectionHealthPanel health={health} onTest={runTest} testing={testing} />
      <OAuthConfigPanel isAdmin={isAdmin} />
      <APIEndpointsPanel />
      <SyncSchedulePanel />
      <WebhookConfigPanel isAdmin={isAdmin} />
      <FieldMappingPanel />
    </div>
  );
}
