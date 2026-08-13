import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: any[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('json');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const sampleJson = `[
  {
    "source_url": "https://www.xxxfollow.com/video/v9001",
    "title": "Batch Video #1 🎥",
    "schedule_type": "recurring"
  },
  {
    "source_url": "https://www.xxxfollow.com/video/v9002",
    "title": "Batch Video #2 💖",
    "schedule_type": "once"
  }
]`;

  const sampleCsv = `source_url,title,schedule_type
https://www.xxxfollow.com/video/v9001,Batch Video #1 🎥,recurring
https://www.xxxfollow.com/video/v9002,Batch Video #2 💖,once`;

  const handleLoadSample = () => {
    setInputText(format === 'json' ? sampleJson : sampleCsv);
    setErrorMsg('');
  };

  const handleExecuteImport = () => {
    setErrorMsg('');
    try {
      let parsedItems: any[] = [];

      if (format === 'json') {
        parsedItems = JSON.parse(inputText);
        if (!Array.isArray(parsedItems)) {
          throw new Error('JSON input must be an array of objects.');
        }
      } else {
        // Simple CSV parser
        const lines = inputText.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error('CSV input must contain a header row and at least 1 data row.');
        }
        const headers = lines[0].split(',').map((h) => h.trim());
        const urlIdx = headers.indexOf('source_url');
        if (urlIdx === -1) {
          throw new Error('CSV must include a "source_url" header column.');
        }

        const titleIdx = headers.indexOf('title');
        const scheduleTypeIdx = headers.indexOf('schedule_type');

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts[urlIdx]) {
            parsedItems.push({
              source_url: parts[urlIdx],
              title: titleIdx !== -1 ? parts[titleIdx] : '',
              schedule_type: scheduleTypeIdx !== -1 ? parts[scheduleTypeIdx] : 'once'
            });
          }
        }
      }

      if (parsedItems.length === 0) {
        throw new Error('No valid video entries found in input data.');
      }

      onImport(parsedItems);
      setInputText('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse import data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              📥 Bulk Import Video Queue
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste CSV or JSON video source entries to enqueue in batch
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            {/* Format Selector */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  format === 'json'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                JSON Array
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  format === 'csv'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                CSV Format
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Load Sample Template
            </button>
          </div>

          <textarea
            rows={8}
            placeholder={
              format === 'json'
                ? 'Paste JSON array here...'
                : 'source_url,title,schedule_type\nhttps://...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start space-x-2 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteImport}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Process Bulk Import</span>
          </button>
        </div>
      </div>
    </div>
  );
};
