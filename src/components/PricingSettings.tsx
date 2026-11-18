import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePricing } from '../context/PricingContext';
import { formatKyats, standardRowKey } from '../lib/serviceCharge';
import type { CacFeeRow, StandardFeeRow } from '../data/servicePricing';

export default function PricingSettings() {
  const pricing = usePricing();
  const [kind, setKind] = useState<'standard' | 'cac'>('standard');
  const [pd, setPd] = useState(pricing.productCodes.find((code) => code !== 'CAC') || 'RAC');
  const [category, setCategory] = useState('');
  const [newPd, setNewPd] = useState('');
  const [newPdLabel, setNewPdLabel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newService, setNewService] = useState('');
  const [newServiceFee, setNewServiceFee] = useState('30000');
  const [newDiagnosisFee, setNewDiagnosisFee] = useState('15000');
  const [cacGroup, setCacGroup] = useState('');
  const [newCac, setNewCac] = useState({ repairGroup: 'Attend Charge', jobDetail: '', series: '', capacity: '', customerFee: '44000' });

  const categories = pricing.categoriesFor(pd);
  const activeCategory = category && categories.includes(category) ? category : (categories[0] || '');
  const rows = useMemo(
    () => pricing.standardRows.filter((row) => row.pd === pd && (!activeCategory || row.category === activeCategory)),
    [activeCategory, pd, pricing.standardRows],
  );
  const cacGroups = useMemo(
    () => Array.from(new Set(pricing.cacRows.map((row) => row.repairGroup))),
    [pricing.cacRows],
  );
  const activeCacGroup = cacGroup && cacGroups.includes(cacGroup) ? cacGroup : (cacGroups[0] || '');

  const updateStandardAt = (index: number, patch: Partial<StandardFeeRow>) => {
    pricing.replaceStandard(pricing.standardRows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeStandardAt = (index: number) => {
    if (!window.confirm('Delete this service category?')) return;
    pricing.replaceStandard(pricing.standardRows.filter((_, i) => i !== index));
  };

  const addProduct = () => {
    const code = newPd.trim();
    if (!code) return;
    if (pricing.standardRows.some((row) => row.pd === code) || code === 'CAC') {
      alert('That product category already exists.');
      return;
    }
    pricing.replaceLabels({ ...pricing.pdLabels, [code]: newPdLabel.trim() || code });
    pricing.replaceStandard([
      ...pricing.standardRows,
      {
        pd: code,
        category: 'General',
        serviceCategory: 'Repairing/Alignment/Adjustment/Servicing',
        serviceFee: 30000,
        diagnosisFee: 15000,
      },
    ]);
    setPd(code);
    setNewPd('');
    setNewPdLabel('');
  };

  const addSubCategory = () => {
    const name = newCategory.trim();
    if (!name) return;
    if (pricing.standardRows.some((row) => row.pd === pd && row.category === name)) {
      setCategory(name);
      setNewCategory('');
      return;
    }
    pricing.replaceStandard([
      ...pricing.standardRows,
      {
        pd,
        category: name,
        serviceCategory: 'Repairing/Alignment/Adjustment/Servicing',
        serviceFee: 30000,
        diagnosisFee: 15000,
      },
    ]);
    setCategory(name);
    setNewCategory('');
  };

  const addServiceCategory = () => {
    const name = newService.trim();
    if (!name || !activeCategory) return;
    const row: StandardFeeRow = {
      pd,
      category: activeCategory,
      serviceCategory: name,
      serviceFee: Number(newServiceFee) || 0,
      diagnosisFee: newDiagnosisFee.trim() === '' ? null : Number(newDiagnosisFee),
    };
    if (pricing.standardRows.some((item) => standardRowKey(item) === standardRowKey(row))) {
      alert('That service category already exists for this product / sub-category.');
      return;
    }
    pricing.replaceStandard([...pricing.standardRows, row]);
    setNewService('');
  };

  const addCacRow = () => {
    const row: CacFeeRow = {
      pd: 'Big-RAC, CAC & VRF',
      repairGroup: newCac.repairGroup.trim() || 'General',
      jobDetail: newCac.jobDetail.trim() || newCac.repairGroup.trim(),
      series: newCac.series.trim() || null,
      capacity: newCac.capacity.trim() || null,
      customerFee: Number(newCac.customerFee) || 0,
      laborFee: null,
    };
    pricing.replaceCac([...pricing.cacRows, row]);
    setCacGroup(row.repairGroup);
    setNewCac({ ...newCac, jobDetail: '', series: '', capacity: '' });
  };

  const removeCacAt = (index: number) => {
    if (!window.confirm('Delete this CAC job?')) return;
    pricing.replaceCac(pricing.cacRows.filter((_, i) => i !== index));
  };

  const updateCacAt = (index: number, patch: Partial<CacFeeRow>) => {
    pricing.replaceCac(pricing.cacRows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          Product category → sub-category → service category and fee. Changes apply immediately on this device.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all service prices to the workbook?')) pricing.resetToWorkbook();
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500"
        >
          Reset to workbook
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['standard', 'cac'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setKind(item)}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${kind === item ? 'bg-white text-midea-blue shadow-sm' : 'text-slate-400'}`}
          >
            {item === 'standard' ? 'Standard products' : 'CAC'}
          </button>
        ))}
      </div>

      {kind === 'standard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product category</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 rounded-xl font-bold text-midea-blue outline-none"
                value={pd}
                onChange={(e) => { setPd(e.target.value); setCategory(''); }}
              >
                {pricing.productCodes.filter((code) => code !== 'CAC').map((code) => (
                  <option key={code} value={code}>{pricing.pdLabel(code)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="New code e.g. VAC" value={newPd} onChange={(e) => setNewPd(e.target.value)} />
                <input className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Label" value={newPdLabel} onChange={(e) => setNewPdLabel(e.target.value)} />
                <button type="button" onClick={addProduct} className="px-3 py-2 bg-midea-blue text-white rounded-xl text-[9px] font-black uppercase">Add</button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product sub-category</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 rounded-xl font-bold text-midea-blue outline-none"
                value={activeCategory}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="New sub-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                <button type="button" onClick={addSubCategory} className="px-3 py-2 bg-midea-blue text-white rounded-xl text-[9px] font-black uppercase">Add</button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Service category</th>
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Service fee</th>
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Diagnosis fee</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {pricing.standardRows.map((row, index) => {
                  if (row.pd !== pd || (activeCategory && row.category !== activeCategory)) return null;
                  return (
                    <tr key={index} className="border-b border-slate-50">
                      <td className="px-3 py-2">
                        <input
                          className="w-full px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold text-midea-blue"
                          value={row.serviceCategory}
                          onChange={(e) => updateStandardAt(index, { serviceCategory: e.target.value })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-28 px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold"
                          value={row.serviceFee ?? ''}
                          onChange={(e) => updateStandardAt(index, { serviceFee: e.target.value === '' ? null : Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="w-28 px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold"
                          value={row.diagnosisFee ?? ''}
                          onChange={(e) => updateStandardAt(index, { diagnosisFee: e.target.value === '' ? null : Number(e.target.value) })}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeStandardAt(index)} className="text-slate-300 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-400">No service categories yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
            <div className="md:col-span-2 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">New service category</label>
              <input className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" value={newService} onChange={(e) => setNewService(e.target.value)} placeholder="e.g. General Cleaning Service" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Service fee</label>
              <input type="number" className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" value={newServiceFee} onChange={(e) => setNewServiceFee(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase">Diagnosis</label>
                <input type="number" className="w-full px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" value={newDiagnosisFee} onChange={(e) => setNewDiagnosisFee(e.target.value)} />
              </div>
              <button type="button" onClick={addServiceCategory} className="mt-5 px-3 py-2 bg-midea-blue text-white rounded-xl">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {kind === 'cac' && (
        <>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repair group</label>
            <select className="w-full px-3 py-2 bg-slate-50 rounded-xl font-bold text-midea-blue outline-none" value={activeCacGroup} onChange={(e) => setCacGroup(e.target.value)}>
              {cacGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Job / service</th>
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Series</th>
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Capacity</th>
                  <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase">Customer fee</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {pricing.cacRows.map((row, index) => {
                  if (activeCacGroup && row.repairGroup !== activeCacGroup) return null;
                  return (
                    <tr key={index} className="border-b border-slate-50">
                      <td className="px-3 py-2">
                        <input className="w-full px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold" value={row.jobDetail || ''} onChange={(e) => updateCacAt(index, { jobDetail: e.target.value })} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-full px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold" value={row.series || ''} onChange={(e) => updateCacAt(index, { series: e.target.value || null })} />
                      </td>
                      <td className="px-3 py-2">
                        <input className="w-full px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold" value={row.capacity || ''} onChange={(e) => updateCacAt(index, { capacity: e.target.value || null })} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" className="w-28 px-2 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold" value={row.customerFee ?? ''} onChange={(e) => updateCacAt(index, { customerFee: e.target.value === '' ? null : Number(e.target.value) })} />
                      </td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => removeCacAt(index)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Repair group" value={newCac.repairGroup} onChange={(e) => setNewCac({ ...newCac, repairGroup: e.target.value })} />
            <input className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Job / service" value={newCac.jobDetail} onChange={(e) => setNewCac({ ...newCac, jobDetail: e.target.value })} />
            <input className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Series" value={newCac.series} onChange={(e) => setNewCac({ ...newCac, series: e.target.value })} />
            <input className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Capacity" value={newCac.capacity} onChange={(e) => setNewCac({ ...newCac, capacity: e.target.value })} />
            <div className="flex gap-2">
              <input type="number" className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold" placeholder="Fee" value={newCac.customerFee} onChange={(e) => setNewCac({ ...newCac, customerFee: e.target.value })} />
              <button type="button" onClick={addCacRow} className="px-3 py-2 bg-midea-blue text-white rounded-xl"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">{formatKyats(null)} empty diagnosis is allowed. CAC uses customer fee only.</p>
        </>
      )}
    </div>
  );
}
