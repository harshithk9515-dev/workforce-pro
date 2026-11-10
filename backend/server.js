require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { scheduleDeadlineReminders } = require('./src/services/deadlineReminderJob');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  scheduleDeadlineReminders();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] WorkForce Pro API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[server] Unhandled rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

start();
