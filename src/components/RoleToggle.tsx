import { useRole, Role } from '@/contexts/RoleContext';
import { User, Users, Crown, Wrench, ShieldCheck, Brain, HandMetal, Eye } from 'lucide-react';
const roles: { value: Role; label: string; icon: React.ElementType }[] = [
  { value: 'rep', label: 'Rep', icon: User },
  { value: 'manager', label: 'Manager', icon: Users },
  { value: 'exec', label: 'Exec', icon: Crown },
  { value: 'revops', label: 'RevOps', icon: Wrench },
  { value: 'admin', label: 'Admin', icon: ShieldCheck },
];
export function RoleToggle() {
  const { role, setRole, coachingMode, setCoachingMode, explainMode, setExplainMode } = useRole();
  return (
    <div className="flex items-center gap-3">
      {/* Explain toggle */}
      <button
        onClick={() => setExplainMode(!explainMode)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
          explainMode
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
      >
        <Eye className="w-3 h-3" />
        Score Breakdown
      </button>
      <div className="h-5 w-px bg-border/60" />
      {/* Coaching mode */}
      <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
        <button
          onClick={() => setCoachingMode('hitl')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
            coachingMode === 'hitl'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <HandMetal className="w-3 h-3" /> HITL
        </button>
        <button
          onClick={() => setCoachingMode('agentic')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
            coachingMode === 'agentic'
              ? 'bg-card text-foreground shadow-sm font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Brain className="w-3 h-3" /> Agentic
        </button>
      </div>
      <div className="h-5 w-px bg-border/60" />
      {/* Role selector */}
      <div className="flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5">
        {roles.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setRole(value)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${
              role === value
                ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
