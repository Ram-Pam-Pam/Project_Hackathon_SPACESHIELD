import { useState } from 'react';
import { Stop } from '../types';
import { HOURLY_FLOWS, ZONE_COMPARISON, KPI_STATS } from '../data/stalowaWolaData';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  Download,
  Gauge,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';

interface DashboardViewProps {
  stops: Stop[];
}

export default function DashboardView({ stops }: DashboardViewProps) {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 1200);
  };

  // Adapting colors based on theme classes
  const isDark = document.documentElement.classList.contains('dark');
  const primaryColor = '#1b10b9ff'; // emerald-500
  const secondaryColor = '#06b6d5'; // cyan-500
  const lightGrayColor = isDark ? '#475569' : '#94a3b8';
  const gridLineColor = isDark ? 'rgba(71, 85, 105, 0.15)' : 'rgba(226, 232, 240, 0.6)';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in text-slate-200" id="view-4-dashboard">

      {/* Toast Notification Container (Unikamy popup window.alert w iframe) */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-2xl border border-emerald-550/30 bg-slate-950 p-4 shadow-xl backdrop-blur-xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Eksport Zakończony</h4>
            <p className="text-[10.5px] text-slate-400 font-medium font-medium">Raport PDF i CSV został poprawnie przygotowany.</p>
          </div>
          <button
            onClick={() => setShowToast(false)}
            className="text-slate-500 hover:text-white transition-colors pl-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Cockpit Bar with Title and Quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            Wyniki analizy
          </span>
          <h1 className="mt-1 text-4.5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900 bg-clip-text text-transparent dark:from-white dark:via-emerald-400 dark:to-teal-300">
            Dashboard Stalowa Wola
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Analiza statystyczna wydajności taboru miejskiego, wąskich gardeł i natężenia potoków pasażerskich.
          </p>
        </div>

        {/* Quick Date Display & Export */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-905 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>Dziś: Sobota (Sondaż Majowy)</span>
          </div>

          <button
            id="btn-export-reports"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 rounded-xl bg-slate-950 dark:bg-white dark:text-slate-950 px-5.5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md"
          >
            <Download className={`h-4 w-4 text-emerald-500 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Eksportowanie...' : 'Eksportuj raport'}</span>
          </button>
        </div>
      </div>

      {/* 1. Core KPIs Cards at the very top (Karty z kluczowymi statystykami - KPI) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_STATS.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-350 dark:border-white/10 dark:bg-slate-950 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {stat.title}
            </span>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-2.5xl font-extrabold tracking-tight text-slate-950 dark:text-white font-mono">
                  {stat.value}
                </span>
                <span className="ml-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {stat.unit}
                </span>
              </div>
              <span
                className={`flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${stat.trend === 'up'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-405'
                  }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Bento Grid Layout for Charts & Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bento Box 1: Line Chart - Hourly Traffic Trends (Wykres liniowy: natężenie w czasie) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-slate-950 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-955 dark:text-white flex items-center">
                  <TrendingUp className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                  Natężenie Potoku Ruchu w Czasie
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Rozkład liczby pasażerów w ciągu doby na kluczowych arteriach Stalowej Woli
                </p>
              </div>

              <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/50 dark:border-white/10 rounded-lg text-[10px] font-bold">
                <span className="px-2 py-1.5 rounded-md bg-white text-slate-800 dark:bg-slate-955 dark:text-white shadow-xs">Pasażerowie / h</span>
                <span className="px-2 py-1.5 text-slate-450 dark:text-slate-500">Prędkość średnia (km/h)</span>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="mt-6 h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={HOURLY_FLOWS}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                  <XAxis
                    dataKey="time"
                    stroke={lightGrayColor}
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={lightGrayColor}
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#090d16' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      borderRadius: '16px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                  <Line
                    name="Liczba pasażerów (potok)"
                    type="monotone"
                    dataKey="flowCount"
                    stroke={primaryColor}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 1, stroke: primaryColor }}
                    activeDot={{ r: 6, strokeWidth: 1 }}
                  />
                  <Line
                    name="Opóźnienia średnie (min)"
                    type="monotone"
                    dataKey="delayMinutes"
                    stroke="#f43f5e"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-850/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Zarejestrowane spiętrzenia: poranny (07:30-08:15) oraz popołudniowy (14:45-16:00)</span>
            <span className="font-bold text-slate-700 dark:text-slate-350">Pomiar: pętle indukcyjne</span>
          </div>
        </div>

        {/* Bento Box 2: Bar Chart - Sector/Zone Density Comparison (Wykres słupkowy: porównanie stref) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-slate-950 flex flex-col justify-between">
          <div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-955 dark:text-white flex items-center">
                <Clock className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                Obciążenie Sektorów Miasta
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Podejście popytu do nominalnej przepustowości infrastruktury według stref
              </p>
            </div>

            {/* Recharts Container for Zone capacity vs demand */}
            <div className="mt-6 h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ZONE_COMPARISON}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                  <XAxis
                    dataKey="zone"
                    stroke={lightGrayColor}
                    fontSize={9}
                    tickLine={false}
                    tickFormatter={(value) => value.split(' ')[0]} // take first word to prevent overlap
                  />
                  <YAxis
                    stroke={lightGrayColor}
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#090d16' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      borderRadius: '16px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar
                    name="Popyt pasażerski"
                    dataKey="passengers"
                    fill={primaryColor}
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    name="Pojemność nominalna"
                    dataKey="capacity"
                    fill={isDark ? '#1e293b' : '#e2e8f0'}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/85 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Sektor Stalowej Woli Śródmieście wykazuje zbliżenie się popytu do poziomu 83% limitu.</span>
          </div>
        </div>

        {/* Bento Box 3: Custom Stops Ranking Grid Item (Tabela z przystankami) */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800/80">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <MapPin className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                Matryca Przystankowa & Wskaźniki Krytyczne
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Szczegółowy rejestr statystyk punktów pomiarowych uszeregowany według wskaźnika opóźnień
              </p>
            </div>

            <div className="flex items-center space-x-1.5 self-start sm:self-auto shrink-0 bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/50 dark:border-white/10 rounded-xl">
              {['all', 'high', 'medium', 'low'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedZone(category)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${selectedZone === category
                      ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-850'
                    }`}
                >
                  {category === 'all' ? 'Wszystkie' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Table list */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900 dark:text-slate-500 border-b border-slate-200/50 dark:border-white/5">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Nazwa Przystanku / Ulica</th>
                  <th scope="col" className="px-4 py-3.5">Kategoria Obciążenia</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Potok dzienny</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Wskaźnik natężenia</th>
                  <th scope="col" className="px-4 py-3.5">Przypisane Linie</th>
                  <th scope="col" className="px-4 py-3.5">Status korytarza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {stops
                  .filter((s) => selectedZone === 'all' || s.intensity === selectedZone)
                  .map((stop) => {
                    return (
                      <tr
                        key={stop.id}
                        className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-900/40"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{stop.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{stop.street}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${stop.intensity === 'high'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                : stop.intensity === 'medium'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              }`}
                          >
                            {stop.intensity === 'high' ? 'Wysokie' : stop.intensity === 'medium' ? 'Średnie' : 'Niskie'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-850 dark:text-slate-200">
                          {stop.dailyPassengers.toLocaleString()} / dobę
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {stop.trafficScore}%
                            </span>
                            {/* Simple visual bar */}
                            <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5">
                              <div
                                className={`h-full rounded-full ${stop.intensity === 'high'
                                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                    : stop.intensity === 'medium'
                                      ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                                  }`}
                                style={{ width: `${stop.trafficScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {stop.lines.map((line) => (
                              <span
                                key={line}
                                className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200/10 dark:border-white/5"
                              >
                                {line}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {stop.intensity === 'high' ? (
                            <span className="flex items-center text-[10.5px] font-bold text-rose-500">
                              <AlertTriangle className="mr-1 h-3.5 w-3.5 text-rose-500 animate-pulse" /> Przeciążenie operacyjne
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-bold text-emerald-500 flex items-center">
                              <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-500" /> Stabilny przepływ
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
