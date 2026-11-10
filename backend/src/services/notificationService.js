const Notification = require('../models/Notification');
const { NOTIFICATION_TYPE } = require('../config/constants');

const notifyTaskAssigned = async (task) => {
  if (String(task.assignedTo) === String(task.assignedBy)) return null;
  return Notification.create({
    recipient: task.assignedTo,
    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    title: 'New task assigned',
    message: `You were assigned the task "${task.title}", due ${new Date(
      task.dueDate
    ).toLocaleDateString()}.`,
    relatedTask: task._id,
    relatedProject: task.project,
  });
};

const notifyTaskCompleted = async (task) => {
  if (String(task.assignedBy) === String(task.assignedTo)) return null;
  return Notification.create({
    recipient: task.assignedBy,
    type: NOTIFICATION_TYPE.TASK_COMPLETED,
    title: 'Task completed',
    message: `"${task.title}" was marked complete.`,
    relatedTask: task._id,
    relatedProject: task.project,
  });
};

const notifyDeadlineReminder = async (task) => {
  return Notification.create({
    recipient: task.assignedTo,
    type: NOTIFICATION_TYPE.DEADLINE_REMINDER,
    title: 'Task deadline approaching',
    message: `"${task.title}" is due ${new Date(task.dueDate).toLocaleDateString()}.`,
    relatedTask: task._id,
    relatedProject: task.project,
  });
};

const notifyProjectUpdate = async (recipients, project, message) => {
  const docs = recipients
    .filter((id) => String(id))
    .map((recipient) => ({
      recipient,
      type: NOTIFICATION_TYPE.PROJECT_UPDATE,
      title: `Project update: ${project.name}`,
      message,
      relatedProject: project._id,
    }));
  if (docs.length === 0) return [];
  return Notification.insertMany(docs);
};

module.exports = {
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyDeadlineReminder,
  notifyProjectUpdate,
};
