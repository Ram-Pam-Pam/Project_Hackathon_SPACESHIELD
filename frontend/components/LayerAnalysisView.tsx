import { useState } from 'react';
import { Stop, AnalysisTab } from '../types';
import { ANALYSIS_TABS } from '../data/stalowaWolaData';
import MapMockup from './MapMockup';
import { Eye, Layers, Compass, LayoutGrid, Check, Settings, Info, ArrowUpRight, Lightbulb, Users } from 'lucide-react';

interface LayerAnalysisViewProps {
  stops: Stop[];
  onTabSelection: (tabId: AnalysisTab) => void;
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
  selectedStop?: Stop | null;
  onStopSelect?: (stop: Stop) => void;
}

export default function LayerAnalysisView({
  stops,
  onTabSelection,
  hoveredStopId,
  setHoveredStopId,
  selectedStop = null,
  onStopSelect = () => {},
}: LayerAnalysisViewProps) {
  const [activeLayerMode, setActiveLayerMode] = useState<'standard' | 'bdot10k' | 'satellite' | 'populacja_h3'>('bdot10k');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('tab1');

  const handleLayerToggle = (mode: 'standard' | 'bdot10k' | 'satellite' | 'populacja_h3') => {
    setActiveLayerMode(mode);
  };

  const handleTabClick = (tabId: AnalysisTab) => {
    setActiveTab(tabId);
    // Smooth transition to View 3 as requested by guidelines
    setTimeout(() => {
      onTabSelection(tabId);
    }, 200);
  };

  const layerOptions = [
    {
      id: 'bdot10k' as const,
      icon: LayoutGrid,
      name: 'Warstwa BDOT10k',
      desc: 'Baza Danych Obiektów Topograficznych',
    },
    {
      id: 'satellite' as const,
      icon: Eye,
      name: 'Zdjęcie Satelitarne',
      desc: 'Ortofotomapa 2026 i potoki ruchu',
    },
    {
      id: 'populacja_h3' as const,
      icon: Users,
      name: 'Populacja H3',
      desc: 'Siatka zagęszczenia ludności H3',
    },
    {
      id: 'standard' as const,
      icon: Compass,
      name: 'Wektor Standard',
      desc: 'Uproszczona siatka ulic',
    },
  ];

  return (
    <div className="flex h-[calc(100vh-6.5rem)] flex-col bg-slate-50 dark:bg-slate-950" id="view-2-layer-analysis">
      {/* 1. Topbar with 5 Tabs */}
      <div className="border-b border-slate-200 bg-white px-4 py-3 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Subsection Info */}
          <div className="shrink-0 flex items-center space-x-2">
            <Layers className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Filtry Analizy Operacyjnej
            </span>
          </div>

          {/* 5 Tabs Control Box */}
          <div id="operational-filters-tabs" className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {ANALYSIS_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-analysis-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  className={`relative rounded-full px-4 py-2 text-[11px] font-semibold tracking-tight transition-all duration-300 flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-950'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <ArrowUpRight className={`h-3 w-3 transition-all ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                  {isSelected && (
                    <span className="absolute -bottom-[5px] left-4 right-4 h-[3px] rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Interactive Workspace containing Layer Maps and Floating Controls */}
      <div className="flex-1 relative bg-slate-50/50 dark:bg-slate-950/20 p-2 sm:p-3 md:p-4 lg:p-6">
        <div className="h-full w-full relative">
          <MapMockup
            stops={stops}
            activeLayer={activeLayerMode}
            onStopClick={onStopSelect}
            hoveredStopId={hoveredStopId}
            setHoveredStopId={setHoveredStopId}
            isFlat={true}
            selectedStop={selectedStop}
          />

          {/* Floating Panel showing Layer Options */}
          <div className="absolute top-4 right-4 z-20 w-72 max-w-xs rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl animate-slide-in-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-emerald-400 animate-[spin_12s_linear_infinite]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Przełącznik Warstw
                </h3>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                {activeLayerMode === 'bdot10k' ? 'BDOT10k' : activeLayerMode === 'satellite' ? 'SAT' : activeLayerMode === 'populacja_h3' ? 'POP_H3' : 'STD'}
              </span>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 mb-4 font-medium">
              Wybierz tryb wizualizacji pokrycia terenu i infrastruktury w Stalowej Woli.
            </p>

            <div className="space-y-2">
              {layerOptions.map((layer) => {
                const LayerIcon = layer.icon;
                const isActive = activeLayerMode === layer.id;
                return (
                  <button
                    key={layer.id}
                    id={`btn-layer-${layer.id}`}
                    onClick={() => handleLayerToggle(layer.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all duration-200 ${
                      isActive
                        ? 'bg-white border-white text-slate-950 shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-emerald-500/30 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <LayerIcon className="h-4 w-4" />
                      <div className="text-left">
                        <span className="block font-bold">{layer.name}</span>
                        <span className="block text-[9px] font-medium opacity-70">{layer.desc}</span>
                      </div>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Elegant Floating Legend: Glassmorphism Style in Bottom Corner */}
          <div className="absolute bottom-4 right-4 z-20 w-64 rounded-2xl border border-white/10 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl transition-all animate-fade-in">
            <div className="flex items-center space-x-1.5 border-b border-slate-800 pb-2 mb-2.5">
              <Info className="h-4 w-4 text-emerald-400" />
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
                  <span className="text-slate-400">Linie Tranzytowe</span>
                  <span className="h-[2px] w-7 bg-rose-500 border-dashed" />
                </div>
              )}

              <div className="mt-3 border-t border-slate-800 pt-2.5">
                <span className="block text-[10px] text-slate-500 font-bold mb-1.5 uppercase tracking-wider">
                  Nasycenie Przystanków
                </span>
                <div className="flex items-center justify-between bg-black/10 p-2 rounded-lg border border-slate-800/40">
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse" />
                    <span className="text-[9px] font-bold text-rose-400">Wysokie</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                    <span className="text-[9px] font-bold text-amber-400">Średnie</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <span className="text-[9px] font-bold text-emerald-400">Niskie</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prompt banner to click on tabs */}
          <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-start space-x-2.5 rounded-xl border border-white/10 bg-slate-950/85 px-4 py-3 shadow-2xl backdrop-blur-xl max-w-sm animate-fade-in">
            <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-float" />
            <div>
              <span className="block text-[11px] font-bold text-white">
                Wskazówka Interakcji
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                Wybranie zakładki u góry przeniesie Cię do opracowanego raportu analitycznego.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
