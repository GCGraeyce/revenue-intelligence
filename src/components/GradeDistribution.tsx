import { Grade } from '@/data/demo-data';

interface Props {
  distribution: Record<Grade, number>;
  total: number;
  activeGrade?: Grade | null;
  onGradeClick?: (grade: Grade | null) => void;
}

const gradeColors: Record<Grade, string> = {
  A: 'bg-grade-a',
  B: 'bg-grade-b',
  C: 'bg-grade-c',
  D: 'bg-grade-d',
  F: 'bg-grade-f',
};

export function GradeDistribution({ distribution, total, activeGrade, onGradeClick }: Props) {
  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="metric-label">Pipeline Quality Distribution</div>
        {activeGrade && (
          <button
            onClick={() => onGradeClick?.(null)}
            className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/30 hover:border-border transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2 h-28 items-end">
        {(['A', 'B', 'C', 'D', 'F'] as Grade[]).map((grade) => {
          const count = distribution[grade];
          const pct = total > 0 ? (count / total) * 100 : 0;
          const isActive = activeGrade === grade;
          const isDimmed = activeGrade != null && !isActive;

          return (
            <button
              key={grade}
              onClick={() => onGradeClick?.(isActive ? null : grade)}
              className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${
                isDimmed ? 'opacity-30' : ''
              } ${isActive ? 'scale-105' : 'hover:scale-[1.02]'}`}
            >
              <span className="text-xs font-mono text-foreground font-semibold">{count}</span>
              <div
                className={`w-full rounded-lg ${gradeColors[grade]} transition-all duration-300 shadow-sm cursor-pointer ${
                  isActive
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                    : 'hover:opacity-100'
                }`}
                style={{ height: `${Math.max(8, pct)}%`, opacity: isDimmed ? 0.3 : 0.85 }}
              />
              <span className="text-[11px] font-mono font-bold text-muted-foreground">{grade}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
