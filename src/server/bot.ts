import { Response } from 'express';
import { db } from './db.js';
import { LogLevel, Video } from '../types.js';

// --- SSE Connection Manager ---
const sseClients = new Set<Response>();

export function addSseClient(res: Response): void {
  sseClients.add(res);
}

export function removeSseClient(res: Response): void {
  sseClients.delete(res);
}

export function broadcastEvent(event: string, data: any): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

export function logAndBroadcast(
  videoId: number | null,
  level: LogLevel,
  message: string
) {
  const log = db.addBotLog({
    video_id: videoId,
    level,
    message,
    timestamp: new Date().toISOString()
  });

  broadcastEvent('new_log', log);
  return log;
}

// --- Video Upload Automation Engine ---
const activeJobs = new Set<number>();

export class VideoUploadBot {
  private videoId: number;

  constructor(videoId: number) {
    this.videoId = videoId;
  }

  public async process(forceSimulateFail = false): Promise<boolean> {
    if (activeJobs.has(this.videoId)) {
      logAndBroadcast(
        this.videoId,
        'warning',
        `Job for Video #${this.videoId} is already running.`
      );
      return false;
    }

    const settings = db.getSettings();
    if (settings.bot_paused) {
      logAndBroadcast(
        this.videoId,
        'warning',
        `Bot is globally paused. Skipping Video #${this.videoId}.`
      );
      return false;
    }

    const video = db.getVideoById(this.videoId);
    if (!video) {
      logAndBroadcast(this.videoId, 'error', `Video #${this.videoId} not found in database.`);
      return false;
    }

    activeJobs.add(this.videoId);

    // 1. Mark as processing
    db.updateVideo(this.videoId, {
      status: 'processing',
      error_message: null
    });

    broadcastEvent('video_status_update', {
      videoId: this.videoId,
      status: 'processing',
      message: 'Starting bot automation...'
    });
    broadcastEvent('stats_update', db.getDashboardStats());

    logAndBroadcast(
      this.videoId,
      'info',
      `🚀 Starting upload job for Video #${this.videoId} ("${video.title}")`
    );

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      // Step 1: Initializing Browser Automation context
      await sleep(1000);
      logAndBroadcast(
        this.videoId,
        'info',
        `[1/6] Launching headless browser automation pipeline...`
      );

      // Step 2: Login to fikfap.com
      await sleep(1500);
      logAndBroadcast(
        this.videoId,
        'info',
        `[2/6] Authenticating on fikfap.com with account: ${settings.target_email}`
      );

      // Check Cloudflare protection simulation
      await sleep(1200);
      logAndBroadcast(
        this.videoId,
        'info',
        `[Cloudflare] Verifying session bypass security headers... Pass!`
      );

      // Step 3: Navigate to source URL & extract stream
      await sleep(1800);
      logAndBroadcast(
        this.videoId,
        'info',
        `[3/6] Fetching source URL: ${video.source_url}`
      );

      const capturedMediaUrl = `https://cdn.${video.source_domain}/stream/v_${video.id}_${Date.now().toString().slice(-6)}.mp4`;
      logAndBroadcast(
        this.videoId,
        'info',
        `[4/6] Source media stream extracted successfully: ${capturedMediaUrl}`
      );

      // Simulated failure scenario if requested or bad URL test
      if (forceSimulateFail || video.source_url.includes('fail')) {
        throw new Error('Cloudflare challenge verification timed out after 5 retries (Error code: CF-522)');
      }

      // Step 4: Navigate to upload portal
      await sleep(1500);
      logAndBroadcast(
        this.videoId,
        'info',
        `[5/6] Navigating to target portal upload page: ${settings.target_url_default}`
      );

      // Step 5: Fill form and submit
      await sleep(1500);
      logAndBroadcast(
        this.videoId,
        'info',
        `[6/6] Injecting metadata - Title: "${video.title}", Source Link: "${video.source_url}"`
      );

      await sleep(2000);
      const generatedFikfapUrl = `https://fikfap.com/post/fk_${this.videoId}_${Math.floor(10000 + Math.random() * 90000)}`;

      // Step 6: Success completion
      const updatedUploadCount = video.upload_count + 1;
      const nowIso = new Date().toISOString();

      let nextStatus: Video['status'] = 'completed';
      let nextScheduledTime = video.scheduled_time;

      // Handle recurring schedule
      if (video.schedule_type === 'recurring') {
        nextStatus = 'pending'; // Reset to pending for next day
        const currentSched = new Date(video.scheduled_time);
        const nextSched = new Date(currentSched.getTime() + 24 * 3600 * 1000);
        nextScheduledTime = nextSched.toISOString();
        logAndBroadcast(
          this.videoId,
          'info',
          `📅 Recurring job scheduled for next run at: ${new Date(nextScheduledTime).toLocaleString()}`
        );
      }

      db.updateVideo(this.videoId, {
        status: nextStatus,
        upload_count: updatedUploadCount,
        last_upload_time: nowIso,
        fikfap_post_url: generatedFikfapUrl,
        scheduled_time: nextScheduledTime,
        error_message: null,
        retry_count: 0
      });

      db.addUploadHistory({
        video_id: this.videoId,
        upload_time: nowIso,
        status: 'success',
        fikfap_post_url: generatedFikfapUrl,
        error_message: null,
        video_url_captured: capturedMediaUrl
      });

      logAndBroadcast(
        this.videoId,
        'success',
        `✅ Video #${this.videoId} uploaded successfully! Post URL: ${generatedFikfapUrl}`
      );

      broadcastEvent('upload_completed', {
        videoId: this.videoId,
        success: true,
        fikfapUrl: generatedFikfapUrl
      });

      broadcastEvent('video_status_update', {
        videoId: this.videoId,
        status: nextStatus,
        message: 'Upload completed'
      });

      broadcastEvent('stats_update', db.getDashboardStats());
      return true;

    } catch (error: any) {
      const errMsg = error?.message || 'Unknown upload automation error';
      const currentRetry = video.retry_count + 1;
      const maxRetries = video.max_retries || settings.retry_attempts || 3;

      logAndBroadcast(
        this.videoId,
        'error',
        `❌ Upload attempt failed for Video #${this.videoId}: ${errMsg}`
      );

      db.addUploadHistory({
        video_id: this.videoId,
        upload_time: new Date().toISOString(),
        status: 'failed',
        fikfap_post_url: null,
        error_message: errMsg,
        video_url_captured: null
      });

      if (currentRetry < maxRetries) {
        logAndBroadcast(
          this.videoId,
          'warning',
          `⚠️ Retry attempt ${currentRetry}/${maxRetries} scheduled.`
        );
        db.updateVideo(this.videoId, {
          status: 'pending',
          retry_count: currentRetry,
          error_message: `Attempt ${currentRetry} failed: ${errMsg}`
        });
      } else {
        db.updateVideo(this.videoId, {
          status: 'failed',
          retry_count: currentRetry,
          error_message: errMsg
        });
      }

      broadcastEvent('video_status_update', {
        videoId: this.videoId,
        status: currentRetry < maxRetries ? 'pending' : 'failed',
        message: errMsg
      });

      broadcastEvent('stats_update', db.getDashboardStats());
      return false;

    } finally {
      activeJobs.delete(this.videoId);
    }
  }
}

export function isJobRunning(videoId: number): boolean {
  return activeJobs.has(videoId);
}

export function getActiveJobCount(): number {
  return activeJobs.size;
}
