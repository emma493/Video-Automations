import React, { useState } from 'react';
import { Video, VideoStatus, ScheduleType } from '../types';
import {
  Play,
  Pause,
  ExternalLink,
  Eye,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckSquare,
  Square,
  Clock,
  Repeat,
  RotateCw,
  Globe,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowUpDown
} from 'lucide-react';

interface VideoTableProps {
  videos: Video[];
  totalVideos: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  scheduleFilter: string;
  setScheduleFilter: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
  order: 'asc' | 'desc';
  setOrder: (o: 'asc' | 'desc') => void;
  onTriggerUpload: (id: number) => void;
  onToggleActive: (id: number) => void;
  onSelectVideoDetail: (video: Video) => void;
  onEditVideo: (video: Video) => void;
  onDeleteVideo: (id: number) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkToggle?: (ids: number[]) => void;
}

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  totalVideos,
  page,
  limit,
  onPageChange,
  onLimitChange,
  statusFilter,
  setStatusFilter,
  scheduleFilter,
  setScheduleFilter,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  order,
  setOrder,
  onTriggerUpload,
  onToggleActive,
  onSelectVideoDetail,
  onEditVideo,
  onDeleteVideo,
  onBulkDelete,
  onBulkToggle
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSelectAll = () => {
    if (selectedIds.length === videos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map((v) => v.id));
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const getStatusBadge = (status: VideoStatus, isActive: boolean) => {
    if (!isActive) {
      return (
        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          PAUSED
        </span>
      );
    }

    switch (status) {
      case 'processing':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 animate-pulse">
            PROCESSING
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 dark:bg-emerald-950 text-green-600 dark:text-[#00C853]">
            COMPLETED
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-600 dark:text-[#FF1744]">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-300">
            PENDING
          </span>
        );
    }
  };

  const totalPages = Math.ceil(totalVideos / limit) || 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Table Toolbar & Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by video title or source URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          {/* Schedule Filter */}
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Schedule Types</option>
            <option value="once">Once</option>
            <option value="recurring">Repeat Daily</option>
          </select>

          {/* Items Per Page */}
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2 border-b border-indigo-100 dark:border-indigo-900 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <span className="font-semibold">{selectedIds.length} video(s) selected</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onBulkToggle) onBulkToggle(selectedIds);
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 font-medium transition"
            >
              Toggle Pause/Active
            </button>
            <button
              onClick={() => {
                if (onBulkDelete) onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold text-xs border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={videos.length > 0 && selectedIds.length === videos.length}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('id')}
                className="p-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('title')}
                className="p-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Title & Source URL</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('scheduled_time')}
                className="p-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Scheduled Time</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">Schedule Type</th>
              <th
                onClick={() => handleSort('status')}
                className="p-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 text-center">Uploads</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {videos.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold">No video upload tasks found.</p>
                  <p className="text-xs mt-1">Try adjusting your filters or add a new video task.</p>
                </td>
              </tr>
            ) : (
              videos.map((video) => {
                const isSelected = selectedIds.includes(video.id);
                return (
                  <tr
                    key={video.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(video.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    {/* ID */}
                    <td className="p-3 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      #{video.id}
                    </td>

                    {/* Title & Source Link */}
                    <td className="p-3 max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {video.title}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-xs font-mono text-[#764BA2] dark:text-[#a78bfa] bg-[#764BA2]/10 dark:bg-[#764BA2]/20 px-2 py-0.5 rounded font-semibold">
                          {video.source_domain}
                        </span>
                        <a
                          href={video.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[180px] inline-flex items-center space-x-1"
                        >
                          <span className="truncate">{video.source_url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </td>

                    {/* Scheduled Time */}
                    <td className="p-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      <div>{new Date(video.scheduled_time).toLocaleString()}</div>
                      <span className="text-[10px] text-slate-400">{video.timezone}</span>
                    </td>

                    {/* Schedule Type */}
                    <td className="p-3 whitespace-nowrap text-xs">
                      {video.schedule_type === 'recurring' ? (
                        <span className="inline-flex items-center space-x-1 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-md font-semibold border border-purple-200 dark:border-purple-800">
                          <Repeat className="w-3 h-3" />
                          <span>Daily Repeat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                          <Clock className="w-3 h-3" />
                          <span>Once</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3 whitespace-nowrap">
                      {getStatusBadge(video.status, video.is_active)}
                    </td>

                    {/* Uploads Count */}
                    <td className="p-3 text-center whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-300">
                      {video.upload_count}
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Force Post Now */}
                        <button
                          onClick={() => onTriggerUpload(video.id)}
                          disabled={video.status === 'processing'}
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition disabled:opacity-40"
                          title="Trigger Immediate Upload"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>

                        {/* Toggle Pause/Active */}
                        <button
                          onClick={() => onToggleActive(video.id)}
                          className={`p-1.5 rounded-lg transition ${
                            video.is_active
                              ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950'
                              : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                          }`}
                          title={video.is_active ? 'Pause Video' : 'Activate Video'}
                        >
                          {video.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>

                        {/* View Details / Logs */}
                        <button
                          onClick={() => onSelectVideoDetail(video)}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View Details & Bot Logs"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEditVideo(video)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteVideo(video.id)}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          Showing page <span className="font-bold text-slate-900 dark:text-white">{page}</span> of{' '}
          <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({totalVideos} total videos)
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 transition"
          >
            Previous
          </button>

          <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
