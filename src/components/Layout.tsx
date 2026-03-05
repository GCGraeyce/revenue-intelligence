import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RoleToggle } from '@/components/RoleToggle';
import { CRMStatusIndicator } from '@/components/CRMStatusIndicator';
import { AICopilot } from '@/components/AICopilot';
import { GlobalSearch } from '@/components/GlobalSearch';
import { NotificationPanel } from '@/components/NotificationPanel';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-colors text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/60 flex items-center justify-between px-5 bg-card/80 backdrop-blur-md sticky top-0 z-30 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border/60" />
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-[0.1em] font-medium">
                Revenue Intelligence OS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GlobalSearch />
              <CRMStatusIndicator />
              <NotificationPanel />
              <ThemeToggle />
              <RoleToggle />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
        <AICopilot />
      </div>
    </SidebarProvider>
  );
}
