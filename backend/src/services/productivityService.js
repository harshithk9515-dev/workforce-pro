const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { TASK_STATUS, PROJECT_STATUS } = require('../config/constants');

/**
 * Returns task status counts + completion rate for a single user.
 */
const getUserProductivity = async (userId) => {
  const matchStage = { assignedTo: new mongoose.Types.ObjectId(userId) };

  const counts = await Task.aggregate([
    { $match: matchStage },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const breakdown = Object.values(TASK_STATUS).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});
  counts.forEach((c) => {
    breakdown[c._id] = c.count;
  });

  const total = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
  const completed = breakdown[TASK_STATUS.COMPLETED] || 0;

  const overdue = await Task.countDocuments({
    ...matchStage,
    status: { $ne: TASK_STATUS.COMPLETED },
    dueDate: { $lt: new Date() },
  });

  return {
    breakdown,
    total,
    completed,
    overdue,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

/**
 * Returns productivity stats for every employee on a manager's team (or org-wide for admin).
 */
const getTeamProductivity = async (userIds) => {
  const ids = userIds.map((id) => new mongoose.Types.ObjectId(id));

  const results = await Task.aggregate([
    { $match: { assignedTo: { $in: ids } } },
    {
      $group: {
        _id: { user: '$assignedTo', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const byUser = {};
  ids.forEach((id) => {
    byUser[id.toString()] = Object.values(TASK_STATUS).reduce((acc, s) => {
      acc[s] = 0;
      return acc;
    }, {});
  });
  results.forEach((r) => {
    const userId = r._id.user.toString();
    if (byUser[userId]) byUser[userId][r._id.status] = r.count;
  });

  return byUser;
};

/**
 * Org-wide / scoped KPI snapshot for dashboards.
 */
const getKpiSnapshot = async ({ projectFilter = {}, taskFilter = {} } = {}) => {
  const [
    totalEmployees,
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
  ] = await Promise.all([
    Employee.countDocuments({ status: 'active' }),
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: PROJECT_STATUS.IN_PROGRESS }),
    Project.countDocuments({ ...projectFilter, status: PROJECT_STATUS.COMPLETED }),
    Task.countDocuments(taskFilter),
    Task.countDocuments({ ...taskFilter, status: TASK_STATUS.COMPLETED }),
    Task.countDocuments({ ...taskFilter, status: { $ne: TASK_STATUS.COMPLETED } }),
    Task.countDocuments({
      ...taskFilter,
      status: { $ne: TASK_STATUS.COMPLETED },
      dueDate: { $lt: new Date() },
    }),
  ]);

  return {
    totalEmployees,
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    overallCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
};

/**
 * Task status distribution, useful for pie/donut charts.
 */
const getStatusDistribution = async (taskFilter = {}) => {
  const results = await Task.aggregate([
    { $match: taskFilter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const distribution = Object.values(TASK_STATUS).reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {});
  results.forEach((r) => {
    distribution[r._id] = r.count;
  });
  return distribution;
};

/**
 * Same as getTeamProductivity, but joined with User names/avatars and
 * flattened into an array shaped for direct chart consumption:
 * [{ userId, name, avatarColor, completed, pending, total, completionRate }]
 */
const getProductivityByUsersWithNames = async (userIds) => {
  if (!userIds.length) return [];

  const [byUser, users] = await Promise.all([
    getTeamProductivity(userIds),
    User.find({ _id: { $in: userIds } }).select('name avatarColor'),
  ]);

  const userMap = users.reduce((acc, u) => {
    acc[u._id.toString()] = u;
    return acc;
  }, {});

  return userIds
    .map((id) => {
      const breakdown = byUser[id.toString()] || {};
      const total = Object.values(breakdown).reduce((sum, n) => sum + n, 0);
      const completed = breakdown[TASK_STATUS.COMPLETED] || 0;
      const pending = total - completed;
      const user = userMap[id.toString()];
      if (!user) return null;
      return {
        userId: id.toString(),
        name: user.name,
        avatarColor: user.avatarColor,
        completed,
        pending,
        total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.total - a.total);
};

module.exports = {
  getUserProductivity,
  getTeamProductivity,
  getKpiSnapshot,
  getStatusDistribution,
  getProductivityByUsersWithNames,
};
