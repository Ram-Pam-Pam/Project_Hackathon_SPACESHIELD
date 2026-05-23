import { useEffect, useRef, useState } from 'react';
import { Stop } from '../types';
import { Navigation, ChevronRight, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapMockupProps {
  stops: Stop[];
  activeLayer: 'bdot10k' | 'satellite' | 'standard';
  onStopClick: (stop: Stop) => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
}

// Precise geographic coordinates (latitude, longitude) of locations in Stalowa Wola
const STALOWA_WOLA_GPS: Record<string, { lat: number; lng: number }> = {
  'stop-1': { lat: 50.59124, lng: 22.04639 }, // Rozwadów Rynek
  'stop-2': { lat: 50.56942, lng: 22.05325 }, // Okulickiego - Rondo
  'stop-3': { lat: 50.56580, lng: 22.06250 }, // KEN - Bloki
  'stop-4': { lat: 50.58210, lng: 22.05200 }, // Staszica - Dworzec PKS
  'stop-5': { lat: 50.55010, lng: 22.04890 }, // Przemysłowa - Huta Stalowa Wola
  'stop-6': { lat: 50.56950, lng: 22.05780 }, // Aleje Jana Pawła II - Bazylika
  'stop-7': { lat: 50.57460, lng: 22.04350 }  // Ofiar Katynia - Park
};

const getMapStyle = (isDark: boolean, activeLayer: 'standard' | 'bdot10k' | 'satellite'): any => {
  if (activeLayer === 'satellite') {
    return {
      version: 8,
      sources: {
        'satellite-tiles': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar'
        }
      },
      layers: [
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite-tiles',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    };
  }

  // Choose style URL based on selection & dark theme
  let tileUrl = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  if (activeLayer === 'bdot10k') {
    // Voyager tile variant is highly detailed and fits BDOT topological style beautifully
    tileUrl = 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  } else if (isDark) {
    tileUrl = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }

  return {
    version: 8,
    sources: {
      'base-tiles': {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: '© OpenStreetMap and CARTO'
      }
    },
    layers: [
      {
        id: 'base-layer',
        type: 'raster',
        source: 'base-tiles',
        minzoom: 0,
        maxzoom: 20
      }
    ]
  };
};

export default function MapMockup({
  stops,
  activeLayer,
  onStopClick,
  hoveredStopId,
  setHoveredStopId,
}: MapMockupProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  // Smart responsive observer to detect changes to dark/light theme trigger
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Initialize MapLibre Map instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(isDark, activeLayer),
      center: [22.053, 50.570],
      zoom: 12.8,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    // Register style load event to overlay spatial GeoJSON bus lines
    map.on('style.load', () => {
      map.addSource('transit-routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            // Line 1 (Green network)
            {
              type: 'Feature',
              properties: { color: '#10b981', name: 'Linia Główna 1' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [22.04639, 50.59124], // stop-1 Rozwadów Rynek
                  [22.04350, 50.57460], // stop-7 Ofiar Katynia
                  [22.05200, 50.58210], // stop-4 Staszica - Dworzec PKS
                  [22.05325, 50.56942], // stop-2 Okulickiego - Rondo
                  [22.05780, 50.56950], // stop-6 Aleje Jana Pawła II - Bazylika
                  [22.06250, 50.56580], // stop-3 KEN - Bloki
                  [22.04890, 50.55010], // stop-5 Przemysłowa - Huta Stalowa Wola
                ]
              }
            },
            // Line 2 (Cyan network)
            {
              type: 'Feature',
              properties: { color: '#06b6d4', name: 'Pętla Śródmiejska 2' },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [22.05325, 50.56942], // stop-2 Okulickiego - Rondo
                  [22.04350, 50.57460], // stop-7 Ofiar Katynia
                  [22.04639, 50.59124], // stop-1 Rozwadów Rynek
                  [22.05200, 50.58210], // stop-4 Staszica - Dworzec PKS
                  [22.05780, 50.56950], // stop-6 Aleje Jana Pawła II - Bazylika
                  [22.05325, 50.56942], // stop-2 Okulickiego - Rondo
                ]
              }
            }
          ]
        }
      });

      // Subtle drop shadow/contrast layer
      map.addLayer({
        id: 'transit-lines-case',
        type: 'line',
        source: 'transit-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': isDark ? '#020617' : '#ffffff',
          'line-width': 5,
          'line-opacity': 0.75
        }
      });

      // Main colored bus lines
      map.addLayer({
        id: 'transit-lines',
        type: 'line',
        source: 'transit-routes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.8
        }
      });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync active style mode smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setStyle(getMapStyle(isDark, activeLayer));
    }
  }, [activeLayer, isDark]);

  // Synchronize and update stop markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    stops.forEach((stop) => {
      const isHigh = stop.intensity === 'high';
      const isMedium = stop.intensity === 'medium';
      const coords = STALOWA_WOLA_GPS[stop.id] || { lat: 50.5700, lng: 22.0500 };
      const isHovered = hoveredStopId === stop.id;

      // Create a gorgeous custom HTML/CSS element for the map node
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer';
      el.style.width = '52px';
      el.style.height = '52px';

      let baseColorClass = 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
      let ringColorClass = 'bg-emerald-500/15';
      let pulseRingClass = '';

      if (isHigh) {
        baseColorClass = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]';
        ringColorClass = 'bg-rose-500/20';
        pulseRingClass = 'absolute w-10 h-10 rounded-full animate-ping opacity-60 bg-rose-500/25';
      } else if (isMedium) {
        baseColorClass = 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.55)]';
        ringColorClass = 'bg-amber-500/15';
        pulseRingClass = 'absolute w-8 h-8 rounded-full animate-ping opacity-50 bg-amber-500/20';
      }

      if (isHovered) {
        pulseRingClass = `absolute w-12 h-12 rounded-full animate-pulse opacity-80 ${
          isHigh ? 'bg-rose-500/40' : isMedium ? 'bg-amber-500/35' : 'bg-emerald-400/30'
        }`;
      }

      el.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          ${pulseRingClass ? `<div class="${pulseRingClass}"></div>` : ''}
          <div class="relative w-8 h-8 rounded-full ${ringColorClass} border border-white/5 flex items-center justify-center transition-transform duration-300 ${
            isHovered ? 'scale-120' : 'hover:scale-110'
          }">
            <div class="w-4 h-4 rounded-full ${baseColorClass} border border-white flex items-center justify-center shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      `;

      el.addEventListener('mouseenter', () => setHoveredStopId(stop.id));
      el.addEventListener('mouseleave', () => setHoveredStopId(null));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onStopClick(stop);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);

      markersRef.current[stop.id] = marker;
    });
  }, [stops, hoveredStopId, isDark]);

  // Smooth slide and center camera when hovered stop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hoveredStopId) return;

    const coords = STALOWA_WOLA_GPS[hoveredStopId];
    if (coords) {
      map.easeTo({
        center: [coords.lng, coords.lat],
        duration: 900,
        zoom: Math.max(map.getZoom(), 13.5),
      });
    }
  }, [hoveredStopId]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all dark:border-slate-800 dark:bg-slate-950">
      {/* Absolute base full screen Map container */}
      <div
        ref={mapContainerRef}
        className="h-full w-full absolute inset-0 z-0"
        id="stalowa-wola-vector-map"
      />

      {/* Floating HUD Panel 1: Location Stats */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-none">
        <div className="flex items-center space-x-2 rounded-xl border border-white/10 bg-slate-950/85 p-2 shadow-lg backdrop-blur-md">
          <Navigation className="h-4 w-4 animate-spin text-emerald-400" />
          <span className="text-[11px] font-bold text-white tracking-tight">STALOWA WOLA INTERAKTYWNA MAPA</span>
          <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 border border-white/5">
            50.5700° N, 22.0530° E
          </span>
        </div>
      </div>

      {/* Floating HUD Panel 2: Density Summary Categories (Tablet only) */}
      <div className="absolute right-4 top-4 z-10 hidden sm:flex flex-col space-y-1.5 rounded-xl border border-white/10 bg-slate-950/85 p-2.5 shadow-lg backdrop-blur-md pointer-events-none">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
          Obciążenie operacyjne taboru
        </span>
        <div className="flex items-center space-x-3 text-[10.5px]">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-500/20"></span>
            <span className="font-bold text-slate-200">Wysokie (2)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
            <span className="font-bold text-slate-200">Średnie (3)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
            <span className="font-bold text-slate-200">Niskie (2)</span>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Status/Details Box shown at bottom when hovering stops */}
      {hoveredStopId && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:left-4 sm:right-auto sm:max-w-xs animate-fade-in">
          {(() => {
            const stop = stops.find((s) => s.id === hoveredStopId);
            if (!stop) return null;
            return (
              <div id={`hover-card-${stop.id}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    {stop.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[8.5px] font-extrabold uppercase border ${
                      stop.intensity === 'high'
                        ? 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                        : stop.intensity === 'medium'
                        ? 'bg-amber-500/15 border-amber-500/20 text-amber-450'
                        : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {stop.intensity === 'high' ? 'Wysokie' : stop.intensity === 'medium' ? 'Średnie' : 'Niskie'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300 font-medium">
                  {stop.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 bg-transparent text-[10px]">
                  <span className="text-slate-400">
                    Pasażerowie: <strong className="font-mono text-slate-200 font-bold">{stop.dailyPassengers} / dobę</strong>
                  </span>
                  <span className="flex items-center font-bold text-emerald-400 cursor-pointer" onClick={() => onStopClick(stop)}>
                    Analiza <ChevronRight className="ml-0.5 h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
