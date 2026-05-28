import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Calculator, Settings, Info, Navigation, AlertCircle, ChevronDown, CheckCircle2, Save, User, Hash, Calendar, Download, FileSpreadsheet } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from './lib/supabase';
import { geocodeAddress, Location } from './lib/geocoding';
import { getDrivingDistance, RouteResult } from './lib/routing';
import { calculateHaversineDistance } from './lib/utils';

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

interface Config {
  id?: string;
  region: string;
  name: string;
  center_lat: number;
  center_lng: number;
  base_fee: number;
  base_distance: number;
  fee_per_km: number;
  bike_base_fee: number;
  bike_base_distance: number;
  bike_fee_per_km: number;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

export default function App() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [config, setConfig] = useState<Config[]>([
    { name: 'Yangon Main SC', region: 'Yangon', center_lat: 16.8661, center_lng: 96.1951, base_fee: 5000, base_distance: 5, fee_per_km: 1000, bike_base_fee: 3000, bike_base_distance: 5, bike_fee_per_km: 500 },
    { name: 'Mandalay Main SC', region: 'Mandalay', center_lat: 21.9588, center_lng: 96.0891, base_fee: 5000, base_distance: 5, fee_per_km: 1000, bike_base_fee: 3000, bike_base_distance: 5, bike_fee_per_km: 500 }
  ]);
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
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  
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
  const [isExporting, setIsExporting] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

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
    const fieldVal = (field === 'name' || field === 'region') ? value : (value === '' ? 0 : parseFloat(value));
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
      const { id, ...dataToSave } = centerToSave;
      
      const { error } = await supabase
        .from('service_config')
        .upsert(dataToSave, { onConflict: 'region,name' });
      
      if (error) throw error;
      
