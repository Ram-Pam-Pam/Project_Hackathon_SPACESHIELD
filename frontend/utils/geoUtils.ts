export function createHexagon(lng: number, lat: number, radiusDegrees: number = 0.0004) {
  const coordinates = [];
  // Generate 6 points for a hexagon
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    // Adjust longitude radius slightly to account for latitude distortion (approximate aspect ratio correction for Poland ~ cos(50.5deg) is ~0.63)
    const lngOffset = radiusDegrees * Math.cos(angle) / 0.63;
    const latOffset = radiusDegrees * Math.sin(angle);
    coordinates.push([lng + lngOffset, lat + latOffset]);
  }
  coordinates.push(coordinates[0]); // Close the polygon by repeating the first point
  return [coordinates];
}

const STALOWA_WOLA_GPS: Record<string, { lat: number; lng: number }> = {
  'stop-1': { lat: 50.59124, lng: 22.04639 },
  'stop-2': { lat: 50.56942, lng: 22.05325 },
  'stop-3': { lat: 50.56580, lng: 22.06250 },
  'stop-4': { lat: 50.58210, lng: 22.05200 },
  'stop-5': { lat: 50.55010, lng: 22.04890 },
  'stop-6': { lat: 50.56950, lng: 22.05780 },
  'stop-7': { lat: 50.57460, lng: 22.04350 }
};

export function generatePillarsGeoJSON(stops: any[], timeMultiplier: number = 1.0) {
  return {
    type: 'FeatureCollection',
    features: stops.map(stop => {
      // Map intensities to colors
      let color = '#10b981'; // emerald
      if (stop.intensity === 'high') color = '#f43f5e'; // rose
      else if (stop.intensity === 'medium') color = '#f59e0b'; // amber

      // Base height depending on intensity to make them visible even in low traffic
      const baseHeight = stop.intensity === 'high' ? 80 : stop.intensity === 'medium' ? 40 : 20;
      
      // Calculate final height based on passenger count and time multiplier
      const height = baseHeight + (stop.dailyPassengers * 0.15 * timeMultiplier);

      const gps = STALOWA_WOLA_GPS[stop.id] || { lat: 50.5700, lng: 22.0500 };

      return {
        type: 'Feature',
        properties: {
          id: stop.id,
          name: stop.name,
          color: color,
          height: height,
          base_height: 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: createHexagon(gps.lng, gps.lat, 0.00035)
        }
      };
    })
  };
}
