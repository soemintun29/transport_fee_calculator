import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Calculator, Settings, Info, Navigation, AlertCircle, ChevronDown, CheckCircle2, Save, User, Hash, Calendar, Wrench } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from './lib/supabase';
import { geocodeAddress, Location } from './lib/geocoding';
import { getDrivingDistance, RouteResult } from './lib/routing';
import { calculateHaversineDistance } from './lib/utils';
import {
  DEFAULT_SERVICE_CENTERS,
  addressFor,
  applyAddresses,
  mergeServiceConfig,
  defaultMapCenter,
  newBranchTemplate,
  saveCenterAddress,
  type ServiceCenterConfig,
} from './lib/serviceCenters';
import ProductSearch from './components/ProductSearch';
import FeeSummary from './components/FeeSummary';
import ServiceCategoryDialog from './components/ServiceCategoryDialog';
import SettingsPanel from './components/SettingsPanel';
import { usePricing } from './context/PricingContext';
import { appendServiceFeeLog, appendTransportLog } from './lib/feeLogs';
import {
  lineFromCac,
  lineFromStandard,
  loadServiceJob,
  type ServiceLine,
} from './lib/serviceCharge';

// Fix Leaflet marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Ward {
  region: string;
  township: string;
  ward_en: string;
  ward_mm: string;
  lat: number;
  lng: number;
}

type Config = ServiceCenterConfig;

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

