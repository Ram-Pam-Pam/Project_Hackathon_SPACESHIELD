import { Navigation, ChevronRight } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Stop } from '../types';

interface MapMockupProps {
  stops: Stop[];
  activeLayer: 'bdot10k' | 'satellite' | 'standard' | 'populacja_h3';
  onStopClick: (stop: Stop) => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
  isFlat?: boolean;
  selectedStop?: Stop | null;
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

const getMapStyle = (isDark: boolean, activeLayer: 'standard' | 'bdot10k' | 'satellite' | 'populacja_h3'): any => {
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
        id: 'map-background',
        type: 'background',
        paint: {
          'background-color': isDark ? '#0b1329' : '#f8fafc'
        }
      },
      {
        id: 'base-layer',
        type: 'raster',
        source: 'base-tiles',
        minzoom: 0,
        maxzoom: 20,
        paint: {
          'raster-opacity': isDark ? 0.35 : 1.0
        }
      }
    ]
  };
};

import { useEffect, useRef, useState } from 'react';
import * as h3 from 'h3-js';
import { POPULATION_H3 } from '../data/populationH3';

// Convert our H3 dataset to GeoJSON features
const getH3GeoJSON = (): any => {
  const features = POPULATION_H3.map((item) => {
    try {
      const boundary = h3.cellToBoundary(item.h3);
      const coordinates = boundary.map(([lat, lng]) => [lng, lat]);
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }
      return {
        type: 'Feature',
        properties: {
          h3: item.h3,
          population: item.pop
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      };
    } catch (e) {
      console.warn('Invalid H3 index:', item.h3, e);
      return null;
    }
  }).filter(Boolean);

  return {
    type: 'FeatureCollection',
    features
  };
};

