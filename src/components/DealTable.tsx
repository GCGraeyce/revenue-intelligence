import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Deal } from '@/data/demo-data';
import { GradeBadge } from '@/components/GradeBadge';
import { DealDrawer } from '@/components/DealDrawer';
import { EmptyState } from '@/components/EmptyState';
import { fmt } from '@/lib/utils';
import { ChevronUp, ChevronDown, Search, TrendingUp, Download, ExternalLink } from 'lucide-react';

type SortKey = 'acv' | 'pqScore' | 'daysInStage' | 'company';
export function DealTable({ deals }: { deals: Deal[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('pqScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const perPage = 20;

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.company.toLowerCase().includes(q) ||
        d.rep.toLowerCase().includes(q) ||
        d.stage.toLowerCase().includes(q)
    );
  }, [deals, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === 'company') return mul * a.company.localeCompare(b.company);
      return mul * ((a[sortKey] as number) - (b[sortKey] as number));
    });
  }, [filtered, sortKey, sortAsc]);
  const paginated = sorted.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(sorted.length / perPage);
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }
  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return null;
    return sortAsc ? (
      <ChevronUp className="w-3 h-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-0.5" />
    );
  };
  function exportCSV() {
    const headers = ['Company', 'Rep', 'ACV', 'Stage', 'PQS', 'Win%', 'Grade', 'Days in Stage'];
    const rows = sorted.map((d) => [
      d.company,
      d.rep,
      d.acv,
      d.stage,
      d.pqScore,
      Math.round(d.probabilities.win * 100),
      d.grade,
      d.daysInStage,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deals-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (deals.length === 0) {
    return (
      <div className="glass-card animate-fade-in">
        <EmptyState
          icon={TrendingUp}
          title="No deals found"
          description="Adjust your filters or check back later"
        />
      </div>
    );
  }

  return (
    <>
      <div className="glass-card overflow-hidden animate-fade-in">
        {/* Search + Export bar */}
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search deals..."
              className="w-full text-xs bg-secondary/30 border border-border/20 rounded-lg pl-8 pr-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border/30 hover:border-border/60 transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Grade
                </th>
                <th
                  className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('company')}
                >
                  Company <SortIcon k="company" />
                </th>
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Rep
                </th>
                <th
                  className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('acv')}
                >
                  ACV <SortIcon k="acv" />
                </th>
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Stage
                </th>
                <th
                  className="text-center p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('pqScore')}
                >
                  PQS <SortIcon k="pqScore" />
                </th>
                <th className="text-center p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Win%
                </th>
                <th className="text-center p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Conf
                </th>
                <th
                  className="text-center p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort('daysInStage')}
                >
                  Days <SortIcon k="daysInStage" />
                </th>
                <th className="text-center p-3 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Gaps
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((deal, i) => (
                <tr
                  key={deal.id}
                  className={`group border-b border-border/20 hover:bg-primary/[0.03] cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                  onClick={() => setSelectedDeal(deal)}
                >
                  <td className="p-3">
                    <GradeBadge grade={deal.grade} />
                  </td>
                  <td className="p-3 font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>{deal.company}</span>
                      <Link
                        to={`/deals/${deal.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{deal.rep}</td>
                  <td className="p-3 text-right data-cell font-semibold">{fmt(deal.acv)}</td>
                  <td className="p-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="p-3 text-center data-cell font-semibold">{deal.pqScore}</td>
                  <td className="p-3 text-center data-cell text-signal-win font-semibold">
                    {Math.round(deal.probabilities.win * 100)}%
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        deal.confidence.band === 'High'
                          ? 'bg-[hsl(var(--grade-a)/.1)] text-grade-a'
                          : deal.confidence.band === 'Medium'
                            ? 'bg-[hsl(var(--grade-c)/.1)] text-grade-c'
                            : 'bg-[hsl(var(--grade-f)/.1)] text-grade-f'
                      }`}
                    >
                      {deal.confidence.band}
                    </span>
                  </td>
                  <td className="p-3 text-center data-cell">{deal.daysInStage}d</td>
                  <td className="p-3 text-center">
                    {deal.personaGaps.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-grade-d bg-[hsl(var(--grade-d)/.08)] px-1.5 py-0.5 rounded-full">
                        {deal.personaGaps.length}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-3 border-t border-border/40 bg-muted/20">
          <span className="text-xs text-muted-foreground font-mono">{sorted.length} deals</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border/60 text-foreground disabled:opacity-30 hover:bg-muted transition-colors shadow-sm"
            >
              Prev
            </button>
            <span className="text-xs font-mono text-muted-foreground">
              {page + 1}/{totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs px-3 py-1.5 rounded-lg bg-card border border-border/60 text-foreground disabled:opacity-30 hover:bg-muted transition-colors shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <DealDrawer deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
    </>
  );
}
