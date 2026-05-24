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

  // Mock AI Engine Call (returns a Promise resolving to realistic dashboard & markdown report)
  const mockAICall = (optionId: number, zoneName: string, day: string): Promise<any> => {
    return new Promise((resolve) => {
      // Simulate API steps
      setAnalysisProgress('Wczytywanie zobrazowania satelitarnego BDOT10k...');
      setTimeout(() => {
        setAnalysisProgress('Przetwarzanie macierzy podróży pasażerów...');
        setTimeout(() => {
          setAnalysisProgress('Generowanie optymalnych rekomendacji transportowych...');
          setTimeout(() => {
            // Options specific data mapper
            const dayLabel = day === 'monday' ? 'Poniedziałek (Szczyt poranny)' : day === 'wednesday' ? 'Środa (Szczyt popołudniowy)' : 'Sobota (Weekend)';
            
            let optionTitle = '';
            let kpis = [];
            let hourlyFlow = [];
            let zoneComparison = [];
            let report = '';

            switch (optionId) {
              case 1:
                optionTitle = 'Analiza Niedoborów Częstotliwości (Wykluczenie)';
                kpis = [
                  { title: 'Popyt szczytowy', value: '8,450 pas.', desc: 'Wysokie zapotrzebowanie' },
                  { title: 'Takt średni', value: 'Co 45 min', desc: 'Sugerowany takt: 15 min', isAlert: true },
                  { title: 'Wskaźnik Wykluczenia', value: '64%', desc: 'Brak skomunikowania osiedli', isAlert: true },
                  { title: 'Sugerowane pojazdy', value: '+3 autobusy', desc: 'Dla wyrównania taktu' }
                ];
                hourlyFlow = [
                  { time: '06:00', flowCount: 180, delayMinutes: 2 },
                  { time: '07:00', flowCount: 920, delayMinutes: 12 },
                  { time: '08:00', flowCount: 1450, delayMinutes: 15 },
                  { time: '09:00', flowCount: 650, delayMinutes: 5 },
                  { time: '10:00', flowCount: 300, delayMinutes: 1 }
                ];
                zoneComparison = [
                  { zone: 'Obecna', passengers: 350, capacity: 180 },
                  { zone: 'AI Propozycja', passengers: 750, capacity: 800 }
                ];
                report = `### 🤖 Diagnoza Modelu AI: Wykluczenie Transportowe
Analiza przestrzenna wykazuje krytyczne wykluczenie transportowe w obszarze **${zoneName}** w scenariuszu **${dayLabel}**. 

#### Główne Wyzwania:
*   Mieszkańcy nowo powstałych osiedli pokonują pieszo ponad **850m** do najbliższego punktu komunikacji.
*   Istniejąca linia kursuje zbyt rzadko (takt 45 min), co zmusza pasażerów do przesiadki na transport prywatny.

#### Rekomendacje Wdrożeniowe:
1.  **Zagęszczenie taktu**: Skrócenie czasu oczekiwania do 15 minut w godzinach 7:00 - 9:00.
2.  **Korekta przebiegu linii**: Przekierowanie linii 1 głębiej w głąb osiedla przez nowo wybudowany łącznik drogowy.`;
                break;

              case 2:
                optionTitle = 'Synchronizacja Przesiadek (Huby Komunikacyjne)';
                kpis = [
                  { title: 'Czas oczekiwania', value: '22 min', desc: 'Średni czas na przesiadkę', isAlert: true },
                  { title: 'Stracony czas', value: '180 h / dobę', desc: 'Suma opóźnień pasażerów', isAlert: true },
                  { title: 'Wskaźnik skomunikowania', value: '38%', desc: 'Udane przesiadki' },
                  { title: 'Zysk czasowy', value: '-14 min', desc: 'Po wdrożeniu korekty' }
                ];
                hourlyFlow = [
                  { time: '07:00', flowCount: 450, delayMinutes: 22 },
                  { time: '08:00', flowCount: 520, delayMinutes: 20 },
                  { time: '14:00', flowCount: 680, delayMinutes: 25 },
                  { time: '15:00', flowCount: 820, delayMinutes: 18 },
                  { time: '16:00', flowCount: 710, delayMinutes: 15 }
                ];
                zoneComparison = [
                  { zone: 'Okulickiego Hub', passengers: 420, capacity: 150 },
                  { zone: 'Popiełuszki Hub', passengers: 310, capacity: 120 }
                ];
                report = `### 🤖 Diagnoza Modelu AI: Synchronizacja Węzłów
Wykryto brak koordynacji rozkładów jazdy w kluczowych punktach przesiadkowych strefy **${zoneName}**. 

#### Główne Wyzwania:
*   Autobusy linii 5 odjeżdżają dokładnie **2 minuty przed** przyjazdem linii P, uniemożliwiając płynną przesiadkę.
*   Generuje to średnią stratę 20-25 minut na pasażera w godzinach powrotów z pracy.

#### Rekomendacje Wdrożeniowe:
1.  **Koordynacja rozkładów**: Przesunięcie odjazdu linii 5 o +4 minuty, tworząc tzw. "okienko przesiadkowe".
2.  **Tablice dynamiczne**: Wdrożenie priorytetu na skrzyżowaniach dla opóźnionych pojazdów dowożących pasażerów na przesiadkę.`;
                break;

              case 3:
                optionTitle = 'Isochrony Dostępności Pieszej';
                kpis = [
                  { title: 'Zasięg 5 min', value: '28%', desc: 'Niski stopień pokrycia', isAlert: true },
                  { title: 'Średnie dojście', value: '850 metrów', desc: 'Standard to max 400m', isAlert: true },
                  { title: 'Poza izochroną', value: '45%', desc: 'Obszar odcięty od sieci' },
                  { title: 'Nowe przystanki', value: '2 szt.', desc: 'Wymagane do pokrycia' }
                ];
                hourlyFlow = [
                  { time: '08:00', flowCount: 200, delayMinutes: 5 },
                  { time: '12:00', flowCount: 150, delayMinutes: 4 },
                  { time: '16:00', flowCount: 220, delayMinutes: 6 },
                  { time: '18:00', flowCount: 180, delayMinutes: 5 }
                ];
                zoneComparison = [
                  { zone: 'Izochrona 5m', passengers: 1200, capacity: 5000 },
                  { zone: 'Izochrona 10m', passengers: 3400, capacity: 5000 }
                ];
                report = `### 🤖 Diagnoza Modelu AI: Analiza Isochron Pieszych
Badanie buforów geometrycznych wokół strefy **${zoneName}** wykazuje słabą dostępność pieszą do przystanków MZK.

#### Główne Wyzwania:
*   Ponad 40% mieszkańców musi iść ponad **10 minut pieszo** do najbliższego punktu dostępowego.
*   Brak chodników i przejść dla pieszych w kierunku przystanków zniechęca do korzystania z komunikacji miejskiej.

#### Rekomendacje Wdrożeniowe:
1.  **Nowe lokalizacje przystankowe**: Dodanie dwóch przystanków na żądanie przy głównej arterii mieszkalnej.
2.  **Infrastruktura towarzysząca**: Budowa oświetlonych ciągów pieszo-rowerowych skracających czas dojścia do przystanku.`;
                break;

              case 4:
                optionTitle = 'Wskaźnik Efektywności (Wożenie Powietrza)';
                kpis = [
                  { title: 'Średnie napełnienie', value: '12%', desc: 'Pojazdy w 88% puste', isAlert: true },
                  { title: 'Koszt wozokilometra', value: '8.20 PLN', desc: 'Wysokie straty taboru', isAlert: true },
                  { title: 'Puste przebiegi', value: '78%', desc: 'Ruch pozaszczytowy', isAlert: true },
                  { title: 'Zalecenie taborowe', value: 'Mini-busy', desc: 'Pojazdy 8-metrowe' }
                ];
                hourlyFlow = [
                  { time: '09:00', flowCount: 80, delayMinutes: 1 },
                  { time: '10:00', flowCount: 50, delayMinutes: 0 },
                  { time: '11:00', flowCount: 45, delayMinutes: 1 },
                  { time: '12:00', flowCount: 60, delayMinutes: 0 },
                  { time: '13:00', flowCount: 75, delayMinutes: 2 }
                ];
                zoneComparison = [
                  { zone: 'Obecna Pojemność', passengers: 60, capacity: 500 },
                  { zone: 'Optymalna Pojemność', passengers: 60, capacity: 120 }
                ];
                report = `### 🤖 Diagnoza Modelu AI: Efektywność Napełnienia
Wykryto drastyczną asymetrię między wielkością taboru a faktycznymi potokami pasażerskimi w strefie **${zoneName}**.

#### Główne Wyzwania:
*   W godzinach 9:00 - 13:00 na linii 10 kursują przegubowe autobusy 12-metrowe przewożące średnio 3-5 osób.
*   Wskaźnik wozokilometra przynosi straty finansowe sięgające kilkunastu tysięcy złotych miesięcznie.

#### Rekomendacje Wdrożeniowe:
1.  **Elastyczna wymiana taboru**: Wprowadzenie krótszych pojazdów klasy MIDI/MINI w godzinach pozaszczytowych.
2.  **Transport na żądanie (DRT)**: Uruchomienie aplikacji rezerwacyjnej na weekendy w mało zaludnionych obszarach Stalowej Woli.`;
                break;

              case 5:
                optionTitle = 'Wdrożenie Szybkich Korytarzy (Buspasy)';
                kpis = [
                  { title: 'Prędkość handlowa', value: '14 km/h', desc: 'Bardzo powolny przejazd', isAlert: true },
                  { title: 'Opóźnienie szczytowe', value: '9.5 min', desc: 'Skrzyżowanie zatorowe', isAlert: true },
                  { title: 'Długość korka', value: '1.2 km', desc: 'Zatory codzienne' },
                  { title: 'Zysk z buspasa', value: '+8 km/h', desc: 'Przyspieszenie taboru' }
                ];
                hourlyFlow = [
                  { time: '07:30', flowCount: 880, delayMinutes: 12 },
                  { time: '08:00', flowCount: 1120, delayMinutes: 15 },
                  { time: '15:30', flowCount: 950, delayMinutes: 10 },
                  { time: '16:00', flowCount: 1050, delayMinutes: 14 }
                ];
                zoneComparison = [
                  { zone: 'Przejazd Bez Buspasa', passengers: 14, capacity: 25 },
                  { zone: 'Z Buspasem (Model)', passengers: 22, capacity: 25 }
                ];
                report = `### 🤖 Diagnoza Modelu AI: Szybkie Korytarze
Arteria komunikacyjna w strefie **${zoneName}** odnotowuje drastyczny spadek prędkości handlowej autobusów.

#### Główne Wyzwania:
*   Współdzielenie pasa ruchu z samochodami osobowymi generuje regularne 15-minutowe opóźnienia w godzinach szczytu.
*   Brak priorytetu sygnalizacji świetlnej dla transportu zbiorowego.

#### Rekomendacje Wdrożeniowe:
1.  **Wydzielenie buspasa**: Wyznaczenie prawego pasa ruchu wyłącznie dla autobusów i pojazdów uprzywilejowanych.
2.  **Zielona fala**: Implementacja systemu ITS dającego zielone światło zbliżającemu się autobusowi.`;
                break;

              case 6:
                optionTitle = 'Ekologiczna Alokacja Floty (EV)';
                kpis = [
                  { title: 'Emisja lokalna CO2', value: '240 kg / db', desc: 'Gęsta zabudowa miejska', isAlert: true },
                  { title: 'Zużycie oleju', value: '92 l / dobę', desc: 'Wysokie koszty paliwa' },
                  { title: 'Hałas silnika', value: '78 dB', desc: 'Przekroczenie norm hałasu', isAlert: true },
                  { title: 'Kwalifikacja EV', value: '95%', desc: 'Idealna pod autobusy elektryczne' }
                ];
                hourlyFlow = [
                  { time: '08:00', flowCount: 400, delayMinutes: 3 },
                  { time: '12:00', flowCount: 300, delayMinutes: 2 },
                  { time: '16:00', flowCount: 450, delayMinutes: 4 },
                  { time: '20:00', flowCount: 200, delayMinutes: 1 }
                ];
                zoneComparison = [
                  { zone: 'Emisje Diesel', passengers: 100, capacity: 100 },
                  { zone: 'Emisje Electric (EV)', passengers: 5, capacity: 100 }
                ];
                report = `### 🤖 Diagnoza Modelu AI: Ekologiczna Flota
Analiza profilu emisji i hałasu w strefie **${zoneName}** wykazuje pilną potrzebę alokacji taboru bezemisyjnego.

#### Główne Wyzwania:
*   Trasa przebiega przez gęsto zaludnione obszary mieszkaniowe oraz strefę uzdrowiskowo-parkową.
*   Tradycyjne silniki wysokoprężne generują hałas przekraczający normy o **12 dB**.

#### Rekomendacje Wdrożeniowe:
1.  **Skierowanie autobusów elektrycznych**: Pełna wymiana taboru na linii obsługującej tę strefę na pojazdy elektryczne (EV).
2.  **Punkty szybkiego ładowania**: Budowa ładowarki pantografowej na pętli końcowej w celu zapewnienia ciągłości operacyjnej.`;
                break;
            }

            resolve({
              kpis,
              hourlyFlow,
              zoneComparison,
              report,
              optionTitle
            });
          }, 500);
        }, 500);
      }, 500);
    });
  };

  const handleZoneSelect = (zone: WhiteSpotZone | Stop) => {
    setActiveZone(zone);
    setShowOptionsModal(true);
  };

  const handleOptionSelect = (optionId: number) => {
    if (!activeZone) return;
    setShowOptionsModal(false);
    setIsAnalyzing(true);
    setAiResult(null);

    mockAICall(optionId, activeZone.name, selectedDay).then((res) => {
      setAiResult(res);
      setIsAnalyzing(false);
      // Scroll to result on mobile
      setTimeout(() => {
        document.getElementById('ai-results-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
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
            className={`rounded-xl px-3 py-1.5 text-[10.5px] font-bold border transition-all flex items-center space-x-1.5 shadow-sm active:scale-[0.98] ${
              showTifOverlay
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-900 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Nałóż wycinek TIF (Satelita AI)</span>
          </button>

          {/* Day Scenario Toggler */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-white/10">
            {[
              { id: 'monday' as const, label: 'Poniedziałek (Szczyt poranny)' },
              { id: 'wednesday' as const, label: 'Środa (Szczyt popołudniowy)' },
              { id: 'saturday' as const, label: 'Sobota (Weekend)' },
            ].map((day) => (
              <button
                key={day.id}
                onClick={() => { setSelectedDay(day.id); setAiResult(null); }}
                className={`rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-all whitespace-nowrap ${
                  selectedDay === day.id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
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
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    activeZone?.id === zone.id
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
          <div className="relative flex-1 min-h-[400px] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-slate-100 dark:bg-slate-900/50">
            
            {/* Map Component */}
            <MapMockup
              stops={stops}
              activeLayer="standard"
              onStopClick={(stop) => handleZoneSelect(stop)}
              hoveredStopId={hoveredStopId}
              setHoveredStopId={setHoveredStopId}
              selectedStop={selectedStop}
              showTifOverlay={showTifOverlay}
              tifOverlayCoords={activeZone ? { lat: activeZone.lat, lng: activeZone.lng } : null}
            />

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
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-bold text-slate-500 dark:text-slate-400">
                    {aiResult.optionTitle}
                  </span>
                </div>

                {/* Markdown text container */}
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 prose dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: aiResult.report
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
                      className={`rounded-2xl border bg-white p-3.5 dark:bg-slate-900 transition-colors ${
                        kpi.isAlert
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
                { id: 1, title: 'Częstotliwość i Wykluczenie', desc: 'Analiza niedoborów rozkładowych i braków skomunikowania.' },
                { id: 2, title: 'Synchronizacja Przesiadek', desc: 'Optymalizacja odjazdów w węzłach przesiadkowych.' },
                { id: 3, title: 'Izochrony Dostępności', desc: 'Czas dojścia pieszego do najbliższych punktów sieci.' },
                { id: 4, title: 'Efektywność Taboru', desc: 'Wyszukiwanie pustych przebiegów i optymalnego tonażu.' },
                { id: 5, title: 'Korytarze Szybkie (Buspasy)', desc: 'Wyznaczanie dedykowanych pasów i priorytetów ITS.' },
                { id: 6, title: 'Ekologiczna Flota (EV)', desc: 'Analiza emisji spalin i stopnia przydatności pod elektryki.' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionSelect(opt.id)}
                  className="flex flex-col text-left p-3 rounded-xl border border-white/5 bg-slate-950 hover:bg-slate-800 hover:border-emerald-500/50 hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-center space-x-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-extrabold text-emerald-500 font-mono">
                      0{opt.id}
                    </span>
                    <strong className="text-xs text-white leading-none">{opt.title}</strong>
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
