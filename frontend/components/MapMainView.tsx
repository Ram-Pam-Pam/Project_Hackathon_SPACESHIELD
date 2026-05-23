import { useState } from 'react';
import { Stop } from '../types';
import MapMockup from './MapMockup';
import { MapPin, ArrowRight, AlertCircle } from 'lucide-react';

interface MapMainViewProps {
  stops: Stop[];
  onStopSelect: (stop: Stop) => void;
  transitionToLayers: () => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
}

export default function MapMainView({
  stops,
  onStopSelect,
  transitionToLayers,
  hoveredStopId,
  setHoveredStopId,
}: MapMainViewProps) {
  const [activeLayer] = useState<'standard'>('standard');

  const highTrafficStops = stops.filter((s) => s.intensity === 'high');

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row bg-slate-50 dark:bg-slate-950" id="view-1-main-map">
      {/* Informative Side Panel (Apple & Linear styled) */}
      <div className="w-full border-b border-slate-200 bg-white p-6 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 lg:w-96 lg:border-r lg:border-b-0 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Siatka Przystankowa Stalowej Woli
            </h1>
            <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Interaktywny system badawczy rejestrujący natężenie ruchu taboru i przepływy ludności w czasie rzeczywistym.
            </p>
          </div>

          {/* Quick guide card */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm transition-all dark:border-slate-800/80 dark:bg-slate-900/50">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Instrukcja nawigacji
            </h2>
            <div className="mt-3 space-y-3">
              <div className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold dark:bg-slate-800 text-slate-800 dark:text-slate-200">1</div>
                <p>Zidentyfikuj na mapie kolorowe punkty pomiarowe przystanków.</p>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold dark:bg-slate-800 text-slate-800 dark:text-slate-200">2</div>
                <p>Najedź na przystanek, aby podejrzeć szybki profil operacyjny.</p>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">3</div>
                <p className="font-semibold text-slate-850 dark:text-slate-100">Kliknij w wybrany punkt, aby przejść do Szczegółowej Analizy Warstw.</p>
              </div>
            </div>
          </div>

          {/* Critical Spots Alert Block */}
          {highTrafficStops.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/40 dark:bg-rose-950/20 shadow-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <h3 className="text-xs font-bold text-rose-900 dark:text-rose-400 uppercase tracking-tight">
                  Hotspoty przeciążone
                </h3>
              </div>
              <p className="mt-1.5 text-xs text-rose-700/85 dark:text-rose-300/80">
                Wykryto <strong>{highTrafficStops.length} strefy</strong> o natężeniu krytycznym wymagające przekierowania potoków pasażerskich.
              </p>
              <div className="mt-3 space-y-2">
                {highTrafficStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => {
                      onStopSelect(stop);
                    }}
                    onMouseEnter={() => setHoveredStopId(stop.id)}
                    onMouseLeave={() => setHoveredStopId(null)}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-rose-200/50 hover:border-rose-300 transition-all dark:bg-slate-900/60 dark:border-rose-950/50 dark:hover:bg-slate-900"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{stop.name}</span>
                    <span className="font-mono text-[10px] bg-rose-500/10 text-rose-600 border border-rose-500/20 px-1.5 py-0.5 rounded-md dark:bg-rose-950/50 dark:text-rose-400">
                      {stop.trafficScore}% r.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer branding of Panel */}
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800 bg-transparent">
          <button
            id="cta-go-directly-layers"
            onClick={transitionToLayers}
            className="mt-3 flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-950 py-3 text-xs font-semibold text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          >
            <span>Przejdź do analizy warstw</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Vector interactive Map Frame */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-between relative bg-slate-50 dark:bg-slate-950">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
              <MapPin className="mr-2 h-4.5 w-4.5 text-emerald-500" />
              Skanowanie Geograficzne - Stalowa Wola
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trójstopniowa klasyfikacja natężenia publicznych potoków komunikacyjnych
            </p>
          </div>
        </div>

        {/* The interactive SVG/Vector map component */}
        <div className="flex-1 relative min-h-[400px]">
          <MapMockup
            stops={stops}
            activeLayer="standard"
            onStopClick={onStopSelect}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
          />
        </div>
      </div>
    </div>
  );
}