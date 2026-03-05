import { useMemo } from 'react';
import { pipelineDeals, SALES_MANAGERS } from '@/data/demo-data';
import { InterventionQueue } from '@/components/InterventionQueue';
import { PlayLibrary } from '@/components/PlayLibrary';
import { AgenticPanel } from '@/components/AgenticPanel';
import { ExecutableCoachingPlays } from '@/components/ExecutableCoachingPlays';
import { useRole } from '@/contexts/RoleContext';
import { Term } from '@/components/Glossary';
import { Zap, Brain, HandMetal } from 'lucide-react';

export default function Coaching() {
  const { role, currentRep, coachingMode } = useRole();

  // Scope deals by role:
  // - rep: own deals only
  // - manager: only deals for reps on their team
  // - exec/revops/admin: all deals
  const deals = useMemo(() => {
    if (role === 'rep') {
      return pipelineDeals.filter((d) => d.rep === currentRep);
    }
    if (role === 'manager') {
      const manager = SALES_MANAGERS.find((m) => m.team.includes(currentRep));
      if (manager) {
        const teamSet = new Set(manager.team);
        return pipelineDeals.filter((d) => teamSet.has(d.rep));
      }
    }
    return pipelineDeals;
  }, [role, currentRep]);

  const managerName =
    role === 'manager' ? SALES_MANAGERS.find((m) => m.team.includes(currentRep))?.name : undefined;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in flex items-center gap-3">
        <Zap className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {role === 'rep'
              ? 'My Coaching'
              : role === 'manager' && managerName
                ? `Coaching — ${managerName}'s Team`
                : 'Coaching Engine'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono flex items-center gap-1.5">
            Mode:{' '}
            {coachingMode === 'hitl' ? (
              <>
                <HandMetal className="w-3 h-3" /> <Term term="HITL">Human-in-the-Loop</Term>
              </>
            ) : (
              <>
                <Brain className="w-3 h-3" /> <Term term="Agentic">Agentic</Term>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Executable Coaching Plays — step-by-step playbooks with progress tracking */}
      <ExecutableCoachingPlays scopedDeals={deals} />

      {/* Agentic panel — shown for all coaching users */}
      <AgenticPanel scopedDeals={deals} />

      {/* Intervention queue — reps see their own deals, managers see all */}
      <InterventionQueue deals={deals} />

      {/* Play Library — AI coaching prompts */}
      <PlayLibrary />
    </div>
  );
}
