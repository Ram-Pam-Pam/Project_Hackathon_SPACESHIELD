import { useState } from 'react';
import { Stop } from '../types';
import MapMockup from './MapMockup';
import { MapPin, ArrowRight, AlertCircle, Activity, Users, Zap } from 'lucide-react';

interface MapMainViewProps {
  stops: Stop[];
  onStopSelect: (stop: Stop) => void;
  transitionToLayers: () => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
  selectedStop?: Stop | null;
}

export default function MapMainView({
  stops,
  onStopSelect,
  transitionToLayers,
  hoveredStopId,
  setHoveredStopId,
  selectedStop = null,
}: MapMainViewProps) {
  const [activeLayer] = useState<'standard'>('standard');

  const highTrafficStops = stops.filter((s) => s.intensity === 'high');
  const totalPassengers = stops.reduce((sum, s) => sum + s.dailyPassengers, 0);

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col lg:flex-row bg-slate-50 dark:bg-slate-950" id="view-1-main-map">
      {/* Informative Side Panel (Apple & Linear styled) */}
      <div className="w-full border-b border-slate-200 bg-white p-6 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 lg:w-[360px] lg:border-r lg:border-b-0 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
                Analiza Przestrzenna
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Siatka Przystankowa
              <br />
              <span className="text-gradient-primary">Stalowej Woli</span>
            </h1>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
              Interaktywny system rejestrujący natężenie ruchu i przepływy ludności w czasie rzeczywistym.
            </p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800/80 dark:bg-slate-900/50 card-hover">
              <div className="flex items-center space-x-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pasażerowie</span>
              </div>
              <span className="mt-1 block text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                {totalPassengers.toLocaleString()}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">osób / dobę</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 dark:border-slate-800/80 dark:bg-slate-900/50 card-hover">
              <div className="flex items-center space-x-1.5">
                <Zap className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Hotspoty</span>
              </div>
              <span className="mt-1 block text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                {highTrafficStops.length}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">stref krytycznych</span>
            </div>
          </div>

          {/* Quick guide card */}
          <div id="instructions-card" className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 shadow-sm transition-all dark:border-slate-800/80 dark:bg-slate-900/50">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Instrukcja nawigacji
            </h2>
            <div className="mt-3 space-y-2.5">
              {[
                'Zidentyfikuj na mapie kolorowe punkty pomiarowe przystanków.',
                'Najedź na przystanek, aby podejrzeć szybki profil operacyjny.',
                'Kliknij w wybrany punkt, aby przejść do Szczegółowej Analizy Warstw.',
              ].map((text, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${idx === 2
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                  >
                    {idx + 1}
                  </div>
                  <p className={idx === 2 ? 'font-semibold text-slate-800 dark:text-slate-100' : ''}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Spots Alert Block */}
          {highTrafficStops.length > 0 && (
            <div id="overloaded-stops-card" className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20 shadow-sm">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <h3 className="text-[10px] font-bold text-rose-900 dark:text-rose-400 uppercase tracking-widest">
                  Przeciążone przystanki
                </h3>
              </div>
              <p className="mt-1.5 text-xs text-rose-700/85 dark:text-rose-300/80 font-medium">
                Wykryto <strong>{highTrafficStops.length} strefy</strong> o natężeniu krytycznym wymagające poprawy.
              </p>
              <div className="mt-3 space-y-2">
                {highTrafficStops.map((stop) => (
                  <div
                    key={stop.id}
                    onClick={() => onStopSelect(stop)}
                    onMouseEnter={() => setHoveredStopId(stop.id)}
                    onMouseLeave={() => setHoveredStopId(null)}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-rose-200/50 hover:border-rose-300 hover:shadow-sm transition-all dark:bg-slate-900/60 dark:border-rose-950/50 dark:hover:bg-slate-800"
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
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800 bg-transparent">
          <button
            id="cta-go-directly-layers"
            onClick={transitionToLayers}
            className="group flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-950 py-3 text-xs font-semibold text-white transition-all hover:bg-slate-800 active:scale-[0.98] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-lg shadow-slate-950/10 dark:shadow-white/5"
          >
            <span>Przejdź do analizy warstw</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Vector interactive Map Frame */}
      <div className="flex-1 p-3 sm:p-4 lg:p-6 flex flex-col relative bg-slate-50 dark:bg-slate-950">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center tracking-tight">
              <MapPin className="mr-2 h-4.5 w-4.5 text-emerald-500" />
              Mapa klasyfikacyjna przystanków
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Wybierz przystanek, aby zobaczyć szczegółowe informacje.
            </p>
          </div>
        </div>

        {/* The interactive MapLibre map component */}
        <div className="flex-1 relative min-h-[400px]">
          <MapMockup
            stops={stops}
            activeLayer="standard"
            onStopClick={onStopSelect}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
            selectedStop={selectedStop}
          />
        </div>
      </div>
    </div>
  );
}