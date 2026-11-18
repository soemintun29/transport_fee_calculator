import { calculateHaversineDistance } from './utils';

/** Saved branch row from the app or Supabase. */
export interface ServiceCenterConfig {
  id?: string;
  region: string;
  name: string;
  address?: string;
  center_lat: number;
  center_lng: number;
  base_fee: number;
  base_distance: number;
  fee_per_km: number;
}

/** Real dispatch points only. There is no Hledan Street service center. */
export const DEFAULT_SERVICE_CENTERS: ServiceCenterConfig[] = [
  {
    name: 'Hlaing Thar Yar Service Center',
    region: 'Yangon',
    center_lat: 16.876774,
    center_lng: 96.079265,
    base_fee: 5000,
    base_distance: 5,
    fee_per_km: 1000,
  },
  {
    name: 'Lanmadaw Service Center',
    region: 'Yangon',
    center_lat: 16.7750697,
    center_lng: 96.1446776,
    base_fee: 5000,
    base_distance: 5,
    fee_per_km: 1000,
  },
  {
    name: 'Mandalay Main SC',
    region: 'Mandalay',
    center_lat: 21.974256,
    center_lng: 96.088271,
    base_fee: 5000,
    base_distance: 5,
    fee_per_km: 1000,
  },
];

export const SERVICE_CENTER_ADDRESSES: Record<string, string> = {
  'Hlaing Thar Yar Service Center': 'Ka Naung Min Thar Gyi Road, Hlaing Tharyar (Plus Code V3GH+PP2)',
  'Lanmadaw Service Center': 'No. 47/49 Phone Gyi Street, Middle Block, Lanmadaw, Yangon',
  'Mandalay Main SC': '77th Street, between 31st and 32nd, Chanayethazan, Mandalay',
};

/** Pins that must never be used as a service center. */
const REJECTED_PINS: { lat: number; lng: number; reason: string }[] = [
  { lat: 16.8661, lng: 96.1951, reason: 'old Yangon city centroid' },
  { lat: 21.9588, lng: 96.0891, reason: 'old Mandalay city centroid' },
  { lat: 16.776430150432684, lng: 96.1436215097854, reason: 'Hledan Street — not a service center' },
];

const REJECT_WITHIN_KM = 0.08;

function isRejectedPin(lat: number, lng: number): boolean {
  return REJECTED_PINS.some(
    (p) => calculateHaversineDistance(lat, lng, p.lat, p.lng) <= REJECT_WITHIN_KM
  );
}

function isRealCenterName(name: string): boolean {
  const n = (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return DEFAULT_SERVICE_CENTERS.some((c) => c.name.toLowerCase() === n);
}

function isGhostName(name: string): boolean {
  const n = (name || '').toLowerCase().replace(/\s+/g, ' ');
  return (
    n.includes('yangon main') ||
    n.includes('hledan') ||
    n.includes('hleden') ||
    n.includes('hle dan')
  );
}

function keyOf(c: Pick<ServiceCenterConfig, 'region' | 'name'>): string {
  return `${c.region}|${c.name}`.toLowerCase();
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Supabase numeric columns arrive as strings. Keep saved rates instead of the 1,000 fallback. */
function normalizeCenter(center: ServiceCenterConfig): ServiceCenterConfig | null {
  const center_lat = asNumber(center?.center_lat);
  const center_lng = asNumber(center?.center_lng);
  const base_fee = asNumber(center?.base_fee);
  const base_distance = asNumber(center?.base_distance);
  const fee_per_km = asNumber(center?.fee_per_km);
  if (
    center_lat == null ||
    center_lng == null ||
    base_fee == null ||
    base_distance == null ||
    fee_per_km == null
  ) {
    return null;
  }
  if (center_lat === 0 || center_lng === 0) return null;
  return { ...center, center_lat, center_lng, base_fee, base_distance, fee_per_km };
}

/**
 * Keep real saved branches. Drop Hledan / city-centroid ghosts.
 * Always restore the three actual fallbacks if they are missing or were stored on a rejected pin.
 */
export function mergeServiceConfig(fromDb: ServiceCenterConfig[] | null | undefined): ServiceCenterConfig[] {
  const cleaned = (fromDb || []).flatMap((c) => {
    const normalized = normalizeCenter(c);
    if (!normalized) return [];
    if (!isRealCenterName(normalized.name) && isRejectedPin(normalized.center_lat, normalized.center_lng)) return [];
    if (isGhostName(normalized.name)) return [];
    return [normalized];
  });

  const byKey = new Map<string, ServiceCenterConfig>();
  cleaned.forEach((c) => byKey.set(keyOf(c), c));

  DEFAULT_SERVICE_CENTERS.forEach((fallback) => {
    const k = keyOf(fallback);
    const existing = byKey.get(k);
    if (!existing || (!isRealCenterName(existing.name) && isRejectedPin(existing.center_lat, existing.center_lng))) {
      byKey.set(k, { ...fallback });
    }
  });

  const order = DEFAULT_SERVICE_CENTERS.map(keyOf);
  const rest = [...byKey.keys()].filter((k) => !order.includes(k));
  return [...order, ...rest].map((k) => byKey.get(k)!).filter(Boolean);
}

export function defaultMapCenter(region: string): [number, number] {
  const pin =
    DEFAULT_SERVICE_CENTERS.find((c) => c.region === region) || DEFAULT_SERVICE_CENTERS[0];
  return [pin.center_lat, pin.center_lng];
}

export function newBranchTemplate(region: string): ServiceCenterConfig {
  const pin =
    DEFAULT_SERVICE_CENTERS.find((c) => c.region === region) || DEFAULT_SERVICE_CENTERS[0];
  return {
    region,
    name: `New ${region} Branch`,
    address: '',
    center_lat: pin.center_lat,
    center_lng: pin.center_lng,
    base_fee: pin.base_fee,
    base_distance: pin.base_distance,
    fee_per_km: pin.fee_per_km,
  };
}

const ADDRESS_KEY = 'mdmm-sc-addresses-v1';

export function centerKey(center: Pick<ServiceCenterConfig, 'region' | 'name'>) {
  return `${center.region}|${center.name}`;
}

export function loadAddressMap(): Record<string, string> {
  const defaults: Record<string, string> = {};
  DEFAULT_SERVICE_CENTERS.forEach((center) => {
    const listed = SERVICE_CENTER_ADDRESSES[center.name];
    if (listed) defaults[centerKey(center)] = listed;
  });
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    const stored = raw ? JSON.parse(raw) as Record<string, string> : {};
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

export function saveCenterAddress(region: string, name: string, address: string) {
  const map = loadAddressMap();
  map[`${region}|${name}`] = address;
  localStorage.setItem(ADDRESS_KEY, JSON.stringify(map));
}

export function addressFor(center: ServiceCenterConfig, map: Record<string, string> = loadAddressMap()) {
  return (center.address || map[centerKey(center)] || SERVICE_CENTER_ADDRESSES[center.name] || '').trim();
}

export function applyAddresses(centers: ServiceCenterConfig[]): ServiceCenterConfig[] {
  const map = loadAddressMap();
  return centers.map((center) => ({ ...center, address: addressFor(center, map) }));
}
