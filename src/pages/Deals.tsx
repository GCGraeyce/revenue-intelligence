import { useMemo, useState, useCallback } from 'react';
import { pipelineDeals, SALES_MANAGERS, type Deal } from '@/data/demo-data';
import { DealTable } from '@/components/DealTable';
import { MetricCard } from '@/components/MetricCard';
import { ProductFilter } from '@/components/ProductFilter';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { useRole } from '@/contexts/RoleContext';
import { Target, AlertTriangle, Activity, X, Filter } from 'lucide-react';
import { fmt } from '@/lib/utils';

/** Active drill-down filter (simplified — riskOnly for now) */
interface DrillFilter {
  riskOnly?: boolean;
}

function hasActiveFilter(filter: DrillFilter): boolean {
  return !!filter.riskOnly;
}

export default function Deals() {
  const { role, currentRep } = useRole();
  const { filteredDeals, isFiltered } = useProductFilter();
  const allDeals = isFiltered ? filteredDeals : pipelineDeals;

  // Scope deals by role (same pattern as Pipeline.tsx / Risk.tsx)
  const deals = useMemo(() => {
    if (role === 'rep') return allDeals.filter((d) => d.rep === currentRep);
    if (role === 'manager') {
      const mgr = SALES_MANAGERS.find((m) => m.name === currentRep) || SALES_MANAGERS[0];
      return allDeals.filter((d) => mgr.team.includes(d.rep));
    }
    return allDeals;
  }, [allDeals, role, currentRep]);

  // Drill-down filter state
  const [drillFilter, setDrillFilter] = useState<DrillFilter>({});

  const toggleRiskFilter = useCallback(() => {
    setDrillFilter((prev) => ({ riskOnly: prev.riskOnly ? undefined : true }));
  }, []);

  const clearAllFilters = useCallback(() => setDrillFilter({}), []);

  // Apply drill-down filter
  const filteredByDrill = useMemo(() => {
    if (!hasActiveFilter(drillFilter)) return deals;
    let result: Deal[] = deals;
    if (drillFilter.riskOnly) result = result.filter((d) => d.pqScore < 40);
    return result;
  }, [deals, drillFilter]);

  // Role-aware title
  const title = role === 'rep' ? 'My Deals' : role === 'manager' ? 'Team Deals' : 'All Deals';

  // Computed metrics
  const totalACV = deals.reduce((s, d) => s + d.acv, 0);
  const weightedValue = deals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const avgPQS = deals.length
    ? Math.round(deals.reduce((s, d) => s + d.pqScore, 0) / deals.length)
    : 0;
  const atRiskCount = deals.filter((d) => d.pqScore < 40).length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            {deals.length} active deals · {fmt(totalACV)} pipeline value
          </p>
        </div>
      </div>

      {/* Product filter for non-rep roles */}
      {role !== 'rep' && <ProductFilter />}

      {/* Summary MetricCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Pipeline Value"
          value={fmt(totalACV)}
          subValue={`${deals.length} active deals`}
          icon={<Target className="w-4 h-4" />}
          variant="primary"
          sparklineValue={totalACV / 1000}
        />
        <MetricCard
          label="Weighted Value"
          value={fmt(weightedValue)}
          icon={<Activity className="w-4 h-4" />}
          variant="success"
          sparklineValue={weightedValue / 1000}
        />
        <MetricCard
          label="Avg PQS"
          value={avgPQS}
          variant={avgPQS >= 65 ? 'success' : avgPQS >= 50 ? 'warning' : 'danger'}
          sparklineValue={avgPQS}
        />
        <div className="cursor-pointer" onClick={toggleRiskFilter}>
          <MetricCard
            label="At Risk"
            value={atRiskCount}
            subValue={`PQS < 40`}
            icon={<AlertTriangle className="w-4 h-4" />}
            variant="danger"
            sparklineValue={atRiskCount}
          />
        </div>
      </div>

      {/* Active filter bar */}
      {drillFilter.riskOnly && (
        <div className="flex items-center gap-2 px-1 py-2 animate-fade-in">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono text-muted-foreground">
            Showing {filteredByDrill.length} of {deals.length} deals
          </span>
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            At Risk (PQS &lt; 40) <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Deal table */}
      <DealTable deals={filteredByDrill} />
    </div>
  );
}
