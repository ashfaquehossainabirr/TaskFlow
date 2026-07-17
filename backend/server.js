require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');
const { runDeadlineReminderJob } = require('./jobs/deadlineReminderJob');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');
const timeEntryRoutes = require('./routes/timeEntries');
const noticeRoutes = require('./routes/notices');

const app = express();

connectDB();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/notices', noticeRoutes);

// External-trigger endpoint for services like cron-job.org. It is NOT behind
// the normal login system (no JWT needed) — instead it checks a shared secret
// sent as a header, so an outside scheduler can wake this server up and run
// the reminder job in one request, even on a free hosting tier that sleeps.
app.post('/api/cron/deadline-reminder', async (req, res) => {
  const providedSecret = req.headers['x-cron-secret'];

  if (!process.env.CRON_SECRET) {
    return res.status(500).json({ message: 'CRON_SECRET is not configured on the server' });
  }
  if (providedSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: 'Invalid or missing cron secret' });
  }

  try {
    const results = await runDeadlineReminderJob();
    res.json({ message: 'Reminder job executed via external trigger', results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to run reminder job', error: err.message });
  }
});

// 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler (catches anything thrown/passed to next(err))
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TaskFlow API running on port ${PORT}`);
});

// Runs every day at the time set by REMINDER_CRON (default 10:00) in the
// timezone set by REMINDER_TIMEZONE (default UTC), and emails every employee
// who has a task due within REMINDER_DAYS_THRESHOLD days.
//
// Set ENABLE_INTERNAL_CRON=false if you're using an external scheduler like
// cron-job.org to hit /api/cron/deadline-reminder instead (recommended on
// Render's free tier, since a sleeping service can miss this internal timer).
const REMINDER_CRON = process.env.REMINDER_CRON || '0 10 * * *';
const REMINDER_TIMEZONE = process.env.REMINDER_TIMEZONE || 'UTC';
const ENABLE_INTERNAL_CRON = process.env.ENABLE_INTERNAL_CRON !== 'false';

if (ENABLE_INTERNAL_CRON) {
  cron.schedule(
    REMINDER_CRON,
    () => {
      console.log('[deadline-reminder] Running scheduled deadline reminder job...');
      runDeadlineReminderJob().catch((err) => console.error('[deadline-reminder] Job failed:', err.message));
    },
    { timezone: REMINDER_TIMEZONE }
  );
  console.log(`[deadline-reminder] Scheduled with cron "${REMINDER_CRON}" (timezone: ${REMINDER_TIMEZONE})`);
} else {
  console.log('[deadline-reminder] Internal cron disabled (ENABLE_INTERNAL_CRON=false) — relying on external trigger.');
}
