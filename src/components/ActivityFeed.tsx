import React, { useState } from 'react';
import { BotLog, LogLevel } from '../types';
import { Terminal, Copy, Check, Trash2, Filter, Search, ShieldCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ActivityFeedProps {
  logs: BotLog[];
  onClearLogs: () => void;
  onSelectVideo?: (videoId: number) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onClearLogs, onSelectVideo }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchId = log.video_id ? `#${log.video_id}`.includes(q) : false;
      return matchMsg || matchId;
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.video_id ? `#${l.video_id}: ` : ''}${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>SUCCESS</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>ERROR</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>WARN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Info className="w-3 h-3" />
            <span>INFO</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm overflow-hidden h-[480px]">
      {/* Terminal Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#667EEA]" />
          <h2 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">
            Live Bot Logs
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#667EEA] w-32 sm:w-44"
            />
          </div>

          {/* Filter Level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#667EEA]"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium transition flex items-center space-x-1"
            title="Copy Filtered Console Logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Logs */}
          <button
            onClick={onClearLogs}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 rounded-lg text-xs transition"
            title="Clear Console Buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body / Log Output in exact dark console #151619 */}
      <div className="flex-grow bg-[#151619] p-4 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
            <Terminal className="w-8 h-8 mb-2 opacity-50 text-slate-500" />
            <p>No activity logs match your filter criteria.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-2 py-0.5 px-1.5 rounded hover:bg-white/5 transition duration-150"
            >
              <span className="text-[#667EEA] shrink-0 text-[11px]">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>

              <div className="shrink-0">{getLevelBadge(log.level)}</div>

              {log.video_id && (
                <button
                  onClick={() => onSelectVideo && onSelectVideo(log.video_id!)}
                  className="shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#764BA2]/30 text-purple-300 border border-[#764BA2]/50 hover:underline"
                >
                  #Video-{log.video_id}
                </button>
              )}

              <span className="text-white break-all leading-relaxed">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer Worker Status */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
          Worker #01 Engine • fikfap.com
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            ONLINE
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#00C853] shadow-[0_0_8px_rgba(0,200,83,0.6)]"></span>
        </div>
      </div>
    </div>
  );
};