export default function MapMockup({
  stops,
  activeLayer,
  onStopClick,
  hoveredStopId,
  setHoveredStopId,
  isFlat = false,
  selectedStop = null,
}: MapMockupProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  // Smart responsive observer to detect changes to dark/light theme trigger
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const isDarkRef = useRef(isDark);
  const activeLayerRef = useRef(activeLayer);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    activeLayerRef.current = activeLayer;
  }, [activeLayer]);

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

    const initialCoords = selectedStop && STALOWA_WOLA_GPS[selectedStop.id]
      ? STALOWA_WOLA_GPS[selectedStop.id]
      : { lat: 50.570, lng: 22.053 };

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(isDark, activeLayer),
      center: [initialCoords.lng, initialCoords.lat],
      zoom: selectedStop ? 16 : 14.5,
      pitch: isFlat ? 0 : 60,
      bearing: isFlat ? 0 : -15,
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
                  [22.04639, 50.59124],
                  [22.04350, 50.57460],
                  [22.05200, 50.58210],
                  [22.05325, 50.56942],
                  [22.05780, 50.56950],
                  [22.06250, 50.56580],
                  [22.04890, 50.55010],
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
                  [22.05325, 50.56942],
                  [22.04350, 50.57460],
                  [22.04639, 50.59124],
                  [22.05200, 50.58210],
                  [22.05780, 50.56950],
                  [22.05325, 50.56942],
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
          'line-color': isDarkRef.current ? '#020617' : '#ffffff',
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

      // Insert 3D buildings layer beneath any symbol layer
      const layers = map.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
          labelLayerId = layers[i].id;
          break;
        }
      }

      map.addSource('openfreemap', {
        url: `https://tiles.openfreemap.org/planet`,
        type: 'vector',
      });

      map.addLayer(
        {
          'id': '3d-buildings',
          'source': 'openfreemap',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 13,
          'filter': ['!=', ['get', 'hide_3d'], true],
          'paint': {
            'fill-extrusion-color': isDarkRef.current
              ? [
                  'interpolate',
                  ['linear'],
                  ['get', 'render_height'],
                  0,
                  '#7dd3fc', // sky-300 (light blue)
                  100,
                  '#38bdf8', // sky-400
                  300,
                  '#0ea5e9'  // sky-500
                ]
              : [
                  'interpolate',
                  ['linear'],
                  ['get', 'render_height'],
                  0,
                  'lightgray',
                  200,
                  'royalblue',
                  400,
                  'lightblue'
                ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13,
              0,
              16,
              ['get', 'render_height']
            ],
            'fill-extrusion-base': ['case',
              ['>=', ['get', 'zoom'], 16],
              ['get', 'render_min_height'],
              0
            ]
          }
        },
        labelLayerId
      );

      // Add H3 population layer if activeLayer is 'populacja_h3'
      if (activeLayerRef.current === 'populacja_h3') {
        map.addSource('population-h3', {
          type: 'geojson',
          data: getH3GeoJSON()
        });

        map.addLayer({
          id: 'population-h3-layer',
          type: 'fill',
          source: 'population-h3',
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'population'],
              0, 'rgba(16, 185, 129, 0.1)',
              10, 'rgba(16, 185, 129, 0.45)',
              100, '#f59e0b',
              500, '#ef4444',
              1000, '#e11d48'
            ],
            'fill-opacity': 0.55
          }
        }, labelLayerId);

        // Crisp boundaries outline layer
        map.addLayer({
          id: 'population-h3-stroke',
          type: 'line',
          source: 'population-h3',
          paint: {
            'line-color': isDarkRef.current ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
            'line-width': 1
          }
        }, labelLayerId);

        // Tooltip popup handling
        let popup: maplibregl.Popup | null = null;

        map.on('mouseenter', 'population-h3-layer', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const coordinates = e.lngLat;
          const population = e.features?.[0]?.properties?.population;
          if (population !== undefined) {
            const html = `
              <div class="p-2 rounded-xl bg-slate-950/90 text-white border border-white/10 shadow-xl backdrop-blur-md text-[11px] font-semibold pointer-events-none">
                <div class="text-[8px] uppercase tracking-wider text-emerald-400 font-bold mb-0.5">Siatka Populacji H3</div>
                <div>Liczba ludności: <span class="font-mono text-slate-100 font-bold">${Math.round(population)}</span></div>
              </div>
            `;
            popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 15 })
              .setLngLat(coordinates)
              .setHTML(html)
              .addTo(map);
          }
        });

        map.on('mouseleave', 'population-h3-layer', () => {
          map.getCanvas().style.cursor = '';
          if (popup) {
            popup.remove();
            popup = null;
          }
        });
      }

    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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
      el.id = `map-stop-marker-${stop.id}`;
      el.className = 'relative flex items-center justify-center cursor-pointer';
      el.style.width = '52px';
      el.style.height = '52px';
      el.style.transition = 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';

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
        el.style.transform = 'scale(1.3)';
        pulseRingClass = `absolute w-12 h-12 rounded-full animate-pulse opacity-80 ${isHigh ? 'bg-rose-500/40' : isMedium ? 'bg-amber-500/35' : 'bg-emerald-400/30'
          }`;
      }

      el.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          ${pulseRingClass ? `<div class="${pulseRingClass}"></div>` : ''}
          <div class="relative w-8 h-8 rounded-full ${ringColorClass} border border-white/5 flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-120' : 'hover:scale-110'
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
        
        // Remove any open popups
        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach((p) => p.remove());

        const popupNode = document.createElement('div');
        popupNode.className = 'p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700/50 shadow-2xl backdrop-blur-md min-w-[260px] max-w-[300px] animate-fade-in font-sans';
        popupNode.innerHTML = `
          <div class="border-b border-slate-800 pb-2.5 mb-3 flex items-start justify-between">
            <div>
              <h4 class="font-extrabold text-sm text-emerald-400 leading-snug">${stop.name}</h4>
              <p class="text-[10px] text-slate-400 font-semibold mt-0.5">${stop.street}</p>
            </div>
            <span class="text-[9px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 ml-2 uppercase">${stop.intensity}</span>
          </div>
          <div class="space-y-2 text-[11px] mb-4">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Pasażerowie:</span>
              <span class="font-extrabold font-mono text-emerald-300">${stop.dailyPassengers.toLocaleString()} / dobę</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Natężenie ruchu:</span>
              <span class="font-extrabold font-mono text-rose-400">${stop.trafficScore}%</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-slate-400 font-medium shrink-0">Linie:</span>
              <div class="flex flex-wrap gap-1 justify-end max-w-[140px]">
                ${stop.lines.map(line => `<span class="bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 px-1 py-0.5 rounded-md font-mono text-[9px] font-bold">${line}</span>`).join('')}
              </div>
            </div>
          </div>
          <button id="popup-btn-${stop.id}" class="w-full text-center bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-extrabold text-[11px] py-2 px-4 rounded-xl shadow-lg shadow-emerald-500/15 cursor-pointer transition-all active:scale-[0.97]">
            Przejdź do analizy →
          </button>
        `;

        const newPopup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '320px',
          anchor: 'bottom',
          offset: [0, -12]
        })
          .setLngLat([coords.lng, coords.lat])
          .setDOMContent(popupNode)
          .addTo(map);

        // Bind click event for action button
        const btn = popupNode.querySelector(`#popup-btn-${stop.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            newPopup.remove();
            onStopClick(stop);
          });
        }
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

  // Center map on selected stop when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    const coords = STALOWA_WOLA_GPS[selectedStop.id];
    if (coords) {
      map.easeTo({
        center: [coords.lng, coords.lat],
        zoom: 16,
        duration: 1200
      });
    }
  }, [selectedStop]);

  // Sync active style mode smoothly
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setStyle(getMapStyle(isDark, activeLayer));
    }
  }, [activeLayer, isDark]);

  // Smoothly ease map pitch and bearing when isFlat changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.easeTo({
        pitch: isFlat ? 0 : 60,
        bearing: isFlat ? 0 : -15,
        duration: 900
      });
    }
  }, [isFlat]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all dark:border-slate-800 dark:bg-slate-950 shadow-lg">
      {/* Absolute base full screen Map container */}
      <div
        ref={mapContainerRef}
        className="h-full w-full absolute inset-0 z-0"
        id="stalowa-wola-vector-map"
      />

      {/* Floating HUD Panel 1: Location Stats */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-none">
        <div className="flex items-center space-x-2 rounded-xl border border-white/10 bg-slate-950/80 p-2.5 shadow-2xl backdrop-blur-xl">
          <Navigation className="h-4 w-4 text-emerald-400 animate-[spin_8s_linear_infinite]" />
          <span className="text-[11px] font-bold text-white tracking-tight">STALOWA WOLA</span>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
            50.57°N 22.05°E
          </span>
        </div>
      </div>

      {/* Floating HUD Panel 2: Density Summary Categories */}
      <div className="absolute right-4 top-4 z-10 hidden sm:flex flex-col space-y-1.5 rounded-xl border border-white/10 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-xl pointer-events-none">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
          Obciążenie taboru
        </span>
        <div className="flex items-center space-x-3 text-[10.5px]">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 animate-pulse"></span>
            <span className="font-bold text-slate-200">Wysokie</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
            <span className="font-bold text-slate-200">Średnie</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
            <span className="font-bold text-slate-200">Niskie</span>
          </div>
        </div>
      </div>

      {/* Real-time Dynamic Status/Details Box shown at bottom when hovering stops */}
      {hoveredStopId && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:left-4 sm:right-auto sm:max-w-sm animate-fade-in">
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
                    className={`rounded-full px-2.5 py-0.5 text-[8.5px] font-extrabold uppercase border ${stop.intensity === 'high'
                        ? 'bg-rose-500/15 border-rose-500/20 text-rose-400'
                        : stop.intensity === 'medium'
                          ? 'bg-amber-500/15 border-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                      }`}
                  >
                    {stop.intensity === 'high' ? 'Wysokie' : stop.intensity === 'medium' ? 'Średnie' : 'Niskie'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300 font-medium">
                  {stop.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 bg-transparent text-[10px]">
                  <span className="text-slate-400">
                    Pasażerowie: <strong className="font-mono text-slate-200 font-bold">{stop.dailyPassengers.toLocaleString()} / dobę</strong>
                  </span>
                  <span className="flex items-center font-bold text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors" onClick={() => onStopClick(stop)}>
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
