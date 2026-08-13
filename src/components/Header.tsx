import React from 'react';
import { Bot, Play, Pause, Plus, RefreshCw, Moon, Sun, Radio } from 'lucide-react';
import { SystemSettings } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'videos' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'videos' | 'settings') => void;
  settings: SystemSettings | null;
  isConnected: boolean;
  onTogglePause: () => void;
  onOpenAddModal: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  isConnected,
  onTogglePause,
  onOpenAddModal,
  isDarkMode,
  setIsDarkMode,
  onRefresh
}) => {
  const isPaused = settings?.bot_paused ?? false;

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'System Overview';
      case 'videos':
        return 'Video Queue & Tasks';
      case 'settings':
        return 'Bot System Configuration';
      default:
        return 'System Overview';
    }
  };

  const todayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 transition-colors">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          {getTitle()}
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {todayDate}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* SSE Live Status */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-[#00C853] animate-pulse' : 'text-slate-400'}`} />
          <span className="font-medium">{isConnected ? 'Worker Live' : 'Connecting'}</span>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Refresh All Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Worker Pause/Resume Quick Action */}
        <button
          onClick={onTogglePause}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            isPaused
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          <span className="hidden md:inline">{isPaused ? 'Resume Worker' : 'Worker Active'}</span>
        </button>

        {/* Primary CTA: + Add New Video */}
        <button
          onClick={onOpenAddModal}
          className="px-4 sm:px-6 py-2.5 bg-[#667EEA] hover:bg-[#586ed4] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Video</span>
        </button>

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#667EEA] dark:text-[#a78bfa] font-black text-sm shrink-0">
          JD
        </div>
      </div>
    </header>
  );
};
