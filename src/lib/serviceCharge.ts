import { cacFeeRows, standardFeeRows, type CacFeeRow, type StandardFeeRow } from '../data/servicePricing';

export const STANDARD_PD_ORDER = ['RAC', 'REF', 'LAD', 'KWH', 'MCA/ CAD/SDA', 'ENG', 'All'] as const;

export const PD_LABELS: Record<string, string> = {
  RAC: 'Room AC (RAC)',
  REF: 'Refrigerator (REF)',
  LAD: 'Laundry (LAD)',
  KWH: 'Water / kitchen (KWH)',
  'MCA/ CAD/SDA': 'Small appliances (MCA / CAD / SDA)',
  ENG: 'Energy (ENG)',
  All: 'All products (PCB)',
  CAC: 'Commercial AC (CAC)',
};

export function uniqueInOrder(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

export function optionize(value: string | null | undefined) {
  const text = (value ?? '').trim();
  return text || 'General';
}

export function formatKyats(value: number | null | undefined) {
  if (value == null) return '—';
  return `${value.toLocaleString()} Ks`;
}

export function standardRowsForPd(rows: StandardFeeRow[], pd: string) {
  if (pd === 'All') {
    return rows.filter((row) => row.pd === 'All');
  }
  return rows.filter((row) => row.pd === pd || row.pd === 'All');
}

export function cacRowKey(row: CacFeeRow) {
  return [
    row.pd,
    row.repairGroup,
    optionize(row.jobDetail),
    optionize(row.series),
    optionize(row.capacity),
    row.customerFee ?? '',
  ].join('|');
}

export function standardRowKey(row: StandardFeeRow) {
  return [row.pd, row.category, row.serviceCategory].join('|');
}

export interface ServiceLine {
  id: string;
  kind: 'standard' | 'cac';
  key: string;
  label: string;
  detail: string;
  chargeType: 'service' | 'diagnosis';
  amount: number;
  serviceFee: number | null;
  diagnosisFee: number | null;
}

export function pdLabel(pd: string, extra: Record<string, string> = {}) {
  return extra[pd] || PD_LABELS[pd] || pd;
}

export function productOptions(rows: StandardFeeRow[] = standardFeeRows) {
  const fromBook = STANDARD_PD_ORDER.filter((pd) => rows.some((row) => row.pd === pd));
  const extras = uniqueInOrder(rows.map((row) => row.pd)).filter(
    (pd) => pd !== 'CAC' && !fromBook.includes(pd as (typeof STANDARD_PD_ORDER)[number]),
  );
  return [...fromBook, ...extras, 'CAC'];
}

export function defaultStandardRow(pd: string, category: string, rows: StandardFeeRow[] = standardFeeRows): StandardFeeRow | null {
  const list = rows.filter((row) => row.pd === pd && row.category === category);
  const servicing = list.find((row) =>
    /alignment|servicing|firmware/i.test(row.serviceCategory)
    && !/parts changed|cleaning|gassing|pcb|sealed|piping/i.test(row.serviceCategory),
  );
  return servicing || list[0] || null;
}

export function defaultCacRow(rows: CacFeeRow[] = cacFeeRows): CacFeeRow | null {
  return rows.find((row) => row.repairGroup === 'Attend Charge') || rows[0] || null;
}

export function lineFromStandard(row: StandardFeeRow, chargeType: 'service' | 'diagnosis' = 'service'): ServiceLine | null {
  const amount = chargeType === 'diagnosis' ? row.diagnosisFee : row.serviceFee;
  if (amount == null) return null;
  return {
    id: `${standardRowKey(row)}-${chargeType}`,
    kind: 'standard',
    key: standardRowKey(row),
    label: row.serviceCategory,
    detail: `${row.pd} · ${row.category}`,
    chargeType,
    amount,
    serviceFee: row.serviceFee,
    diagnosisFee: row.diagnosisFee,
  };
}

export function lineFromCac(row: CacFeeRow): ServiceLine | null {
  if (row.customerFee == null) return null;
  return {
    id: cacRowKey(row),
    kind: 'cac',
    key: cacRowKey(row),
    label: row.jobDetail || row.repairGroup,
    detail: [row.repairGroup, optionize(row.series), row.capacity].filter((part) => part && part !== 'General').join(' · '),
    chargeType: 'service',
    amount: row.customerFee,
    serviceFee: row.customerFee,
    diagnosisFee: null,
  };
}

export function serviceLinesTotal(lines: ServiceLine[]) {
  return lines.reduce((sum, line) => sum + (line.amount || 0), 0);
}

export function buildDefaultLine(
  product: string,
  category: string,
  standardRows: StandardFeeRow[] = standardFeeRows,
  cacRows: CacFeeRow[] = cacFeeRows,
): ServiceLine | null {
  if (product === 'CAC') {
    const row = defaultCacRow(cacRows);
    return row ? lineFromCac(row) : null;
  }
  const row = defaultStandardRow(product, category, standardRows);
  return row ? lineFromStandard(row, 'service') : null;
}

export function categoryOptionsFor(product: string, rows: StandardFeeRow[] = standardFeeRows) {
  return uniqueInOrder(
    rows.filter((row) => row.pd === product).map((row) => row.category),
  );
}

const SERVICE_JOB_KEY = 'mdmm-service-fee-by-wo-v1';

export interface StoredServiceJob {
  woNumber: string;
  customerName: string;
  product: string;
  category: string;
  lines: ServiceLine[];
  transportFee: number | null;
  savedAt: string;
}

export function saveServiceJob(job: StoredServiceJob) {
  const all = loadAllServiceJobs();
  all[job.woNumber.trim().toUpperCase()] = job;
  localStorage.setItem(SERVICE_JOB_KEY, JSON.stringify(all));
}

export function loadServiceJob(woNumber: string): StoredServiceJob | null {
  if (!woNumber.trim()) return null;
  return loadAllServiceJobs()[woNumber.trim().toUpperCase()] || null;
}

export function loadAllServiceJobs(): Record<string, StoredServiceJob> {
  try {
    const raw = localStorage.getItem(SERVICE_JOB_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
