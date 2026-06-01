export interface Location {
  lat: number;
  lng: number;
  name?: string;
  source?: string;
}

const geoCache: Record<string, Location | null> = {};

const GEOCODER_URL = import.meta.env.VITE_GEOCODER_URL || 'http://localhost:8000/geocode';

export const geocodeAddress = async (myanmarAddress: string, englishAddress: string): Promise<Location | null> => {
  const cacheKey = `${myanmarAddress}-${englishAddress}`;
  if (geoCache[cacheKey]) {
    console.log('Using cached geocoding result for:', myanmarAddress);
    return geoCache[cacheKey];
  }

  const performGeocode = async (): Promise<Location | null> => {
    try {
      // Strategy 1: Local Python mm-geo-coder API (Best for raw Myanmar text)
      const pyResponse = await fetch(GEOCODER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: myanmarAddress })
      });
      
      if (pyResponse.ok) {
        const pyData = await pyResponse.json();
        if (pyData.status === 'success') {
          return {
            lat: pyData.lat,
            lng: pyData.lng,
            name: pyData.name,
            source: 'mm-geo-coder (Python)'
          };
        }
      }
    } catch (error) {
      // Quiet fail to next strategy
    }

    try {
      // Strategy 2: Geoparsing with Geocode.xyz (Optimized for unstructured)
      const geocodeXyzUrl = `https://geocode.xyz/${encodeURIComponent(myanmarAddress)}?json=1&region=MM`;
      const xyzResponse = await fetch(geocodeXyzUrl);
      const xyzData = await xyzResponse.json();

      if (xyzData && xyzData.latt && xyzData.longt && xyzData.latt !== '0.00000') {
        return {
          lat: parseFloat(xyzData.latt),
          lng: parseFloat(xyzData.longt),
          name: xyzData.standard?.city ? `${xyzData.standard.addresst || ''} ${xyzData.standard.city}` : myanmarAddress,
          source: 'Geocode.xyz (Geoparsed)'
        };
      }
    } catch (error) {
      // Quiet fail to next strategy
    }

    try {
      // Strategy 3: Fallback to Nominatim using the structured English address
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(englishAddress)}&limit=1`;
      const response = await fetch(nominatimUrl);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name,
          source: 'OpenStreetMap'
        };
      }
    } catch (error) {
      console.error('Nominatim error:', error);
    }

    return null;
  };

  const result = await performGeocode();
  geoCache[cacheKey] = result;
  return result;
};
