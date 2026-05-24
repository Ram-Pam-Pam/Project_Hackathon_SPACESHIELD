import { useState, useEffect } from 'react';
import { Stop } from '../types';
import MapMockup from './MapMockup';
import {
  AreaChart,
  Area,
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
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface WhiteSpotsViewProps {
  stops: Stop[];
  hoveredStopId: string | null;
  setHoveredStopId: (id: string | null) => void;
  selectedStop: Stop | null;
  onStopSelect: (stop: Stop | null) => void;
}

interface WhiteSpotZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  efficiencyScore: number; // Low means "wozi powietrze"
}

const WHITE_SPOT_ZONES: WhiteSpotZone[] = [
  {
    id: 'jp2',
    name: 'Korytarz Al. Jana Pawła II',
    lat: 50.569,
    lng: 22.052,
    description: 'Wysoka częstotliwość kursów linii 1 i 10, lecz średnie napełnienie poniżej 15%. Klasyczny przypadek dublowania tras.',
    efficiencyScore: 18
  },
  {
    id: 'hsw',
    name: 'Strefa Przemysłowa HSW',
    lat: 50.555,
    lng: 22.062,
    description: 'Niedopasowanie godzin odjazdów do zmian pracowniczych. Autobusy jeżdżą puste między szczytami zmianowymi.',
    efficiencyScore: 25
  },
  {
    id: 'rozwadow',
    name: 'Dzielnica Rozwadów',
    lat: 50.590,
    lng: 22.049,
    description: 'Obszar o niskiej gęstości zaludnienia obsługiwany taborem wielkogabarytowym (12m). Wysokie koszty wozokilometra.',
    efficiencyScore: 32
  }
];

