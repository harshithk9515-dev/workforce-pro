const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendResponse = require('../utils/sendResponse');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

// @desc    Register a new user (public self-registration is always 'employee')
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role: ROLES.EMPLOYEE });
  const token = generateToken(user._id, user.role);

  sendResponse(res, 201, { user: user.toSafeObject(), token }, 'Account created successfully');
});

// @desc    Authenticate a user and return a token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated. Contact an administrator.');
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  sendResponse(res, 200, { user: user.toSafeObject(), token }, 'Logged in successfully');
});

// @desc    Get the currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, { user: req.user.toSafeObject() }, 'Profile fetched');
});

// @desc    Update the current user's own profile (name only - role/email are admin-managed)
// @route   PATCH /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (name) req.user.name = name;
  await req.user.save();
  sendResponse(res, 200, { user: req.user.toSafeObject() }, 'Profile updated');
});

// @desc    Change the current user's password
// @route   PATCH /api/auth/me/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendResponse(res, 200, null, 'Password updated successfully');
});

// @desc    Logout - stateless JWT, client discards the token. Endpoint kept for parity / cookie clearing.
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  sendResponse(res, 200, null, 'Logged out successfully');
});

module.exports = { register, login, getMe, updateMe, updatePassword, logout };
