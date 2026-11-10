require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { ROLES, PROJECT_STATUS, TASK_STATUS, PRIORITY, NOTIFICATION_TYPE } = require('../config/constants');

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'QA', 'Marketing'];
const DESIGNATIONS = {
  Engineering: 'Software Engineer',
  Product: 'Product Analyst',
  Design: 'UI/UX Designer',
  QA: 'QA Engineer',
  Marketing: 'Marketing Specialist',
};

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const destroy = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany(),
    Employee.deleteMany(),
    Project.deleteMany(),
    Task.deleteMany(),
    Notification.deleteMany(),
    Report.deleteMany(),
  ]);
  console.log('[seed] All collections cleared');
  await mongoose.connection.close();
  process.exit(0);
};

const run = async () => {
  await connectDB();

  console.log('[seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany(),
    Employee.deleteMany(),
    Project.deleteMany(),
    Task.deleteMany(),
    Notification.deleteMany(),
    Report.deleteMany(),
  ]);

  console.log('[seed] Creating admin...');
  const admin = await User.create({
    name: 'Asha Rao',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@workforcepro.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: ROLES.ADMIN,
  });

  console.log('[seed] Creating managers...');
  const managerSeeds = [
    { name: 'Vikram Shah', email: 'vikram.manager@workforcepro.com' },
    { name: 'Priya Nair', email: 'priya.manager@workforcepro.com' },
  ];
  const managers = await User.create(
    managerSeeds.map((m) => ({ ...m, password: 'Manager@123', role: ROLES.MANAGER }))
  );

  console.log('[seed] Creating employees...');
  const employeeSeeds = [
    { name: 'Karan Mehta', dept: 'Engineering' },
    { name: 'Sneha Iyer', dept: 'Engineering' },
    { name: 'Rohan Das', dept: 'Engineering' },
    { name: 'Anjali Verma', dept: 'Product' },
    { name: 'Arjun Kumar', dept: 'Design' },
    { name: 'Divya Pillai', dept: 'QA' },
    { name: 'Manoj Reddy', dept: 'QA' },
    { name: 'Neha Joshi', dept: 'Marketing' },
  ];

  const employees = [];
  for (let i = 0; i < employeeSeeds.length; i += 1) {
    const seedData = employeeSeeds[i];
    const slug = seedData.name.toLowerCase().replace(/\s+/g, '.');
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({
      name: seedData.name,
      email: `${slug}@workforcepro.com`,
      password: 'Employee@123',
      role: ROLES.EMPLOYEE,
    });
    // eslint-disable-next-line no-await-in-loop
    const employeeId = await Employee.generateEmployeeId();
    // eslint-disable-next-line no-await-in-loop
    const employee = await Employee.create({
      user: user._id,
      employeeId,
      department: seedData.dept,
      designation: DESIGNATIONS[seedData.dept],
      phone: `+91-90000${String(10000 + i).slice(-5)}`,
      dateOfJoining: daysFromNow(-(180 + i * 17)),
      manager: managers[i % managers.length]._id,
      skills:
        seedData.dept === 'Engineering'
          ? ['Node.js', 'React', 'MongoDB']
          : seedData.dept === 'Design'
          ? ['Figma', 'UI Design']
          : seedData.dept === 'QA'
          ? ['Test Automation', 'Cypress']
          : ['Analytics'],
      status: 'active',
    });
    employees.push({ user, employee });
  }

  console.log('[seed] Creating projects...');
  const projectDefs = [
    {
      name: 'Customer Portal Revamp',
      description: 'Redesign and rebuild the self-service customer portal on a modern stack.',
      manager: managers[0]._id,
      team: [employees[0].user._id, employees[1].user._id, employees[4].user._id],
      status: PROJECT_STATUS.IN_PROGRESS,
      priority: PRIORITY.HIGH,
      startDate: daysFromNow(-40),
      endDate: daysFromNow(30),
      budget: 45000,
    },
    {
      name: 'Mobile Analytics SDK',
      description: 'Build an analytics SDK for iOS and Android client apps.',
      manager: managers[0]._id,
      team: [employees[2].user._id, employees[5].user._id],
      status: PROJECT_STATUS.PLANNING,
      priority: PRIORITY.MEDIUM,
      startDate: daysFromNow(5),
      endDate: daysFromNow(75),
      budget: 30000,
    },
    {
      name: 'Q3 Marketing Campaign',
      description: 'Plan and execute the Q3 multichannel marketing push.',
      manager: managers[1]._id,
      team: [employees[7].user._id, employees[3].user._id],
      status: PROJECT_STATUS.IN_PROGRESS,
      priority: PRIORITY.MEDIUM,
      startDate: daysFromNow(-15),
      endDate: daysFromNow(20),
      budget: 18000,
    },
    {
      name: 'Internal QA Automation Framework',
      description: 'Establish an end-to-end automated testing framework across products.',
      manager: managers[1]._id,
      team: [employees[5].user._id, employees[6].user._id],
      status: PROJECT_STATUS.COMPLETED,
      priority: PRIORITY.LOW,
      startDate: daysFromNow(-90),
      endDate: daysFromNow(-10),
      budget: 12000,
    },
  ];
  const projects = await Project.create(projectDefs.map((p) => ({ ...p, teamMembers: p.team })));

  console.log('[seed] Creating tasks...');
  const taskTitles = [
    'Set up project repository and CI pipeline',
    'Design database schema',
    'Build authentication module',
    'Implement core API endpoints',
    'Build responsive dashboard UI',
    'Write integration tests',
    'Conduct security review',
    'Prepare release notes',
    'Fix reported bugs from QA',
    'Stakeholder demo & feedback session',
  ];
  const statuses = [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.REVIEW, TASK_STATUS.COMPLETED];
  const priorities = Object.values(PRIORITY);

  const tasksToCreate = [];
  projects.forEach((project, pIdx) => {
    const team = project.teamMembers.length ? project.teamMembers : [employees[0].user._id];
    for (let i = 0; i < 6; i += 1) {
      const status =
        project.status === PROJECT_STATUS.COMPLETED
          ? TASK_STATUS.COMPLETED
          : statuses[(i + pIdx) % statuses.length];
      tasksToCreate.push({
        title: taskTitles[(i + pIdx * 2) % taskTitles.length],
        description: 'Auto-generated seed task for demonstration purposes.',
        project: project._id,
        assignedTo: team[i % team.length],
        assignedBy: project.manager,
        priority: priorities[(i + pIdx) % priorities.length],
        status,
        dueDate: daysFromNow(i % 2 === 0 ? 5 + i : -2 - i),
        estimatedHours: 8 + i,
        actualHours: status === TASK_STATUS.COMPLETED ? 8 + i : Math.max(0, i - 1),
      });
    }
  });
  const tasks = await Task.create(tasksToCreate);

  console.log('[seed] Creating notifications...');
  const notifications = tasks.slice(0, 12).map((t) => ({
    recipient: t.assignedTo,
    type: t.status === TASK_STATUS.COMPLETED ? NOTIFICATION_TYPE.TASK_COMPLETED : NOTIFICATION_TYPE.TASK_ASSIGNED,
    title: t.status === TASK_STATUS.COMPLETED ? 'Task completed' : 'New task assigned',
    message:
      t.status === TASK_STATUS.COMPLETED
        ? `"${t.title}" was marked complete.`
        : `You were assigned "${t.title}".`,
    relatedTask: t._id,
    relatedProject: t.project,
    isRead: Math.random() > 0.5,
  }));
  await Notification.create(notifications);

  console.log('[seed] Done!\n');
  console.log('--------------------------------------------------');
  console.log(' Seeded login credentials');
  console.log('--------------------------------------------------');
  console.log(` Admin:    ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@12345'}`);
  console.log(` Manager:  ${managers[0].email} / Manager@123`);
  console.log(` Manager:  ${managers[1].email} / Manager@123`);
  console.log(` Employee: ${employees[0].user.email} / Employee@123`);
  console.log('--------------------------------------------------\n');

  await mongoose.connection.close();
  process.exit(0);
};

if (process.argv.includes('--destroy')) {
  destroy().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
} else {
  run().catch((err) => {
    console.error('[seed] Failed:', err);
    process.exit(1);
  });
}