export default function App() {
  const pricing = usePricing();
  const [wards, setWards] = useState<Ward[]>([]);
  const [config, setConfig] = useState<Config[]>(() => applyAddresses(DEFAULT_SERVICE_CENTERS));
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [isSettingUnlocked, setIsSettingUnlocked] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [region, setRegion] = useState('Yangon');
  const [selectedTownship, setSelectedTownship] = useState('');
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [wardSearch, setWardSearch] = useState('');
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  const [detailedAddress, setDetailedAddress] = useState('');
  
  // Audit Form State
  const [customerName, setCustomerName] = useState('');
  const [woNumber, setWoNumber] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSavingAudit, setIsSavingAudit] = useState(false);
  const [isAuditSaved, setIsAuditSaved] = useState(false);
  
  // Result State
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<Config | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logStartDate, setLogStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [logEndDate, setLogEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [appTab, setAppTab] = useState<'call' | 'service-only'>('call');
  const [product, setProduct] = useState('RAC');
  const [category, setCategory] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceSaved, setServiceSaved] = useState(false);

  // Admin Config Editing State
  const [adminRegion, setAdminRegion] = useState('Yangon');
  const [editCenters, setEditCenters] = useState<Config[]>([]);

  useEffect(() => {
    // When the admin region changes or config loads, set up the editable list
    const active = config.filter(c => c.region === adminRegion);
    setEditCenters(active.length > 0 ? JSON.parse(JSON.stringify(active)) : []);
  }, [adminRegion, config]);

  useEffect(() => {
    if (showAdmin && !isSettingUnlocked) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [showAdmin, isSettingUnlocked]);

  const updateEditCenter = (index: number, field: keyof Config, value: string) => {
    const updated = [...editCenters];
    const fieldVal = (field === 'name' || field === 'region' || field === 'address') ? value : (value === '' ? 0 : parseFloat(value));
    updated[index] = { ...updated[index], [field]: fieldVal } as Config;
    setEditCenters(updated);
  };

  const saveConfig = async (centerToSave: Config) => {
    if (isNaN(centerToSave.center_lat) || isNaN(centerToSave.center_lng) || centerToSave.center_lat === 0 || centerToSave.center_lng === 0) {
      alert('Error: Please enter valid Latitude and Longitude coordinates.');
      return;
    }

    if (isNaN(centerToSave.base_fee) || isNaN(centerToSave.base_distance) || isNaN(centerToSave.fee_per_km)) {
      alert('Error: Please enter valid numbers for the fees and distances.');
      return;
    }

    try {
      // Remove 'id' if it exists to allow upsert matching purely on region/name
      const { id, address, ...dataToSave } = centerToSave;
      saveCenterAddress(centerToSave.region, centerToSave.name, address || '');
      
      const { error } = await supabase
        .from('service_config')
        .upsert(dataToSave, { onConflict: 'region,name' });
      
      if (error) throw error;
      
      // Reload from Supabase to get real IDs back
      const { data } = await supabase.from('service_config').select('*');
      setConfig(applyAddresses(mergeServiceConfig((data || []) as Config[])));
      
      alert(`Settings for ${centerToSave.name} saved successfully!`);
    } catch (err: any) {
      alert('Error saving to DB: ' + err.message);
    }
  };

  const deleteConfig = async (center: Config) => {
    if (!center.id) return; // Cannot delete if it doesn't have an ID in DB yet
    const confirmDelete = window.confirm(`Are you sure you want to delete ${center.name}?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('service_config').delete().eq('id', center.id);
      if (error) throw error;
      
      const { data } = await supabase.from('service_config').select('*');
      setConfig(applyAddresses(mergeServiceConfig((data || []) as Config[])));
      alert('Branch deleted successfully.');
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const addNewCenter = () => {
    setEditCenters([...editCenters, newBranchTemplate(adminRegion)]);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Load Ward Data
        const wardsRes = await fetch('/wards_data.json');
        if (wardsRes.ok) {
          const wardsData = await wardsRes.json();
          setWards(wardsData);
        }

        // Try to Load Custom Config from Supabase
        const { data: configData } = await supabase
          .from('service_config')
          .select('*');
        
        setConfig(applyAddresses(mergeServiceConfig((configData || []) as Config[])));

        // Check Admin Role (Temporarily allowing all authenticated users to see settings for setup)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAdmin(true); // Temporary: Enable for all logged in users
        }
      } catch (err: any) {
        console.warn('Init warning (ignoring to use defaults):', err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSettingsToggle = () => {
    if (showAdmin) {
      setShowAdmin(false);
      setIsSettingUnlocked(false);
      setSettingsPassword('');
    } else {
      setShowAdmin(true);
    }
  };

  const handleUnlockSettings = () => {
    // Basic password protection as requested
    if (settingsPassword === 'midea2026') {
      setIsSettingUnlocked(true);
      setError(null);
    } else {
      alert('Incorrect Password');
    }
  };

  const townships = Array.from(new Set(wards.filter(w => w.region === region).map(w => w.township))).sort();
  const availableWards = wards.filter(w => w.region === region && w.township === selectedTownship).sort((a, b) => a.ward_en.localeCompare(b.ward_en));

  const handleCalculate = async () => {
    if (!selectedTownship) {
      alert('Please select a Township');
      return;
    }

    setIsCalculating(true);
    setCalculatedFee(null);
    setRoute(null);
    setCustomerLocation(null);
    setIsAuditSaved(false);

    let finalLocation: Location | null = null;

    // STRATEGY 1: Strict MIMU Ward Priority
    if (selectedWard) {
      finalLocation = { 
        lat: selectedWard.lat, 
        lng: selectedWard.lng, 
        name: `Ward Center: ${selectedWard.ward_en}`, 
        source: 'MIMU Database (Strict)' 
      };
    } 
    // STRATEGY 2: Geocoding Fallback
    else if (detailedAddress.trim() !== '') {
      const myanmarSearch = `${detailedAddress} ${selectedTownship}`;
      const englishSearch = `${selectedTownship}, ${region}, Myanmar`;
      const geocoded = await geocodeAddress(myanmarSearch, englishSearch);
      if (geocoded) {
        const tsWards = wards.filter(w => w.region === region && w.township === selectedTownship);
        const avgLat = tsWards.reduce((s, w) => s + w.lat, 0) / tsWards.length;
        const avgLng = tsWards.reduce((s, w) => s + w.lng, 0) / tsWards.length;
        const driftDist = calculateHaversineDistance(avgLat, avgLng, geocoded.lat, geocoded.lng);
        if (driftDist <= 10) finalLocation = geocoded;
      }
    }

    // STRATEGY 3: Ultimate Fallback
    if (!finalLocation) {
      const tsWards = wards.filter(w => w.region === region && w.township === selectedTownship);
      const avgLat = tsWards.reduce((s, w) => s + w.lat, 0) / tsWards.length;
      const avgLng = tsWards.reduce((s, w) => s + w.lng, 0) / tsWards.length;
      finalLocation = { 
        lat: avgLat, 
        lng: avgLng, 
        name: `Township Center: ${selectedTownship}`, 
        source: 'MIMU Database (Approximate)' 
      };
    }

    setCustomerLocation(finalLocation);

    const activeCenters = config.filter(c => c.region === region);
    if (activeCenters.length === 0) {
      alert('No service centers configured for this region.');
      setIsCalculating(false);
      return;
    }

    const customer: [number, number] = [Number(finalLocation.lat), Number(finalLocation.lng)];
    
    // SPEED OPTIMIZATION: Instead of fetching routes from ALL centers (which is slow),
    // we find the nearest center by straight-line distance first.
    let bestCenterByAir: Config = activeCenters[0];
    let minAirDist = Infinity;
    
    for (const center of activeCenters) {
      const airDist = calculateHaversineDistance(Number(center.center_lat), Number(center.center_lng), customer[0], customer[1]);
      if (airDist < minAirDist) {
        minAirDist = airDist;
        bestCenterByAir = center;
      }
    }

    // Now only fetch the REAL road route for the single nearest center
    const sc: [number, number] = [Number(bestCenterByAir.center_lat), Number(bestCenterByAir.center_lng)];
    const routeData = await getDrivingDistance(sc, customer);

    if (routeData && !('error' in routeData)) {
      const bestRoute = routeData as RouteResult;
      setRoute(bestRoute);
      setSelectedCenter(bestCenterByAir);
      const baseFee = bestCenterByAir.base_fee;
      const baseDist = bestCenterByAir.base_distance;
      const rateKm = bestCenterByAir.fee_per_km;

      const excessDist = Math.max(0, bestRoute.distanceKm - baseDist);
      const fee = baseFee + (excessDist * rateKm);
      setCalculatedFee(Math.round(fee / 1000) * 1000);
      setShowMap(true);
      
      // Removed the blocking alert for MIMU database to improve perceived speed.
      // The user is already instructed in the UI to drag the pin for exact location.
    } else {
      setShowMap(true);
      // We don't alert here either, we just show the fallback result
    }
    setIsCalculating(false);
  };

  const handleManualPinMove = async (lat: number, lng: number) => {
    const activeCenters = config.filter(c => c.region === region);
    if (activeCenters.length === 0) return;

    setCustomerLocation({ lat, lng, name: '[Manual Pin]' });
    
    const customer: [number, number] = [lat, lng];

    // Find nearest center by air distance first
    let bestCenterByAir: Config = activeCenters[0];
    let minAirDist = Infinity;
    for (const center of activeCenters) {
      const airDist = calculateHaversineDistance(Number(center.center_lat), Number(center.center_lng), lat, lng);
      if (airDist < minAirDist) {
        minAirDist = airDist;
        bestCenterByAir = center;
      }
    }

    const sc: [number, number] = [Number(bestCenterByAir.center_lat), Number(bestCenterByAir.center_lng)];
    const routeData = await getDrivingDistance(sc, customer);

    if (routeData && !('error' in routeData)) {
      const bestRoute = routeData as RouteResult;
      setRoute(bestRoute);
      setSelectedCenter(bestCenterByAir);
      const baseFee = bestCenterByAir.base_fee;
      const baseDist = bestCenterByAir.base_distance;
      const rateKm = bestCenterByAir.fee_per_km;
      setCalculatedFee(Math.round((baseFee + (Math.max(0, bestRoute.distanceKm - baseDist) * rateKm)) / 1000) * 1000);
    }
  };

  useEffect(() => {
    if (product === 'CAC') return;
    const options = pricing.categoriesFor(product);
    if (!options.includes(category)) {
      setCategory(options[0] || '');
    }
  }, [product, category, pricing]);

  const seedDefaultService = (pd = product, cat = category) => {
    const line = pricing.defaultLine(pd, cat);
    setServiceLines(line ? [line] : []);
  };

  const handleProductChange = (pd: string) => {
    setProduct(pd);
    setServiceSaved(false);
    if (pd === 'CAC') {
      setCategory('');
      if (serviceOpen) seedDefaultService(pd, '');
      else setServiceLines([]);
      return;
    }
    const nextCat = pricing.categoriesFor(pd)[0] || '';
    setCategory(nextCat);
    if (serviceOpen) seedDefaultService(pd, nextCat);
    else setServiceLines([]);
  };

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    setServiceSaved(false);
    if (serviceOpen) seedDefaultService(product, next);
  };

  const continueToService = () => {
    const cat = product === 'CAC' ? '' : (category || pricing.categoriesFor(product)[0] || '');
    if (product !== 'CAC' && cat !== category) setCategory(cat);
    setServiceOpen(true);
    setServiceSaved(false);
    seedDefaultService(product, cat);
  };

  const openServiceOnly = () => {
    const cat = product === 'CAC' ? '' : (category || pricing.categoriesFor(product)[0] || '');
    if (product !== 'CAC' && cat !== category) setCategory(cat);
    setAppTab('service-only');
    setServiceOpen(true);
    setServiceSaved(false);
    setServiceLines((current) => {
      if (current.length) return current;
      const line = pricing.defaultLine(product, cat);
      return line ? [line] : [];
    });
  };

  const addStandardLine = (row: Parameters<typeof lineFromStandard>[0]) => {
    const line = lineFromStandard(row, 'service');
    if (!line) return;
    setServiceSaved(false);
    setServiceLines((current) => (current.some((item) => item.key === line.key) ? current : [...current, line]));
  };

  const addCacLine = (row: Parameters<typeof lineFromCac>[0]) => {
    const line = lineFromCac(row);
    if (!line) return;
    setServiceSaved(false);
    setServiceLines((current) => (current.some((item) => item.key === line.key) ? current : [...current, line]));
  };

  const toggleLineChargeType = (id: string) => {
    setServiceLines((current) => current.map((line) => {
      if (line.id !== id) return line;
      const nextType = line.chargeType === 'service' ? 'diagnosis' : 'service';
      const amount = nextType === 'diagnosis' ? line.diagnosisFee : line.serviceFee;
      if (amount == null) return line;
      return { ...line, chargeType: nextType, amount };
    }));
    setServiceSaved(false);
  };

  const lookupWorkOrder = async () => {
    if (!woNumber.trim()) {
      alert('Enter a work order number to check.');
      return;
    }
    const saved = loadServiceJob(woNumber);
    if (saved) {
      setCustomerName(saved.customerName);
      setProduct(saved.product);
      setCategory(saved.category);
      setServiceLines(saved.lines);
      setServiceOpen(true);
      if (saved.transportFee != null) setCalculatedFee(saved.transportFee);
    }
    try {
      const { data } = await supabase
        .from('transport_audit_log')
        .select('*')
        .eq('wo_number', woNumber.trim())
        .order('created_at', { ascending: false })
        .limit(1);
      const row = data?.[0];
      if (row) {
        setCustomerName(row.customer_name || '');
        setCalculatedFee(row.agreed_fee ?? null);
        if (row.scheduled_date) setScheduledDate(row.scheduled_date);
      }
    } catch {
      /* lookup is optional */
    }
    setServiceOpen(true);
    if (!saved) seedDefaultService();
  };

  const handleSaveService = () => {
    if (!woNumber.trim()) {
      alert('Work order number is required to save the service fee.');
      return;
    }
    if (!customerName.trim()) {
      alert('Customer name is required.');
      return;
    }
    if (serviceLines.length === 0) {
      alert('Add at least one service category, or keep the default line.');
      return;
    }
    setIsSavingService(true);
    try {
      appendServiceFeeLog({
        woNumber: woNumber.trim(),
        customerName: customerName.trim(),
        product,
        category,
        lines: serviceLines,
        transportFee: calculatedFee,
        savedAt: new Date().toISOString(),
      });
      setServiceSaved(true);
    } finally {
      setIsSavingService(false);
    }
  };

  const startNewCall = () => {
    setCalculatedFee(null);
    setRoute(null);
    setCustomerLocation(null);
    setIsAuditSaved(false);
    setServiceSaved(false);
    setServiceOpen(false);
    setServiceLines([]);
    setCustomerName('');
    setWoNumber('');
    setScheduledDate('');
    setSelectedTownship('');
    setSelectedWard(null);
    setWardSearch('');
    setDetailedAddress('');
    setShowMap(false);
    setAddServiceOpen(false);
    if (appTab === 'service-only') {
      setServiceOpen(true);
      seedDefaultService();
    }
  };

  const handleSaveAudit = async () => {
    if (!customerName || !woNumber.trim() || !product || !calculatedFee || !selectedCenter || !route || !customerLocation) {
      alert('Customer name, work order number, product and transport fee are required.');
      return;
    }

    setIsSavingAudit(true);
    try {
      const { error } = await supabase
        .from('transport_audit_log')
        .insert({
          customer_name: customerName,
          customer_address: `${detailedAddress || 'N/A'}, ${selectedTownship}, ${region} [${pricing.pdLabel(product)}]`,
          wo_number: woNumber.trim(),
          agreed_fee: calculatedFee,
          vehicle_type: 'car',
          service_center_name: selectedCenter.name,
          distance_km: route.distanceKm,
          scheduled_date: scheduledDate || null
        });

      appendTransportLog({
        createdAt: new Date().toISOString(),
        customerName,
        customerAddress: `${detailedAddress || 'N/A'}, ${selectedTownship}, ${region}`,
        woNumber: woNumber.trim(),
        transportFee: calculatedFee,
        serviceCenterName: selectedCenter.name,
        serviceCenterAddress: addressFor(selectedCenter),
        serviceCenterLat: selectedCenter.center_lat,
        serviceCenterLng: selectedCenter.center_lng,
        distanceKm: route.distanceKm,
        scheduledDate: scheduledDate || null,
        region,
      });

      if (error) throw error;
      setIsAuditSaved(true);
      fetchAuditLogs();
    } catch (err: any) {
      alert('Error saving record: ' + err.message);
    } finally {
      setIsSavingAudit(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const start = `${logStartDate}T00:00:00`;
      const end = `${logEndDate}T23:59:59`;

      const { data, error } = await supabase
        .from('transport_audit_log')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err.message);
    }
  };

  useEffect(() => {
    if (isSettingUnlocked) {
      fetchAuditLogs();
    }
  }, [isSettingUnlocked, logStartDate, logEndDate]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-midea-blue/10 border-t-midea-blue rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black text-midea-blue uppercase tracking-widest">Loading Geospatial Data...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-midea-blue text-white shadow-lg sticky top-0 z-[1000]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-inner">
              <Navigation className="w-5 h-5 text-midea-blue fill-current" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter block leading-none">Midea</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-midea-light-blue">After-sales fees</span>
            </div>
            <div className="hidden sm:flex ml-4 bg-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAppTab('call')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${appTab === 'call' ? 'bg-white text-midea-blue' : 'text-midea-light-blue'}`}
              >
                <Navigation className="w-3 h-3" />
                Customer call
              </button>
              <button
                type="button"
                onClick={openServiceOnly}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${appTab === 'service-only' ? 'bg-white text-midea-blue' : 'text-midea-light-blue'}`}
              >
                <Wrench className="w-3 h-3" />
                Service fee only
              </button>
            </div>
          </div>
          <button 
            onClick={handleSettingsToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${showAdmin ? 'bg-white text-midea-blue shadow-lg' : 'hover:bg-white/10 text-midea-light-blue'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="sm:hidden flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-4">
          <button type="button" onClick={() => setAppTab('call')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${appTab === 'call' ? 'bg-midea-blue text-white' : 'text-slate-400'}`}>Call</button>
          <button type="button" onClick={openServiceOnly} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${appTab === 'service-only' ? 'bg-midea-blue text-white' : 'text-slate-400'}`}>Service only</button>
        </div>
        {showAdmin && (
          <section className="bg-white rounded-3xl shadow-xl border-2 border-midea-light-blue/20 p-8 mb-8 animate-in slide-in-from-top-4 duration-300">
            <SettingsPanel
              passwordInputRef={passwordInputRef}
              settingsPassword={settingsPassword}
              setSettingsPassword={setSettingsPassword}
              isSettingUnlocked={isSettingUnlocked}
              onUnlock={handleUnlockSettings}
              adminRegion={adminRegion}
              setAdminRegion={setAdminRegion}
              editCenters={editCenters}
              updateEditCenter={updateEditCenter}
              saveConfig={saveConfig}
              deleteConfig={deleteConfig}
              addNewCenter={addNewCenter}
              auditLogs={auditLogs}
              logStartDate={logStartDate}
              logEndDate={logEndDate}
              setLogStartDate={setLogStartDate}
              setLogEndDate={setLogEndDate}
              isExporting={isExporting}
              centers={config}
            />
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Form */}
        <div className="lg:col-span-5 space-y-6">
          {appTab === 'service-only' && (
            <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
              <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Service fee only</h2>
              <p className="text-xs text-slate-500">Check an existing work order or create a service fee without transport.</p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work order number</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-midea-blue/20"
                    placeholder="WO-2026-0501"
                    value={woNumber}
                    onChange={(e) => { setWoNumber(e.target.value); setServiceSaved(false); }}
                  />
                  <button type="button" onClick={lookupWorkOrder} className="px-4 py-3 bg-midea-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Check</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer name</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-slate-700 outline-none" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <ProductSearch value={product} onChange={handleProductChange} />
              {product !== 'CAC' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub-category</label>
                  <select className="w-full px-4 py-4 bg-slate-50 rounded-2xl font-bold text-midea-blue outline-none" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                    {pricing.categoriesFor(product).map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              )}
            </section>
          )}

          {appTab === 'call' && (
          <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <MapPin className="w-4 h-4 text-midea-blue" />
              </div>
              <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Customer Location</h2>
            </div>

            {/* Region Select */}
            <div className="grid grid-cols-2 gap-2">
              {['Yangon', 'Mandalay'].map(r => (
                <button
                  key={r}
                  onClick={() => { 
                    setRegion(r); 
                    setSelectedTownship(''); 
                    setSelectedWard(null);
                    setWardSearch('');
                    setCalculatedFee(null);
                    setRoute(null);
                    setCustomerLocation(null);
                  }}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    region === r 
                    ? 'bg-midea-blue text-white shadow-lg' 
                    : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Township Search */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Township</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 transition-all font-bold text-midea-blue appearance-none"
                  value={selectedTownship}
                  onChange={(e) => { 
                    setSelectedTownship(e.target.value); 
                    setSelectedWard(null);
                    setWardSearch('');
                  }}
                >
                  <option value="">Select Township...</option>
                  {townships.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {/* Ward Select */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ward / Village (Optional)</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 transition-all font-bold text-midea-blue"
                  placeholder="Search Ward..."
                  value={wardSearch}
                  onChange={(e) => {
                    setWardSearch(e.target.value);
                    setShowWardDropdown(true);
                    const matched = availableWards.find(w => w.ward_en === e.target.value || w.ward_mm === e.target.value);
                    setSelectedWard(matched || null);
                  }}
                  onFocus={() => setShowWardDropdown(true)}
                  onBlur={() => setTimeout(() => setShowWardDropdown(false), 200)}
                />
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
              </div>
              
              {showWardDropdown && availableWards.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                  {availableWards
                    .filter(w => w.ward_en.toLowerCase().includes(wardSearch.toLowerCase()) || w.ward_mm.includes(wardSearch))
                    .map(w => (
                      <div 
                        key={w.ward_en}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                        onMouseDown={(e) => {
                          // use onMouseDown to fire BEFORE the input onBlur
                          e.preventDefault();
                          setSelectedWard(w);
                          setWardSearch(w.ward_en);
                          setShowWardDropdown(false);
                        }}
                      >
                        <span className="font-bold text-midea-blue">{w.ward_en}</span>
                        {w.ward_mm && <span className="ml-2 text-slate-500 text-sm">({w.ward_mm})</span>}
                      </div>
                    ))
                  }
                  {availableWards.filter(w => w.ward_en.toLowerCase().includes(wardSearch.toLowerCase()) || w.ward_mm.includes(wardSearch)).length === 0 && (
                    <div className="px-4 py-3 text-slate-400 text-sm">No wards found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Detailed Address */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Street, Apartment, Home No.</label>
              <textarea 
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-midea-blue/20 transition-all font-medium text-slate-600 h-32"
                placeholder="e.g. No. 123, 4th Street, Ward 5..."
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
              />
            </div>

            <ProductSearch value={product} onChange={handleProductChange} label="Product" />

            {serviceOpen && product !== 'CAC' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sub-category (for service fee)</label>
                <select className="w-full px-4 py-4 bg-slate-50 rounded-2xl font-bold text-midea-blue outline-none" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                  {pricing.categoriesFor(product).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            )}

            <button 
              onClick={handleCalculate}
              disabled={isCalculating || !selectedTownship}
              className="w-full py-5 bg-midea-blue text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-midea-blue/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Analyzing Location...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Calculate transport
                </>
              )}
            </button>
          </section>
          )}
        </div>

        {/* Right Panel: All fees */}
        <div className="lg:col-span-7 space-y-6">
          <FeeSummary
            transportFee={calculatedFee}
            distanceKm={route?.distanceKm}
            lines={serviceLines}
            onRemoveLine={(id) => { setServiceLines((current) => current.filter((line) => line.id !== id)); setServiceSaved(false); }}
            onToggleChargeType={toggleLineChargeType}
            onAddClick={() => setAddServiceOpen(true)}
            showAdd={serviceOpen || appTab === 'service-only'}
          />

          {(calculatedFee !== null || appTab === 'service-only') && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <Save className="w-4 h-4 text-midea-blue" />
                  </div>
                  <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Work order</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <User className="w-3 h-3" /> Customer Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-midea-blue/20 transition-all font-bold text-slate-700"
                      placeholder="e.g. U Ba"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Work Order No. *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-midea-blue/20 transition-all font-bold text-slate-700"
                      placeholder="e.g. WO-2026-0501"
                      value={woNumber}
                      onChange={(e) => { setWoNumber(e.target.value); setServiceSaved(false); }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product</label>
                    <p className="px-4 py-3 bg-slate-50 rounded-xl font-bold text-midea-blue">{pricing.pdLabel(product)}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Scheduled Date (Optional)
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-midea-blue/20 transition-all font-bold text-slate-700"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {appTab === 'call' && calculatedFee != null && (
                    <button 
                      onClick={handleSaveAudit}
                      disabled={isSavingAudit || isAuditSaved || !customerName || !woNumber.trim()}
                      className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                        isAuditSaved 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-900 text-white disabled:opacity-50'
                      }`}
                    >
                      {isSavingAudit ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : isAuditSaved ? (
                        <><CheckCircle2 className="w-4 h-4" /> Transport saved</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save transport</>
                      )}
                    </button>
                  )}
                  {appTab === 'call' && !serviceOpen && (
                    <button
                      type="button"
                      onClick={continueToService}
                      disabled={!customerName.trim() || !woNumber.trim()}
                      className="py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs bg-midea-blue text-white disabled:opacity-50"
                    >
                      Continue to service
                    </button>
                  )}
                  {(serviceOpen || appTab === 'service-only') && (
                    <button
                      type="button"
                      onClick={handleSaveService}
                      disabled={isSavingService || serviceSaved}
                      className={`py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs sm:col-span-2 ${
                        serviceSaved ? 'bg-green-500 text-white' : 'bg-midea-blue text-white disabled:opacity-50'
                      }`}
                    >
                      {serviceSaved ? 'Service fee saved for this WO' : 'Save service fee (this WO)'}
                    </button>
                  )}
                  <button type="button" onClick={startNewCall} className="py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs bg-slate-100 text-slate-500 sm:col-span-2">
                    New call
                  </button>
                </div>
              </section>
            </div>
          )}

          {appTab === 'call' && (
          <section className={`bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transition-all mt-6 ${showMap || calculatedFee ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Interactive Map</span>
              </div>
              <button 
                onClick={() => setShowMap(!showMap)}
                className="text-[9px] font-black text-midea-blue uppercase hover:underline"
              >
                {showMap ? 'Hide Details' : 'Expand View'}
              </button>
            </div>

            <div className="h-[500px] relative">
              <MapContainer 
                center={defaultMapCenter(region)} 
                zoom={12} 
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {config.map(c => (
                  <Marker key={`${c.region}-${c.name}`} position={[c.center_lat, c.center_lng]}>
                    <Popup>
                      <div className="text-[10px]">
                        <p className="font-black uppercase tracking-wide">{c.name}</p>
                        {addressFor(c) && (
                          <p className="text-slate-500 mt-0.5">{addressFor(c)}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {customerLocation && (
                  <>
                    <Marker 
                      position={[customerLocation.lat, customerLocation.lng]} 
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const position = marker.getLatLng();
                          handleManualPinMove(position.lat, position.lng);
                        },
                      }}
                    >
                      <Popup>
                        <div className="text-center p-1">
                          <p className="font-bold text-[10px] uppercase mb-1">Customer Target</p>
                          <p className="text-[8px] text-slate-400">Drag to adjust location</p>
                        </div>
                      </Popup>
                    </Marker>
                    <RecenterMap center={[customerLocation.lat, customerLocation.lng]} />
                  </>
                )}

                {route?.geometry && (
                  <Polyline 
                    positions={route.geometry.coordinates.map((c: any) => [c[1], c[0]])} 
                    color="#003b6d" 
                    weight={4}
                    opacity={0.6}
                  />
                )}
              </MapContainer>

              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 z-[999] flex items-center gap-4">
                <div className="bg-amber-50 p-2 rounded-xl text-amber-600">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">Manual Adjustment</h4>
                  <p className="text-[9px] text-slate-500 font-medium">If the address is not found, drag the <span className="text-midea-blue font-black underline">Blue Pin</span> to the exact customer location on the map.</p>
                </div>
              </div>
            </div>
          </section>
          )}

          {appTab === 'call' && !calculatedFee && !isCalculating && (
            <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Ready for Calculation</h3>
              <p className="text-[10px] text-blue-300 mt-2 max-w-xs mx-auto">Ask location and product, then click Calculate transport. Record name and work order, then save or continue to service.</p>
            </div>
          )}
        </div>
      </div>
        <ServiceCategoryDialog
          open={addServiceOpen}
          product={product}
          category={category}
          usedKeys={serviceLines.map((line) => line.key)}
          onClose={() => setAddServiceOpen(false)}
          onPickStandard={addStandardLine}
          onPickCac={addCacLine}
        />
    </main>

      {/* Footer Info */}
      <footer className="max-w-5xl mx-auto p-8 border-t border-slate-100 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3 h-3 text-slate-400" />
          <span className="text-[8px] font-black uppercase tracking-widest">Calculation based on OSRM Real-Time Routing Engine</span>
        </div>
        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
          © 2026 VSK Group • Midea Myanmar After-Sales Service
        </div>
      </footer>
    </div>
  );
}
