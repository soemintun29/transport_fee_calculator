import React, { useMemo, useState } from 'react';
import { Calendar, Download, MapPin, Save, Settings, Wrench } from 'lucide-react';
import type { ServiceCenterConfig } from '../lib/serviceCenters';
import { addressFor } from '../lib/serviceCenters';
import PricingSettings from './PricingSettings';
import {
  exportServiceFeeLogCsv,
  exportTransportLogCsv,
  inDateRange,
  loadServiceFeeLog,
  loadTransportLog,
  type TransportLogEntry,
} from '../lib/feeLogs';
import { usePricing } from '../context/PricingContext';

export type SettingsTab = 'centers' | 'pricing' | 'transport-log' | 'service-log';

interface Props {
  passwordInputRef: React.RefObject<HTMLInputElement | null>;
  settingsPassword: string;
  setSettingsPassword: (value: string) => void;
  isSettingUnlocked: boolean;
  onUnlock: () => void;
  adminRegion: string;
  setAdminRegion: (value: string) => void;
  editCenters: ServiceCenterConfig[];
  updateEditCenter: (index: number, field: keyof ServiceCenterConfig, value: string) => void;
  saveConfig: (center: ServiceCenterConfig) => void;
  deleteConfig: (center: ServiceCenterConfig) => void;
  addNewCenter: () => void;
  auditLogs: any[];
  logStartDate: string;
  logEndDate: string;
  setLogStartDate: (value: string) => void;
  setLogEndDate: (value: string) => void;
  isExporting: boolean;
  centers: ServiceCenterConfig[];
}

function enrichRemote(log: any, centers: ServiceCenterConfig[]): TransportLogEntry {
  const match = centers.find((center) => center.name === log.service_center_name);
  return {
    id: String(log.id || `${log.wo_number}-${log.created_at}`),
    createdAt: log.created_at,
    customerName: log.customer_name,
    customerAddress: log.customer_address || '',
    woNumber: log.wo_number || '',
    transportFee: log.agreed_fee,
    serviceCenterName: log.service_center_name || '',
    serviceCenterAddress: match ? addressFor(match) : '',
    serviceCenterLat: match?.center_lat ?? 0,
    serviceCenterLng: match?.center_lng ?? 0,
    distanceKm: log.distance_km || 0,
    scheduledDate: log.scheduled_date || null,
    region: match?.region || '',
  };
}

