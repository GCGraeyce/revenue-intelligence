import { useProductFilter } from '@/contexts/ProductFilterContext';
import { Package, Check, X } from 'lucide-react';

const BUNDLE_COLORS: Record<string, string> = {
  'Starter Visibility': 'bg-grade-d/10 text-grade-d',
  'Professional Monitoring': 'bg-grade-c/10 text-grade-c',
  'Enterprise Visibility': 'bg-primary/10 text-primary',
  'Managed Service': 'bg-grade-a/10 text-grade-a',
  'Smart Safety': 'bg-grade-b/10 text-grade-b',
};

export function ProductFilter() {
  const { availableBundles, selectedBundles, toggleBundle, selectAll, isFiltered } = useProductFilter();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 mr-1">
        <Package className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Product</span>
      </div>
      {availableBundles.map(bundle => {
        const active = selectedBundles.includes(bundle);
        const colorClass = BUNDLE_COLORS[bundle] || 'bg-muted text-muted-foreground';
        return (
          <button
            key={bundle}
            onClick={() => toggleBundle(bundle)}
            className={`text-[10px] px-2 py-1 rounded-full font-mono transition-all flex items-center gap-1 ${
              active
                ? `${colorClass} border border-current/20`
                : 'bg-muted/30 text-muted-foreground/50 border border-transparent line-through'
            }`}
          >
            {active && <Check className="w-2.5 h-2.5" />}
            {bundle}
          </button>
        );
      })}
      {isFiltered && (
        <button
          onClick={selectAll}
          className="text-[9px] px-2 py-1 rounded-full text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
        >
          <X className="w-2.5 h-2.5" /> Clear filter
        </button>
      )}
    </div>
  );
}

/** Compact inline product filter for tight spaces */
export function ProductFilterCompact() {
  const { availableBundles, selectedBundles, toggleBundle, isFiltered, selectAll } = useProductFilter();

  return (
    <div className="flex items-center gap-1">
      <Package className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      {availableBundles.map(bundle => {
        const active = selectedBundles.includes(bundle);
        return (
          <button
            key={bundle}
            onClick={() => toggleBundle(bundle)}
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono transition-all ${
              active
                ? 'bg-primary/10 text-primary'
                : 'bg-muted/20 text-muted-foreground/40'
            }`}
            title={bundle}
          >
            {bundle.split(' ')[0]}
          </button>
        );
      })}
      {isFiltered && (
        <button onClick={selectAll} className="text-[9px] text-primary ml-0.5" title="Show all">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
