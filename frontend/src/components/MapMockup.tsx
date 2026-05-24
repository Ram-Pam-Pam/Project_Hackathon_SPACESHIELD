import mojNowyGeoJSON from '../data/dashboard.json';
import przystankiGeoJSON from '../data/przystanki.json';
import { Navigation, ChevronRight } from 'lucide-react';
import maplibregl from 'maplibre-gl';
// @ts-ignore
import 'maplibre-gl/dist/maplibre-gl.css';
import { Stop } from '../types';
import { useEffect, useRef, useState } from 'react';
import * as h3 from 'h3-js';
import { POPULATION_H3 } from '../data/populationH3';

interface MapMockupProps {
  stops: Stop[];
  activeLayer: 'bdot10k' | 'satellite' | 'standard' | 'populacja_h3';
  onStopClick: (stop: Stop) => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
  isFlat?: boolean;
  selectedStop?: Stop | null;
  showTifOverlay?: boolean;
  tifOverlayCoords?: { lng: number; lat: number } | null;
}

interface DynamicStop {
  id: string;
  name: string;
  intensity: 'high' | 'medium' | 'low' | string;
  description: string;
  lines: string[];
  dailyPassengers: number;
  trafficScore: number;
  lng: number;
  lat: number;
  wsiadlo: number;
  wysiadlo: number;
}

// 2. Przypisujemy typ : DynamicStop[] do naszej zmiennej
const dynamicStops: DynamicStop[] = przystankiGeoJSON.features.map((feature: any) => ({
  id: feature.properties.id,
  name: feature.properties.name,
  intensity: feature.properties.intensity, // 'high' | 'medium' | 'low'
  description: feature.properties.description,
  lines: feature.properties.lines || [],
  dailyPassengers: feature.properties.flow || 0,
  wsiadlo: feature.properties.wsiadlo || 0,       // <-- DODANO
  wysiadlo: feature.properties.wysiadlo || 0,     // <-- DODANO
  trafficScore: feature.properties.trafficScore || 0,
  lng: feature.geometry.coordinates[0],
  lat: feature.geometry.coordinates[1],
}));

