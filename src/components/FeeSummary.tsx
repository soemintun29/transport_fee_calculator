import React from 'react';
import { Navigation, Plus, Trash2 } from 'lucide-react';
import { formatKyats, type ServiceLine } from '../lib/serviceCharge';

interface Props {
  transportFee: number | null;
  distanceKm?: number | null;
  lines: ServiceLine[];
  onRemoveLine: (id: string) => void;
  onToggleChargeType: (id: string) => void;
  onAddClick: () => void;
  showAdd: boolean;
}

export default function FeeSummary({
  transportFee,
  distanceKm,
  lines,
  onRemoveLine,
  onToggleChargeType,
  onAddClick,
  showAdd,
}: Props) {
  const serviceTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const transport = transportFee ?? 0;
  const grand = transport + serviceTotal;
  const empty = transportFee == null && lines.length === 0;

  return (
    <section className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-midea-blue text-white p-6 flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-midea-light-blue block mb-2">All fees</span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black">{empty ? '—' : grand.toLocaleString()}</h3>
            <span className="text-sm font-bold opacity-50 uppercase tracking-widest">Ks</span>
          </div>
        </div>
        {showAdd && (
          <button
            type="button"
            onClick={onAddClick}
            className="w-10 h-10 rounded-full bg-white text-midea-blue flex items-center justify-center shrink-0 shadow-lg"
            aria-label="Add service category"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start py-2 border-b border-slate-50">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transport</p>
            {distanceKm != null && transportFee != null && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Navigation className="w-3 h-3" /> {distanceKm.toFixed(1)} km
              </p>
            )}
          </div>
          <p className="text-sm font-black text-midea-blue">{transportFee == null ? 'Not calculated' : formatKyats(transportFee)}</p>
        </div>

        {lines.map((line) => (
          <div key={line.id} className="flex justify-between items-start gap-3 py-2 border-b border-slate-50">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700">{line.label}</p>
              <p className="text-[10px] text-slate-400 truncate">{line.detail}</p>
              {line.kind === 'standard' && line.diagnosisFee != null && (
                <div className="flex gap-1 mt-1">
                  {(['service', 'diagnosis'] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => onToggleChargeType(line.id)}
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        line.chargeType === kind ? 'bg-midea-blue text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {kind === 'service' ? 'Service' : 'Diagnosis'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-sm font-black text-midea-blue">{formatKyats(line.amount)}</p>
              <button type="button" onClick={() => onRemoveLine(line.id)} className="text-slate-300 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between text-xs font-black uppercase tracking-widest pt-1">
          <span className="text-slate-400">Service subtotal</span>
          <span className="text-midea-blue">{formatKyats(serviceTotal)}</span>
        </div>

        {showAdd && (
          <button
            type="button"
            onClick={onAddClick}
            className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-midea-blue/30 text-midea-blue text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
            Add service category
          </button>
        )}
      </div>
    </section>
  );
}
