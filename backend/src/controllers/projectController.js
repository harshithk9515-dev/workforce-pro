const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');
const { notifyProjectUpdate } = require('../services/notificationService');
const { ROLES, TASK_STATUS } = require('../config/constants');

const populateProject = (query) =>
  query.populate('manager', 'name email avatarColor').populate('teamMembers', 'name email avatarColor');

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin,Manager
const createProject = asyncHandler(async (req, res) => {
  const { name, description, manager, teamMembers, status, priority, startDate, endDate, budget } =
    req.body;

  // Managers can only create projects they themselves manage
  const managerId = req.user.role === ROLES.MANAGER ? req.user._id : manager;
  if (!managerId) throw new ApiError(400, 'A manager is required');

  const project = await Project.create({
    name,
    description,
    manager: managerId,
    teamMembers: teamMembers || [],
    status,
    priority,
    startDate,
    endDate,
    budget,
  });

  const populated = await populateProject(Project.findById(project._id));
  sendResponse(res, 201, { project: populated }, 'Project created');
});

// @desc    List projects (admins see all, managers see their own, employees see assigned)
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { search, status, priority, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (req.user.role === ROLES.MANAGER) filter.manager = req.user._id;
  if (req.user.role === ROLES.EMPLOYEE) filter.teamMembers = req.user._id;

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [projects, total] = await Promise.all([
    populateProject(Project.find(filter))
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Project.countDocuments(filter),
  ]);

  // Attach a lightweight progress percentage per project
  const projectIds = projects.map((p) => p._id);
  const taskCounts = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: { project: '$project', status: '$status' }, count: { $sum: 1 } } },
  ]);

  const progressMap = {};
  projectIds.forEach((id) => {
    progressMap[id.toString()] = { total: 0, completed: 0 };
  });
  taskCounts.forEach((t) => {
    const key = t._id.project.toString();
    progressMap[key].total += t.count;
    if (t._id.status === TASK_STATUS.COMPLETED) progressMap[key].completed += t.count;
  });

  const withProgress = projects.map((p) => {
    const stats = progressMap[p._id.toString()];
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    return { ...p.toObject(), progress, taskCount: stats.total };
  });

  sendResponse(res, 200, {
    projects: withProgress,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get a single project with progress detail
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await populateProject(Project.findById(req.params.id));
  if (!project) throw new ApiError(404, 'Project not found');

  const statusCounts = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const breakdown = Object.values(TASK_STATUS).reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {});
  statusCounts.forEach((c) => {
    breakdown[c._id] = c.count;
  });
  const total = Object.values(breakdown).reduce((s, n) => s + n, 0);
  const progress = total > 0 ? Math.round((breakdown[TASK_STATUS.COMPLETED] / total) * 100) : 0;

  sendResponse(res, 200, { project, taskBreakdown: breakdown, progress });
});

// @desc    Update a project (status, team, dates, etc.)
// @route   PATCH /api/projects/:id
// @access  Private/Admin,Manager(own)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (req.user.role === ROLES.MANAGER && String(project.manager) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only update projects you manage');
  }

  const editableFields = [
    'name',
    'description',
    'manager',
    'teamMembers',
    'status',
    'priority',
    'startDate',
    'endDate',
    'budget',
  ];
  const previousStatus = project.status;
  const previousTeam = project.teamMembers.map(String);

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });
  await project.save();

  const populated = await populateProject(Project.findById(project._id));

  if (req.body.status && req.body.status !== previousStatus) {
    await notifyProjectUpdate(
      [...previousTeam, String(project.manager)],
      project,
      `Status changed to "${req.body.status}".`
    );
  }

  sendResponse(res, 200, { project: populated }, 'Project updated');
});

// @desc    Delete a project (and its tasks)
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  sendResponse(res, 200, null, 'Project and its tasks deleted');
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