// Funkcja pomocnicza do pobierania współrzędnych przystanku na podstawie ID
const getStopCoords = (id: string) => {
  const stop = dynamicStops.find(s => s.id === id);
  return stop ? { lng: stop.lng, lat: stop.lat } : null;
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
  activeLayer,
  onStopClick,
  hoveredStopId,
  setHoveredStopId,
  isFlat = false,
  selectedStop = null,
  showTifOverlay = false,
  tifOverlayCoords = null,
}: MapMockupProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

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

    let initialCoords = { lat: 50.570, lng: 22.053 }; // Domyślny środek mapy
    if (selectedStop) {
      const coords = getStopCoords(selectedStop.id);
      if (coords) initialCoords = coords;
    }

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

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    // ====================================================
    // DODANO: ResizeObserver naprawiający renderowanie na mobile
    // ====================================================
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);
    // ====================================================

    map.on('style.load', () => {
      // 1. Dodajemy Twoje prawdziwe dane GeoJSON dla linii
      map.addSource('transit-routes', {
        type: 'geojson',
        data: mojNowyGeoJSON as any
      });

      // 2. Warstwa "cienia" (obwódki) dla linii
      map.addLayer({
        id: 'transit-lines-case',
        type: 'line',
        source: 'transit-routes',
        filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']],
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

      // 3. Główny kolor linii trasy
      map.addLayer({
        id: 'transit-lines',
        type: 'line',
        source: 'transit-routes',
        filter: ['any', ['==', ['geometry-type'], 'LineString'], ['==', ['geometry-type'], 'MultiLineString']],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          // Domyślne kolory linii przed kliknięciem w dymek
          'line-color': [
            'match',
            ['to-string', ['get', 'line']],
            '1', '#ef4444',
            '5', '#f59e0b',
            '10', '#3b82f6',
            'P', '#10b981',
            '#0ea5e9' // domyślny
          ],
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      const layers = map.getStyle().layers;
      let labelLayerId;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.type === 'symbol') {
          const symbolLayer = layer as maplibregl.SymbolLayerSpecification;
          if (symbolLayer.layout && symbolLayer.layout['text-field']) {
            labelLayerId = layer.id;
            break;
          }
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
                0, '#7dd3fc',
                100, '#38bdf8',
                300, '#0ea5e9'
              ]
              : [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0, 'lightgray',
                200, 'royalblue',
                400, 'lightblue'
              ],
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              13, 0,
              16, ['get', 'render_height']
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

        map.addLayer({
          id: 'population-h3-stroke',
          type: 'line',
          source: 'population-h3',
          paint: {
            'line-color': isDarkRef.current ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
            'line-width': 1
          }
        }, labelLayerId);

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
      // --- DODANO: Czyszczenie obserwatora ---
      resizeObserver.disconnect();
      // ---------------------------------------
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Synchronize and update stop markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers: maplibregl.Marker[] = [];

    dynamicStops.forEach((stop) => {
      const coords = { lng: stop.lng, lat: stop.lat };

      const isHigh = stop.intensity === 'high';
      const isMedium = stop.intensity === 'medium';
      const isHovered = hoveredStopId === stop.id;

      const el = document.createElement('div');
      el.id = `map-stop-marker-${stop.id}`;
      el.className = 'relative flex items-center justify-center cursor-pointer marker-container';
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
        pulseRingClass = `absolute w-12 h-12 rounded-full animate-pulse opacity-80 ${isHigh ? 'bg-rose-500/40' : isMedium ? 'bg-amber-500/35' : 'bg-emerald-400/30'}`;
      }

      el.innerHTML = `
        <div class="absolute inset-0 flex items-center justify-center">
          ${pulseRingClass ? `<div class="${pulseRingClass}"></div>` : ''}
          <div class="relative w-8 h-8 rounded-full ${ringColorClass} border border-white/5 flex items-center justify-center transition-transform duration-300 ${isHovered ? 'scale-120' : 'hover:scale-110'}">
            <div class="w-4 h-4 rounded-full ${baseColorClass} border border-white flex items-center justify-center shadow-lg">
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      `;

      el.addEventListener('mouseenter', () => setHoveredStopId(stop.id));
      el.addEventListener('mouseleave', () => setHoveredStopId(null));

      // Obsługa kliknięcia i popupu
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        const popups = document.querySelectorAll('.maplibregl-popup');
        popups.forEach((p) => p.remove());

        const popupNode = document.createElement('div');
        popupNode.className = 'p-4 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700/50 shadow-2xl backdrop-blur-md min-w-[260px] max-w-[300px] animate-fade-in font-sans';

        // ZMODYFIKOWANY HTML DYMKA Z PRZYCISKAMI LINII:
        popupNode.innerHTML = `
          <div class="border-b border-slate-800 pb-2.5 mb-3 flex items-start justify-between">
            <div>
              <h4 class="font-extrabold text-sm text-emerald-400 leading-snug">${stop.name}</h4>
            </div>
            <span class="text-[9px] font-mono font-bold bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 ml-2 uppercase">${stop.intensity}</span>
          </div>
          <div class="space-y-2 text-[11px] mb-4">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Wsiadło (dobowo):</span>
              <span class="font-extrabold font-mono text-emerald-400">+${stop.wsiadlo.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Wysiadło (dobowo):</span>
              <span class="font-extrabold font-mono text-rose-400">-${stop.wysiadlo.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Całkowity ruch (flow):</span>
              <span class="font-bold font-mono text-slate-200">${stop.dailyPassengers.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 font-medium">Natężenie ruchu:</span>
              <span class="font-extrabold font-mono text-rose-400">${stop.trafficScore}%</span>
            </div>
            <div class="flex justify-between items-start">
              <span class="text-slate-400 font-medium shrink-0">Linie:</span>
              <div class="flex flex-wrap gap-1 justify-end max-w-[140px]">
                ${stop.lines.map((line: string) => `<button class="stop-line-btn bg-cyan-500/10 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/25 px-1 py-0.5 rounded-md font-mono text-[9px] font-bold cursor-pointer transition-colors" data-line="${line}">${line}</button>`).join('')}
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

        // KASOWANIE ZAZNACZONEJ LINII PO ZAMKNIĘCIU DYMKA
        newPopup.on('close', () => setSelectedLine(null));

        // OBSŁUGA KLIKNIĘĆ W PRZYCISKI LINII W DYMKU
        const lineButtons = popupNode.querySelectorAll('.stop-line-btn');
        lineButtons.forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const clickedLine = btn.getAttribute('data-line');
            // Jeśli klikniesz tę samą to się odznaczy, jeśli inną - zaznaczy się ta nowa
            setSelectedLine(prev => prev === clickedLine ? null : clickedLine);
          });
        });

        const btn = popupNode.querySelector(`#popup-btn-${stop.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            newPopup.remove();
            onStopClick(stop as unknown as Stop);
          });
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .addTo(map);

      currentMarkers.push(marker);
      markersRef.current[stop.id] = marker;
    });

    return () => {
      currentMarkers.forEach(m => m.remove());
    };
  }, [hoveredStopId, isDarkRef.current]);

  // Smooth slide and center camera when hovered stop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !hoveredStopId) return;

    const coords = getStopCoords(hoveredStopId);
    if (coords) {
      map.easeTo({

        duration: 900,
        zoom: Math.max(map.getZoom(), 0),
      });
    }
  }, [hoveredStopId]);

  // Center map on selected stop when it changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    const coords = getStopCoords(selectedStop.id);
    if (coords) {
      map.easeTo({

        zoom: 16,
        duration: 1200
      });
    }
  }, [selectedStop]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setStyle(getMapStyle(isDark, activeLayer));
    }
  }, [activeLayer, isDark]);

  // Dynamic update of satellite TIF overlay layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const removeTifLayer = () => {
      if (map.getLayer('satellite-tif-layer')) {
        map.removeLayer('satellite-tif-layer');
      }
      if (map.getSource('satellite-tif-source')) {
        map.removeSource('satellite-tif-source');
      }
    };
    removeTifLayer();
  }, [showTifOverlay, tifOverlayCoords, activeLayer]);



  // Efekt podświetlania JEDNEJ klikniętej linii na biało
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    // Standardowe kolory z palety
    const defaultColors = [
      'match',
      ['to-string', ['get', 'line']],

      '#6fffd4ff' // błękitny domyślny
    ];

    try {
      if (selectedLine) {
        // --- STAN: KLIKNIĘTO W KONKRETNĄ LINIĘ W DYMKU ---
        map.setPaintProperty('transit-lines', 'line-color', [
          'case',
          ['==', ['to-string', ['get', 'line']], selectedLine], '#ffffff', // Zaznaczona jest na biało
          isDarkRef.current ? '#1e293b' : '#e2e8f0'                        // Reszta mocno wygaszona do szarości
        ]);

        map.setPaintProperty('transit-lines', 'line-width', [
          'case',
          ['==', ['to-string', ['get', 'line']], selectedLine], 6, // Gruba biała linia
          2 // Cienkie szare linie
        ]);

        map.setPaintProperty('transit-lines', 'line-opacity', [
          'case',
          ['==', ['to-string', ['get', 'line']], selectedLine], 1.0,
          0.15 // Niemal całkowite wygaszenie innych tras
        ]);

        if (map.getLayer('transit-lines-case')) {
          map.setPaintProperty('transit-lines-case', 'line-opacity', [
            'case',
            ['==', ['to-string', ['get', 'line']], selectedLine], 0.8,
            0.0 // Usuwamy obwódkę wygaszonych tras dla czystszego widoku
          ]);
        }

      } else {
        // --- STAN: DOMYŚLNY (BRAK ZAZNACZENIA) ---
        // Wszystko wraca do normy z oryginalnymi kolorami
        map.setPaintProperty('transit-lines', 'line-color', defaultColors);
        map.setPaintProperty('transit-lines', 'line-width', 4);
        map.setPaintProperty('transit-lines', 'line-opacity', 0.8);

        if (map.getLayer('transit-lines-case')) {
          map.setPaintProperty('transit-lines-case', 'line-opacity', 0.75);
        }
      }
    } catch (e) {
      console.warn("Warstwa linii jeszcze nie istnieje lub błąd MapLibre", e);
    }
  }, [selectedLine]); // Nasłuchujemy teraz tylko zmian klikniętej linii!

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 transition-all dark:border-slate-800 dark:bg-slate-950 shadow-lg">
      <div
        ref={mapContainerRef}
        className="h-full w-full absolute inset-0 z-0"
        id="stalowa-wola-vector-map"
      />

      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-none">
        <div className="flex items-center space-x-2 rounded-xl border border-white/10 bg-slate-950/80 p-2.5 shadow-2xl backdrop-blur-xl">
          <Navigation className="h-4 w-4 text-emerald-400 animate-[spin_8s_linear_infinite]" />
          <span className="text-[11px] font-bold text-white tracking-tight">STALOWA WOLA</span>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-400">
            50.57°N 22.05°E
          </span>
        </div>
      </div>

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

      {hoveredStopId && (
        <div className="absolute bottom-4 left-4 right-4 z-10 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:left-4 sm:right-auto sm:max-w-sm animate-fade-in">
          {(() => {
            const stop = dynamicStops.find((s) => s.id === hoveredStopId);
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
                  <span className="flex items-center font-bold text-emerald-400 cursor-pointer hover:text-emerald-300 transition-colors" onClick={() => onStopClick(stop as unknown as Stop)}>
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