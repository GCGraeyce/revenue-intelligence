import { createContext, useCallback, useContext, useState, useMemo, ReactNode } from 'react';
import { pipelineDeals, Deal } from '@/data/demo-data';

/** All product bundles present in the pipeline */
const ALL_BUNDLES = [...new Set(pipelineDeals.map((d) => d.productBundle))].sort();

interface ProductFilterContextType {
  availableBundles: string[];
  selectedBundles: string[];
  toggleBundle: (bundle: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  filteredDeals: Deal[];
  isFiltered: boolean;
}

const ProductFilterContext = createContext<ProductFilterContextType | null>(null);

export function ProductFilterProvider({ children }: { children: ReactNode }) {
  const [selectedBundles, setSelectedBundles] = useState<string[]>(ALL_BUNDLES);

  const toggleBundle = useCallback((bundle: string) => {
    setSelectedBundles((prev) =>
      prev.includes(bundle) ? prev.filter((b) => b !== bundle) : [...prev, bundle]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedBundles(ALL_BUNDLES);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedBundles([]);
  }, []);

  const filteredDeals = useMemo(
    () => pipelineDeals.filter((d) => selectedBundles.includes(d.productBundle)),
    [selectedBundles]
  );

  const isFiltered = selectedBundles.length !== ALL_BUNDLES.length;

  const value = useMemo(
    () => ({
      availableBundles: ALL_BUNDLES,
      selectedBundles,
      toggleBundle,
      selectAll,
      clearAll,
      filteredDeals,
      isFiltered,
    }),
    [selectedBundles, toggleBundle, selectAll, clearAll, filteredDeals, isFiltered]
  );

  return <ProductFilterContext.Provider value={value}>{children}</ProductFilterContext.Provider>;
}

export function useProductFilter() {
  const ctx = useContext(ProductFilterContext);
  if (!ctx) throw new Error('useProductFilter must be used within ProductFilterProvider');
  return ctx;
}
