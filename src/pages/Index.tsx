import { useMemo, useState, useCallback } from 'react';
import { pipelineDeals, getPipelineSummary, getSaaSMetrics, type Grade, type Deal } from '@/data/demo-data';
import { useRole, type Role } from '@/contexts/RoleContext';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { OKRTracker } from '@/components/OKRTracker';
import { QuickActions } from '@/components/QuickActions';
import { MetricCard } from '@/components/MetricCard';
import { ForecastBand } from '@/components/ForecastBand';
import { GradeDistribution } from '@/components/GradeDistribution';
import { SegmentBreakdown } from '@/components/SegmentBreakdown';
import { DealTable } from '@/components/DealTable';
import { RiskClusters } from '@/components/RiskClusters';
import { InterventionQueue } from '@/components/InterventionQueue';
import { GeoProductView } from '@/components/GeoProductView';
import { UserNotepad } from '@/components/UserNotepad';
import { RepBenchmark } from '@/components/RepBenchmark';
import { DealStageValidator } from '@/components/DealStageValidator';
import { ICPProfiler } from '@/components/ICPProfiler';
import { ClosedDealAnalytics } from '@/components/ClosedDealAnalytics';
import { PipelineFunnel } from '@/components/PipelineFunnel';
import { RepDealBoard } from '@/components/RepDealBoard';
import { ProductFilterCompact } from '@/components/ProductFilter';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ActualVsPlanChart } from '@/components/ActualVsPlanChart';
import { RetentionMetrics } from '@/components/RetentionMetrics';
import { UnitEconomics } from '@/components/UnitEconomics';
import { Target, AlertTriangle, Activity, X, Filter, RefreshCw, Scale } from 'lucide-react';
import { fmt } from '@/lib/utils';

/** Active drill-down filters set by clicking dashboard components */
interface DrillFilter {
  stage?: string;
  grade?: Grade;
  segment?: string;
  riskOnly?: boolean;
}

function applyDrillFilter(deals: Deal[], filter: DrillFilter): Deal[] {
  let result = deals;
  if (filter.stage) result = result.filter((d) => d.stage === filter.stage);
  if (filter.grade) result = result.filter((d) => d.grade === filter.grade);
  if (filter.segment) result = result.filter((d) => d.segment === filter.segment);
  if (filter.riskOnly) result = result.filter((d) => d.pqScore < 40);
  return result;
}

function hasActiveFilter(filter: DrillFilter): boolean {
  return !!(filter.stage || filter.grade || filter.segment || filter.riskOnly);
}

/** Filter chip component shown when drill-down is active */
function FilterBar({
  filter,
  filteredCount,
  totalCount,
  onClear,
  onClearAll,
}: {
  filter: DrillFilter;
  filteredCount: number;
  totalCount: number;
  onClear: (key: keyof DrillFilter) => void;
  onClearAll: () => void;
}) {
  if (!hasActiveFilter(filter)) return null;

  const chips: { key: keyof DrillFilter; label: string }[] = [];
  if (filter.stage) chips.push({ key: 'stage', label: `Stage: ${filter.stage}` });
  if (filter.grade) chips.push({ key: 'grade', label: `Grade: ${filter.grade}` });
  if (filter.segment) chips.push({ key: 'segment', label: `Segment: ${filter.segment}` });
  if (filter.riskOnly) chips.push({ key: 'riskOnly', label: 'At Risk (PQS < 40)' });

  return (
    <div className="flex items-center gap-2 px-1 py-2 animate-fade-in">
      <Filter className="w-3.5 h-3.5 text-primary" />
      <span className="text-[10px] font-mono text-muted-foreground">
        Showing {filteredCount} of {totalCount} deals
      </span>
      <div className="flex items-center gap-1.5 flex-1">
        {chips.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onClear(chip.key)}
            className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            {chip.label}
            <X className="w-2.5 h-2.5" />
          </button>
        ))}
      </div>
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border/30 hover:border-border transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

