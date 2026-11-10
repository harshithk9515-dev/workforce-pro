const express = require('express');
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createTaskValidator, updateTaskValidator } = require('../validators/taskValidator');
const { ROLES } = require('../config/constants');

router.use(protect);

router.get('/', getTasks);
router.post('/', authorize(ROLES.ADMIN, ROLES.MANAGER), createTaskValidator, validate, createTask);
router.get('/:id', getTaskById);
router.patch('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), updateTaskValidator, validate, updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), deleteTask);

module.exports = router;
