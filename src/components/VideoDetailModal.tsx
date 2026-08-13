import React, { useState, useEffect } from 'react';
import { Video, UploadHistory, BotLog } from '../types';
import {
  X,
  Play,
  Pause,
  ExternalLink,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  Terminal,
  Copy,
  Check,
  Globe,
  RotateCw
} from 'lucide-react';

interface VideoDetailModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerUpload: (id: number, simulateFail?: boolean) => void;
  onToggleActive: (id: number) => void;
  onEdit: (video: Video) => void;
  onDelete: (id: number) => void;
}

export const VideoDetailModal: React.FC<VideoDetailModalProps> = ({
  video,
  isOpen,
  onClose,
  onTriggerUpload,
  onToggleActive,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'logs'>('history');
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (video && isOpen) {
      // Fetch history and logs for this video
      fetch(`/api/videos/${video.id}/history`)
        .then((res) => res.json())
        .then((data) => setHistory(data))
        .catch(console.error);

      fetch(`/api/videos/${video.id}/logs`)
        .then((res) => res.json())
        .then((data) => setLogs(data))
        .catch(console.error);
    }
  }, [video, isOpen]);

  if (!isOpen || !video) return null;

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                Video #{video.id}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-md">
                {video.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Source Domain: <span className="font-medium text-slate-700 dark:text-slate-300">{video.source_domain}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Metadata Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold mb-1">Source URL</span>
              <a
                href={video.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline break-all flex items-center space-x-1"
              >
                <span>{video.source_url}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold mb-1">Fikfap Post URL</span>
              {video.fikfap_post_url ? (
                <a
                  href={video.fikfap_post_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline break-all flex items-center space-x-1"
                >
                  <span>{video.fikfap_post_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-slate-400 italic">Not uploaded yet</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-semibold mb-1">Scheduled Time</span>
              <div className="font-medium text-slate-900 dark:text-white">
                {new Date(video.scheduled_time).toLocaleString()} ({video.timezone})
              </div>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold mb-1">Schedule Type & Uploads</span>
              <div className="font-medium text-slate-900 dark:text-white">
                {video.schedule_type === 'recurring' ? 'Daily Repeat' : 'Once'} • {video.upload_count} successful upload(s)
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onTriggerUpload(video.id)}
                disabled={video.status === 'processing'}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trigger Upload Now</span>
              </button>

              <button
                onClick={() => onTriggerUpload(video.id, true)}
                disabled={video.status === 'processing'}
                className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-lg text-xs font-semibold transition"
                title="Test error handling flow"
              >
                Simulate Fail
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleActive(video.id)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                {video.is_active ? 'Pause Task' : 'Activate Task'}
              </button>

              <button
                onClick={() => {
                  onClose();
                  onEdit(video);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Edit
              </button>

              <button
                onClick={() => {
                  onDelete(video.id);
                  onClose();
                }}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-4">
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Upload History ({history.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-2 text-xs font-bold transition border-b-2 flex items-center space-x-1.5 ${
                activeTab === 'logs'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Bot Logs ({logs.length})</span>
            </button>
          </div>

          {/* Tab Panels */}
          {activeTab === 'history' ? (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No upload attempts recorded yet.
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Attempt #{h.id} • {new Date(h.upload_time).toLocaleString()}
                      </span>
                      {h.status === 'success' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded font-bold text-[10px]">
                          SUCCESS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded font-bold text-[10px]">
                          FAILED
                        </span>
                      )}
                    </div>

                    {h.fikfap_post_url && (
                      <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        Post URL: <a href={h.fikfap_post_url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline">{h.fikfap_post_url}</a>
                      </p>
                    )}

                    {h.error_message && (
                      <p className="text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                        Error: {h.error_message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1.5 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-slate-400 text-[10px]">Log Buffer for Video #{video.id}</span>
                <button
                  onClick={handleCopyLogs}
                  className="text-[10px] text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>

              {logs.length === 0 ? (
                <p className="text-slate-500 italic text-center py-4">No logs recorded for this video.</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="text-slate-300 break-all leading-relaxed">
                    <span className="text-slate-500">[{new Date(l.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className="text-indigo-400">[{l.level.toUpperCase()}]</span> {l.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
