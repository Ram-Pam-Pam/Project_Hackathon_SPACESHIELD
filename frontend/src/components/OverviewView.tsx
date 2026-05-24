import { useState } from 'react';
import { Stop } from '../types';
import MapMockup from './MapMockup';
import { MapPin, Activity, Layers, Info } from 'lucide-react';

interface OverviewViewProps {
  stops: Stop[];
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
  selectedStop: Stop | null;
  onStopSelect: (stop: Stop | null) => void;
}

type LayerMode = 'standard' | 'populacja_h3' | 'satellite' | 'bdot10k';

export default function OverviewView({
  stops,
  hoveredStopId,
  setHoveredStopId,
  selectedStop,
  onStopSelect,
}: OverviewViewProps) {
  const [activeLayer, setActiveLayer] = useState<LayerMode>('standard');

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)] lg:h-[calc(100vh-6.5rem)] flex-col lg:flex-row bg-slate-50 dark:bg-slate-950" id="view-1-main-map">
      {/* Informative Side Panel (Apple & Linear styled) */}
      <div className="w-full border-b border-slate-200 bg-white p-6 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 lg:w-[380px] lg:border-r lg:border-b-0 flex flex-col justify-between lg:overflow-y-auto shrink-0">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
                Eksploracja i Warstwy
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Wizualizacja Sieci
              <br />
              <span className="text-gradient-primary">Geoprzestrzennej</span>
            </h1>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Eksploruj przystanki, połączenia autobusowe oraz nałożone warstwy topograficzne i demograficzne.
            </p>
          </div>

          {/* Layer Selector */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/30 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Layers className="h-4 w-4 text-emerald-500 mr-1.5" /> Warstwy mapy
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard' as const, label: 'Standardowa' },
                { id: 'satellite' as const, label: 'Satelita' },
                { id: 'bdot10k' as const, label: 'BDOT10k' },
                { id: 'populacja_h3' as const, label: 'Populacja H3' },
              ].map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-all ${activeLayer === layer.id
                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-900 dark:border-white/5 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metadata Inspector (Conditional on selection) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Info className="h-4 w-4 text-emerald-500 mr-1.5" /> Szczegóły obiektu
            </h3>

            {selectedStop ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3 animate-fade-in">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500">Przystanek MZK</span>
                  <h4 className="text-lg font-bold text-slate-950 dark:text-white leading-tight mt-0.5">{selectedStop.name}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{selectedStop.street}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                    <span className="text-[9px] font-bold text-slate-400 block">Potok pasażerski</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{selectedStop.dailyPassengers.toLocaleString()} / db</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                    <span className="text-[9px] font-bold text-slate-400 block">Wskaźnik obciążenia</span>
                    <strong className="text-slate-900 dark:text-white font-mono text-sm">{selectedStop.trafficScore}%</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400">Obsługiwane linie autobusu:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedStop.lines.map((line) => (
                      <span
                        key={line}
                        className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5"
                      >
                        {line}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedStop.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                    "{selectedStop.description}"
                  </p>
                )}

                <button
                  onClick={() => onStopSelect(null)}
                  className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Zamknij podgląd
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center text-slate-400 dark:text-slate-600 text-xs">
                <MapPin className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
                Wskaż przystanek na mapie, aby wyświetlić metadane i parametry przepustowości.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vector interactive Map Frame */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 flex flex-col relative bg-slate-50 dark:bg-slate-950 w-full">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
              <MapPin className="mr-2 h-4.5 w-4.5 text-emerald-500" />
              Siatka transportu zbiorowego Stalowej Woli
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Interaktywna wizualizacja w technologii MapLibre GL.
            </p>
          </div>
        </div>

        {/* Kontener mapy */}
        <div className="relative w-full h-[500px] lg:h-auto lg:flex-1 min-h-[400px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <MapMockup
            stops={stops}
            activeLayer={activeLayer}
            onStopClick={onStopSelect}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
            selectedStop={selectedStop}
            hoverCtaLabel="Pokaż szczegóły"
            popupCtaLabel="Pokaż szczegóły"
            showTrafficLoadLegend={true}
          />
        </div>
      </div>
    </div>
  );
}