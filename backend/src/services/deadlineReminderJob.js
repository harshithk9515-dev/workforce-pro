const cron = require('node-cron');
const Task = require('../models/Task');
const { notifyDeadlineReminder } = require('./notificationService');
const { TASK_STATUS } = require('../config/constants');

/**
 * Finds incomplete tasks due within the next 24 hours that have not yet
 * received a reminder, and creates a deadline reminder notification for each.
 */
const runDeadlineReminderSweep = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueSoonTasks = await Task.find({
    status: { $ne: TASK_STATUS.COMPLETED },
    dueDate: { $gte: now, $lte: in24Hours },
    deadlineReminderSent: false,
  });

  for (const task of dueSoonTasks) {
    // eslint-disable-next-line no-await-in-loop
    await notifyDeadlineReminder(task);
    task.deadlineReminderSent = true;
    // eslint-disable-next-line no-await-in-loop
    await task.save();
  }

  if (dueSoonTasks.length > 0) {
    console.log(`[cron] Sent ${dueSoonTasks.length} deadline reminder notification(s)`);
  }
  return dueSoonTasks.length;
};

/**
 * Schedules the sweep to run once a day at 08:00 server time.
 */
const scheduleDeadlineReminders = () => {
  cron.schedule('0 8 * * *', () => {
    runDeadlineReminderSweep().catch((err) =>
      console.error('[cron] Deadline reminder sweep failed:', err.message)
    );
  });
  console.log('[cron] Deadline reminder job scheduled (daily at 08:00)');
};

module.exports = { scheduleDeadlineReminders, runDeadlineReminderSweep };
