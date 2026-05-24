import { useState, useEffect, useCallback } from 'react';
import { ActivePage, Stop } from './types';
import { STALOWA_WOLA_STOPS } from './data/stalowaWolaData';
import Navbar from './components/Navbar';
import OverviewView from './components/OverviewView';
import WhiteSpotsView from './components/WhiteSpotsView';
import CustomAnalysisView from './components/CustomAnalysisView';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('map');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [viewKey, setViewKey] = useState(0);

  // Synchronize documentElement dark class with theme state
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const navigateTo = useCallback((page: ActivePage) => {
    setViewKey((k) => k + 1);
    setActivePage(page);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        theme={theme}
        setTheme={setTheme}
      />

      {/* 2. Render Views dynamically based on activePage state */}
      <main className="flex-1 w-full flex flex-col" key={viewKey}>
        {activePage === 'map' && (
          <OverviewView
            stops={STALOWA_WOLA_STOPS}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
            selectedStop={selectedStop}
            onStopSelect={setSelectedStop}
          />
        )}

        {activePage === 'whitespots' && (
          <WhiteSpotsView
            stops={STALOWA_WOLA_STOPS}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
            selectedStop={selectedStop}
            onStopSelect={setSelectedStop}
          />
        )}

        {activePage === 'creator' && (
          <CustomAnalysisView />
        )}
      </main>

      {/* 3. Elegant Minimal outer footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 py-4 transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/40 text-center backdrop-blur-sm">
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
          GeoAnalytica · Projekt badawczy Stalowej Woli • React + Tailwind 4 + Recharts + MapLibre GL
        </p>
      </footer>
    </div>
  );
}
