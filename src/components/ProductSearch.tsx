import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { usePricing } from '../context/PricingContext';

interface Props {
  value: string;
  onChange: (pd: string) => void;
  label?: string;
}

export default function ProductSearch({ value, onChange, label = 'Product category' }: Props) {
  const pricing = usePricing();
  const options = pricing.productCodes;
  const selectedLabel = pricing.pdLabel(value) || value || '';
  const [search, setSearch] = useState(selectedLabel);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const showAll = !query || query === selectedLabel.toLowerCase();
    if (showAll) return options;
    return options.filter((pd) => {
      const text = `${pricing.pdLabel(pd)} ${pd}`.toLowerCase();
      return text.includes(query);
    });
  }, [options, pricing, search, selectedLabel]);

  return (
    <div className="space-y-2 relative">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</p>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <input
          type="text"
          className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 font-bold text-midea-blue"
          placeholder="Search RAC, laundry, CAC…"
          value={open ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setSearch('');
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
          {filtered.map((pd) => (
            <button
              key={pd}
              type="button"
              className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 ${value === pd ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(pd);
                setSearch(pricing.pdLabel(pd));
                setOpen(false);
              }}
            >
              <span className="block font-bold text-midea-blue">{pricing.pdLabel(pd)}</span>
              <span className="block text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">{pd}</span>
            </button>
          ))}
          {filtered.length === 0 && <div className="px-4 py-3 text-slate-400 text-sm">No product matches.</div>}
        </div>
      )}
    </div>
  );
}
