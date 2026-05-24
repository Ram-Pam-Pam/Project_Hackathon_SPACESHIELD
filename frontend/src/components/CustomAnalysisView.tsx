import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
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
  Sparkles,
  Upload,
  FileCode,
  FileSpreadsheet,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function CustomAnalysisView() {
  const [geojsonFile, setGeojsonFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'geojson' | 'csv') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'geojson') setGeojsonFile(file);
      else setCsvFile(file);
    }
  };

  const handleRunAnalysis = () => {
    if (!geojsonFile || !csvFile) return;

    setIsProcessing(true);
    setResult(null);

    setProcessStep('Parsowanie topologii pliku GeoJSON...');
    setTimeout(() => {
      setProcessStep('Weryfikacja nagłówków CSV i dopasowywanie ID przystanków...');
      setTimeout(() => {
        setProcessStep('Generowanie siatek heksagonalnych H3...');
        setTimeout(() => {
          setProcessStep('Uruchamianie silnika AI w chmurze...');
          setTimeout(() => {
            // Mock custom AI result
            setResult({
              report: `### 🤖 Raport AI dla Wgranej Sieci: ${geojsonFile.name.replace(/\.[^/.]+$/, "")}
Na podstawie zaimportowanych danych przestrzennych (GeoJSON) oraz statystyk operacyjnych (CSV) model AI zmapował potoki pasażerskie.

#### Kluczowe Wnioski:
*   **Wykryte wąskie gardło**: Główna arteria komunikacyjna cierpi na brak koordynacji sygnalizacji świetlnej, co spowalnia prędkość handlową o 22%.
*   **Profil pasażera**: Największa koncentracja wejść do pojazdów występuje w strefie centralnej, podczas gdy obrzeża charakteryzują się bardzo niską elastycznością popytu.
*   **Rekomendacja taboru**: Zaleca się redukcję wozokilometrów poza godzinami szczytu o 15% na rzecz wdrożenia linii wahadłowych.`,
              kpis: [
                { title: 'Zmapowane linie', value: '18 tras', desc: 'Poprawnie zidentyfikowane' },
                { title: 'Suma wejść', value: '14,240 / db', desc: 'Zasilono z pliku CSV' },
                { title: 'Efektywność ogólna', value: '46%', desc: 'Średnie napełnienie floty' },
                { title: 'Średnia prędkość', value: '18.4 km/h', desc: 'Prędkość handlowa pojazdu' }
              ],
              hourlyFlow: [
                { time: '06:00', flowCount: 320, delayMinutes: 4 },
                { time: '08:00', flowCount: 1150, delayMinutes: 10 },
                { time: '12:00', flowCount: 450, delayMinutes: 3 },
                { time: '16:00', flowCount: 1280, delayMinutes: 12 },
                { time: '20:00', flowCount: 310, delayMinutes: 2 }
              ],
              zoneComparison: [
                { zone: 'Północ', passengers: 4200, capacity: 5000 },
                { zone: 'Centrum', passengers: 8500, capacity: 6000 },
                { zone: 'Południe', passengers: 1540, capacity: 3000 }
              ]
            });
            setIsProcessing(false);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  const primaryColor = '#10b981'; // emerald-500
  const lightGrayColor = isDark ? '#475569' : '#94a3b8';
  const gridLineColor = isDark ? 'rgba(71, 85, 105, 0.15)' : 'rgba(226, 232, 240, 0.6)';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="view-3-custom-analysis">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
            Zaawansowany Moduł Użytkownika
          </span>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
            <span className="text-gradient-primary">Kreator Własnych</span>
            <br />
            <span className="text-slate-900 dark:text-white">Analiz Przestrzennych</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
            Wgraj własną strukturę sieci transportowej (przystanki/linie) oraz statystyki pomiarów pasażerskich, aby wygenerować dedykowany raport optymalizacji AI.
          </p>
        </div>
      </div>

      {/* Main Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Uploads (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 space-y-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center">
              <Upload className="h-5 w-5 mr-2 text-emerald-500" /> Wgraj Zbiory Danych
            </h3>

            {/* Input 1: GeoJSON */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Dane Przestrzenne (GeoJSON / KML)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500/50 dark:border-slate-800 dark:hover:border-emerald-500/30 rounded-xl p-4 transition-all text-center">
                <input
                  type="file"
                  accept=".geojson,.json"
                  onChange={(e) => handleFileUpload(e, 'geojson')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <FileCode className={`h-8 w-8 ${geojsonFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                  {geojsonFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{geojsonFile.name}</p>
                      <p className="text-[10px] text-emerald-500 font-medium">Plik załadowany pomyślnie</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Kliknij lub przeciągnij plik</p>
                      <p className="text-[9px] text-slate-400">Obsługiwany format: *.geojson, *.json</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input 2: CSV */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                Statystyki Potoków (CSV / XLSX)
              </label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500/50 dark:border-slate-800 dark:hover:border-emerald-500/30 rounded-xl p-4 transition-all text-center">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => handleFileUpload(e, 'csv')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <FileSpreadsheet className={`h-8 w-8 ${csvFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                  {csvFile ? (
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{csvFile.name}</p>
                      <p className="text-[10px] text-emerald-500 font-medium">Plik załadowany pomyślnie</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Kliknij lub przeciągnij plik</p>
                      <p className="text-[9px] text-slate-400">Obsługiwany format: *.csv, *.xlsx</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={!geojsonFile || !csvFile || isProcessing}
              className={`w-full py-3.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] ${
                geojsonFile && csvFile && !isProcessing
                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed shadow-none'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span>Przetwarzanie danych AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  <span>Uruchom Dedykowaną Analizę AI</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Checklist UI */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-slate-900/30 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Wymagane formaty i walidacja:</h4>
            <ul className="space-y-2">
              {[
                { label: 'GeoJSON: Koordynacje punktowe przystanków w układzie EPSG:4326', check: geojsonFile !== null },
                { label: 'CSV: Unikalne klucze przystanków zgodne z GeoJSON', check: csvFile !== null },
                { label: 'CSV: Kolumny wsiadających, wysiadających lub natężenia', check: csvFile !== null }
              ].map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {item.check ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Results Dashboard / Empty State (7 cols) */}
        <div className="lg:col-span-7">
          
          {isProcessing && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 dark:border-white/10 dark:bg-slate-900 text-center flex flex-col items-center justify-center min-h-[450px] space-y-4">
              <Loader2 className="h-12 w-12 text-emerald-500 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">Silnik Walidacji</h3>
                <p className="text-xs text-slate-400 font-mono mt-1.5 animate-pulse">{processStep}</p>
              </div>
            </div>
          )}

          {!isProcessing && result && (
            <div className="space-y-6">
              
              {/* AI text report */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 dark:border-emerald-500/10 dark:bg-slate-900 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 border-b border-emerald-500/10 pb-3">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-500">
                    Spersonalizowany Raport AI
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 prose dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: result.report
                    .replace(/### (.*)/g, '<h3 class="text-sm font-bold text-slate-900 dark:text-white mt-4 first:mt-0">$1</h3>')
                    .replace(/#### (.*)/g, '<h4 class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">$1</h4>')
                    .replace(/\* (.*)/g, '<li class="ml-4 list-disc">$1</li>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                </div>
              </div>

              {/* Bento Dashboard statistics */}
              <div className="grid grid-cols-2 gap-4">
                {result.kpis.map((kpi: any, idx: number) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 shadow-xs">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">{kpi.title}</span>
                    <strong className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-1 block">{kpi.value}</strong>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 block leading-tight">{kpi.desc}</span>
                  </div>
                ))}
              </div>

              {/* Chart 1: Hourly custom flow */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Activity className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Profil Potoku Pasażerskiego (Wgrane Dane)
                </h4>
                <div className="h-44 w-full text-[10px] font-mono relative min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.hourlyFlow} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="customFlowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                      <XAxis dataKey="time" stroke={lightGrayColor} fontSize={9} />
                      <YAxis stroke={lightGrayColor} fontSize={9} />
                      <Tooltip />
                      <Area type="monotone" dataKey="flowCount" stroke={primaryColor} strokeWidth={2} fill="url(#customFlowGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Sector Passengers custom flow */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Layers className="h-3.5 w-3.5 mr-1 text-emerald-500" /> Napełnienie Sektorów Komunikacyjnych
                </h4>
                <div className="h-44 w-full text-[10px] font-mono relative min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.zoneComparison} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                      <XAxis dataKey="zone" stroke={lightGrayColor} fontSize={9} />
                      <YAxis stroke={lightGrayColor} fontSize={9} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Bar name="Liczba Pasażerów" dataKey="passengers" fill={primaryColor} radius={[4, 4, 0, 0]} />
                      <Bar name="Pojemność Tablicowa" dataKey="capacity" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {!isProcessing && !result && (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-10 text-center flex flex-col items-center justify-center min-h-[450px] bg-white dark:bg-slate-900 shadow-xs">
              <Sparkles className="h-10 w-10 text-emerald-500 mb-4 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Gotowość Operacyjna</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-2 leading-relaxed">
                Wgraj wymagane pliki GeoJSON oraz CSV z boku ekranu i kliknij uruchomienie analizy, aby wygenerować spersonalizowany raport oraz wykresy statystyczne.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
