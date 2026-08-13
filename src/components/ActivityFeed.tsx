import React, { useState, useEffect, useRef } from 'react';
import { BotLog, LogLevel } from '../types';
import { Terminal, Copy, Check, Trash2, Search, AlertTriangle, Info, CheckCircle2, ArrowDown, Radio } from 'lucide-react';

interface ActivityFeedProps {
  logs: BotLog[];
  onClearLogs: () => void;
  onSelectVideo?: (videoId: number) => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onClearLogs, onSelectVideo }) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const terminalContainerRef = useRef<HTMLDivElement>(null);

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

  // Keep auto-scrolling to bottom when new logs stream in
  useEffect(() => {
    if (autoScroll && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

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
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>SUCCESS</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>ERROR</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>WARN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Info className="w-2.5 h-2.5" />
            <span>INFO</span>
          </span>
        );
    }
  };

  const renderLogMessage = (msg: string) => {
    // Step markers [STEP X/10: ...]
    if (msg.includes('[STEP')) {
      const parts = msg.split(/(\[STEP\s+\d+\/10:[^\]]+\])/g);
      return (
        <span className="text-white font-medium">
          {parts.map((p, i) =>
            p.startsWith('[STEP') ? (
              <span key={i} className="text-amber-400 font-bold bg-amber-400/10 px-1 py-0.5 rounded border border-amber-400/20 mr-1.5">
                {p}
              </span>
            ) : (
              <span key={i}>{p}</span>
            )
          )}
        </span>
      );
    }

    if (msg.startsWith('═══')) {
      return <span className="text-slate-500 select-none block py-0.5">{msg}</span>;
    }

    if (msg.includes('🚀 INITIATING') || msg.includes('🎉 SUCCESS') || msg.includes('🔗 Fikfap Post URL')) {
      return <span className="text-emerald-300 font-bold">{msg}</span>;
    }

    if (msg.startsWith('  └─')) {
      return <span className="text-slate-300 pl-2 font-mono text-[10.5px]">{msg}</span>;
    }

    return <span className="text-slate-100">{msg}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-md overflow-hidden h-[540px]">
      {/* Terminal Header */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-[#667EEA] dark:text-indigo-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-800 dark:text-slate-100 tracking-wide text-xs uppercase">
                Real-Time Automation Console
              </h2>
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                <span>LIVE STREAM</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Live stdout & network protocol stream for all 10 automation steps
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search steps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#667EEA] w-32 sm:w-40"
            />
          </div>

          {/* Filter Level */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#667EEA]"
          >
            <option value="all">All Logs ({logs.length})</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warnings</option>
            <option value="error">Errors</option>
          </select>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center space-x-1 ${
              autoScroll
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
          >
            <ArrowDown className={`w-3 h-3 ${autoScroll ? 'animate-bounce' : ''}`} />
            <span>Auto-Scroll</span>
          </button>

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

      {/* Terminal Output Screen */}
      <div
        ref={terminalContainerRef}
        className="flex-grow bg-[#0c0e12] p-4 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 border-b border-slate-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-12">
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 mb-3">
              <Terminal className="w-8 h-8 opacity-60 text-[#667EEA]" />
            </div>
            <p className="font-semibold text-slate-300">Terminal Buffer Ready</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Trigger a video upload or schedule a run to observe the 10 real execution steps streaming live.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-2 py-0.5 px-2 rounded hover:bg-slate-800/40 transition duration-150 border-l-2 border-transparent hover:border-[#667EEA]"
            >
              <span className="text-[#667EEA] shrink-0 text-[10.5px]">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>

              <div className="shrink-0">{getLevelBadge(log.level)}</div>

              {log.video_id && (
                <button
                  onClick={() => onSelectVideo && onSelectVideo(log.video_id!)}
                  className="shrink-0 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#764BA2]/30 text-purple-300 border border-[#764BA2]/50 hover:underline"
                >
                  #Video-{log.video_id}
                </button>
              )}

              <div className="break-all leading-relaxed flex-grow">
                {renderLogMessage(log.message)}
              </div>
            </div>
          ))
        )}
        <div ref={terminalBottomRef} />
      </div>

      {/* Terminal Footer Worker Diagnostic Status */}
      <div className="px-4 py-2.5 bg-[#090a0d] border-t border-slate-800/80 flex flex-wrap justify-between items-center text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00C853] shadow-[0_0_8px_rgba(0,200,83,0.8)] animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
              WORKER PIPELINE ACTIVE
            </span>
          </div>
          <span className="text-slate-600">•</span>
          <span className="text-[10.5px] font-mono text-slate-400">
            Target: fikfap.com/upload/url
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10.5px] font-mono text-slate-500">
          <span>Buffer: {filteredLogs.length} events</span>
        </div>
      </div>
    </div>
  );
};
