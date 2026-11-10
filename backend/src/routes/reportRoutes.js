const express = require('express');
const router = express.Router();

const { generateReport, getReportHistory } = require('../controllers/reportController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const { ROLES } = require('../config/constants');

router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.MANAGER));

router.get('/history', getReportHistory);
router.get('/:type', generateReport);

module.exports = router;
