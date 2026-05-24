import { useState, useEffect } from 'react';
import { ActivePage } from '../types';
import { X, ChevronRight, ChevronLeft, Flag } from 'lucide-react';

interface OnboardingTourProps {
  navigateTo: (page: ActivePage) => void;
}

export default function OnboardingTour({ navigateTo }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  // Zabezpieczenie przed pokazaniem, jeśli już zakończono (opcjonalne, w local storage)
  useEffect(() => {
    const finished = localStorage.getItem('spacewarden-tour-finished');
    if (finished === 'true') {
      setIsOpen(false);
    }
  }, []);

  const steps = [
    {
      title: 'Witaj w SpacePath Warden! 🚀',
      content: 'Zoptymalizuj transport w mieście Stalowa Wola za pomocą sztucznej inteligencji. Przejdźmy przez krótki 10-krokowy poradnik.',
      action: () => navigateTo('map')
    },
    {
      title: 'Krok 1: Przegląd Głównej Mapy',
      content: 'Tutaj widzisz główny zarys infrastruktury transportowej. Domyślnie prezentujemy wybrane wskaźniki i gęstość.',
      action: () => navigateTo('map')
    },
    {
      title: 'Krok 2: Interaktywne Warstwy',
      content: 'Użyj panelu po prawej stronie na górze, aby filtrować warstwy: siatkę H3 populacji, natężenie ruchu czy styl mapy.',
      action: () => navigateTo('map')
    },
    {
      title: 'Krok 3: Analiza Białych Plam',
      content: 'Przejdźmy do najważniejszego modułu: "Białe Plamy". (Aplikacja przełączy widok automatycznie)',
      action: () => navigateTo('whitespots')
    },
    {
      title: 'Krok 4: Wykrywanie Wykluczeń',
      content: 'W tym widoku widzisz obszary o utrudnionym dostępie. Zauważ, że domyślnie podświetlone są strefy dojścia pieszego/autobusowego.',
      action: () => navigateTo('whitespots')
    },
    {
      title: 'Krok 5: Satelita AI',
      content: 'Kliknij na dowolny punkt na mapie lub w bocznym panelu, aby przeanalizować anomalię za pomocą Gemini AI (Satelity).',
      action: () => navigateTo('whitespots')
    },
    {
      title: 'Krok 6: Typy Analiz AI',
      content: 'Teraz, po kliknięciu punktu na mapie, pojawia się Modal. Możesz wybrać Analizę Pełną lub Ukierunkowaną (skupioną na problemie).',
      action: () => navigateTo('whitespots')
    },
    {
      title: 'Krok 7: Dynamiczny Raport',
      content: 'Gdy AI zwróci dane, pojawią się one w zgrabnym Dashboardzie pod spodem, wraz z rekomendacjami optymalizacyjnymi.',
      action: () => navigateTo('whitespots')
    },
    {
      title: 'Krok 8: Własne Pliki (Custom)',
      content: 'Przełączmy się na tryb "Własna Analiza".',
      action: () => navigateTo('creator')
    },
    {
      title: 'Krok 9: Wgraj Własny GeoPackage',
      content: 'Jeżeli masz pliki .gpkg, .shp z innego miasta, możesz je przeciągnąć w to pole, aby wykonać identyczną analizę z Gemini.',
      action: () => navigateTo('creator')
    },
    {
      title: 'Krok 10: Gotowe! 🎉',
      content: 'To tyle! Zamknij ten samouczek i rozpocznij audyt infrastruktury miejskiej ze SpacePath Warden.',
      action: () => navigateTo('map')
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      steps[nextStep].action();
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      const prevStep = step - 1;
      setStep(prevStep);
      steps[prevStep].action();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('spacewarden-tour-finished', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Flag className="h-4 w-4 text-emerald-500" />
          Onboarding ({step + 1}/{steps.length})
        </h3>
        <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4">
        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{steps[step].title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 min-h-[48px]">
          {steps[step].content}
        </p>
        
        <div className="flex justify-between items-center mt-2">
          <button 
            onClick={handlePrev}
            disabled={step === 0}
            className={`text-xs font-semibold flex items-center px-2 py-1 rounded transition-colors ${step === 0 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Wstecz
          </button>
          
          <button 
            onClick={handleNext}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center transition-colors shadow-sm"
          >
            {step === steps.length - 1 ? 'Zakończ' : 'Dalej'} <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
