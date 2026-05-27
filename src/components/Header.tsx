import { Shield, Radio, Server, Database, User, Sun, Moon } from "lucide-react";

interface HeaderProps {
  userEmail: string;
  isRunnerActive: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  dbMode: "PostgreSQL" | "SQLite-JSON";
  onLogout?: () => void;
  isAuthenticated: boolean;
}

export default function Header({ 
  userEmail, 
  isRunnerActive, 
  theme, 
  onToggleTheme, 
  dbMode, 
  onLogout,
  isAuthenticated
}: HeaderProps) {
  return (
    <header className="border-b border-gray-150 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Tag */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm flex items-center justify-center animate-pulse">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-sans font-bold text-lg tracking-tight text-gray-900 dark:text-slate-100">AIHawk</span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900">
                  SaaS PLATFORM
                </span>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono tracking-wider uppercase">Job Application Agent Core</p>
            </div>
          </div>

          {/* System Telemetry & Badges */}
          <div className="hidden md:flex items-center space-x-6 text-xs">
            {/* Platform Health indicators */}
            <div className="flex items-center space-x-3 text-gray-500 dark:text-slate-400 font-mono border-l border-gray-200 dark:border-slate-800 pl-4">
              <div className="flex items-center space-x-1">
                <Database className={`h-3.5 w-3.5 ${dbMode === 'PostgreSQL' ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className={`${dbMode === 'PostgreSQL' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-semibold'} font-mono`}>{dbMode}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Server className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">STANDBY_OK</span>
              </div>
            </div>
          </div>

          {/* User Account / Settings Quick View & Theme Toggle */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-150 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shadow-3xs flex items-center justify-center"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">{userEmail.split('@')[0]}</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">{userEmail}</p>
            </div>
            
            {isAuthenticated && onLogout ? (
              <button
                onClick={onLogout}
                className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/60 transition-all cursor-pointer"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
