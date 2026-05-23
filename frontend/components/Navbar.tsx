import { ActivePage } from '../types';
import { Sun, Moon, Map, Layers, FileText, BarChart3, Radio } from 'lucide-react';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export default function Navbar({ activePage, setActivePage, theme, setTheme }: NavbarProps) {
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const menuItems = [
    { id: 'map' as ActivePage, label: 'Mapa Główna', icon: Map },
    { id: 'layers' as ActivePage, label: 'Analiza Warstw', icon: Layers },
    { id: 'report' as ActivePage, label: 'Raport', icon: FileText },
    { id: 'dashboard' as ActivePage, label: 'Dashboard bento', icon: BarChart3 },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md transition-colors duration-300 dark:border-slate-800/80 dark:bg-slate-900/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-base font-bold tracking-tight text-transparent dark:from-white dark:to-slate-300">
              GeoAnalytica
            </span>
            <span className="hidden sm:inline-block ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Stalowa Wola
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center space-x-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Theme Toggler & User Profile */}
        <div className="flex items-center space-x-3">
          {/* User Email Badge */}
          <span className="hidden lg:inline-block text-[11px] font-mono text-slate-400 dark:text-slate-500">
            agnieszka.wegrzyn67@gmail.com
          </span>

          <button
            id="theme-toggler"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-slate-600" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
