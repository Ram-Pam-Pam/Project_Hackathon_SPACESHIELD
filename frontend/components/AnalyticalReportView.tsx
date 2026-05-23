import React, { useState } from 'react';
import { Search, ShieldAlert, Lightbulb, ArrowRight, Sparkles, Send, BrainCircuit, RefreshCw } from 'lucide-react';

interface AnalyticalReportViewProps {
  onGoToDashboard: () => void;
}

export default function AnalyticalReportView({ onGoToDashboard }: AnalyticalReportViewProps) {
  const [selectedPreset, setSelectedPreset] = useState<'default' | 'hsw' | 'rozwadow'>('default');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customResponse, setCustomResponse] = useState<string | null>(null);

  // High-fidelity datasets for analytical variations
  const contentMap = {
    default: {
      causes: {
        title: 'Przyczyny Strukturalne (Sektor Centrum)',
        metric: 'KEN & Okulickiego Corridor',
        content: 'Skumulowanie placówek oświatowych (dwie duże szkoły średnie, kampus politechniczny) oraz obiektów handlowo-usługowych przy ul. Okulickiego wywołuje nieliniowy rozkład potoków pasażerskich. Wąskie gardło na rondzie utrudnia swobodny przejazd pojazdów przegubowych.',
        factors: ['Skumulowanie szkół i biur', 'Asymetryczny rozkład zatok', 'Wysokie natężenie pieszych przy pasażu']
      },
      problem: {
        title: 'Zidentyfikowane Problemy operacyjne',
        metric: 'Opóźnienia & Przebicie Kapasytancji',
        content: 'Średnia prędkość handlowa autobusów MZK spada w szczycie po południu do jednych z najniższych w regionie (19 km/h). Przystanki centralne wykazują przeciążenie o 34% powyżej nominalnej przepustowości pasażerskiej na dobę.',
        factors: ['Wydłużony czas wymiany pasażerskiej', 'Opóźnienia do 11 minut', 'Naruszenie cykli ułożenia taboru']
      },
      solution: {
        title: 'Rekomendacja Optymalizacyjna (Model AI)',
        metric: 'Przekierowanie & Priorytetyzacja Sygnalizacji',
        content: 'Algorytm geolokalizacyjny sugeruje wdrożenie priorytetu przejazdu dla transportu zbiorowego na skrzyżowaniu Al. KEN i ul. Niezłomnych (SIRT) oraz przesunięcie zatoki "Okulickiego - Rondo" o 50 m w kierunku wschodnim, co skróci średni czas podróży o 22%.',
        impact: 'Szacowana oszczędność paliwa rzędu 8-12%, redukcja opóźnień o 22%',
        actions: ['System Inteligentnego Sterowania Ruchem (SIRT)', 'Budowa nowej zatoki omijającej rondo', 'Dynamiczny e-rozkład jazdy']
      }
    },
    hsw: {
      causes: {
        title: 'Potoki Pracownicze (Strefa HSW)',
        metric: 'ul. Przemysłowa & Strefa Południowa',
        content: 'Skokowe natężenie ruchu zdeterminowane jest sztywnymi godzinami zmian roboczych w Hucie Stalowa Wola oraz pobliskich koncernach (godziny 6:00, 14:00, 22:00). Powoduje to nagłe obciążenie taboru, podczas gdy w pozostałych godzinach linie te są niedociążone.',
        factors: ['Trójzmianowy tryb pracy zakładów', 'Słabe skomunikowanie z sypialniami', 'Brak alternatywnych tras rowerowych']
      },
      problem: {
        title: 'Pulsacyjne Przeciążenia Szczytowe',
        metric: 'Gwałtowne spiętrzenie pasażerów',
        content: 'Przepełnienie wozów w oknach 13:45-14:15 przekracza dopuszczalne normy o 45%. Generuje to dyskomfort podróżnych oraz szybsze zużycie mechaniczne taboru miejskiego, przy braku ekonomicznego uzasadnienia wprowadzania stałych dodatkowych autobusów.',
        factors: ['Wskaźnik przepełnienia wozów: 1.45', 'Krytyczne opóźnienia dojazdu robotników', 'Brak elastyczności floty']
      },
      solution: {
        title: 'Rekomendacja Optymalizacyjna (Model AI)',
        metric: 'Dynamiczny Transport na Żądanie (DRT)',
        content: 'Model AI rekomenduje wdrożenie hybrydowego systemu DRT (Demand Responsive Transit) w godzinach przejściowych realizowanego mikrobusami autonomicznymi, skorelowanymi z systemami ERP kluczowych przedsiębiorstw w strefie ekonomicznej.',
        impact: 'Zmniejszenie kosztów wozokilometrów o 28% poza szczytem, wysoka punktualność',
        actions: ['Wdrożenie aplikacji dla załóg fabrycznych', 'Krótkoterminowy wynajem taboru szczytowego', 'Synchronizacja rozkładu z sygnaturami wejść/wyjść']
      }
    },
    rozwadow: {
      causes: {
        title: 'Analiza Dostępności (Sektor Rozwadów)',
        metric: 'Dzielnice północne i peryferia',
        content: 'Tradycyjna, historyczna zabudowa urbanistyczna z wąskimi gardłami ulicznymi uniemożliwia manewrowanie standardowym taborem autobusowym. Dzielnica ta wykazuje relatywnie niskie zagęszczenie zaludnienia, lecz wysoki wskaźnik wykluczenia komunikacyjnego ludzi starszych.',
        factors: ['Wąskie profile zabytkowych ulic', 'Analiza kohorty wiekowej (starsza generacja)', 'Trudny profil techniczny dojazdów']
      },
      problem: {
        title: 'Wykluczenie Przestrzenne',
        metric: 'Dojazd do przychodni i aptek',
        content: 'Czas pieszego dojścia do najbliższego przystanku o częstotliwości kursowania powyżej 30 min wynosi aż 14-18 minut dla 35% populacji tej dzielnicy. Brak bezpośredniego, szybkiego połączenia z Głównym Szpitalem Powiatowym.',
        factors: ['Zbyt rzadkie takty kursowania', 'Konieczność przesiadek w Śródmieściu', 'Zły stan techniczny chodników dojściowych']
      },
      solution: {
        title: 'Rekomendacja Optymalizacyjna (Model AI)',
        metric: 'Linie Wahadłowe "Midi-Bus"',
        content: 'AI sugeruje rozbicie dotychczasowych długich tras i zastąpienie ich zwinnymi mikroliniami (Midibusy 8-metrowe o napędzie wodorowym / elektrycznym), które swobodnie manewrują po Rozwadowie i dowożą mieszkańców bezpośrednio do węzła przesiadkowego na Staszica.',
        impact: 'Skrócenie średniego czasu dojścia pieszego o 62%, zeroemisyjność',
        actions: ['Zakup 4 zwinnych midibusów ekologicznych', 'Utworzenie pierścienia przesiadkowego', 'Dynamiczne żądania zatrzymań "na żądanie"']
      }
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      setCustomResponse(
        `[Generowanie Dynamicznej Analizy Przestrzennej AI dla Stalowej Woli]\n` +
        `Na podstawie wprowadzonego zapytania ("${userPrompt}") model geolokalizacyjny przeanalizował macierze podróży dla sektora Śródmieście/Klasztor.\n\n` +
        `• ANALIZA: Wskazany obszar odznacza się asymetrią potoków. Wprowadzenie dedykowanego pasa "Bus-only" wzdłuż Alei Jana Pawła II wydaje się pożądane, jednak ograniczy przepustowość aut osobowych o 18%.\n` +
        `• SYNERGIA: Rekomenduje się skoordynowanie cykli sygnalizacji "Zielona Fala BST" między rondem przy Okulickiego a zjazdem na ul. Popiełuszki.\n` +
        `• EFEKT KOŃCOWY: Redukcja spóźnień w przedziale godzinowym 7:30 - 8:15 o szacowane 4.5 minuty.`
      );
      setIsGenerating(false);
    }, 1500);
  };

  const currentContent = contentMap[selectedPreset];

  const presetButtons = [
    { id: 'default' as const, label: 'Korytarz Śródmieście' },
    { id: 'hsw' as const, label: 'Strefa HSW (Huta)' },
    { id: 'rozwadow' as const, label: 'Dzielnica Rozwadów' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10" id="view-3-analytical-report">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
            System Analizy Przestrzennej
          </span>
          <h1 id="report-main-title" className="mt-2 text-4xl font-extrabold tracking-tight">
            <span className="text-gradient-primary">Szczegółowa Analiza</span>
            <br />
            <span className="text-slate-900 dark:text-white">Geolokalizacyjna</span>
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
            Przeglądaj zintegrowane raporty przestrzenne wygenerowane przez silnik AI we współpracy z bazami danych BDOT10k i statystykami MZK Stalowa Wola.
          </p>
        </div>

        {/* Dynamic Preset Toggler */}
        <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-900 self-start md:self-auto shrink-0 border border-slate-200/50 dark:border-white/10">
          {presetButtons.map((preset) => (
            <button
              key={preset.id}
              id={`preset-${preset.id}`}
              onClick={() => { setSelectedPreset(preset.id); setCustomResponse(null); }}
              className={`rounded-lg px-3.5 py-2 text-[11px] font-bold transition-all duration-200 ${
                selectedPreset === preset.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Card Grid: Przyczyny, Problem, Rozwiązanie AI */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Przyczyny */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 card-hover opacity-0 animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">
              {currentContent.causes.metric}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
              <Search className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {currentContent.causes.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {currentContent.causes.content}
          </p>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Kluczowe wektory przyczyn:
            </span>
            <ul className="space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              {currentContent.causes.factors.map((factor, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-1.5 text-emerald-500">▪</span> {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 2: Problem */}
        <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20 card-hover opacity-0 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest dark:text-slate-500">
              {currentContent.problem.metric}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 group-hover:bg-rose-500/10 group-hover:text-rose-500 transition-colors">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {currentContent.problem.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {currentContent.problem.content}
          </p>

          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800/80">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Wykryte skutki sieciowe:
            </span>
            <ul className="space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              {currentContent.problem.factors.map((factor, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-1.5 text-rose-500">▪</span> {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Card 3: AI Solution (visually distinguished with emerald glow) */}
        <div className="relative group rounded-2xl border-2 border-emerald-500/50 bg-white p-6 transition-all duration-300 dark:border-emerald-500/40 dark:bg-slate-900 card-hover opacity-0 animate-fade-in-up stagger-3">
          {/* Subtle neon glow back effect */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/10 opacity-0 blur-lg transition duration-500 group-hover:opacity-100 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[9px] font-bold uppercase text-emerald-500 dark:text-emerald-400">
                <Sparkles className="h-3 w-3 animate-pulse mr-0.5" /> Model AI v4.0
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <Lightbulb className="h-5 w-5" />
              </div>
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              {currentContent.solution.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 font-medium dark:text-slate-300">
              {currentContent.solution.content}
            </p>

            <div className="mt-5 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-500/15">
              <span className="block text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Szacowany wpływ wdrożenia:
              </span>
              <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">
                {currentContent.solution.impact}
              </span>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/80">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Zalecany plan wdrożenia:
              </span>
              <ul className="space-y-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {currentContent.solution.actions.map((action, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-1.5 text-emerald-500">✓</span> {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Playground simulator */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900 transition-all duration-300 opacity-0 animate-fade-in-up stagger-4">
        <div className="flex items-center space-x-2.5 mb-3">
          <BrainCircuit className="h-5 w-5 text-emerald-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Generuj dedykowaną rekomendację (Symulacja AI)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-3xl font-medium">
          Wpisz zapytanie przestrzenne (np. "optymalizacja linii nr 1" lub "buspasy Al. Jana Pawła II"), a nasz algorytm przetworzy macierze w czasie rzeczywistym.
        </p>

        <form onSubmit={handlePromptSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Wprowadź zapytanie przestrzenne..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
            />
            {userPrompt && (
              <button
                type="button"
                onClick={() => setUserPrompt('')}
                className="absolute right-3.5 top-3.5 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                wyczyść
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all flex items-center justify-center space-x-1.5 shrink-0 active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Przeliczanie...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-600" />
                <span>Analizuj</span>
              </>
            )}
          </button>
        </form>

        {customResponse && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 font-mono text-[11.5px] leading-relaxed text-slate-700 dark:bg-emerald-950/20 dark:text-slate-300 overflow-x-auto animate-fade-in">
            <div className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-sans font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
              <span>Wynik Przetworzenia Geolokalizatora:</span>
            </div>
            {customResponse.split('\n').map((line, idx) => (
              <p key={idx} className="mt-0.5">{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* Clear Call to Action (CTA) Button */}
      <div className="flex flex-col items-center justify-center border-t border-slate-200 pt-10 dark:border-slate-800 opacity-0 animate-fade-in-up stagger-5">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
          Następny krok badawczy
        </span>
        <button
          id="btn-see-dashboard"
          onClick={onGoToDashboard}
          className="group relative flex items-center space-x-3 rounded-2xl bg-slate-950 px-10 py-4 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:bg-slate-900 hover:shadow-2xl active:scale-[0.97] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
        >
          <span>Zobacz dashboard analityczny</span>
          <ArrowRight className="h-5 w-5 text-emerald-500 dark:text-emerald-600 animate-arrow-bounce" />
          {/* Glow ring on hover */}
          <div className="absolute -inset-1 rounded-2xl bg-emerald-500/10 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}
