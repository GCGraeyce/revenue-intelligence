import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
export type Role = 'rep' | 'manager' | 'exec' | 'revops' | 'admin';
export type CoachingMode = 'hitl' | 'agentic';

/** All available reps — matches REPS in demo-data.ts */
export const AVAILABLE_REPS = [
  'Conor Murphy',
  'Aoife Kelly',
  "James O'Sullivan",
  'Siobhan Walsh',
  'Cian Brennan',
  'Niamh Doyle',
  'Marco Rossi',
  'Emma Hughes',
  'Liam McCarthy',
  'Sophie Chen',
] as const;

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  /** The currently-selected rep name (used for rep-view filtering) */
  currentRep: string;
  setCurrentRep: (rep: string) => void;
  coachingMode: CoachingMode;
  setCoachingMode: (mode: CoachingMode) => void;
  explainMode: boolean;
  setExplainMode: (on: boolean) => void;
}
const RoleContext = createContext<RoleContextType | null>(null);
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('exec');
  const [currentRep, setCurrentRep] = useState('Conor Murphy');
  const [coachingMode, setCoachingMode] = useState<CoachingMode>('hitl');
  const [explainMode, setExplainMode] = useState(true);
  const value = useMemo(
    () => ({
      role,
      setRole,
      currentRep,
      setCurrentRep,
      coachingMode,
      setCoachingMode,
      explainMode,
      setExplainMode,
    }),
    [role, currentRep, coachingMode, explainMode]
  );
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
