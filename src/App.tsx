import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  DashboardStats,
  BotLog,
  SystemSettings
} from './types';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { ActivityChart } from './components/ActivityChart';
import { ActivityFeed } from './components/ActivityFeed';
import { VideoTable } from './components/VideoTable';
import { VideoFormModal } from './components/VideoFormModal';
import { VideoDetailModal } from './components/VideoDetailModal';
import { SettingsView } from './components/SettingsView';
import { BulkImportModal } from './components/BulkImportModal';
import { Play, Pause, Plus, RefreshCw, Bot, Shield, CheckCircle2, Radio } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'videos' | 'settings'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Table Query States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [selectedDetailVideo, setSelectedDetailVideo] = useState<Video | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Apply dark class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch Functions
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        schedule_type: scheduleFilter,
        search: searchQuery,
        sort_by: sortBy,
        order
      });

      const res = await fetch(`/api/videos?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setVideos(json.data);
        setTotalVideos(json.total);
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    }
  }, [page, limit, statusFilter, scheduleFilter, searchQuery, sortBy, order]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs?limit=150');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const refreshAllData = useCallback(() => {
    fetchStats();
    fetchVideos();
    fetchLogs();
    fetchSettings();
  }, [fetchStats, fetchVideos, fetchLogs, fetchSettings]);

  // Initial Load & Query Effects
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // SSE Stream Setup
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.addEventListener('stats_update', (e: MessageEvent) => {
      try {
        setStats(JSON.parse(e.data));
      } catch (err) {}
    });

    eventSource.addEventListener('video_status_update', () => {
      fetchVideos();
      fetchStats();
    });

    eventSource.addEventListener('new_log', (e: MessageEvent) => {
      try {
        const newLog = JSON.parse(e.data);
        setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
      } catch (err) {}
    });

    eventSource.addEventListener('bot_state_change', () => {
      fetchSettings();
    });

    return () => {
      eventSource.close();
    };
  }, [fetchVideos, fetchStats, fetchSettings]);

  // Handler Actions
  const handleToggleGlobalPause = async () => {
    if (!settings) return;
    const isPaused = settings.bot_paused;
    const endpoint = isPaused ? '/api/schedule/resume' : '/api/schedule/pause';
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        fetchSettings();
        fetchStats();
      }
    } catch (err) {
      console.error('Failed to toggle pause:', err);
    }
  };

  const handleCreateOrUpdateVideo = async (formData: any) => {
    try {
      if (editingVideo) {
        // Update
        const res = await fetch(`/api/videos/${editingVideo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          fetchVideos();
          fetchStats();
        }
      } else {
        // Create
        const res = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          fetchVideos();
          fetchStats();
        }
      }
    } catch (err) {
      console.error('Error saving video:', err);
    }
  };

  const handleTriggerUpload = async (id: number, simulateFail = false) => {
    try {
      await fetch(`/api/videos/${id}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate_fail: simulateFail })
      });
      fetchVideos();
      fetchStats();
    } catch (err) {
      console.error('Trigger upload error:', err);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await fetch(`/api/videos/${id}/toggle`, { method: 'POST' });
      fetchVideos();
      fetchStats();
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (confirm(`Are you sure you want to delete Video #${id}?`)) {
      try {
        await fetch(`/api/videos/${id}`, { method: 'DELETE' });
        fetchVideos();
        fetchStats();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    if (confirm(`Are you sure you want to delete ${ids.length} selected video tasks?`)) {
      for (const id of ids) {
        await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      }
      fetchVideos();
      fetchStats();
    }
  };

  const handleBulkToggle = async (ids: number[]) => {
    for (const id of ids) {
      await fetch(`/api/videos/${id}/toggle`, { method: 'POST' });
    }
    fetchVideos();
    fetchStats();
  };

  const handleSaveSettings = async (updates: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error('Save settings error:', err);
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Clear all system execution logs?')) {
      try {
        await fetch('/api/settings/clear-logs', { method: 'POST' });
        setLogs([]);
      } catch (err) {
        console.error('Clear logs error:', err);
      }
    }
  };

  const handleBulkImport = async (items: any[]) => {
    try {
      const res = await fetch('/api/videos/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        fetchVideos();
        fetchStats();
      }
    } catch (err) {
      console.error('Bulk import error:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans">
      {/* Sidebar - Geometric Balance Theme */}
      <aside className="w-64 bg-gradient-to-b from-[#764BA2] to-[#667EEA] hidden lg:flex flex-col shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shrink-0">
            <div className="w-4 h-4 border-2 border-[#667EEA] rotate-45" />
          </div>
          <span className="font-bold text-white tracking-tight uppercase text-lg">
            VideoBot.AI
          </span>
        </div>

        {/* Navigation items */}
        <nav className="p-4 flex-grow flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'dashboard'
                ? 'bg-white/10 text-white font-bold'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                activeTab === 'dashboard' ? 'bg-[#00C853]' : 'bg-white/20'
              }`}
            />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'videos'
                ? 'bg-white/10 text-white font-bold'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                activeTab === 'videos' ? 'bg-[#00C853]' : 'bg-white/20'
              }`}
            />
            <span>Video Library</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'settings'
                ? 'bg-white/10 text-white font-bold'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                activeTab === 'settings' ? 'bg-[#00C853]' : 'bg-white/20'
              }`}
            />
            <span>Settings</span>
          </button>
        </nav>

        {/* Worker Status Box */}
        <div className="p-6 border-t border-white/10 mt-auto">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
            <p className="text-[10px] text-white/60 mb-1.5 uppercase tracking-widest font-bold">
              Worker Status
            </p>
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">
                {settings?.bot_paused ? 'Paused' : 'Active & Ready'}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  settings?.bot_paused
                    ? 'bg-amber-400'
                    : 'bg-[#00C853] shadow-[0_0_8px_rgba(0,200,83,0.8)]'
                }`}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          settings={settings}
          isConnected={isConnected}
          onTogglePause={handleToggleGlobalPause}
          onOpenAddModal={() => {
            setEditingVideo(null);
            setIsFormModalOpen(true);
          }}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onRefresh={refreshAllData}
        />

        {/* Mobile Navigation */}
        <div className="lg:hidden bg-gradient-to-r from-[#764BA2] to-[#667EEA] p-2 flex justify-around text-white text-xs font-semibold shadow-inner">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg ${
              activeTab === 'dashboard' ? 'bg-white/20 text-white font-bold' : 'text-white/80'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-3 py-1.5 rounded-lg ${
              activeTab === 'videos' ? 'bg-white/20 text-white font-bold' : 'text-white/80'
            }`}
          >
            Video Queue
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg ${
              activeTab === 'settings' ? 'bg-white/20 text-white font-bold' : 'text-white/80'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Main Body */}
        <main className="p-4 sm:p-8 space-y-6 flex-grow overflow-x-hidden">
          {/* Statistics Banner Cards (Visible across Dashboard & Video queue) */}
          {activeTab !== 'settings' && <StatsCards stats={stats} />}

          {/* Tab 1: Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Automation Scheduler Status Banner */}
              <div className="p-5 bg-gradient-to-r from-[#764BA2] to-[#667EEA] text-white rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-base tracking-tight">Automation Scheduler Engine</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#00C853]/20 text-[#00C853] font-bold border border-[#00C853]/40 uppercase tracking-wide">
                        fikfap.com
                      </span>
                    </div>
                    <p className="text-xs text-white/80 mt-0.5">
                      Max Concurrent Uploads: <span className="font-bold">{settings?.max_concurrent_uploads || 1}</span> • Target Email: <span className="font-mono text-indigo-100">{settings?.target_email || 'peprahe8933@gmail.com'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleGlobalPause}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                      settings?.bot_paused
                        ? 'bg-[#00C853] hover:bg-[#00a845] text-white'
                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                    }`}
                  >
                    {settings?.bot_paused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Engine</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Engine</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setEditingVideo(null);
                      setIsFormModalOpen(true);
                    }}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold backdrop-blur-md transition flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Video</span>
                  </button>
                </div>
              </div>

              {/* Grid layout: Performance Chart & Live Terminal Output */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityChart isDarkMode={isDarkMode} />
                <ActivityFeed
                  logs={logs}
                  onClearLogs={handleClearLogs}
                  onSelectVideo={(id) => {
                    const v = videos.find((item) => item.id === id);
                    if (v) setSelectedDetailVideo(v);
                  }}
                />
              </div>

              {/* Queue Management Table preview */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide text-xs">
                    Queue Management
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded text-[10px] font-bold">
                      SYNCING LIVE
                    </span>
                    <button
                      onClick={() => setActiveTab('videos')}
                      className="text-xs font-bold text-[#667EEA] dark:text-[#a78bfa] hover:underline ml-2"
                    >
                      View Full Queue ({totalVideos}) &rarr;
                    </button>
                  </div>
                </div>

                <VideoTable
                  videos={videos.slice(0, 10)}
                  totalVideos={totalVideos}
                  page={page}
                  limit={10}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  scheduleFilter={scheduleFilter}
                  setScheduleFilter={setScheduleFilter}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  order={order}
                  setOrder={setOrder}
                  onTriggerUpload={handleTriggerUpload}
                  onToggleActive={handleToggleActive}
                  onSelectVideoDetail={(v) => setSelectedDetailVideo(v)}
                  onEditVideo={(v) => {
                    setEditingVideo(v);
                    setIsFormModalOpen(true);
                  }}
                  onDeleteVideo={handleDeleteVideo}
                  onBulkDelete={handleBulkDelete}
                  onBulkToggle={handleBulkToggle}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Full Video Queue Management Table */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Video Queue & Scheduled Tasks
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Manage, search, schedule, and trigger video uploads on demand
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsBulkImportOpen(true)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg transition"
                  >
                    📥 Bulk Import
                  </button>
                  <button
                    onClick={() => {
                      setEditingVideo(null);
                      setIsFormModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#667EEA] hover:bg-[#586ed4] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Video Task</span>
                  </button>
                </div>
              </div>

              <VideoTable
                videos={videos}
                totalVideos={totalVideos}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                scheduleFilter={scheduleFilter}
                setScheduleFilter={setScheduleFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                order={order}
                setOrder={setOrder}
                onTriggerUpload={handleTriggerUpload}
                onToggleActive={handleToggleActive}
                onSelectVideoDetail={(v) => setSelectedDetailVideo(v)}
                onEditVideo={(v) => {
                  setEditingVideo(v);
                  setIsFormModalOpen(true);
                }}
                onDeleteVideo={handleDeleteVideo}
                onBulkDelete={handleBulkDelete}
                onBulkToggle={handleBulkToggle}
              />
            </div>
          )}

          {/* Tab 3: Settings */}
          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onClearLogs={handleClearLogs}
              onOpenBulkImport={() => setIsBulkImportOpen(true)}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <VideoFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingVideo(null);
        }}
        onSubmit={handleCreateOrUpdateVideo}
        initialData={editingVideo}
        defaultTitle={settings?.default_title || 'Link in Bio💖'}
      />

      <VideoDetailModal
        video={selectedDetailVideo}
        isOpen={!!selectedDetailVideo}
        onClose={() => setSelectedDetailVideo(null)}
        onTriggerUpload={handleTriggerUpload}
        onToggleActive={handleToggleActive}
        onEdit={(v) => {
          setSelectedDetailVideo(null);
          setEditingVideo(v);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteVideo}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}
