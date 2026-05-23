import { useState } from 'react';
import { Stop, AnalysisTab, MapLayer } from '../types';
import { ANALYSIS_TABS } from '../data/stalowaWolaData';
import MapMockup from './MapMockup';
import { Eye, Layers, Compass, HelpCircle, LayoutGrid, Check, Settings, Info, ArrowUpRight } from 'lucide-react';

interface LayerAnalysisViewProps {
  stops: Stop[];
  onTabSelection: (tabId: AnalysisTab) => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
}

export default function LayerAnalysisView({
  stops,
  onTabSelection,
  hoveredStopId,
  setHoveredStopId,
}: LayerAnalysisViewProps) {
  const [activeLayerMode, setActiveLayerMode] = useState<'standard' | 'bdot10k' | 'satellite'>('bdot10k');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('tab1');

  // Multi-layer control structure
  const [bdotVisible, setBdotVisible] = useState<boolean>(true);
  const [satelliteVisible, setSatelliteVisible] = useState<boolean>(false);

  const handleLayerToggle = (mode: 'standard' | 'bdot10k' | 'satellite') => {
    setActiveLayerMode(mode);
    if (mode === 'bdot10k') {
      setBdotVisible(true);
      setSatelliteVisible(false);
    } else if (mode === 'satellite') {
      setBdotVisible(false);
      setSatelliteVisible(true);
    } else {
      setBdotVisible(false);
      setSatelliteVisible(false);
    }
  };

  const handleTabClick = (tabId: AnalysisTab) => {
    setActiveTab(tabId);
    // Smooth transition to View 3 as requested by guidelines
    setTimeout(() => {
      onTabSelection(tabId);
    }, 250);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50 dark:bg-slate-950" id="view-2-layer-analysis">
      {/* 1. Topbar with 5 Tabs (Nawigacja z 5 zakładkami) */}
      <div className="border-b border-slate-200 bg-white px-4 py-2.5 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950 shadow-xs">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Subsection Info */}
          <div className="shrink-0 flex items-center space-x-2">
            <Layers className="h-4.5 w-4.5 text-emerald-500" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-[10px]">
              Filtry Analizy Operacyjnej:
            </span>
          </div>

          {/* 5 Tabs Control Box */}
          <div className="flex flex-wrap items-center gap-1.5 scrollbar-thin overflow-x-auto">
            {ANALYSIS_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-analysis-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight transition-all duration-300 flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md scale-102 dark:bg-white dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-705'
                  }`}
                >
                  <span>{tab.label}</span>
                  <ArrowUpRight className="h-3 w-3 opacity-60 ml-0.5" />
                  {isSelected && (
                    <span className="absolute -bottom-1 left-4 right-4 h-1 rounded bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Workspace containing Layer Maps and Floating Controls */}
      <div className="flex-1 relative bg-slate-50/50 dark:bg-slate-950/20 p-2 sm:p-4 md:p-6 lg:p-8">
        <div className="h-full w-full relative">
          <MapMockup
            stops={stops}
            activeLayer={activeLayerMode}
            onStopClick={() => {}}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
          />

          {/* Floating Panel showing Layer Options (Pływający Panel z przełącznikiem warstw) */}
          <div className="absolute top-4 right-4 z-20 w-72 max-w-xs rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-emerald-400 animate-spin-slow" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Przełącznik Warstw
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
                BDOT10k
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 mb-4 font-medium">
              Wybierz tryb wizualizacji przestrzennego pokrycia terenu, infrastruktury oraz gęstości zabudowy miejskiej w Stalowej Woli.
            </p>

            <div className="space-y-2">
              {/* BDOT10k option */}
              <button
                id="btn-layer-bdot10k"
                onClick={() => handleLayerToggle('bdot10k')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all ${
                  activeLayerMode === 'bdot10k'
                    ? 'bg-white border-white text-slate-950 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-350 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <LayoutGrid className="h-4 w-4" />
                  <div className="text-left">
                    <span className="block font-bold">Warstwa BDOT10k</span>
                    <span className="block text-[9px] font-medium opacity-70">
                      Baza Danych Obiektów Topograficznych
                    </span>
                  </div>
                </div>
                {activeLayerMode === 'bdot10k' && <Check className="h-3.5 w-3.5" />}
              </button>

              {/* Satellite option */}
              <button
                id="btn-layer-satellite"
                onClick={() => handleLayerToggle('satellite')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all ${
                  activeLayerMode === 'satellite'
                    ? 'bg-white border-white text-slate-950 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-350 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Eye className="h-4 w-4" />
                  <div className="text-left">
                    <span className="block font-bold">Zdjęcie Satelitarne</span>
                    <span className="block text-[9px] font-medium opacity-70">
                      Ortofotomapa 2026 i potoki ruchu
                    </span>
                  </div>
                </div>
                {activeLayerMode === 'satellite' && <Check className="h-3.5 w-3.5" />}
              </button>

              {/* Standard option */}
              <button
                id="btn-layer-standard"
                onClick={() => handleLayerToggle('standard')}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all ${
                  activeLayerMode === 'standard'
                    ? 'bg-white border-white text-slate-950 shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-350 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Compass className="h-4 w-4" />
                  <div className="text-left">
                    <span className="block font-bold">Wektor Standard</span>
                    <span className="block text-[9px] font-medium opacity-70">
                      Uproszczona siatka ulic
                    </span>
                  </div>
                </div>
                {activeLayerMode === 'standard' && <Check className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Elegant Floating Legend: Glassmorphism Style in Bottom Corner (Półprzezroczysta legenda) */}
          <div className="absolute bottom-4 right-4 z-20 w-64 rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl transition-all">
            <div className="flex items-center space-x-1.5 border-b border-slate-800 pb-2 mb-2">
              <Info className="h-4 w-4 text-emerald-450" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                Legenda Przestrzenna
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rzeka San / Cieki wodne</span>
                <span className="h-3.5 w-7 rounded bg-blue-900/50 border border-blue-400/20" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Lasy / Tereny zielone</span>
                <span className="h-3.5 w-7 rounded bg-emerald-950/40 border border-emerald-400/20" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Arterie Główne</span>
                <span className="h-1 w-7 rounded bg-slate-600" />
              </div>

              {activeLayerMode === 'bdot10k' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Obiekty BDOT / Zabudowa</span>
                  <span className="h-3.5 w-7 rounded bg-sky-950/40 border border-sky-400/20" />
                </div>
              )}

              {activeLayerMode === 'satellite' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rurociągi i Linie Tranzytowe</span>
                  <span className="h-[2px] w-7 bg-rose-500 border-dashed" />
                </div>
              )}

              <div className="mt-3.5 border-t border-slate-800 pt-2.5">
                <span className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                  Nasycenie Przystanków
                </span>
                <div className="flex items-center justify-between bg-black/10 p-1.5 rounded-lg border border-slate-800/40">
                  <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                    <span className="text-[9px] font-bold text-rose-450">Wysokie</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[9px] font-bold text-amber-400">Średnie</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[9px] font-bold text-emerald-400">Niskie</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt banner to click on general tabs */}
          <div className="absolute bottom-4 left-4 z-20 hidden md:block rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 shadow-2xl backdrop-blur-xl max-w-sm">
            <span className="block text-[11px] font-bold text-white flex items-center">
              <span className="mr-1">💡</span> Wskazówka Interakcji
            </span>
            <span className="block text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
              Wybranie którejkolwiek z gęstości lub linii badawczych (zakładek na górze) natychmiast przeniesie Cię do opracowanego raportu analitycznego.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
