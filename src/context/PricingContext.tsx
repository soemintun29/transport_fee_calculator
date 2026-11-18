import React, { createContext, useContext, useMemo, useState } from 'react';
import type { CacFeeRow, StandardFeeRow } from '../data/servicePricing';
import {
  loadCacRows,
  loadPdLabels,
  loadStandardRows,
  resetPricingCatalog,
  saveCacRows,
  savePdLabels,
  saveStandardRows,
} from '../lib/pricingCatalog';
import {
  buildDefaultLine,
  categoryOptionsFor,
  pdLabel as formatPd,
  productOptions,
  type ServiceLine,
} from '../lib/serviceCharge';

interface PricingContextValue {
  standardRows: StandardFeeRow[];
  cacRows: CacFeeRow[];
  pdLabels: Record<string, string>;
  productCodes: string[];
  pdLabel: (pd: string) => string;
  categoriesFor: (pd: string) => string[];
  defaultLine: (pd: string, category: string) => ServiceLine | null;
  replaceStandard: (rows: StandardFeeRow[]) => void;
  replaceCac: (rows: CacFeeRow[]) => void;
  replaceLabels: (labels: Record<string, string>) => void;
  resetToWorkbook: () => void;
}

const PricingContext = createContext<PricingContextValue | null>(null);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [standardRows, setStandardRows] = useState<StandardFeeRow[]>(() => loadStandardRows());
  const [cacRows, setCacRows] = useState<CacFeeRow[]>(() => loadCacRows());
  const [pdLabels, setPdLabels] = useState<Record<string, string>>(() => loadPdLabels());

  const value = useMemo<PricingContextValue>(() => ({
    standardRows,
    cacRows,
    pdLabels,
    productCodes: productOptions(standardRows),
    pdLabel: (pd: string) => formatPd(pd, pdLabels),
    categoriesFor: (pd: string) => categoryOptionsFor(pd, standardRows),
    defaultLine: (pd: string, category: string) => buildDefaultLine(pd, category, standardRows, cacRows),
    replaceStandard: (rows) => {
      saveStandardRows(rows);
      setStandardRows(rows);
    },
    replaceCac: (rows) => {
      saveCacRows(rows);
      setCacRows(rows);
    },
    replaceLabels: (labels) => {
      savePdLabels(labels);
      setPdLabels(labels);
    },
    resetToWorkbook: () => {
      const next = resetPricingCatalog();
      setStandardRows(next.standardRows);
      setCacRows(next.cacRows);
      setPdLabels(next.pdLabels);
    },
  }), [cacRows, pdLabels, standardRows]);

  return <PricingContext.Provider value={value}>{children}</PricingContext.Provider>;
}

export function usePricing() {
  const ctx = useContext(PricingContext);
  if (!ctx) throw new Error('usePricing must be used inside PricingProvider');
  return ctx;
}
