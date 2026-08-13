import { db } from './db.js';
import { VideoUploadBot, getActiveJobCount, logAndBroadcast, broadcastEvent } from './bot.js';

let intervalId: NodeJS.Timeout | null = null;
let isCheckRunning = false;

export function startScheduler(intervalMs = 5000): void {
  if (intervalId) return;

  logAndBroadcast(null, 'info', '⏰ Background video scheduling service started.');

  intervalId = setInterval(async () => {
    await checkAndProcessDueVideos();
  }, intervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logAndBroadcast(null, 'warning', '⏹️ Background video scheduler stopped.');
  }
}

export async function checkAndProcessDueVideos(): Promise<void> {
  if (isCheckRunning) return;
  isCheckRunning = true;

  try {
    const settings = db.getSettings();
    if (settings.bot_paused) {
      return;
    }

    const currentActiveCount = getActiveJobCount();
    const maxAllowed = settings.max_concurrent_uploads || 1;

    if (currentActiveCount >= maxAllowed) {
      return;
    }

    const availableSlots = maxAllowed - currentActiveCount;
    const nowIso = new Date().toISOString();

    const dueVideos = db
      .getVideos()
      .filter(
        (v) =>
          v.is_active &&
          v.status === 'pending' &&
          new Date(v.scheduled_time) <= new Date(nowIso)
      )
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());

    if (dueVideos.length === 0) {
      return;
    }

    const videosToProcess = dueVideos.slice(0, availableSlots);

    for (const video of videosToProcess) {
      logAndBroadcast(
        video.id,
        'info',
        `⏰ Scheduled time reached for Video #${video.id} ("${video.title}"). Triggering upload...`
      );
      const bot = new VideoUploadBot(video.id);
      // Run in background without awaiting so other tasks continue
      bot.process().catch((err) => {
        console.error(`Scheduler execution error for video ${video.id}:`, err);
      });
    }
  } catch (err) {
    console.error('Error checking due videos:', err);
  } finally {
    isCheckRunning = false;
  }
}

export function toggleBotPause(pause: boolean): boolean {
  db.updateSettings({ bot_paused: pause });
  logAndBroadcast(
    null,
    pause ? 'warning' : 'info',
    pause ? '⏸️ Global bot scheduler PAUSED by user.' : '▶️ Global bot scheduler RESUMED by user.'
  );
  broadcastEvent('bot_state_change', { bot_paused: pause });
  broadcastEvent('stats_update', db.getDashboardStats());
  return pause;
}
