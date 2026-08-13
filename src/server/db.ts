import fs from 'fs';
import path from 'path';
import { Video, UploadHistory, BotLog, SystemSettings, DashboardStats } from '../types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DbSchema {
  videos: Video[];
  upload_history: UploadHistory[];
  bot_logs: BotLog[];
  settings: SystemSettings;
  next_video_id: number;
  next_history_id: number;
  next_log_id: number;
}

const defaultSettings: SystemSettings = {
  id: 1,
  max_concurrent_uploads: 1,
  default_title: 'Link in Bio💖',
  retry_attempts: 3,
  cloudflare_max_retries: 5,
  upload_timeout_seconds: 120,
  target_email: 'peprahe8933@gmail.com',
  target_password: 'emma7233',
  source_url_default: 'https://www.xxxfollow.com',
  target_url_default: 'https://fikfap.com/upload/url',
  updated_at: new Date().toISOString(),
  bot_paused: false,
};

const defaultSeedData: DbSchema = {
  videos: [],
  upload_history: [],
  bot_logs: [],
  settings: defaultSettings,
  next_video_id: 1,
  next_history_id: 1,
  next_log_id: 1
};

class Database {
  private data: DbSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DbSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...defaultSeedData,
          ...parsed,
          settings: { ...defaultSettings, ...(parsed.settings || {}) }
        };
      }
    } catch (err) {
      console.error('Failed to load db file, initializing seed data:', err);
    }

    this.saveData(defaultSeedData);
    return defaultSeedData;
  }

  public saveData(dataToSave?: DbSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db to disk:', err);
    }
  }

  // --- Videos ---
  public getVideos(): Video[] {
    return this.data.videos;
  }

  public getVideoById(id: number): Video | undefined {
    return this.data.videos.find((v) => v.id === id);
  }

  public createVideo(input: Partial<Video>): Video {
    const id = this.data.next_video_id++;
    let domain = 'unknown';
    try {
      if (input.source_url) {
        const urlObj = new URL(input.source_url);
        domain = urlObj.hostname.replace('www.', '');
      }
    } catch (e) {
      domain = 'custom';
    }

    const newVideo: Video = {
      id,
      source_url: input.source_url || '',
      source_domain: domain,
      title: input.title?.trim() || this.data.settings.default_title || 'Link in Bio💖',
      scheduled_time: input.scheduled_time || new Date().toISOString(),
      timezone: input.timezone || 'UTC',
      schedule_type: input.schedule_type || 'once',
      recurring_frequency: input.recurring_frequency || 'daily',
      status: input.status || 'pending',
      upload_count: 0,
      last_upload_time: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
      fikfap_post_url: null,
      is_active: input.is_active !== undefined ? input.is_active : true,
      max_retries: input.max_retries || this.data.settings.retry_attempts || 3,
      retry_count: 0
    };

    this.data.videos.unshift(newVideo);
    this.saveData();
    return newVideo;
  }

  public updateVideo(id: number, updates: Partial<Video>): Video | undefined {
    const video = this.getVideoById(id);
    if (!video) return undefined;

    if (updates.source_url && updates.source_url !== video.source_url) {
      try {
        const urlObj = new URL(updates.source_url);
        updates.source_domain = urlObj.hostname.replace('www.', '');
      } catch (e) {
        updates.source_domain = 'custom';
      }
    }

    Object.assign(video, updates, { updated_at: new Date().toISOString() });
    this.saveData();
    return video;
  }

  public deleteVideo(id: number): boolean {
    const initialLen = this.data.videos.length;
    this.data.videos = this.data.videos.filter((v) => v.id !== id);
    this.data.upload_history = this.data.upload_history.filter((h) => h.video_id !== id);
    this.data.bot_logs = this.data.bot_logs.filter((l) => l.video_id !== id);
    this.saveData();
    return this.data.videos.length < initialLen;
  }

  // --- History ---
  public getUploadHistory(videoId?: number): UploadHistory[] {
    if (videoId) {
      return this.data.upload_history.filter((h) => h.video_id === videoId);
    }
    return this.data.upload_history;
  }

  public addUploadHistory(entry: Omit<UploadHistory, 'id'>): UploadHistory {
    const id = this.data.next_history_id++;
    const newEntry: UploadHistory = { id, ...entry };
    this.data.upload_history.unshift(newEntry);
    this.saveData();
    return newEntry;
  }

  // --- Logs ---
  public getBotLogs(videoId?: number, limit = 100): BotLog[] {
    let logs = this.data.bot_logs;
    if (videoId) {
      logs = logs.filter((l) => l.video_id === videoId);
    }
    return logs.slice(0, limit);
  }

  public addBotLog(log: Omit<BotLog, 'id'>): BotLog {
    const id = this.data.next_log_id++;
    const newLog: BotLog = { id, ...log };
    this.data.bot_logs.unshift(newLog);
    // Keep max 500 logs
    if (this.data.bot_logs.length > 500) {
      this.data.bot_logs = this.data.bot_logs.slice(0, 500);
    }
    this.saveData();
    return newLog;
  }

  public clearBotLogs(): void {
    this.data.bot_logs = [];
    this.saveData();
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.saveData();
    return this.data.settings;
  }

  // --- Stats ---
  public getDashboardStats(): DashboardStats {
    const videos = this.data.videos;
    const total = videos.length;
    const pending = videos.filter((v) => v.status === 'pending').length;
    const processing = videos.filter((v) => v.status === 'processing').length;
    const completed = videos.filter((v) => v.status === 'completed').length;
    const failed = videos.filter((v) => v.status === 'failed').length;
    const paused = videos.filter((v) => v.status === 'paused' || !v.is_active).length;

    const totalUploadAttempts = this.data.upload_history.length;
    const successfulAttempts = this.data.upload_history.filter((h) => h.status === 'success').length;
    const success_rate = totalUploadAttempts > 0 ? Math.round((successfulAttempts / totalUploadAttempts) * 100) : 100;

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 3600 * 1000);
    const upcoming_24h = videos.filter(
      (v) => v.status === 'pending' && v.is_active && new Date(v.scheduled_time) <= in24h
    ).length;

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      paused,
      success_rate,
      total_uploads: successfulAttempts,
      upcoming_24h
    };
  }
}

export const db = new Database();
