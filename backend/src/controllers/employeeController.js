const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

// @desc    Create an employee (creates the linked User login account too)
// @route   POST /api/employees
// @access  Private/Admin
const createEmployee = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    department,
    designation,
    phone,
    dateOfJoining,
    manager,
    skills,
  } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const session = await mongoose.startSession();
  let employee;
  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [{ name, email, password, role: ROLES.EMPLOYEE }],
        { session }
      );

      const employeeId = await Employee.generateEmployeeId();

      const [createdEmployee] = await Employee.create(
        [
          {
            user: user._id,
            employeeId,
            department,
            designation,
            phone,
            dateOfJoining,
            manager: manager || null,
            skills: skills || [],
          },
        ],
        { session }
      );

      employee = await Employee.findById(createdEmployee._id)
        .populate('user', 'name email role isActive avatarColor')
        .populate('manager', 'name email')
        .session(session);
    });
  } finally {
    session.endSession();
  }

  sendResponse(res, 201, { employee }, 'Employee created');
});

// @desc    List employees with optional search/filter/pagination
// @route   GET /api/employees
// @access  Private/Admin,Manager
const getEmployees = asyncHandler(async (req, res) => {
  const { search, department, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (department) filter.department = department;
  if (status) filter.status = status;

  let query = Employee.find(filter)
    .populate('user', 'name email role isActive avatarColor lastLogin')
    .populate('manager', 'name email')
    .sort({ createdAt: -1 });

  if (search) {
    const userIds = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).distinct('_id');

    query = Employee.find({
      ...filter,
      $or: [{ user: { $in: userIds } }, { employeeId: { $regex: search, $options: 'i' } }],
    })
      .populate('user', 'name email role isActive avatarColor lastLogin')
      .populate('manager', 'name email')
      .sort({ createdAt: -1 });
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const [employees, total] = await Promise.all([
    query
      .clone()
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    query.clone().countDocuments(),
  ]);

  sendResponse(res, 200, {
    employees,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// @desc    Get a single employee by id
// @route   GET /api/employees/:id
// @access  Private/Admin,Manager
const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id)
    .populate('user', 'name email role isActive avatarColor lastLogin')
    .populate('manager', 'name email');

  if (!employee) throw new ApiError(404, 'Employee not found');
  sendResponse(res, 200, { employee });
});

// @desc    Update an employee's HR profile
// @route   PATCH /api/employees/:id
// @access  Private/Admin
const updateEmployee = asyncHandler(async (req, res) => {
  const { department, designation, phone, manager, skills, status, name } = req.body;

  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  if (department !== undefined) employee.department = department;
  if (designation !== undefined) employee.designation = designation;
  if (phone !== undefined) employee.phone = phone;
  if (manager !== undefined) employee.manager = manager || null;
  if (skills !== undefined) employee.skills = skills;
  if (status !== undefined) employee.status = status;
  await employee.save();

  if (name !== undefined) {
    await User.findByIdAndUpdate(employee.user, { name });
  }

  const updated = await Employee.findById(employee._id)
    .populate('user', 'name email role isActive avatarColor')
    .populate('manager', 'name email');

  sendResponse(res, 200, { employee: updated }, 'Employee updated');
});

// @desc    Delete an employee (and the linked login account)
// @route   DELETE /api/employees/:id
// @access  Private/Admin
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findById(req.params.id);
  if (!employee) throw new ApiError(404, 'Employee not found');

  await User.findByIdAndDelete(employee.user);
  await employee.deleteOne();

  sendResponse(res, 200, null, 'Employee deleted');
});

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};
