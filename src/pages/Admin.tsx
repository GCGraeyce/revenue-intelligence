import { useState } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useCRM } from '@/contexts/CRMContext';
import { SalesTargetEditor } from '@/components/SalesTargetEditor';
import { ScoringConfig } from '@/components/ScoringConfig';
import {
  Shield, Database, Users, Link2, CheckCircle, XCircle,
  RefreshCw, Settings, ChevronDown, ChevronRight,
  Lock, Bell, ArrowUpDown, Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

interface CRMConnection {
  id: string;
  name: string;
  logo: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  recordCount?: number;
  fields: string[];
  syncFrequency: string;
}

const CRM_CONNECTIONS: CRMConnection[] = [
  { id: 'zoho', name: 'Zoho CRM', logo: 'Z', status: 'connected', lastSync: '2 minutes ago', recordCount: 14283, fields: ['Deals', 'Contacts', 'Accounts', 'Activities', 'Notes', 'Products'], syncFrequency: 'Every 15 minutes' },
  { id: 'hubspot', name: 'HubSpot', logo: 'H', status: 'disconnected', fields: ['Deals', 'Contacts', 'Companies', 'Engagements', 'Tickets'], syncFrequency: 'Not configured' },
  { id: 'salesforce', name: 'Salesforce', logo: 'SF', status: 'disconnected', fields: ['Opportunities', 'Contacts', 'Accounts', 'Tasks', 'Events'], syncFrequency: 'Not configured' },
  { id: 'pipedrive', name: 'Pipedrive', logo: 'P', status: 'disconnected', fields: ['Deals', 'Persons', 'Organizations', 'Activities'], syncFrequency: 'Not configured' },
];

interface AccessRole {
  role: string;
  label: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const ACCESS_ROLES: AccessRole[] = [
  { role: 'exec', label: 'Executive', description: 'Full org-wide visibility. Configure targets, all teams, forecast and QBR data.', permissions: ['View all pipeline data', 'Configure sales targets', 'Access forecast band', 'View team performance', 'Access QBR reports', 'Manage user roles'], userCount: 2 },
  { role: 'manager', label: 'Sales Manager', description: 'Team-level access. Coaching, pipeline reviews, 1:1s, and forecast management.', permissions: ['View team pipeline', 'Coaching engine access', 'Approve/reject AI actions', 'Team performance metrics', 'Pipeline review tools', 'Forecast submission'], userCount: 3 },
  { role: 'rep', label: 'Sales Rep', description: 'Own deals only. View pipeline, receive coaching, update deal information.', permissions: ['View own deals', 'Receive coaching suggestions', 'Update deal data', 'View own performance', 'Access playbook prompts'], userCount: 10 },
  { role: 'revops', label: 'Revenue Operations', description: 'System health, model calibration, pipeline analytics, CRM integration.', permissions: ['Model health dashboard', 'PQS weight configuration', 'Alert threshold management', 'CRM sync management', 'Data quality monitoring', 'Pipeline analytics'], userCount: 1 },
];

interface IntegrationSetting {
  name: string;
  description: string;
  enabled: boolean;
  category: 'sync' | 'ai' | 'notification' | 'security';
}

const DEFAULT_SETTINGS: IntegrationSetting[] = [
  { name: 'Real-time CRM Sync', description: 'Push deal updates to CRM immediately after AI actions', enabled: true, category: 'sync' },
  { name: 'Bi-directional Sync', description: 'Pull CRM changes back into RevOS on each refresh', enabled: true, category: 'sync' },
  { name: 'Activity Tracking', description: 'Log emails, calls, and meetings from CRM into deal timeline', enabled: true, category: 'sync' },
  { name: 'Agentic Auto-Actions', description: 'Allow AI to execute coaching plays without human approval', enabled: false, category: 'ai' },
  { name: 'AI Deal Scoring', description: 'Automatically compute PQS for new deals on CRM import', enabled: true, category: 'ai' },
  { name: 'Persona Detection', description: 'Auto-detect buyer personas from CRM contact roles', enabled: true, category: 'ai' },
  { name: 'Self-Learning Mode', description: 'Retrain scoring model quarterly from closed deal outcomes', enabled: true, category: 'ai' },
  { name: 'Slack Notifications', description: 'Send coaching alerts and deal updates to Slack channels', enabled: false, category: 'notification' },
  { name: 'Email Digests', description: 'Weekly pipeline health email to managers and executives', enabled: true, category: 'notification' },
  { name: 'Alert Escalation', description: 'Escalate critical deal risks to manager if rep doesn\'t act within 48h', enabled: true, category: 'notification' },
  { name: 'SSO / SAML', description: 'Single sign-on via corporate identity provider', enabled: false, category: 'security' },
  { name: 'Audit Logging', description: 'Log all user actions and AI decisions for compliance', enabled: true, category: 'security' },
  { name: 'Data Encryption at Rest', description: 'AES-256 encryption for all stored pipeline data', enabled: true, category: 'security' },
  { name: 'IP Whitelisting', description: 'Restrict dashboard access to approved IP ranges', enabled: false, category: 'security' },
];

const STATUS_COLORS = {
  connected: 'text-grade-a bg-[hsl(var(--grade-a)/.1)]',
  disconnected: 'text-muted-foreground bg-muted/50',
  syncing: 'text-primary bg-primary/10',
  error: 'text-grade-f bg-[hsl(var(--grade-f)/.1)]',
};

const STATUS_ICONS = {
  connected: CheckCircle,
  disconnected: XCircle,
  syncing: RefreshCw,
  error: XCircle,
};

const CATEGORY_ICONS = {
  sync: Database,
  ai: Settings,
  notification: Bell,
  security: Shield,
};

const CATEGORY_LABELS = {
  sync: 'Data Sync',
  ai: 'AI & Automation',
  notification: 'Notifications',
  security: 'Security',
};

// ---------------------------------------------------------------------------
// Tab definitions per role
// ---------------------------------------------------------------------------

type AdminTab = 'overview' | 'crm' | 'access' | 'system' | 'scoring' | 'targets';

function getTabsForRole(role: string): { id: AdminTab; label: string; icon: typeof Link2 }[] {
  if (role === 'revops' || role === 'admin') {
    return [
      { id: 'overview', label: 'Overview', icon: Settings },
      { id: 'crm', label: 'CRM', icon: Link2 },
      { id: 'access', label: 'Access', icon: Shield },
      { id: 'system', label: 'System', icon: Database },
      { id: 'scoring', label: 'Scoring', icon: Settings },
      { id: 'targets', label: 'Targets', icon: Users },
    ];
  }
  if (role === 'exec') {
    return [
      { id: 'overview', label: 'Overview', icon: Settings },
      { id: 'crm', label: 'CRM Status', icon: Link2 },
      { id: 'access', label: 'Access', icon: Shield },
      { id: 'targets', label: 'Targets', icon: Users },
    ];
  }
  if (role === 'manager') {
    return [
      { id: 'overview', label: 'Overview', icon: Settings },
      { id: 'targets', label: 'Targets', icon: Users },
    ];
  }
  // rep / default
  return [];
}

// ---------------------------------------------------------------------------
// Overview Tab — shows key system status at a glance
// ---------------------------------------------------------------------------

function OverviewTab({ role: userRole }: { role: string }) {
  const { status: crmStatus } = useCRM();
  const connectedCount = CRM_CONNECTIONS.filter(c => c.status === 'connected').length;
  const totalUsers = ACCESS_ROLES.reduce((s, a) => s + a.userCount, 0);
  const enabledFeatures = DEFAULT_SETTINGS.filter(s => s.enabled).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-mono font-bold text-grade-a">{connectedCount}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">CRM Connected</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-mono font-bold text-primary">{totalUsers}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Active Users</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-mono font-bold text-foreground">{enabledFeatures}/{DEFAULT_SETTINGS.length}</div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">Features On</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className={`text-2xl font-mono font-bold ${crmStatus.syncInProgress ? 'text-amber-400' : 'text-grade-a'}`}>
            {crmStatus.syncInProgress ? 'Syncing' : 'Healthy'}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">System Status</div>
        </div>
      </div>

      {/* Quick CRM Status */}
      <div className="glass-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5" /> Active Integrations
        </div>
        <div className="space-y-2">
          {CRM_CONNECTIONS.filter(c => c.status === 'connected').map(crm => {
            const StatusIcon = STATUS_ICONS[crm.status];
            return (
              <div key={crm.id} className="flex items-center gap-3 py-2">
                <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{crm.logo}</div>
                <div className="flex-1">
                  <span className="text-sm text-foreground">{crm.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono ml-2">Last sync: {crm.lastSync}</span>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[crm.status]}`}>
                  <StatusIcon className="w-3 h-3" /> {crm.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role summary */}
      <div className="glass-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> User Roles
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ACCESS_ROLES.map(ar => (
            <div key={ar.role} className={`rounded-lg border p-3 text-center ${ar.role === userRole ? 'border-primary/30 bg-primary/5' : 'border-border/30'}`}>
              <div className="text-lg font-mono font-bold text-foreground">{ar.userCount}</div>
              <div className="text-[10px] text-muted-foreground">{ar.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CRM Tab
// ---------------------------------------------------------------------------

function CRMTab() {
  const { status: crmStatus, syncNow, batchSync, events } = useCRM();
  const [expandedCRM, setExpandedCRM] = useState<string | null>('zoho');
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState<{ success: number; failed: number } | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card p-5 space-y-3">
        <div className="metric-label flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          CRM Connections
        </div>
        {CRM_CONNECTIONS.map(crm => {
          const StatusIcon = STATUS_ICONS[crm.status];
          const isExpanded = expandedCRM === crm.id;
          return (
            <div key={crm.id} className="rounded-lg border border-border/30 overflow-hidden">
              <button
                onClick={() => setExpandedCRM(isExpanded ? null : crm.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{crm.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{crm.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {crm.lastSync ? `Last sync: ${crm.lastSync}` : 'Not connected'}
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_COLORS[crm.status]}`}>
                  <StatusIcon className={`w-3 h-3 ${crm.status === 'syncing' ? 'animate-spin' : ''}`} />
                  {crm.status}
                </span>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="border-t border-border/20 p-4 space-y-3 animate-fade-in bg-muted/5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                      <div className="text-sm font-mono font-bold text-foreground">{crm.recordCount?.toLocaleString() || '—'}</div>
                      <div className="text-[9px] text-muted-foreground">records synced</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                      <div className="text-sm font-mono font-bold text-foreground">{crm.fields.length}</div>
                      <div className="text-[9px] text-muted-foreground">objects mapped</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                      <div className="text-sm font-mono font-bold text-foreground">{crm.syncFrequency}</div>
                      <div className="text-[9px] text-muted-foreground">sync frequency</div>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2.5 text-center">
                      <div className={`text-sm font-mono font-bold ${crm.status === 'connected' ? 'text-grade-a' : 'text-muted-foreground'}`}>
                        {crm.status === 'connected' ? 'Active' : 'Inactive'}
                      </div>
                      <div className="text-[9px] text-muted-foreground">status</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Mapped Objects</div>
                    <div className="flex flex-wrap gap-1.5">
                      {crm.fields.map(f => (
                        <span key={f} className="text-[10px] px-2 py-1 rounded bg-secondary/50 text-foreground flex items-center gap-1">
                          <Database className="w-2.5 h-2.5 text-muted-foreground" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {crm.status === 'connected' ? (
                      <>
                        <button onClick={syncNow} disabled={crmStatus.syncInProgress} className="flex items-center gap-1.5 text-[10px] font-mono text-primary px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-40">
                          <RefreshCw className={`w-3 h-3 ${crmStatus.syncInProgress ? 'animate-spin' : ''}`} /> Sync Now
                        </button>
                        <button
                          onClick={async () => { setBatchRunning(true); const result = await batchSync(); setBatchResult(result); setBatchRunning(false); }}
                          disabled={batchRunning}
                          className="flex items-center gap-1.5 text-[10px] font-mono text-primary px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-40"
                        >
                          {batchRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpDown className="w-3 h-3" />}
                          {batchRunning ? 'Writing PQS...' : 'Batch PQS Write-Back'}
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-3 py-1.5 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
                          <Settings className="w-3 h-3" /> Configure Mapping
                        </button>
                        <button className="flex items-center gap-1.5 text-[10px] font-mono text-grade-d px-3 py-1.5 rounded-lg border border-[hsl(var(--grade-d)/.3)] hover:bg-[hsl(var(--grade-d)/.05)] transition-colors ml-auto">
                          <XCircle className="w-3 h-3" /> Disconnect
                        </button>
                      </>
                    ) : (
                      <button className="flex items-center gap-1.5 text-[10px] font-mono text-primary-foreground px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors shadow-sm">
                        <Link2 className="w-3 h-3" /> Connect {crm.name}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Sync Log */}
      {events.length > 0 && (
        <div className="glass-card p-5 space-y-3">
          <div className="metric-label flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary" />
            Live Sync Event Log
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-1">{events.length} events</span>
            {batchResult && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 ml-1">
                Last batch: {batchResult.success} OK / {batchResult.failed} failed
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {events.slice(0, 20).map(evt => (
              <div key={evt.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded bg-secondary/30">
                {evt.success ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" /> : <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{evt.type}</span>
                <span className="text-foreground flex-1 truncate">{evt.message}</span>
                <span className="text-[9px] font-mono text-muted-foreground flex-shrink-0">{evt.timestamp.toLocaleTimeString().slice(0, 5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Access Control Tab
// ---------------------------------------------------------------------------

function AccessTab({ currentRole }: { currentRole: string }) {
  return (
    <div className="glass-card p-5 animate-fade-in space-y-4">
      <div className="metric-label flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Role-Based Access Control
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ACCESS_ROLES.map(ar => (
          <div key={ar.role} className="rounded-lg border border-border/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{ar.label}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{ar.userCount} users</div>
                </div>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${ar.role === currentRole ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground'}`}>
                {ar.role === currentRole ? 'Current' : ar.role}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{ar.description}</p>
            <div className="flex flex-wrap gap-1">
              {ar.permissions.map(p => (
                <span key={p} className="text-[8px] px-1.5 py-0.5 rounded bg-secondary/50 text-muted-foreground flex items-center gap-0.5">
                  <CheckCircle className="w-2 h-2 text-grade-a" /> {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// System Settings Tab
// ---------------------------------------------------------------------------

function SystemTab({ canEdit }: { canEdit: boolean }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  function toggleSetting(name: string) {
    if (!canEdit) return;
    setSettings(prev => prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s));
  }

  return (
    <div className="glass-card p-5 animate-fade-in space-y-4">
      <div className="metric-label flex items-center gap-2">
        <Settings className="w-4 h-4 text-primary" />
        System Settings
        {!canEdit && <span className="text-[9px] font-mono text-muted-foreground ml-auto">Read-only</span>}
      </div>
      {(['sync', 'ai', 'notification', 'security'] as const).map(category => {
        const CategoryIcon = CATEGORY_ICONS[category];
        const categorySettings = settings.filter(s => s.category === category);
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CategoryIcon className="w-3.5 h-3.5 text-muted-foreground" />
              {CATEGORY_LABELS[category]}
            </div>
            {categorySettings.map(setting => (
              <div key={setting.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors border-b border-border/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{setting.name}</div>
                  <div className="text-[10px] text-muted-foreground">{setting.description}</div>
                </div>
                <button
                  onClick={() => toggleSetting(setting.name)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ml-4 ${
                    setting.enabled ? 'bg-primary' : 'bg-muted'
                  } ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={!canEdit}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${setting.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------

export default function Admin() {
  const { role } = useRole();

  const tabs = getTabsForRole(role);
  const [activeTab, setActiveTab] = useState<AdminTab>(tabs[0]?.id || 'overview');

  const isAdmin = role === 'exec' || role === 'revops' || role === 'admin';

  // Non-admin roles see a restricted view
  if (tabs.length === 0) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">System administration</p>
        </div>
        <div className="glass-card p-5 flex items-center gap-3 animate-fade-in">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium text-foreground">Admin access required</div>
            <div className="text-xs text-muted-foreground">Switch to Executive, RevOps, or Manager role to access system settings.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {role === 'revops' ? 'CRM connections, access control & system configuration' :
             role === 'exec' ? 'System overview, targets & access control' :
             'Team targets & configuration'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-secondary/50 rounded-lg p-0.5 overflow-x-auto">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab role={role} />}
      {activeTab === 'crm' && <CRMTab />}
      {activeTab === 'access' && <AccessTab currentRole={role} />}
      {activeTab === 'system' && <SystemTab canEdit={isAdmin} />}
      {activeTab === 'scoring' && <ScoringConfig />}
      {activeTab === 'targets' && <SalesTargetEditor />}
    </div>
  );
}