export default function WhiteSpotsView({
  stops,
  hoveredStopId,
  setHoveredStopId,
  selectedStop,
  onStopSelect,
}: WhiteSpotsViewProps) {
  // Scenario days
  const [selectedDay, setSelectedDay] = useState<'monday' | 'wednesday' | 'saturday'>('monday');
  // Selected spot/stop for analysis
  const [activeZone, setActiveZone] = useState<WhiteSpotZone | Stop | null>(null);
  // Modal toggler
  const [showOptionsModal, setShowOptionsModal] = useState<boolean>(false);
  // TIF satellite overlay states
  const [showTifOverlay, setShowTifOverlay] = useState<boolean>(true);
  // Analytical layers visibility states
  const [showBus369, setShowBus369] = useState<boolean>(false);
  const [showPieszo51015, setShowPieszo51015] = useState<boolean>(false);
  const [mapBaseLayer, setMapBaseLayer] = useState<'standard' | 'satellite' | 'bdot10k' | 'populacja_h3'>('standard');
  const [activeLegendInterval, setActiveLegendInterval] = useState<{ layer: 'bus_369' | 'pieszo_51015'; interval: string } | null>(null);
  const [showStops, setShowStops] = useState<boolean>(true);
  const [showLines, setShowLines] = useState<boolean>(true);

  // Side panels toggle states (responsive drawers)
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  // Loading state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  // AI results state
  const [aiResult, setAiResult] = useState<{
    kpis: Array<{ title: string; value: string; desc: string; isAlert?: boolean }>;
    hourlyFlow: Array<{ time: string; flowCount: number; delayMinutes: number }>;
    zoneComparison: Array<{ zone: string; passengers: number; capacity: number }>;
    report: string;
    optionTitle: string;
  } | null>(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleZoneSelect = (zone: WhiteSpotZone | Stop) => {
    setActiveZone(zone);
    setShowOptionsModal(true);
  };

  const handleMapClickAnalysis = (coords: { lat: number; lng: number }) => {
    const customZone: WhiteSpotZone = {
      id: 'custom-click-zone',
      name: `Punkt pomiarowy (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
      lat: coords.lat,
      lng: coords.lng,
      efficiencyScore: 0,
      description: `Analiza optymalizacji obszaru wokół punktu geograficznego o współrzędnych ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}.`
    };
    setActiveZone(customZone);
    setShowOptionsModal(true);
  };

  const handleOptionSelect = async (optionId: number) => {
    if (!activeZone) return;
    
    // Zamykamy modal i pokazujemy kręciołek
    setShowOptionsModal(false);
    setIsAnalyzing(true);
    setAiResult(null);
    setAnalysisProgress('Łączenie z silnikiem Gemini AI...');

    // Tłumaczymy dzień tygodnia z frontendu na czytelny tekst dla AI
    const kontekst = selectedDay === 'monday' ? 'Poniedziałek (Szczyt poranny)' 
                   : selectedDay === 'wednesday' ? 'Środa (Szczyt popołudniowy)' 
                   : 'Sobota (Weekend)';

    // Budujemy paczkę dla naszego backendu FastAPI
    const payload = {
      id_opcji: `opcja_${optionId}`,
      kontekst_czasowy: kontekst,
      id_plamy: 'id' in activeZone ? activeZone.id : undefined,
      lat: activeZone.lat,
      lng: activeZone.lng
    };

    try {
      console.log("🚀 Wysyłam zapytanie do API:", payload);
      
      // Prawdziwy strzał do Twojego działającego API
      // Pobieranie URL backendu ze zmiennych środowiskowych Rendera
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      console.log(`🚀 Wysyłam zapytanie do API na adres: ${API_URL}/api/analiza/generuj`, payload);
      
      const response = await fetch(`${API_URL}/api/analiza/generuj`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);

      // Odbieramy gotowego JSON-a od Gemini
      const aiData = await response.json();
      console.log("✅ Raport AI odebrany!", aiData);

      // Wstrzykujemy dane do interfejsu (zostawiając makiety wykresów dla pięknego dema)
      setAiResult({
        optionTitle: aiData.tytul_raportu || `Analiza AI`,
        report: `### 🤖 Diagnoza Modelu AI\n${aiData.diagnoza_problemu}\n\n#### Rekomendacje Wdrożeniowe:\n${aiData.rekomendacja_dzialan}`,
        kpis: aiData.dane_do_wykresu ? aiData.dane_do_wykresu.map((d: any) => ({
          title: d.kategoria,
          value: String(d.wartosc) + (d.kategoria.includes('%') ? '%' : ''),
          desc: 'Wskazanie modelu',
          isAlert: typeof d.wartosc === 'number' && d.wartosc > 50
        })) : [],
        hourlyFlow: [
          { time: '07:00', flowCount: 250, delayMinutes: 12 },
          { time: '08:00', flowCount: 520, delayMinutes: 25 },
          { time: '14:00', flowCount: 380, delayMinutes: 15 },
          { time: '15:00', flowCount: 620, delayMinutes: 10 }
        ],
        zoneComparison: [
          { zone: 'Obecna sytuacja', passengers: 200, capacity: 150 },
          { zone: 'Rekomendacja AI', passengers: 450, capacity: 500 }
        ]
      });

    } catch (error) {
      console.error("❌ Błąd podczas łączenia z AI:", error);
      setAiResult({
         optionTitle: "Błąd połączenia",
         report: "Nie udało się połączyć z backendem. Upewnij się, że serwer FastAPI jest włączony na porcie 8000.",
         kpis: [], hourlyFlow: [], zoneComparison: []
      });
    } finally {
      setIsAnalyzing(false);
      // Przewijanie do wyniku
      setTimeout(() => {
        document.getElementById('ai-results-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const primaryColor = '#10b981'; // emerald-500
  const lightGrayColor = isDark ? '#475569' : '#94a3b8';
  const gridLineColor = isDark ? 'rgba(71, 85, 105, 0.15)' : 'rgba(226, 232, 240, 0.6)';

  return (
    <div className="flex min-h-[calc(100vh-6.5rem)] flex-col bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-6" id="view-2-whitespots">

      {/* Top Cockpit Header & Scenario Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-500 flex items-center">
            <ShieldAlert className="h-4 w-4 mr-1 animate-pulse" /> Centrum Analizy Anomalii (Białe Plamy)
          </span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            <span className="text-gradient-primary">Interaktywne</span>
            <span className="text-slate-900 dark:text-white"> Studium Przypadku AI</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Wybierz scenariusz obciążenia i kliknij białą plamę na mapie, aby uruchomić silnik optymalizacyjny AI.
          </p>
        </div>

        {/* Controls Cockpit */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
          {/* TIF Satellite Overlay Toggle */}
          <button
            onClick={() => setShowTifOverlay(!showTifOverlay)}
            className={`rounded-xl px-3 py-1.5 text-[10.5px] font-bold border transition-all flex items-center space-x-1.5 shadow-sm active:scale-[0.98] ${showTifOverlay
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
              }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Nałóż wycinek TIF (Satelita AI)</span>
          </button>

        </div>
      </div>

      {/* Main Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Column: List of White Spots + Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">

          {/* Quick-action White Spots list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
              <ShieldAlert className="h-4 w-4 text-cyan-500 mr-1.5" /> Wykryte anomalie komunikacyjne
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {WHITE_SPOT_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => handleZoneSelect(zone)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${activeZone?.id === zone.id
                    ? 'border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 dark:border-white/5 dark:bg-slate-950/40 dark:hover:bg-slate-900/50'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-extrabold uppercase text-cyan-500 font-mono">Biała Plama</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                      Napełnienie: {zone.efficiencyScore}%
                    </span>
                  </div>
                  <strong className="text-xs text-slate-900 dark:text-white mt-1.5 block leading-tight">{zone.name}</strong>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{zone.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map */}
          <div className="relative flex-1 min-h-[620px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-900/50">

            {/* Map Component */}
            <MapMockup
              stops={stops}
              activeLayer={mapBaseLayer}
              onStopClick={(stop) => handleZoneSelect(stop)}
              hoveredStopId={hoveredStopId}
              setHoveredStopId={setHoveredStopId}
              selectedStop={selectedStop}
              showTifOverlay={showTifOverlay}
              tifOverlayCoords={activeZone ? { lat: activeZone.lat, lng: activeZone.lng } : null}
              showBus369={showBus369}
              showPieszo51015={showPieszo51015}
              activeLegendInterval={activeLegendInterval}
              showStops={showStops}
              showLines={showLines}
              hoverCtaLabel="Analizuj"
              popupCtaLabel="Analizuj"
              showTrafficLoadLegend={false}
              onMapClickAnalysis={handleMapClickAnalysis}
            />

            {/* Floating Trigger Buttons (mobile/desktop overlays) */}
            <div className="absolute top-4 right-4 z-30 flex flex-col space-y-2 pointer-events-auto">
              <button
                onClick={() => setIsLayersOpen(!isLayersOpen)}
                className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center ${isLayersOpen
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-slate-950/80 hover:bg-slate-900 text-slate-200 border-white/10'
                  }`}
                title="Zarządzanie warstwami"
              >
                <Layers className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className={`p-2.5 rounded-xl border shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center justify-center ${isLegendOpen
                    ? 'bg-emerald-500 text-white border-emerald-400'
                    : 'bg-slate-950/80 hover:bg-slate-900 text-slate-200 border-white/10'
                  }`}
                title="Interaktywna Legenda"
              >
                <Activity className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Backdrop for mobile drawers */}
            {isLayersOpen && (
              <div
                onClick={() => setIsLayersOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
              />
            )}
            {isLegendOpen && (
              <div
                onClick={() => setIsLegendOpen(false)}
                className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
              />
            )}

            {/* Layers panel (floating widget on desktop, drawer on mobile) */}
            {isLayersOpen && (
              <div className="absolute top-20 right-4 z-40 w-64 bg-slate-950/90 text-white border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-auto max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:bottom-0 max-lg:h-screen max-lg:w-80 max-lg:rounded-none max-lg:border-l max-lg:border-t-0 max-lg:border-b-0 max-lg:border-r-0 max-lg:p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Warstwy Mapy</span>
                  </div>
                  <button
                    onClick={() => setIsLayersOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Podkład mapy</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'standard', label: 'Standard' },
                        { id: 'satellite', label: 'Satelita' },
                        { id: 'bdot10k', label: 'BDOT10k' },
                        { id: 'populacja_h3', label: 'Populacja H3' },
                      ].map((lay) => (
                        <button
                          key={lay.id}
                          onClick={() => setMapBaseLayer(lay.id as any)}
                          className={`px-2 py-1 text-[10px] font-bold rounded-lg border text-center transition-all ${mapBaseLayer === lay.id
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                              : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                            }`}
                        >
                          {lay.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Warstwy sieci i analizy</label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showStops}
                            onChange={(e) => setShowStops(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-slate-200">Przystanki komunikacyjne</span>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showLines}
                            onChange={(e) => setShowLines(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-slate-200">Trasy i linie autobusowe</span>
                        </div>
                        <span className="h-1 w-4 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showBus369}
                            onChange={(e) => {
                              setShowBus369(e.target.checked);
                              if (!e.target.checked && activeLegendInterval?.layer === 'bus_369') {
                                setActiveLegendInterval(null);
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-slate-200">Obszar Bus (3-6-9 min)</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showPieszo51015}
                            onChange={(e) => {
                              setShowPieszo51015(e.target.checked);
                              if (!e.target.checked && activeLegendInterval?.layer === 'pieszo_51015') {
                                setActiveLegendInterval(null);
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-slate-200">Obszar Pieszo (5-10-15 min)</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/10 transition-all cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showTifOverlay}
                            onChange={(e) => setShowTifOverlay(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/30 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-slate-200">Satelita AI (TIF)</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend panel (floating widget on desktop, drawer on mobile) */}
            {isLegendOpen && (
              <div className="absolute top-20 left-4 z-40 w-64 bg-slate-950/90 text-white border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-auto max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:bottom-0 max-lg:h-screen max-lg:w-80 max-lg:rounded-none max-lg:border-r max-lg:border-t-0 max-lg:border-b-0 max-lg:border-l-0 max-lg:p-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">Legenda Interaktywna</span>
                  </div>
                  <button
                    onClick={() => setIsLegendOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-4 text-left animate-fade-in">
                  {/* Obciążenie taboru (zawsze widoczne w legendzie) */}
                  <div className="space-y-2 pb-3 border-b border-white/5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Natężenie ruchu (Stalowa Wola)</span>
                    <div className="grid grid-cols-1 gap-1.5 text-[10.5px]">
                      <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 rounded-lg">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 animate-pulse"></span>
                        <span className="font-semibold text-slate-200">Wysokie obciążenie</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 rounded-lg">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
                        <span className="font-semibold text-slate-200">Średnie obciążenie</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-slate-900/40 border border-white/5 p-1.5 rounded-lg">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
                        <span className="font-semibold text-slate-200">Niskie obciążenie</span>
                      </div>
                    </div>
                  </div>

                  {/* Informacja o warstwach analitycznych */}
                  {!showBus369 && !showPieszo51015 && (
                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                      Włącz warstwy analityczne (Autobus lub Pieszy) w panelu warstw, aby zobaczyć izochrony i wchodzić w interakcję z mapą.
                    </p>
                  )}

                  {showBus369 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Obszar Autobusowy</span>
                        <span className="text-[8px] text-slate-500 font-bold">HOVER / CLICK</span>
                      </div>
                      <div className="space-y-1">
                        {[
                          { interval: '0 - 3', label: 'Do 3 min', color: 'bg-emerald-500/50 border-emerald-400', border: '#10b981' },
                          { interval: '3 - 6', label: '3 - 6 min', color: 'bg-cyan-500/40 border-cyan-400', border: '#06b6d4' },
                          { interval: '6 - 9', label: '6 - 9 min', color: 'bg-blue-500/30 border-blue-400', border: '#3b82f6' },
                        ].map((item) => {
                          const isHighlighted = activeLegendInterval?.layer === 'bus_369' && activeLegendInterval?.interval === item.interval;
                          const isAnyHighlighted = activeLegendInterval !== null;
                          const isDimmed = isAnyHighlighted && !isHighlighted;
                          return (
                            <div
                              key={item.interval}
                              onMouseEnter={() => setActiveLegendInterval({ layer: 'bus_369', interval: item.interval })}
                              onMouseLeave={() => setActiveLegendInterval(null)}
                              onClick={() => {
                                if (activeLegendInterval?.layer === 'bus_369' && activeLegendInterval?.interval === item.interval) {
                                  setActiveLegendInterval(null);
                                } else {
                                  setActiveLegendInterval({ layer: 'bus_369', interval: item.interval });
                                }
                              }}
                              className={`flex items-center space-x-3 p-1.5 rounded-lg border transition-all cursor-pointer ${isHighlighted
                                  ? 'bg-white/10 border-white/20 scale-[1.02]'
                                  : 'bg-slate-900/40 border-transparent hover:border-white/5'
                                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                            >
                              <span className={`h-3 w-6 rounded border ${item.color}`} style={{ borderColor: item.border }} />
                              <span className="text-[11px] font-medium text-slate-200">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showPieszo51015 && (
                    <div className={`space-y-2 ${showBus369 ? 'border-t border-white/5 pt-3' : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Obszar Pieszy</span>
                        <span className="text-[8px] text-slate-500 font-bold">HOVER / CLICK</span>
                      </div>
                      <div className="space-y-1">
                        {[
                          { interval: '0 - 5', label: 'Do 5 min', color: 'bg-amber-500/50 border-amber-400', border: '#f59e0b' },
                          { interval: '5 - 10', label: '5 - 10 min', color: 'bg-orange-500/40 border-orange-400', border: '#f97316' },
                          { interval: '10 - 15', label: '10 - 15 min', color: 'bg-rose-500/30 border-rose-400', border: '#ef4444' },
                        ].map((item) => {
                          const isHighlighted = activeLegendInterval?.layer === 'pieszo_51015' && activeLegendInterval?.interval === item.interval;
                          const isAnyHighlighted = activeLegendInterval !== null;
                          const isDimmed = isAnyHighlighted && !isHighlighted;
                          return (
                            <div
                              key={item.interval}
                              onMouseEnter={() => setActiveLegendInterval({ layer: 'pieszo_51015', interval: item.interval })}
                              onMouseLeave={() => setActiveLegendInterval(null)}
                              onClick={() => {
                                if (activeLegendInterval?.layer === 'pieszo_51015' && activeLegendInterval?.interval === item.interval) {
                                  setActiveLegendInterval(null);
                                } else {
                                  setActiveLegendInterval({ layer: 'pieszo_51015', interval: item.interval });
                                }
                              }}
                              className={`flex items-center space-x-3 p-1.5 rounded-lg border transition-all cursor-pointer ${isHighlighted
                                  ? 'bg-white/10 border-white/20 scale-[1.02]'
                                  : 'bg-slate-900/40 border-transparent hover:border-white/5'
                                } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                            >
                              <span className={`h-3 w-6 rounded border ${item.color}`} style={{ borderColor: item.border }} />
                              <span className="text-[11px] font-medium text-slate-200">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Simulated Loading overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-40 text-center px-6">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Silnik AI przetwarza dane</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1 animate-pulse">{analysisProgress}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Dashboard and Report (5 cols) */}
        <div className="lg:col-span-5 flex flex-col" id="ai-results-panel">
          {aiResult ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">

              {/* AI Report Markdown Panel */}
              <div className="rounded-2xl border border-emerald-500/20 bg-white p-5 dark:border-emerald-500/20 dark:bg-slate-900 flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 font-mono">
                      Wnioski AI
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-500 dark:text-slate-400 text-right line-clamp-1 max-w-[200px]">
                    {aiResult.optionTitle}
                  </span>
                </div>

                {/* Markdown text container */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 prose dark:prose-invert">
                  <div dangerouslySetInnerHTML={{
                    __html: aiResult.report
                      .replace(/### (.*)/g, '<h3 class="text-sm font-bold text-slate-900 dark:text-white mt-4 first:mt-0">$1</h3>')
                      .replace(/#### (.*)/g, '<h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">$1</h4>')
                      .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>')
                      .replace(/\d+\. (.*)/g, '<li class="ml-4 list-decimal">$1</li>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>
              </div>

              {/* Bento Dashboard stats and charts */}
              <div className="space-y-4 mt-6">

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-3">
                  {aiResult.kpis.map((kpi, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border bg-white p-3.5 dark:bg-slate-900 transition-colors ${kpi.isAlert
                        ? 'border-cyan-500/30 bg-cyan-500/5 dark:border-cyan-500/20'
                        : 'border-slate-200 dark:border-white/10'
                        }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                        {kpi.title}
                      </span>
                      <strong className={`text-base font-extrabold block mt-1 font-mono ${kpi.isAlert ? 'text-cyan-500' : 'text-slate-900 dark:text-white'}`}>
                        {kpi.value}
                      </strong>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-tight mt-0.5">
                        {kpi.desc}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Chart 1: Hourly Flow */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                    <Activity className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Profil Potoku Pasażerskiego w Szczycie
                  </h4>
                  <div className="h-44 w-full text-[10px] font-mono relative min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={aiResult.hourlyFlow} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                        <XAxis dataKey="time" stroke={lightGrayColor} fontSize={9} />
                        <YAxis stroke={lightGrayColor} fontSize={9} />
                        <Tooltip />
                        <Area type="monotone" dataKey="flowCount" stroke="#06b6d4" strokeWidth={2} fill="url(#flowGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Capacity Comparison */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 flex items-center">
                    <Layers className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Obciążenie vs. Przepustowość Sektora
                  </h4>
                  <div className="h-44 w-full text-[10px] font-mono relative min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aiResult.zoneComparison} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                        <XAxis dataKey="zone" stroke={lightGrayColor} fontSize={9} />
                        <YAxis stroke={lightGrayColor} fontSize={9} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 9 }} />
                        <Bar name="Liczba Pasażerów" dataKey="passengers" fill={primaryColor} radius={[4, 4, 0, 0]} />
                        <Bar name="Pojemność Tablicowa" dataKey="capacity" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10 text-center flex flex-col items-center justify-center min-h-[500px] bg-white dark:bg-slate-900">
              <Sparkles className="h-10 w-10 text-emerald-500 mb-4 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Silnik AI gotowy do pracy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-2 leading-relaxed">
                Wybierz interesującą Cię anomalię komunikacyjną (Białą Plamę) z listy powyżej lub kliknij przystanek na mapie, aby otworzyć panel decyzyjny.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 6-Option Modal Popup */}
      {showOptionsModal && activeZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                <h3 className="text-base font-bold text-white">Wybierz Moduł Analizy AI</h3>
              </div>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Zone Info card */}
            <div className="bg-slate-950/50 border border-white/5 p-3 rounded-xl">
              <span className="text-[8px] font-bold uppercase text-emerald-400 block">Analizowany obszar:</span>
              <strong className="text-sm text-white mt-0.5 block">{activeZone.name}</strong>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {'street' in activeZone ? `Ulica: ${activeZone.street} • Potok pasażerski: ${activeZone.dailyPassengers} / db` : activeZone.description}
              </p>
            </div>

            {/* 6 options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[
                { id: 1, title: 'Możliwe zmiany w układzie linii autobusowych', desc: 'Analiza niedoborów rozkładowych i optymalizacja tras.' },
                { id: 2, title: 'Lokalizacja nowych elementów infrastruktury', desc: 'Wyznaczanie miejsc na nowe przystanki i węzły.' },
                { id: 3, title: 'Rekomendacje związane z bezpieczeństwem ruchu', desc: 'Identyfikacja niebezpiecznych przejść i skrzyżowań.' },
                { id: 4, title: 'Potencjalne miejsca rozszerzeń/zwężeń dróg', desc: 'Wyszukiwanie wąskich gardeł w infrastrukturze.' },
                { id: 5, title: 'Działania poprawiające płynność ruchu pieszych i rowerzystów', desc: 'Projektowanie ścieżek i bezpiecznych przejść.' },
                { id: 6, title: 'Propozycje lepszej koordynacji transportu w skali miasta', desc: 'Integracja sieci transportowej i zarządzanie emisjami.' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionSelect(opt.id)}
                  className="flex flex-col text-left p-3 rounded-xl border border-white/5 bg-slate-950 hover:bg-slate-800 hover:border-emerald-500/50 hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-extrabold text-emerald-500 font-mono shrink-0">
                      0{opt.id}
                    </span>
                    <strong className="text-xs text-white leading-tight">{opt.title}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

