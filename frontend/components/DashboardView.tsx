import { useState, useEffect } from 'react';
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
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardViewProps {
  stops: Stop[];
}

export default function DashboardView({ stops }: DashboardViewProps) {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  // Track dark mode dynamically
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }, 1200);
  };

  const primaryColor = '#10b981'; // emerald-500
  const lightGrayColor = isDark ? '#475569' : '#94a3b8';
  const gridLineColor = isDark ? 'rgba(71, 85, 105, 0.15)' : 'rgba(226, 232, 240, 0.6)';

  const kpiIcons = [TrendingUp, CheckCircle2, AlertTriangle, MapPin];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8" id="view-4-dashboard">

      {/* Toast Notification Container */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl animate-slide-in-right">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Eksport Zakończony</h4>
            <p className="text-[10.5px] text-slate-400 font-medium">Raport PDF i CSV został poprawnie przygotowany.</p>
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
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
            Kokpit Decyzyjny 360°
          </span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            <span className="text-gradient-primary">Dashboard</span>
            <span className="text-slate-900 dark:text-white"> Przepływu</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Analiza statystyczna wydajności taboru miejskiego i natężenia potoków pasażerskich.
          </p>
        </div>

        {/* Quick Date Display & Export */}
        <div className="flex items-center space-x-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <span>Maj 2026</span>
          </div>

          <button
            id="btn-export-reports"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md active:scale-[0.97]"
          >
            <Download className={`h-4 w-4 text-emerald-500 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Eksportowanie...' : 'Eksportuj raport'}</span>
          </button>
        </div>
      </div>

      {/* 1. Core KPIs Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_STATS.map((stat, idx) => {
          const IconComp = kpiIcons[idx] || TrendingUp;
          return (
            <div
              key={idx}
              className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 card-hover opacity-0 animate-fade-in-up stagger-${idx + 1}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {stat.title}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  stat.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <IconComp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    {stat.value}
                  </span>
                  <span className="ml-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    {stat.unit}
                  </span>
                </div>
                <span
                  className={`flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    stat.trend === 'up'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-white/5 text-slate-400'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  )}
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Bento Grid Layout for Charts & Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line Chart - Hourly Traffic Trends */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between opacity-0 animate-fade-in-up stagger-3">
          <div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                  <TrendingUp className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                  Natężenie Potoku w Czasie
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Rozkład pasażerów w ciągu doby na arteriach Stalowej Woli
                </p>
              </div>

              <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/50 dark:border-white/10 rounded-lg text-[10px] font-bold">
                <span className="px-2 py-1 rounded-md bg-white text-slate-800 dark:bg-slate-700 dark:text-white shadow-xs">Pasażerowie / h</span>
                <span className="px-2 py-1 text-slate-400 dark:text-slate-500">Opóźnienia</span>
              </div>
            </div>

            {/* Recharts Area + Line Chart */}
            <div className="mt-6 h-72 w-full text-xs font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={HOURLY_FLOWS}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} />
                  <Area
                    name="Liczba pasażerów (potok)"
                    type="monotone"
                    dataKey="flowCount"
                    stroke={primaryColor}
                    strokeWidth={2.5}
                    fill="url(#flowGradient)"
                    dot={{ r: 3, strokeWidth: 1, stroke: primaryColor, fill: isDark ? '#0f172a' : '#ffffff' }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
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
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Spiętrzenia: poranne (07:30-08:15) i popołudniowe (14:45-16:00)</span>
            <span className="font-bold text-slate-600 dark:text-slate-400">Pomiar: pętle indukcyjne</span>
          </div>
        </div>

        {/* Bar Chart - Sector/Zone Density */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 flex flex-col justify-between opacity-0 animate-fade-in-up stagger-4">
          <div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <Clock className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                Obciążenie Sektorów
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Popyt vs. przepustowość infrastruktury
              </p>
            </div>

            {/* Recharts Bar Chart */}
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
                    tickFormatter={(value) => value.split(' ')[0]}
                  />
                  <YAxis
                    stroke={lightGrayColor}
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      borderRadius: '12px',
                      fontSize: '11px',
                      boxShadow: '0 12px 40px -8px rgba(0,0,0,0.15)',
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

          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <span>Śródmieście: popyt na poziomie 83% limitu</span>
          </div>
        </div>

        {/* Stops Ranking Table */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 opacity-0 animate-fade-in-up stagger-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
                <MapPin className="mr-2 h-4.5 w-4.5 text-emerald-500" />
                Matryca Przystankowa & Wskaźniki Krytyczne
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Rejestr statystyk punktów pomiarowych
              </p>
            </div>

            <div className="flex items-center space-x-1 self-start sm:self-auto shrink-0 bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200/50 dark:border-white/10 rounded-xl">
              {['all', 'high', 'medium', 'low'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedZone(category)}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition-all ${
                    selectedZone === category
                      ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {category === 'all' ? 'Wszystkie' : category === 'high' ? 'Wysokie' : category === 'medium' ? 'Średnie' : 'Niskie'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-b border-slate-200/50 dark:border-white/5">
                <tr>
                  <th scope="col" className="px-4 py-3.5 rounded-tl-lg">Nazwa Przystanku</th>
                  <th scope="col" className="px-4 py-3.5">Kategoria</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Potok / dobę</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Wskaźnik</th>
                  <th scope="col" className="px-4 py-3.5">Linie</th>
                  <th scope="col" className="px-4 py-3.5 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stops
                  .filter((s) => selectedZone === 'all' || s.intensity === selectedZone)
                  .map((stop) => (
                    <tr
                      key={stop.id}
                      className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{stop.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{stop.street}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border ${
                            stop.intensity === 'high'
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                              : stop.intensity === 'medium'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          }`}
                        >
                          {stop.intensity === 'high' ? 'Wysokie' : stop.intensity === 'medium' ? 'Średnie' : 'Niskie'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {stop.dailyPassengers.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {stop.trafficScore}%
                          </span>
                          <div className="h-1.5 w-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                stop.intensity === 'high'
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
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/30 dark:border-white/5"
                            >
                              {line}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {stop.intensity === 'high' ? (
                          <span className="flex items-center text-[10.5px] font-bold text-rose-500">
                            <AlertTriangle className="mr-1 h-3.5 w-3.5 animate-pulse" /> Przeciążenie
                          </span>
                        ) : (
                          <span className="text-[10.5px] font-bold text-emerald-500 flex items-center">
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Stabilny
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
