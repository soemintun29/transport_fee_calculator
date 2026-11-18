import { cacFeeRows, standardFeeRows, type CacFeeRow, type StandardFeeRow } from '../data/servicePricing';
import { PD_LABELS } from './serviceCharge';

const STANDARD_KEY = 'mdmm-service-pricing-standard-v1';
const CAC_KEY = 'mdmm-service-pricing-cac-v1';
const LABELS_KEY = 'mdmm-pd-labels-v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadStandardRows(): StandardFeeRow[] {
  const stored = readJson<StandardFeeRow[] | null>(STANDARD_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return standardFeeRows.map((row) => ({ ...row }));
}

export function loadCacRows(): CacFeeRow[] {
  const stored = readJson<CacFeeRow[] | null>(CAC_KEY, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return cacFeeRows.map((row) => ({ ...row }));
}

export function loadPdLabels(): Record<string, string> {
  return { ...PD_LABELS, ...readJson<Record<string, string>>(LABELS_KEY, {}) };
}

export function saveStandardRows(rows: StandardFeeRow[]) {
  localStorage.setItem(STANDARD_KEY, JSON.stringify(rows));
}

export function saveCacRows(rows: CacFeeRow[]) {
  localStorage.setItem(CAC_KEY, JSON.stringify(rows));
}

export function savePdLabels(labels: Record<string, string>) {
  const extras: Record<string, string> = {};
  Object.entries(labels).forEach(([pd, label]) => {
    if (label && label !== PD_LABELS[pd]) extras[pd] = label;
  });
  localStorage.setItem(LABELS_KEY, JSON.stringify(extras));
}

export function resetPricingCatalog() {
  localStorage.removeItem(STANDARD_KEY);
  localStorage.removeItem(CAC_KEY);
  localStorage.removeItem(LABELS_KEY);
  return {
    standardRows: standardFeeRows.map((row) => ({ ...row })),
    cacRows: cacFeeRows.map((row) => ({ ...row })),
    pdLabels: { ...PD_LABELS },
  };
}
