const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/projects', require('./projectRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/notifications', require('./notificationRoutes'));

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'WorkForce Pro API is healthy', timestamp: new Date() });
});

module.exports = router;
