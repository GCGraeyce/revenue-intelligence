import { useState } from 'react';
import { SALES_MANAGERS } from '@/data/demo-data';
import { useSalesTargets } from '@/contexts/SalesTargetContext';
import { useRole } from '@/contexts/RoleContext';
import { Target, RotateCcw, Lock } from 'lucide-react';
import { fmt } from '@/lib/utils';

export function SalesTargetEditor() {
  const { role } = useRole();
  const { targets, setTarget, resetToDefaults } = useSalesTargets();
  const [editingRep, setEditingRep] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const isExec = role === 'exec';
  const totalTarget = Object.values(targets).reduce((s, v) => s + v, 0);

  function startEdit(rep: string) {
    if (!isExec) return;
    setEditingRep(rep);
    setEditValue(String(Math.round(targets[rep] / 1000)));
  }

  function commitEdit() {
    if (editingRep && editValue) {
      const amount = parseFloat(editValue) * 1000;
      if (!isNaN(amount) && amount > 0) {
        setTarget(editingRep, amount);
      }
    }
    setEditingRep(null);
  }

  return (
    <div className="glass-card p-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="metric-label flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <Target className="w-3 h-3 text-primary" />
          </div>
          Annual Sales Targets
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-mono font-bold text-foreground">{fmt(totalTarget)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">org total</div>
          </div>
          {isExec && (
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground px-2.5 py-1.5 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {!isExec && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
          <Lock className="w-3 h-3" />
          Only executives can modify sales targets. Switch to Exec role to edit.
        </div>
      )}

      <div className="space-y-1">
        {SALES_MANAGERS.map((mgr) => {
          const mgrTarget = mgr.team.reduce((s, rep) => s + (targets[rep] || 0), 0);
          return (
            <div key={mgr.id}>
              {/* Manager header */}
              <div className="flex items-center justify-between py-2 px-1">
                <span className="text-xs font-semibold text-foreground">{mgr.name}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {fmt(mgrTarget)} team total
                </span>
              </div>
              {/* Rep rows */}
              {mgr.team.map((rep) => (
                <div
                  key={rep}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors border-b border-border/10 last:border-0"
                >
                  <span className="text-sm text-foreground">{rep}</span>
                  {editingRep === rep ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">€</span>
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                        className="w-20 bg-secondary border border-primary/30 rounded px-2 py-1 text-sm font-mono text-foreground text-right focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-muted-foreground">K</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(rep)}
                      className={`text-sm font-mono font-semibold ${
                        isExec
                          ? 'text-foreground hover:text-primary cursor-pointer'
                          : 'text-muted-foreground cursor-default'
                      }`}
                    >
                      {fmt(targets[rep] || 0)}
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
