const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');
const { notifyTaskAssigned, notifyTaskCompleted } = require('../services/notificationService');
const { ROLES, TASK_STATUS } = require('../config/constants');

const populateTask = (query) =>
  query
    .populate('project', 'name status')
    .populate('assignedTo', 'name email avatarColor')
    .populate('assignedBy', 'name email avatarColor');

// @desc    Create a task under a project
// @route   POST /api/tasks
// @access  Private/Admin,Manager
const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignedTo, priority, status, dueDate, estimatedHours } =
    req.body;

  const projectDoc = await Project.findById(project);
  if (!projectDoc) throw new ApiError(404, 'Project not found');

  if (req.user.role === ROLES.MANAGER && String(projectDoc.manager) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only create tasks for projects you manage');
  }

  const task = await Task.create({
    title,
    description,
    project,
    assignedTo,
    assignedBy: req.user._id,
    priority,
    status,
    dueDate,
    estimatedHours,
  });

  await notifyTaskAssigned(task);

  const populated = await populateTask(Task.findById(task._id));
  sendResponse(res, 201, { task: populated }, 'Task created and assigned');
});

// @desc    List tasks, scoped by role, with filters
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignedTo, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (req.user.role === ROLES.EMPLOYEE) filter.assignedTo = req.user._id;
  if (req.user.role === ROLES.MANAGER) {
    const managedProjectIds = await Project.find({ manager: req.user._id }).distinct('_id');
    filter.project = { $in: managedProjectIds };
  }

  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [tasks, total] = await Promise.all([
    populateTask(Task.find(filter))
      .sort({ dueDate: 1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Task.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    tasks,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get a single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.params.id));
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === ROLES.EMPLOYEE && String(task.assignedTo._id) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only view tasks assigned to you');
  }

  sendResponse(res, 200, { task });
});

// @desc    Update a task (full edit - manager/admin)
// @route   PATCH /api/tasks/:id
// @access  Private/Admin,Manager
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === ROLES.MANAGER && String(task.project.manager) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only update tasks on projects you manage');
  }

  const editableFields = [
    'title',
    'description',
    'assignedTo',
    'priority',
    'status',
    'dueDate',
    'estimatedHours',
    'actualHours',
  ];
  const wasCompleted = task.status === TASK_STATUS.COMPLETED;
  const previousAssignee = String(task.assignedTo);

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });
  await task.save();

  if (req.body.assignedTo && req.body.assignedTo !== previousAssignee) {
    await notifyTaskAssigned(task);
  }
  if (!wasCompleted && task.status === TASK_STATUS.COMPLETED) {
    await notifyTaskCompleted(task);
  }

  const populated = await populateTask(Task.findById(task._id));
  sendResponse(res, 200, { task: populated }, 'Task updated');
});

// @desc    Update only the status of a task (employee self-service)
// @route   PATCH /api/tasks/:id/status
// @access  Private (assignee, or admin/manager)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, actualHours } = req.body;
  if (!Object.values(TASK_STATUS).includes(status)) {
    throw new ApiError(422, 'Invalid status value');
  }

  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new ApiError(404, 'Task not found');

  const isOwner = String(task.assignedTo) === String(req.user._id);
  const isAdmin = req.user.role === ROLES.ADMIN;
  const isOwningManager =
    req.user.role === ROLES.MANAGER && String(task.project.manager) === String(req.user._id);
  if (!isOwner && !isAdmin && !isOwningManager) {
    throw new ApiError(403, 'You can only update tasks assigned to you, or on projects you manage');
  }

  const wasCompleted = task.status === TASK_STATUS.COMPLETED;
  task.status = status;
  if (actualHours !== undefined) task.actualHours = actualHours;
  await task.save();

  if (!wasCompleted && status === TASK_STATUS.COMPLETED) {
    await notifyTaskCompleted(task);
  }

  const populated = await populateTask(Task.findById(task._id));
  sendResponse(res, 200, { task: populated }, 'Task status updated');
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin,Manager
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project');
  if (!task) throw new ApiError(404, 'Task not found');

  if (req.user.role === ROLES.MANAGER && String(task.project.manager) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only delete tasks on projects you manage');
  }

  await task.deleteOne();
  sendResponse(res, 200, null, 'Task deleted');
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
