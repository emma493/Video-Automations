import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.js';
import {
  addSseClient,
  removeSseClient,
  VideoUploadBot,
  logAndBroadcast,
  broadcastEvent
} from './src/server/bot.js';
import {
  startScheduler,
  toggleBotPause,
  checkAndProcessDueVideos
} from './src/server/scheduler.js';

async function main() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Start background scheduler
  startScheduler(5000);

  // --- SSE Endpoint ---
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    addSseClient(res);

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      removeSseClient(res);
    });
  });

  // --- Dashboard Endpoints ---
  app.get('/api/dashboard/stats', (req, res) => {
    res.json(db.getDashboardStats());
  });

  app.get('/api/dashboard/latest', (req, res) => {
    const stats = db.getDashboardStats();
    const latestLogs = db.getBotLogs(undefined, 10);
    const recentUploads = db.getUploadHistory(undefined).slice(0, 5);
    res.json({
      stats,
      latest_logs: latestLogs,
      recent_uploads: recentUploads
    });
  });

  // --- Video Endpoints ---
  app.get('/api/videos', (req, res) => {
    let videos = db.getVideos();

    // Filters
    const { status, schedule_type, search, is_active } = req.query;
    if (status && status !== 'all') {
      videos = videos.filter((v) => v.status === status);
    }
    if (schedule_type && schedule_type !== 'all') {
      videos = videos.filter((v) => v.schedule_type === schedule_type);
    }
    if (is_active !== undefined) {
      const activeBool = is_active === 'true';
      videos = videos.filter((v) => v.is_active === activeBool);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      videos = videos.filter(
        (v) => v.title.toLowerCase().includes(q) || v.source_url.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = (req.query.sort_by as string) || 'created_at';
    const order = (req.query.order as string) === 'asc' ? 1 : -1;

    videos.sort((a: any, b: any) => {
      if (!a[sortBy]) return order;
      if (!b[sortBy]) return -order;
      if (a[sortBy] < b[sortBy]) return -1 * order;
      if (a[sortBy] > b[sortBy]) return 1 * order;
      return 0;
    });

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedVideos = videos.slice(startIndex, endIndex);

    res.json({
      data: paginatedVideos,
      total: videos.length,
      page,
      limit,
      total_pages: Math.ceil(videos.length / limit)
    });
  });

  app.get('/api/videos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const video = db.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  });

  app.post('/api/videos', (req, res) => {
    const { source_url, title, scheduled_time, timezone, schedule_type, recurring_frequency, post_now } = req.body;

    if (!source_url || typeof source_url !== 'string') {
      return res.status(400).json({ error: 'Source URL is required' });
    }

    let initialStatus = 'pending';
    let targetTime = scheduled_time || new Date().toISOString();

    if (post_now) {
      targetTime = new Date().toISOString();
    }

    const created = db.createVideo({
      source_url,
      title,
      scheduled_time: targetTime,
      timezone: timezone || 'UTC',
      schedule_type: schedule_type || 'once',
      recurring_frequency: recurring_frequency || 'daily',
      status: initialStatus as any,
      is_active: true
    });

    logAndBroadcast(
      created.id,
      'info',
      `➕ Added new video entry: "${created.title}" (${created.schedule_type === 'recurring' ? 'Recurring' : 'Scheduled: ' + new Date(created.scheduled_time).toLocaleString()})`
    );

    broadcastEvent('stats_update', db.getDashboardStats());

    if (post_now) {
      const bot = new VideoUploadBot(created.id);
      bot.process().catch(console.error);
    }

    res.status(201).json(created);
  });

  app.put('/api/videos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updated = db.updateVideo(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Video not found' });
    }
    logAndBroadcast(id, 'info', `✏️ Updated video details for Video #${id}`);
    broadcastEvent('stats_update', db.getDashboardStats());
    res.json(updated);
  });

  app.delete('/api/videos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const success = db.deleteVideo(id);
    if (!success) {
      return res.status(404).json({ error: 'Video not found' });
    }
    logAndBroadcast(null, 'warning', `🗑️ Deleted Video #${id}`);
    broadcastEvent('stats_update', db.getDashboardStats());
    res.json({ success: true, message: `Video #${id} deleted` });
  });

  app.post('/api/videos/:id/upload', (req, res) => {
    const id = parseInt(req.params.id);
    const video = db.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const forceFail = req.body.simulate_fail === true;

    const bot = new VideoUploadBot(id);
    bot.process(forceFail).catch(console.error);

    res.json({ message: `Triggered manual upload job for Video #${id}` });
  });

  app.post('/api/videos/:id/toggle', (req, res) => {
    const id = parseInt(req.params.id);
    const video = db.getVideoById(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const nextActive = !video.is_active;
    const updated = db.updateVideo(id, {
      is_active: nextActive,
      status: nextActive ? 'pending' : 'paused'
    });

    logAndBroadcast(
      id,
      'info',
      `${nextActive ? '▶️ Activated' : '⏸️ Paused'} Video #${id}`
    );
    broadcastEvent('stats_update', db.getDashboardStats());
    res.json(updated);
  });

  app.get('/api/videos/:id/history', (req, res) => {
    const id = parseInt(req.params.id);
    res.json(db.getUploadHistory(id));
  });

  app.get('/api/videos/:id/logs', (req, res) => {
    const id = parseInt(req.params.id);
    res.json(db.getBotLogs(id));
  });

  app.post('/api/videos/bulk-import', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Array of video items required' });
    }

    const createdList = [];
    for (const item of items) {
      if (item.source_url) {
        const video = db.createVideo({
          source_url: item.source_url,
          title: item.title,
          scheduled_time: item.scheduled_time,
          timezone: item.timezone,
          schedule_type: item.schedule_type,
          recurring_frequency: item.recurring_frequency
        });
        createdList.push(video);
      }
    }

    logAndBroadcast(null, 'success', `📥 Bulk imported ${createdList.length} video entries.`);
    broadcastEvent('stats_update', db.getDashboardStats());
    res.json({ message: `Imported ${createdList.length} videos`, count: createdList.length });
  });

  // --- Scheduler Endpoints ---
  app.get('/api/schedule/upcoming', (req, res) => {
    const videos = db
      .getVideos()
      .filter((v) => v.is_active && v.status === 'pending')
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
    res.json(videos.slice(0, 10));
  });

  app.post('/api/schedule/pause', (req, res) => {
    toggleBotPause(true);
    res.json({ message: 'Bot schedule paused', bot_paused: true });
  });

  app.post('/api/schedule/resume', (req, res) => {
    toggleBotPause(false);
    checkAndProcessDueVideos().catch(console.error);
    res.json({ message: 'Bot schedule resumed', bot_paused: false });
  });

  // --- Settings & System Endpoints ---
  app.get('/api/settings', (req, res) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req, res) => {
    const updated = db.updateSettings(req.body);
    logAndBroadcast(null, 'info', '⚙️ Updated system settings.');
    res.json(updated);
  });

  app.get('/api/logs', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    res.json(db.getBotLogs(undefined, limit));
  });

  app.post('/api/settings/clear-logs', (req, res) => {
    db.clearBotLogs();
    logAndBroadcast(null, 'warning', '🧹 System logs cleared by user.');
    res.json({ message: 'Logs cleared successfully' });
  });

  app.get('/api/export', (req, res) => {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const videos = db.getVideos();

    if (format === 'csv') {
      const headers = ['ID', 'Title', 'Source URL', 'Domain', 'Schedule Type', 'Scheduled Time', 'Status', 'Upload Count', 'Fikfap URL'];
      const rows = videos.map((v) => [
        v.id,
        `"${(v.title || '').replace(/"/g, '""')}"`,
        `"${v.source_url}"`,
        v.source_domain,
        v.schedule_type,
        v.scheduled_time,
        v.status,
        v.upload_count,
        v.fikfap_post_url || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=videos_export.csv');
      return res.send(csvContent);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=videos_export.json');
    res.json(videos);
  });

  // --- Vite / Static Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
