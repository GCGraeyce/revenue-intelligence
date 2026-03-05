import { WebhookAutomation } from '@/components/WebhookAutomation';
import { useRole } from '@/contexts/RoleContext';
import { Webhook } from 'lucide-react';

export default function Automations() {
  const { role } = useRole();

  if (role === 'rep' || role === 'manager') {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <div className="glass-card p-8 text-center animate-fade-in">
          <Webhook className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Automations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Webhook and automation configuration is managed by Revenue Operations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in flex items-center gap-3">
        <Webhook className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            CRM webhook triggers · AI-powered actions · Real-time pipeline automation
          </p>
        </div>
      </div>
      <WebhookAutomation />
    </div>
  );
}