      // Reload from Supabase to get real IDs back
      const { data } = await supabase.from('service_config').select('*');
      if (data) setConfig(data as Config[]);
      
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
      if (data) setConfig(data as Config[]);
      alert('Branch deleted successfully.');
    } catch (err: any) {
      alert('Error deleting: ' + err.message);
    }
  };

  const addNewCenter = () => {
    setEditCenters([...editCenters, {
      region: adminRegion,
      name: `New ${adminRegion} Branch`,
      center_lat: adminRegion === 'Yangon' ? 16.8661 : 21.9588,
      center_lng: adminRegion === 'Yangon' ? 96.1951 : 96.0891,
      base_fee: 5000,
      base_distance: 5,
      fee_per_km: 1000,
      bike_base_fee: 3000,
      bike_base_distance: 5,
      bike_fee_per_km: 500
    }]);
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
        
        if (configData && configData.length > 0) {
          setConfig(configData as Config[]);
        }

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
    setCustomerName('');
    setWoNumber('');
    setScheduledDate('');

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
      const baseFee = vehicleType === 'bike' ? bestCenterByAir.bike_base_fee : bestCenterByAir.base_fee;
      const baseDist = vehicleType === 'bike' ? bestCenterByAir.bike_base_distance : bestCenterByAir.base_distance;
      const rateKm = vehicleType === 'bike' ? bestCenterByAir.bike_fee_per_km : bestCenterByAir.fee_per_km;

      const excessDist = Math.max(0, bestRoute.distanceKm - baseDist);
      const fee = baseFee + (excessDist * rateKm);
      setCalculatedFee(Math.ceil(fee / 100) * 100);
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
      const baseFee = vehicleType === 'bike' ? bestCenterByAir.bike_base_fee : bestCenterByAir.base_fee;
      const baseDist = vehicleType === 'bike' ? bestCenterByAir.bike_base_distance : bestCenterByAir.base_distance;
      const rateKm = vehicleType === 'bike' ? bestCenterByAir.bike_fee_per_km : bestCenterByAir.fee_per_km;
      setCalculatedFee(Math.ceil((baseFee + (Math.max(0, bestRoute.distanceKm - baseDist) * rateKm)) / 100) * 100);
    }
  };

  const handleSaveAudit = async () => {
    if (!customerName || !calculatedFee || !selectedCenter || !route || !customerLocation) return;

    setIsSavingAudit(true);
    try {
      const { error } = await supabase
        .from('transport_audit_log')
        .insert({
          customer_name: customerName,
          customer_address: `${detailedAddress || 'N/A'}, ${selectedTownship}, ${region}`,
          wo_number: woNumber || null,
          agreed_fee: calculatedFee,
          vehicle_type: vehicleType,
          service_center_name: selectedCenter.name,
          distance_km: route.distanceKm,
          scheduled_date: scheduledDate || null
        });

      if (error) throw error;
      setIsAuditSaved(true);
      fetchAuditLogs(); // Refresh logs if we're in admin view

      // Reset form for next input after a brief delay to show success
      setTimeout(() => {
        setCalculatedFee(null);
        setRoute(null);
        setCustomerLocation(null);
        setIsAuditSaved(false);
        setCustomerName('');
        setWoNumber('');
        setScheduledDate('');
        setSelectedTownship('');
        setSelectedWard(null);
        setWardSearch('');
        setDetailedAddress('');
        setShowMap(false);
      }, 2000);
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

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const start = `${logStartDate}T00:00:00`;
      const end = `${logEndDate}T23:59:59`;

      const { data, error } = await supabase
        .from('transport_audit_log')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No records found for the selected date range.');
        return;
      }

      // Create CSV content
      const headers = ['Date', 'Customer Name', 'Address', 'Work Order #', 'Fee (Ks)', 'Vehicle', 'Branch', 'Distance (km)', 'Scheduled Date'];
      const csvRows = data.map(log => [
        new Date(log.created_at).toLocaleDateString(),
        `"${log.customer_name}"`,
        `"${log.customer_address}"`,
        log.wo_number || 'N/A',
        log.agreed_fee,
        log.vehicle_type,
        log.service_center_name,
        log.distance_km.toFixed(2),
        log.scheduled_date || 'N/A'
      ]);

      const csvString = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transport_audit_${logStartDate}_to_${logEndDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally {
      setIsExporting(false);
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
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-midea-light-blue">Transport Calculator</span>
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
        {showAdmin && (
          <section className="bg-white rounded-3xl shadow-xl border-2 border-midea-light-blue/20 p-8 mb-8 animate-in slide-in-from-top-4 duration-300">
            {!isSettingUnlocked ? (
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
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockSettings()}
                    className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-midea-blue/20 font-bold text-midea-blue text-center"
                  />
                  <button 
                    onClick={handleUnlockSettings}
                    className="px-6 py-3 bg-midea-blue text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-midea-light-blue transition-all"
                  >
                    Unlock
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-midea-light-blue/10 rounded-full flex items-center justify-center text-midea-blue">
                      <Settings className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Service Center Configuration</h2>
                  </div>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {['Yangon', 'Mandalay'].map(r => (
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
                          placeholder="Branch Name (e.g. Yangon Main)"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveConfig(center)} className="px-3 py-1 bg-midea-blue text-white rounded text-[8px] font-bold uppercase hover:bg-midea-light-blue transition-colors">Save</button>
                          {center.id && <button onClick={() => deleteConfig(center)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-[8px] font-bold uppercase hover:bg-red-100 transition-colors">Delete</button>}
                        </div>
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
                          <h4 className="text-[10px] font-black text-midea-blue uppercase">🚗 Car Rates</h4>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Base Fee/Dist</label>
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

                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-midea-blue uppercase">🏍️ Motorbike Rates</h4>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Base Fee/Dist</label>
                            <div className="flex gap-1">
                              <input type="number" value={center.bike_base_fee || ''} onChange={(e) => updateEditCenter(index, 'bike_base_fee', e.target.value)} className="w-2/3 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" placeholder="Ks" />
                              <input type="number" value={center.bike_base_distance || ''} onChange={(e) => updateEditCenter(index, 'bike_base_distance', e.target.value)} className="w-1/3 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" placeholder="Km" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">+ Rate per Km</label>
                            <input type="number" value={center.bike_fee_per_km || ''} onChange={(e) => updateEditCenter(index, 'bike_fee_per_km', e.target.value)} className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-bold focus:border-midea-blue outline-none" />
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

                <div className="mt-12 pt-12 border-t-2 border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-midea-blue">
                        <Save className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Recent Audit Logs</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center bg-slate-100 px-3 py-1.5 rounded-xl gap-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <input 
                          type="date" 
                          value={logStartDate} 
                          onChange={(e) => setLogStartDate(e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-slate-600 outline-none"
                        />
                        <span className="text-[10px] text-slate-300 font-black">TO</span>
                        <input 
                          type="date" 
                          value={logEndDate} 
                          onChange={(e) => setLogEndDate(e.target.value)}
                          className="bg-transparent text-[10px] font-bold text-slate-600 outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleExportCSV}
                        disabled={isExporting || auditLogs.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-50"
                      >
                        {isExporting ? (
                          <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">WO #</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Fee (Ks)</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Branch</th>
                          <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Distance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {auditLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs font-bold italic">No records found.</td>
                          </tr>
                        ) : (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-600">
                                {new Date(log.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-[10px] font-black text-midea-blue">{log.customer_name}</p>
                                <p className="text-[8px] text-slate-400 truncate max-w-[150px]">{log.customer_address}</p>
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                {log.wo_number || '—'}
                              </td>
                              <td className="px-4 py-3 text-[10px] font-black text-midea-blue">
                                {log.agreed_fee.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                {log.service_center_name}
                              </td>
                              <td className="px-4 py-3 text-[10px] font-bold text-slate-500">
                                {log.distance_km.toFixed(1)} km
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Panel: Form */}
        <div className="lg:col-span-5 space-y-6">
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

            {/* Vehicle Type Toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vehicle Type</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl">
                <button
                  onClick={() => setVehicleType('car')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    vehicleType === 'car' 
                    ? 'bg-white text-midea-blue shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🚗 Car
                </button>
                <button
                  onClick={() => setVehicleType('bike')}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    vehicleType === 'bike' 
                    ? 'bg-white text-midea-blue shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🏍️ Motorbike
                </button>
              </div>
            </div>

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
                  Calculate Fee
                </>
              )}
            </button>
          </section>
        </div>

        {/* Right Panel: Results & Map */}
        <div className="lg:col-span-7 space-y-6">
          {calculatedFee !== null && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <section className="bg-midea-blue text-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-midea-light-blue mb-2 block">Final Calculation</span>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl font-black">{calculatedFee.toLocaleString()}</h3>
                      <span className="text-xl font-bold opacity-50 uppercase tracking-widest">Ks</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-midea-light-blue mb-2">
                      <Navigation className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{route?.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Verified Routing</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Destination</span>
                    <p className="text-xs font-bold truncate">{customerLocation?.name || 'Manual Selection'}</p>
                    <span className="text-[8px] text-white/50 block mt-0.5">{customerLocation?.source || 'Manual Pin'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Travel Estimate</span>
                    <p className="text-xs font-bold">{route?.durationMins ? `${Math.ceil(route.durationMins)} mins` : 'N/A'}</p>
                  </div>
                </div>

                {/* Decorative background shape */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-midea-light-blue/20 rounded-full blur-3xl pointer-events-none" />
              </section>

              {/* Audit Log Form */}
              <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <Save className="w-4 h-4 text-midea-blue" />
                  </div>
                  <h2 className="text-sm font-black text-midea-blue uppercase tracking-widest">Finalize & Lock Fee</h2>
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
                      <Hash className="w-3 h-3" /> Work Order No. (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-midea-blue/20 transition-all font-bold text-slate-700"
                      placeholder="e.g. WO-2026-0501"
                      value={woNumber}
                      onChange={(e) => setWoNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
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

                <button 
                  onClick={handleSaveAudit}
                  disabled={isSavingAudit || isAuditSaved || !customerName}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isAuditSaved 
                    ? 'bg-green-500 text-white shadow-green-500/20' 
                    : 'bg-slate-900 text-white shadow-slate-900/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100'
                  }`}
                >
                  {isSavingAudit ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isAuditSaved ? (
                    <><CheckCircle2 className="w-4 h-4" /> Fee Locked & Saved</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Record</>
                  )}
                </button>
              </section>
            </div>
          )}

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
                center={region === 'Yangon' ? [16.8661, 96.1951] : [21.9588, 96.0891]} 
                zoom={12} 
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {config.map(c => (
                  <Marker key={c.region} position={[c.center_lat, c.center_lng]}>
                    <Popup className="font-bold uppercase tracking-widest text-[9px]">
                      {c.region} Service Center
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

          {!calculatedFee && !isCalculating && (
            <div className="bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-8 h-8 text-blue-200" />
              </div>
              <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Ready for Calculation</h3>
              <p className="text-[10px] text-blue-300 mt-2 max-w-xs mx-auto">Fill in the customer details on the left and click "Calculate Fee" to see the precise cost and route.</p>
            </div>
          )}
        </div>
      </div>
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
