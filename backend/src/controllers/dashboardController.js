const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const sendResponse = require('../utils/sendResponse');
const {
  getKpiSnapshot,
  getStatusDistribution,
  getUserProductivity,
  getProductivityByUsersWithNames,
} = require('../services/productivityService');
const { ROLES } = require('../config/constants');

// @desc    Admin dashboard - org-wide KPIs, distributions, top performers
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [kpis, statusDistribution, recentProjects, departmentCounts, employeeUserIds] = await Promise.all([
    getKpiSnapshot(),
    getStatusDistribution(),
    Project.find().sort({ createdAt: -1 }).limit(5).populate('manager', 'name'),
    Employee.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]),
    Employee.find().distinct('user'),
  ]);

  const productivityByUser = await getProductivityByUsersWithNames(employeeUserIds);

  sendResponse(res, 200, {
    kpis,
    statusDistribution,
    recentProjects,
    departmentCounts: departmentCounts.map((d) => ({ department: d._id, count: d.count })),
    productivityByUser: productivityByUser.slice(0, 8),
  });
});

// @desc    Manager dashboard - scoped to projects they manage
// @route   GET /api/dashboard/manager
// @access  Private/Manager
const getManagerDashboard = asyncHandler(async (req, res) => {
  const managedProjects = await Project.find({ manager: req.user._id }).populate(
    'teamMembers',
    'name email avatarColor'
  );
  const projectIds = managedProjects.map((p) => p._id);

  const teamMemberIds = [
    ...new Set(managedProjects.flatMap((p) => p.teamMembers.map((m) => String(m._id)))),
  ];

  const [kpis, statusDistribution, productivityByUser] = await Promise.all([
    getKpiSnapshot({
      projectFilter: { manager: req.user._id },
      taskFilter: { project: { $in: projectIds } },
    }),
    getStatusDistribution({ project: { $in: projectIds } }),
    getProductivityByUsersWithNames(teamMemberIds),
  ]);

  sendResponse(res, 200, {
    kpis,
    statusDistribution,
    productivityByUser,
    projects: managedProjects,
  });
});

// @desc    Employee dashboard - personal productivity snapshot
// @route   GET /api/dashboard/employee
// @access  Private/Employee
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const [productivity, upcomingTasks] = await Promise.all([
    getUserProductivity(req.user._id),
    Task.find({
      assignedTo: req.user._id,
      status: { $ne: 'completed' },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate('project', 'name'),
  ]);

  sendResponse(res, 200, { productivity, upcomingTasks });
});

// @desc    Single entry point that returns the right dashboard for req.user.role
// @route   GET /api/dashboard
// @access  Private
const getMyDashboard = asyncHandler(async (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) return getAdminDashboard(req, res, next);
  if (req.user.role === ROLES.MANAGER) return getManagerDashboard(req, res, next);
  return getEmployeeDashboard(req, res, next);
});

module.exports = {
  getAdminDashboard,
  getManagerDashboard,
  getEmployeeDashboard,
  getMyDashboard,
};
