import { useMemo } from 'react';
import { pipelineDeals, SALES_MANAGERS } from '@/data/demo-data';
import { RiskClusters } from '@/components/RiskClusters';
import { PersonaCoverage } from '@/components/PersonaCoverage';
import { ICPProfiler } from '@/components/ICPProfiler';
import { DealStageValidator } from '@/components/DealStageValidator';
import { DigitalSalesRoom } from '@/components/DigitalSalesRoom';
import { CompetitorTracker } from '@/components/CompetitorTracker';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { ProductFilter } from '@/components/ProductFilter';
import { useProductFilter } from '@/contexts/ProductFilterContext';
import { useRole } from '@/contexts/RoleContext';
import { MetricCard } from '@/components/MetricCard';
import { AlertTriangle, TrendingDown, ShieldAlert } from 'lucide-react';
import { fmt } from '@/lib/utils';
export default function Risk() {
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

  const atRisk = deals.filter((d) => d.pqScore < 40);
  const slipExposure = deals
    .filter((d) => d.probabilities.slip > 0.25)
    .reduce((s, d) => s + d.acv, 0);
  const noDecisionRisk = deals.filter((d) => d.probabilities.noDecision > 0.3);

  const title =
    role === 'rep' ? 'My Risk Monitor' : role === 'manager' ? 'Team Risk Monitor' : 'Risk Monitor';
  const subtitle = role === 'rep' ? `${deals.length} deals monitored` : 'Portfolio risk analysis';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{subtitle}</p>
      </div>
      {role !== 'rep' && <ProductFilter />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="At-Risk Deals"
          value={atRisk.length}
          subValue={`${fmt(atRisk.reduce((s, d) => s + d.acv, 0))} exposure`}
          icon={<AlertTriangle className="w-4 h-4" />}
          variant="danger"
        />
        <MetricCard
          label="Slip Exposure"
          value={fmt(slipExposure)}
          icon={<TrendingDown className="w-4 h-4" />}
          variant="warning"
        />
        <MetricCard
          label="No-Decision Risk"
          value={noDecisionRisk.length}
          subValue="deals above 30% threshold"
          icon={<ShieldAlert className="w-4 h-4" />}
          variant="warning"
        />
      </div>
      {role !== 'rep' && <RiskClusters deals={deals} />}
      <DealStageValidator deals={deals} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CollapsibleSection title="Persona Coverage" storageKey="risk-persona">
          <PersonaCoverage deals={deals} />
        </CollapsibleSection>
        {role !== 'rep' && (
          <CollapsibleSection title="ICP Profiler" storageKey="risk-icp">
            <ICPProfiler deals={deals} />
          </CollapsibleSection>
        )}
      </div>
      {role !== 'rep' && (
        <CollapsibleSection title="Competitor Tracker" storageKey="risk-competitor">
          <CompetitorTracker />
        </CollapsibleSection>
      )}
      {role !== 'rep' && (
        <CollapsibleSection title="Digital Sales Room" storageKey="risk-dsr">
          <DigitalSalesRoom deals={deals} />
        </CollapsibleSection>
      )}
    </div>
  );
}
