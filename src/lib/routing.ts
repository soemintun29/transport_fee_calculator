export interface RouteResult {
  distanceKm: number;
  durationMins: number;
  geometry: any;
  error?: string;
}

// Memory cache for routes to ensure instant repeat results
const routeCache: Record<string, RouteResult> = {};

/**
 * Main Routing Engine with OSRM & Heuristic Fallback
 */
export const getDrivingDistance = async (start: [number, number], end: [number, number]): Promise<RouteResult | { error: string }> => {
  const cacheKey = `${start.join(',')}-${end.join(',')}`;
  if (routeCache[cacheKey]) return routeCache[cacheKey];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1000); // Ultra-fast 1-second timeout

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const result = {
        distanceKm: data.routes[0].distance / 1000,
        durationMins: data.routes[0].duration / 60,
        geometry: data.routes[0].geometry
      };
      routeCache[cacheKey] = result;
      return result;
    } else {
      throw new Error(`OSRM API Error: ${data.code}`);
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // HEURISTIC FALLBACK: If OSRM fails or timeouts (very common in Shwepyithar)
    // We use a "Road Network Heuristic"
    // In Myanmar, road distance is typically 1.35x to 1.6x the air distance.
    const airDist = calculateHaversineDistance(start[0], start[1], end[0], end[1]);
    
    // Shwepyithar and outskirts often have more "grid" or "detour" layouts
    const multiplier = 1.45; 
    const estimatedKm = airDist * multiplier;
    
    return {
      distanceKm: estimatedKm,
      durationMins: (estimatedKm / 30) * 60, // 30km/h average
      geometry: { 
        type: 'LineString', 
        coordinates: [[start[1], start[0]], [end[1], end[0]]] 
      },
      error: error.name === 'AbortError' ? 'Routing API timed out - Used Road Distance Heuristic (Estimate)' : 'API Failure - Used Road Distance Heuristic (Estimate)'
    };
  }
};

// Helper inside routing to avoid circular dependency
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
