export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
export type ScheduleType = 'once' | 'recurring';
export type RecurringFrequency = 'daily' | 'hourly' | 'weekly';
export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface Video {
  id: number;
  source_url: string;
  source_domain: string;
  title: string;
  scheduled_time: string; // ISO string
  timezone: string;
  schedule_type: ScheduleType;
  recurring_frequency: RecurringFrequency;
  status: VideoStatus;
  upload_count: number;
  last_upload_time: string | null;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  fikfap_post_url: string | null;
  is_active: boolean;
  max_retries: number;
  retry_count: number;
}

export interface UploadHistory {
  id: number;
  video_id: number;
  upload_time: string;
  status: 'success' | 'failed';
  fikfap_post_url: string | null;
  error_message: string | null;
  video_url_captured: string | null;
}

export interface BotLog {
  id: number;
  video_id: number | null;
  level: LogLevel;
  message: string;
  timestamp: string;
}

export interface SystemSettings {
  id: number;
  max_concurrent_uploads: number;
  default_title: string;
  retry_attempts: number;
  cloudflare_max_retries: number;
  upload_timeout_seconds: number;
  target_email: string;
  target_password: string;
  source_url_default: string;
  target_url_default: string;
  updated_at: string;
  bot_paused: boolean;
}

export interface DashboardStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  paused: number;
  success_rate: number;
  total_uploads: number;
  upcoming_24h: number;
}

export interface SSEEventData {
  type: 'stats_update' | 'video_status_update' | 'new_log' | 'upload_completed' | 'bot_state_change';
  data: any;
}
