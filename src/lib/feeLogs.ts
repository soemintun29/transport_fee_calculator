import { downloadCsv } from './utils';
import {
  loadAllServiceJobs,
  saveServiceJob,
  serviceLinesTotal,
  type ServiceLine,
  type StoredServiceJob,
} from './serviceCharge';

const SERVICE_LOG_KEY = 'mdmm-service-fee-log-v1';
const TRANSPORT_LOG_KEY = 'mdmm-transport-log-v1';

export interface ServiceFeeLogEntry {
  id: string;
  woNumber: string;
  customerName: string;
  product: string;
  category: string;
  lines: ServiceLine[];
  serviceTotal: number;
  transportFee: number | null;
  savedAt: string;
}

export interface TransportLogEntry {
  id: string;
  createdAt: string;
  customerName: string;
  customerAddress: string;
  woNumber: string;
  transportFee: number;
  serviceCenterName: string;
  serviceCenterAddress: string;
  serviceCenterLat: number;
  serviceCenterLng: number;
  distanceKm: number;
  scheduledDate: string | null;
  region: string;
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T[] : [];
  } catch {
    return [];
  }
}

export function loadServiceFeeLog(): ServiceFeeLogEntry[] {
  const stored = readList<ServiceFeeLogEntry>(SERVICE_LOG_KEY);
  if (stored.length > 0) {
    return stored.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }
  const migrated = Object.values(loadAllServiceJobs()).map((job) => ({
    id: `wo-${job.woNumber}-${job.savedAt}`,
    woNumber: job.woNumber,
    customerName: job.customerName,
    product: job.product,
    category: job.category,
    lines: job.lines,
    serviceTotal: serviceLinesTotal(job.lines),
    transportFee: job.transportFee,
    savedAt: job.savedAt,
  }));
  if (migrated.length > 0) {
    localStorage.setItem(SERVICE_LOG_KEY, JSON.stringify(migrated));
  }
  return migrated.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function appendServiceFeeLog(job: StoredServiceJob): ServiceFeeLogEntry {
  saveServiceJob(job);
  const entry: ServiceFeeLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    woNumber: job.woNumber,
    customerName: job.customerName,
    product: job.product,
    category: job.category,
    lines: job.lines,
    serviceTotal: serviceLinesTotal(job.lines),
    transportFee: job.transportFee,
    savedAt: job.savedAt,
  };
  const current = readList<ServiceFeeLogEntry>(SERVICE_LOG_KEY);
  const next = [entry, ...current].slice(0, 500);
  localStorage.setItem(SERVICE_LOG_KEY, JSON.stringify(next));
  return entry;
}

export function loadTransportLog(): TransportLogEntry[] {
  return readList<TransportLogEntry>(TRANSPORT_LOG_KEY).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function appendTransportLog(entry: Omit<TransportLogEntry, 'id'>): TransportLogEntry {
  const full: TransportLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
  };
  const next = [full, ...loadTransportLog()].slice(0, 500);
  localStorage.setItem(TRANSPORT_LOG_KEY, JSON.stringify(next));
  return full;
}

export function inDateRange(iso: string, startDate: string, endDate: string) {
  const day = iso.slice(0, 10);
  return day >= startDate && day <= endDate;
}

export function exportServiceFeeLogCsv(entries: ServiceFeeLogEntry[], startDate: string, endDate: string) {
  downloadCsv(
    `service_fee_log_${startDate}_to_${endDate}.csv`,
    ['Date', 'Customer Name', 'Work Order #', 'Product', 'Sub-category', 'Service categories', 'Service total (Ks)'],
    entries.map((entry) => [
      new Date(entry.savedAt).toLocaleString(),
      entry.customerName,
      entry.woNumber,
      entry.product,
      entry.category || (entry.product === 'CAC' ? 'CAC' : ''),
      entry.lines.map((line) => `${line.label} (${line.amount})`).join('; '),
      entry.serviceTotal,
    ]),
  );
}

export function exportTransportLogCsv(entries: TransportLogEntry[], startDate: string, endDate: string) {
  downloadCsv(
    `transport_audit_${startDate}_to_${endDate}.csv`,
    [
      'Date',
      'Customer Name',
      'Customer address',
      'Work Order #',
      'Transport fee (Ks)',
      'Service center',
      'Service center address',
      'Service center lat',
      'Service center lng',
      'Distance (km)',
      'Scheduled date',
    ],
    entries.map((entry) => [
      new Date(entry.createdAt).toLocaleString(),
      entry.customerName,
      entry.customerAddress,
      entry.woNumber,
      entry.transportFee,
      entry.serviceCenterName,
      entry.serviceCenterAddress,
      entry.serviceCenterLat,
      entry.serviceCenterLng,
      Number(entry.distanceKm).toFixed(2),
      entry.scheduledDate || '',
    ]),
  );
}
