const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Employee = require('../models/Employee');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');

// @desc    List all users (lightweight - for assignee/manager pickers etc.)
// @route   GET /api/users
// @access  Private/Admin,Manager
const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).sort({ name: 1 });
  sendResponse(res, 200, { users: users.map((u) => u.toSafeObject()), count: users.length });
});

// @desc    Create a user account directly (admin-only; e.g. for managers/admins)
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role });
  sendResponse(res, 201, { user: user.toSafeObject() }, 'User created');
});

// @desc    Update a user's role / active status
// @route   PATCH /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const { name, role, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (String(user._id) === String(req.user._id) && isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();
  sendResponse(res, 200, { user: user.toSafeObject() }, 'User updated');
});

// @desc    Delete a user account (and linked employee record, if any)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  await Employee.deleteOne({ user: user._id });
  await user.deleteOne();

  sendResponse(res, 200, null, 'User deleted');
});

module.exports = { getUsers, createUser, updateUser, deleteUser };
