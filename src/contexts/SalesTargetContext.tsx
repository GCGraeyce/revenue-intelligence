import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { DEFAULT_REP_TARGETS } from '@/data/demo-data';

interface SalesTargetContextType {
  targets: Record<string, number>;
  setTarget: (rep: string, amount: number) => void;
  resetToDefaults: () => void;
}

const SalesTargetContext = createContext<SalesTargetContextType | null>(null);

export function SalesTargetProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState<Record<string, number>>({ ...DEFAULT_REP_TARGETS });

  const setTarget = useCallback((rep: string, amount: number) => {
    setTargets((prev) => ({ ...prev, [rep]: amount }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setTargets({ ...DEFAULT_REP_TARGETS });
  }, []);

  const value = useMemo(
    () => ({ targets, setTarget, resetToDefaults }),
    [targets, setTarget, resetToDefaults]
  );

  return <SalesTargetContext.Provider value={value}>{children}</SalesTargetContext.Provider>;
}

export function useSalesTargets() {
  const ctx = useContext(SalesTargetContext);
  if (!ctx) throw new Error('useSalesTargets must be used within SalesTargetProvider');
  return ctx;
}
