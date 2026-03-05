import { useMemo, useState } from 'react';
import { pipelineDeals, COUNTRY_NAMES, GEO_REGIONS, PRODUCT_BUNDLES } from '@/data/demo-data';
import { useRole } from '@/contexts/RoleContext';
import { SALES_MANAGERS } from '@/data/demo-data';
import { Globe, Package, BarChart3, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { fmt } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--grade-a))',
  'hsl(var(--grade-b))',
  'hsl(var(--grade-c))',
  'hsl(var(--grade-d))',
  'hsl(var(--grade-f))',
  '#60a5fa',
  '#a78bfa',
];

type ViewMode = 'geo' | 'product' | 'region';

export function GeoProductView() {
  const { role, currentRep } = useRole();
  const [viewMode, setViewMode] = useState<ViewMode>('region');

  // Scope deals based on role
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

  // Revenue by country
  const byCountry = useMemo(() => {
    const map: Record<string, { acv: number; deals: number; weighted: number }> = {};
    deals.forEach((d) => {
      if (!map[d.country]) map[d.country] = { acv: 0, deals: 0, weighted: 0 };
      map[d.country].acv += d.acv;
      map[d.country].deals++;
      map[d.country].weighted += d.acv * d.probabilities.win;
    });
    return Object.entries(map)
      .map(([code, data]) => ({
        code,
        name: COUNTRY_NAMES[code] || code,
        ...data,
      }))
      .sort((a, b) => b.acv - a.acv);
  }, [deals]);

  // Revenue by region
  const byRegion = useMemo(() => {
    const map: Record<
      string,
      { acv: number; deals: number; weighted: number; countries: Set<string> }
    > = {};
    deals.forEach((d) => {
      const region =
        Object.entries(GEO_REGIONS).find(([, codes]) => codes.includes(d.country))?.[0] || 'Other';
      if (!map[region]) map[region] = { acv: 0, deals: 0, weighted: 0, countries: new Set() };
      map[region].acv += d.acv;
      map[region].deals++;
      map[region].weighted += d.acv * d.probabilities.win;
      map[region].countries.add(d.country);
    });
    return Object.entries(map)
      .map(([region, data]) => ({
        region,
        acv: data.acv,
        deals: data.deals,
        weighted: data.weighted,
        countryCount: data.countries.size,
      }))
      .sort((a, b) => b.acv - a.acv);
  }, [deals]);

  // Revenue by product bundle
  const byProduct = useMemo(() => {
    const map: Record<
      string,
      { acv: number; deals: number; weighted: number; avgPQS: number; pqsSum: number }
    > = {};
    deals.forEach((d) => {
      if (!map[d.productBundle])
        map[d.productBundle] = { acv: 0, deals: 0, weighted: 0, avgPQS: 0, pqsSum: 0 };
      map[d.productBundle].acv += d.acv;
      map[d.productBundle].deals++;
      map[d.productBundle].weighted += d.acv * d.probabilities.win;
      map[d.productBundle].pqsSum += d.pqScore;
    });
    return Object.entries(map)
      .map(([bundle, data]) => ({
        bundle,
        ...data,
        avgPQS: Math.round(data.pqsSum / data.deals),
      }))
      .sort((a, b) => b.acv - a.acv);
  }, [deals]);

  // Cross-tab: product x region
  const crossTab = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    deals.forEach((d) => {
      const region =
        Object.entries(GEO_REGIONS).find(([, codes]) => codes.includes(d.country))?.[0] || 'Other';
      if (!map[d.productBundle]) map[d.productBundle] = {};
      map[d.productBundle][region] = (map[d.productBundle][region] || 0) + d.acv;
    });
    return map;
  }, [deals]);

  const totalACV = deals.reduce((s, d) => s + d.acv, 0);
  const totalWeighted = deals.reduce((s, d) => s + d.acv * d.probabilities.win, 0);
  const regions = byRegion.map((r) => r.region);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            Revenue by Geography & Product
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['region', 'geo', 'product'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded-md transition-colors ${
                viewMode === mode
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground border border-border/30'
              }`}
            >
              {mode === 'region' ? 'Region' : mode === 'geo' ? 'Country' : 'Product'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-mono font-bold text-foreground">{fmt(totalACV)}</div>
          <div className="text-[9px] text-muted-foreground">Total Pipeline</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-mono font-bold text-grade-a">{fmt(totalWeighted)}</div>
          <div className="text-[9px] text-muted-foreground">Weighted Forecast</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-mono font-bold text-primary">{byCountry.length}</div>
          <div className="text-[9px] text-muted-foreground">Active Countries</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg font-mono font-bold text-blue-400">{byProduct.length}</div>
          <div className="text-[9px] text-muted-foreground">Product Lines</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Bar Chart */}
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            {viewMode === 'product'
              ? 'Pipeline by Product'
              : viewMode === 'geo'
                ? 'Pipeline by Country'
                : 'Pipeline by Region'}
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  viewMode === 'product'
                    ? byProduct.map((p) => ({
                        name: p.bundle,
                        Pipeline: p.acv,
                        Weighted: p.weighted,
                      }))
                    : viewMode === 'geo'
                      ? byCountry
                          .slice(0, 12)
                          .map((c) => ({ name: c.name, Pipeline: c.acv, Weighted: c.weighted }))
                      : byRegion.map((r) => ({
                          name: r.region,
                          Pipeline: r.acv,
                          Weighted: r.weighted,
                        }))
                }
                layout="vertical"
                margin={{ top: 0, right: 5, left: 5, bottom: 0 }}
              >
                <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={viewMode === 'region' ? 120 : 100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => fmt(value)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar
                  dataKey="Pipeline"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  opacity={0.3}
                />
                <Bar dataKey="Weighted" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Product Mix Pie */}
        <div className="glass-card p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            Product Mix
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byProduct.map((p) => ({ name: p.bundle, value: p.acv }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {byProduct.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => fmt(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cross-tab: Product x Region */}
      <div className="glass-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Product x Region Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-2 px-2 text-muted-foreground font-normal">Product</th>
                {regions.map((r) => (
                  <th key={r} className="text-right py-2 px-2 text-muted-foreground font-normal">
                    {r.replace('Europe — ', '')}
                  </th>
                ))}
                <th className="text-right py-2 px-2 text-foreground font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCT_BUNDLES.map((bundle) => {
                const rowTotal = regions.reduce((s, r) => s + (crossTab[bundle]?.[r] || 0), 0);
                if (rowTotal === 0) return null;
                return (
                  <tr key={bundle} className="border-b border-border/10 hover:bg-muted/10">
                    <td className="py-1.5 px-2 text-foreground">{bundle}</td>
                    {regions.map((r) => {
                      const val = crossTab[bundle]?.[r] || 0;
                      return (
                        <td key={r} className="text-right py-1.5 px-2">
                          <span
                            className={val > 0 ? 'text-foreground' : 'text-muted-foreground/30'}
                          >
                            {val > 0 ? fmt(val) : '—'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="text-right py-1.5 px-2 text-foreground font-semibold">
                      {fmt(rowTotal)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t border-border/30 font-semibold">
                <td className="py-1.5 px-2 text-foreground">Total</td>
                {regions.map((r) => {
                  const colTotal = Object.values(crossTab).reduce((s, row) => s + (row[r] || 0), 0);
                  return (
                    <td key={r} className="text-right py-1.5 px-2 text-foreground">
                      {fmt(colTotal)}
                    </td>
                  );
                })}
                <td className="text-right py-1.5 px-2 text-primary">{fmt(totalACV)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Table */}
      <div className="glass-card p-4">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
          {viewMode === 'product'
            ? 'Product Detail'
            : viewMode === 'geo'
              ? 'Country Detail'
              : 'Region Detail'}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-2 px-2 text-muted-foreground font-normal">
                  {viewMode === 'product' ? 'Product' : viewMode === 'geo' ? 'Country' : 'Region'}
                </th>
                <th className="text-right py-2 px-2 text-muted-foreground font-normal">Deals</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-normal">Pipeline</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-normal">Weighted</th>
                <th className="text-right py-2 px-2 text-muted-foreground font-normal">
                  % of Total
                </th>
                {viewMode === 'product' && (
                  <th className="text-right py-2 px-2 text-muted-foreground font-normal">
                    Avg PQS
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {(viewMode === 'product'
                ? byProduct.map((p) => ({
                    name: p.bundle,
                    deals: p.deals,
                    acv: p.acv,
                    weighted: p.weighted,
                    pqs: p.avgPQS,
                  }))
                : viewMode === 'geo'
                  ? byCountry.map((c) => ({
                      name: c.name,
                      deals: c.deals,
                      acv: c.acv,
                      weighted: c.weighted,
                    }))
                  : byRegion.map((r) => ({
                      name: r.region,
                      deals: r.deals,
                      acv: r.acv,
                      weighted: r.weighted,
                    }))
              ).map((row) => (
                <tr key={row.name} className="border-b border-border/10 hover:bg-muted/10">
                  <td className="py-1.5 px-2 text-foreground">{row.name}</td>
                  <td className="text-right py-1.5 px-2">{row.deals}</td>
                  <td className="text-right py-1.5 px-2 text-foreground">{fmt(row.acv)}</td>
                  <td className="text-right py-1.5 px-2 text-grade-a">{fmt(row.weighted)}</td>
                  <td className="text-right py-1.5 px-2">
                    {((row.acv / totalACV) * 100).toFixed(1)}%
                  </td>
                  {viewMode === 'product' && 'pqs' in row && (
                    <td className="text-right py-1.5 px-2">{row.pqs as number}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
