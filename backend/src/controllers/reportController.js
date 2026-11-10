const asyncHandler = require('express-async-handler');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ReportLog = require('../models/Report');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');
const { streamPdfTable, streamCsv } = require('../services/reportService');
const { getUserProductivity } = require('../services/productivityService');
const { REPORT_TYPE, REPORT_FORMAT } = require('../config/constants');

const employeeColumns = [
  { key: 'employeeId', label: 'Employee ID', width: 90 },
  { key: 'name', label: 'Name', width: 140 },
  { key: 'department', label: 'Department', width: 120 },
  { key: 'designation', label: 'Designation', width: 140 },
  { key: 'status', label: 'Status', width: 80 },
  { key: 'joinedOn', label: 'Joined On', width: 100 },
];

const projectColumns = [
  { key: 'name', label: 'Project', width: 160 },
  { key: 'manager', label: 'Manager', width: 120 },
  { key: 'status', label: 'Status', width: 90 },
  { key: 'priority', label: 'Priority', width: 80 },
  { key: 'progress', label: 'Progress %', width: 80 },
  { key: 'teamSize', label: 'Team Size', width: 80 },
  { key: 'endDate', label: 'Due', width: 100 },
];

const productivityColumns = [
  { key: 'name', label: 'Name', width: 150 },
  { key: 'department', label: 'Department', width: 120 },
  { key: 'total', label: 'Total Tasks', width: 80 },
  { key: 'completed', label: 'Completed', width: 80 },
  { key: 'overdue', label: 'Overdue', width: 80 },
  { key: 'completionRate', label: 'Completion %', width: 90 },
];

const buildEmployeeRows = async () => {
  const employees = await Employee.find()
    .populate('user', 'name')
    .sort({ employeeId: 1 });

  return employees.map((e) => ({
    employeeId: e.employeeId,
    name: e.user?.name || 'Unknown',
    department: e.department,
    designation: e.designation,
    status: e.status,
    joinedOn: e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString() : '-',
  }));
};

const buildProjectRows = async () => {
  const projects = await Project.find().populate('manager', 'name').populate('teamMembers', 'name');
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
    if (t._id.status === 'completed') progressMap[key].completed += t.count;
  });

  return projects.map((p) => {
    const stats = progressMap[p._id.toString()];
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    return {
      name: p.name,
      manager: p.manager?.name || '-',
      status: p.status,
      priority: p.priority,
      progress,
      teamSize: p.teamMembers.length,
      endDate: new Date(p.endDate).toLocaleDateString(),
    };
  });
};

const buildProductivityRows = async () => {
  const employees = await Employee.find().populate('user', 'name');
  const rows = [];
  for (const e of employees) {
    if (!e.user) continue;
    // eslint-disable-next-line no-await-in-loop
    const productivity = await getUserProductivity(e.user._id);
    rows.push({
      name: e.user.name,
      department: e.department,
      total: productivity.total,
      completed: productivity.completed,
      overdue: productivity.overdue,
      completionRate: `${productivity.completionRate}%`,
    });
  }
  return rows;
};

const REPORT_BUILDERS = {
  [REPORT_TYPE.EMPLOYEE]: { rows: buildEmployeeRows, columns: employeeColumns, title: 'Employee Report' },
  [REPORT_TYPE.PROJECT]: { rows: buildProjectRows, columns: projectColumns, title: 'Project Report' },
  [REPORT_TYPE.PRODUCTIVITY]: {
    rows: buildProductivityRows,
    columns: productivityColumns,
    title: 'Productivity Report',
  },
};

// @desc    Generate and stream a report (PDF or CSV)
// @route   GET /api/reports/:type?format=pdf|csv
// @access  Private/Admin,Manager
const generateReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const format = (req.query.format || REPORT_FORMAT.PDF).toLowerCase();

  const builder = REPORT_BUILDERS[type];
  if (!builder) throw new ApiError(400, `Unknown report type '${type}'`);
  if (!Object.values(REPORT_FORMAT).includes(format)) {
    throw new ApiError(400, `Unknown report format '${format}'`);
  }

  const rows = await builder.rows();

  await ReportLog.create({
    generatedBy: req.user._id,
    type,
    format,
    filters: req.query,
    recordCount: rows.length,
  });

  const filename = `${type}-report-${Date.now()}.${format}`;

  if (format === REPORT_FORMAT.PDF) {
    return streamPdfTable(res, {
      title: builder.title,
      subtitle: `Generated ${new Date().toLocaleString()} • ${rows.length} records`,
      columns: builder.columns,
      rows,
      filename,
    });
  }

  return streamCsv(res, { columns: builder.columns, rows, filename });
});

// @desc    List report generation history
// @route   GET /api/reports/history
// @access  Private/Admin,Manager
const getReportHistory = asyncHandler(async (req, res) => {
  const filter = {};
  // Managers only see their own generation history; admins see everyone's
  if (req.user.role !== 'admin') filter.generatedBy = req.user._id;

  const reports = await ReportLog.find(filter)
    .populate('generatedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

  sendResponse(res, 200, { reports });
});

module.exports = { generateReport, getReportHistory };