export default function SettingsPanel({
  passwordInputRef,
  settingsPassword,
  setSettingsPassword,
  isSettingUnlocked,
  onUnlock,
  adminRegion,
  setAdminRegion,
  editCenters,
  updateEditCenter,
  saveConfig,
  deleteConfig,
  addNewCenter,
  auditLogs,
  logStartDate,
  logEndDate,
  setLogStartDate,
  setLogEndDate,
  isExporting,
  centers,
}: Props) {
  const [tab, setTab] = useState<SettingsTab>('centers');
  const [serviceLogTick, setServiceLogTick] = useState(0);
  const pricing = usePricing();

  const transportRows = useMemo(() => {
    const local = loadTransportLog().filter((row) => inDateRange(row.createdAt, logStartDate, logEndDate));
    const localKeys = new Set(local.map((row) => `${row.woNumber}|${row.createdAt.slice(0, 16)}`));
    const remote = auditLogs
      .map((log) => enrichRemote(log, centers))
      .filter((row) => !localKeys.has(`${row.woNumber}|${row.createdAt.slice(0, 16)}`));
    return [...local, ...remote].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [auditLogs, centers, logEndDate, logStartDate]);

  const serviceRows = useMemo(() => {
    void serviceLogTick;
    return loadServiceFeeLog().filter((row) => inDateRange(row.savedAt, logStartDate, logEndDate));
  }, [logEndDate, logStartDate, serviceLogTick]);

  if (!isSettingUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="w-16 h-16 bg-midea-blue/5 rounded-full flex items-center justify-center text-midea-blue">
          <Settings className="w-8 h-8 animate-spin-slow" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-black text-midea-blue uppercase tracking-widest">Settings Locked</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter Administrator Password to continue</p>
        </div>
        <div className="flex w-full max-w-sm gap-2">
          <input
            ref={passwordInputRef}
            type="password"
            placeholder="Enter Password..."
            value={settingsPassword}
            onChange={(e) => setSettingsPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onUnlock()}
            className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-midea-blue/20 font-bold text-midea-blue text-center"
          />
          <button
            onClick={onUnlock}
            className="px-6 py-3 bg-midea-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-midea-light-blue transition-all"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'centers', label: 'Service centers' },
    { id: 'pricing', label: 'Service prices' },
    { id: 'transport-log', label: 'Transport log' },
    { id: 'service-log', label: 'Service fee log' },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl mb-6">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setTab(item.id); if (item.id === 'service-log') setServiceLogTick((n) => n + 1); }}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${tab === item.id ? 'bg-white text-midea-blue shadow-sm' : 'text-slate-400'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'centers' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-midea-light-blue/10 rounded-full flex items-center justify-center text-midea-blue">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Service center location & transport fee</h2>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['Yangon', 'Mandalay'].map((r) => (
                <button
                  key={r}
                  onClick={() => setAdminRegion(r)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    adminRegion === r ? 'bg-white text-midea-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {editCenters.map((center, index) => (
              <div key={index} className="grid grid-cols-1 gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="text"
                    value={center.name}
                    onChange={(e) => updateEditCenter(index, 'name', e.target.value)}
                    className="font-black text-midea-blue bg-transparent border-b-2 border-transparent focus:border-midea-light-blue outline-none px-1 py-0.5 w-1/2"
                    placeholder="Branch name (e.g. Lanmadaw Service Center)"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveConfig(center)} className="px-3 py-1 bg-midea-blue text-white rounded text-[8px] font-bold uppercase hover:bg-midea-light-blue transition-colors">Save</button>
                    {center.id && <button onClick={() => deleteConfig(center)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-[8px] font-bold uppercase hover:bg-red-100 transition-colors">Delete</button>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Service center address</label>
                  <input
                    type="text"
                    value={center.address || ''}
                    onChange={(e) => updateEditCenter(index, 'address', e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none"
                    placeholder="Street, township"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Latitude</label>
                    <input type="number" step="any" value={center.center_lat} onChange={(e) => updateEditCenter(index, 'center_lat', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase">Longitude</label>
                    <input type="number" step="any" value={center.center_lng} onChange={(e) => updateEditCenter(index, 'center_lng', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-2">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-midea-blue uppercase">Transport rates</h4>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">Base Fee / Dist</label>
                      <div className="flex gap-1">
                        <input type="number" value={center.base_fee} onChange={(e) => updateEditCenter(index, 'base_fee', e.target.value)} className="w-2/3 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" placeholder="Ks" />
                        <input type="number" value={center.base_distance} onChange={(e) => updateEditCenter(index, 'base_distance', e.target.value)} className="w-1/3 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" placeholder="Km" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase">+ Rate per Km</label>
                      <input type="number" value={center.fee_per_km} onChange={(e) => updateEditCenter(index, 'fee_per_km', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addNewCenter}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-500 uppercase tracking-widest hover:border-midea-blue hover:text-midea-blue transition-colors flex items-center justify-center gap-2"
            >
              + Add New Branch to {adminRegion}
            </button>
          </div>
        </>
      )}

      {tab === 'pricing' && (
        <>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-midea-light-blue/10 rounded-full flex items-center justify-center text-midea-blue">
              <Wrench className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Service fee & categories</h2>
          </div>
          <PricingSettings />
        </>
      )}

      {(tab === 'transport-log' || tab === 'service-log') && (
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-midea-blue">
                <Save className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">
                {tab === 'transport-log' ? 'Transport log' : 'Service fee log'}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-xl gap-2">
                <Calendar className="w-3 h-3 text-slate-400" />
                <input type="date" value={logStartDate} onChange={(e) => setLogStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-slate-600 outline-none" />
                <span className="text-[10px] text-slate-300 font-black">TO</span>
                <input type="date" value={logEndDate} onChange={(e) => setLogEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-slate-600 outline-none" />
              </div>
              <button
                onClick={() => {
                  if (tab === 'transport-log') {
                    if (transportRows.length === 0) { alert('No transport records for this date range.'); return; }
                    exportTransportLogCsv(transportRows, logStartDate, logEndDate);
                  } else {
                    if (serviceRows.length === 0) { alert('No service fee records for this date range.'); return; }
                    exportServiceFeeLogCsv(serviceRows, logStartDate, logEndDate);
                  }
                }}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                {tab === 'transport-log' ? 'Export transport CSV' : 'Export service CSV'}
              </button>
            </div>
          </div>

          {tab === 'transport-log' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Date</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Customer</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">WO #</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Transport fee</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Service center</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">SC location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transportRows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs font-bold italic">No transport records.</td></tr>
                  ) : transportRows.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3 text-[10px] font-bold text-slate-600">{new Date(log.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        <p className="text-[10px] font-black text-midea-blue">{log.customerName}</p>
                        <p className="text-[8px] text-slate-400 truncate max-w-[180px]">{log.customerAddress}</p>
                      </td>
                      <td className="px-3 py-3 text-[10px] font-bold text-slate-500">{log.woNumber || '—'}</td>
                      <td className="px-3 py-3 text-[10px] font-black text-midea-blue">{Number(log.transportFee).toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <p className="text-[10px] font-bold text-slate-600">{log.serviceCenterName}</p>
                        <p className="text-[8px] text-slate-400 truncate max-w-[180px]">{log.serviceCenterAddress}</p>
                      </td>
                      <td className="px-3 py-3 text-[10px] font-bold text-slate-500">
                        {log.serviceCenterLat ? `${log.serviceCenterLat.toFixed(5)}, ${log.serviceCenterLng.toFixed(5)}` : '—'}
                        <span className="block text-[8px] text-slate-400">{Number(log.distanceKm).toFixed(1)} km</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'service-log' && (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Date</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Customer / WO</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Product</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Services</th>
                    <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase">Service total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {serviceRows.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs font-bold italic">No service fee records. Save a service fee from the call desk first.</td></tr>
                  ) : serviceRows.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-3 text-[10px] font-bold text-slate-600">{new Date(log.savedAt).toLocaleString()}</td>
                      <td className="px-3 py-3">
                        <p className="text-[10px] font-black text-midea-blue">{log.customerName}</p>
                        <p className="text-[8px] text-slate-400">{log.woNumber}</p>
                      </td>
                      <td className="px-3 py-3 text-[10px] font-bold text-slate-500">
                        {pricing.pdLabel(log.product)}
                        {log.category ? <span className="block text-[8px] text-slate-400">{log.category}</span> : null}
                      </td>
                      <td className="px-3 py-3 text-[10px] text-slate-600">
                        {log.lines.map((line) => (
                          <p key={line.id} className="truncate max-w-[220px]">{line.label} · {line.amount.toLocaleString()} Ks</p>
                        ))}
                      </td>
                      <td className="px-3 py-3 text-[10px] font-black text-midea-blue">{log.serviceTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
