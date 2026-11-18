import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { CacFeeRow, StandardFeeRow } from '../data/servicePricing';
import { usePricing } from '../context/PricingContext';
import { cacRowKey, formatKyats, optionize, standardRowKey, standardRowsForPd } from '../lib/serviceCharge';

interface Props {
  open: boolean;
  product: string;
  category: string;
  usedKeys: string[];
  onClose: () => void;
  onPickStandard: (row: StandardFeeRow) => void;
  onPickCac: (row: CacFeeRow) => void;
}

export default function ServiceCategoryDialog({
  open,
  product,
  category,
  usedKeys,
  onClose,
  onPickStandard,
  onPickCac,
}: Props) {
  const { standardRows, cacRows } = usePricing();
  const [query, setQuery] = useState('');
  const isCac = product === 'CAC';

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const standardItems = useMemo(() => {
    const scoped = standardRowsForPd(standardRows, product);
    const inCat = scoped.filter((row) => row.pd === product && row.category === category);
    const extra = product === 'All' ? [] : scoped.filter((row) => row.pd === 'All');
    return [...inCat, ...extra];
  }, [category, product, standardRows]);

  const filteredStandard = useMemo(() => {
    const q = query.trim().toLowerCase();
    return standardItems.filter((row) => {
      if (usedKeys.includes(standardRowKey(row))) return false;
      if (!q) return true;
      return `${row.serviceCategory} ${row.category} ${row.pd}`.toLowerCase().includes(q);
    });
  }, [query, standardItems, usedKeys]);

  const filteredCac = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cacRows.filter((row) => {
      if (usedKeys.includes(cacRowKey(row))) return false;
      if (!q) return true;
      const blob = `${row.repairGroup} ${row.jobDetail || ''} ${row.series || ''} ${row.capacity || ''}`.toLowerCase();
      return blob.includes(q);
    });
  }, [cacRows, query, usedKeys]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add service category</p>
            <h3 className="text-sm font-black text-midea-blue uppercase tracking-widest mt-1">Search and select</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isCac ? 'Search job, series, capacity…' : 'Search service category…'}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-midea-blue/20 font-bold text-midea-blue"
            />
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {!isCac && filteredStandard.map((row) => (
            <button
              key={standardRowKey(row)}
              type="button"
              className="w-full text-left px-5 py-4 border-b border-slate-50 hover:bg-slate-50"
              onClick={() => {
                onPickStandard(row);
                setQuery('');
                onClose();
              }}
            >
              <span className="block text-sm font-bold text-midea-blue">{row.serviceCategory}</span>
              <span className="block text-[10px] text-slate-400 mt-1">
                Service {formatKyats(row.serviceFee)}
                {row.diagnosisFee != null ? ` · Diagnosis ${formatKyats(row.diagnosisFee)}` : ''}
                {row.pd === 'All' ? ' · PCB (all products)' : ''}
              </span>
            </button>
          ))}
          {isCac && filteredCac.map((row) => (
            <button
              key={cacRowKey(row)}
              type="button"
              className="w-full text-left px-5 py-4 border-b border-slate-50 hover:bg-slate-50"
              onClick={() => {
                onPickCac(row);
                setQuery('');
                onClose();
              }}
            >
              <span className="block text-sm font-bold text-midea-blue">{row.jobDetail || row.repairGroup}</span>
              <span className="block text-[10px] text-slate-400 mt-1">
                {[row.repairGroup, optionize(row.series), row.capacity].filter((part) => part && part !== 'General').join(' · ')}
                {' · '}{formatKyats(row.customerFee)}
              </span>
            </button>
          ))}
          {((!isCac && filteredStandard.length === 0) || (isCac && filteredCac.length === 0)) && (
            <p className="px-5 py-8 text-sm text-slate-400 text-center">No matching service category.</p>
          )}
        </div>
      </div>
    </div>
  );
}
