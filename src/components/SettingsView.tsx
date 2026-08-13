import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { Save, Trash2, Download, Upload, Shield, Bot, Moon, Sun, CheckCircle } from 'lucide-react';

interface SettingsViewProps {
  settings: SystemSettings | null;
  onSaveSettings: (updates: Partial<SystemSettings>) => void;
  onClearLogs: () => void;
  onOpenBulkImport: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onClearLogs,
  onOpenBulkImport,
  isDarkMode,
  setIsDarkMode
}) => {
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [defaultTitle, setDefaultTitle] = useState('Link in Bio💖');
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [cfMaxRetries, setCfMaxRetries] = useState(5);
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  const [email, setEmail] = useState('peprahe8933@gmail.com');
  const [password, setPassword] = useState('emma7233');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (settings) {
      setMaxConcurrent(settings.max_concurrent_uploads || 1);
      setDefaultTitle(settings.default_title || 'Link in Bio💖');
      setRetryAttempts(settings.retry_attempts || 3);
      setCfMaxRetries(settings.cloudflare_max_retries || 5);
      setTimeoutSeconds(settings.upload_timeout_seconds || 120);
      setEmail(settings.target_email || 'peprahe8933@gmail.com');
      setPassword(settings.target_password || 'emma7233');
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      max_concurrent_uploads: maxConcurrent,
      default_title: defaultTitle,
      retry_attempts: retryAttempts,
      cloudflare_max_retries: cfMaxRetries,
      upload_timeout_seconds: timeoutSeconds,
      target_email: email,
      target_password: password
    });

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>⚙️ Bot & System Configurations</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure automation timeouts, retries, credentials, and default upload parameters
            </p>
          </div>

          {savedNotice && (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg text-xs font-bold animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Settings Saved!</span>
            </span>
          )}
        </div>

        <div className="p-6 space-y-6 text-sm">
          {/* Target Credentials */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>Target Portal Authentication Credentials (fikfap.com)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Account Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Bot Execution Limits */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bot Execution Limits & Defaults
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max Concurrent Uploads
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Default Video Title
                </label>
                <input
                  type="text"
                  value={defaultTitle}
                  onChange={(e) => setDefaultTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  General Retry Attempts
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={retryAttempts}
                  onChange={(e) => setRetryAttempts(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cloudflare Challenge Max Retries
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cfMaxRetries}
                  onChange={(e) => setCfMaxRetries(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Upload Timeout (Seconds)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* System Utilities & Data Tools */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          🛠️ System Utilities & Data Operations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Bulk Import */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              📥 Bulk Import Videos
            </span>
            <p className="text-xs text-slate-500">Import multiple video links via CSV or JSON input.</p>
            <button
              onClick={onOpenBulkImport}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Open Bulk Import</span>
            </button>
          </div>

          {/* Export Data */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              📤 Export Video Data
            </span>
            <p className="text-xs text-slate-500">Download queue data in CSV or JSON formats.</p>
            <div className="flex space-x-2">
              <a
                href="/api/export?format=csv"
                className="flex-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-center transition flex items-center justify-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </a>
              <a
                href="/api/export?format=json"
                className="flex-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold text-center transition flex items-center justify-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </a>
            </div>
          </div>

          {/* Clear System Logs */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              🧹 Clear Console Logs
            </span>
            <p className="text-xs text-slate-500">Purge buffered execution log records.</p>
            <button
              onClick={onClearLogs}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Console Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
