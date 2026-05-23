import { useState, useEffect, useCallback } from 'react';
import { ActivePage, Stop, AnalysisTab } from './types';
import { STALOWA_WOLA_STOPS } from './data/stalowaWolaData';
import Navbar from './components/Navbar';
import MapMainView from './components/MapMainView';
import LayerAnalysisView from './components/LayerAnalysisView';
import AnalyticalReportView from './components/AnalyticalReportView';
import DashboardView from './components/DashboardView';
import OnboardingTour from './components/OnboardingTour';
import { Sparkles } from 'lucide-react';

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

  const handleStopSelect = useCallback(
    (stop: Stop) => {
      setSelectedStop(stop);
      navigateTo('layers');
    },
    [navigateTo]
  );

  const handleTabSelect = useCallback(
    (_tabId: AnalysisTab) => {
      navigateTo('report');
    },
    [navigateTo]
  );

  const handleGoToDashboard = useCallback(() => {
    navigateTo('dashboard');
  }, [navigateTo]);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* 1. Global Navigation Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={navigateTo}
        theme={theme}
        setTheme={setTheme}
      />



      {/* 3. Render Views dynamically based on activePage state */}
      <main className="flex-1 w-full flex flex-col" key={viewKey}>
        {activePage === 'map' && (
          <div className="animate-fade-in-up flex-1 flex flex-col">
            <MapMainView
              stops={STALOWA_WOLA_STOPS}
              onStopSelect={handleStopSelect}
              transitionToLayers={() => navigateTo('layers')}
              hoveredStopId={hoveredStopId}
              setHoveredStopId={setHoveredStopId}
              selectedStop={selectedStop}
            />
          </div>
        )}

        {activePage === 'layers' && (
          <div className="animate-fade-in-up flex-1 flex flex-col">
            <LayerAnalysisView
              stops={STALOWA_WOLA_STOPS}
              onTabSelection={handleTabSelect}
              hoveredStopId={hoveredStopId}
              setHoveredStopId={setHoveredStopId}
              selectedStop={selectedStop}
              onStopSelect={handleStopSelect}
            />
          </div>
        )}

        {activePage === 'report' && (
          <div className="animate-fade-in-up flex-1 flex flex-col">
            <AnalyticalReportView onGoToDashboard={handleGoToDashboard} />
          </div>
        )}

        {activePage === 'dashboard' && (
          <div className="animate-fade-in-up flex-1 flex flex-col">
            <DashboardView stops={STALOWA_WOLA_STOPS} />
          </div>
        )}
      </main>

      {/* 4. Elegant Minimal outer footer */}
      <footer className="border-t border-slate-200/60 bg-white/40 py-4 transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/40 text-center backdrop-blur-sm">
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-600">
          GeoAnalytica · Projekt badawczy Stalowej Woli • React + Tailwind 4 + Recharts + MapLibre GL
        </p>
      </footer>

      {/* Interactive onboarding guide */}
      <OnboardingTour activePage={activePage} setActivePage={navigateTo} />
    </div>
  );
}
