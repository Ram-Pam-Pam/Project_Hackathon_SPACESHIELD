import { useState, useEffect } from 'react';
import { ActivePage, Stop, AnalysisTab } from './types';
import { STALOWA_WOLA_STOPS } from './data/stalowaWolaData';
import Navbar from './components/Navbar';
import MapMainView from './components/MapMainView';
import LayerAnalysisView from './components/LayerAnalysisView';
import AnalyticalReportView from './components/AnalyticalReportView';
import DashboardView from './components/DashboardView';
import { Info, Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('map');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  // Initialize Dark Theme by default matching custom styling preference
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleStopSelect = (stop: Stop) => {
    setSelectedStop(stop);
    setActivePage('layers'); // Transition to View 2 on clicking any stop
  };

  const handleTabSelect = (tabId: AnalysisTab) => {
    setActivePage('report'); // Transition to View 3 on selecting a top tab in View 2
  };

  const handleGoToDashboard = () => {
    setActivePage('dashboard'); // Transition to View 4 on CTA click in View 3
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        setTheme={setTheme}
      />

      {/* 2. Top notification ticker */}
      <div className="bg-gradient-to-r from-cyan-600/90 to-blue-700/90 px-4 py-2 text-center text-[11px] font-bold text-white shadow-sm flex items-center justify-center space-x-2">
        <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-200" />
        <span>Sondaż przestrzenny i symulacja potoków pasażerskich Stalowej Woli aktywne. Klikaj węzły by badać warstwy.</span>
        <span className="hidden sm:inline-block rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-extrabold text-white">
          Wersja podglądowa
        </span>
      </div>

      {/* 3. Render Views dynamically based on activePage state */}
      <main className="flex-1 w-full flex flex-col">
        {activePage === 'map' && (
          <MapMainView
            stops={STALOWA_WOLA_STOPS}
            onStopSelect={handleStopSelect}
            transitionToLayers={() => setActivePage('layers')}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
          />
        )}

        {activePage === 'layers' && (
          <LayerAnalysisView
            stops={STALOWA_WOLA_STOPS}
            onTabSelection={handleTabSelect}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
          />
        )}

        {activePage === 'report' && (
          <AnalyticalReportView
            onGoToDashboard={handleGoToDashboard}
          />
        )}

        {activePage === 'dashboard' && (
          <DashboardView
            stops={STALOWA_WOLA_STOPS}
          />
        )}
      </main>

      {/* 4. Elegant Minimal outer footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 py-4 transition-colors duration-300 dark:border-slate-900/60 dark:bg-slate-950/40 text-center">
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
          Projekt badawczy Stalowej Woli • Zbudowano przy użyciu React + Tailwind 4 + Recharts • zalogowano użytkownika: agnieszka.wegrzyn67@gmail.com
        </p>
      </footer>
    </div>
  );
}