const Index = () => {
  const { role, currentRep } = useRole();
  const { filteredDeals, isFiltered } = useProductFilter();
  const deals = isFiltered ? filteredDeals : pipelineDeals;
  const summary = useMemo(() => getPipelineSummary(deals), [deals]);
  const saasMetrics = useMemo(() => getSaaSMetrics(), []);
  const myDeals = useMemo(() => deals.filter((d) => d.rep === currentRep), [deals, currentRep]);

  // Drill-down filter state
  const [drillFilter, setDrillFilter] = useState<DrillFilter>({});

  const setFilterKey = useCallback(<K extends keyof DrillFilter>(key: K, value: DrillFilter[K]) => {
    setDrillFilter((prev) => ({ ...prev, [key]: value || undefined }));
  }, []);

  const clearFilterKey = useCallback((key: keyof DrillFilter) => {
    setDrillFilter((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => setDrillFilter({}), []);

  // Apply drill-down filters to get the deals shown in the table
  const drillFilteredDeals = useMemo(
    () => (hasActiveFilter(drillFilter) ? applyDrillFilter(deals, drillFilter) : deals),
    [deals, drillFilter]
  );

  const drillFilteredMyDeals = useMemo(
    () => (hasActiveFilter(drillFilter) ? applyDrillFilter(myDeals, drillFilter) : myDeals),
    [myDeals, drillFilter]
  );

  const titles: Record<Role, string> = {
    rep: 'My Dashboard',
    manager: 'Team Dashboard',
    exec: 'Revenue Command Center',
    revops: 'Operations Hub',
    admin: 'Admin Dashboard',
  };

  const subtitles: Record<Role, string> = {
    rep: `${myDeals.length} active deals · ${fmt(myDeals.reduce((s, d) => s + d.acv, 0))} pipeline value`,
    manager: `${fmt(summary.totalACV)} pipeline value · ${summary.dealCount} active deals · 3 teams`,
    exec: `${fmt(summary.totalACV)} pipeline value · ${summary.dealCount} active deals · Last updated 2m ago`,
    revops: `${fmt(summary.totalACV)} pipeline value · ${summary.dealCount} active deals · Model v2.4.1`,
    admin: `${fmt(summary.totalACV)} pipeline value · ${summary.dealCount} active deals · System Admin`,
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{titles[role]}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{subtitles[role]}</p>
        </div>
        <ProductFilterCompact />
      </div>

      {/* OKR Progress — every persona sees their OKRs */}
      <OKRTracker />

      {/* Quick Actions — "what should I do right now?" */}
      <QuickActions />

      {/* === REP VIEW === */}
      {role === 'rep' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="My Pipeline Value"
              value={fmt(myDeals.reduce((s, d) => s + d.acv, 0))}
              subValue={`${myDeals.length} active deals`}
              icon={<Target className="w-4 h-4" />}
              variant="primary"
              sparklineValue={myDeals.reduce((s, d) => s + d.acv, 0) / 1000}
            />
            <MetricCard
              label="Weighted Value"
              value={fmt(myDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0))}
              icon={<Activity className="w-4 h-4" />}
              variant="success"
              sparklineValue={myDeals.reduce((s, d) => s + d.acv * d.probabilities.win, 0) / 1000}
            />
            <MetricCard
              label="My Avg PQS"
              value={Math.round(
                myDeals.reduce((s, d) => s + d.pqScore, 0) / Math.max(myDeals.length, 1)
              )}
              variant="warning"
              sparklineValue={Math.round(
                myDeals.reduce((s, d) => s + d.pqScore, 0) / Math.max(myDeals.length, 1)
              )}
            />
            <div
              className="cursor-pointer"
              onClick={() => setFilterKey('riskOnly', drillFilter.riskOnly ? undefined : true)}
            >
              <MetricCard
                label="At Risk"
                value={myDeals.filter((d) => d.pqScore < 40).length}
                icon={<AlertTriangle className="w-4 h-4" />}
                variant="danger"
                sparklineValue={myDeals.filter((d) => d.pqScore < 40).length}
              />
            </div>
          </div>

          {/* Pipeline Funnel */}
          <PipelineFunnel
            deals={myDeals}
            activeStage={drillFilter.stage || null}
            onStageClick={(stage) => setFilterKey('stage', stage || undefined)}
          />

          {/* Performance Benchmark — front and center for rep self-awareness */}
          <RepBenchmark />

          {/* Priority deal board — grouped by urgency */}
          <RepDealBoard deals={drillFilteredMyDeals} />

          <UserNotepad />
        </>
      )}

      {/* === MANAGER VIEW === */}
      {role === 'manager' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Team Pipeline Value"
              value={fmt(summary.totalACV)}
              subValue={`${summary.dealCount} active deals`}
              icon={<Target className="w-4 h-4" />}
              variant="primary"
              sparklineValue={summary.totalACV / 1000}
            />
            <MetricCard
              label="Quality-Adjusted"
              value={fmt(summary.qualityAdjusted)}
              subValue={`${fmt(summary.confidenceBand.low)} – ${fmt(summary.confidenceBand.high)}`}
              icon={<Activity className="w-4 h-4" />}
              variant="success"
              sparklineValue={summary.qualityAdjusted / 1000}
            />
            <MetricCard
              label="Team Avg PQS"
              value={summary.avgPQS}
              subValue={`Grade ${summary.avgPQS >= 65 ? 'B' : summary.avgPQS >= 50 ? 'C' : 'D'}`}
              variant={
                summary.avgPQS >= 65 ? 'success' : summary.avgPQS >= 50 ? 'warning' : 'danger'
              }
              sparklineValue={summary.avgPQS}
            />
            <div
              className="cursor-pointer"
              onClick={() => setFilterKey('riskOnly', drillFilter.riskOnly ? undefined : true)}
            >
              <MetricCard
                label="At Risk"
                value={summary.atRisk}
                subValue={`${fmt(summary.slipRiskACV)} slip exposure`}
                icon={<AlertTriangle className="w-4 h-4" />}
                variant="danger"
                sparklineValue={summary.atRisk}
              />
            </div>
          </div>

          {/* Pipeline Funnel */}
          <PipelineFunnel
            deals={deals}
            activeStage={drillFilter.stage || null}
            onStageClick={(stage) => setFilterKey('stage', stage || undefined)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ForecastBand
              raw={summary.totalACV}
              adjusted={summary.qualityAdjusted}
              low={summary.confidenceBand.low}
              high={summary.confidenceBand.high}
            />
            <GradeDistribution
              distribution={summary.gradeDistribution}
              total={summary.dealCount}
              activeGrade={drillFilter.grade || null}
              onGradeClick={(grade) => setFilterKey('grade', grade || undefined)}
            />
          </div>
          <InterventionQueue deals={deals} />
          <ActualVsPlanChart />

          {/* Secondary analytics — collapsed by default */}
          <CollapsibleSection title="Deal Stage Validation" storageKey="mgr-stage-validation">
            <DealStageValidator deals={deals} />
          </CollapsibleSection>
          <CollapsibleSection title="Geo & Product Breakdown" storageKey="mgr-geo-product">
            <GeoProductView />
          </CollapsibleSection>

          {/* Filter bar + Deal table */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Team Deals</h2>
            <FilterBar
              filter={drillFilter}
              filteredCount={drillFilteredDeals.length}
              totalCount={deals.length}
              onClear={clearFilterKey}
              onClearAll={clearAllFilters}
            />
            <DealTable deals={drillFilteredDeals} />
          </div>
        </>
      )}

      {/* === EXEC / ADMIN VIEW === */}
      {(role === 'exec' || role === 'admin') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Pipeline Value"
              value={fmt(summary.totalACV)}
              subValue={`${summary.dealCount} active deals`}
              icon={<Target className="w-4 h-4" />}
              variant="primary"
              sparklineValue={summary.totalACV / 1000}
            />
            <MetricCard
              label="Quality-Adjusted"
              value={fmt(summary.qualityAdjusted)}
              subValue={`${fmt(summary.confidenceBand.low)} – ${fmt(summary.confidenceBand.high)}`}
              icon={<Activity className="w-4 h-4" />}
              variant="success"
              sparklineValue={summary.qualityAdjusted / 1000}
            />
            <MetricCard
              label="Avg PQS"
              value={summary.avgPQS}
              subValue={`Grade ${summary.avgPQS >= 65 ? 'B' : summary.avgPQS >= 50 ? 'C' : 'D'} avg`}
              variant={
                summary.avgPQS >= 65 ? 'success' : summary.avgPQS >= 50 ? 'warning' : 'danger'
              }
              sparklineValue={summary.avgPQS}
            />
            <div
              className="cursor-pointer"
              onClick={() => setFilterKey('riskOnly', drillFilter.riskOnly ? undefined : true)}
            >
              <MetricCard
                label="At Risk"
                value={summary.atRisk}
                subValue={`${fmt(summary.slipRiskACV)} slip exposure`}
                icon={<AlertTriangle className="w-4 h-4" />}
                variant="danger"
                sparklineValue={summary.atRisk}
              />
            </div>
          </div>

          {/* Pipeline Funnel — clickable stage drill-down */}
          <PipelineFunnel
            deals={deals}
            activeStage={drillFilter.stage || null}
            onStageClick={(stage) => setFilterKey('stage', stage || undefined)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ForecastBand
              raw={summary.totalACV}
              adjusted={summary.qualityAdjusted}
              low={summary.confidenceBand.low}
              high={summary.confidenceBand.high}
            />
            <GradeDistribution
              distribution={summary.gradeDistribution}
              total={summary.dealCount}
              activeGrade={drillFilter.grade || null}
              onGradeClick={(grade) => setFilterKey('grade', grade || undefined)}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SegmentBreakdown
              data={summary.bySegment}
              activeSegment={drillFilter.segment || null}
              onSegmentClick={(seg) => setFilterKey('segment', seg || undefined)}
            />
            <RiskClusters deals={deals} />
          </div>
          <ActualVsPlanChart />

          {/* Secondary deep-dive analytics — collapsed by default */}
          <CollapsibleSection title="Closed Deal Analytics" storageKey="exec-closed-deals">
            <ClosedDealAnalytics />
          </CollapsibleSection>
          <CollapsibleSection title="Deal Stage Validation" storageKey="exec-stage-validation">
            <DealStageValidator deals={deals} />
          </CollapsibleSection>
          <CollapsibleSection title="ICP Profiler" storageKey="exec-icp">
            <ICPProfiler deals={deals} />
          </CollapsibleSection>
          <CollapsibleSection title="Geo & Product Breakdown" storageKey="exec-geo-product">
            <GeoProductView />
          </CollapsibleSection>

          {/* Filter bar + Deal table */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Active Deals</h2>
            <FilterBar
              filter={drillFilter}
              filteredCount={drillFilteredDeals.length}
              totalCount={deals.length}
              onClear={clearFilterKey}
              onClearAll={clearAllFilters}
            />
            <DealTable deals={drillFilteredDeals} />
          </div>
        </>
      )}

      {/* === REVOPS VIEW === */}
      {role === 'revops' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              label="Pipeline Value"
              value={fmt(summary.totalACV)}
              subValue={`${summary.dealCount} active deals`}
              icon={<Target className="w-4 h-4" />}
              variant="primary"
              sparklineValue={summary.totalACV / 1000}
            />
            <MetricCard
              label="Quality-Adjusted"
              value={fmt(summary.qualityAdjusted)}
              icon={<Activity className="w-4 h-4" />}
              variant="success"
              sparklineValue={summary.qualityAdjusted / 1000}
            />
            <MetricCard
              label="NRR"
              value={`${saasMetrics.nrr}%`}
              subValue="Target: 110%+"
              icon={<RefreshCw className="w-4 h-4" />}
              variant={saasMetrics.nrr >= 110 ? 'success' : saasMetrics.nrr >= 100 ? 'warning' : 'danger'}
              sparklineValue={saasMetrics.nrr}
            />
            <MetricCard
              label="LTV:CAC"
              value={`${saasMetrics.ltvCacRatio}x`}
              subValue="Target: 3x+"
              icon={<Scale className="w-4 h-4" />}
              variant={saasMetrics.ltvCacRatio >= 3 ? 'success' : saasMetrics.ltvCacRatio >= 2 ? 'warning' : 'danger'}
              sparklineValue={saasMetrics.ltvCacRatio * 10}
            />
            <MetricCard
              label="Win Rate"
              value={`${saasMetrics.winRate}%`}
              subValue={`${saasMetrics.avgDealCycle}d avg cycle`}
              variant={saasMetrics.winRate >= 30 ? 'success' : saasMetrics.winRate >= 20 ? 'warning' : 'danger'}
              sparklineValue={saasMetrics.winRate}
            />
            <div
              className="cursor-pointer"
              onClick={() => setFilterKey('riskOnly', drillFilter.riskOnly ? undefined : true)}
            >
              <MetricCard
                label="At Risk"
                value={summary.atRisk}
                subValue={`${fmt(summary.slipRiskACV)} exposure`}
                icon={<AlertTriangle className="w-4 h-4" />}
                variant="danger"
                sparklineValue={summary.atRisk}
              />
            </div>
          </div>

          {/* Pipeline Funnel */}
          <PipelineFunnel
            deals={deals}
            activeStage={drillFilter.stage || null}
            onStageClick={(stage) => setFilterKey('stage', stage || undefined)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ForecastBand
              raw={summary.totalACV}
              adjusted={summary.qualityAdjusted}
              low={summary.confidenceBand.low}
              high={summary.confidenceBand.high}
            />
            <GradeDistribution
              distribution={summary.gradeDistribution}
              total={summary.dealCount}
              activeGrade={drillFilter.grade || null}
              onGradeClick={(grade) => setFilterKey('grade', grade || undefined)}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SegmentBreakdown
              data={summary.bySegment}
              activeSegment={drillFilter.segment || null}
              onSegmentClick={(seg) => setFilterKey('segment', seg || undefined)}
            />
            <RiskClusters deals={deals} />
          </div>
          <ActualVsPlanChart />
          <RetentionMetrics />
          <UnitEconomics />
          <CollapsibleSection title="Geo & Product Breakdown" storageKey="revops-geo-product">
            <GeoProductView />
          </CollapsibleSection>

          {/* Filter bar + Deal table */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">All Deals</h2>
            <FilterBar
              filter={drillFilter}
              filteredCount={drillFilteredDeals.length}
              totalCount={deals.length}
              onClear={clearFilterKey}
              onClearAll={clearAllFilters}
            />
            <DealTable deals={drillFilteredDeals} />
          </div>
        </>
      )}
    </div>
  );
};
export default Index;
