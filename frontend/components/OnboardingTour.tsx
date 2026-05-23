import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { ActivePage } from '../types';

interface Step {
  target: string | null; // CSS selector, null for center modal
  title: string;
  content: string;
  action?: () => void; // Optional action before step renders (e.g. switch tab)
}

interface OnboardingTourProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export default function OnboardingTour({ activePage, setActivePage }: OnboardingTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: Step[] = [
    {
      target: null,
      title: "Witaj w GeoAnalytica! 👋",
      content: "Witaj w zaawansowanej platformie do analizy przestrzennej i optymalizacji transportu zbiorowego w Stalowej Woli. Zapraszamy na krótki, 10-krokowy przewodnik po kluczowych funkcjach.",
      action: () => {
        setActivePage('map');
      }
    },
    {
      target: '#navbar-tabs-container',
      title: "Główne Zakładki Nawigacji 🗺️",
      content: "Główny pasek nawigacyjny pozwala na szybkie przełączanie się między widokami: Mapą Główną, Analizą Warstw, Raportem Geolokalizacyjnym oraz Pulpitem Dashboardu.",
      action: () => {
        setActivePage('map');
      }
    },
    {
      target: '#map-stop-marker-stop-1',
      title: "Interaktywne Przystanki 🚏",
      content: "Punkty pomiarowe na mapie reprezentują fizyczne przystanki autobusowe. Ich kolory odzwierciedlają poziom natężenia ruchu. Kliknij w dowolny z nich, aby otworzyć profil szczegółowy.",
      action: () => {
        setActivePage('map');
      }
    },
    {
      target: '#instructions-card',
      title: "Instrukcja Nawigacji 📖",
      content: "Ten panel boczny zawiera krótkie instrukcje i legendę pomagającą w pełnej analizie sieci transportowej w Stalowej Woli.",
      action: () => {
        setActivePage('map');
      }
    },
    {
      target: '#overloaded-stops-card',
      title: "Przeciążone Przystanki ⚠️",
      content: "System automatycznie wykrywa i listuje strefy o krytycznym natężeniu przepływu ludności, co pozwala na natychmiastową reakcję planistów.",
      action: () => {
        setActivePage('map');
      }
    },
    {
      target: '#nav-layers',
      title: "Przejdźmy do Analizy Warstw 🛠️",
      content: "Zakładka ta pozwala nakładać dodatkowe filtry oraz zaawansowane warstwy przestrzenne bezpośrednio na mapę.",
      action: () => {
        setActivePage('map');
      }
    },
    {
      target: '#operational-filters-tabs',
      title: "Filtry Analizy Operacyjnej ⚙️",
      content: "Te filtry pozwalają analizować m.in. opóźnienia i przepustowość, wyznaczać strefy buforowe wokół punktów czy badać uciążliwości hałasowe.",
      action: () => {
        setActivePage('layers');
      }
    },
    {
      target: '#btn-layer-populacja_h3',
      title: "Warstwy i Populacja H3 📊",
      content: "Wybierz 'Populacja H3', aby zobaczyć płaską, półprzezroczystą siatkę demograficzną z wyraźnymi konturami. Reprezentuje ona gęstość zaludnienia Stalowej Woli.",
      action: () => {
        setActivePage('layers');
      }
    },
    {
      target: '#report-main-title',
      title: "Raport Geolokalizacyjny AI 🧠",
      content: "W sekcji Raportu model AI automatycznie generuje analizę przyczyn problemów, skutków sieciowych oraz przygotowuje rekomendacje wdrożeniowe.",
      action: () => {
        setActivePage('report');
      }
    },
    {
      target: '#dashboard-kpis-container',
      title: "Pulpit Decyzyjny 360° (Dashboard) 📈",
      content: "Zakładka Dashboardu prezentuje główne wskaźniki KPI sieci oraz wykresy godzinowych potoków podróżnych, co pozwala trzymać rękę na pulsie.",
      action: () => {
        setActivePage('dashboard');
      }
    }
  ];

  // 1. Initialize and check if user has seen onboarding
  useEffect(() => {
    const isCompleted = localStorage.getItem('geoanalytica_onboarding_completed');
    if (!isCompleted) {
      // Delay slightly to allow the app to fully load
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Track window resize to ensure responsiveness
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3. Perform actions on step change
  useEffect(() => {
    if (!run) return;
    const currentStep = steps[stepIndex];
    if (currentStep && currentStep.action) {
      currentStep.action();
    }
  }, [stepIndex, run]);

  // 4. Periodically check DOM to compute target element position
  useEffect(() => {
    if (!run) {
      setRect(null);
      return;
    }

    const currentStep = steps[stepIndex];
    if (!currentStep || !currentStep.target) {
      setRect(null);
      return;
    }

    let attempts = 0;
    const checkElement = () => {
      const element = document.querySelector(currentStep.target!);
      if (element) {
        setRect(element.getBoundingClientRect());
      } else {
        attempts++;
        if (attempts < 10) {
          // Retry since React page might still be rendering/switching tabs
          setTimeout(checkElement, 150);
        } else {
          setRect(null); // Fallback to modal in center
        }
      }
    };

    checkElement();

    // Set up scroll/resize listener to update positions dynamically
    const updatePosition = () => {
      const element = document.querySelector(currentStep.target!);
      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [stepIndex, run, activePage]);

  if (!run) return (
    // Tiny floating help button to trigger tour manually anytime
    <button
      onClick={() => {
        setStepIndex(0);
        setRun(true);
      }}
      className="fixed bottom-4 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all border border-slate-700/50 hover:scale-105 active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
      title="Uruchom przewodnik po aplikacji"
    >
      <HelpCircle className="h-5 w-5 text-emerald-400" />
    </button>
  );

  const currentStep = steps[stepIndex];
  const isMobile = windowWidth < 768;
  const showSpotlight = rect && !isMobile;

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('geoanalytica_onboarding_completed', 'true');
    setRun(false);
  };

  // Compute dynamic tooltip placement
  const getTooltipStyle = (): React.CSSProperties => {
    if (!showSpotlight || !rect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 420px)',
      };
    }

    const padding = 12;
    const tooltipWidth = 360;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let top = rect.bottom + padding;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // Check if bottom overflow
    if (top + 200 > viewportHeight) {
      top = rect.top - padding - 220; // place above
    }

    // Keep within horizontal bounds
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));

    return {
      position: 'fixed',
      top: `${Math.max(16, top)}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
    };
  };

  return (
    <>
      {/* 1. Backdrop overlay with spotlight cutout */}
      {showSpotlight && rect ? (
        <svg className="fixed inset-0 pointer-events-none z-[9998] w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - 8}
                y={rect.top - 8}
                width={rect.width + 16}
                height={rect.height + 16}
                rx={12}
                ry={12}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(15, 23, 42, 0.75)"
            mask="url(#spotlight-mask)"
            className="pointer-events-auto cursor-default"
          />
        </svg>
      ) : (
        <div className="fixed inset-0 bg-slate-950/70 z-[9998] backdrop-blur-sm cursor-default" />
      )}

      {/* 2. Tour Tooltip Card */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="z-[9999] rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-slate-800/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 transition-all duration-300 animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
          <h4 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
            {currentStep.title}
          </h4>
          <button
            onClick={handleSkip}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
            title="Pomiń przewodnik"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300 mb-5 font-medium">
          {currentStep.content}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === stepIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 ml-1.5">
              {stepIndex + 1} z {steps.length}
            </span>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center space-x-2">
            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center space-x-1 rounded-xl px-3 py-1.5 text-[11px] font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all dark:border-slate-750 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Wstecz</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-1.5 text-[11px] font-extrabold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-cyan-600 transition-all"
            >
              <span>{stepIndex === steps.length - 1 ? 'Gotowe' : 'Dalej'}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
