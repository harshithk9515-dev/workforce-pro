const express = require('express');
const router = express.Router();

const {
  getMyDashboard,
  getAdminDashboard,
  getManagerDashboard,
  getEmployeeDashboard,
} = require('../controllers/dashboardController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getMyDashboard);
router.get('/admin', authorize(ROLES.ADMIN), getAdminDashboard);
router.get('/manager', authorize(ROLES.MANAGER, ROLES.ADMIN), getManagerDashboard);
router.get('/employee', getEmployeeDashboard);

module.exports = router;
