const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
  logout,
} = require('../controllers/authController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updatePasswordValidator,
} = require('../validators/authValidator');

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/me/password', protect, updatePasswordValidator, validate, updatePassword);

module.exports = router;
