import { ActivePage } from '../types';
import { Sun, Moon, Map, Layers, FileText, BarChart3, Radio, ChevronRight } from 'lucide-react';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function Navbar({ activePage, setActivePage, theme, setTheme }: NavbarProps) {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const menuItems = [
    { id: 'map' as ActivePage, label: 'Mapa Główna', icon: Map },
    { id: 'whitespots' as ActivePage, label: 'Białe Plamy', icon: Layers },
    { id: 'creator' as ActivePage, label: 'Kreator Analiz', icon: FileText },
  ];

  const currentIndex = menuItems.findIndex((m) => m.id === activePage);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
            <Radio className="h-5.5 w-5.5 text-white" />
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 opacity-30 blur-md -z-10" />
          </div>
          <div className="flex items-center">
            <span className="text-gradient-primary text-lg font-extrabold tracking-tight hidden sm:inline-block">
              GeoAnalytica
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
              Stalowa Wola
            </span>
          </div>
        </div>

        {/* Navigation Tabs with active indicator pill */}
        <div id="navbar-tabs-container" className="flex items-center bg-slate-100/80 dark:bg-slate-900/80 rounded-xl p-1 border border-slate-200/50 dark:border-white/5">
          {menuItems.map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActivePage(item.id)}
                className={`relative flex items-center space-x-1.5 rounded-lg px-2 sm:px-4 py-2.5 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <IconComponent className={`h-4 w-4 ${isActive ? 'text-emerald-500' : ''}`} />
                <span className="hidden md:inline">{item.label}</span>
                {idx < currentIndex && idx === currentIndex - 1 && (
                  <ChevronRight className="h-3 w-3 opacity-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Theme Toggler */}
        <div className="flex items-center space-x-3">
          <button
            id="theme-toggler"
            onClick={toggleTheme}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:scale-105 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Przełącz motyw jasny/ciemny"
          >
            <div className="relative h-5 w-5">
              <Sun
                className={`absolute inset-0 h-5 w-5 text-amber-400 transition-all duration-300 ${
                  theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                }`}
              />
              <Moon
                className={`absolute inset-0 h-5 w-5 text-slate-600 transition-all duration-300 ${
                  theme === 'light' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}