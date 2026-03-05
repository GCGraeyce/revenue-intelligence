import { pipelineDeals, getPipelineSummary, SALES_MANAGERS } from '@/data/demo-data';
import { useMemo } from 'react';
import { DealTable } from '@/components/DealTable';
import { GradeDistribution } from '@/components/GradeDistribution';
import { SegmentBreakdown } from '@/components/SegmentBreakdown';
import { ForecastBand } from '@/components/ForecastBand';
import { ForecastView } from '@/components/ForecastView';
import { PipelineVelocity } from '@/components/PipelineVelocity';
import { ProductFilter } from '@/components/ProductFilter';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { useRole } from '@/contexts/RoleContext';
import { fmt } from '@/lib/utils';

export default function Pipeline() {
  const { role, currentRep } = useRole();
  const { filteredDeals, isFiltered } = useProductFilter();
  const allDeals = isFiltered ? filteredDeals : pipelineDeals;

  // Scope deals by role
  const deals = useMemo(() => {
    if (role === 'rep') return allDeals.filter((d) => d.rep === currentRep);
    if (role === 'manager') {
      const mgr = SALES_MANAGERS.find((m) => m.name === currentRep) || SALES_MANAGERS[0];
      return allDeals.filter((d) => mgr.team.includes(d.rep));
    }
    return allDeals;
  }, [allDeals, role, currentRep]);

  const summary = useMemo(() => getPipelineSummary(deals), [deals]);

  const title = role === 'rep' ? 'My Pipeline' : 'Pipeline';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          {summary.dealCount} active deals · {fmt(summary.totalACV)} pipeline value
        </p>
      </div>
      {role !== 'rep' && <ProductFilter />}

      {/* Forecast View — Commit/Best Case/Pipeline/Omit with bottom-up vs top-down */}
      {(role === 'exec' || role === 'manager' || role === 'revops') && <ForecastView />}

      {/* Pipeline Velocity — stage conversion rates and movement */}
      <PipelineVelocity />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ForecastBand
          raw={summary.totalACV}
          adjusted={summary.qualityAdjusted}
          low={summary.confidenceBand.low}
          high={summary.confidenceBand.high}
        />
        <GradeDistribution distribution={summary.gradeDistribution} total={summary.dealCount} />
      </div>
      {role !== 'rep' && <SegmentBreakdown data={summary.bySegment} />}
      <DealTable deals={deals} />
    </div>
  );
}
