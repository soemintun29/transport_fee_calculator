import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { cacFeeRows, standardFeeRows, workbookUpdated, type CacFeeRow, type StandardFeeRow } from '../data/servicePricing';
import {
  PD_LABELS,
  STANDARD_PD_ORDER,
  cacRowKey,
  formatKyats,
  optionize,
  standardRowKey,
  standardRowsForPd,
  uniqueInOrder,
} from '../lib/serviceCharge';

type ChargeVariant = 'service' | 'diagnosis';

interface Props {
  transportFee: number | null;
}

export default function ServiceChargePanel({ transportFee }: Props) {
  const [product, setProduct] = useState<string>('RAC');
  const [productSearch, setProductSearch] = useState(PD_LABELS.RAC);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [category, setCategory] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [variant, setVariant] = useState<ChargeVariant>('service');

  const [cacGroup, setCacGroup] = useState('');
  const [cacJob, setCacJob] = useState('');
  const [cacSeries, setCacSeries] = useState('');
  const [cacCapacity, setCacCapacity] = useState('');
  const [cacCart, setCacCart] = useState<CacFeeRow[]>([]);

  const isCac = product === 'CAC';

  const pdOptions = useMemo(
    () => [
      ...STANDARD_PD_ORDER.filter((pd) => standardFeeRows.some((row) => row.pd === pd)),
      'CAC',
    ],
    [],
  );

  const productLabel = PD_LABELS[product] || product;
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    const showAll = !query || query === productLabel.toLowerCase();
    if (showAll) return pdOptions;
    return pdOptions.filter((pd) => {
      const label = (PD_LABELS[pd] || pd).toLowerCase();
      return label.includes(query) || pd.toLowerCase().includes(query);
    });
  }, [pdOptions, productLabel, productSearch]);

  const scopedRows = useMemo(() => standardRowsForPd(standardFeeRows, product), [product]);
  const categoryOptions = useMemo(
    () => uniqueInOrder(scopedRows.filter((row) => row.pd === product).map((row) => row.category)),
    [product, scopedRows],
  );

  const serviceRows = useMemo(() => {
    const inCategory = scopedRows.filter((row) => row.pd === product && row.category === category);
    const globalRows = product === 'All' ? [] : scopedRows.filter((row) => row.pd === 'All');
    return [...inCategory, ...globalRows];
  }, [category, product, scopedRows]);

  const selectedStandard = useMemo(
    () => serviceRows.filter((row) => selectedKeys.includes(standardRowKey(row))),
    [selectedKeys, serviceRows],
  );

  const cacGroups = useMemo(() => uniqueInOrder(cacFeeRows.map((row) => row.repairGroup)), []);
  const cacJobs = useMemo(
    () => uniqueInOrder(cacFeeRows.filter((row) => row.repairGroup === cacGroup).map((row) => optionize(row.jobDetail))),
    [cacGroup],
  );
  const cacSeriesOptions = useMemo(
    () => uniqueInOrder(
      cacFeeRows
        .filter((row) => row.repairGroup === cacGroup && optionize(row.jobDetail) === cacJob)
        .map((row) => optionize(row.series)),
    ),
    [cacGroup, cacJob],
  );
  const cacCapacityOptions = useMemo(
    () => uniqueInOrder(
      cacFeeRows
        .filter((row) => row.repairGroup === cacGroup && optionize(row.jobDetail) === cacJob && optionize(row.series) === cacSeries)
        .map((row) => optionize(row.capacity)),
    ),
    [cacGroup, cacJob, cacSeries],
  );

  const selectedCacRow = useMemo(
    () => cacFeeRows.find(
      (row) => row.repairGroup === cacGroup
        && optionize(row.jobDetail) === cacJob
        && optionize(row.series) === cacSeries
        && optionize(row.capacity) === cacCapacity,
    ) ?? null,
    [cacCapacity, cacGroup, cacJob, cacSeries],
  );

  useEffect(() => {
    setSelectedKeys([]);
    setVariant('service');
    setCacCart([]);
  }, [product]);

  useEffect(() => {
    if (!isCac) {
      if (!categoryOptions.includes(category)) {
        setCategory(categoryOptions[0] || '');
        setSelectedKeys([]);
      }
    }
  }, [category, categoryOptions, isCac]);

  useEffect(() => {
    if (!isCac) return;
    if (!cacGroups.includes(cacGroup)) setCacGroup(cacGroups[0] || '');
  }, [cacGroup, cacGroups, isCac]);

  useEffect(() => {
    if (!isCac) return;
    if (!cacJobs.includes(cacJob)) setCacJob(cacJobs[0] || '');
  }, [cacJob, cacJobs, isCac]);

  useEffect(() => {
    if (!isCac) return;
    if (!cacSeriesOptions.includes(cacSeries)) setCacSeries(cacSeriesOptions[0] || '');
  }, [cacSeries, cacSeriesOptions, isCac]);

  useEffect(() => {
    if (!isCac) return;
    if (!cacCapacityOptions.includes(cacCapacity)) setCacCapacity(cacCapacityOptions[0] || '');
  }, [cacCapacity, cacCapacityOptions, isCac]);

  const toggleService = (row: StandardFeeRow) => {
    const key = standardRowKey(row);
    setSelectedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const addCacJob = () => {
    if (!selectedCacRow) return;
    const key = cacRowKey(selectedCacRow);
    if (cacCart.some((row) => cacRowKey(row) === key)) return;
    setCacCart((current) => [...current, selectedCacRow]);
  };

  const standardLines = selectedStandard.map((row) => {
    const amount = variant === 'diagnosis' ? row.diagnosisFee : row.serviceFee;
    return { row, amount, skipped: amount == null };
  });
  const standardTotal = standardLines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  const cacTotal = cacCart.reduce((sum, row) => sum + (row.customerFee ?? 0), 0);
  const serviceTotal = isCac ? cacTotal : standardTotal;
  const grand = (serviceTotal || 0) + (transportFee ?? 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
              <Wrench className="w-4 h-4 text-midea-blue" />
            </div>
            <div>
              <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Service charge</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Workbook {workbookUpdated}</p>
            </div>
          </div>

          <div className="space-y-2 relative">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. Product category</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 transition-all font-bold text-midea-blue"
                placeholder="Search product (RAC, laundry, CAC…)"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setShowProductDropdown(false);
                    setProductSearch(PD_LABELS[product] || product);
                  }, 150);
                }}
              />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
            </div>
            {showProductDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-64 overflow-y-auto">
                {filteredProducts.map((pd) => (
                  <button
                    key={pd}
                    type="button"
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 last:border-0 ${
                      product === pd ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setProduct(pd);
                      setProductSearch(PD_LABELS[pd] || pd);
                      setShowProductDropdown(false);
                    }}
                  >
                    <span className="block font-bold text-midea-blue">{PD_LABELS[pd] || pd}</span>
                    <span className="block text-[10px] uppercase tracking-widest text-slate-400 mt-0.5">{pd}</span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="px-4 py-3 text-slate-400 text-sm">No product matches.</div>
                )}
              </div>
            )}
          </div>

          {!isCac ? (
            <>
              <Field label="2. Sub-category">
                <select
                  className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 font-bold text-midea-blue"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSelectedKeys([]);
                  }}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">3. Service category (multiple)</p>
                <div className="space-y-2">
                  {serviceRows.map((row) => {
                    const key = standardRowKey(row);
                    const checked = selectedKeys.includes(key);
                    const blocked = variant === 'diagnosis' && row.diagnosisFee == null;
                    const extra = row.pd === 'All' && product !== 'All';
                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer ${
                          checked ? 'border-midea-blue bg-blue-50' : 'border-slate-100 bg-slate-50'
                        } ${blocked ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          disabled={blocked}
                          onChange={() => toggleService(row)}
                        />
                        <span className="flex-1">
                          <span className="block text-xs font-bold text-midea-blue">{row.serviceCategory}</span>
                          {extra && <span className="block text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">All products · PCB</span>}
                          <span className="block text-[10px] text-slate-500 mt-1">
                            Service {formatKyats(row.serviceFee)}
                            {row.diagnosisFee != null ? ` · Diagnosis ${formatKyats(row.diagnosisFee)}` : ' · No diagnosis fee'}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Charge type</p>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  {(['service', 'diagnosis'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVariant(item)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        variant === item ? 'bg-white text-midea-blue shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      {item === 'service' ? 'Service fee' : 'Diagnosis fee'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Default is Service fee. Diagnosis applies only where the workbook has a diagnosis amount.</p>
              </div>
            </>
          ) : (
            <>
              <Field label="2. Repair group">
                <select className={selectClass} value={cacGroup} onChange={(e) => setCacGroup(e.target.value)}>
                  {cacGroups.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field label="3. Job detail">
                <select className={selectClass} value={cacJob} onChange={(e) => setCacJob(e.target.value)}>
                  {cacJobs.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              {!(cacSeriesOptions.length === 1 && cacSeriesOptions[0] === 'General') && (
              <Field label="Series / structure">
                <select className={selectClass} value={cacSeries} onChange={(e) => setCacSeries(e.target.value)}>
                  {cacSeriesOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              )}
              {cacCapacityOptions.length > 0 && !(cacCapacityOptions.length === 1 && cacCapacityOptions[0] === 'General') && (
                <Field label="Capacity / spec">
                  <select className={selectClass} value={cacCapacity} onChange={(e) => setCacCapacity(e.target.value)}>
                    {cacCapacityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </Field>
              )}

              {selectedCacRow && (
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
                  <p className="text-sm font-black text-midea-blue">{formatKyats(selectedCacRow.customerFee)}</p>
                  <p className="text-[10px] text-slate-400">Labor reference {formatKyats(selectedCacRow.laborFee)} · customer column is the charge</p>
                  <button
                    type="button"
                    onClick={addCacJob}
                    className="w-full py-3 bg-midea-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add this job
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <section className="bg-midea-blue text-white rounded-3xl shadow-2xl p-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-midea-light-blue mb-2 block">
            {isCac ? 'CAC customer charge' : variant === 'diagnosis' ? 'Diagnosis total' : 'Service total'}
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-5xl font-black">{serviceTotal.toLocaleString()}</h3>
            <span className="text-xl font-bold opacity-50 uppercase tracking-widest">Ks</span>
          </div>
          {transportFee != null && (
            <div className="mt-6 pt-6 border-t border-white/10 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Transport {formatKyats(transportFee)}</p>
              <p className="text-lg font-black">Grand total {grand.toLocaleString()} Ks</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-3">
          <div className="flex items-center gap-2 text-midea-blue">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest">Selected jobs</h3>
          </div>
          {!isCac && standardLines.length === 0 && <p className="text-sm text-slate-400">Tick one or more service categories.</p>}
          {!isCac && standardLines.map(({ row, amount, skipped }) => (
            <div key={standardRowKey(row)} className="flex justify-between gap-4 border-b border-slate-50 py-2">
              <p className="text-xs font-bold text-slate-700">{row.serviceCategory}</p>
              <p className="text-xs font-black text-midea-blue">{skipped ? 'No diagnosis fee' : formatKyats(amount)}</p>
            </div>
          ))}
          {isCac && cacCart.length === 0 && <p className="text-sm text-slate-400">Add one or more CAC jobs. Layout follows the commercial sheet.</p>}
          {isCac && cacCart.map((row) => (
            <div key={cacRowKey(row)} className="flex justify-between gap-4 border-b border-slate-50 py-2">
              <div>
                <p className="text-xs font-bold text-slate-700">{row.repairGroup}</p>
                <p className="text-[10px] text-slate-400">{row.jobDetail} · {optionize(row.series)}{row.capacity ? ` · ${row.capacity}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-black text-midea-blue">{formatKyats(row.customerFee)}</p>
                <button type="button" onClick={() => setCacCart((current) => current.filter((item) => cacRowKey(item) !== cacRowKey(row)))} className="text-slate-300 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-400 pt-2">
            Parts + service warranty: all charges FOC. Service warranty only: service FOC, transport still charged. User fault: all charges apply.
          </p>
        </section>
      </div>
    </div>
  );
}

const selectClass = 'w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 font-bold text-midea-blue';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );
}
