import {
  BarChart3,
  Target,
  Users,
  AlertTriangle,
  Zap,
  Settings,
  TrendingUp,
  Activity,
  Shield,
  Eye,
  Webhook,
  Calendar,
  Plug,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useRole, type Role } from '@/contexts/RoleContext';
import { useCRM } from '@/contexts/CRMContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

// ---------------------------------------------------------------------------
// Icon registry — maps string names to lucide-react components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart3,
  Target,
  Users,
  AlertTriangle,
  Zap,
  Settings,
  TrendingUp,
  Activity,
  Shield,
  Eye,
  Webhook,
  Calendar,
  Plug,
};

// ---------------------------------------------------------------------------
// Per-role navigation — grouped sections for each persona
//
// Design rationale:
//   Rep:     Clean & focused — own deals, coaching, meeting prep. No noise.
//   Manager: Team oversight — pipeline, coaching queue, risk, 1:1 prep.
//   Exec:    Strategic lens — forecasting, risk clusters, QBR prep, governance.
//   RevOps:  Operations — data quality, model health, integrations, config.
//   Admin:   Full system access — everything RevOps has + user management.
// ---------------------------------------------------------------------------

interface NavItem {
  id: string;
  title: string;
  url: string;
  icon: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_STRUCTURE: Record<Role, NavSection[]> = {
  rep: [
    {
      label: 'My Work',
      items: [
        { id: 'home', title: 'Dashboard', url: '/', icon: 'BarChart3' },
        { id: 'my-deals', title: 'My Deals', url: '/deals', icon: 'TrendingUp' },
        { id: 'meeting-prep', title: 'Meeting Prep', url: '/meeting-prep', icon: 'Calendar' },
      ],
    },
    {
      label: 'AI Coaching',
      items: [{ id: 'coaching', title: 'Coaching', url: '/coaching', icon: 'Zap' }],
    },
  ],

  manager: [
    {
      label: 'Overview',
      items: [
        { id: 'home', title: 'Command Center', url: '/', icon: 'BarChart3' },
        { id: 'pipeline', title: 'Pipeline', url: '/pipeline', icon: 'Target' },
        { id: 'deals', title: 'Deals', url: '/deals', icon: 'TrendingUp' },
      ],
    },
    {
      label: 'Team',
      items: [
        { id: 'team', title: 'Team Performance', url: '/team', icon: 'Users' },
        { id: 'coaching', title: 'Coaching Queue', url: '/coaching', icon: 'Zap' },
        { id: 'risk', title: 'Risk Monitor', url: '/risk', icon: 'AlertTriangle' },
      ],
    },
    {
      label: 'Prepare',
      items: [
        { id: 'meeting-prep', title: 'Meeting Prep', url: '/meeting-prep', icon: 'Calendar' },
      ],
    },
  ],

  exec: [
    {
      label: 'Strategic',
      items: [
        { id: 'home', title: 'Executive Summary', url: '/', icon: 'BarChart3' },
        { id: 'pipeline', title: 'Pipeline', url: '/pipeline', icon: 'Target' },
        { id: 'deals', title: 'Deals', url: '/deals', icon: 'TrendingUp' },
      ],
    },
    {
      label: 'Analysis',
      items: [
        { id: 'team', title: 'Team Performance', url: '/team', icon: 'Users' },
        { id: 'risk', title: 'Risk Clusters', url: '/risk', icon: 'AlertTriangle' },
        { id: 'meeting-prep', title: 'QBR & Meetings', url: '/meeting-prep', icon: 'Calendar' },
      ],
    },
    {
      label: 'Governance',
      items: [
        { id: 'trust', title: 'AI Trust Center', url: '/trust', icon: 'Eye' },
        { id: 'settings', title: 'Settings', url: '/settings', icon: 'Settings' },
      ],
    },
  ],

  revops: [
    {
      label: 'Operations',
      items: [
        { id: 'home', title: 'Command Center', url: '/', icon: 'BarChart3' },
        { id: 'pipeline', title: 'Pipeline', url: '/pipeline', icon: 'Target' },
        { id: 'deals', title: 'Deals', url: '/deals', icon: 'TrendingUp' },
        { id: 'risk', title: 'Risk Monitor', url: '/risk', icon: 'AlertTriangle' },
      ],
    },
    {
      label: 'Data & Models',
      items: [
        { id: 'model', title: 'Model Health', url: '/model', icon: 'Activity' },
        { id: 'automations', title: 'Automations', url: '/automations', icon: 'Webhook' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { id: 'meeting-prep', title: 'Meeting Prep', url: '/meeting-prep', icon: 'Calendar' },
        { id: 'trust', title: 'AI Trust Center', url: '/trust', icon: 'Eye' },
        { id: 'zoho', title: 'Zoho CRM API', url: '/admin/zoho', icon: 'Plug' },
        { id: 'admin', title: 'Admin Console', url: '/admin', icon: 'Shield' },
        { id: 'settings', title: 'Settings', url: '/settings', icon: 'Settings' },
      ],
    },
  ],

  admin: [
    {
      label: 'Overview',
      items: [
        { id: 'home', title: 'Command Center', url: '/', icon: 'BarChart3' },
        { id: 'pipeline', title: 'Pipeline', url: '/pipeline', icon: 'Target' },
        { id: 'deals', title: 'All Deals', url: '/deals', icon: 'TrendingUp' },
      ],
    },
    {
      label: 'System',
      items: [
        { id: 'model', title: 'Model Health', url: '/model', icon: 'Activity' },
        { id: 'automations', title: 'Automations', url: '/automations', icon: 'Webhook' },
        { id: 'trust', title: 'AI Trust Center', url: '/trust', icon: 'Eye' },
        { id: 'zoho', title: 'Zoho CRM API', url: '/admin/zoho', icon: 'Plug' },
        { id: 'admin', title: 'Admin Console', url: '/admin', icon: 'Shield' },
        { id: 'settings', title: 'Settings', url: '/settings', icon: 'Settings' },
      ],
    },
  ],
};

export function AppSidebar() {
  const { role } = useRole();
  const { status } = useCRM();
  const sections = NAV_STRUCTURE[role] || NAV_STRUCTURE.revops;

  return (
    <Sidebar className="border-r border-border/40">
      <div className="p-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm relative">
            <Activity className="w-4 h-4 text-primary-foreground" />
            {status.connected && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-foreground tracking-tight">RevOS</div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider flex items-center gap-1.5">
              {status.connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> ZOHO
                  CONNECTED
                </>
              ) : (
                'DEMO MODE'
              )}
            </div>
          </div>
        </div>
      </div>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70 font-semibold px-3">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = ICON_MAP[item.icon] || BarChart3;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/'}
                          className="hover:bg-accent/80 transition-all duration-150 rounded-lg mx-1"
                          activeClassName="bg-primary/10 text-primary font-semibold"
                        >
                          <Icon className="mr-2.5 h-4 w-4" />
                          <span className="text-[13px]">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
