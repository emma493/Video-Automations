import React, { useState, useEffect } from 'react';
import { Video, ScheduleType, RecurringFrequency } from '../types';
import { X, Calendar, Clock, Globe, Sparkles, ChevronDown, ChevronUp, Link as LinkIcon, Check } from 'lucide-react';

interface VideoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Video | null;
  defaultTitle?: string;
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney'
];

export const VideoFormModal: React.FC<VideoFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultTitle = 'Link in Bio💖'
}) => {
  const [sourceUrl, setSourceUrl] = useState('');
  const [title, setTitle] = useState('');
  const [uploadOption, setUploadOption] = useState<'now' | 'schedule'>('schedule');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once');
  const [isActive, setIsActive] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxRetries, setMaxRetries] = useState(3);
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    if (initialData) {
      setSourceUrl(initialData.source_url);
      setTitle(initialData.title);
      setUploadOption('schedule');
      const d = new Date(initialData.scheduled_time);
      setDate(d.toISOString().slice(0, 10));
      setTime(d.toTimeString().slice(0, 5));
      setTimezone(initialData.timezone || 'UTC');
      setScheduleType(initialData.schedule_type);
      setIsActive(initialData.is_active);
      setMaxRetries(initialData.max_retries || 3);
    } else {
      setSourceUrl('');
      setTitle('');
      setUploadOption('schedule');
      const tomorrow = new Date(Date.now() + 3600000);
      setDate(tomorrow.toISOString().slice(0, 10));
      setTime(tomorrow.toTimeString().slice(0, 5));
      setTimezone('UTC');
      setScheduleType('once');
      setIsActive(true);
      setMaxRetries(3);
    }
    setUrlError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateUrl = (urlStr: string) => {
    try {
      new URL(urlStr);
      setUrlError('');
      return true;
    } catch (e) {
      setUrlError('Please enter a valid HTTP or HTTPS URL');
      return false;
    }
  };

  const handleSourceUrlChange = (val: string) => {
    setSourceUrl(val);
    if (val) {
      validateUrl(val);
      // Auto populate title if blank
      if (!title) {
        try {
          const parsed = new URL(val);
          const pathSegments = parsed.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            const raw = pathSegments[pathSegments.length - 1].replace(/[-_]/g, ' ');
            setTitle(raw.charAt(0).toUpperCase() + raw.slice(1));
          }
        } catch (e) {}
      }
    } else {
      setUrlError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateUrl(sourceUrl)) {
      return;
    }

    let scheduledIso = new Date().toISOString();
    if (uploadOption === 'schedule' && date && time) {
      scheduledIso = new Date(`${date}T${time}:00`).toISOString();
    }

    onSubmit({
      source_url: sourceUrl,
      title: title || defaultTitle,
      scheduled_time: scheduledIso,
      timezone,
      schedule_type: scheduleType,
      recurring_frequency: 'daily' as RecurringFrequency,
      is_active: isActive,
      max_retries: maxRetries,
      post_now: uploadOption === 'now'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? '✏️ Edit Video Task' : '📝 Add New Video Task'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit source link and configure automation schedule for fikfap.com
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Source URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Source Video URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="url"
                required
                placeholder="https://www.xxxfollow.com/video/v12345"
                value={sourceUrl}
                onChange={(e) => handleSourceUrlChange(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border ${
                  urlError
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500'
                } rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2`}
              />
            </div>
            {urlError && <p className="text-xs text-rose-500 mt-1">{urlError}</p>}
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Title (Optional)
              </label>
              <button
                type="button"
                onClick={() => setTitle(defaultTitle)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Use "{defaultTitle}"</span>
              </button>
            </div>
            <input
              type="text"
              placeholder={defaultTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Upload Option Radio Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Upload Timing Option
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                  uploadOption === 'now'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="uploadOption"
                  value="now"
                  checked={uploadOption === 'now'}
                  onChange={() => setUploadOption('now')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold">⚡ Post Now</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center space-x-2 cursor-pointer transition ${
                  uploadOption === 'schedule'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="uploadOption"
                  value="schedule"
                  checked={uploadOption === 'schedule'}
                  onChange={() => setUploadOption('schedule')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold">📅 Schedule</span>
              </label>
            </div>
          </div>

          {/* Schedule Settings Box */}
          {uploadOption === 'schedule' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                🗓️ Schedule Settings
              </span>

              <div className="grid grid-cols-2 gap-3">
                {/* Date Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Time (24h) *
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Timezone Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Timezone *
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Schedule Type
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="once"
                      checked={scheduleType === 'once'}
                      onChange={() => setScheduleType('once')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Once</span>
                  </label>
                  <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="recurring"
                      checked={scheduleType === 'recurring'}
                      onChange={() => setScheduleType('recurring')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Repeat Daily</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Active Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activeToggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="activeToggle" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Task Active (Ready for scheduler execution)
            </label>
          </div>

          {/* Collapsible Advanced Options */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-between w-full"
            >
              <span>⚙️ Advanced Options</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Max Retry Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="w-24 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition"
            >
              {initialData ? 'Update Video Task' : 'Save Video Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
